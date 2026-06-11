"use client";
// =============================================================================
// EventCompass — Pulse  /pulse
// Live event signal dashboard: session types, track distribution, audience.
// Placeholder v1 — aggregates real Firestore data without exposing individuals.
// Full implementation in Phase 5 (Communities + Pulse).
// =============================================================================
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { getDocs, collection } from "firebase/firestore";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

const BASE = "organizations/ibm/events/txc2026";
type RawDoc = Record<string, unknown>;

// ── Country → emoji flag (inline, no external dep) ──────────────────────────
const FLAG_MAP: Record<string, string> = {
  "united states":"🇺🇸","usa":"🇺🇸","us":"🇺🇸",
  "united kingdom":"🇬🇧","uk":"🇬🇧","gb":"🇬🇧","great britain":"🇬🇧",
  "canada":"🇨🇦","ca":"🇨🇦",
  "germany":"🇩🇪","de":"🇩🇪",
  "australia":"🇦🇺","au":"🇦🇺",
  "india":"🇮🇳","in":"🇮🇳",
  "france":"🇫🇷","fr":"🇫🇷",
  "brazil":"🇧🇷","br":"🇧🇷",
  "netherlands":"🇳🇱","nl":"🇳🇱","the netherlands":"🇳🇱",
  "spain":"🇪🇸","es":"🇪🇸",
  "italy":"🇮🇹","it":"🇮🇹",
  "japan":"🇯🇵","jp":"🇯🇵",
  "china":"🇨🇳","cn":"🇨🇳",
  "singapore":"🇸🇬","sg":"🇸🇬",
  "mexico":"🇲🇽","mx":"🇲🇽",
  "sweden":"🇸🇪","se":"🇸🇪",
  "norway":"🇳🇴","no":"🇳🇴",
  "denmark":"🇩🇰","dk":"🇩🇰",
  "finland":"🇫🇮","fi":"🇫🇮",
  "south africa":"🇿🇦","za":"🇿🇦",
  "new zealand":"🇳🇿","nz":"🇳🇿",
  "ireland":"🇮🇪","ie":"🇮🇪",
  "poland":"🇵🇱","pl":"🇵🇱",
  "switzerland":"🇨🇭","ch":"🇨🇭",
  "portugal":"🇵🇹","pt":"🇵🇹",
  "belgium":"🇧🇪","be":"🇧🇪",
  "austria":"🇦🇹","at":"🇦🇹",
  "ukraine":"🇺🇦","ua":"🇺🇦",
  "israel":"🇮🇱","il":"🇮🇱",
  "uae":"🇦🇪","united arab emirates":"🇦🇪","ae":"🇦🇪",
  "argentina":"🇦🇷","ar":"🇦🇷",
  "colombia":"🇨🇴","co":"🇨🇴",
  "chile":"🇨🇱","cl":"🇨🇱",
  "kenya":"🇰🇪","ke":"🇰🇪",
  "nigeria":"🇳🇬","ng":"🇳🇬",
  "egypt":"🇪🇬","eg":"🇪🇬",
  "indonesia":"🇮🇩","id":"🇮🇩",
  "malaysia":"🇲🇾","my":"🇲🇾",
  "thailand":"🇹🇭","th":"🇹🇭",
  "philippines":"🇵🇭","ph":"🇵🇭",
  "pakistan":"🇵🇰","pk":"🇵🇰",
  "bangladesh":"🇧🇩","bd":"🇧🇩",
  "sri lanka":"🇱🇰","lk":"🇱🇰",
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
  totalSessions:     number;
  totalChampions:    number;
  totalParticipants: number;
  sessionTypes:      Record<string, number>;
  primaryTracks:     Record<string, number>;
  topics:            Record<string, number>;
  handsOn:           number;
  networking:        number;
  limited:           number;
  championDomains:   Record<string, number>;
  // Network graph fields — aggregated, no PII
  topCountries:      Record<string, number>;
  topCities:         Record<string, number>;
  topUniversities:   Record<string, number>;
  topPastEmployers:  Record<string, number>;
  topCareerInterests:Record<string, number>;
  openToAlumni:      number;
  openToColleague:   number;
  openToUniversity:  number;
  openToCareer:      number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Compact relationship-intelligence card
// ─────────────────────────────────────────────────────────────────────────────
function RelCard({
  kicker,
  count,
  unit,
  color,
  rows,
  renderLabel,
}: {
  kicker: string;
  count: number;
  unit: string;
  color: string;
  rows: [string, number][];
  renderLabel?: (name: string) => React.ReactNode;
}) {
  return (
    <article style={{
      background: "var(--panel)", border: "1px solid var(--line)",
      borderTop: `3px solid ${color}`, padding: "16px 18px",
      display: "flex", flexDirection: "column", gap: "10px",
    }}>
      <div>
        <p style={{ color: "var(--muted)", fontSize: "0.70rem", fontWeight: 680, textTransform: "uppercase", letterSpacing: "0.10em", margin: "0 0 4px" }}>
          {kicker}
        </p>
        <p style={{ fontSize: "1.8rem", fontWeight: 520, color, margin: 0, letterSpacing: "-0.04em", lineHeight: 1 }}>
          {count}
        </p>
        <p style={{ color: "var(--muted)", fontSize: "0.78rem", margin: "2px 0 0" }}>{unit}</p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
        {rows.map(([name, cnt]) => (
          <div key={name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", minWidth: 0 }}>
            <span style={{ fontSize: "0.83rem", color: "var(--soft)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0, display: "flex", alignItems: "center", gap: "5px" }}>
              {renderLabel ? renderLabel(name) : name}
            </span>
            <span style={{ fontFamily: "var(--font-mono, ui-monospace)", fontSize: "0.78rem", color: "var(--muted)", flexShrink: 0 }}>
              {cnt}
            </span>
          </div>
        ))}
      </div>
    </article>
  );
}

export default function PulsePage() {
  const { user, enrolled } = useAuth();
  const [data,    setData]    = useState<PulseData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [sessSnap, champSnap, partSnap] = await Promise.all([
          getDocs(collection(db, `${BASE}/sessions`)),
          getDocs(collection(db, `${BASE}/champions`)),
          getDocs(collection(db, `${BASE}/participants`)),
        ]);

        const sessionTypes:    Record<string, number> = {};
        const primaryTracks:   Record<string, number> = {};
        const topics:          Record<string, number> = {};
        const championDomains: Record<string, number> = {};
        let handsOn = 0, networking = 0, limited = 0;

        for (const d of sessSnap.docs) {
          const s = d.data() as RawDoc;
          inc(sessionTypes, (s.session_type ?? s.activity_type) || "Session");
          const tracks = s.tracks as RawDoc | undefined;
          if (tracks?.primary_track) inc(primaryTracks, tracks.primary_track);
          ((tracks?.topics as string[]) ?? []).forEach(t => inc(topics, t));
          const rules = s.recommendation_rules as RawDoc | undefined;
          if (rules?.hands_on)            handsOn++;
          if (rules?.good_for_networking) networking++;
          const cap = s.capacity as RawDoc | undefined;
          if (cap?.status === "limited")  limited++;
        }

        for (const d of champSnap.docs) {
          const c = d.data() as RawDoc;
          const profile = c.profile as RawDoc | undefined;
          ((profile?.domains as string[]) ?? []).forEach(dom => inc(championDomains, dom));
        }

        // ── Participant network aggregation (anonymous counts only) ──────
        const topCountries:      Record<string, number> = {};
        const topCities:         Record<string, number> = {};
        const topUniversities:   Record<string, number> = {};
        const topPastEmployers:  Record<string, number> = {};
        const topCareerInterests:Record<string, number> = {};
        let openToAlumni = 0, openToColleague = 0, openToUniversity = 0, openToCareer = 0;

        for (const d of partSnap.docs) {
          const p  = d.data() as RawDoc;
          // Geography
          inc(topCountries, p.country ?? p.geo ?? "");
          inc(topCities, p.city ?? "");
          // Education
          const edu = (p.education as Array<Record<string,unknown>>) ?? [];
          for (const e of edu) if (e.institution) inc(topUniversities, e.institution);
          // Past employers
          const emp = (p.past_employers as Array<Record<string,unknown>>) ?? [];
          for (const e of emp) if (e.company) inc(topPastEmployers, e.company);
          // Career interests
          const ci = (p.career_interests as string[]) ?? [];
          for (const c of ci) inc(topCareerInterests, c);
          // Networking identity open-to counts
          const ni = (p.networking_identity as Record<string,boolean>) ?? {};
          if (ni.open_to_alumni_connections)         openToAlumni++;
          if (ni.open_to_past_colleague_connections) openToColleague++;
          if (ni.open_to_university_connections)     openToUniversity++;
          if (ni.open_to_career_conversations)       openToCareer++;
        }

        setData({
          totalSessions: sessSnap.size,
          totalChampions: champSnap.size,
          totalParticipants: partSnap.size,
          sessionTypes, primaryTracks, topics,
          handsOn, networking, limited, championDomains,
          topCountries, topCities,
          topUniversities, topPastEmployers, topCareerInterests,
          openToAlumni, openToColleague, openToUniversity, openToCareer,
        });
      } catch (_) { /* silent — shows zeros */ }
      finally { setLoading(false); }
    }
    load();
  }, []);

  return (
    <>
      <section className="compact-hero">
        <div className="section-kicker">Pulse</div>
        <h1>See who is here, what is moving, and where opportunities are forming.</h1>
        <p>
          Pulse is the live read of the event: audience signal, session movement,
          Champion presence, and the opportunities beginning to take shape.
        </p>
      </section>

      {/* Scoreboard */}
      <section className="section no-top-border">
        <div className="section-head">
          <div><div className="section-kicker">Event pulse</div><h2>The room is taking shape.</h2></div>
          <p>Operating signals for Compass. Showing the event ecosystem forming.</p>
        </div>
        <div className="pulse-scoreboard">
          <article><span>Sessions mapped</span><b>{loading ? "…" : data?.totalSessions ?? 0}</b></article>
          <article><span>Champion profiles</span><b>{loading ? "…" : data?.totalChampions ?? 0}</b></article>
          <article><span>Attendee signals</span><b>{loading ? "…" : data?.totalParticipants ?? 0}</b></article>
          <article><span>Hands-on options</span><b>{loading ? "…" : data?.handsOn ?? 0}</b></article>
        </div>
      </section>

      {/* Tracks + Topics */}
      {data && (
        <section className="section">
          <div className="section-head">
            <div><div className="section-kicker">Session movement</div><h2>Where attention is gathering.</h2></div>
            <p>Topic distribution across the full session catalog.</p>
          </div>
          <div className="pulse-columns">
            <div className="pulse-column">
              <h3>Top tracks</h3>
              {top(data.primaryTracks).map(([name, count]) => (
                <p key={name}><span>{name}</span><b>{count}</b></p>
              ))}
              {Object.keys(data.primaryTracks).length === 0 && <p style={{ color: "var(--muted)" }}><span>No track data yet</span><b>—</b></p>}
            </div>
            <div className="pulse-column">
              <h3>Top topics</h3>
              {top(data.topics).map(([name, count]) => (
                <p key={name}><span>{name}</span><b>{count}</b></p>
              ))}
              {Object.keys(data.topics).length === 0 && <p style={{ color: "var(--muted)" }}><span>No topic data yet</span><b>—</b></p>}
            </div>
            <div className="pulse-column">
              <h3>Champion domains</h3>
              {top(data.championDomains).map(([name, count]) => (
                <p key={name}><span>{name}</span><b>{count}</b></p>
              ))}
              {Object.keys(data.championDomains).length === 0 && <p style={{ color: "var(--muted)" }}><span>No domain data yet</span><b>—</b></p>}
            </div>
          </div>
        </section>
      )}

      {/* Session type grid */}
      {data && Object.keys(data.sessionTypes).length > 0 && (
        <section className="section">
          <div className="section-head">
            <div><div className="section-kicker">Experience mix</div><h2>How the week is structured.</h2></div>
            <p>Session types across the full catalog. Click any type to filter in the Session Guide.</p>
          </div>
          <div className="type-grid">
            {top(data.sessionTypes, 12).map(([type, count]) => (
              <Link
                key={type}
                href={`/sessions`}
                className="type-tile"
                title={`View ${type} sessions`}
              >
                <span>{type}</span>
                <b>{count}</b>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Compass health */}
      {data && (
        <section className="section">
          <div className="section-head">
            <div><div className="section-kicker">Compass health</div><h2>Signals Compass can act on.</h2></div>
            <p>The bridge between Pulse and My Experience: what the system can use to recommend sessions, Champions, and next best actions.</p>
          </div>
          <div className="community-dashboard">
            <article>
              <span>Hands-on options</span>
              <b>{data.handsOn}</b>
              <p>Labs and workshops that support action-oriented recommendations.</p>
            </article>
            <article>
              <span>Networking moments</span>
              <b>{data.networking}</b>
              <p>Sessions and meetups marked useful for connection.</p>
            </article>
            <article>
              <span>Limited sessions</span>
              <b>{data.limited}</b>
              <p>Capacity-sensitive sessions Compass prioritizes carefully.</p>
            </article>
            <article>
              <span>Scoring signals</span>
              <b>9</b>
              <p>Track, goal, need, role, industry, keyword, and three rule bonuses.</p>
            </article>
          </div>
        </section>
      )}

      {/* ── Relationship intelligence — 4 compact cards ─────────────────────── */}
      {data && (
        Object.keys(data.topCountries).length > 0 ||
        Object.keys(data.topUniversities).length > 0 ||
        Object.keys(data.topPastEmployers).length > 0 ||
        Object.keys(data.topCareerInterests).length > 0
      ) && data && (
        <section className="section">
          <div className="section-head">
            <div>
              <div className="section-kicker">Relationship intelligence</div>
              <h2>Where connections are forming.</h2>
            </div>
            <p>
              Aggregate signals from attendee profiles. Compass uses these to surface
              alumni, career, and community matches.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "14px" }}>

            {/* Countries */}
            {Object.keys(data.topCountries).length > 0 && (
              <RelCard
                kicker="Where in the world"
                count={Object.keys(data.topCountries).length}
                unit="countries"
                color="#2563EB"
                rows={top(data.topCountries, 4)}
                renderLabel={name => (
                  <>
                    <span aria-hidden="true">{countryFlag(name)}</span>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</span>
                  </>
                )}
              />
            )}

            {/* Universities */}
            {Object.keys(data.topUniversities).length > 0 && (
              <RelCard
                kicker="Academic network"
                count={Object.keys(data.topUniversities).length}
                unit="universities"
                color="#6D28D9"
                rows={top(data.topUniversities, 4)}
              />
            )}

            {/* Former employers */}
            {Object.keys(data.topPastEmployers).length > 0 && (
              <RelCard
                kicker="Career network"
                count={Object.keys(data.topPastEmployers).length}
                unit="past employers"
                color="#0D9488"
                rows={top(data.topPastEmployers, 4)}
              />
            )}

            {/* Career interests */}
            {Object.keys(data.topCareerInterests).length > 0 && (
              <RelCard
                kicker="Career signal"
                count={Object.keys(data.topCareerInterests).length}
                unit="interests"
                color="#7C3AED"
                rows={top(data.topCareerInterests, 4)}
              />
            )}

          </div>

          <p style={{ color: "var(--muted)", fontSize: "0.76rem", marginTop: "14px" }}>
            Aggregate counts only. No individual information is shown.{" "}
            <a href="/enroll" style={{ color: "var(--accent)" }}>Add your background →</a>
          </p>
        </section>
      )}

      {/* ── Open-to-connection counts ────────────────────────────────────────── */}
      {data && (data.openToAlumni + data.openToColleague + data.openToUniversity + data.openToCareer > 0) && (
        <section className="section">
          <div style={{ marginBottom: "20px" }}>
            <div className="section-kicker">Connection intent</div>
            <h2 style={{ fontSize: "clamp(1.6rem,2.8vw,2.2rem)", fontWeight: 520, letterSpacing: "-0.04em", margin: "4px 0 0", color: "var(--text)" }}>
              Open to connections.
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px" }}>
            {[
              { label: "Alumni connections",  val: data.openToAlumni,     color: "#6D28D9" },
              { label: "Past colleagues",      val: data.openToColleague,  color: "#2563EB" },
              { label: "University community", val: data.openToUniversity, color: "#0D9488" },
              { label: "Career conversations", val: data.openToCareer,     color: "#D97706" },
            ].map(s => (
              <div key={s.label} style={{ background: "var(--panel)", border: "1px solid var(--line)", borderTop: `3px solid ${s.color}`, padding: "16px 18px" }}>
                <p style={{ fontSize: "2rem", fontWeight: 520, color: s.color, margin: "0 0 5px", lineHeight: 1, letterSpacing: "-0.04em" }}>{s.val}</p>
                <p style={{ fontSize: "0.82rem", color: "var(--muted)", margin: 0, lineHeight: 1.35 }}>{s.label}</p>
              </div>
            ))}
          </div>
          <p style={{ color: "var(--muted)", fontSize: "0.76rem", marginTop: "14px" }}>
            Attendees who have signalled openness to specific connection types.
            Add your network signal in{" "}
            <a href="/enroll" style={{ color: "var(--accent)" }}>Build My Compass</a>.
          </p>
        </section>
      )}

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
        {user && enrolled
          ? <Link href="/experience" className="btn-primary">Open My Compass →</Link>
          : <Link href="/enroll"     className="btn-primary">Build My Compass →</Link>
        }
      </section>
    </>
  );
}
