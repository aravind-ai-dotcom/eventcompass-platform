"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { TXC_EVENT_ID } from "@/lib/compassEventPaths";
import { invalidateGovernanceCache } from "@/services/governance/governanceLoader";
import {
  invalidateVoiceKnowledgeCache,
  loadVoiceKnowledgeRecords,
  saveVoiceKnowledgeRecord,
  seedVoiceKnowledgeIfEmpty,
} from "@/services/voice/voiceKnowledgeService";
import { testVoiceKnowledgeMatch } from "@/services/voice/voiceKnowledgeResolver";
import { classifyEventScope } from "@/lib/eventScopeClassifier";
import { classifyVoiceIntent } from "@/services/voiceIntentClassifier";
import {
  VOICE_KNOWLEDGE_CATEGORIES,
  type VoiceKnowledgeCategory,
  type VoiceKnowledgeRecord,
} from "@/types/voiceKnowledge";

const S = {
  bg: "#161616",
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

const textarea: CSSProperties = {
  width: "100%",
  minHeight: "88px",
  padding: "8px 12px",
  background: "transparent",
  border: `1px solid ${S.line}`,
  color: S.text,
  fontSize: "0.88rem",
  fontFamily: "inherit",
  resize: "vertical",
  boxSizing: "border-box",
};

type AdminTab = VoiceKnowledgeCategory | "Response Testing";

const ADMIN_TABS: AdminTab[] = [...VOICE_KNOWLEDGE_CATEGORIES, "Response Testing"];

function formatUpdatedAt(iso: string): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

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

export function VoiceIntelligenceAdminView() {
  const [records, setRecords] = useState<VoiceKnowledgeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<AdminTab>("Event Knowledge");
  const [selected, setSelected] = useState<VoiceKnowledgeRecord | null>(null);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [testInput, setTestInput] = useState("What is Community Day?");
  const [testResult, setTestResult] = useState<ReturnType<typeof testVoiceKnowledgeMatch> | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    invalidateVoiceKnowledgeCache(TXC_EVENT_ID);
    invalidateGovernanceCache("techxchange");
    const data = await loadVoiceKnowledgeRecords(TXC_EVENT_ID);
    setRecords(data);
    setLoading(false);
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const filtered = useMemo(() => {
    if (tab === "Response Testing") return [];
    return records.filter(r => r.category === tab);
  }, [records, tab]);

  async function handleSeed() {
    const count = await seedVoiceKnowledgeIfEmpty(TXC_EVENT_ID);
    setMessage(count ? `Seeded ${count} voice knowledge records.` : "Collection already populated.");
    await refresh();
  }

  async function handleSave(draft: VoiceKnowledgeRecord) {
    setSaving(true);
    try {
      await saveVoiceKnowledgeRecord(TXC_EVENT_ID, draft, "admin");
      setMessage(`Saved "${draft.title}"`);
      await refresh();
      setSelected(draft);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  function runTest() {
    setTestResult(testVoiceKnowledgeMatch(testInput, TXC_EVENT_ID));
  }

  const scopePreview = testInput.trim() ? classifyEventScope(testInput, TXC_EVENT_ID) : null;
  const intentPreview = testInput.trim() ? classifyVoiceIntent(testInput) : null;

  return (
    <div>
      <SectionHead
        title="Voice Intelligence"
        sub="Configure Voice Compass responses without code deployment. Firestore: organizations/ibm/events/txc2026/voice_knowledge"
      />

      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "16px" }}>
        {ADMIN_TABS.map(t => (
          <button
            key={t}
            type="button"
            onClick={() => { setTab(t); setSelected(null); }}
            style={{
              padding: "7px 14px",
              border: `1px solid ${tab === t ? IBM.blue : S.line}`,
              background: tab === t ? "rgba(15,98,254,0.12)" : "transparent",
              color: tab === t ? S.accent : S.soft,
              fontSize: "0.82rem",
              fontFamily: "inherit",
              cursor: "pointer",
              fontWeight: tab === t ? 650 : 500,
            }}
          >
            {t}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", gap: "10px", marginBottom: "16px", flexWrap: "wrap" }}>
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
          <span style={{ color: IBM.green, fontSize: "0.82rem", alignSelf: "center" }}>{message}</span>
        )}
      </div>

      {tab === "Response Testing" ? (
        <Panel>
          <p style={{ color: S.muted, fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 14px" }}>
            Test Voice Response
          </p>
          <label style={fieldLabel}>Question</label>
          <input
            style={{ ...field, marginBottom: "12px" }}
            value={testInput}
            onChange={e => setTestInput(e.target.value)}
            placeholder="What is Community Day?"
          />
          <button
            type="button"
            onClick={runTest}
            style={{
              padding: "8px 16px", background: IBM.blue, border: "none",
              color: "#fff", fontSize: "0.82rem", fontFamily: "inherit", cursor: "pointer", fontWeight: 600,
            }}
          >
            Test match
          </button>
          {testResult && (
            <div style={{ marginTop: "20px", fontSize: "0.88rem", color: S.soft, lineHeight: 1.6 }}>
              {scopePreview && (
                <p style={{ margin: "0 0 8px" }}>
                  <strong style={{ color: S.text }}>Event scope:</strong>{" "}
                  {scopePreview.scope} ({scopePreview.confidence} confidence · general {scopePreview.generalScore} · event {scopePreview.eventScore})
                </p>
              )}
              {intentPreview && (
                <p style={{ margin: "0 0 8px" }}>
                  <strong style={{ color: S.text }}>Voice intent:</strong>{" "}
                  {intentPreview.intent} ({intentPreview.confidence})
                </p>
              )}
              <p style={{ margin: "0 0 8px" }}>
                <strong style={{ color: S.text }}>Matched intent:</strong>{" "}
                {testResult.matchedIntent}
              </p>
              <p style={{ margin: "0 0 8px" }}>
                <strong style={{ color: S.text }}>Matched knowledge record:</strong>{" "}
                {testResult.match
                  ? `${testResult.match.record.title} (${testResult.match.record.id}) · phrase "${testResult.match.matchedPhrase}"`
                  : "None — would use fallback"}
              </p>
              <p style={{ margin: "0 0 4px", color: S.text, fontWeight: 600 }}>Response</p>
              <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{testResult.responsePreview}</p>
            </div>
          )}
        </Panel>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: "16px", alignItems: "start" }}>
          {tab === "Event Scope" && (
            <p style={{ gridColumn: "1 / -1", color: S.muted, fontSize: "0.84rem", margin: "0 0 4px", lineHeight: 1.55 }}>
              Tune event vs local routing. Use topic key <code style={{ color: S.accent }}>general_concierge</code> for food, transport, weather phrases;
              {" "}<code style={{ color: S.accent }}>event_related</code> for sessions, champions, certifications;
              {" "}<code style={{ color: S.accent }}>concierge_response</code> or <code style={{ color: S.accent }}>scope_clarify</code> for reply templates.
            </p>
          )}
          <Panel>
            {loading ? (
              <p style={{ color: S.muted, margin: 0 }}>Loading from Firestore…</p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.84rem" }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${S.line}`, textAlign: "left" }}>
                      <th style={{ padding: "8px 10px", color: S.muted, fontWeight: 600 }}>Category</th>
                      <th style={{ padding: "8px 10px", color: S.muted, fontWeight: 600 }}>Title</th>
                      <th style={{ padding: "8px 10px", color: S.muted, fontWeight: 600 }}>Enabled</th>
                      <th style={{ padding: "8px 10px", color: S.muted, fontWeight: 600 }}>Last Updated</th>
                      <th style={{ padding: "8px 10px", color: S.muted, fontWeight: 600 }}>Edit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(r => (
                      <tr
                        key={r.id}
                        style={{
                          borderBottom: `1px solid ${S.line}`,
                          background: selected?.id === r.id ? "rgba(15,98,254,0.08)" : "transparent",
                        }}
                      >
                        <td style={{ padding: "10px", color: S.soft }}>{r.category}</td>
                        <td style={{ padding: "10px", color: S.text }}>{r.title}</td>
                        <td style={{ padding: "10px", color: r.enabled ? IBM.green : S.dim }}>
                          {r.enabled ? "Yes" : "No"}
                        </td>
                        <td style={{ padding: "10px", color: S.muted }}>{formatUpdatedAt(r.updated_at)}</td>
                        <td style={{ padding: "10px" }}>
                          <button
                            type="button"
                            onClick={() => setSelected(r)}
                            style={{
                              padding: "4px 10px", background: "transparent",
                              border: `1px solid ${S.line}`, color: S.accent,
                              fontSize: "0.78rem", fontFamily: "inherit", cursor: "pointer",
                            }}
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filtered.length === 0 && (
                  <p style={{ color: S.muted, margin: "12px 0 0" }}>No records in this category.</p>
                )}
              </div>
            )}
          </Panel>

          <Panel>
            {selected ? (
              <VoiceKnowledgeEditor
                record={selected}
                saving={saving}
                onSave={draft => void handleSave(draft)}
              />
            ) : (
              <p style={{ color: S.muted, margin: 0 }}>Select a record to edit.</p>
            )}
          </Panel>
        </div>
      )}
    </div>
  );
}

function VoiceKnowledgeEditor({
  record,
  saving,
  onSave,
}: {
  record: VoiceKnowledgeRecord;
  saving: boolean;
  onSave: (r: VoiceKnowledgeRecord) => void;
}) {
  const [draft, setDraft] = useState(record);
  useEffect(() => { setDraft(record); }, [record]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      <p style={{ color: S.text, fontSize: "1rem", fontWeight: 600, margin: 0 }}>{draft.title}</p>

      <label>
        <span style={fieldLabel}>Question (title)</span>
        <input
          style={field}
          value={draft.title}
          onChange={e => setDraft({ ...draft, title: e.target.value })}
        />
      </label>

      <label>
        <span style={fieldLabel}>Trigger phrases (one per line)</span>
        <textarea
          style={textarea}
          rows={5}
          value={draft.trigger_phrases.join("\n")}
          onChange={e => setDraft({
            ...draft,
            trigger_phrases: e.target.value.split("\n").map(s => s.trim()).filter(Boolean),
          })}
        />
      </label>

      <label>
        <span style={fieldLabel}>Response</span>
        <textarea
          style={textarea}
          rows={8}
          value={draft.response}
          onChange={e => setDraft({ ...draft, response: e.target.value })}
        />
      </label>

      <label style={{ display: "flex", alignItems: "center", gap: "8px", color: S.soft, fontSize: "0.88rem" }}>
        <input
          type="checkbox"
          checked={draft.enabled}
          onChange={e => setDraft({ ...draft, enabled: e.target.checked })}
        />
        Enabled
      </label>

      <button
        type="button"
        disabled={saving}
        onClick={() => onSave(draft)}
        style={{
          padding: "8px 16px", background: IBM.blue, border: "none",
          color: "#fff", fontSize: "0.82rem", fontFamily: "inherit",
          cursor: saving ? "wait" : "pointer", fontWeight: 600, alignSelf: "flex-start",
        }}
      >
        {saving ? "Saving…" : "Save"}
      </button>
    </div>
  );
}
