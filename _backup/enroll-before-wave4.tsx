"use client";
// =============================================================================
// EventCompass — Enroll  /enroll
// Attendee signal collection. Placeholder v1 — form renders, no writes yet.
// Firestore writes added in Phase 7 (authentication + participant writes).
// =============================================================================
import { useState } from "react";
import Link from "next/link";

const TRACKS = ["AI","App Development","App Integration","Business Management & FinOps","Cloud","Data","Data Security & IAM","IBM Z & LinuxONE","IT Optimization & Automation","Power","Red Hat","Storage","HashiCorp"];
const ROLES  = ["Client / Customer","Student","Speaker","Champion","IBMer","HashiCorp","Red Hat","Partner","Event Staff"];
const OPEN_TO = ["Finding a mentor","Mentoring others","Meeting peers","Meeting customers","Meeting partners","Meeting IBM experts","Joining roundtables","1:1 introductions","Career conversations"];

export default function EnrollPage() {
  const [submitted, setSubmitted] = useState(false);
  const [tracks, setTracks]       = useState<string[]>([]);
  const [roles,  setRoles]        = useState<string[]>([]);

  function toggleArr(arr: string[], set: (v: string[]) => void, val: string) {
    set(arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val]);
  }

  if (submitted) {
    return (
      <>
        <section className="compact-hero">
          <div className="section-kicker">Compass ready</div>
          <h1>Your Compass is building.</h1>
          <p>In the full version, this is where Compass scores sessions and champions against your profile and opens your personalised experience.</p>
        </section>
        <section className="section no-top-border">
          <div className="section-head narrow">
            <div>
              <div className="section-kicker">What happens next</div>
              <h2>Compass is computing your experience.</h2>
            </div>
          </div>
          <div className="opportunity-grid three">
            {[
              { label: "Sessions scored", body: "Every session in the catalog is scored against your tracks, goals, and keywords." },
              { label: "Champions matched", body: "Champions are matched by keyword overlap and sorted by availability." },
              { label: "Next Best Move ready", body: "Your time-aware single recommendation is computed and waiting." },
            ].map(c => (
              <article key={c.label} className="opportunity-card">
                <div className="card-meta"><span>{c.label}</span></div>
                <h3>{c.label}</h3>
                <p>{c.body}</p>
              </article>
            ))}
          </div>
          <div style={{ marginTop: "32px" }}>
            <Link href="/experience" className="btn-primary">Open My Compass</Link>
          </div>
        </section>
        <div style={{ height: "64px" }} />
      </>
    );
  }

  return (
    <>
      <section className="compact-hero">
        <div className="section-kicker">Build My Compass</div>
        <h1>Tell Compass what matters to you.</h1>
        <p>Share your intent, a few signals, and how you want to engage. Compass uses that context to shape the sessions, people, and moments most relevant to your week.</p>
      </section>

      <section className="section no-top-border">
        {/* Coming-soon notice */}
        <div style={{ border: "1px solid var(--accent)", background: "var(--panel)", padding: "20px 24px", marginBottom: "36px" }}>
          <p style={{ color: "var(--accent)", fontSize: "0.72rem", fontWeight: 680, textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 6px" }}>
            Prototype note
          </p>
          <p style={{ color: "var(--soft)", margin: 0, fontSize: "0.95rem", lineHeight: 1.55 }}>
            In v1, this form demonstrates the enrollment flow. Firestore writes and IBM ID authentication are added in the next phase. The experience page currently loads participant <strong>ATT-0001</strong> directly.
          </p>
        </div>

        {/* ── Form ── */}
        <div style={{ maxWidth: "680px" }}>

          {/* Identity */}
          <div style={{ marginBottom: "40px" }}>
            <p style={{ color: "var(--accent)", fontSize: "0.72rem", fontWeight: 680, textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 16px" }}>
              01 · Who are you?
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              {[
                ["First name",    "text",  "Maya"],
                ["Last name",     "text",  "Patel"],
                ["Email",         "email", "name@example.com"],
                ["Company",       "text",  "Acme Corp"],
                ["Job title",     "text",  "Platform Engineer"],
              ].map(([label, type, placeholder]) => (
                <label key={label as string} style={{ display: "flex", flexDirection: "column", gap: "6px", color: "var(--soft)", fontSize: "0.88rem" }}>
                  {label}
                  <input type={type as string} placeholder={placeholder as string}
                    style={{ height: "40px", padding: "0 12px", border: "1px solid var(--line)", background: "var(--panel)", color: "var(--text)", fontSize: "0.95rem", fontFamily: "inherit" }} />
                </label>
              ))}
            </div>
          </div>

          {/* Intent */}
          <div style={{ marginBottom: "40px" }}>
            <p style={{ color: "var(--accent)", fontSize: "0.72rem", fontWeight: 680, textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 16px" }}>
              02 · Why are you attending?
            </p>
            {[
              ["What do you want from TechXchange?", "I want to find practical AI sessions, meet people working on similar problems, and leave with a clear plan."],
              ["What can you share with others?",    "I can share lessons from my team, my industry, or my technical journey."],
              ["What would make the event worth your time?", "A few strong connections, one useful lab, and a clearer direction for what to do next."],
            ].map(([label, placeholder]) => (
              <label key={label as string} style={{ display: "flex", flexDirection: "column", gap: "6px", color: "var(--soft)", fontSize: "0.88rem", marginBottom: "14px" }}>
                {label}
                <textarea placeholder={placeholder as string} rows={3}
                  style={{ padding: "10px 12px", border: "1px solid var(--line)", background: "var(--panel)", color: "var(--text)", fontSize: "0.95rem", fontFamily: "inherit", resize: "vertical" }} />
              </label>
            ))}
          </div>

          {/* Tracks */}
          <div style={{ marginBottom: "32px" }}>
            <p style={{ color: "var(--accent)", fontSize: "0.72rem", fontWeight: 680, textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 10px" }}>
              03 · Tech tracks you care about
            </p>
            <div className="chip-row" style={{ marginTop: 0, flexWrap: "wrap" }}>
              {TRACKS.map(tr => (
                <button key={tr} onClick={() => toggleArr(tracks, setTracks, tr)}
                  style={{ display: "inline-flex", alignItems: "center", height: "30px", padding: "0 10px", border: tracks.includes(tr) ? "1px solid var(--accent)" : "1px solid var(--line)", background: tracks.includes(tr) ? "var(--accent)" : "transparent", color: tracks.includes(tr) ? "var(--accent-text)" : "var(--soft)", fontSize: "0.82rem", fontFamily: "inherit", cursor: "pointer", marginBottom: "6px" }}>
                  {tr}
                </button>
              ))}
            </div>
          </div>

          {/* Roles */}
          <div style={{ marginBottom: "32px" }}>
            <p style={{ color: "var(--accent)", fontSize: "0.72rem", fontWeight: 680, textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 10px" }}>
              04 · Your role at TechXchange
            </p>
            <div className="chip-row" style={{ marginTop: 0, flexWrap: "wrap" }}>
              {ROLES.map(r => (
                <button key={r} onClick={() => toggleArr(roles, setRoles, r)}
                  style={{ display: "inline-flex", alignItems: "center", height: "30px", padding: "0 10px", border: roles.includes(r) ? "1px solid var(--accent)" : "1px solid var(--line)", background: roles.includes(r) ? "var(--accent)" : "transparent", color: roles.includes(r) ? "var(--accent-text)" : "var(--soft)", fontSize: "0.82rem", fontFamily: "inherit", cursor: "pointer", marginBottom: "6px" }}>
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Consent */}
          <div style={{ border: "1px solid var(--line)", background: "var(--panel)", padding: "20px", marginBottom: "28px" }}>
            <p style={{ color: "var(--muted)", fontSize: "0.78rem", fontWeight: 680, textTransform: "uppercase", letterSpacing: "0.09em", margin: "0 0 12px" }}>Consent</p>
            {[
              "Use my profile to suggest relevant communities and opportunities.",
              "I am open to relevant introductions.",
              "Include my signals in event Pulse insights (anonymous).",
            ].map(label => (
              <label key={label} style={{ display: "flex", alignItems: "flex-start", gap: "10px", marginBottom: "10px", cursor: "pointer" }}>
                <input type="checkbox" defaultChecked style={{ marginTop: "3px", flexShrink: 0 }} />
                <span style={{ color: "var(--soft)", fontSize: "0.9rem", lineHeight: 1.45 }}>{label}</span>
              </label>
            ))}
          </div>

          {/* Submit */}
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <button onClick={() => setSubmitted(true)} className="btn-primary">
              Create my Compass
            </button>
            <Link href="/" className="btn-secondary">Back</Link>
          </div>
        </div>
      </section>

      <div style={{ height: "64px" }} />
    </>
  );
}
