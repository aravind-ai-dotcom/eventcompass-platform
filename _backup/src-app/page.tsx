// =============================================================================
// EventCompass — Landing Page  /
//
// Branded landing page only. No Firestore reads.
// All scoring and recommendation logic lives at /experience.
//
// Sections:
//   1. Hero          — brand, tagline, primary CTA to /experience
//   2. Signal panel  — static value props (no live counts here)
//   3. Three pillars — Community / Learning / Fun
//   4. How it works  — three-step explanation
//   5. Final CTA     — secondary push to /experience
// =============================================================================

import Link from "next/link";

// ── Static content ─────────────────────────────────────────────────────────────
// No Firestore. No async. This page is a pure Server Component.

const PILLARS = [
  {
    number: "01",
    title: "Community",
    body: "Find peers, alumni, former colleagues, and IBM Champions who share your context. Compass surfaces who is already in the room before you arrive.",
  },
  {
    number: "02",
    title: "Learning",
    body: "Labs, workshops, certifications, and technical breakouts matched to your goals and tech tracks. No more scanning a 400-session catalog blind.",
  },
  {
    number: "03",
    title: "Fun",
    body: "Demos, main stage moments, awards, and social experiences that make the week worth the trip. Compass keeps the full picture in view.",
  },
] as const;

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Tell Compass your intent",
    body: "Share your goals, tech tracks, role, and what you want to give and get. Compass turns those signals into a matching profile.",
  },
  {
    step: "02",
    title: "Compass scores your matches",
    body: "Every session and Champion is scored against your profile in real time — track, goal, need, role, industry, and keyword alignment.",
  },
  {
    step: "03",
    title: "Follow your experience",
    body: "Your Experience page shows your top matches by pillar, your next best move, and the people you should meet.",
  },
] as const;

// ── Page ───────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <>
      {/* ── 1. Hero ───────────────────────────────────────────────────────── */}
      <section className="hero-shell">
        <div className="hero-copy">
          <div className="eyebrow">IBM TechXchange 2026 · Atlanta</div>

          <h1>
            Find your people,
            <br />
            your sessions,
            <br />
            and your opportunities.
          </h1>

          <p>
            Compass is an AI-powered event intelligence platform. It turns a
            four-day conference into a focused, personal experience built around
            what matters to you.
          </p>

          <p className="pillar-line">
            TechXchange brings together <strong>Community</strong>,{" "}
            <strong>Learning</strong>, and <strong>Fun</strong> — Compass helps
            you find all three.
          </p>

          <div className="hero-actions">
            <Link href="/experience" className="btn-primary">
              Open My Compass
            </Link>
            <Link href="/sessions" className="btn-secondary">
              Browse sessions
            </Link>
          </div>
        </div>

        {/* ── Signal panel — static value props ──────────────────────────── */}
        <aside className="signal-panel">
          <span className="panel-label">AI-Powered Event Intelligence</span>
          <h2>Your week, shaped around what matters to you.</h2>
          <div className="metrics-list">
            <div>
              <strong>Dynamic</strong>
              <span>recommendations, never static lists</span>
            </div>
            <div>
              <strong>3 pillars</strong>
              <span>Community · Learning · Fun</span>
            </div>
            <div>
              <strong>Real-time</strong>
              <span>scores from live Firestore data</span>
            </div>
            <div>
              <strong>Consent-first</strong>
              <span>your data, your control</span>
            </div>
          </div>
        </aside>
      </section>

      {/* ── 2. Three pillars ──────────────────────────────────────────────── */}
      <section className="section no-top-border">
        <div className="section-head">
          <div>
            <div className="section-kicker">The Compass experience</div>
            <h2>Three pillars. One week.</h2>
          </div>
          <p>
            Compass organises your TechXchange experience into three dimensions
            so no part of the event goes unnoticed.
          </p>
        </div>

        <div className="experience-strip">
          {PILLARS.map((pillar) => (
            <article key={pillar.number}>
              <span
                style={{
                  fontFamily: "var(--font-mono, ui-monospace)",
                  color: "var(--accent)",
                  fontSize: "0.78rem",
                }}
              >
                {pillar.number}
              </span>
              <h3>{pillar.title}</h3>
              <p>{pillar.body}</p>
            </article>
          ))}

          {/* Fourth tile — accent CTA */}
          <article
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-end",
              background: "var(--accent)",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-mono, ui-monospace)",
                color: "var(--accent-text)",
                fontSize: "0.78rem",
                opacity: 0.7,
              }}
            >
              04
            </span>
            <h3 style={{ color: "var(--accent-text)", margin: "36px 0 12px" }}>
              Your Compass
            </h3>
            <p
              style={{
                color: "var(--accent-text)",
                opacity: 0.85,
                margin: "0 0 20px",
                fontSize: "0.95rem",
                lineHeight: 1.5,
              }}
            >
              Personalised to your profile, goals, and the signals you share.
            </p>
            <Link
              href="/experience"
              style={{
                display: "inline-flex",
                alignItems: "center",
                color: "var(--accent-text)",
                fontWeight: 650,
                fontSize: "0.9rem",
              }}
            >
              Open My Compass →
            </Link>
          </article>
        </div>
      </section>

      {/* ── 3. How it works ───────────────────────────────────────────────── */}
      <section className="section">
        <div className="section-head">
          <div>
            <div className="section-kicker">How Compass works</div>
            <h2>Intent in. Experience out.</h2>
          </div>
          <p>
            Compass reads your goals, tracks, role, and keywords — then scores
            every session and Champion against your profile dynamically. No
            static recommendations. No generic lists.
          </p>
        </div>

        <div className="opportunity-grid three">
          {HOW_IT_WORKS.map((item) => (
            <article key={item.step} className="opportunity-card">
              <div className="card-meta">
                <span
                  style={{
                    fontFamily: "var(--font-mono, ui-monospace)",
                    color: "var(--accent)",
                    fontSize: "0.78rem",
                  }}
                >
                  Step {item.step}
                </span>
              </div>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ── 4. Final CTA ──────────────────────────────────────────────────── */}
      <section className="final-band">
        <div>
          <span className="section-kicker">EventCompass</span>
          <h2>Your Compass is ready.</h2>
          <p>
            Sessions, Champions, and moments are ranked dynamically from your
            profile. Open your Compass to see your personalised TechXchange
            experience.
          </p>
        </div>
        <Link href="/experience" className="btn-primary">
          Open My Compass
        </Link>
      </section>
    </>
  );
}
