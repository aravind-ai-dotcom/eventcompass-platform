"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { SkoSetupShell } from "@/components/setup/SkoSetupShell";
import { SKO_EVENT_ID } from "@/lib/compassEventPaths";
import {
  filterSummariesByGeo,
  invalidateSummaryCache,
  loadGovernanceSummaries,
  saveGovernanceSummary,
  seedGovernanceSummariesIfEmpty,
} from "@/services/summaries/summaryService";
import type {
  SkoGovernanceSummaryRecord,
  SkoSummaryContentType,
  SkoSummaryGeo,
} from "@/types/compassGovernance";

const CONTENT_TYPES: SkoSummaryContentType[] = ["podcast", "clip", "segment", "dailyRecap"];
const GEOS: SkoSummaryGeo[] = ["global", "americas", "apac", "emea", "japan", "gcg", "hk"];

export default function SkoSummariesSetupPage() {
  const [records, setRecords] = useState<SkoGovernanceSummaryRecord[]>([]);
  const [geoFilter, setGeoFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [selected, setSelected] = useState<SkoGovernanceSummaryRecord | null>(null);
  const [message, setMessage] = useState("");

  const refresh = useCallback(async () => {
    invalidateSummaryCache(SKO_EVENT_ID);
    setRecords(await loadGovernanceSummaries(SKO_EVENT_ID));
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const filtered = useMemo(() => {
    let list = records;
    if (geoFilter !== "all") list = filterSummariesByGeo(list, geoFilter);
    if (typeFilter !== "all") list = list.filter(r => r.contentType === typeFilter);
    return list;
  }, [records, geoFilter, typeFilter]);

  async function handleSave(record: SkoGovernanceSummaryRecord) {
    await saveGovernanceSummary(SKO_EVENT_ID, record);
    setMessage(`Saved ${record.title}`);
    await refresh();
  }

  async function handleSeed() {
    const count = await seedGovernanceSummariesIfEmpty(SKO_EVENT_ID);
    setMessage(count ? `Seeded ${count} summaries.` : "Summaries already populated.");
    await refresh();
  }

  return (
    <SkoSetupShell title="Content Summaries" subtitle="Podcast, clip, segment, and daily recap summaries with Chinese support">
      <div className="setup-toolbar">
        <select className="setup-select" value={geoFilter} onChange={e => setGeoFilter(e.target.value)}>
          <option value="all">All geos</option>
          {GEOS.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
        <select className="setup-select" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          <option value="all">All types</option>
          {CONTENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <button type="button" className="setup-btn setup-btn--secondary" onClick={() => void refresh()}>Refresh</button>
        <button type="button" className="setup-btn setup-btn--secondary" onClick={() => void handleSeed()}>Seed if empty</button>
      </div>

      {message && <p className="setup-message">{message}</p>}

      <div className="setup-split">
        <div className="setup-table-wrap">
          <table className="setup-table">
            <thead><tr><th>Title</th><th>Type</th><th>Geo</th><th>Status</th></tr></thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id} className={selected?.id === r.id ? "is-selected" : ""} onClick={() => setSelected(r)}>
                  <td>{r.title}</td>
                  <td>{r.contentType}</td>
                  <td>{r.geo}</td>
                  <td>{r.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {selected && (
          <SummaryEditor record={selected} onSave={r => void handleSave(r)} />
        )}
      </div>
    </SkoSetupShell>
  );
}

function SummaryEditor({
  record,
  onSave,
}: {
  record: SkoGovernanceSummaryRecord;
  onSave: (r: SkoGovernanceSummaryRecord) => void;
}) {
  const [draft, setDraft] = useState(record);
  useEffect(() => { setDraft(record); }, [record]);

  return (
    <div className="setup-editor">
      <h3>{draft.title}</h3>
      <label className="setup-field">English summary<textarea className="setup-textarea" rows={3} value={draft.summary["en-US"] ?? ""} onChange={e => setDraft({ ...draft, summary: { ...draft.summary, "en-US": e.target.value } })} /></label>
      <label className="setup-field">中文 summary<textarea className="setup-textarea" rows={3} value={draft.summary["zh-CN"] ?? ""} onChange={e => setDraft({ ...draft, summary: { ...draft.summary, "zh-CN": e.target.value } })} /></label>
      <label className="setup-field">Key takeaways EN (one per line)<textarea className="setup-textarea" rows={3} value={(draft.keyTakeaways["en-US"] ?? []).join("\n")} onChange={e => setDraft({ ...draft, keyTakeaways: { ...draft.keyTakeaways, "en-US": e.target.value.split("\n").map(s => s.trim()).filter(Boolean) } })} /></label>
      <label className="setup-field">关键要点 (one per line)<textarea className="setup-textarea" rows={3} value={(draft.keyTakeaways["zh-CN"] ?? []).join("\n")} onChange={e => setDraft({ ...draft, keyTakeaways: { ...draft.keyTakeaways, "zh-CN": e.target.value.split("\n").map(s => s.trim()).filter(Boolean) } })} /></label>
      <label className="setup-field">Action items EN<textarea className="setup-textarea" rows={2} value={(draft.actionItems["en-US"] ?? []).join("\n")} onChange={e => setDraft({ ...draft, actionItems: { ...draft.actionItems, "en-US": e.target.value.split("\n").map(s => s.trim()).filter(Boolean) } })} /></label>
      <label className="setup-field">行动建议<textarea className="setup-textarea" rows={2} value={(draft.actionItems["zh-CN"] ?? []).join("\n")} onChange={e => setDraft({ ...draft, actionItems: { ...draft.actionItems, "zh-CN": e.target.value.split("\n").map(s => s.trim()).filter(Boolean) } })} /></label>
      <div className="setup-row">
        <label className="setup-field">
          Status
          <select className="setup-select" value={draft.status} onChange={e => setDraft({ ...draft, status: e.target.value as SkoGovernanceSummaryRecord["status"] })}>
            <option value="draft">draft</option>
            <option value="review">review</option>
            <option value="approved">approved</option>
            <option value="retired">retired</option>
          </select>
        </label>
        <label className="setup-field">
          Content type
          <select className="setup-select" value={draft.contentType} onChange={e => setDraft({ ...draft, contentType: e.target.value as SkoSummaryContentType })}>
            {CONTENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
      </div>
      <button type="button" className="setup-btn setup-btn--primary" onClick={() => onSave({ ...draft, updatedAt: new Date().toISOString() })}>Save summary</button>
    </div>
  );
}
