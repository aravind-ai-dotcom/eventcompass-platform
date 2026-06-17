"use client";

import { useEffect, useMemo, useState } from "react";
import { SkoSetupShell } from "@/components/setup/SkoSetupShell";
import { SKO_EVENT_ID } from "@/lib/compassEventPaths";
import { loadSkoKnowledgeRecords } from "@/services/knowledge/skoKnowledgeService";
import { loadGovernanceSummaries } from "@/services/summaries/summaryService";
import { loadTranslationMemoryRecords } from "@/services/translations/translationMemoryService";
import type { SkoKnowledgeRecord, SkoGovernanceSummaryRecord, TranslationMemoryRecord } from "@/types/compassGovernance";

export default function SkoGovernanceExportPage() {
  const [knowledge, setKnowledge] = useState<SkoKnowledgeRecord[]>([]);
  const [summaries, setSummaries] = useState<SkoGovernanceSummaryRecord[]>([]);
  const [translations, setTranslations] = useState<TranslationMemoryRecord[]>([]);

  useEffect(() => {
    void (async () => {
      const [k, s, t] = await Promise.all([
        loadSkoKnowledgeRecords(SKO_EVENT_ID),
        loadGovernanceSummaries(SKO_EVENT_ID),
        loadTranslationMemoryRecords(SKO_EVENT_ID),
      ]);
      setKnowledge(k);
      setSummaries(s);
      setTranslations(t);
    })();
  }, []);

  const grouped = useMemo(() => {
    const map = new Map<string, SkoKnowledgeRecord[]>();
    for (const r of knowledge) {
      const list = map.get(r.category) ?? [];
      list.push(r);
      map.set(r.category, list);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [knowledge]);

  function downloadJson() {
    const payload = { knowledge, summaries, translations };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sko2026-governance-export.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <SkoSetupShell title="Export Documentation" subtitle="Printable SKO knowledge, summaries, and translation memory">
      <div className="setup-toolbar">
        <button type="button" className="setup-btn setup-btn--primary" onClick={downloadJson}>Export JSON</button>
      </div>

      <div className="setup-export-doc">
        <section className="setup-export-section">
          <h2>Translation Memory ({translations.length})</h2>
          {translations.map(t => (
            <article key={t.id} className="setup-export-item">
              <p><strong>{t.sourceText}</strong> → {t.translatedText} <span className="setup-tag">{t.category}{t.approved ? " · approved" : ""}</span></p>
            </article>
          ))}
        </section>

        <section className="setup-export-section">
          <h2>Content Summaries ({summaries.length})</h2>
          {summaries.map(s => (
            <article key={s.id} className="setup-export-item">
              <h3>{s.title} <span className="setup-tag">{s.contentType} · {s.geo} · {s.status}</span></h3>
              <p>{s.summary["en-US"]}</p>
              {s.summary["zh-CN"] && <p>{s.summary["zh-CN"]}</p>}
            </article>
          ))}
        </section>

        {grouped.map(([category, items]) => (
          <section key={category} className="setup-export-section">
            <h2>{category}</h2>
            {items.map(r => (
              <article key={r.id} className="setup-export-item">
                <h3>{r.intent} <span className="setup-tag">{r.status}</span></h3>
                <p><strong>EN examples:</strong> {(r.examples["en-US"] ?? []).join(" · ")}</p>
                {(r.examples["zh-CN"]?.length ?? 0) > 0 && (
                  <p><strong>中文 examples:</strong> {(r.examples["zh-CN"] ?? []).join(" · ")}</p>
                )}
                <p>{r.response["en-US"]}</p>
                {r.response["zh-CN"] && <p>{r.response["zh-CN"]}</p>}
              </article>
            ))}
          </section>
        ))}
      </div>
    </SkoSetupShell>
  );
}
