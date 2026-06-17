"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { SkoSetupShell } from "@/components/setup/SkoSetupShell";
import { SKO_EVENT_ID } from "@/lib/compassEventPaths";
import {
  getCachedSkoKnowledgeRecords,
  hasChinese,
  invalidateSkoKnowledgeCache,
  loadSkoKnowledgeRecords,
  matchSkoKnowledgeQuestion,
  saveSkoKnowledgeRecord,
  seedSkoKnowledgeIfEmpty,
} from "@/services/knowledge/skoKnowledgeService";
import type {
  GovernanceLanguage,
  KnowledgeStatus,
  SkoKnowledgeCategory,
  SkoKnowledgeRecord,
} from "@/types/compassGovernance";

const CATEGORIES: SkoKnowledgeCategory[] = [
  "Compass", "Sales Enablement", "Podcast", "Clip Summary",
  "Geo", "AI Tools", "Action Items", "Fallback",
];

export default function SkoKnowledgeSetupPage() {
  const [records, setRecords] = useState<SkoKnowledgeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [geoFilter, setGeoFilter] = useState("all");
  const [selected, setSelected] = useState<SkoKnowledgeRecord | null>(null);
  const [testQuestion, setTestQuestion] = useState("");
  const [testLanguage, setTestLanguage] = useState<GovernanceLanguage>("en-US");
  const [testResult, setTestResult] = useState("");
  const [message, setMessage] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    invalidateSkoKnowledgeCache(SKO_EVENT_ID);
    setRecords(await loadSkoKnowledgeRecords(SKO_EVENT_ID));
    setLoading(false);
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return records.filter(r => {
      if (categoryFilter !== "all" && r.category !== categoryFilter) return false;
      if (geoFilter !== "all" && r.geoId !== geoFilter) return false;
      if (!q) return true;
      const enExamples = r.examples["en-US"] ?? [];
      const zhExamples = r.examples["zh-CN"] ?? [];
      return (
        r.intent.toLowerCase().includes(q) ||
        (r.response["en-US"] ?? "").toLowerCase().includes(q) ||
        (r.response["zh-CN"] ?? "").includes(q) ||
        enExamples.some(e => e.toLowerCase().includes(q)) ||
        zhExamples.some(e => e.includes(q)) ||
        r.tags.some(t => t.toLowerCase().includes(q))
      );
    });
  }, [records, search, categoryFilter, geoFilter]);

  async function handleSave(record: SkoKnowledgeRecord) {
    await saveSkoKnowledgeRecord(SKO_EVENT_ID, { ...record, updatedAt: new Date().toISOString() });
    setMessage(`Saved ${record.intent}`);
    await refresh();
    setSelected(getCachedSkoKnowledgeRecords(SKO_EVENT_ID).find(r => r.id === record.id) ?? record);
  }

  async function handleSeed() {
    const count = await seedSkoKnowledgeIfEmpty(SKO_EVENT_ID);
    setMessage(count ? `Seeded ${count} SKO knowledge records.` : "Knowledge base already populated.");
    await refresh();
  }

  function runTest() {
    const match = matchSkoKnowledgeQuestion(testQuestion, testLanguage, SKO_EVENT_ID);
    setTestResult(
      match
        ? `Matched: ${match.intent} (${Math.round(match.confidence * 100)}% · ${match.language})\n\n${match.response}`
        : "No active knowledge match.",
    );
  }

  return (
    <SkoSetupShell
      title="SKO Knowledge Base"
      subtitle="Bilingual Firestore source — organizations/ibm/events/sko2026/knowledgeBase"
    >
      <div className="setup-toolbar">
        <input className="setup-input" placeholder="Search intent, examples, responses…" value={search} onChange={e => setSearch(e.target.value)} />
        <select className="setup-select" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
          <option value="all">All categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="setup-select" value={geoFilter} onChange={e => setGeoFilter(e.target.value)}>
          <option value="all">All geos</option>
          <option value="EMEA">EMEA</option>
          <option value="APAC">APAC</option>
          <option value="Americas">Americas</option>
          <option value="Japan">Japan</option>
        </select>
        <button type="button" className="setup-btn setup-btn--secondary" onClick={() => void refresh()}>Refresh</button>
        <button type="button" className="setup-btn setup-btn--secondary" onClick={() => void handleSeed()}>Seed if empty</button>
      </div>

      {message && <p className="setup-message">{message}</p>}

      <div className="setup-split">
        <div className="setup-table-wrap">
          {loading ? <p>Loading…</p> : (
            <table className="setup-table">
              <thead>
                <tr><th>Intent</th><th>Category</th><th>中文</th><th>Status</th></tr>
              </thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r.id} className={selected?.id === r.id ? "is-selected" : ""} onClick={() => setSelected(r)}>
                    <td>{r.intent}</td>
                    <td>{r.category}</td>
                    <td>{hasChinese(r) ? "✓" : "—"}</td>
                    <td>{r.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="setup-panel">
          {selected ? (
            <SkoKnowledgeEditor record={selected} onSave={r => void handleSave(r)} />
          ) : (
            <p>Select a knowledge record to edit.</p>
          )}

          <div className="setup-test-box">
            <h3>Test question matching</h3>
            <select className="setup-select" value={testLanguage} onChange={e => setTestLanguage(e.target.value as GovernanceLanguage)}>
              <option value="en-US">English</option>
              <option value="zh-CN">中文</option>
            </select>
            <textarea className="setup-textarea" rows={2} value={testQuestion} onChange={e => setTestQuestion(e.target.value)} placeholder="Type a question in English or Chinese…" />
            <button type="button" className="setup-btn setup-btn--primary" onClick={runTest}>Test match</button>
            {testResult && <pre className="setup-pre">{testResult}</pre>}
          </div>
        </div>
      </div>
    </SkoSetupShell>
  );
}

function SkoKnowledgeEditor({
  record,
  onSave,
}: {
  record: SkoKnowledgeRecord;
  onSave: (r: SkoKnowledgeRecord) => void;
}) {
  const [draft, setDraft] = useState(record);
  useEffect(() => { setDraft(record); }, [record]);

  return (
    <div className="setup-editor">
      <h3>{draft.intent}</h3>
      <label className="setup-field">
        English response
        <textarea className="setup-textarea" rows={4} value={draft.response["en-US"] ?? ""} onChange={e => setDraft({ ...draft, response: { ...draft.response, "en-US": e.target.value } })} />
      </label>
      <label className="setup-field">
        中文 response
        <textarea className="setup-textarea" rows={4} value={draft.response["zh-CN"] ?? ""} onChange={e => setDraft({ ...draft, response: { ...draft.response, "zh-CN": e.target.value } })} />
      </label>
      <label className="setup-field">
        English examples (one per line)
        <textarea className="setup-textarea" rows={3} value={(draft.examples["en-US"] ?? []).join("\n")} onChange={e => setDraft({ ...draft, examples: { ...draft.examples, "en-US": e.target.value.split("\n").map(s => s.trim()).filter(Boolean) } })} />
      </label>
      <label className="setup-field">
        中文 examples (one per line)
        <textarea className="setup-textarea" rows={3} value={(draft.examples["zh-CN"] ?? []).join("\n")} onChange={e => setDraft({ ...draft, examples: { ...draft.examples, "zh-CN": e.target.value.split("\n").map(s => s.trim()).filter(Boolean) } })} />
      </label>
      <div className="setup-row">
        <label className="setup-field">
          Category
          <select className="setup-select" value={draft.category} onChange={e => setDraft({ ...draft, category: e.target.value as SkoKnowledgeCategory })}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <label className="setup-field">
          Status
          <select className="setup-select" value={draft.status} onChange={e => setDraft({ ...draft, status: e.target.value as KnowledgeStatus })}>
            <option value="active">active</option>
            <option value="draft">draft</option>
            <option value="retired">retired</option>
          </select>
        </label>
        <label className="setup-field">
          Geo filter (optional)
          <input className="setup-input" value={draft.geoId ?? ""} onChange={e => setDraft({ ...draft, geoId: e.target.value || undefined })} placeholder="APAC, EMEA…" />
        </label>
      </div>
      <button type="button" className="setup-btn setup-btn--primary" onClick={() => onSave(draft)}>Save to Firestore</button>
    </div>
  );
}
