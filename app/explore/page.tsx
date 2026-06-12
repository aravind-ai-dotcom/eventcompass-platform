"use client";
// =============================================================================
// EventCompass — Explore  /explore
// Intelligence surface: pillar strip, room signals, attendee trend signals.
// Live Firestore aggregation preserved — presentation only.
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

interface ConnectionIntent {
  alumni: number;
  colleagues: number;
  university: number;
  career: number;
}

interface RoomData {
  countries: Record<string, number>;
  universities: Record<string, number>;
  employers: Record<string, number>;
  groups: Record<string, number>;
  connectionIntent: ConnectionIntent;
  participantCount: number;
}

interface TrendSignal {
  kicker: string;
  headline: string;
  detail: string;
  metric: string;
}

const EXPERIENCE_PILLARS = [
  {
    picto: "community" as const,
    title: "Community",
    body: "Alumni, partners, shared interests.",
  },
  {
    picto: "learning" as const,
    title: "Learning",
    body: "Breakouts, labs, expert sessions.",
  },
  {
    picto: "networking" as const,
    title: "Networking",
    body: "Peers, universities, career talks.",
  },
  {
    picto: "fun" as const,
    title: "Fun",
    body: "Keynotes, celebrations, shared moments.",
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
        <rect x="6" y="10" width="36" height="22" rx="1" />
        <path d="M6 32h36" />
        <circle cx="24" cy="21" r="5" />
        <path d="M14 38h20" />
        <path d="M18 38v4M30 38v4" />
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
  return <div className="carbon-picto carbon-picto--sm">{icons[type]}</div>;
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
    <div className="story-card story-card-compact">
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

function buildTrendSignals(room: RoomData | null): TrendSignal[] {
  if (!room || room.participantCount === 0) return [];

  const signals: TrendSignal[] = [];
  const { connectionIntent: ci } = room;

  for (const [name, count] of top(room.groups, 3)) {
    signals.push({
      kicker: "Interest signal",
      headline: `${name} is rising in the room`,
      detail: `${count} attendee${count !== 1 ? "s" : ""} flagged ${name} in their Compass profile.`,
      metric: String(count),
    });
  }

  if (ci.alumni > 0) {
    signals.push({
      kicker: "Connection intent",
      headline: "Alumni reconnections are open",
      detail: `${ci.alumni} attendee${ci.alumni !== 1 ? "s" : ""} signalled openness to alumni connections.`,
      metric: String(ci.alumni),
    });
  }
  if (ci.colleagues > 0) {
    signals.push({
      kicker: "Connection intent",
      headline: "Past colleagues in play",
      detail: `${ci.colleagues} attendee${ci.colleagues !== 1 ? "s" : ""} want to reconnect with former colleagues.`,
      metric: String(ci.colleagues),
    });
  }
  if (ci.university > 0) {
    signals.push({
      kicker: "Connection intent",
      headline: "University networks active",
      detail: `${ci.university} attendee${ci.university !== 1 ? "s" : ""} open to university peer connections.`,
      metric: String(ci.university),
    });
  }
  if (ci.career > 0) {
    signals.push({
      kicker: "Connection intent",
      headline: "Career conversations forming",
      detail: `${ci.career} attendee${ci.career !== 1 ? "s" : ""} signalled interest in career discussions.`,
      metric: String(ci.career),
    });
  }

  const countryCount = Object.keys(room.countries).length;
  if (countryCount > 1) {
    const topCountry = top(room.countries, 1)[0];
    signals.push({
      kicker: "Geography",
      headline: `${countryCount} countries represented`,
      detail: topCountry
        ? `Largest cluster: ${topCountry[0]} (${topCountry[1]} attendee${topCountry[1] !== 1 ? "s" : ""}).`
        : "A globally distributed attendee base is shaping the room.",
      metric: String(countryCount),
    });
  }

  const topEmployer = top(room.employers, 1)[0];
  if (topEmployer && topEmployer[1] >= 2) {
    signals.push({
      kicker: "Employer signal",
      headline: `${topEmployer[0]} alumni in the room`,
      detail: `${topEmployer[1]} attendee${topEmployer[1] !== 1 ? "s" : ""} share a former employer — a natural connection thread.`,
      metric: String(topEmployer[1]),
    });
  }

  const topUni = top(room.universities, 1)[0];
  if (topUni && topUni[1] >= 2) {
    signals.push({
      kicker: "Education signal",
      headline: `${topUni[0]} peers attending`,
      detail: `${topUni[1]} attendee${topUni[1] !== 1 ? "s" : ""} share this university — a ready-made peer circle.`,
      metric: String(topUni[1]),
    });
  }

  return signals.slice(0, 6);
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
        const connectionIntent: ConnectionIntent = {
          alumni: 0,
          colleagues: 0,
          university: 0,
          career: 0,
        };

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

          const ni = (p.networking_identity as Record<string, unknown>) ?? {};
          if (ni.open_to_alumni_connections) connectionIntent.alumni++;
          if (ni.open_to_past_colleague_connections) connectionIntent.colleagues++;
          if (ni.open_to_university_connections) connectionIntent.university++;
          if (ni.open_to_career_conversations) connectionIntent.career++;
        }

        setRoom({
          countries,
          universities,
          employers,
          groups,
          connectionIntent,
          participantCount: snap.size,
        });
      })
      .catch(() =>
        setRoom({
          countries: {},
          universities: {},
          employers: {},
          groups: {},
          connectionIntent: { alumni: 0, colleagues: 0, university: 0, career: 0 },
          participantCount: 0,
        })
      )
      .finally(() => setLoading(false));
  }, []);

  const trendSignals = useMemo(() => buildTrendSignals(room), [room]);

  const hasRoomData =
    room &&
    (Object.keys(room.countries).length > 0 ||
      Object.keys(room.universities).length > 0 ||
      Object.keys(room.employers).length > 0 ||
      Object.keys(room.groups).length > 0);

  return (
    <>
      <section className="story-hero story-hero--strong story-hero--compact">
        <div className="section-kicker">Explore</div>
        <h1>No two TechXchange journeys are the same.</h1>
        <p>
          Compass reads the room — interests, connections, and geography — so you
          can see what is forming before you arrive.
        </p>
      </section>

      <section className="story-section story-section--compact no-top-border">
        <div className="story-head story-head--tight">
          <span style={KICKER}>Experience pillars</span>
          <h2>Four ways to spend your time.</h2>
        </div>
        <div className="pillar-strip">
          {EXPERIENCE_PILLARS.map(p => (
            <article key={p.title} className="pillar-strip-item story-card story-card-compact">
              <CarbonPicto type={p.picto} />
              <h3 className="story-card-title story-card-title--sm">{p.title}</h3>
              <p className="story-card-body story-card-body--sm">{p.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="story-section story-section--compact">
        <div className="story-head story-head--tight">
          <span style={KICKER}>Attendee trend signals</span>
          <h2>What the room is telling us.</h2>
          <p className="story-lead">
            Live aggregate signals from Compass profiles — no individual data shown.
          </p>
        </div>

        {loading && (
          <p style={{ color: "var(--muted)", fontSize: "0.92rem" }}>Reading attendee signals…</p>
        )}

        {!loading && trendSignals.length === 0 && (
          <p style={{ color: "var(--muted)", fontSize: "0.92rem", lineHeight: 1.55 }}>
            Trend signals will appear here as attendees build their Compass profiles.{" "}
            <Link href="/enroll" style={{ color: "var(--accent)" }}>Add your background →</Link>
          </p>
        )}

        {!loading && trendSignals.length > 0 && (
          <div className="trend-signal-grid">
            {trendSignals.map((s, i) => (
              <article key={`${s.headline}-${i}`} className="trend-signal-card">
                <span className="trend-signal-metric">{s.metric}</span>
                <p className="trend-signal-kicker">{s.kicker}</p>
                <h3 className="trend-signal-headline">{s.headline}</h3>
                <p className="trend-signal-detail">{s.detail}</p>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="story-section story-section--compact">
        <div className="story-head story-head--tight">
          <span style={KICKER}>Room breakdown</span>
          <h2>Who is already here.</h2>
        </div>

        {!loading && !hasRoomData && (
          <p style={{ color: "var(--muted)", fontSize: "0.92rem", lineHeight: 1.55 }}>
            Room breakdown will populate as attendee profiles arrive.
          </p>
        )}

        {!loading && hasRoomData && room && (
          <div className="story-grid story-grid--room">
            <InsightBlock
              title="Countries"
              rows={top(room.countries, 5)}
              renderLabel={name => (
                <>
                  <span aria-hidden="true">{countryFlag(name)}</span> {name}
                </>
              )}
            />
            <InsightBlock title="Universities" rows={top(room.universities, 5)} />
            <InsightBlock title="Former employers" rows={top(room.employers, 5)} />
            <InsightBlock title="Interest groups" rows={top(room.groups, 5)} />
          </div>
        )}

        {!loading && hasRoomData && (
          <p className="story-note">
            Aggregate counts only. No individual attendee information is shown.{" "}
            <Link href="/enroll" style={{ color: "var(--accent)" }}>Add your background →</Link>
          </p>
        )}
      </section>

      <section className="final-band">
        <div>
          {user && enrolled ? (
            <>
              <h2>Your Compass is live.</h2>
              <p>Sessions, Champions, and your personalised plan are ready.</p>
            </>
          ) : (
            <>
              <h2>Ready to explore TechXchange?</h2>
              <p>Build My Compass to connect your goals to sessions, champions, and community signals.</p>
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
