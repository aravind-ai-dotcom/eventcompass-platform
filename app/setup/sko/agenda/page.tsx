"use client";

import { useEffect, useState } from "react";
import { SkoSetupShell } from "@/components/setup/SkoSetupShell";
import { listContentItems, listGeos, saveContentItem } from "@/services/sko/skoFirestoreService";
import type { SkoContentItem, SkoGeo } from "@/types/sko";

export default function SkoAgendaSetupPage() {
  const [geos, setGeos] = useState<SkoGeo[]>([]);
  const [geoId, setGeoId] = useState("");
  const [items, setItems] = useState<SkoContentItem[]>([]);
  const [selected, setSelected] = useState<SkoContentItem | null>(null);

  useEffect(() => {
    void listGeos().then(g => {
      setGeos(g);
      if (g[0]) setGeoId(g[0].name);
    });
  }, []);

  useEffect(() => {
    void listContentItems(undefined, geoId).then(setItems);
  }, [geoId]);

  async function handleSave() {
    if (!selected) return;
    await saveContentItem({ ...selected, updatedAt: new Date().toISOString() });
    setItems(await listContentItems(undefined, geoId));
  }

  return (
    <SkoSetupShell title="Agenda" subtitle="Run-of-show content items by geo">
      <div className="setup-toolbar">
        <select className="setup-select" value={geoId} onChange={e => setGeoId(e.target.value)}>
          {geos.map(g => (
            <option key={g.id} value={g.name}>{g.name}</option>
          ))}
        </select>
      </div>
      <div className="setup-split">
        <div className="setup-table-wrap">
          <table className="setup-table">
            <thead>
              <tr><th>#</th><th>Title</th><th>Status</th></tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id} className={selected?.id === item.id ? "is-selected" : ""} onClick={() => setSelected(item)}>
                  <td>{item.agendaOrder}</td>
                  <td>{item.title}</td>
                  <td>{item.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {selected && (
          <div className="setup-editor">
            <label className="setup-field">Title<input className="setup-input" value={selected.title} onChange={e => setSelected({ ...selected, title: e.target.value })} /></label>
            <label className="setup-field">Description<textarea className="setup-textarea" rows={4} value={selected.description} onChange={e => setSelected({ ...selected, description: e.target.value })} /></label>
            <label className="setup-field">Media Center URL<input className="setup-input" value={selected.mediaCenterUrl ?? ""} onChange={e => setSelected({ ...selected, mediaCenterUrl: e.target.value, videoProvider: "media_center" })} /></label>
            <label className="setup-field">Fallback YouTube<input className="setup-input" value={selected.fallbackYoutubeUrl ?? ""} onChange={e => setSelected({ ...selected, fallbackYoutubeUrl: e.target.value })} /></label>
            <button type="button" className="setup-btn setup-btn--primary" onClick={() => void handleSave()}>Save agenda item</button>
          </div>
        )}
      </div>
    </SkoSetupShell>
  );
}
