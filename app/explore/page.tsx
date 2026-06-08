"use client";
// =============================================================================
// EventCompass — Explore  /explore
// Curated discovery: live counts, four experience types, nav to working pages.
// Placeholder v1 — full implementation in Phase 5 (Communities).
// =============================================================================
import { useEffect, useState } from "react";
import { db } from "../../src/lib/firebase";
import { getDocs, collection } from "firebase/firestore";
import Link from "next/link";

const BASE = "organizations/ibm/events/txc2026";

const STRIPS = [
  { num: "01", title: "Main stage moments",  body: "Keynotes, announcements, awards, and the shared experiences that anchor the week." },
  { num: "02", title: "Hands-on learning",    body: "Instructor-led labs, demos, workshops, and certifications with limited capacity." },
  { num: "03", title: "Expert access",         body: "Meet the Expert sessions, Champion conversations, and smaller technical exchanges." },
  { num: "04", title: "Community energy",      body: "Programs, alumni groups, partner circles, and communities forming around shared goals." },
];

const NAV_CARDS = [
  { href: "/sessions",   label: "Session Guide", body: "Browse all sessions ranked by your Compass score. Filter by track, type, and day.", cta: "Browse sessions" },
  { href: "/experience", label: "My Experience", body: "Your personalised TechXchange — scored sessions, champion matches, Next Best Move.",  cta: "Open My Compass" },
  { href: "/pulse",      label: "Pulse",          body: "Live event signals: trending tracks, active communities, and audience composition.",  cta: "See the pulse" },
];

export default function ExplorePage() {
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
      <section className="compact-hero">
        <div className="section-kicker">Explore</div>
        <h1>Discover what matters at TechXchange.</h1>
        <p>
          Explore sessions, experts, certifications, communities, and experiences
          shaping the week. Compass turns the event into opportunities you can act on.
        </p>
      </section>

      {/* Live counts */}
      <section className="section no-top-border">
        <div className="section-head">
          <div>
            <div className="section-kicker">Event at a glance</div>
            <h2>What is already in the room.</h2>
          </div>
          <p>Live counts from Firestore. Recommendations are computed dynamically.</p>
        </div>
        <div className="pulse-scoreboard">
          <article><span>Sessions indexed</span><b>{counts.sessions || "—"}</b></article>
          <article><span>Champions available</span><b>{counts.champions || "—"}</b></article>
          <article><span>Attendee signals</span><b>{counts.participants || "—"}</b></article>
          <article><span>Experience pillars</span><b>3</b></article>
        </div>
      </section>

      {/* Experience type strip */}
      <section className="section">
        <div className="section-head">
          <div>
            <div className="section-kicker">Worth exploring</div>
            <h2>Four ways to spend your time.</h2>
          </div>
          <p>
            Compass looks across session types, community moments, and expert-led
            experiences so you do not have to start with a blank catalog.
          </p>
        </div>
        <div className="experience-strip">
          {STRIPS.map(s => (
            <article key={s.num}>
              <span style={{ fontFamily: "var(--font-mono,ui-monospace)", color: "var(--accent)", fontSize: "0.78rem" }}>
                {s.num}
              </span>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Navigation cards to working pages */}
      <section className="section">
        <div className="section-head">
          <div>
            <div className="section-kicker">Navigate</div>
            <h2>Where would you like to go?</h2>
          </div>
          <p>Compass has dedicated pages for sessions, your personalised experience, and the live event pulse.</p>
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
                style={{ marginTop: "auto", fontSize: "0.88rem", minHeight: "36px", padding: "0 14px", display: "inline-flex", alignItems: "center" }}
              >
                {card.cta}
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="final-band">
        <div>
          <h2>Tell Compass your intent.</h2>
          <p>Once Compass knows what you want from TechXchange, Explore becomes personal.</p>
        </div>
        <Link href="/enroll" className="btn-primary">Build my Compass</Link>
      </section>
    </>
  );
}
