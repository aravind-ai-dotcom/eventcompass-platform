"use client";

import { useEffect, useState } from "react";
import { SkoSetupShell } from "@/components/setup/SkoSetupShell";
import { listSpeakers, saveSpeaker } from "@/services/sko/skoFirestoreService";
import type { SkoSpeaker } from "@/types/sko";

export default function SkoSpeakersSetupPage() {
  const [speakers, setSpeakers] = useState<SkoSpeaker[]>([]);
  const [selected, setSelected] = useState<SkoSpeaker | null>(null);

  useEffect(() => {
    void listSpeakers().then(setSpeakers);
  }, []);

  async function handleSave() {
    if (!selected) return;
    await saveSpeaker(selected);
    setSpeakers(await listSpeakers());
  }

  return (
    <SkoSetupShell title="Speakers" subtitle="Validate speaker metadata for ingest">
      <div className="setup-split">
        <div className="setup-table-wrap">
          <table className="setup-table">
            <thead><tr><th>Name</th><th>Title</th><th>Type</th></tr></thead>
            <tbody>
              {speakers.map(s => (
                <tr key={s.id} className={selected?.id === s.id ? "is-selected" : ""} onClick={() => setSelected(s)}>
                  <td>{s.displayName}</td>
                  <td>{s.title}</td>
                  <td>{s.type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {selected && (
          <div className="setup-editor">
            <label className="setup-field">Display name<input className="setup-input" value={selected.displayName} onChange={e => setSelected({ ...selected, displayName: e.target.value })} /></label>
            <label className="setup-field">Title<input className="setup-input" value={selected.title} onChange={e => setSelected({ ...selected, title: e.target.value })} /></label>
            <label className="setup-field">Organization<input className="setup-input" value={selected.organization} onChange={e => setSelected({ ...selected, organization: e.target.value })} /></label>
            <button type="button" className="setup-btn setup-btn--primary" onClick={() => void handleSave()}>Save speaker</button>
          </div>
        )}
      </div>
    </SkoSetupShell>
  );
}
