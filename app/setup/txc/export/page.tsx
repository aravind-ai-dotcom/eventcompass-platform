"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { SetupShell } from "@/components/setup/SetupShell";
import { TXC_EVENT_ID } from "@/lib/compassEventPaths";
import {
  categoryLabelForRecord,
  downloadVoiceKnowledgeWorkbook,
  summarizeVoiceKnowledge,
} from "@/lib/txcKnowledgeExport";
import { loadKnowledgeRecords } from "@/services/knowledge/knowledgeService";
import { loadUnifiedVoiceKnowledge } from "@/services/knowledge/txcFaqKnowledgeService";
import type { TechXchangeKnowledgeRecord } from "@/types/compassGovernance";
import type { VoiceKnowledgeCategoryMeta, VoiceKnowledgeRecord } from "@/types/voiceKnowledge";

export default function TxcExportSetupPage() {
  const [records, setRecords] = useState<TechXchangeKnowledgeRecord[]>([]);
  const [voiceRecords, setVoiceRecords] = useState<VoiceKnowledgeRecord[]>([]);
  const [voiceCategories, setVoiceCategories] = useState<VoiceKnowledgeCategoryMeta[]>([]);
  const [voiceLoading, setVoiceLoading] = useState(true);
  const [voiceError, setVoiceError] = useState("");

  useEffect(() => {
    void loadKnowledgeRecords(TXC_EVENT_ID).then(setRecords);
  }, []);

  useEffect(() => {
    void loadUnifiedVoiceKnowledge()
      .then(data => {
        setVoiceRecords(data.records);
        setVoiceCategories(data.categories);
      })
      .catch(err => {
        setVoiceError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => setVoiceLoading(false));
  }, []);

  const grouped = useMemo(() => {
    const map = new Map<string, TechXchangeKnowledgeRecord[]>();
    for (const r of records) {
      const list = map.get(r.category) ?? [];
      list.push(r);
      map.set(r.category, list);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [records]);

  const voiceSummary = useMemo(
    () => summarizeVoiceKnowledge(voiceRecords, voiceCategories),
    [voiceRecords, voiceCategories],
  );

  const voiceGrouped = useMemo(() => {
    const map = new Map<string, VoiceKnowledgeRecord[]>();
    for (const record of voiceRecords) {
      const key = categoryLabelForRecord(record, voiceCategories);
      const list = map.get(key) ?? [];
      list.push(record);
      map.set(key, list);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [voiceRecords, voiceCategories]);

  function downloadJson() {
    const blob = new Blob([JSON.stringify(records, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "txc2026-knowledge-export.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadCsv() {
    const header = "intent,category,status,priority,tags,examples,response\n";
    const lines = records.map(r => {
      const esc = (s: string) => `"${s.replace(/"/g, '""')}"`;
      return [
        esc(r.intent), esc(r.category), esc(r.status), String(r.priority),
        esc(r.tags.join(";")), esc(r.examples.join(" | ")), esc(r.response),
      ].join(",");
    });
    const blob = new Blob([header + lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "txc2026-knowledge-export.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadVoiceXlsx() {
    downloadVoiceKnowledgeWorkbook(voiceRecords, voiceCategories, "txc-knowledge.xlsx");
  }

  return (
    <SetupShell
      eventLabel="TechXchange Compass"
      title="Export Documentation"
      subtitle="Download Voice Compass knowledge for study and review, plus legacy knowledgeBase exports"
    >
      <section className="setup-export-section" style={{ marginBottom: "32px" }}>
        <h2>Voice Compass knowledge (canonical)</h2>
        <p style={{ margin: "0 0 14px", color: "var(--muted)", fontSize: "0.9rem", lineHeight: 1.5, maxWidth: "42rem" }}>
          Unified voice knowledge for study and editorial review — {voiceLoading ? "loading…" : `${voiceSummary.total} records`}
          {" "}from <code>voice_knowledge</code>. Excel includes Voice Knowledge, Categories, Review Notes, and Needs Review sheets.
        </p>
        <div className="setup-toolbar">
          <button
            type="button"
            className="setup-btn setup-btn--primary"
            onClick={downloadVoiceXlsx}
            disabled={voiceLoading || voiceRecords.length === 0}
          >
            Export Knowledge XLSX
          </button>
          <Link href="/txc/admin/knowledge" className="setup-btn setup-btn--secondary">
            Open Knowledge Admin →
          </Link>
        </div>
        {voiceError && <p className="setup-error">{voiceError}</p>}
        {!voiceLoading && voiceRecords.length > 0 && (
          <div className="setup-export-doc" style={{ marginTop: "20px" }}>
            {voiceGrouped.map(([category, items]) => (
              <section key={category} className="setup-export-section">
                <h2>{category} ({items.length})</h2>
                {items.slice(0, 6).map(record => (
                  <article key={record.id} className="setup-export-item">
                    <h3>
                      {record.title}
                      <span className="setup-tag">{record.enabled ? "active" : "inactive"}</span>
                    </h3>
                    <p><strong>Response:</strong> {record.display_response ?? record.response}</p>
                    {record.trigger_phrases.length > 0 && (
                      <p><strong>Utterances:</strong> {record.trigger_phrases.slice(0, 4).join(" · ")}</p>
                    )}
                  </article>
                ))}
                {items.length > 6 && (
                  <p style={{ margin: "8px 0 0", color: "var(--muted)", fontSize: "0.84rem" }}>
                    + {items.length - 6} more in the XLSX export
                  </p>
                )}
              </section>
            ))}
          </div>
        )}
      </section>

      <section className="setup-export-section">
        <h2>Legacy knowledgeBase</h2>
        <p style={{ margin: "0 0 14px", color: "var(--muted)", fontSize: "0.9rem", lineHeight: 1.5, maxWidth: "42rem" }}>
          Champion, Event Logistics, and Compass Q&amp;A records from <code>knowledgeBase</code> ({records.length} records).
        </p>
        <div className="setup-toolbar">
          <button type="button" className="setup-btn setup-btn--secondary" onClick={downloadJson}>Export JSON</button>
          <button type="button" className="setup-btn setup-btn--secondary" onClick={downloadCsv}>Export CSV</button>
        </div>

        <div className="setup-export-doc" style={{ marginTop: "20px" }}>
          {grouped.map(([category, items]) => (
            <section key={category} className="setup-export-section">
              <h2>{category}</h2>
              {items.map(r => (
                <article key={r.id} className="setup-export-item">
                  <h3>{r.intent} <span className="setup-tag">{r.status}</span></h3>
                  <p><strong>Examples:</strong> {r.examples.join(" · ")}</p>
                  <p><strong>Tags:</strong> {r.tags.join(", ")}</p>
                  <p>{r.response}</p>
                </article>
              ))}
            </section>
          ))}
        </div>
      </section>
    </SetupShell>
  );
}
