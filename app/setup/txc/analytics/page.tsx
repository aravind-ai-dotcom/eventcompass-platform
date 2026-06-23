"use client";

import { useEffect, useState } from "react";
import { SetupShell } from "@/components/setup/SetupShell";
import { TXC_EVENT_ID } from "@/lib/compassEventPaths";
import { fetchRecentAnalytics } from "@/services/knowledge/knowledgeMatchingService";
import type { KnowledgeAnalyticsRecord } from "@/types/compassGovernance";

export default function TxcAnalyticsSetupPage() {
  const [rows, setRows] = useState<KnowledgeAnalyticsRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetchRecentAnalytics(TXC_EVENT_ID, 200).then(data => {
      setRows(data);
      setLoading(false);
    });
  }, []);

  return (
    <SetupShell
      eventLabel="FORGE 2027 Compass"
      title="Knowledge Analytics"
      subtitle="organizations/ibm/events/txc2026/knowledgeAnalytics"
    >
      {loading ? <p>Loading analytics…</p> : (
        <div className="setup-table-wrap">
          <table className="setup-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Intent</th>
                <th>Confidence</th>
                <th>Source</th>
                <th>Question</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id ?? r.createdAt}>
                  <td>{new Date(r.createdAt).toLocaleString()}</td>
                  <td>{r.matchedIntent ?? "—"}</td>
                  <td>{r.confidence != null ? `${Math.round(r.confidence * 100)}%` : "—"}</td>
                  <td>{r.source}</td>
                  <td>{r.rawQuestion}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && <p>No analytics events yet. Ask Compass AI a knowledge question.</p>}
        </div>
      )}
    </SetupShell>
  );
}
