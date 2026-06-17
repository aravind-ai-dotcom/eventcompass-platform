"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { SkoSetupShell } from "@/components/setup/SkoSetupShell";
import { SKO_EVENT_ID } from "@/lib/compassEventPaths";
import {
  invalidateTranslationMemoryCache,
  loadTranslationMemoryRecords,
  saveTranslationMemoryRecord,
  seedTranslationMemoryIfEmpty,
  translateWithMemory,
} from "@/services/translations/translationMemoryService";
import type { TranslationMemoryCategory, TranslationMemoryRecord } from "@/types/compassGovernance";

const CATEGORIES: TranslationMemoryCategory[] = ["ui", "summary", "podcast", "clip", "voice", "product"];

export default function SkoTranslationsSetupPage() {
  const [records, setRecords] = useState<TranslationMemoryRecord[]>([]);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [approvedOnly, setApprovedOnly] = useState(false);
  const [selected, setSelected] = useState<TranslationMemoryRecord | null>(null);
  const [testEnglish, setTestEnglish] = useState("Generate Chinese Summary for Key Takeaways and Action Items.");
  const [testResult, setTestResult] = useState("");
  const [message, setMessage] = useState("");

  const refresh = useCallback(async () => {
    invalidateTranslationMemoryCache(SKO_EVENT_ID);
    setRecords(await loadTranslationMemoryRecords(SKO_EVENT_ID));
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const filtered = useMemo(() => {
    return records.filter(r => {
      if (categoryFilter !== "all" && r.category !== categoryFilter) return false;
      if (approvedOnly && !r.approved) return false;
      return true;
    });
  }, [records, categoryFilter, approvedOnly]);

  async function handleSave(record: TranslationMemoryRecord) {
    await saveTranslationMemoryRecord(SKO_EVENT_ID, record);
    setMessage(`Saved translation entry`);
    await refresh();
  }

  async function handleSeed() {
    const count = await seedTranslationMemoryIfEmpty(SKO_EVENT_ID);
    setMessage(count ? `Seeded ${count} translation memory entries.` : "Translation memory already populated.");
    await refresh();
  }

  function runTest() {
    setTestResult(translateWithMemory(testEnglish, SKO_EVENT_ID));
  }

  return (
    <SkoSetupShell title="Translation Memory" subtitle="Approved Chinese terms — separate from knowledge responses">
      <div className="setup-toolbar">
        <select className="setup-select" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
          <option value="all">All categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <label className="setup-check">
          <input type="checkbox" checked={approvedOnly} onChange={e => setApprovedOnly(e.target.checked)} />
          Approved only
        </label>
        <button type="button" className="setup-btn setup-btn--secondary" onClick={() => void refresh()}>Refresh</button>
        <button type="button" className="setup-btn setup-btn--secondary" onClick={() => void handleSeed()}>Seed if empty</button>
      </div>

      {message && <p className="setup-message">{message}</p>}

      <div className="setup-split">
        <div className="setup-table-wrap">
          <table className="setup-table">
            <thead><tr><th>English</th><th>中文</th><th>Category</th><th>✓</th></tr></thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id} className={selected?.id === r.id ? "is-selected" : ""} onClick={() => setSelected(r)}>
                  <td>{r.sourceText}</td>
                  <td>{r.translatedText}</td>
                  <td>{r.category}</td>
                  <td>{r.approved ? "✓" : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="setup-panel">
          {selected ? (
            <TranslationEditor record={selected} onSave={r => void handleSave(r)} />
          ) : (
            <p>Select a translation entry to edit.</p>
          )}

          <div className="setup-test-box">
            <h3>Test translation memory</h3>
            <textarea className="setup-textarea" rows={2} value={testEnglish} onChange={e => setTestEnglish(e.target.value)} />
            <button type="button" className="setup-btn setup-btn--primary" onClick={runTest}>Apply memory</button>
            {testResult && <pre className="setup-pre">{testResult}</pre>}
          </div>
        </div>
      </div>
    </SkoSetupShell>
  );
}

function TranslationEditor({
  record,
  onSave,
}: {
  record: TranslationMemoryRecord;
  onSave: (r: TranslationMemoryRecord) => void;
}) {
  const [draft, setDraft] = useState(record);
  useEffect(() => { setDraft(record); }, [record]);

  return (
    <div className="setup-editor">
      <label className="setup-field">Source (en-US)<input className="setup-input" value={draft.sourceText} onChange={e => setDraft({ ...draft, sourceText: e.target.value })} /></label>
      <label className="setup-field">Translation (zh-CN)<input className="setup-input" value={draft.translatedText} onChange={e => setDraft({ ...draft, translatedText: e.target.value })} /></label>
      <label className="setup-field">
        Category
        <select className="setup-select" value={draft.category} onChange={e => setDraft({ ...draft, category: e.target.value as TranslationMemoryCategory })}>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </label>
      <label className="setup-field">Notes<input className="setup-input" value={draft.notes ?? ""} onChange={e => setDraft({ ...draft, notes: e.target.value })} /></label>
      <label className="setup-check">
        <input type="checkbox" checked={draft.approved} onChange={e => setDraft({ ...draft, approved: e.target.checked })} />
        Approved
      </label>
      <button type="button" className="setup-btn setup-btn--primary" onClick={() => onSave({ ...draft, updatedAt: new Date().toISOString() })}>Save translation</button>
    </div>
  );
}
