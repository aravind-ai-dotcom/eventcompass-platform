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
import { isOpenToAlumniConnections, isOpenToMentoringConversations } from "@/lib/networkingIdentity";
import { collection, doc, getDoc, getDocs, setDoc } from "firebase/firestore";
import { getFeaturedChampions } from "@/services/firestoreService";
import NextBestMoveCard from "@/components/experience/NextBestMove";
import LiveOpportunities from "@/components/experience/LiveOpportunities";
import VoiceCompassButton from "@/components/voice/VoiceCompassButton";
import EventHighlights    from "@/components/experience/EventHighlights";
import TechXchangeBanner  from "@/components/experience/TechXchangeBanner";
import CommunityVoices    from "@/components/experience/CommunityVoices";
import PrintExport        from "@/components/experience/PrintExport";
import TechXchangeTV      from "@/components/experience/TechXchangeTV";
import { useAuth } from "@/context/AuthContext";
import ConnectionSignals from "@/components/people/ConnectionSignals";
import ChampionDetailModal from "@/components/people/ChampionDetailModal";
import CertificationGoals from "@/components/experience/CertificationGoals";
import WhyCompassRecommendedWeek from "@/components/experience/WhyCompassRecommendedWeek";
import { sessionRecommendationLine } from "@/lib/sessionRecommendationLine";
import { deriveIntentSnapshot, deriveMatchReasons } from "@/lib/personCardHelpers";
import { isMutualWithInbound, SAMPLE_INBOUND_SIGNALS } from "@/lib/sampleConnectionSignals";


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
  onDetails: (id: string) => void;
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

/** Minutes since midnight for chronological day-plan sorting. */
function parseSessionTimeMinutes(s: ScoredSession): number {
  const raw = s as unknown as RawDoc;
  const start = resolve(raw, "start_time", "schedule.start_time");
  if (!start) return 9999;
  const m12 = start.match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/i);
  if (m12) {
    let h = parseInt(m12[1], 10);
    const min = parseInt(m12[2], 10);
    const ap = m12[3].toLowerCase();
    if (ap === "pm" && h !== 12) h += 12;
    if (ap === "am" && h === 12) h = 0;
    return h * 60 + min;
  }
  const m24 = start.match(/^(\d{1,2}):(\d{2})$/);
  if (m24) return parseInt(m24[1], 10) * 60 + parseInt(m24[2], 10);
  return 9999;
}

/** Time first; fit score breaks ties at the same start time (conflicts). */
function sortByEventTimeThenFit(a: ScoredSession, b: ScoredSession): number {
  const timeDiff = parseSessionTimeMinutes(a) - parseSessionTimeMinutes(b);
  if (timeDiff !== 0) return timeDiff;
  return (b.compass_score ?? 0) - (a.compass_score ?? 0);
}

function scheduleSessionsForDay(
  sessions: ScoredSession[],
  mode: PlanConflictMode,
): ScoredSession[] {
  const sorted = [...sessions].sort(sortByEventTimeThenFit);
  if (mode === "show-both") return sorted;

  // best-fit / capacity: one session per start-time slot — highest fit wins
  const bySlot = new Map<number, ScoredSession>();
  for (const s of sorted) {
    const slot = parseSessionTimeMinutes(s);
    const existing = bySlot.get(slot);
    if (!existing || (s.compass_score ?? 0) > (existing.compass_score ?? 0)) {
      bySlot.set(slot, s);
    }
  }
  return [...bySlot.values()].sort(sortByEventTimeThenFit);
}

function buildCompassTrustSignals(participant: RawDoc, sig: RawDoc): string[] {
  const tracks = ((sig.tech_tracks as string[]) ?? []);
  const goals = ((sig.goals as string[]) ?? []);
  const items: string[] = [];
  const blob = [...tracks, ...goals].join(" ").toLowerCase();

  if (/cloud|architecture|hybrid/.test(blob)) items.push("Cloud Architecture");
  if (/agentic|ai|automation|watson/.test(blob)) items.push("Agentic AI");
  if (/career|growth|leadership|executive/.test(blob)) items.push("Career Growth");
  if (/community|network|alumni|peer/.test(blob)) items.push("Community Participation");
  if (/certif|exam|credential/.test(blob)) items.push("Certification Readiness");
  if (isOpenToMentoringConversations(participant)) items.push("Open to Mentoring");

  if (items.length === 0) {
    return [...tracks, ...goals].slice(0, 6);
  }
  return items;
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

type PlanConflictMode = "best-fit" | "show-both" | "capacity";

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
  if (score === 0) return null;
  const sz = { sm: { badge: 42, num: "0.95rem" }, md: { badge: 54, num: "1.2rem" }, lg: { badge: 72, num: "1.6rem" } }[size];
  return (
    <div className="compass-score-badge" style={{ minWidth: sz.badge, minHeight: sz.badge }} title={`${score}% match`}>
      <span className="score-number" style={{ fontSize: sz.num }}>{score}%</span>
      <span className="score-label">match</span>
    </div>
  );
}

// Energy + balance — single compact "Your week in balance" card
function WeekInBalance({ learning, community, fun }: {
  learning: number; community: number; fun: number;
}) {
  const total = learning + community + fun;
  const BASE = 80;
  const learnW = total > 0 ? Math.round((learning  / total) * BASE) : 0;
  const commW  = total > 0 ? Math.round((community / total) * BASE) : 0;
  const funW   = total > 0 ? Math.round((fun       / total) * BASE) : 0;
  const openW  = 100 - learnW - commW - funW;

  const segments = [
    { label: "Learning",  w: learnW, color: "#0f62fe", count: learning },
    { label: "Community", w: commW,  color: "var(--purple-soft)", count: community },
    { label: "Fun",       w: funW,   color: "#009d9a", count: fun },
    { label: "Open",      w: openW,  color: "var(--line-strong)", count: 0 },
  ].filter(s => s.w > 0);

  const learnPct = total > 0 ? Math.round((learning / total) * 100) : 0;
  const commPct  = total > 0 ? Math.round((community / total) * 100) : 0;
  const funPct   = total > 0 ? Math.round((fun / total) * 100) : 0;

  return (
    <div className="week-balance-card">
      <p className="week-balance-kicker">Your week in balance</p>
      <p className="week-balance-sub">
        Community {commPct}% · Learning {learnPct}% · Fun {funPct}%
      </p>
      <div className="week-balance-bar">
        {total === 0 ? (
          <div className="week-balance-bar-empty" />
        ) : (
          segments.map(s => (
            <div key={s.label} className="week-balance-segment" style={{ flex: s.w, background: s.color }} title={s.label} />
          ))
        )}
      </div>
      <div className="week-balance-legend">
        {[
          { label: "Learning", count: learning, color: "#0f62fe" },
          { label: "Community", count: community, color: "var(--purple-soft)" },
          { label: "Fun", count: fun, color: "#009d9a" },
        ].map(item => (
          <span key={item.label} className="week-balance-legend-item">
            <span className="week-balance-swatch" style={{ background: item.color }} />
            {item.label}
            {total > 0 && <em>{item.count}</em>}
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
  const recommendation = sessionRecommendationLine(session);
  return (
    <article className="opportunity-card">
      <div className="card-meta">
        <span>{type}{track ? " · " + track : ""}</span>
        <ScoreBadge score={session.compass_score} size="sm" />
      </div>
      <h3>{session.title}</h3>
      {recommendation && (
        <p className="session-recommendation-line">{recommendation}</p>
      )}
      {meta && <p>{meta}</p>}
      {tags.length > 0 && (
        <div className="chip-row" style={{ marginTop: 0, marginBottom: "12px" }}>
          {tags.map((tag) => <span key={tag} className="chip">{tag}</span>)}
        </div>
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
  const reasons = champion.compass_reasons?.length
    ? champion.compass_reasons
    : deriveMatchReasons(champion);
  const intentSnapshot = deriveIntentSnapshot(champion);
  const isMutual = pState
    && pState.savedPeople.includes(champion.id)
    && isMutualWithInbound(champion.display_name, champion.id, pState.savedPeople, SAMPLE_INBOUND_SIGNALS);

  return (
    <article className="champion-person-card">
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
          {isMutual && (
            <span className="connection-signal-badge connection-signal-badge--mutual" style={{ marginTop: "6px", display: "inline-block" }}>
              Mutual interest
            </span>
          )}
        </div>
      </div>

      {/* Domains */}
      {domains.length > 0 && (
        <div className="champion-person-tags">
          {domains.map((d) => (
            <span key={d} className="champion-person-tag">{d}</span>
          ))}
        </div>
      )}

      {/* Intent snapshot */}
      {intentSnapshot.length > 0 && (
        <div className="champion-person-intent">
          {intentSnapshot.map(item => (
            <span key={item} className="champion-person-intent-tag">{item}</span>
          ))}
        </div>
      )}

      {/* Compass reasons */}
      {reasons.length > 0 && (
        <div className="champion-person-match">
          <p className="champion-person-match-kicker">Why Compass matched this person</p>
          <ul className="champion-person-match-list">
            {reasons.slice(0, 4).map((r) => <li key={r}>{r}</li>)}
          </ul>
        </div>
      )}
      {pState && (
        <ExpPeopleActionBar id={champion.id} pState={pState} />
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

function ExpPeopleActionBar({ id, pState }: {
  id: string;
  pState: ExpPeopleState;
}) {
  const isSaved  = pState.savedPeople.includes(id);
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
      <button type="button" onClick={() => pState.onDetails(id)} style={base}>Details</button>
      {isSaved
        ? <button type="button" onClick={() => pState.onSave(id)} style={activeBtn}>&#10003; Saved</button>
        : <button type="button" onClick={() => pState.onSave(id)} style={base}>Save person</button>
      }
      {!isHidden
        ? <button type="button" onClick={() => pState.onHide(id)} style={{ ...base, opacity: 0.75 }}>Not for me</button>
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

  const usable = sessions.slice(0, 40);
  if (usable.length === 0) {
    window.alert("No sessions available to export yet.");
    return;
  }

  const esc = (s: string) =>
    String(s ?? "")
      .replace(/\\/g, "\\\\")
      .replace(/,/g, "\\,")
      .replace(/;/g, "\\;")
      .replace(/\n/g, "\\n");

  function pad(n: number) {
    return String(n).padStart(2, "0");
  }

  function toICSDate(d: Date) {
    return (
      d.getUTCFullYear().toString() +
      pad(d.getUTCMonth() + 1) +
      pad(d.getUTCDate()) +
      "T" +
      pad(d.getUTCHours()) +
      pad(d.getUTCMinutes()) +
      "00Z"
    );
  }

 function fallbackSessionTime(index: number) {
  const days = [26, 27, 28, 29]; // Oct 26–29, 2026
  const slots = [
    { h: 9, m: 0 },
    { h: 10, m: 30 },
    { h: 12, m: 0 },
    { h: 13, m: 30 },
    { h: 15, m: 0 },
    { h: 16, m: 30 },
  ];
  const day = days[Math.floor(index / slots.length) % days.length];
  const slot = slots[index % slots.length];
  const start = new Date(Date.UTC(2026, 9, day, slot.h, slot.m, 0));
  const end = new Date(start.getTime() + 45 * 60 * 1000);
  return { start, end };
}

  function parseSessionDateTime(s: ScoredSession, index: number) {
    const raw = s as unknown as RawDoc;

    const date =
      resolve(raw, "date", "schedule.date") ||
      resolve(raw, "date", "schedule.day") ||
      "";

    const startTime =
      resolve(raw, "start_time", "schedule.start_time") ||
      "";

    const endTime =
      resolve(raw, "end_time", "schedule.end_time") ||
      "";

    // Works when date is YYYY-MM-DD or any browser-parseable date.
    const startCandidate = date && startTime ? new Date(`${date} ${startTime}`) : null;
    const endCandidate = date && endTime ? new Date(`${date} ${endTime}`) : null;

    if (startCandidate && !Number.isNaN(startCandidate.getTime())) {
      const start = startCandidate;
      const end =
        endCandidate && !Number.isNaN(endCandidate.getTime())
          ? endCandidate
          : new Date(start.getTime() + 45 * 60 * 1000);

      return { start, end };
    }

    return fallbackSessionTime(index);
  }

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//EventCompass//TechXchange 2026//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];

  usable.forEach((s, index) => {
    const { start, end } = parseSessionDateTime(s, index);
    const loc = esc(s.room ?? resolve(s as unknown as RawDoc, "room", "schedule.room") ?? "TBA");
    const reasons = (s.compass_reasons ?? []).slice(0, 3).join("; ");

    lines.push(
      "BEGIN:VEVENT",
      `UID:txc2026-${esc(s.id)}@eventcompass`,
      `DTSTAMP:${toICSDate(new Date())}`,
      `DTSTART:${toICSDate(start)}`,
      `DTEND:${toICSDate(end)}`,
      `SUMMARY:${esc(s.title)}`,
`DESCRIPTION:${esc(reasons ? `Match ${s.compass_score}. ${reasons}` : `Match ${s.compass_score}`)}`,
      `LOCATION:${loc}`,
      "END:VEVENT",
    );
  });

  lines.push("END:VCALENDAR");

  const blob = new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "my-techxchange-plan.ics";
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
  const complete = pct === 100;

  return (
    <a href="/enroll?mode=edit" className={`compass-signal-card compass-signal-card--clickable${complete ? " compass-signal-card--complete" : ""}`}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "12px", marginBottom: "7px" }}>
        <p className="compass-signal-kicker">Compass Signal</p>
        <span className={`compass-signal-pct${complete ? " compass-signal-pct--complete" : ""}`}>
          {pct}%
        </span>
      </div>

      <div className="compass-signal-bar">
        <div
          className={`compass-signal-bar-fill${complete ? " compass-signal-bar-fill--complete" : ""}`}
          style={{ width: pct + "%" }}
        />
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginBottom: pct < 100 ? "10px" : "0" }}>
        {dimensions.map(d => (
          <span
            key={d.label}
            className={[
              "compass-signal-chip",
              d.done ? "compass-signal-chip--done" : "",
              d.done && complete ? "compass-signal-chip--complete" : "",
            ].filter(Boolean).join(" ")}
          >
            {d.done ? "✓" : "○"} {d.label}
          </span>
        ))}
      </div>

      {pct < 100 && (
        <span style={{ display: "block", color: "var(--accent)", fontSize: "0.74rem" }}>
          Refine My Compass →
        </span>
      )}
    </a>
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
    isOpenToAlumniConnections(ni) ? "Alumni connections" : "",
    ni.open_to_past_colleague_connections ? "Former colleague connections" : "",
    ni.open_to_career_conversations       ? "Career conversations"         : "",
    isOpenToMentoringConversations(participant) ? "Mentoring conversations"  : "",
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
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", marginBottom: "16px" }}>
        <div>
          <div className="section-kicker">What you told Compass</div>
          <h2 style={{ fontSize: "clamp(1.5rem, 2.4vw, 2rem)", fontWeight: 520, letterSpacing: "-0.035em", margin: "4px 0 8px", lineHeight: 1.12 }}>
            Your profile signals
          </h2>
          <p style={{ color: "var(--muted)", margin: 0, fontSize: "0.92rem", maxWidth: "560px", lineHeight: 1.55 }}>
            Compass uses these signals to personalize session scores, champion matches, networking opportunities, and Community · Learning · Fun activities.
          </p>
        </div>
        <a href="/enroll?mode=edit" style={{ color: "var(--accent)", fontSize: "0.88rem", flexShrink: 0 }}>Refine My Compass &rarr;</a>
      </div>

      {identityItems.length > 0 && (
        <div className="profile-identity-grid">
          {identityItems.map(function(item) { return (
            <div key={item.key} className="profile-identity-item">
              <label>{item.key}</label>
              <p>{item.value}</p>
            </div>
          ); })}
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

function getSessionsForDay(
  sessions: ScoredSession[],
  day: EventDay,
  mode: PlanConflictMode,
): ScoredSession[] {
  const matched = sessions.filter(function(s) {
    const d = resolve(s as unknown as RawDoc, "date", "schedule.day");
    return d && d.toLowerCase().includes(day.toLowerCase());
  });
  if (matched.length === 0) return [];
  return scheduleSessionsForDay(matched, mode);
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
  const [planMode, setPlanMode] = useState<PlanConflictMode>("best-fit");

  const dayLearning  = getSessionsForDay(learningList,  activeDay, planMode).slice(0, 3);
  const dayCommunity = getSessionsForDay(communityList, activeDay, planMode).slice(0, 3);
  const dayFun       = getSessionsForDay(funList,       activeDay, planMode).slice(0, 3);

  const hasContent = dayLearning.length > 0 || dayCommunity.length > 0 || dayFun.length > 0;

  return (
    <section className="section">
      <div className="section-head">
        <div>
          <div className="section-kicker">Your AI-powered week</div>
          <h2>Compass selects and prioritizes your sessions.</h2>
        </div>
        <p>
          A four-day plan shaped to your goals — Community, Learning, and Fun balanced across the week.
          Conflict handling follows your preference below.
        </p>
      </div>

      <div className="plan-mode-row" role="group" aria-label="Conflict handling">
        {([
          { id: "best-fit" as const, label: "Best fit" },
          { id: "show-both" as const, label: "Show all conflicts" },
          { id: "capacity" as const, label: "Capacity optimization" },
        ]).map(mode => (
          <button
            key={mode.id}
            type="button"
            className={`plan-mode-chip${planMode === mode.id ? " is-active" : ""}`}
            aria-pressed={planMode === mode.id}
            onClick={() => setPlanMode(mode.id)}
          >
            {mode.label}
          </button>
        ))}
      </div>

      <div role="tablist" aria-label="Event days" className="day-tab-list">
        {EVENT_DAYS.map(function(day) { return (
          <button
            key={day}
            role="tab"
            aria-selected={activeDay === day}
            onClick={function() { setActiveDay(day); }}
            className={`day-tab${activeDay === day ? " is-active" : ""}`}
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
  const [detailChampion, setDetailChampion] = useState<ScoredChampion | null>(null);
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

  const handleDetailsPerson = useCallback((id: string) => {
    const found = allChampions.find(c => c.id === id) ?? champions.find(c => c.id === id);
    if (found) setDetailChampion(found);
  }, [allChampions, champions]);

  // ── Derived state for action bars ──────────────────────────────────────────

  const schedState = useMemo<ExpScheduleState>(() => ({
    savedSessions, hiddenSessions,
    onSave: handleSaveSession, onRemove: handleRemoveSession, onHide: handleHideSession,
  }), [savedSessions, hiddenSessions, handleSaveSession, handleRemoveSession, handleHideSession]);

  const expPeopleState = useMemo<ExpPeopleState>(() => ({
    savedPeople, meetPeople, hiddenPeople,
    isLoggedIn: !!user,
    onSave: handleSavePerson, onMeet: handleMeetPerson, onHide: handleHidePerson,
    onDetails: handleDetailsPerson,
  }), [savedPeople, meetPeople, hiddenPeople, user, handleSavePerson, handleMeetPerson, handleHidePerson, handleDetailsPerson]);

  const savedPersonSignals = useMemo(() => {
    return savedPeople
      .map(id => allChampions.find(c => c.id === id))
      .filter((c): c is ScoredChampion => !!c)
      .map(c => ({
        id: c.id,
        displayName: c.display_name,
        title: c.title,
        organization: c.organization,
        domains: (c.profile?.domains ?? []).slice(0, 3),
        matchReasons: c.compass_reasons?.length ? c.compass_reasons.slice(0, 3) : deriveMatchReasons(c),
        intentSnapshot: deriveIntentSnapshot(c),
        mutual: isMutualWithInbound(c.display_name, c.id, savedPeople, SAMPLE_INBOUND_SIGNALS),
      }));
  }, [savedPeople, allChampions]);

  const rankedSessionsForVoice = useMemo(
    () => [...learningList, ...communityList, ...funList]
      .sort((a, b) => b.compass_score - a.compass_score),
    [learningList, communityList, funList],
  );

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

        learning.sort(sortByEventTimeThenFit);
        community.sort(sortByEventTimeThenFit);
        fun.sort(sortByEventTimeThenFit);

        const allScoredChampions = rawChampions
          .map((c) => scoreChampion(pData, c))
          .sort((a, b) => b.compass_score - a.compass_score);
        const scoredChampions = allScoredChampions.slice(0, 5);

        const topCandidates = scored.filter(s => s.compass_score > 0).slice(0, 30);
        const best = (topCandidates.length > 0
          ? [...topCandidates].sort(sortByEventTimeThenFit)[0]
          : scored[0]) ?? null;

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
  const hasCertificationGoal = [...pGoals, ...pTracks].some(v =>
    /certif|exam|credential/i.test(v),
  );
  const trustSignals = buildCompassTrustSignals(participant, sig);

  // My Schedule — sessions the user has saved
  const myScheduleSessions = savedSessions
    .map(id => allSessions.find(s => s.id === id))
    .filter((s): s is ScoredSession => !!s);

  return (
    <>
      {/* ── Hero: profile + sidebar (balance + signal) ─────────────────── */}
      <section className="section no-top-border">
        <div className="section-kicker">My Compass</div>
        <div className="experience-hero-title-row">
          <div className="experience-hero-copy">
            <h1 className="experience-hero-title">{displayName}</h1>
            <p className="experience-hero-tagline">Your personalized event.</p>
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

          <aside className="experience-hero-sidebar" aria-label="Compass summary">
            <WeekInBalance
              learning={learningList.length}
              community={communityList.length}
              fun={funList.length}
            />
            <CompassSignalCompact participant={participant} />
          </aside>
        </div>
      </section>

      {/* ── Voice Compass ──────────────────────────────────────────────── */}
      <section className="section">
        <VoiceCompassButton
          variant="companion"
          nextBestMove={
            nextBestMove
              ? {
                  type:     "session",
                  headline: nextBestMove.title,
                  subline:  sessionTypeLabel(nextBestMove) + " · " + sessionMeta(nextBestMove),
                  reason:   nextBestMove.compass_reasons[0] ?? "Top Compass match",
                  score:    nextBestMove.compass_score,
                  entityId: nextBestMove.id,
                }
              : null
          }
          topSession={nextBestMove ?? rankedSessionsForVoice[0] ?? null}
          topChampion={champions[0] ?? null}
          rankedSessions={rankedSessionsForVoice}
          participantGoals={pGoals}
          participantTracks={pTracks}
          isEnrolled
        />
      </section>

      {/* ── Live Opportunities ─────────────────────────────────────────── */}
      <section className="section live-opportunities-section">
        <LiveOpportunities
          participantGoals={pGoals}
          participantTracks={pTracks}
        />
      </section>

      <CertificationGoals hasCertificationGoal={hasCertificationGoal} />

      {/* ── Next Best Move — primary intelligence surface ──────────────── */}
      {nextBestMove && (
        <section className="section intelligence-surface intelligence-surface--prominent">
          <div className="section-head narrow">
            <div>
              <div className="section-kicker">Next best move</div>
              <h2>The one session to act on now.</h2>
            </div>
            <p>
              Compass picked your strongest remaining match — schedule it, then
              explore Community, Learning, and Fun below.
            </p>
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
          />
        </section>
      )}

      <WhatYouToldCompass participant={participant} />

      {/* ── AI-powered week plan ───────────────────────────────────────── */}
      <DayTabExperience
        learningList={learningList}
        communityList={communityList}
        funList={funList}
        sched={schedState}
      />

      {/* ── People Compass Recommends ──────────────────────────────────── */}
      {champions.length > 0 && (
        <section className="section intelligence-band">
          <div className="section-head narrow">
            <div>
              <div className="section-kicker">People intelligence</div>
              <h2>Champions matched to your profile.</h2>
            </div>
            <p>
              Scored against your keywords, tracks, and goals — every match reason
              is shown on the card.
            </p>
          </div>
          <div className="champion-grid three-champions">
            {champions.map(function(c) { return <ChampionCard key={c.id} champion={c} pState={expPeopleState} />; })}
          </div>
        </section>
      )}

      <ConnectionSignals
        savedPeople={savedPersonSignals}
        isLoggedIn={!!user}
        onShowDetails={handleDetailsPerson}
      />

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

      {/* ── Event Highlights ─────────────────────────────────────────── */}
      <section className="section">
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "20px", flexWrap: "wrap", gap: "8px" }}>
          <div>
            <div className="section-kicker">Event highlights</div>
            <h2 style={{ fontSize: "clamp(1.6rem,2.8vw,2.2rem)", fontWeight: 520, letterSpacing: "-0.04em", margin: "4px 0 0", color: "var(--text)" }}>
              Shared moments not to miss.
            </h2>
          </div>
          <p style={{ color: "var(--muted)", fontSize: "0.88rem", maxWidth: "360px", margin: 0, lineHeight: 1.5 }}>
            Anchor experiences of TechXchange 2026 — separate from your personalized plan.
          </p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "12px" }}>
          {HIGHLIGHT_DATA.map(function(h) { return <HighlightActionCard key={h.id} h={h} />; })}
        </div>
      </section>

      {/* ── IBM TechXchange Advantage ──────────────────────────────────── */}
      <section className="section">
        <TechXchangeBanner />
      </section>

      {/* ── Export + TV ────────────────────────────────────────────────── */}
      <section className="section">
        <div className="experience-export-grid">
          <ExportPanel participantId={participantId} sessions={allSessions} />
          <TechXchangeTV />
        </div>
      </section>

      <WhyCompassRecommendedWeek signals={trustSignals} />

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

      {detailChampion && (
        <ChampionDetailModal
          champion={detailChampion}
          onClose={() => setDetailChampion(null)}
        />
      )}
    </>
  );
}
