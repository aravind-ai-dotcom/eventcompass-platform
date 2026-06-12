"use client";
// =============================================================================
// EventCompass — Home
// Hero narrative + event story cards + action-inspiring live signals.
// =============================================================================
import { useEffect, useState } from "react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { getDocs, collection } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";

const BASE = "organizations/ibm/events/txc2026";
type RawDoc = Record<string, unknown>;

interface HomeSignals {
  attendees: number;
  champions: number;
  sessions: number;
  connectionIntent: number;
}

const STORY_CARDS = [
  {
    id: "community",
    kicker: "Community",
    title: "Shared interests forming before the week begins.",
    insight: "Community meetups and conversations across the event.",
    cta: "See the pulse",
    href: "/pulse",
    imageClass: "event-story-image event-story-image--community",
    stat: (s: HomeSignals) => s.attendees,
    statLabel: "attendee signals in the room",
  },
  {
    id: "champions",
    kicker: "Champions",
    title: "Experts sharing real-world experience.",
    insight: "IBM Champions bring domain depth across every track.",
    cta: "Meet champions",
    href: "/champions",
    imageClass: "event-story-image event-story-image--champions",
    stat: (s: HomeSignals) => s.champions,
    statLabel: "champions available",
  },
  {
    id: "main-stage",
    kicker: "Main stage",
    title: "Keynotes, launches, and industry insights.",
    insight: "The shared moments that anchor the week together.",
    cta: "Browse sessions",
    href: "/sessions",
    imageClass: "event-story-image event-story-image--main-stage",
    stat: (s: HomeSignals) => s.sessions,
    statLabel: "sessions indexed",
  },
  {
    id: "meetings",
    kicker: "1:1 connections",
    title: "Opportunities to meet peers and mentors.",
    insight: "Meet the Expert sessions and champion conversations.",
    cta: "Build My Compass",
    href: "/enroll",
    imageClass: "event-story-image event-story-image--meetings",
    stat: (s: HomeSignals) => s.connectionIntent,
    statLabel: "open to connecting",
  },
] as const;

function inc(map: Record<string, number>, key: unknown) {
  const k = String(key ?? "").trim();
  if (!k) return;
  map[k] = (map[k] ?? 0) + 1;
}

function StatLine({ loading, value, label, insight }: { loading: boolean; value: number; label: string; insight: string }) {
  if (loading) return <p className="event-story-stat">…</p>;
  if (value > 0) {
    return (
      <p className="event-story-stat">
        {value} <span>{label}</span>
      </p>
    );
  }
  return <p className="event-story-insight">{insight}</p>;
}

export default function HomePage() {
  const { enrolled } = useAuth();
  const [activeSlide, setActiveSlide] = useState(0);
  const [signals, setSignals] = useState<HomeSignals | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide(i => (i + 1) % STORY_CARDS.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const [sessSnap, champSnap, partSnap] = await Promise.all([
          getDocs(collection(db, `${BASE}/sessions`)),
          getDocs(collection(db, `${BASE}/champions`)),
          getDocs(collection(db, `${BASE}/participants`)),
        ]);

        let connectionIntent = 0;
        for (const d of partSnap.docs) {
          const p = d.data() as RawDoc;
          const ni = (p.networking_identity as Record<string, boolean>) ?? {};
          if (ni.open_to_alumni_connections) connectionIntent++;
          if (ni.open_to_past_colleague_connections) connectionIntent++;
          if (ni.open_to_university_connections) connectionIntent++;
          if (ni.open_to_career_conversations) connectionIntent++;
        }

        setSignals({
          attendees: partSnap.size,
          champions: champSnap.size,
          sessions: sessSnap.size,
          connectionIntent,
        });
      } catch {
        setSignals(null);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const s = signals ?? { attendees: 0, champions: 0, sessions: 0, connectionIntent: 0 };

  const actionMetrics = [
    { label: "Attendees in the room", val: loading ? "…" : s.attendees, show: s.attendees > 0 },
    { label: "Champions available", val: loading ? "…" : s.champions, show: s.champions > 0 },
    { label: "Sessions to explore", val: loading ? "…" : s.sessions, show: s.sessions > 0 },
    { label: "Connection intent signals", val: loading ? "…" : s.connectionIntent, show: s.connectionIntent > 0 },
  ].filter(m => m.show);

  return (
    <>
      <section className="hero-shell hero-shell--home">
        <div className="hero-copy">
          <span className="eyebrow">IBM TechXchange 2026</span>
          <h1>See who is here, what is moving, and where opportunities are forming.</h1>
          <p>
            Compass connects learning, community, and connections into a meaningful
            event experience — shaped by the people and sessions already in the room.
          </p>
          <div className="hero-actions">
            <Link href="/enroll" className="btn-primary">Build My Compass</Link>
            <Link href="/pulse" className="btn-secondary">See the pulse</Link>
          </div>
        </div>
      </section>

      <section className="story-section story-section--compact no-top-border">
        <div className="story-head">
          <div className="section-kicker">The week ahead</div>
          <h2>Four ways the event comes alive.</h2>
        </div>

        <div className="event-story-rotator" aria-live="polite">
          {STORY_CARDS.map((card, idx) => (
            <article
              key={card.id}
              className={`event-story-card${idx === activeSlide ? " is-active" : ""}`}
              aria-hidden={idx !== activeSlide}
            >
              {/* IMAGE: /public/event/{card.id}.jpg */}
              <div className={card.imageClass} role="img" aria-label={`${card.kicker} at TechXchange`} />
              <div className="event-story-card-body">
                <span className="section-kicker">{card.kicker}</span>
                <StatLine loading={loading} value={card.stat(s)} label={card.statLabel} insight={card.insight} />
                <h3>{card.title}</h3>
                <Link href={card.href} className="action-chip">{card.cta} →</Link>
              </div>
            </article>
          ))}
        </div>

        <div className="event-story-dots" role="tablist" aria-label="Event story slides">
          {STORY_CARDS.map((card, idx) => (
            <button
              key={card.id}
              type="button"
              role="tab"
              aria-selected={idx === activeSlide}
              aria-label={`Show ${card.kicker}`}
              className={idx === activeSlide ? "is-active" : ""}
              onClick={() => setActiveSlide(idx)}
            />
          ))}
        </div>

        <div className="event-story-grid">
          {STORY_CARDS.map(card => (
            <article key={card.id} className="event-story-card event-story-card--grid">
              <div className={`${card.imageClass} event-story-image--compact`} role="img" aria-hidden="true" />
              <div className="event-story-card-body">
                <span className="section-kicker">{card.kicker}</span>
                <StatLine loading={loading} value={card.stat(s)} label={card.statLabel} insight={card.insight} />
                <h3>{card.title}</h3>
                <Link href={card.href} className="action-chip">{card.cta} →</Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      {actionMetrics.length > 0 && (
        <section className="story-section story-section--compact">
          <div className="story-head">
            <div className="section-kicker">Live signals</div>
            <h2>What is already taking shape.</h2>
            <p className="story-lead">Aggregate community insights — never individual attendee details.</p>
          </div>
          <div className="action-signal-row">
            {actionMetrics.map(m => (
              <article key={m.label} className="action-signal-card">
                <p className="quiet-count">{m.val}</p>
                <p>{m.label}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="section section--compact">
        <div className="section-head">
          <div>
            <div className="section-kicker">Compass experience</div>
            <h2>Connect goals to what TechXchange offers.</h2>
          </div>
          <p>
            Compass helps attendees turn learning, community, and connections into
            a meaningful event experience.
          </p>
        </div>
        <div className="opportunity-grid three">
          <article className="opportunity-card opportunity-card--compact">
            <div className="card-meta"><span>01</span><b>Learning</b></div>
            <h3>Explore sessions by topic and track.</h3>
            <p>Technical breakouts, certifications, labs, and expert sessions across the catalog.</p>
            <Link href="/sessions" className="action-chip">Browse sessions →</Link>
          </article>
          <article className="opportunity-card opportunity-card--compact">
            <div className="card-meta"><span>02</span><b>Community</b></div>
            <h3>See who is shaping the room.</h3>
            <p>Countries, universities, employers, and interest groups already represented.</p>
            <Link href="/explore" className="action-chip">Explore the room →</Link>
          </article>
          <article className="opportunity-card opportunity-card--compact">
            <div className="card-meta"><span>03</span><b>Fun</b></div>
            <h3>Moments that anchor the week.</h3>
            <p>Keynotes, receptions, and shared experiences across TechXchange.</p>
            <Link href={enrolled ? "/experience" : "/enroll"} className="action-chip">
              {enrolled ? "Open My Compass →" : "Build My Compass →"}
            </Link>
          </article>
        </div>
      </section>
    </>
  );
}
