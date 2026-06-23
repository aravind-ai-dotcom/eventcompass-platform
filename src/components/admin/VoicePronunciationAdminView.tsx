"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { TXC_EVENT_ID } from "@/lib/compassEventPaths";
import { FORGE_EVENT, FORGE_PRODUCT } from "@/config/forgeBrand";
import {
  createVoiceDictionaryRecord,
  getCachedVoiceDictionaryRecords,
  invalidateVoiceDictionaryCache,
  isPendingVoiceDictionaryRecord,
  loadVoiceDictionaryRecords,
  saveVoiceDictionaryRecord,
  seedVoiceDictionaryIfEmpty,
} from "@/services/voice/voiceDictionaryService";
import { applyPronunciationFromCache } from "@/services/voice/sttNormalizationService";
import type { VoiceDictionaryRecord } from "@/types/compassGovernance";

const S = {
  panel: "#1f1f1f",
  text: "#f4f4f4",
  soft: "#e0e0e0",
  muted: "#a8a8a8",
  dim: "#6f6f6f",
  line: "#393939",
  accent: "#78a9ff",
};

const IBM = { blue: "#0f62fe", green: "#24a148", red: "#da1e28" };

const fieldLabel: CSSProperties = {
  color: S.muted,
  fontSize: "0.72rem",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  display: "block",
  marginBottom: "5px",
};

const field: CSSProperties = {
  width: "100%",
  height: "36px",
  padding: "0 12px",
  background: "transparent",
  border: `1px solid ${S.line}`,
  color: S.text,
  fontSize: "0.88rem",
  fontFamily: "inherit",
  boxSizing: "border-box",
};

function SectionHead({ title, sub }: { title: string; sub?: string }) {
  return (
    <div style={{ marginBottom: "24px" }}>
      <p style={{
        color: S.accent, fontSize: "0.68rem", fontWeight: 700,
        textTransform: "uppercase", letterSpacing: "0.12em", margin: "0 0 6px",
      }}>
        Experience
      </p>
      <h2 style={{
        color: S.text, fontSize: "1.65rem", fontWeight: 520,
        letterSpacing: "-0.035em", margin: "0 0 6px",
      }}>
        {title}
      </h2>
      {sub && (
        <p style={{ color: S.muted, fontSize: "0.88rem", margin: 0, lineHeight: 1.5 }}>{sub}</p>
      )}
    </div>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: S.panel, border: `1px solid ${S.line}`, padding: "20px" }}>
      {children}
    </div>
  );
}

function isTxcRecord(r: VoiceDictionaryRecord): boolean {
  return r.experience === "techxchange";
}

export function VoicePronunciationAdminView() {
  const [records, setRecords] = useState<VoiceDictionaryRecord[]>([]);
  const [selected, setSelected] = useState<VoiceDictionaryRecord | null>(null);
  const [preview, setPreview] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      invalidateVoiceDictionaryCache(TXC_EVENT_ID);
      const all = await loadVoiceDictionaryRecords(TXC_EVENT_ID);
      setRecords(all.filter(isTxcRecord));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load pronunciation dictionary.");
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const txcRecords = useMemo(() => records.filter(isTxcRecord), [records]);

  async function handleSave(record: VoiceDictionaryRecord) {
    setSaving(true);
    setError("");
    setMessage("");
    try {
      if (isPendingVoiceDictionaryRecord(record)) {
        const created = await createVoiceDictionaryRecord(TXC_EVENT_ID, {
          displayText: record.displayText,
          spokenText: record.spokenText,
          notes: record.notes,
          active: record.active,
        });
        setMessage(`Added "${created.displayText}"`);
        await refresh();
        setSelected(created);
        return;
      }

      const payload: VoiceDictionaryRecord = {
        ...record,
        displayText: record.displayText.trim(),
        spokenText: record.spokenText.trim(),
        experience: "techxchange",
        language: record.language ?? "en-US",
        updatedAt: new Date().toISOString(),
      };
      if (!payload.displayText || !payload.spokenText) {
        throw new Error("Display text and spoken text are both required.");
      }
      await saveVoiceDictionaryRecord(TXC_EVENT_ID, payload);
      setMessage(`Saved "${payload.displayText}"`);
      await refresh();
      setSelected(
        getCachedVoiceDictionaryRecords(TXC_EVENT_ID).find(r => r.id === payload.id) ?? payload,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSeed() {
    setError("");
    try {
      const count = await seedVoiceDictionaryIfEmpty(TXC_EVENT_ID);
      setMessage(count ? `Seeded ${count} ${FORGE_EVENT.name} pronunciation entries.` : "Dictionary already populated.");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Seed failed.");
    }
  }

  function startAddWord() {
    const now = new Date().toISOString();
    setSelected({
      id: `new-${Date.now()}`,
      displayText: "",
      spokenText: "",
      experience: "techxchange",
      language: "en-US",
      active: true,
      createdAt: now,
      updatedAt: now,
    });
    setPreview("");
    setMessage("");
    setError("");
  }

  return (
    <div>
      <SectionHead
        title="Voice pronunciation"
        sub={`Map display text → spoken text for ${FORGE_PRODUCT.askCompassAi} TTS. Firestore: organizations/ibm/events/txc2026/voiceDictionary`}
      />

      <div style={{ display: "flex", gap: "10px", marginBottom: "16px", flexWrap: "wrap", alignItems: "center" }}>
        <button
          type="button"
          onClick={startAddWord}
          style={{
            padding: "7px 14px", background: IBM.blue, border: "none",
            color: "#fff", fontSize: "0.82rem", fontFamily: "inherit", cursor: "pointer",
            fontWeight: 650,
          }}
        >
          + Add word
        </button>
        <button
          type="button"
          onClick={() => void refresh()}
          style={{
            padding: "7px 14px", background: "transparent", border: `1px solid ${S.line}`,
            color: S.soft, fontSize: "0.82rem", fontFamily: "inherit", cursor: "pointer",
          }}
        >
          Refresh
        </button>
        <button
          type="button"
          onClick={() => void handleSeed()}
          style={{
            padding: "7px 14px", background: "transparent", border: `1px solid ${S.line}`,
            color: S.soft, fontSize: "0.82rem", fontFamily: "inherit", cursor: "pointer",
          }}
        >
          Seed if empty
        </button>
        {message && (
          <span style={{ color: IBM.green, fontSize: "0.82rem" }}>{message}</span>
        )}
        {error && (
          <span style={{ color: IBM.red, fontSize: "0.82rem" }}>{error}</span>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "16px", alignItems: "start" }}>
        <Panel>
          <p style={{
            color: S.muted, fontSize: "0.68rem", fontWeight: 700,
            textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 14px",
          }}>
            {FORGE_EVENT.name} dictionary ({txcRecords.length})
          </p>
          {loading ? (
            <p style={{ color: S.dim, fontSize: "0.84rem", margin: 0 }}>Loading…</p>
          ) : txcRecords.length === 0 ? (
            <p style={{ color: S.dim, fontSize: "0.84rem", margin: 0 }}>
              No entries yet. Use &ldquo;Seed if empty&rdquo; to load {FORGE_EVENT.name} defaults (event name, product terms, acronyms).
            </p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.84rem" }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${S.line}` }}>
                    {["Display", "Spoken", "Active"].map(h => (
                      <th key={h} style={{
                        textAlign: "left", padding: "8px 10px", color: S.muted,
                        fontWeight: 650, fontSize: "0.72rem", textTransform: "uppercase",
                        letterSpacing: "0.06em",
                      }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {txcRecords.map(r => (
                    <tr
                      key={r.id}
                      onClick={() => { setSelected(r); setPreview(""); }}
                      style={{
                        borderBottom: `1px solid ${S.line}`,
                        cursor: "pointer",
                        background: selected?.id === r.id ? "rgba(15,98,254,0.1)" : "transparent",
                      }}
                    >
                      <td style={{ padding: "10px", color: S.text }}>{r.displayText}</td>
                      <td style={{ padding: "10px", color: S.soft }}>{r.spokenText}</td>
                      <td style={{ padding: "10px", color: r.active ? IBM.green : S.dim }}>
                        {r.active ? "yes" : "no"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        <Panel>
          {selected ? (
            <VoiceEditor
              record={selected}
              saving={saving}
              isNew={isPendingVoiceDictionaryRecord(selected)}
              onSave={r => void handleSave(r)}
              onCancel={isPendingVoiceDictionaryRecord(selected) ? () => setSelected(null) : undefined}
              onPreview={text => setPreview(applyPronunciationFromCache(text, TXC_EVENT_ID))}
            />
          ) : (
            <p style={{ color: S.dim, fontSize: "0.84rem", margin: 0 }}>
              Select an entry to edit, or click <strong style={{ color: S.soft }}>+ Add word</strong> to add a new pronunciation.
            </p>
          )}
          {preview && (
            <pre style={{
              marginTop: "16px", padding: "12px", background: "#0f0f0f",
              border: `1px solid ${S.line}`, color: S.soft, fontSize: "0.82rem",
              whiteSpace: "pre-wrap", fontFamily: "inherit",
            }}>
              TTS preview: {preview}
            </pre>
          )}
        </Panel>
      </div>
    </div>
  );
}

function VoiceEditor({
  record,
  saving,
  isNew,
  onSave,
  onCancel,
  onPreview,
}: {
  record: VoiceDictionaryRecord;
  saving: boolean;
  isNew: boolean;
  onSave: (r: VoiceDictionaryRecord) => void;
  onCancel?: () => void;
  onPreview: (text: string) => void;
}) {
  const [draft, setDraft] = useState(record);
  useEffect(() => { setDraft(record); }, [record]);

  const canSave = draft.displayText.trim().length > 0 && draft.spokenText.trim().length > 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      <p style={{
        color: S.muted, fontSize: "0.68rem", fontWeight: 700,
        textTransform: "uppercase", letterSpacing: "0.1em", margin: 0,
      }}>
        {isNew ? "New entry" : "Edit entry"}
      </p>
      <label>
        <span style={fieldLabel}>Display text</span>
        <input
          style={field}
          value={draft.displayText}
          placeholder={`e.g. ${FORGE_EVENT.name}`}
          onChange={e => setDraft({ ...draft, displayText: e.target.value })}
        />
      </label>
      <label>
        <span style={fieldLabel}>Spoken text</span>
        <input
          style={field}
          value={draft.spokenText}
          placeholder="e.g. Tech Exchange"
          onChange={e => setDraft({ ...draft, spokenText: e.target.value })}
        />
      </label>
      <label>
        <span style={fieldLabel}>Notes</span>
        <input
          style={field}
          value={draft.notes ?? ""}
          onChange={e => setDraft({ ...draft, notes: e.target.value })}
        />
      </label>
      <label style={{ display: "flex", alignItems: "center", gap: "8px", color: S.soft, fontSize: "0.84rem" }}>
        <input
          type="checkbox"
          checked={draft.active}
          onChange={e => setDraft({ ...draft, active: e.target.checked })}
        />
        Active
      </label>
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        <button
          type="button"
          disabled={saving || !canSave}
          onClick={() => onSave(draft)}
          style={{
            padding: "8px 16px", background: saving || !canSave ? S.dim : IBM.blue, border: "none",
            color: "#fff", fontSize: "0.82rem", fontFamily: "inherit",
            cursor: saving || !canSave ? "default" : "pointer",
            fontWeight: 650,
          }}
        >
          {saving ? "Saving…" : isNew ? "Add to dictionary" : "Save"}
        </button>
        <button
          type="button"
          disabled={!draft.displayText.trim()}
          onClick={() => onPreview(draft.displayText)}
          style={{
            padding: "8px 16px", background: "transparent", border: `1px solid ${S.line}`,
            color: S.soft, fontSize: "0.82rem", fontFamily: "inherit",
            cursor: !draft.displayText.trim() ? "default" : "pointer",
            opacity: !draft.displayText.trim() ? 0.5 : 1,
          }}
        >
          Preview TTS
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: "8px 16px", background: "transparent", border: `1px solid ${S.line}`,
              color: S.soft, fontSize: "0.82rem", fontFamily: "inherit", cursor: "pointer",
            }}
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
