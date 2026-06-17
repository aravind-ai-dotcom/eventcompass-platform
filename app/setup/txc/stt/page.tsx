"use client";

import { useCallback, useEffect, useState } from "react";
import { SetupShell } from "@/components/setup/SetupShell";
import { TXC_EVENT_ID } from "@/lib/compassEventPaths";
import {
  getCachedSttRecords,
  invalidateSttCache,
  loadSttNormalizationRecords,
  normalizeTranscriptFromCache,
  saveSttNormalizationRecord,
  seedSttIfEmpty,
} from "@/services/voice/sttNormalizationService";
import type { SttNormalizationRecord } from "@/types/compassGovernance";

export default function TxcSttSetupPage() {
  const [records, setRecords] = useState<SttNormalizationRecord[]>([]);
  const [selected, setSelected] = useState<SttNormalizationRecord | null>(null);
  const [rawInput, setRawInput] = useState("show me tech exchange sessions about watson x");
  const [normalized, setNormalized] = useState("");
  const [message, setMessage] = useState("");

  const refresh = useCallback(async () => {
    invalidateSttCache(TXC_EVENT_ID);
    setRecords(await loadSttNormalizationRecords(TXC_EVENT_ID));
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  async function handleSave(record: SttNormalizationRecord) {
    await saveSttNormalizationRecord(TXC_EVENT_ID, record);
    setMessage(`Saved ${record.canonicalText}`);
    await refresh();
    setSelected(getCachedSttRecords(TXC_EVENT_ID).find(r => r.id === record.id) ?? record);
  }

  function runNormalize() {
    setNormalized(normalizeTranscriptFromCache(rawInput, TXC_EVENT_ID));
  }

  return (
    <SetupShell
      eventLabel="TechXchange Compass"
      title="STT Normalization"
      subtitle="heardAs aliases → canonicalText (runs before intent matching)"
    >
      <div className="setup-toolbar">
        <button type="button" className="setup-btn setup-btn--secondary" onClick={() => void refresh()}>Refresh</button>
        <button type="button" className="setup-btn setup-btn--secondary" onClick={() => void seedSttIfEmpty(TXC_EVENT_ID).then(n => setMessage(n ? `Seeded ${n} entries.` : "Already populated."))}>Seed if empty</button>
      </div>
      {message && <p className="setup-message">{message}</p>}

      <div className="setup-test-box">
        <h3>Test normalization</h3>
        <textarea className="setup-textarea" rows={2} value={rawInput} onChange={(e) => setRawInput(e.target.value)} />
        <button type="button" className="setup-btn setup-btn--primary" onClick={runNormalize}>Normalize</button>
        {normalized && <pre className="setup-pre">{normalized}</pre>}
      </div>

      <div className="setup-split">
        <div className="setup-table-wrap">
          <table className="setup-table">
            <thead><tr><th>Canonical</th><th>Heard as</th><th>Active</th></tr></thead>
            <tbody>
              {records.map(r => (
                <tr key={r.id} className={selected?.id === r.id ? "is-selected" : ""} onClick={() => setSelected(r)}>
                  <td>{r.canonicalText}</td>
                  <td>{r.heardAs.join(", ")}</td>
                  <td>{r.active ? "yes" : "no"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="setup-panel">
          {selected && (
            <SttEditor record={selected} onSave={(r) => void handleSave(r)} />
          )}
        </div>
      </div>
    </SetupShell>
  );
}

function SttEditor({
  record,
  onSave,
}: {
  record: SttNormalizationRecord;
  onSave: (r: SttNormalizationRecord) => void;
}) {
  const [draft, setDraft] = useState(record);
  useEffect(() => { setDraft(record); }, [record]);

  return (
    <div className="setup-editor">
      <label>Canonical<input className="setup-input" value={draft.canonicalText} onChange={(e) => setDraft({ ...draft, canonicalText: e.target.value })} /></label>
      <label>Heard as (one per line)<textarea className="setup-textarea" rows={4} value={draft.heardAs.join("\n")} onChange={(e) => setDraft({ ...draft, heardAs: e.target.value.split("\n").map(s => s.trim()).filter(Boolean) })} /></label>
      <label className="setup-check"><input type="checkbox" checked={draft.active} onChange={(e) => setDraft({ ...draft, active: e.target.checked })} /> Active</label>
      <button type="button" className="setup-btn setup-btn--primary" onClick={() => onSave({ ...draft, updatedAt: new Date().toISOString() })}>Save</button>
    </div>
  );
}
