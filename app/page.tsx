"use client";
// =============================================================================
// EventCompass — Home
// Hero narrative + event story cards + action-inspiring live signals.
// =============================================================================
import { useEffect, useState } from "react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { getDocs, collection } from "firebase/firestore";

const BASE = "organizations/ibm/events/txc2026";
type RawDoc = Record<string, unknown>;

interface HomeSignals {
  attendees: number;
  champions: number;
  sessions: number;
  connectionIntent: number;
  aiDemand: number;
  cloudDemand: number;
  communityDemand: number;
}

const STORY_CARDS = [
  {
    id: "community",
    kicker: "Community",
    title: "Find your people before the week begins.",
    body: "Alumni circles, partner programs, and shared interests already shaping the room.",
    cta: "See the pulse",
    href: "/pulse",
    imageClass: "event-story-image event-story-image--community",
    imageComment: "IMAGE: /public/event/community.jpg — Community programs at TechXchange",
    stat: (s: HomeSignals) => s.communityDemand,
    statLabel: "community signals",
  },
  {
    id: "champions",
    kicker: "Champions",
    title: "Expert access, on your terms.",
    body: "IBM Champions bring domain depth — Compass matches them to your tracks and goals.",
    cta: "Meet champions",
    href: "/champions",
    imageClass: "event-story-image event-story-image--champions",
    imageComment: "IMAGE: /public/event/champions.jpg — IBM Champions at TechXchange",
    stat: (s: HomeSignals) => s.champions,
    statLabel: "champions in the room",
  },
  {
    id: "main-stage",
    kicker: "Main stage",
    title: "Shared moments that anchor the week.",
    body: "Keynotes, announcements, and the experiences everyone will be talking about.",
    cta: "Browse sessions",
    href: "/sessions",
    imageClass: "event-story-image event-story-image--main-stage",
    imageComment: "IMAGE: /public/event/main-stage.jpg — Main stage at TechXchange",
    stat: (s: HomeSignals) => s.sessions,
    statLabel: "sessions indexed",
  },
  {
    id: "meetings",
    kicker: "1:1 meetings",
    title: "Conversations worth having.",
    body: "Meet the Expert sessions and champion meetings Compass surfaces for your intent.",
    cta: "Build My Compass",
    href: "/enroll",
    imageClass: "event-story-image event-story-image--meetings",
    imageComment: "IMAGE: /public/event/meetings.jpg — 1:1 expert meetings at TechXchange",
    stat: (s: HomeSignals) => s.connectionIntent,
    statLabel: "open to connecting",
  },
] as const;

function inc(map: Record<string, number>, key: unknown) {
  const k = String(key ?? "").trim();
  if (!k) return;
  map[k] = (map[k] ?? 0) + 1;
}

export default function HomePage() {
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

        const groups: Record<string, number> = {};
        let connectionIntent = 0;

        for (const d of partSnap.docs) {
          const p = d.data() as RawDoc;
          const esp = (p.event_signal_profile as Record<string, unknown>) ?? {};
          ((esp.tech_tracks as string[]) ?? []).forEach(t => inc(groups, t));
          const ni = (p.networking_identity as Record<string, boolean>) ?? {};
          if (ni.open_to_alumni_connections) connectionIntent++;
          if (ni.open_to_past_colleague_connections) connectionIntent++;
          if (ni.open_to_university_connections) connectionIntent++;
          if (ni.open_to_career_conversations) connectionIntent++;
        }

        const countGroup = (needle: string) =>
          Object.entries(groups).reduce(
            (sum, [k, v]) => sum + (k.toLowerCase().includes(needle.toLowerCase()) ? v : 0),
            0
          );

        setSignals({
          attendees: partSnap.size,
          champions: champSnap.size,
          sessions: sessSnap.size,
          connectionIntent,
          aiDemand: countGroup("ai"),
          cloudDemand: countGroup("cloud"),
          communityDemand: countGroup("community") + countGroup("champion"),
        });
      } catch {
        setSignals(null);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const s = signals ?? {
    attendees: 0,
    champions: 0,
    sessions: 0,
    connectionIntent: 0,
    aiDemand: 0,
    cloudDemand: 0,
    communityDemand: 0,
  };

  const actionMetrics = [
    { label: "Attendees in the room", val: loading ? "…" : s.attendees, show: s.attendees > 0 },
    { label: "Champions available", val: loading ? "…" : s.champions, show: s.champions > 0 },
    { label: "Sessions to explore", val: loading ? "…" : s.sessions, show: s.sessions > 0 },
    { label: "Connection intent signals", val: loading ? "…" : s.connectionIntent, show: s.connectionIntent > 0 },
    { label: "AI track demand", val: loading ? "…" : s.aiDemand, show: s.aiDemand > 0 },
    { label: "Cloud track demand", val: loading ? "…" : s.cloudDemand, show: s.cloudDemand > 0 },
    { label: "Community demand", val: loading ? "…" : s.communityDemand, show: s.communityDemand > 0 },
  ].filter(m => m.show || loading);

  return (
    <>
      <section className="hero-shell hero-shell--home">
        <div className="hero-copy">
          <span className="eyebrow">IBM TechXchange 2026</span>
          <h1>See who is here, what is moving, and where opportunities are forming.</h1>
          <p>
            Compass turns attendee intent, sessions, champions, and community signals
            into a personal path through Community, Learning, and Fun.
          </p>
          <div className="hero-actions">
            <Link href="/enroll" className="btn-primary">Build My Compass</Link>
            <Link href="/pulse" className="btn-secondary">See the pulse</Link>
          </div>
        </div>
      </section>

      {/* Event story rotator — image-ready placeholders; swap in /public/event/*.jpg when available */}
      <section className="story-section no-top-border">
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
              {/* {card.imageComment} */}
              <div className={card.imageClass} role="img" aria-label={`${card.kicker} at TechXchange`} />
              <div className="event-story-card-body">
                <span className="section-kicker">{card.kicker}</span>
                <p className="event-story-stat">
                  {loading ? "…" : card.stat(s)} <span>{card.statLabel}</span>
                </p>
                <h3>{card.title}</h3>
                <p>{card.body}</p>
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
                <p className="event-story-stat">
                  {loading ? "…" : card.stat(s)} <span>{card.statLabel}</span>
                </p>
                <h3>{card.title}</h3>
                <Link href={card.href} className="action-chip">{card.cta} →</Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      {actionMetrics.length > 0 && (
        <section className="story-section">
          <div className="story-head">
            <div className="section-kicker">Live signals</div>
            <h2>What is already taking shape.</h2>
            <p className="story-lead">
              Aggregate counts from the room — enough to inspire your next move, never dashboard clutter.
            </p>
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

      <section className="section">
        <div className="section-head">
          <div>
            <div className="section-kicker">Compass experience</div>
            <h2>Not another event catalog.</h2>
          </div>
          <p>
            EventCompass turns goals, sessions, people, and community moments
            into one living experience you can act on.
          </p>
        </div>
        <div className="opportunity-grid three">
          <article className="opportunity-card">
            <div className="card-meta"><span>01</span><b>Learning</b></div>
            <h3>Sessions ranked for your intent.</h3>
            <p>Labs, breakouts, and certifications scored against your tracks and goals.</p>
            <Link href="/sessions" className="action-chip">Browse sessions →</Link>
          </article>
          <article className="opportunity-card">
            <div className="card-meta"><span>02</span><b>Community</b></div>
            <h3>People worth finding.</h3>
            <p>Champions, alumni, and peers matched to your background and interests.</p>
            <Link href="/explore" className="action-chip">Explore the room →</Link>
          </article>
          <article className="opportunity-card">
            <div className="card-meta"><span>03</span><b>Fun</b></div>
            <h3>Moments that anchor the week.</h3>
            <p>Keynotes, receptions, and shared experiences at the right time.</p>
            <Link href="/experience" className="action-chip">Open My Compass →</Link>
          </article>
        </div>
      </section>
    </>
  );
}
