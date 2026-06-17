"use client";

import { useEffect, useState } from "react";
import { SkoSetupShell } from "@/components/setup/SkoSetupShell";
import {
  listGeos,
  listPulseMetrics,
  listPulseQuotes,
  savePulseMetrics,
  savePulseQuote,
} from "@/services/sko/skoFirestoreService";
import type { SkoGeo, SkoPulseMetrics, SkoPulseQuote } from "@/types/sko";
import { SKO_EDITION_ID } from "@/types/sko";

export default function SkoPulseAdminPage() {
  const [geos, setGeos] = useState<SkoGeo[]>([]);
  const [metrics, setMetrics] = useState<SkoPulseMetrics[]>([]);
  const [quotes, setQuotes] = useState<SkoPulseQuote[]>([]);
  const [selected, setSelected] = useState<SkoPulseMetrics | null>(null);
  const [newQuote, setNewQuote] = useState("");
  const [attribution, setAttribution] = useState("");

  useEffect(() => {
    void (async () => {
      const [g, m, q] = await Promise.all([listGeos(), listPulseMetrics(), listPulseQuotes()]);
      setGeos(g);
      setMetrics(m);
      setQuotes(q);
    })();
  }, []);

  async function handleSaveMetrics() {
    if (!selected) return;
    await savePulseMetrics({ ...selected, updatedAt: new Date().toISOString() });
    setMetrics(await listPulseMetrics());
  }

  async function handleAddQuote(geoId: string) {
    if (!newQuote.trim()) return;
    const quote: SkoPulseQuote = {
      id: `quote-${Date.now()}`,
      editionId: SKO_EDITION_ID,
      geoId,
      quote: newQuote.trim(),
      attributionLabel: attribution.trim() || "SKO participant",
      approved: true,
      sortOrder: quotes.filter(q => q.geoId === geoId).length + 1,
    };
    await savePulseQuote(quote);
    setQuotes(await listPulseQuotes());
    setNewQuote("");
    setAttribution("");
  }

  return (
    <SkoSetupShell title="Pulse Metrics" subtitle="Enter post-show metrics and approved quotes by geo">
      <div className="setup-split">
        <div className="setup-table-wrap">
          <table className="setup-table">
            <thead><tr><th>Geo</th><th>NPS</th><th>Live %</th></tr></thead>
            <tbody>
              {metrics.map(m => (
                <tr key={m.id} className={selected?.id === m.id ? "is-selected" : ""} onClick={() => setSelected(m)}>
                  <td>{m.geoId}</td>
                  <td>{m.nps ?? "—"}</td>
                  <td>{m.watchedLiveRate ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {selected && (
          <div className="setup-editor">
            <h3>{selected.geoId} metrics</h3>
            {[
              ["nps", "NPS"],
              ["attendanceRate", "Attendance rate"],
              ["watchedLiveRate", "Watched live rate"],
              ["participationRate", "Participation rate"],
              ["narrativesGenerated", "Narratives generated"],
              ["minutesDelivered", "Minutes delivered"],
            ].map(([key, label]) => (
              <label key={key} className="setup-field">
                {label}
                <input
                  className="setup-input"
                  type="number"
                  value={selected[key as keyof SkoPulseMetrics] ?? ""}
                  onChange={e => setSelected({
                    ...selected,
                    [key]: e.target.value === "" ? null : Number(e.target.value),
                  })}
                />
              </label>
            ))}
            <label className="setup-field">
              Top market
              <input className="setup-input" value={selected.topMarket ?? ""} onChange={e => setSelected({ ...selected, topMarket: e.target.value })} />
            </label>
            <label className="setup-field">
              Source label
              <input className="setup-input" value={selected.sourceLabel ?? ""} onChange={e => setSelected({ ...selected, sourceLabel: e.target.value })} />
            </label>
            <button type="button" className="setup-btn setup-btn--primary" onClick={() => void handleSaveMetrics()}>Save metrics</button>
          </div>
        )}
      </div>

      <div className="setup-editor" style={{ marginTop: 24 }}>
        <h3>Add approved quote</h3>
        <div className="setup-row">
          <select className="setup-select" id="quote-geo" defaultValue={geos[0]?.name}>
            {geos.map(g => <option key={g.id} value={g.name}>{g.name}</option>)}
          </select>
        </div>
        <textarea className="setup-textarea" rows={3} placeholder="Quote text" value={newQuote} onChange={e => setNewQuote(e.target.value)} />
        <input className="setup-input" placeholder="Attribution" value={attribution} onChange={e => setAttribution(e.target.value)} />
        <button
          type="button"
          className="setup-btn setup-btn--secondary"
          onClick={() => {
            const geo = (document.getElementById("quote-geo") as HTMLSelectElement)?.value;
            if (geo) void handleAddQuote(geo);
          }}
        >
          Add quote
        </button>
      </div>
    </SkoSetupShell>
  );
}
