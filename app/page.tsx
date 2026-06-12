"use client";
// =============================================================================
// EventCompass — Home
// Why attend: imagery-first narrative + belonging signals.
// =============================================================================
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { getDocs, collection } from "firebase/firestore";
import { countryFlag, inc, top } from "@/lib/roomSignals";

const BASE = "organizations/ibm/events/txc2026";
type RawDoc = Record<string, unknown>;

interface HomeSignals {
  attendees: number;
  champions: number;
  sessions: number;
  connectionIntent: number;
}

interface RoomSnapshot {
  countries: Record<string, number>;
  universities: Record<string, number>;
  employers: Record<string, number>;
  communities: Record<string, number>;
}

const STORY_SLIDES = [
  {
    id: "community",
    image: "/event/community.jpg",
    kicker: "Community",
    statKey: "attendees" as const,
    statLabel: "attendees shaping the room",
    sentence: "Shared interests forming before the week begins.",
    href: "/pulse",
    cta: "See the pulse",
  },
  {
    id: "champions",
    image: "/event/champions.jpg",
    kicker: "Champions",
    statKey: "champions" as const,
    statLabel: "experts ready to connect",
    sentence: "IBM Champions bring real-world depth across every track.",
    href: "/champions",
    cta: "Meet champions",
  },
  {
    id: "main-stage",
    image: "/event/main-stage.jpg",
    kicker: "Main stage",
    statKey: "sessions" as const,
    statLabel: "sessions across the week",
    sentence: "Keynotes, launches, and the moments that anchor TechXchange.",
    href: "/sessions",
    cta: "Browse sessions",
  },
  {
    id: "networking",
    image: "/event/networking.jpg",
    kicker: "Networking",
    statKey: "connectionIntent" as const,
    statLabel: "open to meaningful connections",
    sentence: "Peers, mentors, and experts — matched to your goals.",
    href: "/enroll",
    cta: "Build My Compass",
  },
] as const;

function NostalgiaColumn({
  title,
  rows,
  renderLabel,
}: {
  title: string;
  rows: [string, number][];
  renderLabel?: (name: string) => React.ReactNode;
}) {
  if (rows.length === 0) return null;
  return (
    <div className="nostalgia-column">
      <h3 className="nostalgia-column-title">{title}</h3>
      <ul className="nostalgia-column-list">
        {rows.map(([name]) => (
          <li key={name}>{renderLabel ? renderLabel(name) : name}</li>
        ))}
      </ul>
    </div>
  );
}

export default function HomePage() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [signals, setSignals] = useState<HomeSignals | null>(null);
  const [room, setRoom] = useState<RoomSnapshot | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide(i => (i + 1) % STORY_SLIDES.length);
    }, 7000);
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

        const countries: Record<string, number> = {};
        const universities: Record<string, number> = {};
        const employers: Record<string, number> = {};
        const communities: Record<string, number> = {};
        let connectionIntent = 0;

        for (const d of partSnap.docs) {
          const p = d.data() as RawDoc;
          inc(countries, p.country ?? p.geo ?? "");
          const edu = (p.education as Array<Record<string, unknown>>) ?? [];
          for (const e of edu) if (e.institution) inc(universities, e.institution);
          const emp = (p.past_employers as Array<Record<string, unknown>>) ?? [];
          for (const e of emp) if (e.company) inc(employers, e.company);
          const esp = (p.event_signal_profile as Record<string, unknown>) ?? {};
          ((esp.tech_tracks as string[]) ?? []).forEach(t => inc(communities, t));
          ((esp.roles_at_txc as string[]) ?? []).forEach(r => inc(communities, r));
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
        setRoom({ countries, universities, employers, communities });
      } catch {
        setSignals(null);
        setRoom(null);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const s = signals ?? { attendees: 0, champions: 0, sessions: 0, connectionIntent: 0 };
  const slide = STORY_SLIDES[activeSlide];
  const statVal = s[slide.statKey];

  const hasNostalgia = room && (
    Object.keys(room.countries).length > 0 ||
    Object.keys(room.universities).length > 0 ||
    Object.keys(room.employers).length > 0 ||
    Object.keys(room.communities).length > 0
  );

  return (
    <>
      <section className="hero-shell hero-shell--home hero-shell--compact">
        <div className="hero-copy">
          <span className="eyebrow">IBM TechXchange 2026</span>
          <h1 className="home-hero-title">Four days to learn, connect, and advance.</h1>
          <p>
            Compass turns a vast event into a personal path — shaped by the people,
            sessions, and communities already in the room.
          </p>
          <div className="hero-actions">
            <Link href="/enroll" className="btn-primary">Build My Compass</Link>
            <Link href="/explore" className="btn-secondary">Why Compass</Link>
          </div>
        </div>
      </section>

      {hasNostalgia && room && (
        <section className="story-section story-section--compact no-top-border">
          <div className="story-head story-head--tight">
            <div className="section-kicker">Already in the room</div>
            <h2 className="home-section-title">Find your people before you arrive.</h2>
            <p className="story-lead">
              Countries, universities, employers, and communities represented across TechXchange.
            </p>
          </div>
          <div className="nostalgia-grid">
            <NostalgiaColumn
              title="Countries"
              rows={top(room.countries, 5)}
              renderLabel={name => (
                <>
                  <span aria-hidden="true">{countryFlag(name)}</span> {name}
                </>
              )}
            />
            <NostalgiaColumn title="Universities" rows={top(room.universities, 5)} />
            <NostalgiaColumn title="Former employers" rows={top(room.employers, 5)} />
            <NostalgiaColumn title="Communities" rows={top(room.communities, 5)} />
          </div>
          <p className="story-note">
            Aggregate signals only.{" "}
            <Link href="/pulse" style={{ color: "var(--accent)" }}>See the full pulse →</Link>
          </p>
        </section>
      )}

      <section className="story-section story-section--compact">
        <div className="story-head story-head--tight">
          <div className="section-kicker">The week ahead</div>
          <h2 className="home-section-title">Four ways the event comes alive.</h2>
        </div>

        <article className="home-image-band" aria-live="polite">
          <div className="home-image-band-media">
            <Image
              src={slide.image}
              alt=""
              fill
              sizes="(max-width: 768px) 100vw, 60vw"
              priority={activeSlide === 0}
              style={{ objectFit: "cover" }}
            />
          </div>
          <div className="home-image-band-copy">
            <span className="section-kicker">{slide.kicker}</span>
            {!loading && statVal > 0 && (
              <p className="home-image-band-metric">
                {statVal} <span>{slide.statLabel}</span>
              </p>
            )}
            <p className="home-image-band-sentence">{slide.sentence}</p>
            <Link href={slide.href} className="btn-secondary">{slide.cta} →</Link>
          </div>
        </article>

        <div className="event-story-dots" role="tablist" aria-label="Event story slides">
          {STORY_SLIDES.map((item, idx) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={idx === activeSlide}
              aria-label={`Show ${item.kicker}`}
              className={idx === activeSlide ? "is-active" : ""}
              onClick={() => setActiveSlide(idx)}
            />
          ))}
        </div>
      </section>

      <section className="final-band">
        <div>
          <h2>Your TechXchange path starts here.</h2>
          <p>Tell Compass what matters — learning, certification, community, or connections.</p>
        </div>
        <Link href="/enroll" className="btn-primary">Build My Compass →</Link>
      </section>
    </>
  );
}
