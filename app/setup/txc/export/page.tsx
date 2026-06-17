"use client";

import { useEffect, useMemo, useState } from "react";
import { SetupShell } from "@/components/setup/SetupShell";
import { TXC_EVENT_ID } from "@/lib/compassEventPaths";
import { loadKnowledgeRecords } from "@/services/knowledge/knowledgeService";
import type { TechXchangeKnowledgeRecord } from "@/types/compassGovernance";

export default function TxcExportSetupPage() {
  const [records, setRecords] = useState<TechXchangeKnowledgeRecord[]>([]);

  useEffect(() => {
    void loadKnowledgeRecords(TXC_EVENT_ID).then(setRecords);
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

  return (
    <SetupShell
      eventLabel="TechXchange Compass"
      title="Export Documentation"
      subtitle="Printable knowledge documentation grouped by category"
    >
      <div className="setup-toolbar">
        <button type="button" className="setup-btn setup-btn--primary" onClick={downloadJson}>Export JSON</button>
        <button type="button" className="setup-btn setup-btn--secondary" onClick={downloadCsv}>Export CSV</button>
      </div>

      <div className="setup-export-doc">
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
    </SetupShell>
  );
}
