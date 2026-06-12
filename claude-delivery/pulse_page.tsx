"use client";
// =============================================================================
// EventCompass — Pulse  /pulse
// Redesigned as an event intelligence story (Task 30, Job 2).
// All Firestore aggregation logic is preserved unchanged.
// Visual redesign: vertical story sections, 1-col mobile / 2-col desktop max,
// large quiet counts, IBM Carbon pictogram placeholders, calm empty states.
// =============================================================================
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { getDocs, collection } from "firebase/firestore";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

const BASE = "organizations/ibm/events/txc2026";
type RawDoc = Record<string, unknown>;

// ── Country → emoji flag ─────────────────────────────────────────────────────
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

// ── IBM Carbon–style pictogram placeholders ───────────────────────────────────
function CarbonPicto({ type }: { type: "people" | "globe" | "learn" | "community" | "signal" }) {
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
        <line x1="6" y1="10" x2="26" y2="10" strokeWidth="1.5" />
        <line x1="6" y1="22" x2="26" y2="22" strokeWidth="1.5" />
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
    community: (
      <svg viewBox="0 0 32 32" fill="currentColor" aria-hidden="true">
        <circle cx="16" cy="9" r="5" />
        <circle cx="5"  cy="17" r="4" opacity="0.7" />
        <circle cx="27" cy="17" r="4" opacity="0.7" />
        <path d="M8 28c0-4.4 3.6-8 8-8s8 3.6 8 8H8z" />
      </svg>
    ),
    signal: (
      <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M4 28C4 16 9.4 4 16 4" strokeLinecap="round" />
        <path d="M8 28c0-8 3.6-14 8-14" strokeLinecap="round" />
        <path d="M12 28c0-4 1.8-7 4-7" strokeLinecap="round" />
        <circle cx="16" cy="26" r="2" fill="currentColor" />
        <path d="M28 28C28 16 22.6 4 16 4" strokeLinecap="round" />
        <path d="M24 28c0-8-3.6-14-8-14" strokeLinecap="round" />
        <path d="M20 28c0-4-1.8-7-4-7" strokeLinecap="round" />
      </svg>
    ),
  };
  return (
    <div className="carbon-picto">
      {icons[type]}
    </div>
  );
}

// ── Shared micro-styles ───────────────────────────────────────────────────────
const KICKER: React.CSSProperties = {
  color: "var(--accent)", fontSize: "0.72rem", fontWeight: 680,
  textTransform: "uppercase", letterSpacing: "0.12em", display: "block", marginBottom: "6px",
};
const STORY_H2: React.CSSProperties = {
  fontSize: "clamp(1.7rem, 3vw, 2.6rem)", fontWeight: 520,
  letterSpacing: "-0.04em", margin: "0 0 8px", lineHeight: 1.05,
};
const SMALL_MUTED: React.CSSProperties = {
  color: "var(--muted)", fontSize: "0.76rem", marginTop: "14px", lineHeight: 1.5,
};

// ── Bar chart row ─────────────────────────────────────────────────────────────
function BarRow({ label, count, max, color, prefix }: { label: string; count: number; max: number; color: string; prefix?: string }) {
  const pct = Math.max(4, Math.round((count / max) * 100));
  return (
    <div style={{ display: "grid", gridTemplateColumns: prefix ? "1.6rem 1fr 2.8rem" : "1fr 2.8rem", alignItems: "center", gap: "10px" }}>
      {prefix && <span style={{ fontSize: "1.1rem", lineHeight: 1, textAlign: "center" }} aria-hidden="true">{prefix}</span>}
      <div>
        <p style={{ margin: "0 0 4px", fontSize: "0.9rem", color: "var(--soft)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</p>
        <div style={{ height: "6px", background: "var(--line)", overflow: "hidden", borderRadius: "2px" }}>
          <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: "2px", transition: "width 0.6s ease-out" }} />
        </div>
      </div>
      <span style={{ fontFamily: "var(--font-mono, ui-monospace)", fontSize: "0.82rem", color: "var(--muted)", textAlign: "right" }}>{count}</span>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
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

        const topCountries:      Record<string, number> = {};
        const topCities:         Record<string, number> = {};
        const topUniversities:   Record<string, number> = {};
        const topPastEmployers:  Record<string, number> = {};
        const topCareerInterests:Record<string, number> = {};
        let openToAlumni = 0, openToColleague = 0, openToUniversity = 0, openToCareer = 0;

        for (const d of partSnap.docs) {
          const p  = d.data() as RawDoc;
          inc(topCountries, p.country ?? p.geo ?? "");
          inc(topCities, p.city ?? "");
          const edu = (p.education as Array<Record<string,unknown>>) ?? [];
          for (const e of edu) if (e.institution) inc(topUniversities, e.institution);
          const emp = (p.past_employers as Array<Record<string,unknown>>) ?? [];
          for (const e of emp) if (e.company) inc(topPastEmployers, e.company);
          const ci = (p.career_interests as string[]) ?? [];
          for (const c of ci) inc(topCareerInterests, c);
          const ni = (p.networking_identity as Record<string,boolean>) ?? {};
          if (ni.open_to_alumni_connections)         openToAlumni++;
          if (ni.open_to_past_colleague_connections) openToColleague++;
          if (ni.open_to_university_connections)     openToUniversity++;
          if (ni.open_to_career_conversations)       openToCareer++;
        }

        setData({
          totalSessions: sessSnap.size, totalChampions: champSnap.size,
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

  const noData = !loading && !data;

  return (
    <>
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="compact-hero">
        <div className="section-kicker">Pulse</div>
        <h1>The room is taking shape.</h1>
        <p>
          Live signals from TechXchange 2026 — who is here, what is moving,
          and where relationships are beginning to form.
        </p>
      </section>

      {/* ── Event at a glance — 3 quiet large counts ─────────────────────── */}
      <section className="section no-top-border">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "1px", background: "var(--line)", border: "1px solid var(--line)" }}>
          {[
            { label: "Sessions mapped",    val: loading ? "…" : String(data?.totalSessions    ?? 0) },
            { label: "Champion profiles",  val: loading ? "…" : String(data?.totalChampions   ?? 0) },
            { label: "Attendee signals",   val: loading ? "…" : String(data?.totalParticipants ?? 0) },
          ].map(item => (
            <div key={item.label} style={{ background: "var(--panel)", padding: "28px 24px" }}>
              <p style={{ color: "var(--muted)", fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 680, margin: "0 0 10px" }}>{item.label}</p>
              <p className="quiet-count">{item.val}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Connection Intent — lead story ───────────────────────────────── */}
      {(data && (data.openToAlumni + data.openToColleague + data.openToUniversity + data.openToCareer) > 0) && (
        <section className="section">
          <div style={{ display: "flex", alignItems: "flex-start", gap: "16px", marginBottom: "28px" }}>
            <CarbonPicto type="people" />
            <div>
              <span style={KICKER}>Connection intent</span>
              <h2 style={STORY_H2}>Open to connecting.</h2>
              <p style={{ color: "var(--muted)", maxWidth: "560px", lineHeight: 1.55, margin: 0, fontSize: "0.95rem" }}>
                Attendees who have signalled what kinds of conversations they are open to this week.
              </p>
            </div>
          </div>
          <div className="story-grid">
            {([
              { label: "Alumni connections",  val: data.openToAlumni,     color: "#6929c4" },
              { label: "Past colleagues",      val: data.openToColleague,  color: "#0f62fe" },
              { label: "University community", val: data.openToUniversity, color: "#005d5d" },
              { label: "Career conversations", val: data.openToCareer,     color: "#b45309" },
            ] as const).map(s => (
              <div key={s.label} className="story-card story-card-large" style={{ borderTop: `3px solid ${s.color}` }}>
                <p style={{ fontSize: "clamp(3rem, 5vw, 4.2rem)", fontWeight: 420, color: s.color, margin: "0 0 10px", lineHeight: 1, letterSpacing: "-0.06em" }}>
                  {s.val}
                </p>
                <p style={{ fontSize: "0.92rem", color: "var(--muted)", margin: 0, lineHeight: 1.4 }}>{s.label}</p>
              </div>
            ))}
          </div>
          <p style={SMALL_MUTED}>
            Aggregate counts only. No individual names or details are shown.{" "}
            <a href="/enroll" style={{ color: "var(--accent)" }}>Add your signal →</a>
          </p>
        </section>
      )}
      {noData && (
        <section className="section">
          <p style={{ color: "var(--muted)" }}>Connection signals will appear here once attendees build their Compass.</p>
        </section>
      )}

      {/* ── Relationship Intelligence ─────────────────────────────────────── */}
      {data && Object.keys(data.topCountries).length > 0 && (() => {
        const rows = top(data.topCountries, 12);
        const max  = rows[0]?.[1] ?? 1;
        return (
          <section className="section">
            <div style={{ display: "flex", alignItems: "flex-start", gap: "16px", marginBottom: "28px" }}>
              <CarbonPicto type="globe" />
              <div>
                <span style={KICKER}>Relationship intelligence</span>
                <h2 style={STORY_H2}>Where people are coming from.</h2>
                <p style={{ color: "var(--muted)", maxWidth: "560px", lineHeight: 1.55, margin: 0, fontSize: "0.95rem" }}>
                  Geography, education, and career paths represented at TechXchange.
                </p>
              </div>
            </div>

            {/* Countries */}
            <div style={{ marginBottom: "40px" }}>
              <p style={{ color: "var(--muted)", fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 680, margin: "0 0 16px" }}>Countries</p>
              <div style={{ display: "grid", gap: "10px" }}>
                {rows.map(([country, count]) => (
                  <BarRow key={country} label={country} count={count} max={max} color="#0f62fe" prefix={countryFlag(country)} />
                ))}
              </div>
            </div>

            {/* Universities + Past employers — 2-col on desktop */}
            <div className="story-grid">
              {Object.keys(data.topUniversities).length > 0 && (() => {
                const uRows = top(data.topUniversities, 8);
                const uMax  = uRows[0]?.[1] ?? 1;
                return (
                  <div className="story-card">
                    <p style={{ color: "var(--muted)", fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 680, margin: "0 0 16px" }}>Universities</p>
                    <div style={{ display: "grid", gap: "10px" }}>
                      {uRows.map(([name, count]) => (
                        <BarRow key={name} label={name} count={count} max={uMax} color="#6929c4" />
                      ))}
                    </div>
                    <p style={SMALL_MUTED}>
                      <a href="/enroll" style={{ color: "var(--accent)" }}>Add your school →</a>
                    </p>
                  </div>
                );
              })()}
              {Object.keys(data.topPastEmployers).length > 0 && (() => {
                const eRows = top(data.topPastEmployers, 8);
                const eMax  = eRows[0]?.[1] ?? 1;
                return (
                  <div className="story-card">
                    <p style={{ color: "var(--muted)", fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 680, margin: "0 0 16px" }}>Former employers</p>
                    <div style={{ display: "grid", gap: "10px" }}>
                      {eRows.map(([name, count]) => (
                        <BarRow key={name} label={name} count={count} max={eMax} color="#005d5d" />
                      ))}
                    </div>
                    <p style={SMALL_MUTED}>
                      <a href="/enroll" style={{ color: "var(--accent)" }}>Add your past employer →</a>
                    </p>
                  </div>
                );
              })()}
            </div>
            <p style={SMALL_MUTED}>Aggregate counts only. No individual information is shown.</p>
          </section>
        );
      })()}

      {/* ── Communities Taking Shape ──────────────────────────────────────── */}
      {data && (Object.keys(data.topCareerInterests).length > 0 || Object.keys(data.championDomains).length > 0) && (
        <section className="section">
          <div style={{ display: "flex", alignItems: "flex-start", gap: "16px", marginBottom: "28px" }}>
            <CarbonPicto type="community" />
            <div>
              <span style={KICKER}>Communities taking shape</span>
              <h2 style={STORY_H2}>Shared interests surfacing.</h2>
              <p style={{ color: "var(--muted)", maxWidth: "560px", lineHeight: 1.55, margin: 0, fontSize: "0.95rem" }}>
                Career interests from attendee profiles and the domains champions bring to the event.
              </p>
            </div>
          </div>

          <div className="story-grid">
            {Object.keys(data.topCareerInterests).length > 0 && (() => {
              const rows = top(data.topCareerInterests, 10);
              const max  = rows[0]?.[1] ?? 1;
              return (
                <div className="story-card">
                  <p style={{ color: "var(--muted)", fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 680, margin: "0 0 16px" }}>Career interests</p>
                  <div style={{ display: "grid", gap: "8px" }}>
                    {rows.map(([interest, count]) => (
                      <BarRow key={interest} label={interest} count={count} max={max} color="#7c3aed" />
                    ))}
                  </div>
                </div>
              );
            })()}
            {Object.keys(data.championDomains).length > 0 && (() => {
              const rows = top(data.championDomains, 10);
              const max  = rows[0]?.[1] ?? 1;
              return (
                <div className="story-card">
                  <p style={{ color: "var(--muted)", fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 680, margin: "0 0 16px" }}>Champion domains</p>
                  <div style={{ display: "grid", gap: "8px" }}>
                    {rows.map(([name, count]) => (
                      <BarRow key={name} label={name} count={count} max={max} color="#0d9488" />
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
          <p style={SMALL_MUTED}>Aggregate counts only. No individual information is shown.</p>
        </section>
      )}

      {/* ── Learning Signals ─────────────────────────────────────────────── */}
      {data && (Object.keys(data.primaryTracks).length > 0 || Object.keys(data.topics).length > 0) && (
        <section className="section">
          <div style={{ display: "flex", alignItems: "flex-start", gap: "16px", marginBottom: "28px" }}>
            <CarbonPicto type="learn" />
            <div>
              <span style={KICKER}>Learning signals</span>
              <h2 style={STORY_H2}>Where attention is gathering.</h2>
              <p style={{ color: "var(--muted)", maxWidth: "560px", lineHeight: 1.55, margin: 0, fontSize: "0.95rem" }}>
                Track and topic distribution across the full session catalog.
                {data.handsOn > 0 && ` ${data.handsOn} hands-on options available.`}
              </p>
            </div>
          </div>

          <div className="story-grid" style={{ marginBottom: "24px" }}>
            {Object.keys(data.primaryTracks).length > 0 && (() => {
              const rows = top(data.primaryTracks, 8);
              const max  = rows[0]?.[1] ?? 1;
              return (
                <div className="story-card">
                  <p style={{ color: "var(--muted)", fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 680, margin: "0 0 16px" }}>Top tracks</p>
                  <div style={{ display: "grid", gap: "10px" }}>
                    {rows.map(([name, count]) => (
                      <BarRow key={name} label={name} count={count} max={max} color="#0f62fe" />
                    ))}
                  </div>
                </div>
              );
            })()}
            {Object.keys(data.topics).length > 0 && (() => {
              const rows = top(data.topics, 8);
              const max  = rows[0]?.[1] ?? 1;
              return (
                <div className="story-card">
                  <p style={{ color: "var(--muted)", fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 680, margin: "0 0 16px" }}>Top topics</p>
                  <div style={{ display: "grid", gap: "10px" }}>
                    {rows.map(([name, count]) => (
                      <BarRow key={name} label={name} count={count} max={max} color="#78a9ff" />
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Session types — quiet inline list, no 4-col grid */}
          {Object.keys(data.sessionTypes).length > 0 && (
            <div>
              <p style={{ color: "var(--muted)", fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 680, margin: "0 0 12px" }}>Session types</p>
              <div className="insight-list">
                {top(data.sessionTypes, 10).map(([type, count]) => (
                  <div key={type} className="insight-list-item">
                    <span>{type}</span>
                    <b>{count}</b>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* ── Compass health — quiet signal row ────────────────────────────── */}
      {data && (
        <section className="section">
          <div style={{ display: "flex", alignItems: "flex-start", gap: "16px", marginBottom: "24px" }}>
            <CarbonPicto type="signal" />
            <div>
              <span style={KICKER}>Compass health</span>
              <h2 style={STORY_H2}>Signals Compass can act on.</h2>
            </div>
          </div>
          <div className="insight-list">
            {[
              { label: "Hands-on options", val: data.handsOn },
              { label: "Networking moments", val: data.networking },
              { label: "Limited-capacity sessions", val: data.limited },
              { label: "Scoring dimensions", val: 9 },
            ].map(item => (
              <div key={item.label} className="insight-list-item">
                <span>{item.label}</span>
                <b>{item.val}</b>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Final band ────────────────────────────────────────────────────── */}
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
              <p>Build your Compass to turn these signals into a focused four-day plan.</p>
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
