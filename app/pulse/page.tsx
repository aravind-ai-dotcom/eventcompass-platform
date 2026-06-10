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

export default function PulsePage() {
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
            <p>Track and topic distribution across the full session catalog.</p>
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
              <p>Capacity-sensitive sessions Compass prioritises carefully.</p>
            </article>
            <article>
              <span>Scoring signals</span>
              <b>9</b>
              <p>Track, goal, need, role, industry, keyword, and three rule bonuses.</p>
            </article>
          </div>
        </section>
      )}


      {/* ── Where relationships are forming — three dedicated sections ──── */}
      {data && (

        <>
          {/* ── 1. Countries ─────────────────────────────────────────────── */}
          {Object.keys(data.topCountries).length > 0 && (() => {
            const rows = top(data.topCountries, 15);
            const max  = rows[0]?.[1] ?? 1;
            return (
              <section className="section">
                <div style={{ marginBottom: "20px" }}>
                  <div className="section-kicker">Where in the world</div>
                  <h2 style={{ fontSize: "clamp(1.6rem,2.8vw,2.2rem)", fontWeight: 520, letterSpacing: "-0.04em", margin: "4px 0 0", color: "var(--text)" }}>
                    Countries represented.
                  </h2>
                </div>
                <div style={{ display: "grid", gap: "6px" }}>
                  {rows.map(([country, count]) => {
                    const flag = countryFlag(country);
                    const pct  = Math.max(4, Math.round((count / max) * 100));
                    return (
                      <div key={country} style={{ display: "grid", gridTemplateColumns: "1.8rem 1fr 3.2rem", alignItems: "center", gap: "10px" }}>
                        <span style={{ fontSize: "1.3rem", lineHeight: 1, textAlign: "center" }} aria-hidden="true">{flag}</span>
                        <div>
                          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "4px" }}>
                            <span style={{ fontSize: "0.9rem", color: "var(--soft)", fontWeight: 500 }}>{country}</span>
                          </div>
                          <div style={{ height: "7px", background: "var(--line)", overflow: "hidden", borderRadius: "2px" }}>
                            <div style={{ height: "100%", width: `${pct}%`, background: "#2563EB", borderRadius: "2px", transition: "width 0.6s ease-out" }} />
                          </div>
                        </div>
                        <span style={{ fontFamily: "var(--font-mono, ui-monospace)", fontSize: "0.84rem", color: "var(--muted)", textAlign: "right" }}>{count}</span>
                      </div>
                    );
                  })}
                </div>
                <p style={{ color: "var(--muted)", fontSize: "0.76rem", marginTop: "14px" }}>
                  Aggregate counts only. No individual information is shown.
                </p>
              </section>
            );
          })()}

          {/* ── 2. Universities ───────────────────────────────────────────── */}
          {Object.keys(data.topUniversities).length > 0 && (() => {
            const rows = top(data.topUniversities, 10);
            const max  = rows[0]?.[1] ?? 1;
            return (
              <section className="section">
                <div style={{ marginBottom: "20px" }}>
                  <div className="section-kicker">Academic network</div>
                  <h2 style={{ fontSize: "clamp(1.6rem,2.8vw,2.2rem)", fontWeight: 520, letterSpacing: "-0.04em", margin: "4px 0 0", color: "var(--text)" }}>
                    Universities represented.
                  </h2>
                </div>
                <div style={{ display: "grid", gap: "10px" }}>
                  {rows.map(([name, count]) => {
                    const pct = Math.max(4, Math.round((count / max) * 100));
                    return (
                      <div key={name} style={{ display: "grid", gridTemplateColumns: "1fr 3.2rem", alignItems: "center", gap: "12px" }}>
                        <div>
                          <p style={{ margin: "0 0 5px", fontSize: "0.92rem", color: "var(--soft)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {name}
                          </p>
                          <div style={{ height: "8px", background: "var(--line)", overflow: "hidden", borderRadius: "2px" }}>
                            <div style={{ height: "100%", width: `${pct}%`, background: "#6D28D9", borderRadius: "2px", transition: "width 0.6s ease-out" }} />
                          </div>
                        </div>
                        <span style={{ fontFamily: "var(--font-mono, ui-monospace)", fontSize: "0.9rem", color: "var(--muted)", textAlign: "right", fontWeight: 600 }}>{count}</span>
                      </div>
                    );
                  })}
                </div>
                <p style={{ color: "var(--muted)", fontSize: "0.76rem", marginTop: "14px" }}>
                  Aggregated from attendee education fields. No names or personal data.{" "}
                  <a href="/enroll" style={{ color: "var(--accent)" }}>Add your school →</a>
                </p>
              </section>
            );
          })()}

          {/* ── 3. Former employers ───────────────────────────────────────── */}
          {Object.keys(data.topPastEmployers).length > 0 && (() => {
            const rows = top(data.topPastEmployers, 10);
            const max  = rows[0]?.[1] ?? 1;
            return (
              <section className="section">
                <div style={{ marginBottom: "20px" }}>
                  <div className="section-kicker">Career network</div>
                  <h2 style={{ fontSize: "clamp(1.6rem,2.8vw,2.2rem)", fontWeight: 520, letterSpacing: "-0.04em", margin: "4px 0 0", color: "var(--text)" }}>
                    Former employers represented.
                  </h2>
                </div>
                <div style={{ display: "grid", gap: "10px" }}>
                  {rows.map(([name, count]) => {
                    const pct = Math.max(4, Math.round((count / max) * 100));
                    return (
                      <div key={name} style={{ display: "grid", gridTemplateColumns: "1fr 3.2rem", alignItems: "center", gap: "12px" }}>
                        <div>
                          <p style={{ margin: "0 0 5px", fontSize: "0.92rem", color: "var(--soft)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {name}
                          </p>
                          <div style={{ height: "8px", background: "var(--line)", overflow: "hidden", borderRadius: "2px" }}>
                            <div style={{ height: "100%", width: `${pct}%`, background: "#0D9488", borderRadius: "2px", transition: "width 0.6s ease-out" }} />
                          </div>
                        </div>
                        <span style={{ fontFamily: "var(--font-mono, ui-monospace)", fontSize: "0.9rem", color: "var(--muted)", textAlign: "right", fontWeight: 600 }}>{count}</span>
                      </div>
                    );
                  })}
                </div>
                <p style={{ color: "var(--muted)", fontSize: "0.76rem", marginTop: "14px" }}>
                  Aggregated from past employer fields. No names or personal data.{" "}
                  <a href="/enroll" style={{ color: "var(--accent)" }}>Add your past employer →</a>
                </p>
              </section>
            );
          })()}

          {/* ── 4. Career Interests ───────────────────────────────────────── */}
{Object.keys(data.topCareerInterests).length > 0 && (() => {
  const rows = top(data.topCareerInterests, 15);
  const max  = rows[0]?.[1] ?? 1;

  return (
    <section className="section">
      <div style={{ marginBottom: "20px" }}>
        <div className="section-kicker">Career signal</div>
        <h2
          style={{
            fontSize: "clamp(1.6rem,2.8vw,2.2rem)",
            fontWeight: 520,
            letterSpacing: "-0.04em",
            margin: "4px 0 0",
            color: "var(--text)",
          }}
        >
          Career interests emerging.
        </h2>
      </div>

      <div style={{ display: "grid", gap: "6px" }}>
        {rows.map(([interest, count]) => {
          const pct = Math.max(4, Math.round((count / max) * 100));

          return (
            <div
              key={interest}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 3.2rem",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    justifyContent: "space-between",
                    marginBottom: "4px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.9rem",
                      color: "var(--soft)",
                      fontWeight: 500,
                    }}
                  >
                    {interest}
                  </span>
                </div>

                <div
                  style={{
                    height: "7px",
                    background: "var(--line)",
                    overflow: "hidden",
                    borderRadius: "2px",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${pct}%`,
                      background: "#7C3AED",
                      borderRadius: "2px",
                      transition: "width 0.6s ease-out",
                    }}
                  />
                </div>
              </div>

              <span
                style={{
                  fontFamily: "var(--font-mono, ui-monospace)",
                  fontSize: "0.84rem",
                  color: "var(--muted)",
                  textAlign: "right",
                }}
              >
                {count}
              </span>
            </div>
          );
        })}
      </div>

      <p style={{ color: "var(--muted)", fontSize: "0.76rem", marginTop: "14px" }}>
        Aggregate career interests only. No individual information is shown.
      </p>
    </section>
  );
})()}

{/* ── 5. Open-to-connection counts ──────────────────────────────── */}          {(data.openToAlumni + data.openToColleague + data.openToUniversity + data.openToCareer > 0) && (
            <section className="section">
              <div style={{ marginBottom: "20px" }}>
                <div className="section-kicker">Connection intent</div>
                <h2 style={{ fontSize: "clamp(1.6rem,2.8vw,2.2rem)", fontWeight: 520, letterSpacing: "-0.04em", margin: "4px 0 0", color: "var(--text)" }}>
                  Open to connections.
                </h2>
              </div>
<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px" }}>                {[
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
        </>
      )}

      <section className="final-band">
        <div>
          <h2>Pulse becomes personal when Compass knows your intent.</h2>
          <p>Build your Compass to turn these event signals into a focused plan.</p>
        </div>
        <Link href="/enroll" className="btn-primary">Build my Compass</Link>
      </section>
    </>
  );
}
