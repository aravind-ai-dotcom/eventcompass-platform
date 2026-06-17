"use client";

import { useEffect, useState } from "react";
import { SkoSetupShell } from "@/components/setup/SkoSetupShell";
import { exportAllSkoData, listIngestJobs, saveIngestJob } from "@/services/sko/skoFirestoreService";
import type { SkoIngestJob } from "@/types/sko";

export default function SkoPublishSetupPage() {
  const [jobs, setJobs] = useState<SkoIngestJob[]>([]);
  const [exportJson, setExportJson] = useState("");

  useEffect(() => {
    void listIngestJobs().then(setJobs);
  }, []);

  async function publishReadyJobs() {
    const ready = jobs.filter(j => j.narrativesGenerated && j.podcastGenerated && !j.published);
    for (const job of ready) {
      await saveIngestJob({
        ...job,
        published: true,
        status: "published",
        updatedAt: new Date().toISOString(),
      });
    }
    setJobs(await listIngestJobs());
  }

  async function handleExport() {
    const data = await exportAllSkoData();
    setExportJson(JSON.stringify(data, null, 2));
  }

  return (
    <SkoSetupShell title="Publish" subtitle="Publish ready ingest jobs and export SKO data">
      <div className="setup-toolbar">
        <button type="button" className="setup-btn setup-btn--primary" onClick={() => void publishReadyJobs()}>
          Publish ready jobs
        </button>
        <button type="button" className="setup-btn setup-btn--secondary" onClick={() => void handleExport()}>
          Export JSON
        </button>
      </div>

      <div className="setup-table-wrap">
        <table className="setup-table">
          <thead>
            <tr><th>Geo</th><th>Content</th><th>Status</th><th>Published</th></tr>
          </thead>
          <tbody>
            {jobs.map(j => (
              <tr key={j.id}>
                <td>{j.geoId}</td>
                <td>{j.contentItemId}</td>
                <td>{j.status}</td>
                <td>{j.published ? "Yes" : "No"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {exportJson && <pre className="setup-pre">{exportJson}</pre>}
    </SkoSetupShell>
  );
}
