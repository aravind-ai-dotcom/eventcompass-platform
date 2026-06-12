"use client";
// =============================================================================
// EventCompass — Explore  /explore
// Mobile-first story layout: four experience pillars, room intelligence,
// synthetic persona examples. Live Firestore aggregation preserved.
// =============================================================================
import { useEffect, useMemo, useState } from "react";
import { db } from "@/lib/firebase";
import { getDocs, collection } from "firebase/firestore";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import type { CSSProperties } from "react";

const BASE = "organizations/ibm/events/txc2026";
type RawDoc = Record<string, unknown>;

const FLAG_MAP: Record<string, string> = {
  "united states": "🇺🇸", usa: "🇺🇸", us: "🇺🇸",
  "united kingdom": "🇬🇧", uk: "🇬🇧", gb: "🇬🇧", "great britain": "🇬🇧",
  canada: "🇨🇦", ca: "🇨🇦",
  germany: "🇩🇪", de: "🇩🇪",
  australia: "🇦🇺", au: "🇦🇺",
  india: "🇮🇳", in: "🇮🇳",
  france: "🇫🇷", fr: "🇫🇷",
  brazil: "🇧🇷", br: "🇧🇷",
  netherlands: "🇳🇱", nl: "🇳🇱", "the netherlands": "🇳🇱",
  spain: "🇪🇸", es: "🇪🇸",
  italy: "🇮🇹", it: "🇮🇹",
  japan: "🇯🇵", jp: "🇯🇵",
  china: "🇨🇳", cn: "🇨🇳",
  singapore: "🇸🇬", sg: "🇸🇬",
  mexico: "🇲🇽", mx: "🇲🇽",
  sweden: "🇸🇪", se: "🇸🇪",
  norway: "🇳🇴", no: "🇳🇴",
  denmark: "🇩🇰", dk: "🇩🇰",
  finland: "🇫🇮", fi: "🇫🇮",
  "south africa": "🇿🇦", za: "🇿🇦",
  "new zealand": "🇳🇿", nz: "🇳🇿",
  ireland: "🇮🇪", ie: "🇮🇪",
  poland: "🇵🇱", pl: "🇵🇱",
  switzerland: "🇨🇭", ch: "🇨🇭",
  portugal: "🇵🇹", pt: "🇵🇹",
  belgium: "🇧🇪", be: "🇧🇪",
  austria: "🇦🇹", at: "🇦🇹",
  ukraine: "🇺🇦", ua: "🇺🇦",
  israel: "🇮🇱", il: "🇮🇱",
  uae: "🇦🇪", "united arab emirates": "🇦🇪", ae: "🇦🇪",
  argentina: "🇦🇷", ar: "🇦🇷",
  colombia: "🇨🇴", co: "🇨🇴",
  chile: "🇨🇱", cl: "🇨🇱",
  kenya: "🇰🇪", ke: "🇰🇪",
  nigeria: "🇳🇬", ng: "🇳🇬",
  egypt: "🇪🇬", eg: "🇪🇬",
  indonesia: "🇮🇩", id: "🇮🇩",
  malaysia: "🇲🇾", my: "🇲🇾",
  thailand: "🇹🇭", th: "🇹🇭",
  philippines: "🇵🇭", ph: "🇵🇭",
  pakistan: "🇵🇰", pk: "🇵🇰",
  bangladesh: "🇧🇩", bd: "🇧🇩",
  "sri lanka": "🇱🇰", lk: "🇱🇰",
};

function countryFlag(country: string): string {
  return FLAG_MAP[country.toLowerCase().trim()] ?? "🌍";
}

function inc(map: Record<string, number>, key: unknown) {
  const k = String(key ?? "").trim();
  if (!k) return;
  map[k] = (map[k] ?? 0) + 1;
}

function top(map: Record<string, number>, n = 6) {
  return Object.entries(map).sort(([, a], [, b]) => b - a).slice(0, n);
}

interface RoomData {
  countries: Record<string, number>;
  universities: Record<string, number>;
  employers: Record<string, number>;
  groups: Record<string, number>;
}

interface SyntheticPersona {
  name: string;
  role: string;
  location: string;
  flag: string;
  needs: [string, string, string];
  compassHelp: string;
}

const EXPERIENCE_PILLARS = [
  {
    picto: "community" as const,
    title: "Community",
    body: "Alumni circles, partner programs, and shared goals forming before the week begins.",
  },
  {
    picto: "learning" as const,
    title: "Learning",
    body: "Labs, certifications, and technical breakouts matched to what you came to build.",
  },
  {
    picto: "networking" as const,
    title: "Networking",
    body: "Past colleagues, university peers, and career conversations waiting in the room.",
  },
  {
    picto: "fun" as const,
    title: "Fun",
    body: "Keynotes, celebrations, and shared moments that anchor the week together.",
  },
];

const KICKER: CSSProperties = {
  color: "var(--accent)",
  fontSize: "0.72rem",
  fontWeight: 680,
  textTransform: "uppercase",
  letterSpacing: "0.12em",
  display: "block",
  marginBottom: "6px",
};

function CarbonPicto({ type }: { type: "community" | "learning" | "networking" | "fun" }) {
  const icons: Record<string, React.ReactNode> = {
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
    learning: (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M18 8v16L8 38a2 2 0 001.7 3h26.6A2 2 0 0038 38L28 24V8" />
        <line x1="16" y1="8" x2="32" y2="8" />
        <circle cx="20" cy="32" r="2" fill="currentColor" stroke="none" />
        <circle cx="28" cy="36" r="1.5" fill="currentColor" stroke="none" />
      </svg>
    ),
    networking: (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <circle cx="24" cy="16" r="7" />
        <path d="M10 40c0-7.7 6.3-14 14-14s14 6.3 14 14" />
        <circle cx="36" cy="14" r="4" />
        <path d="M40 28c2.2 1.6 4 4.4 4 8" />
      </svg>
    ),
    fun: (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <rect x="4" y="8" width="40" height="26" rx="1" />
        <line x1="16" y1="40" x2="32" y2="40" />
        <line x1="24" y1="34" x2="24" y2="40" />
        <polyline points="18,24 24,18 30,24" />
        <line x1="24" y1="18" x2="24" y2="30" />
      </svg>
    ),
  };
  return <div className="carbon-picto">{icons[type]}</div>;
}

function InsightBlock({
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
    <div className="story-card">
      <p className="insight-block-title">{title}</p>
      <div className="insight-list">
        {rows.map(([name, count]) => (
          <div key={name} className="insight-list-item insight-list-item-quiet">
            <span>{renderLabel ? renderLabel(name) : name}</span>
            <b>{count}</b>
          </div>
        ))}
      </div>
    </div>
  );
}

function buildPersonas(room: RoomData | null): SyntheticPersona[] {
  const topCountry = top(room?.countries ?? {}, 1)[0];
  const topUni = top(room?.universities ?? {}, 1)[0];
  const topEmployer = top(room?.employers ?? {}, 1)[0];
  const topGroups = top(room?.groups ?? {}, 3).map(([g]) => g);

  const countryName = topCountry?.[0] ?? "United States";
  const uniName = topUni?.[0] ?? "NC State University";
  const employerName = topEmployer?.[0] ?? "IBM";
  const trackA = topGroups[0] ?? "Cloud";
  const trackB = topGroups[1] ?? "AI";
  const trackC = topGroups[2] ?? "Community";

  return [
    {
      name: "Aisha Mensah",
      role: "Cloud Platform Engineer",
      location: countryName,
      flag: countryFlag(countryName),
      needs: [`${trackA} deep dives`, "Alumni connections", "Hands-on labs"],
      compassHelp: `Compass would help this attendee find ${trackA} sessions, surface ${employerName} alumni in the room, and match Champions in their domain.`,
    },
    {
      name: "Lucas Fernández",
      role: "Solutions Architect",
      location: "Germany",
      flag: countryFlag("Germany"),
      needs: [`${trackB} workshops`, "University peers", "Career conversations"],
      compassHelp: `Compass would help this attendee reconnect with ${uniName} alumni, prioritise ${trackB} learning paths, and flag networking moments worth their time.`,
    },
    {
      name: "Mei Chen",
      role: "Data & AI Lead",
      location: "Singapore",
      flag: countryFlag("Singapore"),
      needs: [`${trackC} programs`, "Past colleagues", "Certification paths"],
      compassHelp: `Compass would help this attendee balance ${trackC} community time with scored sessions from former ${employerName} colleagues already attending.`,
    },
    {
      name: "Jordan Okonkwo",
      role: "Technical Practitioner",
      location: "Canada",
      flag: countryFlag("Canada"),
      needs: ["Peer networking", `${trackA} & ${trackB}`, "Expert access"],
      compassHelp: "Compass would help this attendee turn a crowded catalog into a focused four-day path shaped by their goals and the people already in the room.",
    },
  ];
}

export default function ExplorePage() {
  const { user, enrolled } = useAuth();
  const [room, setRoom] = useState<RoomData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDocs(collection(db, `${BASE}/participants`))
      .then(snap => {
        const countries: Record<string, number> = {};
        const universities: Record<string, number> = {};
        const employers: Record<string, number> = {};
        const groups: Record<string, number> = {};

        for (const d of snap.docs) {
          const p = d.data() as RawDoc;
          inc(countries, p.country ?? p.geo ?? "");
          const edu = (p.education as Array<Record<string, unknown>>) ?? [];
          for (const e of edu) if (e.institution) inc(universities, e.institution);
          const emp = (p.past_employers as Array<Record<string, unknown>>) ?? [];
          for (const e of emp) if (e.company) inc(employers, e.company);
          const esp = (p.event_signal_profile as Record<string, unknown>) ?? {};
          ((esp.tech_tracks as string[]) ?? []).forEach(t => inc(groups, t));
          ((esp.roles_at_txc as string[]) ?? []).forEach(r => inc(groups, r));
          ((p.career_interests as string[]) ?? []).forEach(c => inc(groups, c));
        }

        setRoom({ countries, universities, employers, groups });
      })
      .catch(() => setRoom({ countries: {}, universities: {}, employers: {}, groups: {} }))
      .finally(() => setLoading(false));
  }, []);

  const personas = useMemo(() => buildPersonas(room), [room]);

  const hasRoomData =
    room &&
    (Object.keys(room.countries).length > 0 ||
      Object.keys(room.universities).length > 0 ||
      Object.keys(room.employers).length > 0 ||
      Object.keys(room.groups).length > 0);

  return (
    <>
      <section className="story-hero">
        <div className="section-kicker">Explore</div>
        <h1>Different attendees need different weeks.</h1>
        <p>
          Compass helps each person turn the same event into a personal path through
          Community, Learning and Fun.
        </p>
      </section>

      <section className="story-section no-top-border">
        <div className="story-head">
          <span style={KICKER}>Experience pillars</span>
          <h2>Four ways to spend your time.</h2>
        </div>
        <div className="story-grid">
          {EXPERIENCE_PILLARS.map(p => (
            <article key={p.title} className="story-card story-card-large">
              <CarbonPicto type={p.picto} />
              <h3 className="story-card-title">{p.title}</h3>
              <p className="story-card-body">{p.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="story-section">
        <div className="story-head">
          <span style={KICKER}>Room intelligence</span>
          <h2>Look who is already in the room.</h2>
          <p className="story-lead">
            Compass reveals the countries, universities, past employers, and interest groups
            shaping the room before you even arrive.
          </p>
        </div>

        {loading && (
          <p style={{ color: "var(--muted)", fontSize: "0.92rem" }}>Reading attendee signals…</p>
        )}

        {!loading && !hasRoomData && (
          <p style={{ color: "var(--muted)", fontSize: "0.92rem", lineHeight: 1.55 }}>
            Room signals will appear here as attendees build their Compass profiles.
          </p>
        )}

        {!loading && hasRoomData && room && (
          <div className="story-grid">
            <InsightBlock
              title="Countries"
              rows={top(room.countries, 6)}
              renderLabel={name => (
                <>
                  <span aria-hidden="true">{countryFlag(name)}</span> {name}
                </>
              )}
            />
            <InsightBlock title="Universities" rows={top(room.universities, 6)} />
            <InsightBlock title="Former employers" rows={top(room.employers, 6)} />
            <InsightBlock title="Groups" rows={top(room.groups, 6)} />
          </div>
        )}

        {!loading && hasRoomData && (
          <p className="story-note">
            Aggregate counts only. No individual attendee information is shown.{" "}
            <Link href="/enroll" style={{ color: "var(--accent)" }}>Add your background →</Link>
          </p>
        )}
      </section>

      <section className="story-section">
        <div className="story-head">
          <span style={KICKER}>See what Compass can do</span>
          <h2>Built for everyone in the room.</h2>
          <p className="story-lead">
            Composite profiles inspired by patterns in the room — not real attendees.
            Each shows how Compass turns signals into a personal path.
          </p>
        </div>
        <div className="story-grid">
          {personas.map(p => (
            <article key={p.name} className="story-card story-card-large">
              <div className="persona-top">
                <div>
                  <h3 className="story-card-title">{p.name}</h3>
                  <p className="persona-role">{p.role}</p>
                </div>
                <span aria-label={p.location}>{p.flag}</span>
              </div>
              <ul className="reason-list" style={{ marginBottom: "16px" }}>
                {p.needs.map(n => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
              <p className="story-card-body" style={{ borderTop: "1px solid var(--line)", paddingTop: "14px", margin: 0 }}>
                {p.compassHelp}
              </p>
            </article>
          ))}
        </div>
        <p className="story-note">
          Synthetic examples for illustration. Your Compass is computed from your profile and the live catalog.
        </p>
      </section>

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
        {user && enrolled ? (
          <Link href="/experience" className="btn-primary">Open My Compass →</Link>
        ) : (
          <Link href="/enroll" className="btn-primary">Build My Compass →</Link>
        )}
      </section>
    </>
  );
}
