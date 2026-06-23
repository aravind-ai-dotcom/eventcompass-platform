"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { SetupShell } from "@/components/setup/SetupShell";
import { TXC_EVENT_ID } from "@/lib/compassEventPaths";
import {
  getCachedKnowledgeRecords,
  invalidateKnowledgeCache,
  loadKnowledgeRecords,
  saveKnowledgeRecord,
  seedKnowledgeIfEmpty,
} from "@/services/knowledge/knowledgeService";
import { matchKnowledgeQuestion } from "@/services/knowledge/knowledgeMatchingService";
import type { KnowledgeCategory, KnowledgeStatus, TechXchangeKnowledgeRecord } from "@/types/compassGovernance";

const CATEGORIES: KnowledgeCategory[] = [
  "Compass", "Champion", "Certification", "Partner", "Event Logistics",
  "Networking", "Fun", "Privacy", "Fallback",
];

export default function TxcKnowledgeSetupPage() {
  const [records, setRecords] = useState<TechXchangeKnowledgeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selected, setSelected] = useState<TechXchangeKnowledgeRecord | null>(null);
  const [testQuestion, setTestQuestion] = useState("");
  const [testResult, setTestResult] = useState<string>("");
  const [message, setMessage] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    invalidateKnowledgeCache(TXC_EVENT_ID);
    const data = await loadKnowledgeRecords(TXC_EVENT_ID);
    setRecords(data);
    setLoading(false);
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return records.filter(r => {
      if (categoryFilter !== "all" && r.category !== categoryFilter) return false;
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (!q) return true;
      return (
        r.intent.toLowerCase().includes(q) ||
        r.response.toLowerCase().includes(q) ||
        r.examples.some(e => e.toLowerCase().includes(q)) ||
        r.tags.some(t => t.toLowerCase().includes(q))
      );
    });
  }, [records, search, categoryFilter, statusFilter]);

  async function handleSave(record: TechXchangeKnowledgeRecord) {
    const updated = { ...record, updatedAt: new Date().toISOString() };
    await saveKnowledgeRecord(TXC_EVENT_ID, updated);
    setMessage(`Saved ${record.intent}`);
    await refresh();
    setSelected(getCachedKnowledgeRecords(TXC_EVENT_ID).find(r => r.id === record.id) ?? updated);
  }

  async function handleSeed() {
    const count = await seedKnowledgeIfEmpty(TXC_EVENT_ID);
    setMessage(count ? `Seeded ${count} knowledge records.` : "Knowledge base already populated.");
    await refresh();
  }

  function runTest() {
    const match = matchKnowledgeQuestion(testQuestion, TXC_EVENT_ID);
    setTestResult(
      match
        ? `Matched: ${match.intent} (${Math.round(match.confidence * 100)}% confidence)\n\n${match.response}`
        : "No active knowledge match.",
    );
  }

  return (
    <SetupShell
      eventLabel="FORGE 2027 Compass"
      title="Knowledge Base"
      subtitle="Firestore source of truth — organizations/ibm/events/txc2026/knowledgeBase"
    >
      <div className="setup-toolbar">
        <input
          className="setup-input"
          placeholder="Search intent, examples, response, tags…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="setup-select" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="all">All categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="setup-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="draft">Draft</option>
          <option value="retired">Retired</option>
        </select>
        <button type="button" className="setup-btn setup-btn--secondary" onClick={() => void refresh()}>Refresh</button>
        <button type="button" className="setup-btn setup-btn--secondary" onClick={() => void handleSeed()}>Seed if empty</button>
      </div>

      {message && <p className="setup-message">{message}</p>}

      <div className="setup-split">
        <div className="setup-table-wrap">
          {loading ? (
            <p>Loading from Firestore…</p>
          ) : (
            <table className="setup-table">
              <thead>
                <tr>
                  <th>Intent</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Priority</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r.id} className={selected?.id === r.id ? "is-selected" : ""} onClick={() => setSelected(r)}>
                    <td>{r.intent}</td>
                    <td>{r.category}</td>
                    <td>{r.status}</td>
                    <td>{r.priority}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="setup-panel">
          {selected ? (
            <KnowledgeEditor record={selected} onSave={(r) => void handleSave(r)} />
          ) : (
            <p>Select a knowledge record to edit.</p>
          )}

          <div className="setup-test-box">
            <h3>Test question matching</h3>
            <textarea
              className="setup-textarea"
              rows={2}
              value={testQuestion}
              onChange={(e) => setTestQuestion(e.target.value)}
              placeholder="Type a question…"
            />
            <button type="button" className="setup-btn setup-btn--primary" onClick={runTest}>Test match</button>
            {testResult && <pre className="setup-pre">{testResult}</pre>}
          </div>
        </div>
      </div>
    </SetupShell>
  );
}

function KnowledgeEditor({
  record,
  onSave,
}: {
  record: TechXchangeKnowledgeRecord;
  onSave: (r: TechXchangeKnowledgeRecord) => void;
}) {
  const [draft, setDraft] = useState(record);
  useEffect(() => { setDraft(record); }, [record]);

  return (
    <div className="setup-editor">
      <h3>{draft.intent}</h3>
      <label>
        Response
        <textarea
          className="setup-textarea"
          rows={6}
          value={draft.response}
          onChange={(e) => setDraft({ ...draft, response: e.target.value })}
        />
      </label>
      <label>
        Examples (one per line)
        <textarea
          className="setup-textarea"
          rows={5}
          value={draft.examples.join("\n")}
          onChange={(e) => setDraft({ ...draft, examples: e.target.value.split("\n").map(s => s.trim()).filter(Boolean) })}
        />
      </label>
      <div className="setup-row">
        <label>
          Category
          <select
            className="setup-select"
            value={draft.category}
            onChange={(e) => setDraft({ ...draft, category: e.target.value as KnowledgeCategory })}
          >
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <label>
          Status
          <select
            className="setup-select"
            value={draft.status}
            onChange={(e) => setDraft({ ...draft, status: e.target.value as KnowledgeStatus })}
          >
            <option value="active">active</option>
            <option value="draft">draft</option>
            <option value="retired">retired</option>
          </select>
        </label>
        <label>
          Priority
          <input
            className="setup-input"
            type="number"
            value={draft.priority}
            onChange={(e) => setDraft({ ...draft, priority: Number(e.target.value) })}
          />
        </label>
        <label className="setup-check">
          <input type="checkbox" checked={draft.active} onChange={(e) => setDraft({ ...draft, active: e.target.checked })} />
          Active
        </label>
      </div>
      <label>
        Tags (comma-separated)
        <input
          className="setup-input"
          value={draft.tags.join(", ")}
          onChange={(e) => setDraft({ ...draft, tags: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })}
        />
      </label>
      <button type="button" className="setup-btn setup-btn--primary" onClick={() => onSave(draft)}>Save to Firestore</button>
    </div>
  );
}
