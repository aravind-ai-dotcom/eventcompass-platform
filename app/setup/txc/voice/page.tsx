"use client";

import { useCallback, useEffect, useState } from "react";
import { SetupShell } from "@/components/setup/SetupShell";
import { TXC_EVENT_ID } from "@/lib/compassEventPaths";
import {
  getCachedVoiceDictionaryRecords,
  invalidateVoiceDictionaryCache,
  loadVoiceDictionaryRecords,
  saveVoiceDictionaryRecord,
  seedVoiceDictionaryIfEmpty,
} from "@/services/voice/voiceDictionaryService";
import { applyPronunciationFromCache } from "@/services/voice/sttNormalizationService";
import type { VoiceDictionaryRecord } from "@/types/compassGovernance";

export default function TxcVoiceSetupPage() {
  const [records, setRecords] = useState<VoiceDictionaryRecord[]>([]);
  const [selected, setSelected] = useState<VoiceDictionaryRecord | null>(null);
  const [preview, setPreview] = useState("");
  const [message, setMessage] = useState("");

  const refresh = useCallback(async () => {
    invalidateVoiceDictionaryCache(TXC_EVENT_ID);
    setRecords(await loadVoiceDictionaryRecords(TXC_EVENT_ID));
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  async function handleSave(record: VoiceDictionaryRecord) {
    await saveVoiceDictionaryRecord(TXC_EVENT_ID, record);
    setMessage(`Saved ${record.displayText}`);
    await refresh();
    setSelected(getCachedVoiceDictionaryRecords(TXC_EVENT_ID).find(r => r.id === record.id) ?? record);
  }

  return (
    <SetupShell
      eventLabel="TechXchange Compass"
      title="Voice Pronunciation Dictionary"
      subtitle="displayText → spokenText for Google TTS (after response generation)"
    >
      <div className="setup-toolbar">
        <button type="button" className="setup-btn setup-btn--secondary" onClick={() => void refresh()}>Refresh</button>
        <button type="button" className="setup-btn setup-btn--secondary" onClick={() => void seedVoiceDictionaryIfEmpty(TXC_EVENT_ID).then(n => setMessage(n ? `Seeded ${n} entries.` : "Already populated."))}>Seed if empty</button>
      </div>
      {message && <p className="setup-message">{message}</p>}

      <div className="setup-split">
        <div className="setup-table-wrap">
          <table className="setup-table">
            <thead><tr><th>Display</th><th>Spoken</th><th>Active</th></tr></thead>
            <tbody>
              {records.map(r => (
                <tr key={r.id} className={selected?.id === r.id ? "is-selected" : ""} onClick={() => setSelected(r)}>
                  <td>{r.displayText}</td>
                  <td>{r.spokenText}</td>
                  <td>{r.active ? "yes" : "no"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="setup-panel">
          {selected && (
            <VoiceEditor
              record={selected}
              onSave={(r) => void handleSave(r)}
              onPreview={(text) => setPreview(applyPronunciationFromCache(text, TXC_EVENT_ID))}
            />
          )}
          {preview && <pre className="setup-pre">TTS preview: {preview}</pre>}
        </div>
      </div>
    </SetupShell>
  );
}

function VoiceEditor({
  record,
  onSave,
  onPreview,
}: {
  record: VoiceDictionaryRecord;
  onSave: (r: VoiceDictionaryRecord) => void;
  onPreview: (text: string) => void;
}) {
  const [draft, setDraft] = useState(record);
  useEffect(() => { setDraft(record); }, [record]);

  return (
    <div className="setup-editor">
      <label>Display text<input className="setup-input" value={draft.displayText} onChange={(e) => setDraft({ ...draft, displayText: e.target.value })} /></label>
      <label>Spoken text<input className="setup-input" value={draft.spokenText} onChange={(e) => setDraft({ ...draft, spokenText: e.target.value })} /></label>
      <label>Notes<input className="setup-input" value={draft.notes ?? ""} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} /></label>
      <label className="setup-check"><input type="checkbox" checked={draft.active} onChange={(e) => setDraft({ ...draft, active: e.target.checked })} /> Active</label>
      <div className="setup-row">
        <button type="button" className="setup-btn setup-btn--primary" onClick={() => onSave({ ...draft, updatedAt: new Date().toISOString() })}>Save</button>
        <button type="button" className="setup-btn setup-btn--secondary" onClick={() => onPreview(draft.displayText)}>Preview TTS text</button>
      </div>
    </div>
  );
}
