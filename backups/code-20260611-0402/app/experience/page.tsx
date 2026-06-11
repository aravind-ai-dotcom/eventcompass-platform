"use client";

// =============================================================================
// EventCompass — My Experience  /experience
//
// Wave 4 additions (no existing logic changed):
//   • "What You Told Compass" section after EventUniverseStats
//   • Monday–Thursday day tabs replace flat pillar sections
//   • NextBestMoveCard wiring preserved exactly
//   • All Firestore loading and scoring preserved exactly
//
// Wave 5 additions (UI only):
//   • People deduplication: champion rotation removed from DayTabExperience
//   • New "People Compass Recommends" section: one card per person, all reasons
//
// Wave 6 copy / layout pass:
//   • Event Universe paragraph updated to attendee-first language
//   • CompassSignalStrength → CompassSignalCompact (inline in hero right column)
//   • Loading state kicker cleaned up
//
// Firestore path: organizations/ibm/events/txc2026
// CSS:            globals.css class names only
// =============================================================================

import { useCallback, useEffect, useMemo, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, doc, getDoc, getDocs, setDoc } from "firebase/firestore";
import { getFeaturedChampions } from "@/services/firestoreService";
import NextBestMoveCard from "@/components/experience/NextBestMove";
import EventHighlights    from "@/components/experience/EventHighlights";
import TechXchangeBanner  from "@/components/experience/TechXchangeBanner";
import CommunityVoices    from "@/components/experience/CommunityVoices";
import ExperienceBalance  from "@/components/experience/ExperienceBalance";
import PrintExport        from "@/components/experience/PrintExport";
import TechXchangeTV      from "@/components/experience/TechXchangeTV";
import { useAuth } from "@/context/AuthContext";


// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const BASE            = "organizations/ibm/events/txc2026";
const DEV_FALLBACK_ID = "ATT-0001";
const IBM_BLUE        = "#0f62fe";

const W = {
  track:     25,
  goal:      20,
  need:      15,
  role:      10,
  industry:  10,
  keyword:    5,
  executive:  5,
  broad:      5,
  handsOn:    5,
} as const;

const FUN_TYPES = new Set([
  "general session", "keynote", "reception", "social",
  "networking", "meetup", "awards", "celebration", "party", "fun",
]);

const LEARNING_TYPES = new Set([
  "instructor-led lab", "lab", "workshop", "certification",
  "technical breakout", "breakout session", "breakout", "hands-on lab", "demo",
]);

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type RawDoc = Record<string, unknown>;

interface ScoredSession {
  id: string;
  title: string;
  session_type?: string;
  activity_type?: string;
  schedule?: { day?: string; date?: string; start_time?: string; end_time?: string; room?: string };
  tracks?: { primary_track?: string; secondary_tracks?: string[]; topics?: string[]; products?: string[] };
  recommendation_rules?: { executive_relevant?: boolean; everyone_encouraged?: boolean; hands_on?: boolean };
  date?: string;
  start_time?: string;
  room?: string;
  tech_track?: string | string[];
  compass_score: number;
  compass_reasons: string[];
}

interface ScoredChampion {
  id: string;
  display_name: string;
  title?: string;
  organization?: string;
  profile?: { domains?: string[]; products?: string[] };
  attendance?: { available_for_1x1?: boolean };
  linkedin_url?: string;
  consent?: { show_linkedin?: boolean };
  compass_score: number;
  shared_keywords: string[];
  compass_reasons: string[];
}

interface EventCounts {
  participants: number;
  sessions: number;
  champions: number;
}


type FeaturedChampion = {
  id: string;
  display_name?: string;
  title?: string;
  organization?: string;
  photo_url?: string;
  quote?: string;
  topics?: string[];
  linkedin_url?: string;
  featured?: boolean;
  homepage_priority?: number;
  consent?: {
    featured_champion?: boolean;
    show_photo?: boolean;
  };
};



// Action state threaded through session recommendation cards
interface ExpScheduleState {
  savedSessions:  string[];
  hiddenSessions: string[];
  onSave:   (id: string) => void;
  onRemove: (id: string) => void;
  onHide:   (id: string) => void;
}

// Action state threaded through champion recommendation cards
interface ExpPeopleState {
  savedPeople:  string[];
  meetPeople:   string[];
  hiddenPeople: string[];
  isLoggedIn:   boolean;
  onSave: (id: string) => void;
  onMeet: (id: string) => void;
  onHide: (id: string) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Utilities  (unchanged from original)
// ─────────────────────────────────────────────────────────────────────────────

function lower(items: (string | undefined | null)[]): string[] {
  return items
    .filter((v): v is string => typeof v === "string" && v.trim() !== "")
    .map((v) => v.toLowerCase());
}

function resolve(raw: RawDoc, legacyKey: string, nestedPath: string): string {
  let cur: unknown = raw;
  for (const p of nestedPath.split(".")) {
    if (!cur || typeof cur !== "object") { cur = undefined; break; }
    cur = (cur as RawDoc)[p];
  }
  if (typeof cur === "string" && cur.trim()) return cur;
  const flat = raw[legacyKey];
  return typeof flat === "string" && flat.trim() ? flat : "";
}

function allTracks(raw: RawDoc): string[] {
  const tracks = (raw.tracks as RawDoc | undefined) ?? {};
  const primary = (tracks.primary_track as string) ?? "";
  const secondary = (tracks.secondary_tracks as string[]) ?? [];
  const legacy = raw.tech_track;
  const legacyArr = Array.isArray(legacy) ? (legacy as string[])
    : typeof legacy === "string" && legacy ? [legacy] : [];
  return [primary, ...secondary, ...legacyArr].filter(Boolean);
}

function sessionMeta(s: ScoredSession): string {
  const raw = s as unknown as RawDoc;
  const day   = resolve(raw, "date",       "schedule.day");
  const start = resolve(raw, "start_time", "schedule.start_time");
  const room  = resolve(raw, "room",       "schedule.room");
  return [day, start, room].filter(Boolean).join(" · ");
}

function sessionTypeLabel(s: ScoredSession): string {
  return (s.session_type ?? s.activity_type ?? "Session").trim();
}

function getPillar(s: ScoredSession): "Learning" | "Community" | "Fun" {
  const t = sessionTypeLabel(s).toLowerCase();
  if (FUN_TYPES.has(t))      return "Fun";
  if (LEARNING_TYPES.has(t)) return "Learning";
  return "Community";
}

// ─────────────────────────────────────────────────────────────────────────────
// Scoring  (unchanged from original)
// ─────────────────────────────────────────────────────────────────────────────

function scoreSession(participant: RawDoc, raw: RawDoc): ScoredSession {
  let score = 0;
  const reasons: string[] = [];

  const sig    = (participant.event_signal_profile as RawDoc) ?? {};
  const intel  = (participant.compass_intelligence  as RawDoc) ?? {};
  const reg    = (participant.registration          as RawDoc) ?? {};
  const intent = (sig.intent                        as RawDoc) ?? {};

  const pTracks   = lower((sig.tech_tracks           as string[]) ?? []);
  const pGoals    = lower((sig.goals                 as string[]) ?? []);
  const pNeeds    = lower((intent.needs              as string[]) ?? []);
  const pKeywords = lower((intel.matching_keywords   as string[]) ?? []);
  const pRoles    = lower((sig.roles_at_txc          as string[]) ?? []);
  const pIndustry = ((reg.industry as string) ?? "").toLowerCase().trim();

  const sCI       = (raw.compass_intelligence    as RawDoc) ?? {};
  const sAudience = (raw.audience                as RawDoc) ?? {};
  const sRules    = (raw.recommendation_rules    as RawDoc) ?? {};

  const sTracks     = lower(allTracks(raw));
  const sIntents    = lower((sCI.intent_tags         as string[]) ?? []);
  const sNeeds      = lower((sCI.need_tags            as string[]) ?? []);
  const sKeywords   = lower((sCI.matching_keywords    as string[]) ?? []);
  const sRoles      = lower((sAudience.roles          as string[]) ?? []);
  const sIndustries = lower((sAudience.industries     as string[]) ?? []);

  for (const t of pTracks)   { if (sTracks.includes(t))     { score += W.track;    reasons.push("Track match: " + t); } }
  for (const g of pGoals)    { if (sIntents.includes(g))    { score += W.goal;     reasons.push("Goal match: " + g); } }
  for (const n of pNeeds)    { if (sNeeds.includes(n))      { score += W.need;     reasons.push("Need match: " + n); } }
  for (const r of pRoles)    { if (sRoles.includes(r))      { score += W.role;     reasons.push("Role match: " + r); } }
  if (pIndustry && sIndustries.includes(pIndustry)) { score += W.industry; reasons.push("Industry match: " + String(reg.industry)); }
  for (const k of pKeywords) { if (sKeywords.includes(k))  { score += W.keyword;  reasons.push("Keyword match: " + k); } }
  if (sRules.executive_relevant)  { score += W.executive; reasons.push("Executive relevant"); }
  if (sRules.everyone_encouraged) { score += W.broad;     reasons.push("Broad event relevance"); }
  if (sRules.hands_on)            { score += W.handsOn;   reasons.push("Hands-on learning"); }

  return {
    id:           String(raw.id ?? ""),
    title:        String(raw.title ?? "Untitled session"),
    session_type: raw.session_type  as string | undefined,
    activity_type:raw.activity_type as string | undefined,
    schedule:     raw.schedule      as ScoredSession["schedule"],
    tracks:       raw.tracks        as ScoredSession["tracks"],
    recommendation_rules: raw.recommendation_rules as ScoredSession["recommendation_rules"],
    date:         raw.date          as string | undefined,
    start_time:   raw.start_time    as string | undefined,
    room:         raw.room          as string | undefined,
    tech_track:   raw.tech_track    as string | string[] | undefined,
    compass_score:   score,
    compass_reasons: reasons,
  };
}

function scoreChampion(participant: RawDoc, raw: RawDoc): ScoredChampion {
  if ((raw.consent as RawDoc | undefined)?.allow_intro_requests === false) {
    return {
      id: String(raw.id ?? ""),
      display_name: String(raw.display_name ?? "Champion"),
      compass_score: 0,
      shared_keywords: [],
      compass_reasons: [],
    };
  }
  const intel  = (participant.compass_intelligence as RawDoc) ?? {};
  const pKws   = lower((intel.matching_keywords as string[]) ?? []);
  const profile = (raw.profile as RawDoc) ?? {};
  const cIntel  = (raw.compass_intelligence as RawDoc) ?? {};
  const cKws    = lower([
    ...((profile.domains   as string[]) ?? []),
    ...((profile.products  as string[]) ?? []),
    ...((cIntel.matching_keywords as string[]) ?? []),
    ...((raw.domains       as string[]) ?? []),
  ]);
  const shared: string[] = [];
  let score = 0;
  for (const kw of pKws) { if (cKws.includes(kw)) { score += 10; shared.push(kw); } }
  const attendance = raw.attendance as RawDoc | undefined;
  if (attendance?.available_for_1x1 === true) score += 5;

  const reasons: string[] = shared.map(kw => "Shared expertise: " + kw);
  if (attendance?.available_for_1x1 === true) reasons.push("Available for 1:1");

  return {
    id:           String(raw.id ?? ""),
    display_name: String(raw.display_name ?? "Champion"),
    title:        raw.title        as string | undefined,
    organization: raw.organization as string | undefined,
    profile:      raw.profile      as ScoredChampion["profile"],
    attendance:   raw.attendance   as ScoredChampion["attendance"],
    linkedin_url: raw.linkedin_url as string | undefined,
    consent:      raw.consent      as ScoredChampion["consent"],
    compass_score:   score,
    shared_keywords: shared,
    compass_reasons: reasons,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

// Match badge — used on individual session and champion recommendation cards.
// Answers: "How relevant is this recommendation to me?"
function ScoreBadge({ score, size = "md" }: { score: number; size?: "sm" | "md" | "lg" }) {
  const sz = { sm: { badge: 42, num: "1.1rem" }, md: { badge: 54, num: "1.45rem" }, lg: { badge: 72, num: "2rem" } }[size];
  return (
    <div className="compass-score-badge" style={{ minWidth: sz.badge, minHeight: sz.badge }} title={"Match: " + score}>
      <span className="score-number" style={{ fontSize: sz.num }}>{score}</span>
      <span className="score-label">match</span>
    </div>
  );
}

// Energy indicator — hero metric. Answers: "How is my event experience shaping up?"
// Fuel-cell segmented bar: Learning · Community · Fun · Open Time
// Computed from pillar recommendation counts (proxy for what's shaping the week).
function EnergyIndicator({ learning, community, fun }: {
  learning: number; community: number; fun: number;
}) {
  const total = learning + community + fun;

  // Proportions occupy 80% of the bar; Open Time fills the remaining 20%
  const BASE = 80;
  const learnW = total > 0 ? Math.round((learning  / total) * BASE) : 0;
  const commW  = total > 0 ? Math.round((community / total) * BASE) : 0;
  const funW   = total > 0 ? Math.round((fun       / total) * BASE) : 0;
  const openW  = 100 - learnW - commW - funW;

  const segments = [
    { label: "Learning",  w: learnW, color: "#0f62fe" },
    { label: "Community", w: commW,  color: "#6929c4" },
    { label: "Fun",       w: funW,   color: "#009d9a" },
    { label: "Open",      w: openW,  color: "var(--line-strong)" },
  ].filter(s => s.w > 0);

  return (
    <div style={{ border: "1px solid var(--line)", background: "var(--panel)", padding: "12px 14px" }}>
      <p style={{ color: "var(--accent)", fontSize: "0.64rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.11em", margin: "0 0 9px" }}>
        Energy
      </p>
      {/* Segmented fuel-cell bar */}
      <div style={{ display: "flex", height: "6px", gap: "1px", marginBottom: "9px", overflow: "hidden" }}>
        {total === 0 ? (
          <div style={{ flex: 1, background: "var(--line)" }} />
        ) : (
          segments.map(s => (
            <div key={s.label} style={{ flex: s.w, background: s.color, minWidth: "2px" }} />
          ))
        )}
      </div>
      {/* Segment legend */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 10px" }}>
        {segments.map(s => (
          <span key={s.label} style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.69rem", color: "var(--muted)" }}>
            <span style={{ display: "inline-block", width: "7px", height: "7px", background: s.color, flexShrink: 0 }} />
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function SessionCard({ session, sched }: { session: ScoredSession; sched?: ExpScheduleState }) {
  const type  = sessionTypeLabel(session);
  const track = session.tracks?.primary_track ?? "";
  const meta  = sessionMeta(session);
  const tags  = [...(session.tracks?.topics ?? []), ...(session.tracks?.products ?? [])].slice(0, 4);
  return (
    <article className="opportunity-card">
      <div className="card-meta">
        <span>{type}{track ? " · " + track : ""}</span>
        <ScoreBadge score={session.compass_score} size="sm" />
      </div>
      <h3>{session.title}</h3>
      {meta && <p>{meta}</p>}
      {tags.length > 0 && (
        <div className="chip-row" style={{ marginTop: 0, marginBottom: "12px" }}>
          {tags.map((tag) => <span key={tag} className="chip">{tag}</span>)}
        </div>
      )}
      {session.compass_reasons.length > 0 && (
        <>
          <p style={{ color: "var(--muted)", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.09em", fontWeight: 680, margin: "14px 0 6px" }}>
            Why Compass picked this
          </p>
          <ul className="reason-list">
            {session.compass_reasons.slice(0, 4).map((r) => <li key={r}>{r}</li>)}
          </ul>
        </>
      )}
      {sched && <ExpSessionActionBar id={session.id} sched={sched} />}
    </article>
  );
}

// ── Carbon atom — circular person avatar (matches Champions page) ────────────
function PersonAvatar({ initial }: { initial: string }) {
  return (
    <div
      aria-hidden="true"
      style={{
        width: "36px", height: "36px", borderRadius: "50%",
        background: "rgba(15, 98, 254, 0.06)",
        border: "1px solid rgba(15, 98, 254, 0.20)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "0.82rem", fontWeight: 500, color: IBM_BLUE,
        letterSpacing: "0.02em", flexShrink: 0,
      }}
    >
      {initial}
    </div>
  );
}


function ChampionCard({ champion, pState }: { champion: ScoredChampion; pState?: ExpPeopleState }) {
  const initial = champion.display_name?.[0]?.toUpperCase() ?? "C";
  const org = champion.organization ?? "";
  const domains = (champion.profile?.domains ?? []).slice(0, 3);
  const avail = champion.attendance?.available_for_1x1;
  const reasons = champion.compass_reasons ?? [];

  return (
    <article
      style={{
        background: "var(--panel)",
        border: "1px solid var(--line)",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
      }}
    >
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
        <PersonAvatar initial={initial} />

        <div style={{ minWidth: 0, flex: 1 }}>
          <h3
            style={{
              margin: 0,
              fontSize: "0.97rem",
              fontWeight: 600,
              color: "var(--text)",
              lineHeight: 1.3,
              letterSpacing: "-0.01em",
            }}
          >
            {champion.display_name}
          </h3>

          {(champion.title || org) && (
            <p
              style={{
                margin: "2px 0 0",
                fontSize: "0.82rem",
                color: "var(--muted)",
                lineHeight: 1.35,
              }}
            >
              {[champion.title, org].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>
      </div>

      {/* Domains */}
      {domains.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
          {domains.map((d) => (
            <span
              key={d}
              style={{
                fontSize: "0.73rem",
                padding: "2px 8px",
                border: "1px solid var(--line)",
                color: "var(--muted)",
              }}
            >
              {d}
            </span>
          ))}
        </div>
      )}

      {/* 1:1 availability */}
      {avail && (
        <p style={{ margin: 0, fontSize: "0.78rem", color: IBM_BLUE, fontWeight: 550 }}>
          Available for 1:1
        </p>
      )}

      {/* Compass reasons */}
      {reasons.length > 0 && (
        <div style={{ borderTop: "1px solid var(--line)", paddingTop: "12px", marginTop: "2px" }}>
          <p
            style={{
              color: "var(--muted)",
              fontSize: "0.7rem",
              textTransform: "uppercase",
              letterSpacing: "0.09em",
              fontWeight: 680,
              margin: "0 0 8px",
            }}
          >
            Why Compass recommends this connection
          </p>

          <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: "6px" }}>
            {reasons.slice(0, 4).map((r) => (
              <li
                key={r}
                style={{
                  display: "flex",
                  gap: "8px",
                  color: "var(--muted)",
                  fontSize: "0.82rem",
                  lineHeight: 1.35,
                }}
              >
                <span style={{ color: IBM_BLUE, fontSize: "0.65rem", lineHeight: 1.35 }}>▪</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {pState && (
        <ExpPeopleActionBar id={champion.id} linkedinUrl={champion.linkedin_url} pState={pState} />
      )}
    </article>
  );
}



// ─────────────────────────────────────────────────────────────────────────────
// Session action bar — Info ↗ | + Add / ✓ Added | Do Not Suggest
// ─────────────────────────────────────────────────────────────────────────────

function ExpSessionActionBar({ id, sched }: { id: string; sched: ExpScheduleState }) {
  const isSaved  = sched.savedSessions.includes(id);
  const isHidden = sched.hiddenSessions.includes(id);

  const base = {
    display: "inline-flex" as const, alignItems: "center",
    height: "24px", padding: "0 9px",
    border: "1px solid var(--line)", background: "transparent",
    color: "var(--muted)" as string, fontSize: "0.70rem", fontWeight: 500,
    cursor: "pointer", fontFamily: "inherit",
    letterSpacing: "0.01em", whiteSpace: "nowrap" as const, textDecoration: "none",
  };
  const activeBtn = { ...base, border: "1px solid rgba(15,98,254,0.35)", color: IBM_BLUE, background: "rgba(15,98,254,0.04)" };
  const badge = {
    fontSize: "0.68rem", color: "var(--muted)", padding: "2px 7px",
    border: "1px solid var(--line)", letterSpacing: "0.06em", textTransform: "uppercase" as const,
  };

  return (
    <div style={{ borderTop: "1px solid var(--line)", paddingTop: "8px", marginTop: "10px",
      display: "flex", flexWrap: "wrap" as const, gap: "5px", alignItems: "center" }}>
      <a href={"/sessions/" + id} style={base}>Info &#8599;</a>
      {isSaved
        ? <button type="button" onClick={() => sched.onRemove(id)} style={activeBtn}>&#10003; Added</button>
        : <button type="button" onClick={() => sched.onSave(id)}   style={base}>+ Add</button>
      }
      {!isHidden
        ? <button type="button" onClick={() => sched.onHide(id)} style={{ ...base, opacity: 0.75 }}>Do Not Suggest</button>
        : <span style={badge}>Dismissed</span>
      }
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// People action bar — Save | Meet | LinkedIn ↗ | Do Not Suggest
// ─────────────────────────────────────────────────────────────────────────────

function ExpPeopleActionBar({ id, linkedinUrl, pState }: {
  id: string;
  linkedinUrl?: string;
  pState: ExpPeopleState;
}) {
  const isSaved  = pState.savedPeople.includes(id);
  const isMeet   = pState.meetPeople.includes(id);
  const isHidden = pState.hiddenPeople.includes(id);

  const base = {
    display: "inline-flex" as const, alignItems: "center",
    height: "24px", padding: "0 9px",
    border: "1px solid var(--line)", background: "transparent",
    color: "var(--muted)" as string, fontSize: "0.70rem", fontWeight: 500,
    cursor: "pointer", fontFamily: "inherit",
    letterSpacing: "0.01em", whiteSpace: "nowrap" as const, textDecoration: "none",
  };
  const activeBtn = { ...base, border: "1px solid rgba(15,98,254,0.35)", color: IBM_BLUE, background: "rgba(15,98,254,0.04)" };
  const badge = {
    fontSize: "0.68rem", color: "var(--muted)", padding: "2px 7px",
    border: "1px solid var(--line)", letterSpacing: "0.06em", textTransform: "uppercase" as const,
  };

  return (
    <div style={{ borderTop: "1px solid var(--line)", paddingTop: "8px", marginTop: "10px",
      display: "flex", flexWrap: "wrap" as const, gap: "5px", alignItems: "center" }}>
      {pState.isLoggedIn && linkedinUrl && (
        <a href={linkedinUrl} target="_blank" rel="noopener noreferrer" style={base}>LinkedIn &#8599;</a>
      )}
      {isSaved
        ? <button type="button" onClick={() => pState.onSave(id)} style={activeBtn}>&#10003; Saved</button>
        : <button type="button" onClick={() => pState.onSave(id)} style={base}>Save</button>
      }
      {isMeet
        ? <button type="button" onClick={() => pState.onMeet(id)} style={activeBtn}>&#10003; Meet Requested</button>
        : <button type="button" onClick={() => pState.onMeet(id)} style={base}>Meet</button>
      }
      {!isHidden
        ? <button type="button" onClick={() => pState.onHide(id)} style={{ ...base, opacity: 0.75 }}>Do Not Suggest</button>
        : <span style={badge}>Dismissed</span>
      }
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// iCal export — client-side .ics builder from scored sessions
// Tries /api/download-ical first; falls back to inline Blob generation.
// Compatible with Apple Calendar, Google Calendar import, and Outlook.
// ─────────────────────────────────────────────────────────────────────────────

function downloadICS(sessions: ScoredSession[], _participantId: string) {
  if (typeof window === "undefined") return;
  // /api/download-ical not yet implemented — always use client-side Blob generation
  const esc = (s: string) =>
    s.replace(/\\/g, "\\\\").replace(/,/g, "\\,").replace(/;/g, "\\;").replace(/\n/g, "\\n");
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//EventCompass//TechXchange 2026//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];
  sessions.slice(0, 40).forEach((s) => {
    const loc = esc(s.room ?? resolve(s as unknown as RawDoc, "room", "schedule.room") ?? "TBA");
    lines.push(
      "BEGIN:VEVENT",
      `UID:txc2026-${s.id}@eventcompass`,
      `SUMMARY:${esc(s.title)}`,
      `DESCRIPTION:Compass Match: ${s.compass_score}`,
      `LOCATION:${loc}`,
      "END:VEVENT",
    );
  });
  lines.push("END:VCALENDAR");
  const blob = new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = "techxchange-2026.ics";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─────────────────────────────────────────────────────────────────────────────
// Export panel — replaces PrintExport import. Prioritises calendar over PDF.
// ─────────────────────────────────────────────────────────────────────────────

function ExportPanel({ participantId, sessions }: { participantId: string; sessions: ScoredSession[] }) {
  function handlePrint()    { if (typeof window !== "undefined") window.print(); }
  function handleCalendar() { downloadICS(sessions, ""); }

  const base = {
    display: "inline-flex", alignItems: "center", gap: "6px",
    height: "36px", padding: "0 14px",
    border: "1px solid var(--line)", background: "transparent",
    color: "var(--soft)" as string, fontSize: "0.84rem", fontFamily: "inherit",
    cursor: "pointer", whiteSpace: "nowrap" as const,
  };
  const primary = {
    ...base,
    border: `1px solid ${IBM_BLUE}`, color: IBM_BLUE,
    background: "rgba(15,98,254,0.04)",
  };

  return (
    <div style={{ border: "1px solid var(--line)", background: "var(--panel)", padding: "18px 20px" }}>
      <p style={{ color: "var(--muted)", fontSize: "0.72rem", fontWeight: 680, textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 14px" }}>
        Save &amp; export
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
        <button type="button" onClick={handleCalendar} style={primary}
          title="Compatible with Apple Calendar, Google Calendar, and Outlook">
          📅 Download calendar (.ics)
        </button>
        <button type="button" onClick={handlePrint} style={base}
          title="Print-optimised layout">
          ⎙ Print My Experience
        </button>
      </div>
      <p style={{ color: "var(--muted)", fontSize: "0.76rem", margin: "10px 0 0", lineHeight: 1.4 }}>
        .ics export is compatible with Apple Calendar, Google Calendar, and Outlook.
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Event highlights — inline with Info / Add / Don't show action bar.
// Action state is local (visual-only) — ready for persistence wiring later.
// ─────────────────────────────────────────────────────────────────────────────

const HIGHLIGHT_DATA = [
  { id: "community-day",     title: "Community Day",            day: "Sunday, Oct 26",    time: "All Day",  location: "Georgia World Congress Center", description: "The kickoff day for IBM Champions, communities, and first-time attendees." },
  { id: "partner-day",       title: "Partner Day",              day: "Sunday, Oct 26",    time: "All Day",  location: "Georgia World Congress Center", description: "Dedicated programming for IBM Business Partners and ecosystem members." },
  { id: "keynote-tuesday",   title: "Tuesday Keynote",          day: "Tuesday, Oct 28",   time: "8:30 AM",  location: "Ballroom A",                    description: "The main stage moment that sets the direction for the week." },
  { id: "keynote-wednesday", title: "Wednesday Keynote",        day: "Wednesday, Oct 29", time: "8:30 AM",  location: "Ballroom A",                    description: "Day two main stage with product announcements and IBM leadership." },
  { id: "sandbox",           title: "Sandbox Block Party",      day: "Tuesday, Oct 28",   time: "6:00 PM",  location: "Exhibit Hall",                  description: "The unmissable evening social with demos, music, and networking." },
  { id: "tuesday-night",     title: "Tuesday Night Experience", day: "Tuesday, Oct 28",   time: "8:00 PM",  location: "TBA",                           description: "The signature evening event of TechXchange 2026." },
  { id: "closing",           title: "Closing Session & Awards", day: "Thursday, Oct 30",  time: "3:00 PM",  location: "Ballroom A",                    description: "Celebrate the week, recognise excellence, and close TechXchange 2026." },
] as const;

function HighlightActionCard({ h }: { h: typeof HIGHLIGHT_DATA[number] }) {
  const [added,     setAdded]     = useState(false);
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  const btn = {
    display: "inline-flex", alignItems: "center",
    height: "24px", padding: "0 9px",
    border: "1px solid var(--line)", background: "transparent",
    color: "var(--muted)" as string, fontSize: "0.70rem", fontWeight: 500,
    cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" as const,
    textDecoration: "none",
  };
  const addedBtn = {
    ...btn,
    border: `1px solid rgba(15,98,254,0.35)`, color: IBM_BLUE,
    background: "rgba(15,98,254,0.04)",
  };

  return (
    <article style={{ border: "1px solid var(--line)", background: "var(--panel)", padding: "20px 22px", display: "flex", flexDirection: "column" as const, gap: "10px" }}>
      {/* Status + date */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--accent)", flexShrink: 0, display: "inline-block" }} />
          <span style={{ color: "var(--muted)", fontSize: "0.72rem", fontWeight: 680, textTransform: "uppercase", letterSpacing: "0.1em" }}>Upcoming</span>
        </div>
        <span style={{ color: "var(--muted)", fontSize: "0.78rem", fontFamily: "var(--font-mono, ui-monospace)" }}>{h.day}</span>
      </div>
      {/* Title */}
      <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 580, letterSpacing: "-0.02em", color: "var(--text)", lineHeight: 1.2 }}>{h.title}</h3>
      {/* Time + location */}
      <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.84rem" }}>{h.time} &middot; {h.location}</p>
      {/* Description */}
      <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.88rem", lineHeight: 1.5 }}>{h.description}</p>
      {/* Action bar */}
      <div style={{ borderTop: "1px solid var(--line)", paddingTop: "10px", display: "flex", flexWrap: "wrap", gap: "5px", alignItems: "center" }}>
        <a href="/sessions" style={btn}>Info &#8599;</a>
        <button type="button" onClick={() => setAdded(v => !v)} style={added ? addedBtn : btn}>
          {added ? "✓ Added" : "+ Add"}
        </button>
        <button type="button" onClick={() => setDismissed(true)} style={{ ...btn, opacity: 0.7 }}>
          Don&apos;t show
        </button>
      </div>
    </article>
  );
}

function PillarSection({ pillar, sessions, limit = 3, sched }: { pillar: string; sessions: ScoredSession[]; limit?: number; sched?: ExpScheduleState }) {
  const PILLAR_META: Record<string, { kicker: string; heading: string; desc: string }> = {
    Learning:  { kicker: "Learning",  heading: "Sessions matched to your goals.",       desc: "Labs, breakouts, and workshops scored against your tracks and keywords." },
    Community: { kicker: "Community", heading: "People and moments worth your time.",   desc: "Expert sessions and community experiences for your profile." },
    Fun:       { kicker: "Fun",       heading: "Moments that make the week memorable.", desc: "Keynotes, social events, and experiences worth your time." },
  };
  if (sessions.length === 0) return null;
  const meta = PILLAR_META[pillar] ?? { kicker: pillar, heading: pillar, desc: "" };
  return (
    <div>
      <div style={{ marginBottom: "16px" }}>
        <p style={{ color: "var(--accent)", fontSize: "0.72rem", fontWeight: 680, textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 4px" }}>{meta.kicker}</p>
        <p style={{ color: "var(--muted)", margin: 0, fontSize: "0.88rem" }}>{meta.desc}</p>
      </div>
      <div className="opportunity-grid three">
        {sessions.slice(0, limit).map((s) => <SessionCard key={s.id} session={s} sched={sched} />)}
      </div>
      {sessions.length > limit && (
        <p style={{ color: "var(--muted)", fontSize: "0.82rem", marginTop: "12px" }}>
          +{sessions.length - limit} more {pillar.toLowerCase()} sessions matched your profile.
        </p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Compass Signal — compact inline card (replaces the previous full-section card)
// Sits in the hero right column alongside the score badge.
// ─────────────────────────────────────────────────────────────────────────────

function CompassSignalCompact({ participant }: { participant: RawDoc }) {
  const sig  = (participant.event_signal_profile as RawDoc) ?? {};
  const ni   = (participant.networking_identity  as Record<string, boolean>) ?? {};
  const edu  = (participant.education            as { institution?: string }[] | undefined) ?? [];
  const emp  = (participant.past_employers       as { company?: string }[]    | undefined) ?? [];
  const ci   = (participant.career_interests     as string[] | undefined) ?? [];
  const cons = (participant.consent              as Record<string, boolean>   | undefined) ?? {};

  const dimensions = [
    {
      label: "Identity",
      done:  !!(participant.first_name && participant.last_name),
    },
    {
      label: "Professional",
      done:  !!(participant.job_title && (participant.organization ?? participant.company)),
    },
    {
      label: "Background",
      done:  !!(edu[0]?.institution || emp[0]?.company || ci.length > 0),
    },
    {
      label: "Intent",
      done:  !!(((sig.goals as string[] | undefined) ?? []).length > 0 &&
               ((sig.tech_tracks as string[] | undefined) ?? []).length > 0),
    },
    {
      label: "Consent",
      done:  Object.keys(cons).length > 0 || Object.values(ni).some(Boolean),
    },
  ];

  const score = dimensions.filter(d => d.done).length;
  const pct   = Math.round((score / dimensions.length) * 100);
  const color = pct === 100 ? "#6929c4" : "var(--accent)"; // IBM purple at full, IBM blue otherwise — no green

  return (
    <div style={{ border: "1px solid var(--line)", background: "var(--panel)", padding: "12px 14px" }}>
      {/* Header: kicker + percent */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "12px", marginBottom: "7px" }}>
        <p style={{ color: "var(--accent)", fontSize: "0.64rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.11em", margin: 0 }}>
          Compass Signal
        </p>
        <span style={{ fontSize: "1.45rem", fontWeight: 520, color, letterSpacing: "-0.03em", lineHeight: 1, flexShrink: 0 }}>
          {pct}%
        </span>
      </div>

      {/* Progress bar */}
      <div style={{ height: "3px", background: "var(--line)", borderRadius: "2px", marginBottom: "10px" }}>
        <div style={{ width: pct + "%", height: "100%", background: color, borderRadius: "2px", transition: "width 0.4s" }} />
      </div>

      {/* Status chips */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginBottom: pct < 100 ? "10px" : "0" }}>
        {dimensions.map(d => (
          <span key={d.label} style={{
            fontSize: "0.69rem", padding: "2px 7px",
            border: "1px solid " + (d.done ? color : "var(--line)"),
            color: d.done ? color : "var(--muted)",
          }}>
            {d.done ? "✓" : "○"} {d.label}
          </span>
        ))}
      </div>

      {/* Refine link — secondary, compact */}
      {pct < 100 && (
        <a href="/enroll?mode=edit" style={{ display: "block", color: "var(--accent)", fontSize: "0.74rem", textDecoration: "none" }}>
          Refine My Compass &rarr;
        </a>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// "What You Told Compass" — full profile summary card (unchanged)
// ─────────────────────────────────────────────────────────────────────────────

function WhatYouToldCompass({ participant }: { participant: RawDoc }) {
  const sig    = (participant.event_signal_profile as RawDoc) ?? {};
  const intent = (sig.intent as RawDoc) ?? {};
  const ni     = (participant.networking_identity as Record<string, boolean>) ?? {};

  const name    = [String(participant.first_name ?? ""), String(participant.last_name ?? "")].filter(Boolean).join(" ")
                || String(participant.display_name ?? "");
  const persona = String(participant.persona ?? "");
  const org     = String(participant.organization ?? participant.company ?? "");

  const goals   = ((sig.goals         as string[]) ?? []).slice(0, 5);
  const tracks  = ((sig.tech_tracks   as string[]) ?? []).slice(0, 6);
  const needs   = ((intent.needs      as string[]) ?? []).slice(0, 4);
  const openTo  = ((sig.open_to       as string[]) ?? []).slice(0, 4);
  const ci      = ((participant.career_interests as string[]) ?? []).slice(0, 5);

  const niLabels: string[] = [
    ni.open_to_alumni_connections         ? "Alumni connections"  : "",
    ni.open_to_past_colleague_connections ? "Past colleagues"     : "",
    ni.open_to_university_connections     ? "University community": "",
    ni.open_to_career_conversations       ? "Career conversations": "",
  ].filter(Boolean);

  const identityItems = [
    name     ? { key: "Name",    value: name }    : null,
    persona  ? { key: "Persona", value: persona } : null,
    org      ? { key: "Company", value: org }     : null,
  ].filter((x): x is { key: string; value: string } => x !== null);

  const groups = [
    { label: "Goals",            items: goals    },
    { label: "Tech tracks",      items: tracks   },
    { label: "Career interests", items: ci       },
    { label: "Needs",            items: needs    },
    { label: "Open to",          items: openTo   },
    { label: "Networking",       items: niLabels },
  ].filter(g => g.items.length > 0);

  const hasContent = identityItems.length > 0 || groups.length > 0;
  if (!hasContent) return null;

  return (
    <section className="section">
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "8px", marginBottom: "4px" }}>
        <div className="section-kicker" style={{ margin: 0 }}>What you told Compass</div>
        <a href="/enroll?mode=edit" style={{ color: "var(--accent)", fontSize: "0.88rem" }}>Refine My Compass &rarr;</a>
      </div>
      <p style={{ color: "var(--muted)", margin: "4px 0 20px", fontSize: "0.92rem" }}>
        Compass uses these signals to personalise your event experience &mdash; session scores,
        Champion matches, and your four-day plan.
      </p>

      {/* Identity card — clean horizontal bar, no mosaic */}
      {identityItems.length > 0 && (
        <div style={{ background: "var(--panel)", border: "1px solid var(--line)", padding: "16px 20px", marginBottom: "12px" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "24px" }}>
            {identityItems.map(function(item) { return (
              <div key={item.key}>
                <p style={{ color: "var(--muted)", fontSize: "0.7rem", fontWeight: 680, textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 3px" }}>{item.key}</p>
                <p style={{ color: "var(--soft)", fontSize: "0.95rem", margin: 0, fontWeight: 500 }}>{item.value}</p>
              </div>
            ); })}
          </div>
        </div>
      )}

      {/* Signal groups — individual bordered cards, all labels consistently muted */}
      {groups.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "10px" }}>
          {groups.map(function(group) { return (
            <div key={group.label} style={{ background: "var(--panel)", border: "1px solid var(--line)", padding: "12px 16px" }}>
              <p style={{ color: "var(--muted)", fontSize: "0.7rem", fontWeight: 680, textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 9px" }}>
                {group.label}
              </p>
              <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "5px" }}>
                {group.items.map(function(item) { return (
                  <li key={item} style={{ display: "flex", alignItems: "flex-start", gap: "6px", color: "var(--soft)", fontSize: "0.88rem", lineHeight: 1.35 }}>
                    <span style={{ color: "var(--muted)", fontSize: "0.45rem", marginTop: "0.55em", flexShrink: 0 }}>&#9670;</span>
                    {item}
                  </li>
                ); })}
              </ul>
            </div>
          ); })}
        </div>
      )}
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Day-tab experience  (Wave 4 addition — unchanged)
// ─────────────────────────────────────────────────────────────────────────────

const EVENT_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday"] as const;
type EventDay = typeof EVENT_DAYS[number];

function getSessionsForDay(sessions: ScoredSession[], day: EventDay, fallbackIndex: number): ScoredSession[] {
  const matched = sessions.filter(function(s) {
    const d = resolve(s as unknown as RawDoc, "date", "schedule.day");
    return d && d.toLowerCase().includes(day.toLowerCase());
  });
  if (matched.length > 0) return matched;
  const perDay = Math.ceil(sessions.length / 4);
  return sessions.slice(fallbackIndex * perDay, (fallbackIndex + 1) * perDay);
}

function DayTabExperience({
  learningList,
  communityList,
  funList,
  sched,
}: {
  learningList:  ScoredSession[];
  communityList: ScoredSession[];
  funList:       ScoredSession[];
  sched?: ExpScheduleState;
}) {
  const [activeDay, setActiveDay] = useState<EventDay>("Monday");
  const dayIdx = EVENT_DAYS.indexOf(activeDay);

  const dayLearning  = getSessionsForDay(learningList,  activeDay, dayIdx).slice(0, 3);
  const dayCommunity = getSessionsForDay(communityList, activeDay, dayIdx).slice(0, 3);
  const dayFun       = getSessionsForDay(funList,       activeDay, dayIdx).slice(0, 3);

  const hasContent = dayLearning.length > 0 || dayCommunity.length > 0 || dayFun.length > 0;

  return (
    <section className="section">
      <div className="section-head">
        <div>
          <div className="section-kicker">Your four-day plan</div>
          <h2>TechXchange 2026.</h2>
        </div>
        <p>
          Compass balances three dimensions of a great event: learning that advances your goals,
          meaningful connections with people who share your background, and moments that make the
          week memorable. Each day is scored and organised for your profile.
        </p>
      </div>

      <div
        role="tablist"
        aria-label="Event days"
        style={{
          display:        "flex",
          borderBottom:   "1px solid var(--line)",
          marginBottom:   "28px",
          overflowX:      "auto",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {EVENT_DAYS.map(function(day) { return (
          <button
            key={day}
            role="tab"
            aria-selected={activeDay === day}
            onClick={function() { setActiveDay(day); }}
            style={{
              padding:      "12px 24px",
              border:       "none",
              borderBottom: activeDay === day
                ? "3px solid var(--accent)"
                : "3px solid transparent",
              background:   "transparent",
              color:        activeDay === day ? "var(--text)" : "var(--muted)",
              fontSize:     "0.95rem",
              fontWeight:   activeDay === day ? 650 : 500,
              fontFamily:   "inherit",
              cursor:       "pointer",
              whiteSpace:   "nowrap",
              marginBottom: "-1px",
              transition:   "color 0.15s, border-color 0.15s",
            }}
          >
            {day}
          </button>
        ); })}
      </div>

      {!hasContent ? (
        <p style={{ color: "var(--muted)", padding: "24px 0" }}>
          No sessions scheduled for {activeDay} yet. Check back as the catalog updates.
        </p>
      ) : (
        <div style={{ display: "grid", gap: "36px" }}>
          {dayLearning.length > 0 && (
            <PillarSection pillar="Learning" sessions={dayLearning} limit={3} sched={sched} />
          )}
          {dayCommunity.length > 0 && (
            <PillarSection pillar="Community" sessions={dayCommunity} limit={3} sched={sched} />
          )}
          {dayFun.length > 0 && (
            <PillarSection pillar="Fun" sessions={dayFun} limit={3} sched={sched} />
          )}
        </div>
      )}
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page component
// ─────────────────────────────────────────────────────────────────────────────

export default function ExperiencePage() {
  const [participant,  setParticipant]  = useState<RawDoc | null>(null);
  const [learningList, setLearningList] = useState<ScoredSession[]>([]);
  const [communityList,setCommunityList]= useState<ScoredSession[]>([]);
  const [funList,      setFunList]      = useState<ScoredSession[]>([]);
  const [nextBestMove, setNextBestMove] = useState<ScoredSession | null>(null);
  const [allSessions,  setAllSessions]  = useState<ScoredSession[]>([]);
  const [champions,      setChampions]      = useState<ScoredChampion[]>([]);
  const [allChampions,   setAllChampions]   = useState<ScoredChampion[]>([]);
  const [savedSessions,  setSavedSessions]  = useState<string[]>([]);
  const [hiddenSessions, setHiddenSessions] = useState<string[]>([]);
  const [savedPeople,    setSavedPeople]    = useState<string[]>([]);
  const [meetPeople,     setMeetPeople]     = useState<string[]>([]);
  const [hiddenPeople,   setHiddenPeople]   = useState<string[]>([]);
  const [featuredChampions, setFeaturedChampions] = useState<FeaturedChampion[]>([]);
  const [counts,       setCounts]       = useState<EventCounts>({ participants: 0, sessions: 0, champions: 0 });
  const [status,       setStatus]       = useState<"loading" | "ready" | "error">("loading");
  const [errorMsg,     setErrorMsg]     = useState("");
  const { user, loading: authLoading } = useAuth();
  const participantId = user?.uid ?? "";

  // ── Persist helper ─────────────────────────────────────────────────────────

  const persistPrefs = useCallback(async (updates: Record<string, unknown>) => {
    if (!participantId) return;
    try { await setDoc(doc(db, BASE + "/participants/" + participantId), updates, { merge: true }); }
    catch (e) { console.error("[ExperienceAction] persist:", e); }
  }, [participantId]);

  // ── Session action handlers ─────────────────────────────────────────────────

  const handleSaveSession = useCallback((id: string) => {
    const next = savedSessions.includes(id) ? savedSessions : [...savedSessions, id];
    setSavedSessions(next);
    persistPrefs({ saved_sessions: next });
  }, [savedSessions, persistPrefs]);

  const handleRemoveSession = useCallback((id: string) => {
    const next = savedSessions.filter(x => x !== id);
    setSavedSessions(next);
    persistPrefs({ saved_sessions: next });
  }, [savedSessions, persistPrefs]);

  const handleHideSession = useCallback((id: string) => {
    const next = hiddenSessions.includes(id) ? hiddenSessions : [...hiddenSessions, id];
    setHiddenSessions(next);
    persistPrefs({ hidden_sessions: next });
  }, [hiddenSessions, persistPrefs]);

  // ── Champion action handlers ────────────────────────────────────────────────

  const handleSavePerson = useCallback((id: string) => {
    const next = savedPeople.includes(id) ? savedPeople.filter(x => x !== id) : [...savedPeople, id];
    setSavedPeople(next);
    persistPrefs({ saved_people: next });
  }, [savedPeople, persistPrefs]);

  const handleMeetPerson = useCallback((id: string) => {
    const next = meetPeople.includes(id) ? meetPeople.filter(x => x !== id) : [...meetPeople, id];
    setMeetPeople(next);
    persistPrefs({ meet_people: next });
  }, [meetPeople, persistPrefs]);

  const handleHidePerson = useCallback((id: string) => {
    const next = hiddenPeople.includes(id) ? hiddenPeople : [...hiddenPeople, id];
    setHiddenPeople(next);
    persistPrefs({ hidden_people: next });
  }, [hiddenPeople, persistPrefs]);

  const handleRemovePerson = useCallback((id: string) => {
    const nextSaved = savedPeople.filter(x => x !== id);
    const nextMeet  = meetPeople.filter(x => x !== id);
    setSavedPeople(nextSaved);
    setMeetPeople(nextMeet);
    persistPrefs({ saved_people: nextSaved, meet_people: nextMeet });
  }, [savedPeople, meetPeople, persistPrefs]);

  // ── Derived state for action bars ──────────────────────────────────────────

  const schedState = useMemo<ExpScheduleState>(() => ({
    savedSessions, hiddenSessions,
    onSave: handleSaveSession, onRemove: handleRemoveSession, onHide: handleHideSession,
  }), [savedSessions, hiddenSessions, handleSaveSession, handleRemoveSession, handleHideSession]);

  const expPeopleState = useMemo<ExpPeopleState>(() => ({
    savedPeople, meetPeople, hiddenPeople,
    isLoggedIn: !!user,
    onSave: handleSavePerson, onMeet: handleMeetPerson, onHide: handleHidePerson,
  }), [savedPeople, meetPeople, hiddenPeople, user, handleSavePerson, handleMeetPerson, handleHidePerson]);

  useEffect(() => {
    async function load() {
      try {
        const [pSnap, sessSnap, partSnap, champSnap] = await Promise.all([
          getDoc(doc(db, BASE + "/participants/" + participantId)),
          getDocs(collection(db, BASE + "/sessions")),
          getDocs(collection(db, BASE + "/participants")),
          getDocs(collection(db, BASE + "/champions")),
        ]);

        if (!pSnap.exists()) {
          setErrorMsg("Participant \"" + participantId + "\" not found at " + BASE + "/participants/" + participantId);
          setStatus("error");
          return;
        }

        const pData        = pSnap.data() as RawDoc;
        const rawSessions  = sessSnap.docs.map((d) => ({ id: d.id, ...d.data() } as RawDoc));
        const rawChampions = champSnap.docs.map((d) => ({ id: d.id, ...d.data() } as RawDoc));

        const scored = rawSessions
          .map((s) => scoreSession(pData, s))
          .sort((a, b) => b.compass_score - a.compass_score);

        const learning:  ScoredSession[] = [];
        const community: ScoredSession[] = [];
        const fun:       ScoredSession[] = [];

        for (const s of scored) {
          const p = getPillar(s);
          if (p === "Learning")  learning.push(s);
          else if (p === "Fun")  fun.push(s);
          else                   community.push(s);
        }

        const allScoredChampions = rawChampions
          .map((c) => scoreChampion(pData, c))
          .sort((a, b) => b.compass_score - a.compass_score);
        const scoredChampions = allScoredChampions.slice(0, 5);

        const best = scored[0] ?? null;

        setParticipant(pData);
        setAllSessions(scored);
        setLearningList(learning);
        setCommunityList(community);
        setFunList(fun);
        setNextBestMove(best);
        setChampions(scoredChampions);
        setAllChampions(allScoredChampions);
        setCounts({ participants: partSnap.size, sessions: sessSnap.size, champions: champSnap.size });

        // Load persisted action state
        setSavedSessions( (pData.saved_sessions  as string[]) ?? []);
        setHiddenSessions((pData.hidden_sessions as string[]) ?? []);
        setSavedPeople(   (pData.saved_people    as string[]) ?? []);
        setMeetPeople(    (pData.meet_people     as string[]) ?? []);
        setHiddenPeople(  (pData.hidden_people   as string[]) ?? []);

        setStatus("ready");

        try {
          const featured = await getFeaturedChampions();
          setFeaturedChampions(featured);
        } catch {
          // Non-fatal
        }

      } catch (err: unknown) {
        const e = err as { code?: string; message?: string };
        console.error("[ExperiencePage] Firestore error:", err);
        setErrorMsg((e.code ? "(" + e.code + ") " : "") + (e.message ?? String(err)));
        setStatus("error");
      }
    }
    if (!authLoading && participantId) {
      load();
    }
  }, [authLoading, participantId]);

  if (status === "loading") {
    return (
      <section className="section no-top-border">
        <div className="section-kicker">My Compass</div>
        <h2 style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)", fontWeight: 520, letterSpacing: "-0.04em", margin: "12px 0 16px", color: "var(--text)" }}>
          Building your Compass&hellip;
        </h2>
        <p style={{ color: "var(--muted)", fontSize: "0.95rem" }}>
          Compass is scanning sessions, Champions, and your profile to shape your TechXchange experience.
        </p>
      </section>
    );
  }

  if (status === "error" || !participant) {
    return (
      <section className="section no-top-border">
        <div className="section-kicker" style={{ color: "var(--accent)" }}>Compass error</div>
        <h2 style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)", fontWeight: 520, letterSpacing: "-0.04em", margin: "12px 0 16px" }}>
          Could not load experience
        </h2>
        <p style={{ color: "var(--muted)", maxWidth: "640px", lineHeight: 1.6 }}>{errorMsg}</p>
        <p style={{ color: "var(--muted)", marginTop: "10px", fontSize: "0.88rem" }}>
          Verify Firebase environment variables and Firestore security rules.
        </p>
      </section>
    );
  }

  const firstName = String(participant.first_name ?? "").trim();
  const lastName  = String(participant.last_name  ?? "").trim();
  const fullName  = [firstName, lastName].filter(Boolean).join(" ");
  const displayName = String(
    participant.display_name ||
    participant.displayName  ||
    fullName ||
    "Attendee"
  );

  const jobTitle = String(participant.job_title ?? "");
  const company  = String(participant.company ?? participant.organization ?? "");

  const sig      = (participant.event_signal_profile as RawDoc) ?? {};
  const tracks   = ((sig.tech_tracks as string[]) ?? []).slice(0, 5);
  const goals    = ((sig.goals       as string[]) ?? []).slice(0, 3);
  const topScore = allSessions[0]?.compass_score ?? 0;

  const pillarCounts = {
    learning:  learningList.length,
    community: communityList.length,
    fun:       funList.length,
  };

  const pGoals  = (sig.goals       as string[]) ?? [];
  const pTracks = (sig.tech_tracks as string[]) ?? [];

  // My Schedule — sessions the user has saved
  const myScheduleSessions = savedSessions
    .map(id => allSessions.find(s => s.id === id))
    .filter((s): s is ScoredSession => !!s);

  // My People — champions from saved or meet lists
  const myPeopleAll = [...new Set([...savedPeople, ...meetPeople])]
    .map(id => allChampions.find(c => c.id === id))
    .filter((c): c is ScoredChampion => !!c);

  return (
    <>
      {/* ── ParticipantHero — right column now holds score + signal card ── */}
      <section className="section no-top-border">
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", gap: "28px", alignItems: "start" }}>
          <div>
            <div className="section-kicker">My Compass</div>
            <h1 style={{ fontSize: "clamp(2.6rem, 5vw, 4.6rem)", lineHeight: 0.97, letterSpacing: "-0.05em", fontWeight: 520, margin: "0 0 12px", color: "var(--text)" }}>
              {displayName}
            </h1>
            {(jobTitle || company) && (
              <p style={{ color: "var(--muted)", margin: "0 0 20px", fontSize: "1.05rem" }}>
                {[jobTitle, company].filter(Boolean).join(" · ")}
              </p>
            )}
            {(tracks.length > 0 || goals.length > 0) && (() => {
              const all  = [...tracks, ...goals];
              const show = all.slice(0, 8);
              const rest = all.length - show.length;
              return (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", maxWidth: "720px" }}>
                  {show.map((item) => (
                    <span
                      key={item}
                      style={{
                        display: "inline-flex", alignItems: "center",
                        height: "24px", padding: "0 9px",
                        border: "1px solid var(--line)", background: "var(--panel)",
                        color: "var(--muted)", fontSize: "0.74rem",
                        fontWeight: 500, lineHeight: 1, whiteSpace: "nowrap",
                      }}
                    >
                      {item}
                    </span>
                  ))}
                  {rest > 0 && (
                    <span style={{
                      display: "inline-flex", alignItems: "center",
                      height: "24px", padding: "0 9px",
                      color: "var(--muted)", fontSize: "0.74rem",
                      fontWeight: 500, lineHeight: 1,
                    }}>
                      +{rest} more signals
                    </span>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Right column: Energy indicator (top) + Signal card (below) */}
          <div style={{ display: "flex", flexDirection: "column", gap: "14px", alignItems: "stretch", minWidth: "190px" }}>
            <EnergyIndicator
              learning={learningList.length}
              community={communityList.length}
              fun={funList.length}
            />
            <CompassSignalCompact participant={participant} />
          </div>
        </div>
      </section>

      {/* ── EventUniverseStats ─────────────────────────────────────────── */}
      <section className="section">
        <div className="section-head">
          <div>
            <div className="section-kicker">Event universe</div>
            <h2>What Compass is working with.</h2>
          </div>
          <p>
            Compass is looking across every session, Champion, community programme, and hands-on
            opportunity to shape your TechXchange experience.
          </p>
        </div>
        <div className="pulse-scoreboard">
          <article><span>Sessions indexed</span><b>{counts.sessions}</b></article>
          <article><span>Champions available</span><b>{counts.champions}</b></article>
          <article><span>Attendee signals</span><b>{counts.participants}</b></article>
          <article><span>Top match score</span><b>{topScore}</b></article>
        </div>
      </section>

      {/* ── What You Told Compass ──────────────────────────────────────── */}
      <WhatYouToldCompass participant={participant} />

      {/* ── NextBestMove  (wiring preserved exactly) ───────────────────── */}
      {nextBestMove && (
        <section className="section">
          <div className="section-head narrow">
            <div>
              <div className="section-kicker">Right now</div>
              <h2>Your next best move.</h2>
            </div>
          </div>
          <NextBestMoveCard
            nextBestMove={{
              type:     "session",
              headline: nextBestMove.title,
              subline:  sessionTypeLabel(nextBestMove) + " · " + sessionMeta(nextBestMove),
              reason:   nextBestMove.compass_reasons[0] ?? "Top Compass match",
              score:    nextBestMove.compass_score,
              entityId: nextBestMove.id,
            }}
            topSession={nextBestMove}
            topChampion={champions[0] ?? null}
            participantGoals={pGoals}
            participantTracks={pTracks}
          />
        </section>
      )}

      {/* ── Day-tab experience (sessions only) ─────────────────────────── */}
      <DayTabExperience
        learningList={learningList}
        communityList={communityList}
        funList={funList}
        sched={schedState}
      />

      {/* ── People Compass Recommends ──────────────────────────────────── */}
      {champions.length > 0 && (
        <section className="section">
          <div className="section-head narrow">
            <div>
              <div className="section-kicker">People</div>
              <h2>People Compass Recommends.</h2>
            </div>
            <p>
              TechXchange is better when you find your people. Below are the Champions
              scored highest against your profile &mdash; every reason Compass matched
              them is shown on their card.
            </p>
          </div>
          <div className="champion-grid three-champions">
            {champions.map(function(c) { return <ChampionCard key={c.id} champion={c} pState={expPeopleState} />; })}
          </div>
        </section>
      )}

      {/* ── My Schedule ───────────────────────────────────────────────── */}
      {myScheduleSessions.length > 0 && (
        <section className="section">
          <div className="section-head narrow">
            <div>
              <div className="section-kicker">My Schedule</div>
              <h2>{myScheduleSessions.length} session{myScheduleSessions.length !== 1 ? "s" : ""} saved.</h2>
            </div>
            <p>Sessions you&apos;ve added to your schedule. Remove any time.</p>
          </div>
          <div style={{ display: "grid", gap: "1px", background: "var(--line)" }}>
            {myScheduleSessions.map(s => {
              const type  = sessionTypeLabel(s);
              const track = s.tracks?.primary_track ?? "";
              const meta  = sessionMeta(s);
              return (
                <div key={s.id} style={{
                  background: "var(--panel)", padding: "14px 18px",
                  display: "flex", alignItems: "flex-start",
                  justifyContent: "space-between", gap: "16px",
                }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p style={{ color: "var(--muted)", fontSize: "0.72rem", fontWeight: 680,
                      textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 3px" }}>
                      {type}{track ? " · " + track : ""}
                    </p>
                    <p style={{ fontSize: "0.95rem", fontWeight: 550, color: "var(--text)",
                      margin: "0 0 3px", lineHeight: 1.3 }}>
                      {s.title}
                    </p>
                    {meta && (
                      <p style={{ color: "var(--muted)", fontSize: "0.82rem", margin: 0 }}>
                        {meta}{s.compass_score > 0 ? " · Match " + s.compass_score : ""}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveSession(s.id)}
                    style={{
                      display: "inline-flex", alignItems: "center",
                      height: "24px", padding: "0 9px", flexShrink: 0,
                      border: "1px solid var(--line)", background: "transparent",
                      color: "var(--muted)", fontSize: "0.70rem", fontWeight: 500,
                      cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap",
                    }}
                  >
                    Remove
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── My People ─────────────────────────────────────────────────── */}
      {myPeopleAll.length > 0 && (
        <section className="section">
          <div className="section-head narrow">
            <div>
              <div className="section-kicker">My People</div>
              <h2>{myPeopleAll.length} champion{myPeopleAll.length !== 1 ? "s" : ""} saved.</h2>
            </div>
            <p>Champions you&apos;ve saved or requested to meet.</p>
          </div>
          <div style={{ display: "grid", gap: "1px", background: "var(--line)" }}>
            {myPeopleAll.map(c => {
              const initial = c.display_name?.[0]?.toUpperCase() ?? "C";
              const org     = c.organization ?? "";
              const isSaved = savedPeople.includes(c.id);
              const isMeet  = meetPeople.includes(c.id);
              return (
                <div key={c.id} style={{
                  background: "var(--panel)", padding: "14px 18px",
                  display: "flex", alignItems: "flex-start",
                  justifyContent: "space-between", gap: "16px",
                }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", flex: 1, minWidth: 0 }}>
                    <div aria-hidden="true" style={{
                      width: "32px", height: "32px", borderRadius: "50%",
                      background: "rgba(15,98,254,0.06)", border: "1px solid rgba(15,98,254,0.20)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "0.78rem", fontWeight: 500, color: IBM_BLUE, flexShrink: 0,
                    }}>
                      {initial}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: "0.95rem", fontWeight: 550, color: "var(--text)",
                        margin: "0 0 2px", lineHeight: 1.3 }}>
                        {c.display_name}
                      </p>
                      {(c.title || org) && (
                        <p style={{ color: "var(--muted)", fontSize: "0.82rem", margin: "0 0 5px" }}>
                          {[c.title, org].filter(Boolean).join(" · ")}
                        </p>
                      )}
                      <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
                        {isSaved && (
                          <span style={{ fontSize: "0.68rem", padding: "1px 7px",
                            border: "1px solid rgba(15,98,254,0.35)", color: IBM_BLUE,
                            background: "rgba(15,98,254,0.04)", letterSpacing: "0.04em" }}>
                            Saved
                          </span>
                        )}
                        {isMeet && (
                          <span style={{ fontSize: "0.68rem", padding: "1px 7px",
                            border: "1px solid rgba(105,41,196,0.35)", color: "#6929c4",
                            background: "rgba(105,41,196,0.04)", letterSpacing: "0.04em" }}>
                            Meet Requested
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemovePerson(c.id)}
                    style={{
                      display: "inline-flex", alignItems: "center",
                      height: "24px", padding: "0 9px", flexShrink: 0,
                      border: "1px solid var(--line)", background: "transparent",
                      color: "var(--muted)", fontSize: "0.70rem", fontWeight: 500,
                      cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap",
                    }}
                  >
                    Remove
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── TechXchange Banner ────────────────────────────────────────── */}
      <section className="section">
        <TechXchangeBanner />
      </section>

      {/* ── Event Highlights — inline with actions ─────────────────────── */}
      <section className="section">
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "20px", flexWrap: "wrap", gap: "8px" }}>
          <div>
            <div className="section-kicker">Event highlights</div>
            <h2 style={{ fontSize: "clamp(1.6rem,2.8vw,2.2rem)", fontWeight: 520, letterSpacing: "-0.04em", margin: "4px 0 0", color: "var(--text)" }}>
              Shared moments not to miss.
            </h2>
          </div>
          <p style={{ color: "var(--muted)", fontSize: "0.88rem", maxWidth: "360px", margin: 0, lineHeight: 1.5 }}>
            Anchor experiences of TechXchange 2026 &mdash; separate from your personalised plan.
          </p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "12px" }}>
          {HIGHLIGHT_DATA.map(function(h) { return <HighlightActionCard key={h.id} h={h} />; })}
        </div>
      </section>

      {/* ── Experience Balance + Export row ────────────────────────────── */}
      <section className="section">
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: "16px", alignItems: "start" }}>
          <ExperienceBalance sessionCounts={pillarCounts} />
          <div style={{ display: "grid", gap: "14px" }}>
            <ExportPanel participantId={participantId} sessions={allSessions} />
            <TechXchangeTV />
          </div>
        </div>
      </section>

      {/* ── Community Voices ───────────────────────────────────────────── */}
      <section className="section">
        <CommunityVoices champions={featuredChampions} />
      </section>

      {/* ── Footer CTA ─────────────────────────────────────────────────── */}
      <section className="final-band">
        <div>
          <h2>Your Compass is live.</h2>
          <p>
            Sessions, Champions, and moments are scored in real time.
            Refine your profile to improve signal quality and sharpen every recommendation.
          </p>
        </div>
        <a href="/enroll?mode=edit" className="btn-primary">Refine My Compass &rarr;</a>
      </section>
    </>
  );
}
