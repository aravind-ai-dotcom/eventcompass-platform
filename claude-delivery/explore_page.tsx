"use client";
// =============================================================================
// EventCompass — Explore  /explore
// Redesigned (Task 30, Job 3): mobile-first, IBM.com-inspired story layout.
//
// Sections:
//   1. Hero
//   2. Four ways to spend your time — vertical story cards with pictogram + CTA
//   3. See what Compass can do — persona cards (inclusive global names)
//   4. Signals shaping the event — live counts with icons
//   5. Navigate — working page links
//   6. Final band
//
// Live Firestore counts are preserved (sessions, champions, participants).
// Persona cards use safe synthetic composites to demonstrate the product.
// =============================================================================
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { getDocs, collection } from "firebase/firestore";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import type { CSSProperties } from "react";

const BASE = "organizations/ibm/events/txc2026";

// ── Inline IBM Carbon–style pictograms ────────────────────────────────────────
function Picto({ type }: { type: "keynote" | "lab" | "expert" | "community" }) {
  const d: Record<string, React.ReactNode> = {
    keynote: (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <rect x="4" y="8" width="40" height="26" rx="1" />
        <line x1="16" y1="40" x2="32" y2="40" />
        <line x1="24" y1="34" x2="24" y2="40" />
        <polyline points="18,24 24,18 30,24" />
        <line x1="24" y1="18" x2="24" y2="30" />
      </svg>
    ),
    lab: (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M18 8v16L8 38a2 2 0 001.7 3h26.6A2 2 0 0038 38L28 24V8" />
        <line x1="16" y1="8" x2="32" y2="8" />
        <circle cx="20" cy="32" r="2" fill="currentColor" stroke="none" />
        <circle cx="28" cy="36" r="1.5" fill="currentColor" stroke="none" />
      </svg>
    ),
    expert: (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <circle cx="24" cy="16" r="7" />
        <path d="M10 40c0-7.7 6.3-14 14-14s14 6.3 14 14" />
        <circle cx="36" cy="14" r="4" />
        <path d="M40 28c2.2 1.6 4 4.4 4 8" />
      </svg>
    ),
    community: (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <circle cx="24" cy="13" r="6" />
        <circle cx="10" cy="22" r="5" />
        <circle cx="38" cy="22" r="5" />
        <path d="M14 38c0-5.5 4.5-10 10-10s10 4.5 10 10" />
        <path d="M2 38c0-4 2.6-7.4 6-8.6" />
        <path d="M46 38c0-4-2.6-7.4-6-8.6" />
      </svg>
    ),
  };
  return (
    <div style={{ width: 56, height: 56, color: "var(--accent)", opacity: 0.85, marginBottom: 18, flexShrink: 0 }}>
      {d[type]}
    </div>
  );
}

// ── Four ways to spend your time ─────────────────────────────────────────────
const EXPERIENCE_WAYS = [
  {
    num: "01",
    picto: "keynote" as const,
    title: "Main stage moments",
    body: "Keynotes, announcements, and awards that anchor the week. Shared experiences worth being in the room for.",
    cta: "Browse sessions",
    href: "/sessions",
  },
  {
    num: "02",
    picto: "lab" as const,
    title: "Hands-on learning",
    body: "Instructor-led labs, certifications, and workshops. Limited seats — Compass scores these against your tracks.",
    cta: "Browse sessions",
    href: "/sessions",
  },
  {
    num: "03",
    picto: "expert" as const,
    title: "Expert access",
    body: "Meet the Expert sessions, Champion conversations, and technical exchanges with IBM practitioners.",
    cta: "See champions",
    href: "/experience",
  },
  {
    num: "04",
    picto: "community" as const,
    title: "Community energy",
    body: "Alumni programs, partner circles, and communities forming around shared goals and career paths.",
    cta: "Open My Compass",
    href: "/experience",
  },
];

// ── Personas — safe synthetics demonstrating what Compass can do ──────────────
// These are fictional composites, not real attendees.
const PERSONAS = [
  {
    name: "Priya Sharma",
    role: "Principal Cloud Architect",
    org: "IBM India · Bangalore",
    flag: "🇮🇳",
    tracks: ["Cloud", "Data & AI"],
    compassNote: "Compass matched 14 sessions on hybrid cloud and AI integration, and found 3 Champions in her domain.",
    goals: ["Hands-on labs", "Expert access"],
  },
  {
    name: "Marcus Johnson",
    role: "Senior AI/ML Engineer",
    org: "IBM · Atlanta, GA",
    flag: "🇺🇸",
    tracks: ["AI", "Automation"],
    compassNote: "Compass surfaced 6 alumni connections attending the same tracks and scored 9 sessions above 60.",
    goals: ["Community", "Build networks"],
  },
  {
    name: "Amara Okonkwo",
    role: "Data & Analytics Lead",
    org: "IBM South Africa · Cape Town",
    flag: "🇿🇦",
    tracks: ["Data & AI", "Security"],
    compassNote: "Compass recommended a 2-day analytics certification path matched to her background in finance.",
    goals: ["Certifications", "Career growth"],
  },
  {
    name: "Lin Wei",
    role: "DevOps Principal",
    org: "IBM APAC · Singapore",
    flag: "🇸🇬",
    tracks: ["AIOps", "Cloud"],
    compassNote: "Compass identified 4 peer connections with shared DevOps and platform engineering expertise.",
    goals: ["Peer networking", "Automation"],
  },
];

// ── Nav cards ─────────────────────────────────────────────────────────────────
const NAV_CARDS = [
  { href: "/sessions",   label: "Session Guide", body: "Browse all sessions ranked by your Compass score. Filter by track, type, and day.", cta: "Browse sessions" },
  { href: "/experience", label: "My Experience", body: "Your personalised TechXchange — scored sessions, Champion matches, and Next Best Move.",  cta: "Open My Compass" },
  { href: "/pulse",      label: "Pulse",          body: "Live event signals: trending tracks, active communities, and audience composition.",  cta: "See the pulse" },
];

// ── Shared styles ─────────────────────────────────────────────────────────────
const KICKER: CSSProperties = {
  color: "var(--accent)", fontSize: "0.72rem", fontWeight: 680,
  textTransform: "uppercase", letterSpacing: "0.12em", display: "block", marginBottom: "6px",
};

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ExplorePage() {
  const { user, enrolled } = useAuth();
  const [counts, setCounts] = useState({ sessions: 0, champions: 0, participants: 0 });

  useEffect(() => {
    Promise.all([
      getDocs(collection(db, `${BASE}/sessions`)),
      getDocs(collection(db, `${BASE}/champions`)),
      getDocs(collection(db, `${BASE}/participants`)),
    ]).then(([s, c, p]) =>
      setCounts({ sessions: s.size, champions: c.size, participants: p.size })
    ).catch(() => {});
  }, []);

  return (
    <>
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="compact-hero">
        <div className="section-kicker">Explore</div>
        <h1>Discover what matters at TechXchange.</h1>
        <p>
          From main stage moments to hands-on labs and expert conversations —
          Compass turns the event into a plan you can act on.
        </p>
      </section>

      {/* ── Four ways to spend your time ─────────────────────────────────── */}
      <section className="section no-top-border">
        <div className="section-head narrow" style={{ marginBottom: "32px" }}>
          <div>
            <span style={KICKER}>Worth exploring</span>
            <h2>Four ways to spend your time.</h2>
          </div>
          <p style={{ color: "var(--muted)", lineHeight: 1.55, fontSize: "0.98rem" }}>
            Compass looks across session types, expert moments, and community experiences
            so you do not have to start with a blank catalog.
          </p>
        </div>
        <div className="story-grid">
          {EXPERIENCE_WAYS.map(w => (
            <article key={w.num} className="story-card story-card-large">
              <Picto type={w.picto} />
              <span style={{ fontFamily: "var(--font-mono, ui-monospace)", color: "var(--accent)", fontSize: "0.78rem", marginBottom: "8px", display: "block" }}>
                {w.num}
              </span>
              <h3 style={{ fontSize: "1.28rem", lineHeight: 1.15, letterSpacing: "-0.02em", fontWeight: 560, margin: "0 0 12px" }}>{w.title}</h3>
              <p style={{ color: "var(--muted)", lineHeight: 1.5, margin: "0 0 20px", fontSize: "0.92rem", flexGrow: 1 }}>{w.body}</p>
              <Link href={w.href} className="action-chip" style={{ alignSelf: "flex-start" }}>
                {w.cta} →
              </Link>
            </article>
          ))}
        </div>
      </section>

      {/* ── Signals shaping the event ─────────────────────────────────────── */}
      <section className="section">
        <div className="section-head narrow" style={{ marginBottom: "24px" }}>
          <div>
            <span style={KICKER}>Event at a glance</span>
            <h2>What is already in the room.</h2>
          </div>
          <p style={{ color: "var(--muted)", fontSize: "0.98rem", lineHeight: 1.55 }}>
            Live counts from Firestore. Compass computes recommendations dynamically — no stored list.
          </p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "1px", background: "var(--line)", border: "1px solid var(--line)" }}>
          {[
            { icon: "📚", label: "Sessions indexed",   val: counts.sessions    || "—" },
            { icon: "🏅", label: "Champions available", val: counts.champions   || "—" },
            { icon: "👥", label: "Attendee signals",    val: counts.participants || "—" },
          ].map(item => (
            <div key={item.label} style={{ background: "var(--panel)", padding: "24px 20px" }}>
              <p style={{ fontSize: "1.6rem", margin: "0 0 8px", lineHeight: 1 }} aria-hidden="true">{item.icon}</p>
              <p style={{ color: "var(--muted)", fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 680, margin: "0 0 8px" }}>{item.label}</p>
              <p style={{ fontSize: "clamp(2.4rem, 4vw, 3.4rem)", fontWeight: 420, letterSpacing: "-0.05em", lineHeight: 1, color: "var(--text)", margin: 0 }}>{item.val}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── See what Compass can do — persona cards ───────────────────────── */}
      <section className="section">
        <div className="section-head narrow" style={{ marginBottom: "32px" }}>
          <div>
            <span style={KICKER}>See what Compass can do</span>
            <h2>Built for everyone in the room.</h2>
          </div>
          <p style={{ color: "var(--muted)", fontSize: "0.98rem", lineHeight: 1.55 }}>
            Compass personalises differently for every attendee. These composite profiles
            show what a strong signal looks like in practice.
          </p>
        </div>
        <div className="story-grid">
          {PERSONAS.map(p => (
            <article key={p.name} className="story-card">
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", marginBottom: "16px" }}>
                <div>
                  <p style={{ fontSize: "1.2rem", fontWeight: 600, letterSpacing: "-0.02em", margin: "0 0 2px" }}>{p.name}</p>
                  <p style={{ color: "var(--accent)", fontSize: "0.88rem", fontWeight: 540, margin: 0 }}>{p.role}</p>
                </div>
                <span style={{ fontSize: "1.5rem", lineHeight: 1, flexShrink: 0 }} aria-label={p.org}>{p.flag}</span>
              </div>
              <p style={{ color: "var(--muted)", fontSize: "0.82rem", margin: "0 0 12px" }}>{p.org}</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "16px" }}>
                {p.tracks.map(t => (
                  <span key={t} className="chip">{t}</span>
                ))}
                {p.goals.map(g => (
                  <span key={g} className="chip" style={{ borderColor: "transparent", color: "var(--muted)", background: "transparent", paddingLeft: 0 }}>· {g}</span>
                ))}
              </div>
              <p style={{ color: "var(--muted)", fontSize: "0.88rem", lineHeight: 1.5, margin: "0", borderTop: "1px solid var(--line)", paddingTop: "14px" }}>
                {p.compassNote}
              </p>
            </article>
          ))}
        </div>
        <p style={{ color: "var(--muted)", fontSize: "0.76rem", marginTop: "14px", lineHeight: 1.5 }}>
          Composite profiles for illustration. Compass recommendations are computed in real time from your actual profile and the live session catalog.
        </p>
      </section>

      {/* ── Navigate to working pages ─────────────────────────────────────── */}
      <section className="section">
        <div className="section-head narrow" style={{ marginBottom: "24px" }}>
          <div>
            <span style={KICKER}>Navigate</span>
            <h2>Where would you like to go?</h2>
          </div>
        </div>
        <div className="opportunity-grid three">
          {NAV_CARDS.map(card => (
            <article key={card.href} className="opportunity-card">
              <div className="card-meta"><span>{card.label}</span></div>
              <h3>{card.label}</h3>
              <p>{card.body}</p>
              <Link
                href={card.href}
                className="btn-secondary"
                style={{ marginTop: "auto", fontSize: "0.88rem", minHeight: "36px", padding: "0 14px", display: "inline-flex", alignItems: "center", alignSelf: "flex-start" }}
              >
                {card.cta}
              </Link>
            </article>
          ))}
        </div>
      </section>

      {/* ── Final band ────────────────────────────────────────────────────── */}
      <section className="final-band">
        <div>
          {user && enrolled ? (
            <>
              <h2>Your Compass is live.</h2>
              <p>Sessions, Champions, and your personalised plan are ready for you.</p>
            </>
          ) : (
            <>
              <h2>Tell Compass your intent.</h2>
              <p>Once Compass knows what you want from TechXchange, Explore becomes personal.</p>
            </>
          )}
        </div>
        {user && enrolled
          ? <Link href="/experience" className="btn-primary">Open My Compass →</Link>
          : <Link href="/enroll"     className="btn-primary">Build My Compass →</Link>
        }
      </section>
    </>
  );
}
