"use client";
// =============================================================================
// EventCompass — Pulse  /pulse
// Event intelligence story: connection intent, relationship signals,
// communities, and learning topics. Aggregate Firestore data only.
// =============================================================================
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { getDocs, collection } from "firebase/firestore";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

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

interface PulseData {
  primaryTracks: Record<string, number>;
  topics: Record<string, number>;
  championDomains: Record<string, number>;
  topCountries: Record<string, number>;
  topUniversities: Record<string, number>;
  topPastEmployers: Record<string, number>;
  topGroups: Record<string, number>;
  openToAlumni: number;
  openToColleague: number;
  openToUniversity: number;
  openToCareer: number;
}

const KICKER: React.CSSProperties = {
  color: "var(--accent)",
  fontSize: "0.72rem",
  fontWeight: 680,
  textTransform: "uppercase",
  letterSpacing: "0.12em",
  display: "block",
  marginBottom: "6px",
};

function CarbonPicto({ type }: { type: "people" | "globe" | "community" | "learn" }) {
  const icons: Record<string, React.ReactNode> = {
    people: (
      <svg viewBox="0 0 32 32" fill="currentColor" aria-hidden="true">
        <circle cx="10" cy="9" r="4" />
        <circle cx="22" cy="9" r="4" opacity="0.6" />
        <path d="M2 26c0-5 3.6-8 8-8s8 3 8 8H2z" />
        <path d="M14 26c0-4 3-7 8-7s8 3 8 7H14z" opacity="0.5" />
      </svg>
    ),
    globe: (
      <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <circle cx="16" cy="16" r="12" />
        <ellipse cx="16" cy="16" rx="5" ry="12" />
        <line x1="4" y1="16" x2="28" y2="16" />
      </svg>
    ),
    community: (
      <svg viewBox="0 0 32 32" fill="currentColor" aria-hidden="true">
        <circle cx="16" cy="9" r="5" />
        <circle cx="5" cy="17" r="4" opacity="0.7" />
        <circle cx="27" cy="17" r="4" opacity="0.7" />
        <path d="M8 28c0-4.4 3.6-8 8-8s8 3.6 8 8H8z" />
      </svg>
    ),
    learn: (
      <svg viewBox="0 0 32 32" fill="currentColor" aria-hidden="true">
        <path d="M3 4h2v26H3z" />
        <path d="M4 6h22v2H4z" />
        <path d="M4 11h18v2H4z" />
        <path d="M4 16h22v2H4z" />
        <path d="M4 21h16v2H4z" />
        <path d="M4 26h20v2H4z" />
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

function EmptyState({ message }: { message: string }) {
  return (
    <p style={{ color: "var(--muted)", fontSize: "0.92rem", lineHeight: 1.55, margin: 0 }}>
      {message}
    </p>
  );
}

export default function PulsePage() {
  const { user, enrolled } = useAuth();
  const [data, setData] = useState<PulseData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [sessSnap, champSnap, partSnap] = await Promise.all([
          getDocs(collection(db, `${BASE}/sessions`)),
          getDocs(collection(db, `${BASE}/champions`)),
          getDocs(collection(db, `${BASE}/participants`)),
        ]);

        const primaryTracks: Record<string, number> = {};
        const topics: Record<string, number> = {};
        const championDomains: Record<string, number> = {};
        const topCountries: Record<string, number> = {};
        const topUniversities: Record<string, number> = {};
        const topPastEmployers: Record<string, number> = {};
        const topGroups: Record<string, number> = {};
        let openToAlumni = 0;
        let openToColleague = 0;
        let openToUniversity = 0;
        let openToCareer = 0;

        for (const d of sessSnap.docs) {
          const s = d.data() as RawDoc;
          const tracks = s.tracks as RawDoc | undefined;
          if (tracks?.primary_track) inc(primaryTracks, tracks.primary_track);
          ((tracks?.topics as string[]) ?? []).forEach(t => inc(topics, t));
        }

        for (const d of champSnap.docs) {
          const c = d.data() as RawDoc;
          const profile = c.profile as RawDoc | undefined;
          ((profile?.domains as string[]) ?? []).forEach(dom => {
            inc(championDomains, dom);
            inc(topGroups, dom);
          });
        }

        for (const d of partSnap.docs) {
          const p = d.data() as RawDoc;
          inc(topCountries, p.country ?? p.geo ?? "");
          const edu = (p.education as Array<Record<string, unknown>>) ?? [];
          for (const e of edu) if (e.institution) inc(topUniversities, e.institution);
          const emp = (p.past_employers as Array<Record<string, unknown>>) ?? [];
          for (const e of emp) if (e.company) inc(topPastEmployers, e.company);
          const esp = (p.event_signal_profile as Record<string, unknown>) ?? {};
          ((esp.tech_tracks as string[]) ?? []).forEach(t => inc(topGroups, t));
          ((esp.roles_at_txc as string[]) ?? []).forEach(r => inc(topGroups, r));
          ((p.career_interests as string[]) ?? []).forEach(c => inc(topGroups, c));
          const ni = (p.networking_identity as Record<string, boolean>) ?? {};
          if (ni.open_to_alumni_connections) openToAlumni++;
          if (ni.open_to_past_colleague_connections) openToColleague++;
          if (ni.open_to_university_connections) openToUniversity++;
          if (ni.open_to_career_conversations) openToCareer++;
        }

        setData({
          primaryTracks,
          topics,
          championDomains,
          topCountries,
          topUniversities,
          topPastEmployers,
          topGroups,
          openToAlumni,
          openToColleague,
          openToUniversity,
          openToCareer,
        });
      } catch {
        setData(null);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const connectionTotal = data
    ? data.openToAlumni + data.openToColleague + data.openToUniversity + data.openToCareer
    : 0;

  const hasRelationship =
    data &&
    (Object.keys(data.topCountries).length > 0 ||
      Object.keys(data.topUniversities).length > 0 ||
      Object.keys(data.topPastEmployers).length > 0);

  const hasCommunities =
    data && Object.keys(data.topGroups).length > 0;

  const hasLearning =
    data &&
    (Object.keys(data.primaryTracks).length > 0 || Object.keys(data.topics).length > 0);

  return (
    <>
      <section className="story-hero">
        <div className="section-kicker">Event Pulse</div>
        <h1>See the patterns emerging around you.</h1>
        <p>
          Live intelligence from TechXchange — who is open to connecting, where relationships
          are forming, and what people came to learn.
        </p>
      </section>

      {/* 1. Connection Intent */}
      <section className="story-section no-top-border">
        <div className="story-head-with-picto">
          <CarbonPicto type="people" />
          <div>
            <span style={KICKER}>Connection intent</span>
            <h2>Open to connections.</h2>
            <p className="story-lead">
              Nostalgia and curiosity start here — alumni, former colleagues, university peers,
              and career conversations attendees are open to this week.
            </p>
          </div>
        </div>

        {loading && <EmptyState message="Reading connection signals…" />}

        {!loading && connectionTotal === 0 && (
          <EmptyState message="Connection signals will appear here once attendees build their Compass." />
        )}

        {!loading && data && connectionTotal > 0 && (
          <>
            <div className="story-grid">
              {[
                { label: "Alumni connections", val: data.openToAlumni, color: "#6929c4" },
                { label: "Past colleagues", val: data.openToColleague, color: "#0f62fe" },
                { label: "University community", val: data.openToUniversity, color: "#005d5d" },
                { label: "Career conversations", val: data.openToCareer, color: "#b45309" },
              ].map(s => (
                <div
                  key={s.label}
                  className="story-card story-card-large"
                  style={{ borderTop: `3px solid ${s.color}` }}
                >
                  <p className="quiet-count" style={{ color: s.color, fontSize: "clamp(2.4rem, 4vw, 3.2rem)" }}>
                    {s.val}
                  </p>
                  <p className="story-card-body" style={{ margin: 0 }}>{s.label}</p>
                </div>
              ))}
            </div>
            <p className="story-note">
              Aggregate counts only.{" "}
              <Link href="/enroll" style={{ color: "var(--accent)" }}>Add your signal →</Link>
            </p>
          </>
        )}
      </section>

      {/* 2. Relationship Intelligence */}
      <section className="story-section">
        <div className="story-head-with-picto">
          <CarbonPicto type="globe" />
          <div>
            <span style={KICKER}>Relationship intelligence</span>
            <h2>Where connections are forming.</h2>
            <p className="story-lead">
              Top universities, former employers, and countries represented in the room.
            </p>
          </div>
        </div>

        {loading && <EmptyState message="Reading relationship signals…" />}

        {!loading && !hasRelationship && (
          <EmptyState message="Relationship patterns will appear as attendee profiles arrive." />
        )}

        {!loading && data && hasRelationship && (
          <>
            <div className="story-grid">
              <InsightBlock
                title="Top countries"
                rows={top(data.topCountries, 6)}
                renderLabel={name => (
                  <>
                    <span aria-hidden="true">{countryFlag(name)}</span> {name}
                  </>
                )}
              />
              <InsightBlock title="Top universities" rows={top(data.topUniversities, 6)} />
              <InsightBlock title="Top former employers" rows={top(data.topPastEmployers, 6)} />
              <InsightBlock title="Shared interest clusters" rows={top(data.topGroups, 6)} />
            </div>
            <p className="story-note">Aggregate counts only. No individual information is shown.</p>
          </>
        )}
      </section>

      {/* 3. Communities Taking Shape */}
      <section className="story-section">
        <div className="story-head-with-picto">
          <CarbonPicto type="community" />
          <div>
            <span style={KICKER}>Communities taking shape</span>
            <h2>Groups finding each other.</h2>
            <p className="story-lead">
              Top tracks, domains, and interest clusters surfacing from attendee profiles.
            </p>
          </div>
        </div>

        {loading && <EmptyState message="Reading community signals…" />}

        {!loading && !hasCommunities && (
          <EmptyState message="Community clusters will appear as attendees share their interests." />
        )}

        {!loading && data && hasCommunities && (
          <div className="mobile-scroll-row">
            {top(data.topGroups, 10).map(([name, count]) => (
              <span key={name} className="action-chip">
                {name} <span className="quiet-count-inline">{count}</span>
              </span>
            ))}
          </div>
        )}
      </section>

      {/* 4. Learning Signals */}
      <section className="story-section">
        <div className="story-head-with-picto">
          <CarbonPicto type="learn" />
          <div>
            <span style={KICKER}>Learning signals</span>
            <h2>What people are here to learn.</h2>
            <p className="story-lead">
              Top tracks and topics across the session catalog.
            </p>
          </div>
        </div>

        {loading && <EmptyState message="Reading learning signals…" />}

        {!loading && !hasLearning && (
          <EmptyState message="Learning signals will appear once the session catalog is indexed." />
        )}

        {!loading && data && hasLearning && (
          <div className="story-grid">
            <InsightBlock title="Top tracks" rows={top(data.primaryTracks, 8)} />
            <InsightBlock title="Top topics" rows={top(data.topics, 8)} />
          </div>
        )}
      </section>

      <section className="final-band">
        <div>
          {user && enrolled ? (
            <>
              <h2>Your plan is already taking shape.</h2>
              <p>These event signals are personalised for your goals and tracks on My Experience.</p>
            </>
          ) : (
            <>
              <h2>Pulse becomes personal when Compass knows your intent.</h2>
              <p>Build your Compass to turn these event signals into a focused plan.</p>
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
