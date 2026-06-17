"use client";

import { useEffect, useState } from "react";
import { SkoSetupShell } from "@/components/setup/SkoSetupShell";
import {
  createIngestJob,
  listContentItems,
  listGeos,
  listIngestJobs,
  listSpeakers,
  saveIngestJob,
} from "@/services/sko/skoFirestoreService";
import type { SkoContentItem, SkoGeo, SkoIngestJob, SkoSpeaker } from "@/types/sko";
import { SKO_EDITION_ID } from "@/types/sko";

const CHECKLIST: { key: keyof SkoIngestJob; label: string }[] = [
  { key: "agendaValidated", label: "Agenda validated" },
  { key: "speakerValidated", label: "Speaker validated" },
  { key: "transcriptSegmented", label: "Transcript segmented" },
  { key: "aiTagged", label: "Knowledge built" },
  { key: "clipsGenerated", label: "Key moments created" },
  { key: "narrativesGenerated", label: "Narratives ready" },
  { key: "podcastGenerated", label: "Podcast ready" },
  { key: "published", label: "Published" },
];

export default function SkoIngestSetupPage() {
  const [geos, setGeos] = useState<SkoGeo[]>([]);
  const [items, setItems] = useState<SkoContentItem[]>([]);
  const [speakers, setSpeakers] = useState<SkoSpeaker[]>([]);
  const [jobs, setJobs] = useState<SkoIngestJob[]>([]);

  const [editionId] = useState(SKO_EDITION_ID);
  const [geoId, setGeoId] = useState("");
  const [contentItemId, setContentItemId] = useState("");
  const [speakerId, setSpeakerId] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [mp4FileUrl, setMp4FileUrl] = useState("");
  const [mp3FileUrl, setMp3FileUrl] = useState("");
  const [transcriptFileUrl, setTranscriptFileUrl] = useState("");
  const [srtFileUrl, setSrtFileUrl] = useState("");
  const [vttFileUrl, setVttFileUrl] = useState("");
  const [pdfUrl, setPdfUrl] = useState("");
  const [pptUrl, setPptUrl] = useState("");
  const [startTime, setStartTime] = useState("00:00:00");
  const [endTime, setEndTime] = useState("00:05:00");
  const [selectedJob, setSelectedJob] = useState<SkoIngestJob | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    void (async () => {
      const [g, sp, j] = await Promise.all([listGeos(), listSpeakers(), listIngestJobs()]);
      setGeos(g);
      setSpeakers(sp);
      setJobs(j);
      if (g[0]) setGeoId(g[0].name);
    })();
  }, []);

  useEffect(() => {
    if (geoId) void listContentItems(editionId, geoId).then(setItems);
  }, [geoId, editionId]);

  async function handleCreateJob() {
    if (!contentItemId) {
      setMessage("Select an agenda item.");
      return;
    }
    const now = new Date().toISOString();
    const job: Omit<SkoIngestJob, "id"> = {
      editionId,
      geoId,
      contentItemId,
      status: videoUrl || mp4FileUrl ? "assets_uploaded" : "created",
      videoUrl,
      mp4FileUrl,
      mp3FileUrl,
      transcriptFileUrl,
      srtFileUrl,
      vttFileUrl,
      pdfUrl,
      pptUrl,
      agendaValidated: Boolean(contentItemId),
      speakerValidated: Boolean(speakerId),
      transcriptSegmented: Boolean(transcriptFileUrl || srtFileUrl || vttFileUrl),
      aiTagged: false,
      clipsGenerated: false,
      narrativesGenerated: false,
      podcastGenerated: false,
      published: false,
      createdAt: now,
      updatedAt: now,
      notes: `Timecode ${startTime}–${endTime}`,
    };
    const id = await createIngestJob(job);
    setJobs(await listIngestJobs());
    setMessage(`Ingest job ${id} created.`);
  }

  async function toggleChecklist(key: keyof SkoIngestJob) {
    if (!selectedJob || typeof selectedJob[key] !== "boolean") return;
    const updated = {
      ...selectedJob,
      [key]: !selectedJob[key],
      updatedAt: new Date().toISOString(),
    } as SkoIngestJob;
    await saveIngestJob(updated);
    setSelectedJob(updated);
    setJobs(await listIngestJobs());
  }

  return (
    <SkoSetupShell title="Ingest" subtitle="Upload assets and track processing checklist">
      <div className="setup-toolbar">
        <select className="setup-select" value={geoId} onChange={e => setGeoId(e.target.value)}>
          {geos.map(g => <option key={g.id} value={g.name}>{g.name}</option>)}
        </select>
        <select className="setup-select" value={contentItemId} onChange={e => setContentItemId(e.target.value)}>
          <option value="">Select agenda item…</option>
          {items.map(i => <option key={i.id} value={i.id}>{i.agendaOrder}. {i.title}</option>)}
        </select>
      </div>

      <div className="setup-split">
        <div className="setup-editor">
          <h3>Assets</h3>
          <label className="setup-field">Video link<input className="setup-input" value={videoUrl} onChange={e => setVideoUrl(e.target.value)} /></label>
          <label className="setup-field">MP4 URL<input className="setup-input" value={mp4FileUrl} onChange={e => setMp4FileUrl(e.target.value)} /></label>
          <label className="setup-field">MP3 URL<input className="setup-input" value={mp3FileUrl} onChange={e => setMp3FileUrl(e.target.value)} /></label>
          <label className="setup-field">Transcript URL<input className="setup-input" value={transcriptFileUrl} onChange={e => setTranscriptFileUrl(e.target.value)} /></label>
          <label className="setup-field">SRT URL<input className="setup-input" value={srtFileUrl} onChange={e => setSrtFileUrl(e.target.value)} /></label>
          <label className="setup-field">VTT URL<input className="setup-input" value={vttFileUrl} onChange={e => setVttFileUrl(e.target.value)} /></label>
          <label className="setup-field">PDF URL<input className="setup-input" value={pdfUrl} onChange={e => setPdfUrl(e.target.value)} /></label>
          <label className="setup-field">PPT URL<input className="setup-input" value={pptUrl} onChange={e => setPptUrl(e.target.value)} /></label>

          <h3>Speaker validation</h3>
          <select className="setup-select" value={speakerId} onChange={e => setSpeakerId(e.target.value)}>
            <option value="">Select speaker…</option>
            {speakers.map(s => <option key={s.id} value={s.id}>{s.displayName} — {s.title}</option>)}
          </select>

          <h3>Timecode</h3>
          <div className="setup-row">
            <label className="setup-field">Start<input className="setup-input" value={startTime} onChange={e => setStartTime(e.target.value)} /></label>
            <label className="setup-field">End<input className="setup-input" value={endTime} onChange={e => setEndTime(e.target.value)} /></label>
          </div>

          <button type="button" className="setup-btn setup-btn--primary" onClick={() => void handleCreateJob()}>Save ingest job</button>
          {message && <p className="setup-message">{message}</p>}
        </div>

        <div className="setup-panel">
          <h3>Processing checklist</h3>
          {selectedJob ? (
            <>
              <p className="setup-muted">Job {selectedJob.id} · {selectedJob.status}</p>
              <ul className="sko-checklist">
                <li className={selectedJob.mp4FileUrl || selectedJob.videoUrl ? "is-done" : ""}>Assets uploaded</li>
                {CHECKLIST.map(step => (
                  <li key={step.key} className={selectedJob[step.key] ? "is-done" : ""}>
                    <button type="button" className="sko-link-btn" onClick={() => void toggleChecklist(step.key)}>
                      {selectedJob[step.key] ? "✓" : "○"} {step.label}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="setup-muted">Select a job below to manage checklist.</p>
          )}

          <div className="setup-table-wrap" style={{ marginTop: 16 }}>
            <table className="setup-table">
              <thead><tr><th>Geo</th><th>Status</th><th>Updated</th></tr></thead>
              <tbody>
                {jobs.map(j => (
                  <tr key={j.id} className={selectedJob?.id === j.id ? "is-selected" : ""} onClick={() => setSelectedJob(j)}>
                    <td>{j.geoId}</td>
                    <td>{j.status}</td>
                    <td>{j.updatedAt.slice(0, 10)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </SkoSetupShell>
  );
}
