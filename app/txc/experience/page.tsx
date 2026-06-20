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
import { tryGetDb } from "@/lib/firebase";
import { isOpenToAlumniConnections, isOpenToMentoringConversations } from "@/lib/networkingIdentity";
import { collection, doc, getDoc, getDocs, setDoc } from "firebase/firestore";
import { getFeaturedChampions } from "@/services/firestoreService";
import NextBestMoveCard from "@/components/experience/NextBestMove";
import BalancedMoveGrid from "@/components/experience/BalancedMoveGrid";
import LiveOpportunities from "@/components/experience/LiveOpportunities";
import { useHuddles } from "@/hooks/useHuddles";
import VoiceCompassButton from "@/components/voice/VoiceCompassButton";
import TechXchangeTV      from "@/components/experience/TechXchangeTV";
import CommunityVoices    from "@/components/experience/CommunityVoices";
import { useAuth } from "@/context/AuthContext";
import ChampionDetailModal from "@/components/people/ChampionDetailModal";
import RecommendedConnectionsSection from "@/components/people/RecommendedConnectionsSection";
import MyConnectionsSection from "@/components/people/MyConnectionsSection";
import PeopleInterestedSection from "@/components/people/PeopleInterestedSection";
import SaveConnectionModal from "@/components/people/SaveConnectionModal";
import type { RecommendedPerson } from "@/components/people/RecommendedConnectionCard";
import CertificationJourney from "@/components/experience/CertificationJourney";
import {
  applyCertificationSessionBoost,
  gatherCertificationGoalIds,
  getCertificationJourneyTitle,
  hasCertificationIntent,
  isCertificationActivityType,
  resolveSelectedCertificationGoals,
  shouldShowCertificationJourney,
} from "@/lib/certificationProfile";
import {
  buildCertificationJourneyPlan,
  resolveActiveCertification,
  type JourneyLinkItem,
} from "@/lib/certificationJourneyIntelligence";
import type { CertificationJourneyRecord } from "@/types/certificationSession";
import {
  emptyCertPins,
  type CertificationResourcesMap,
  type CertificationStage,
} from "@/types/certificationTracker";
import WhyCompassRecommendedWeek from "@/components/experience/WhyCompassRecommendedWeek";
import CompassSection from "@/components/experience/CompassSection";
import CustomizeCompassPanel from "@/components/experience/CustomizeCompassPanel";
import { useCompassUiPreferences } from "@/hooks/useCompassUiPreferences";
import { sessionRecommendationLine, resolveSessionWhyLine } from "@/lib/sessionRecommendationLine";
import SessionIntelligencePanel from "@/components/sessions/SessionIntelligencePanel";
import SessionDetailModal from "@/components/sessions/SessionDetailModal";
import {
  buildBalancedMoveSet,
  COMPASS_BALANCE_EXPLANATION,
  pickBalancedNextBestMove,
  selectBalancedSessionBand,
  type BalancedRecommendationInput,
} from "@/lib/recommendationBalancing";
import { getCachedPillarWeights, loadRecommendationBalanceConfig } from "@/services/recommendationBalanceConfig";
import type { PillarWeights } from "@/types/recommendationBalance";
import { isMutualWithInbound, SAMPLE_INBOUND_SIGNALS } from "@/lib/sampleConnectionSignals";
import {
  buildConnectionRecord,
  migrateLegacySavedPeople,
  removeVaultRecord,
  sanitizeConnectionVaultForFirestore,
  updateVaultRecordNote,
} from "@/lib/connectionVault";
import {
  addSessionToBothLists,
  mergeSavedSessionIds,
  removeSessionFromBothLists,
} from "@/lib/participantAgenda";
import {
  buildSpeakerCatalog,
  championFromRaw,
  rankRecommendedExperts,
  sessionFromScored,
  speakerToRecommendedPerson,
  type SpeakerParticipantContext,
} from "@/lib/speakerIntelligence";
import { SpeakerIntelligenceProvider, useSpeakerIntelligence } from "@/context/SpeakerIntelligenceContext";
import SessionSpeakerIntel from "@/components/sessions/SessionSpeakerIntel";
import type { ScoredSpeaker } from "@/types/speaker";
import type { ConnectionVaultRecord, SaveReason } from "@/types/connectionVault";
import type { HuddleParticipantPreview } from "@/types/huddleDataModel";

function extractSessionSpeakerNames(rawSessions: RawDoc[]): Set<string> {
  const names = new Set<string>();
  for (const session of rawSessions) {
    const speakers = session.speakers;
    if (!Array.isArray(speakers)) continue;
    for (const speaker of speakers) {
      const name =
        typeof speaker === "string"
          ? speaker
          : String((speaker as RawDoc).name ?? (speaker as RawDoc).display_name ?? "");
      if (name.trim()) names.add(name.trim().toLowerCase());
    }
  }
  return names;
}

function toRecommendedPerson(
  champion: ScoredChampion,
  speakerNames: Set<string>,
): RecommendedPerson {
  return {
    id: champion.id,
    display_name: champion.display_name,
    title: champion.title,
    organization: champion.organization,
    company: champion.company,
    profile: champion.profile,
    attendance: champion.attendance,
    compass_reasons: champion.compass_reasons,
    is_speaker: speakerNames.has(champion.display_name.toLowerCase()),
    linkedin_url: champion.linkedin_url,
    consent: champion.consent,
  };
}


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
  "instructor-led lab", "lab", "workshop",
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
  certification_id?: string;
  certification_code?: string;
}

interface ScoredChampion {
  id: string;
  display_name: string;
  title?: string;
  organization?: string;
  company?: string;
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
  onShowInfo: (id: string) => void;
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
  if (isCertificationActivityType(s)) return "";
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

function getPillar(s: ScoredSession): "Learning" | "Community" | "Fun" | null {
  if (isCertificationActivityType(s)) return null;
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

  const certLabel = getCertificationJourneyTitle(participant);
  const boosted = applyCertificationSessionBoost(score, reasons, participant, raw, certLabel);
  score = boosted.score;
  const finalReasons = boosted.reasons;

  return {
    id:           String(raw.id ?? raw.session_id ?? ""),
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
    certification_id: raw.certification_id as string | undefined,
    certification_code: raw.certification_code as string | undefined,
    compass_score:   score,
    compass_reasons: finalReasons,
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

  if (hasCertificationIntent(participant)) {
    const domains = lower([
      ...((profile.domains as string[]) ?? []),
      ...((raw.domains as string[]) ?? []),
    ]);
    if (domains.some(d => /certif|qiskit|developer|training|sme|exam/i.test(d))) {
      score += 15;
      reasons.unshift("Recommended for your certification goal");
    }
  }

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
function WeekInBalance({ people, learning, community, fun }: {
  people: number; learning: number; community: number; fun: number;
}) {
  const sessionTotal = learning + community + fun;
  const total = people + sessionTotal;
  const BASE = 80;
  const peopleW = total > 0 ? Math.round((people / total) * BASE) : 0;
  const learnW = total > 0 ? Math.round((learning  / total) * BASE) : 0;
  const commW  = total > 0 ? Math.round((community / total) * BASE) : 0;
  const funW   = total > 0 ? Math.round((fun       / total) * BASE) : 0;
  const openW  = Math.max(0, 100 - peopleW - learnW - commW - funW);

  const segments = [
    { label: "People",    w: peopleW, color: "#8a3ffc", count: people },
    { label: "Learning",  w: learnW, color: "#0f62fe", count: learning },
    { label: "Community", w: commW,  color: "var(--purple-soft)", count: community },
    { label: "Fun",       w: funW,   color: "#009d9a", count: fun },
    { label: "Open",      w: openW,  color: "var(--line-strong)", count: 0 },
  ].filter(s => s.w > 0);

  const peoplePct = total > 0 ? Math.round((people / total) * 100) : 0;
  const learnPct = total > 0 ? Math.round((learning / total) * 100) : 0;
  const commPct  = total > 0 ? Math.round((community / total) * 100) : 0;
  const funPct   = total > 0 ? Math.round((fun / total) * 100) : 0;

  return (
    <div className="week-balance-card">
      <p className="week-balance-kicker">Your week in balance</p>
      <p className="week-balance-sub">
        People {peoplePct}% · Learning {learnPct}% · Community {commPct}% · Fun {funPct}%
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
          { label: "People", count: people, color: "#8a3ffc" },
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

function SessionCard({ session, sched, certLabel }: { session: ScoredSession; sched?: ExpScheduleState; certLabel?: string | null }) {
  const speakerIntel = useSpeakerIntelligence();
  const type  = sessionTypeLabel(session);
  const track = session.tracks?.primary_track ?? "";
  const meta  = sessionMeta(session);
  const sessionSpeakers = speakerIntel
    ? speakerIntel.resolveSessionSpeakers(sessionFromScored(session))
    : [];
  return (
    <article className="opportunity-card">
      <div className="card-meta">
        <span>{type}{track ? " · " + track : ""}</span>
      </div>
      <h3>{session.title}</h3>
      {meta && <p className="session-card-meta">{meta}</p>}
      <SessionIntelligencePanel session={session} certLabel={certLabel} scoreSize="sm" />
      {sessionSpeakers.length > 0 && (
        <SessionSpeakerIntel
          speakers={sessionSpeakers}
          onViewSpeaker={speakerIntel?.onViewSpeaker}
          compact
        />
      )}
      {sched && <ExpSessionActionBar id={session.id} sched={sched} />}
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
      <button type="button" onClick={() => sched.onShowInfo(id)} style={base}>Info</button>
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

function PillarSection({ pillar, sessions, limit = 3, sched, certLabel }: { pillar: string; sessions: ScoredSession[]; limit?: number; sched?: ExpScheduleState; certLabel?: string | null }) {
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
        {sessions.slice(0, limit).map((s) => <SessionCard key={s.id} session={s} sched={sched} certLabel={certLabel} />)}
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
    <a href="/txc/enroll?mode=edit" className={`compass-signal-card compass-signal-card--clickable${complete ? " compass-signal-card--complete" : ""}`}>
      <div className="compass-signal-head">
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

      <div className={`compass-signal-chips${complete ? " compass-signal-chips--complete" : ""}`}>
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
        <span className="compass-refine-chip">Refine My Compass →</span>
      )}
    </a>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// "What You Told Compass" — full profile summary card (unchanged)
// ─────────────────────────────────────────────────────────────────────────────

function WhatYouToldCompass({ participant, embedded = false }: { participant: RawDoc; embedded?: boolean }) {
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
    <section className={embedded ? "compass-module-block" : "section"}>
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
        <a href="/txc/enroll?mode=edit" className="action-chip">Refine My Compass →</a>
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
        <div className="profile-signals-grid">
          {groups.map(function(group) { return (
            <div key={group.label} className="profile-signal-card">
              <p className="profile-signal-card-title">{group.label}</p>
              <ul className="profile-signal-card-list">
                {group.items.map(function(item) { return (
                  <li key={item}>
                    <span aria-hidden="true">&#9670;</span>
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
  certLabel,
  embedded = false,
}: {
  learningList:  ScoredSession[];
  communityList: ScoredSession[];
  funList:       ScoredSession[];
  sched?: ExpScheduleState;
  certLabel?: string | null;
  embedded?: boolean;
}) {
  const [activeDay, setActiveDay] = useState<EventDay>("Monday");
  const [planMode, setPlanMode] = useState<PlanConflictMode>("best-fit");
  const [mobileDays, setMobileDays] = useState(false);
  const [expandedDay, setExpandedDay] = useState<EventDay | null>("Monday");

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const apply = () => setMobileDays(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const dayLearning  = getSessionsForDay(learningList,  activeDay, planMode).slice(0, 3);
  const dayCommunity = getSessionsForDay(communityList, activeDay, planMode).slice(0, 3);
  const dayFun       = getSessionsForDay(funList,       activeDay, planMode).slice(0, 3);

  const hasContent = dayLearning.length > 0 || dayCommunity.length > 0 || dayFun.length > 0;

  const sectionClass = embedded ? "compass-module-block" : "section";

  return (
    <section className={sectionClass}>
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
          { id: "show-both" as const, label: "Show with all conflicts" },
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

      <div role="tablist" aria-label="Event days" className={`day-tab-list${mobileDays ? " day-tab-list--mobile-hidden" : ""}`}>
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

      {mobileDays && (
        <div className="day-accordion" aria-label="Event days">
          {EVENT_DAYS.map(day => {
            const dayHas =
              getSessionsForDay(learningList, day, planMode).length > 0 ||
              getSessionsForDay(communityList, day, planMode).length > 0 ||
              getSessionsForDay(funList, day, planMode).length > 0;
            const isOpen = expandedDay === day;
            return (
              <div key={day} className="day-accordion-item">
                <button
                  type="button"
                  className="day-accordion-trigger"
                  aria-expanded={isOpen}
                  onClick={() => {
                    setExpandedDay(prev => (prev === day ? null : day));
                    setActiveDay(day);
                  }}
                >
                  <span
                    className={`compass-section-chevron${isOpen ? " compass-section-chevron--open" : ""}`}
                    aria-hidden="true"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path
                        d="M6 4.5 10 8l-4 3.5"
                        stroke="currentColor"
                        strokeWidth="1.35"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  {day}
                  {!dayHas && <span className="day-accordion-muted">No sessions yet</span>}
                </button>
                {isOpen && (
                  <div className="day-accordion-panel">
                    {renderDayContent(day)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!mobileDays && (
        !hasContent ? (
          <p style={{ color: "var(--muted)", padding: "24px 0" }}>
            No sessions scheduled for {activeDay} yet. Check back as the catalog updates.
          </p>
        ) : (
          <div style={{ display: "grid", gap: "36px" }}>
            {dayLearning.length > 0 && (
              <PillarSection pillar="Learning" sessions={dayLearning} limit={3} sched={sched} certLabel={certLabel} />
            )}
            {dayCommunity.length > 0 && (
              <PillarSection pillar="Community" sessions={dayCommunity} limit={3} sched={sched} certLabel={certLabel} />
            )}
            {dayFun.length > 0 && (
              <PillarSection pillar="Fun" sessions={dayFun} limit={3} sched={sched} certLabel={certLabel} />
            )}
          </div>
        )
      )}
    </section>
  );

  function renderDayContent(day: EventDay) {
    const learn = getSessionsForDay(learningList, day, planMode).slice(0, 3);
    const comm = getSessionsForDay(communityList, day, planMode).slice(0, 3);
    const fun = getSessionsForDay(funList, day, planMode).slice(0, 3);
    const empty = learn.length === 0 && comm.length === 0 && fun.length === 0;
    if (empty) {
      return (
        <p style={{ color: "var(--muted)", padding: "12px 0" }}>
          No sessions scheduled for {day} yet.
        </p>
      );
    }
    return (
      <div style={{ display: "grid", gap: "24px" }}>
        {learn.length > 0 && <PillarSection pillar="Learning" sessions={learn} limit={3} sched={sched} certLabel={certLabel} />}
        {comm.length > 0 && <PillarSection pillar="Community" sessions={comm} limit={3} sched={sched} certLabel={certLabel} />}
        {fun.length > 0 && <PillarSection pillar="Fun" sessions={fun} limit={3} sched={sched} certLabel={certLabel} />}
      </div>
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Page component
// ─────────────────────────────────────────────────────────────────────────────

export default function ExperiencePage() {
  const [participant,  setParticipant]  = useState<RawDoc | null>(null);
  const [learningList, setLearningList] = useState<ScoredSession[]>([]);
  const [communityList,setCommunityList]= useState<ScoredSession[]>([]);
  const [funList,      setFunList]      = useState<ScoredSession[]>([]);
  const [allSessions,  setAllSessions]  = useState<ScoredSession[]>([]);
  const [champions,      setChampions]      = useState<ScoredChampion[]>([]);
  const [allChampions,   setAllChampions]   = useState<ScoredChampion[]>([]);
  const [detailChampion, setDetailChampion] = useState<ScoredChampion | null>(null);
  const [detailSession, setDetailSession] = useState<ScoredSession | null>(null);
  const [savedSessions,  setSavedSessions]  = useState<string[]>([]);
  const [savedSchedule,  setSavedSchedule]  = useState<string[]>([]);
  const [reservedSeats,  setReservedSeats]  = useState<string[]>([]);
  const [certificationGoals, setCertificationGoals] = useState<string[]>([]);
  const [activeCertificationId, setActiveCertificationId] = useState<string | null>(null);
  const [certificationResources, setCertificationResources] = useState<CertificationResourcesMap>({});
  const [pillarWeights, setPillarWeights] = useState<PillarWeights>(() => getCachedPillarWeights());
  const [hiddenSessions, setHiddenSessions] = useState<string[]>([]);
  const [connectionVault, setConnectionVault] = useState<ConnectionVaultRecord[]>([]);
  const [saveModalPerson, setSaveModalPerson] = useState<RecommendedPerson | null>(null);
  const [meetPeople,     setMeetPeople]     = useState<string[]>([]);
  const [hiddenPeople,   setHiddenPeople]   = useState<string[]>([]);
  const [championSources, setChampionSources] = useState<ReturnType<typeof championFromRaw>[]>([]);
  const [featuredChampions, setFeaturedChampions] = useState<FeaturedChampion[]>([]);
  const [sessionSpeakerNames, setSessionSpeakerNames] = useState<Set<string>>(() => new Set());
  const [counts,       setCounts]       = useState<EventCounts>({ participants: 0, sessions: 0, champions: 0 });
  const [status,       setStatus]       = useState<"loading" | "ready" | "error">("loading");
  const [errorMsg,     setErrorMsg]     = useState("");
  const { user, loading: authLoading } = useAuth();
  const participantId = user?.uid ?? "";
  const {
    prefs,
    hydrated,
    isMobile,
    customizeOpen,
    setCustomizeOpen,
    toggleSection,
    setModuleVisible,
    isModuleVisible,
    isSectionExpanded,
  } = useCompassUiPreferences();

  // ── Persist helper ─────────────────────────────────────────────────────────

  const persistPrefs = useCallback(async (updates: Record<string, unknown>) => {
    if (!participantId) return;
    const db = tryGetDb();
    if (!db) return;
    try { await setDoc(doc(db, BASE + "/participants/" + participantId), updates, { merge: true }); }
    catch (e) { console.error("[ExperienceAction] persist:", e); }
  }, [participantId]);

  // ── Session action handlers ─────────────────────────────────────────────────

  const handleSaveSession = useCallback((id: string) => {
    const session = allSessions.find(s => s.id === id);
    if (session && isCertificationActivityType(session)) {
      const raw = session as unknown as { certification_id?: string; certification_path?: { certification_id?: string } };
      const goalId = String(raw.certification_id ?? raw.certification_path?.certification_id ?? id);
      const nextGoals = certificationGoals.includes(goalId) ? certificationGoals : [...certificationGoals, goalId];
      setCertificationGoals(nextGoals);
      setActiveCertificationId(prev => prev ?? goalId);
      persistPrefs({
        certification_goals: nextGoals,
        active_certification_id: activeCertificationId ?? goalId,
      });
      return;
    }
    const { saved_sessions, saved_schedule } = addSessionToBothLists(savedSessions, savedSchedule, id);
    setSavedSessions(saved_sessions);
    setSavedSchedule(saved_schedule);
    persistPrefs({ saved_sessions, saved_schedule });
  }, [allSessions, certificationGoals, savedSessions, savedSchedule, persistPrefs, activeCertificationId]);

  const handleRemoveSession = useCallback((id: string) => {
    const { saved_sessions, saved_schedule } = removeSessionFromBothLists(savedSessions, savedSchedule, id);
    setSavedSessions(saved_sessions);
    setSavedSchedule(saved_schedule);
    persistPrefs({ saved_sessions, saved_schedule });
  }, [savedSessions, savedSchedule, persistPrefs]);

  const handleRemoveCertificationGoal = useCallback((id: string) => {
    const nextGoals = certificationGoals.filter(x => x !== id);
    const nextSaved = savedSessions.filter(x => x !== id);
    const nextSchedule = savedSchedule.filter(x => x !== id);
    const nextResources = { ...certificationResources };
    delete nextResources[id];
    const nextActive = activeCertificationId === id ? (nextGoals[0] ?? null) : activeCertificationId;
    setCertificationGoals(nextGoals);
    setSavedSessions(nextSaved);
    setSavedSchedule(nextSchedule);
    setCertificationResources(nextResources);
    setActiveCertificationId(nextActive);
    persistPrefs({
      certification_goals: nextGoals,
      saved_sessions: nextSaved,
      saved_schedule: nextSchedule,
      certification_resources: nextResources,
      active_certification_id: nextActive,
    });
  }, [certificationGoals, savedSessions, savedSchedule, certificationResources, activeCertificationId, persistPrefs]);

  const handleAddCertification = useCallback((cert: CertificationJourneyRecord) => {
    const certId = cert.certification_id;
    const nextGoals = certificationGoals.includes(certId) ? certificationGoals : [...certificationGoals, certId];
    setCertificationGoals(nextGoals);
    setActiveCertificationId(certId);
    persistPrefs({ certification_goals: nextGoals, active_certification_id: certId });
  }, [certificationGoals, persistPrefs]);

  const handleSelectCertification = useCallback((certId: string) => {
    setActiveCertificationId(certId);
    persistPrefs({ active_certification_id: certId });
  }, [persistPrefs]);

  const handlePinToStage = useCallback((stage: CertificationStage, item: JourneyLinkItem) => {
    const certId = activeCertificationId ?? certificationGoals[0];
    if (!certId) return;
    const current = certificationResources[certId] ?? emptyCertPins();
    const pinned = current[stage].includes(item.id) ? current[stage] : [...current[stage], item.id];
    const next = {
      ...certificationResources,
      [certId]: { ...current, [stage]: pinned },
    };
    setCertificationResources(next);
    persistPrefs({ certification_resources: next });
  }, [activeCertificationId, certificationGoals, certificationResources, persistPrefs]);

  const handleRemoveFromStage = useCallback((stage: CertificationStage, itemId: string) => {
    const certId = activeCertificationId ?? certificationGoals[0];
    if (!certId) return;
    const current = certificationResources[certId] ?? emptyCertPins();
    const nextCert = {
      ...current,
      [stage]: current[stage].filter(x => x !== itemId),
      links: stage === "learn" ? current.links.filter(l => l.id !== itemId) : current.links,
    };
    const next = { ...certificationResources, [certId]: nextCert };
    setCertificationResources(next);
    persistPrefs({ certification_resources: next });
  }, [activeCertificationId, certificationGoals, certificationResources, persistPrefs]);

  const handleAddCustomLink = useCallback((link: { title: string; url: string }) => {
    const certId = activeCertificationId ?? certificationGoals[0];
    if (!certId) return;
    const current = certificationResources[certId] ?? emptyCertPins();
    const entry = { id: `link-${Date.now()}`, title: link.title, url: link.url };
    const next = {
      ...certificationResources,
      [certId]: { ...current, links: [...current.links, entry] },
    };
    setCertificationResources(next);
    persistPrefs({ certification_resources: next });
  }, [activeCertificationId, certificationGoals, certificationResources, persistPrefs]);

  const handleHideSession = useCallback((id: string) => {
    const next = hiddenSessions.includes(id) ? hiddenSessions : [...hiddenSessions, id];
    setHiddenSessions(next);
    persistPrefs({ hidden_sessions: next });
  }, [hiddenSessions, persistPrefs]);

  // ── Champion action handlers ────────────────────────────────────────────────

  const savedPeople = useMemo(
    () => connectionVault.map(r => r.personId),
    [connectionVault],
  );

  const persistVault = useCallback(
    (next: ConnectionVaultRecord[]) => {
      const sanitized = sanitizeConnectionVaultForFirestore(next);
      setConnectionVault(sanitized);
      persistPrefs({
        connection_vault: sanitized,
        saved_people: sanitized.map(r => r.personId),
      });
    },
    [persistPrefs],
  );

  const resolvePersonForVault = useCallback(
    (person: RecommendedPerson) => {
      const champ = allChampions.find(c => c.id === person.id);
      if (!champ) return person;
      return {
        ...person,
        linkedin_url: champ.linkedin_url ?? person.linkedin_url,
        consent: champ.consent ?? person.consent,
        profile: person.profile ?? champ.profile,
      };
    },
    [allChampions],
  );

  const handleRemoveConnection = useCallback(
    (id: string) => {
      persistVault(removeVaultRecord(connectionVault, id));
    },
    [connectionVault, persistVault],
  );

  const handleRequestSavePerson = useCallback(
    (person: RecommendedPerson) => {
      if (connectionVault.some(r => r.personId === person.id)) {
        handleRemoveConnection(person.id);
        return;
      }
      setSaveModalPerson(person);
    },
    [connectionVault, handleRemoveConnection],
  );

  const handleSavePerson = useCallback(
    (id: string) => {
      const champ = allChampions.find(c => c.id === id);
      if (!champ) return;
      handleRequestSavePerson(toRecommendedPerson(champ, sessionSpeakerNames));
    },
    [allChampions, sessionSpeakerNames, handleRequestSavePerson],
  );

  const handleUpdateConnectionNote = useCallback(
    (personId: string, notes: string) => {
      persistVault(updateVaultRecordNote(connectionVault, personId, notes));
    },
    [connectionVault, persistVault],
  );

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

  const handleSaveHuddleContact = useCallback(
    (preview: HuddleParticipantPreview) => {
      if (!preview.participant_id) return;
      if (connectionVault.some(r => r.personId === preview.participant_id)) return;
      const record: ConnectionVaultRecord = {
        id: preview.participant_id,
        personId: preview.participant_id,
        displayName: preview.display_name,
        title: preview.job_title,
        organization: preview.organization,
        badges: preview.badges.includes("champion") ? ["champion"] : ["peer"],
        saveReason: "networking",
        dateAdded: new Date().toISOString(),
        sharedInterests: preview.shared_interest ? [preview.shared_interest] : [],
        sharedCommunities: [],
        sharedCertifications: preview.badges.includes("certification") ? ["Certification"] : [],
        notes: "",
        metAtHuddle: preview.display_name,
      };
      persistVault([record, ...connectionVault]);
    },
    [connectionVault, persistVault],
  );

  // ── Derived state for action bars ──────────────────────────────────────────

  const mergedSavedSessionIds = useMemo(
    () => mergeSavedSessionIds(savedSessions, savedSchedule),
    [savedSessions, savedSchedule],
  );

  const huddleSessionInputs = useMemo(
    () => allSessions.map(s => {
      const raw = s as unknown as RawDoc;
      return {
        id: s.id,
        title: String(s.title ?? "Session"),
        start_time: s.start_time ?? (raw.schedule as { start_time?: string } | undefined)?.start_time,
        end_time: (raw.end_time as string | undefined) ?? (raw.schedule as { end_time?: string } | undefined)?.end_time,
        schedule: s.schedule,
      };
    }),
    [allSessions],
  );

  const huddlesController = useHuddles({
    participantUid: participantId || undefined,
    participantRaw: participant,
    savedSessionIds: mergedSavedSessionIds,
    reservedSessionIds: reservedSeats,
    sessions: huddleSessionInputs,
    displayLimit: 5,
  });

  const handleShowSessionInfo = useCallback((id: string) => {
    const found = allSessions.find(s => s.id === id);
    if (found) setDetailSession(found);
  }, [allSessions]);

  const schedState = useMemo<ExpScheduleState>(() => ({
    savedSessions: mergedSavedSessionIds, hiddenSessions,
    onSave: handleSaveSession, onRemove: handleRemoveSession, onHide: handleHideSession,
    onShowInfo: handleShowSessionInfo,
  }), [mergedSavedSessionIds, hiddenSessions, handleSaveSession, handleRemoveSession, handleHideSession, handleShowSessionInfo]);

  const rankedSessionsForVoice = useMemo(
    () => [...learningList, ...communityList, ...funList]
      .sort((a, b) => b.compass_score - a.compass_score),
    [learningList, communityList, funList],
  );

  const certGoalIds = useMemo(
    () => participant
      ? gatherCertificationGoalIds(
          {
            ...participant,
            certification_goals: certificationGoals,
            saved_sessions: savedSessions,
            saved_schedule: savedSchedule,
          },
          allSessions,
        )
      : [],
    [participant, certificationGoals, savedSessions, savedSchedule, allSessions],
  );
  const selectedCertifications = useMemo(
    () => resolveSelectedCertificationGoals(allSessions, certGoalIds),
    [allSessions, certGoalIds],
  );

  const handleConfirmSavePerson = useCallback(
    (reason: SaveReason) => {
      if (!saveModalPerson || !participant) return;
      const enriched = resolvePersonForVault(saveModalPerson);
      const sig = (participant.event_signal_profile as RawDoc) ?? {};
      const profileSignals = [
        ...((sig.tech_tracks as string[]) ?? []),
        ...((sig.goals as string[]) ?? []),
      ];
      const viewerUniversities = ((participant.education as Array<{ institution?: string }> | undefined) ?? [])
        .map(e => e.institution?.trim().toLowerCase())
        .filter((u): u is string => !!u);
      const certLabels = selectedCertifications.map(c => c.title).filter(Boolean);
      const record = buildConnectionRecord({
        person: enriched,
        saveReason: reason,
        badgeContext: { viewerUniversities, isChampion: true },
        profileSignals,
        certificationGoalLabels: certLabels,
        mutual: isMutualWithInbound(
          enriched.display_name,
          enriched.id,
          savedPeople,
          SAMPLE_INBOUND_SIGNALS,
        ),
      });
      const next = [...connectionVault.filter(r => r.personId !== record.personId), record];
      persistVault(next);
      setSaveModalPerson(null);
    },
    [
      saveModalPerson,
      participant,
      resolvePersonForVault,
      selectedCertifications,
      savedPeople,
      connectionVault,
      persistVault,
    ],
  );

  const certLabel = participant
    ? getCertificationJourneyTitle(participant, selectedCertifications)
    : null;
  const activeCertification = useMemo(
    () => resolveActiveCertification(selectedCertifications, certLabel, activeCertificationId),
    [selectedCertifications, certLabel, activeCertificationId],
  );
  const activeCertPins = useMemo(() => {
    const id = activeCertification?.goal.id;
    if (!id || id === "inferred-journey") return emptyCertPins();
    return certificationResources[id] ?? emptyCertPins();
  }, [activeCertification, certificationResources]);
  const certificationJourneyPlan = useMemo(() => {
    if (!activeCertification || certificationGoals.length === 0) return null;
    const huddles = huddlesController.liveOpportunities;
    return buildCertificationJourneyPlan(
      activeCertification,
      allSessions,
      allChampions,
      huddles,
      activeCertPins,
    );
  }, [activeCertification, allSessions, allChampions, participant, certificationGoals.length, activeCertPins, huddlesController.liveOpportunities]);

  const showCertJourney = useMemo(
    () => (participant ? shouldShowCertificationJourney(participant, certGoalIds) : false),
    [participant, certGoalIds],
  );

  const pGoalsForBalance = ((participant?.event_signal_profile as RawDoc)?.goals as string[]) ?? [];
  const pTracksForBalance = ((participant?.event_signal_profile as RawDoc)?.tech_tracks as string[]) ?? [];

  const rankedHuddlesForBalance = huddlesController.liveOpportunities;

  const balancedInput = useMemo((): BalancedRecommendationInput => ({
    learningSessions: learningList,
    communitySessions: communityList,
    funSessions: funList,
    champions: champions.filter(c => !hiddenPeople.includes(c.id)),
    liveHuddles: rankedHuddlesForBalance,
    hiddenSessionIds: hiddenSessions,
    hiddenPeopleIds: hiddenPeople,
    rotationSeed: new Date().getDay(),
    hasCertIntent: showCertJourney,
    pillarWeights,
    sessionMeta: (s) => sessionMeta(s as ScoredSession),
    sessionType: (s) => sessionTypeLabel(s as ScoredSession),
    sessionReason: (s) => resolveSessionWhyLine(s as ScoredSession, certLabel),
  }), [
    learningList, communityList, funList, champions, hiddenPeople, hiddenSessions,
    rankedHuddlesForBalance, showCertJourney, certLabel, pillarWeights,
  ]);

  const balancedNextBestMove = useMemo(
    () => pickBalancedNextBestMove(balancedInput),
    [balancedInput],
  );

  const balancedMoveSet = useMemo(
    () => buildBalancedMoveSet(balancedInput),
    [balancedInput],
  );

  const balancedRecommendedSessions = useMemo(
    () => selectBalancedSessionBand(
      [...learningList, ...communityList, ...funList].filter(s => s.compass_score > 0),
      6,
      showCertJourney,
    ),
    [learningList, communityList, funList, showCertJourney],
  );

  const recommendedSessions = useMemo(() => {
    const byId = new Map(
      [...learningList, ...communityList, ...funList].map(s => [s.id, s]),
    );
    return balancedRecommendedSessions
      .map(s => byId.get(s.id))
      .filter((s): s is ScoredSession => !!s);
  }, [balancedRecommendedSessions, learningList, communityList, funList]);

  const nbmSession = useMemo(() => {
    if (balancedNextBestMove?.type !== "session" || !balancedNextBestMove.entityId) return null;
    return allSessions.find(s => s.id === balancedNextBestMove.entityId) ?? null;
  }, [balancedNextBestMove, allSessions]);

  const speakerCatalog = useMemo(
    () => buildSpeakerCatalog(championSources, allSessions.map(sessionFromScored)),
    [championSources, allSessions],
  );

  const speakerCtx = useMemo((): SpeakerParticipantContext => {
    if (!participant) return {};
    const sig = (participant.event_signal_profile as RawDoc) ?? {};
    const intel = (participant.compass_intelligence as RawDoc) ?? {};
    return {
      tracks: (sig.tech_tracks as string[]) ?? [],
      goals: (sig.goals as string[]) ?? [],
      keywords: (intel.matching_keywords as string[]) ?? [],
      certificationGoalLabels: selectedCertifications.map(c => c.title),
      hasCertIntent: showCertJourney,
    };
  }, [participant, selectedCertifications, showCertJourney]);

  const rankedExperts = useMemo(
    () => rankRecommendedExperts(speakerCatalog, speakerCtx, 4),
    [speakerCatalog, speakerCtx],
  );

  const recommendedExpertPeople = useMemo(
    () => rankedExperts.map(speakerToRecommendedPerson),
    [rankedExperts],
  );

  const topSpeaker = rankedExperts[0] ?? null;

  useEffect(() => {
    async function load() {
      const db = tryGetDb();
      if (!db) {
        setErrorMsg("Firebase is not configured. Add NEXT_PUBLIC_FIREBASE_* to .env.local.");
        setStatus("error");
        return;
      }
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

        setSessionSpeakerNames(extractSessionSpeakerNames(rawSessions));

        const scored = rawSessions
          .map((s) => scoreSession(pData, s))
          .sort((a, b) => b.compass_score - a.compass_score);

        const learning:  ScoredSession[] = [];
        const community: ScoredSession[] = [];
        const fun:       ScoredSession[] = [];

        for (const s of scored) {
          const p = getPillar(s);
          if (!p) continue;
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

        setParticipant(pData);
        setAllSessions(scored);
        setLearningList(learning);
        setCommunityList(community);
        setFunList(fun);
        setChampions(scoredChampions);
        setAllChampions(allScoredChampions);
        setChampionSources(rawChampions.map(c => championFromRaw(c)));
        setCounts({ participants: partSnap.size, sessions: sessSnap.size, champions: champSnap.size });

        // Load persisted action state
        setSavedSessions( (pData.saved_sessions  as string[]) ?? []);
        setSavedSchedule( (pData.saved_schedule  as string[]) ?? []);
        setReservedSeats( (pData.reserved_seats  as string[]) ?? []);
        setCertificationGoals((pData.certification_goals as string[]) ?? []);
        setActiveCertificationId((pData.active_certification_id as string) ?? null);
        setCertificationResources((pData.certification_resources as CertificationResourcesMap) ?? {});
        setHiddenSessions((pData.hidden_sessions as string[]) ?? []);
        const speakerNames = extractSessionSpeakerNames(rawSessions);
        let vault = (pData.connection_vault as ConnectionVaultRecord[]) ?? [];
        const legacySaved = (pData.saved_people as string[]) ?? [];
        if (vault.length === 0 && legacySaved.length > 0) {
          const sig = (pData.event_signal_profile as RawDoc) ?? {};
          const profileSignals = [
            ...((sig.tech_tracks as string[]) ?? []),
            ...((sig.goals as string[]) ?? []),
          ];
          vault = sanitizeConnectionVaultForFirestore(
            migrateLegacySavedPeople(
              legacySaved,
              allScoredChampions.map(c => toRecommendedPerson(c, speakerNames)),
              { badgeContext: { isChampion: true }, profileSignals },
            ),
          );
          void setDoc(
            doc(db, BASE + "/participants/" + participantId),
            { connection_vault: vault, saved_people: vault.map(r => r.personId) },
            { merge: true },
          ).catch(e => console.error("[ExperienceAction] vault migrate:", e));
        }
        setConnectionVault(vault);
        setMeetPeople(    (pData.meet_people     as string[]) ?? []);
        setHiddenPeople(  (pData.hidden_people   as string[]) ?? []);

        setStatus("ready");

        void loadRecommendationBalanceConfig().then(setPillarWeights);

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
    } else if (!authLoading && !participantId) {
      setStatus("error");
      setErrorMsg("Sign in to view your personalized Compass experience.");
    }
  }, [authLoading, participantId]);

  const sortedConnectionVault = useMemo(
    () =>
      [...connectionVault].sort(
        (a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime(),
      ),
    [connectionVault],
  );

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
        {!participantId && (
          <p style={{ marginTop: "16px" }}>
            <a href="/txc/login" className="action-chip">Sign in →</a>
          </p>
        )}
        {participantId && (
          <p style={{ color: "var(--muted)", marginTop: "10px", fontSize: "0.88rem" }}>
            Verify Firebase environment variables and Firestore security rules.
          </p>
        )}
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
  const trustSignals = buildCompassTrustSignals(participant, sig);

  // My Schedule — timed sessions only (certifications are learning goals, not calendar blocks)
  const myScheduleSessions = mergedSavedSessionIds
    .map(id => allSessions.find(s => s.id === id))
    .filter((s): s is ScoredSession => !!s && !isCertificationActivityType(s));

  const sharedMomentItems = isMobile ? HIGHLIGHT_DATA.slice(0, 1) : HIGHLIGHT_DATA;
  const profileSignals = [...pTracks, ...pGoals];

  const viewerUniversities = ((participant.education as Array<{ institution?: string }> | undefined) ?? [])
    .map(e => e.institution?.trim().toLowerCase())
    .filter((u): u is string => !!u);

  const peopleBadgeContext = { viewerUniversities };

  const recommendedPeople = champions
    .filter(c => !hiddenPeople.includes(c.id))
    .map(c => toRecommendedPerson(c, sessionSpeakerNames));

  const savedChampionRefs = savedPeople
    .map(id => allChampions.find(c => c.id === id))
    .filter((c): c is ScoredChampion => !!c)
    .map(c => ({ id: c.id, display_name: c.display_name }));

  return (
    <>
      {saveModalPerson && (
        <SaveConnectionModal
          person={saveModalPerson}
          onConfirm={handleConfirmSavePerson}
          onClose={() => setSaveModalPerson(null)}
        />
      )}

      <CustomizeCompassPanel
        open={customizeOpen}
        prefs={prefs}
        onClose={() => setCustomizeOpen(false)}
        onModuleChange={setModuleVisible}
      />

      <section className="section no-top-border experience-hero-compact">
        <div className="experience-hero-toolbar">
          <div className="section-kicker">My Compass</div>
          <button
            type="button"
            className="compass-customize-trigger"
            onClick={() => setCustomizeOpen(true)}
            aria-label="Customize My Compass"
          >
            ⚙ Customize
          </button>
        </div>
        <div className="experience-hero-copy">
          <h1 className="experience-hero-title">{displayName}</h1>
          <p className="experience-hero-tagline">Your personalized event.</p>
          <p className="compass-module-note" style={{ marginTop: "10px", maxWidth: "42rem" }}>
            {COMPASS_BALANCE_EXPLANATION}
          </p>
          {(jobTitle || company) && (
            <p className="experience-hero-role">
              {[jobTitle, company].filter(Boolean).join(" · ")}
            </p>
          )}
          {(tracks.length > 0 || goals.length > 0) && (() => {
            const all  = [...tracks, ...goals];
            const show = all.slice(0, 6);
            const rest = all.length - show.length;
            return (
              <div className="experience-hero-chips">
                {show.map(item => (
                  <span key={item} className="experience-hero-chip">{item}</span>
                ))}
                {rest > 0 && <span className="experience-hero-chip experience-hero-chip--muted">+{rest} more</span>}
              </div>
            );
          })()}
        </div>
      </section>

      <SpeakerIntelligenceProvider
        catalog={speakerCatalog}
        ctx={speakerCtx}
        onViewSpeaker={handleDetailsPerson}
      >
      <div className="compass-sections-stack">
        {/* TODAY */}
        <CompassSection
          id="today"
          expanded={hydrated && isSectionExpanded("today")}
          onToggle={() => toggleSection("today")}
        >
          {isModuleVisible("ask_compass") && (
            <div className="compass-module-block">
              <VoiceCompassButton
                variant="companion"
                nextBestMove={balancedNextBestMove}
                balancedMoves={balancedMoveSet}
                topSession={nbmSession ?? rankedSessionsForVoice[0] ?? null}
                topChampion={champions[0] ?? null}
                topSpeaker={topSpeaker}
                rankedSpeakers={rankedExperts}
                speakerCatalog={speakerCatalog}
                speakerCtx={speakerCtx}
                rankedSessions={rankedSessionsForVoice}
                participantGoals={pGoals}
                participantTracks={pTracks}
                certLabel={certLabel}
                certificationJourney={certificationJourneyPlan}
                isEnrolled
                onAddToSchedule={handleSaveSession}
                onDoNotSuggestSession={handleHideSession}
                onSavePerson={handleSavePerson}
                onDoNotSuggestPerson={handleHidePerson}
              />
            </div>
          )}

          {isModuleVisible("next_best_move") && balancedNextBestMove && (
            <div className="compass-module-block intelligence-surface intelligence-surface--prominent">
              <div className="section-head narrow">
                <div>
                  <div className="section-kicker">Next best move</div>
                  <h2>One balanced pick for right now.</h2>
                </div>
              </div>
              <NextBestMoveCard
                nextBestMove={balancedNextBestMove}
                intelSession={nbmSession}
                certLabel={certLabel}
              />
              {balancedMoveSet.length > 1 && (
                <div className="balanced-move-section">
                  <p className="compass-module-note balanced-move-section__note">
                    {COMPASS_BALANCE_EXPLANATION}
                  </p>
                  <BalancedMoveGrid moves={balancedMoveSet} />
                </div>
              )}
            </div>
          )}

          {isModuleVisible("shared_moments") && (
            <div className="compass-module-block">
              <div className="section-head narrow">
                <div>
                  <div className="section-kicker">Shared moments</div>
                  <h2>Not to miss.</h2>
                </div>
              </div>
              <div className="compass-highlight-grid">
                {sharedMomentItems.map(h => <HighlightActionCard key={h.id} h={h} />)}
              </div>
              {isMobile && HIGHLIGHT_DATA.length > 1 && (
                <p className="compass-module-note">
                  Expand Community below for more anchor moments.
                </p>
              )}
            </div>
          )}
        </CompassSection>

        {/* MY GOALS — certifications and credential paths */}
        {isModuleVisible("certification_journey") && (
        <CompassSection
          id="goals"
          expanded={hydrated && isSectionExpanded("goals")}
          onToggle={() => toggleSection("goals")}
        >
            <CertificationJourney
              visible
              plan={certificationJourneyPlan}
              trackedCerts={selectedCertifications}
              activeCertId={activeCertificationId}
              hasExplicitGoals={certificationGoals.length > 0}
              onAddCertification={handleAddCertification}
              onSelectCertification={handleSelectCertification}
              onRemoveCertification={handleRemoveCertificationGoal}
              onPinToStage={handlePinToStage}
              onRemoveFromStage={handleRemoveFromStage}
              onAddCustomLink={handleAddCustomLink}
              embedded
            />
        </CompassSection>
        )}

        {/* MY LEARNING — sessions, week plan, saved schedule */}
        <CompassSection
          id="learning"
          expanded={hydrated && isSectionExpanded("learning")}
          onToggle={() => toggleSection("learning")}
        >
          {isModuleVisible("four_day_plan") && (
            <DayTabExperience
              learningList={learningList}
              communityList={communityList}
              funList={funList}
              sched={schedState}
              certLabel={certLabel}
              embedded
            />
          )}

          {isModuleVisible("recommended_sessions") && recommendedSessions.length > 0 && (
            <div className="compass-module-block">
              <div className="section-head narrow">
                <div>
                  <div className="section-kicker">Recommended</div>
                  <h2>A curated mix across learning, community, and fun.</h2>
                </div>
              </div>
              <p className="compass-module-note" style={{ marginBottom: "14px" }}>
                {COMPASS_BALANCE_EXPLANATION}
              </p>
              <div className="intelligence-row">
                {recommendedSessions.map(s => (
                  <SessionCard key={s.id} session={s} sched={schedState} certLabel={certLabel} />
                ))}
              </div>
            </div>
          )}

          {isModuleVisible("my_schedule") && myScheduleSessions.length > 0 && (
            <div className="compass-module-block">
              <div className="section-head narrow">
                <div>
                  <div className="section-kicker">Saved schedule</div>
                  <h2>{myScheduleSessions.length} session{myScheduleSessions.length !== 1 ? "s" : ""} saved.</h2>
                </div>
              </div>
              <div className="compass-schedule-list">
                {myScheduleSessions.map(s => {
                  const type = sessionTypeLabel(s);
                  const track = s.tracks?.primary_track ?? "";
                  const meta = sessionMeta(s);
                  return (
                    <div key={s.id} className="compass-schedule-row">
                      <div>
                        <p className="compass-schedule-type">{type}{track ? " · " + track : ""}</p>
                        <p className="compass-schedule-title">{s.title}</p>
                        {meta && <p className="compass-schedule-meta">{meta}</p>}
                      </div>
                      <button type="button" className="compass-schedule-remove" onClick={() => handleRemoveSession(s.id)}>
                        Remove
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {isModuleVisible("export_panel") && (
            <div className="compass-module-block">
              <ExportPanel participantId={participantId} sessions={allSessions} />
            </div>
          )}
        </CompassSection>

        {/* MY PEOPLE */}
        <CompassSection
          id="people"
          expanded={hydrated && isSectionExpanded("people")}
          onToggle={() => toggleSection("people")}
        >
          {isModuleVisible("conversations") && (
            <div className="compass-module-block live-opportunities-section">
              <LiveOpportunities
                huddles={huddlesController}
                speakerCatalog={speakerCatalog}
                participantUid={participantId}
                userDisplayName={displayName}
                userFirstName={firstName || displayName.split(/\s+/)[0] || "You"}
                hostJobTitle={String(participant?.job_title ?? "")}
                hostOrganization={String(participant?.organization ?? participant?.company ?? "")}
                visibleLimit={5}
                embedded
                onSaveContact={handleSaveHuddleContact}
              />
            </div>
          )}

          {isModuleVisible("recommended_connections") && (
            <RecommendedConnectionsSection
              people={recommendedPeople}
              experts={recommendedExpertPeople}
              profileSignals={profileSignals}
              badgeContext={peopleBadgeContext}
              embedded
              actions={{
                savedPeople,
                hiddenPeople,
                onSave: handleSavePerson,
                onRequestSave: handleRequestSavePerson,
                onHide: handleHidePerson,
                onDetails: handleDetailsPerson,
              }}
            />
          )}

          {isModuleVisible("my_connections") || isModuleVisible("people_interested_in_me") ? (
            <section className="compass-module-block people-follow-up-split">
              <div className="people-follow-up-split__layout">
                {isModuleVisible("my_connections") && (
                  <MyConnectionsSection
                    records={sortedConnectionVault}
                    onViewProfile={handleDetailsPerson}
                    onRemove={handleRemoveConnection}
                    onUpdateNote={handleUpdateConnectionNote}
                    splitColumn
                  />
                )}

                {isModuleVisible("my_connections") && isModuleVisible("people_interested_in_me") && (
                  <div className="people-follow-up-split__divider" role="separator" aria-orientation="vertical" />
                )}

                {isModuleVisible("people_interested_in_me") && (
                  <PeopleInterestedSection
                    inboundSignals={SAMPLE_INBOUND_SIGNALS}
                    savedChampionRefs={savedChampionRefs}
                    savedPeople={savedPeople}
                    onRequestSave={handleRequestSavePerson}
                    onSave={handleSavePerson}
                    onShowDetails={handleDetailsPerson}
                    profileSignals={profileSignals}
                    splitColumn
                  />
                )}
              </div>
            </section>
          ) : null}
        </CompassSection>

        {/* MY PROFILE */}
        <CompassSection
          id="profile"
          expanded={hydrated && isSectionExpanded("profile")}
          onToggle={() => toggleSection("profile")}
        >
          {(isModuleVisible("week_balance") || isModuleVisible("compass_signal")) && (
            <div className="compass-profile-summary">
              {isModuleVisible("week_balance") && (
                <WeekInBalance
                  people={champions.filter(c => c.compass_score > 0).length}
                  learning={learningList.length}
                  community={communityList.length}
                  fun={funList.length}
                />
              )}
              {isModuleVisible("compass_signal") && (
                <CompassSignalCompact participant={participant} />
              )}
            </div>
          )}

          {isModuleVisible("profile_signals") && (
            <WhatYouToldCompass participant={participant} embedded />
          )}

          {isModuleVisible("intent_summary") && (
            <WhyCompassRecommendedWeek signals={trustSignals} embedded defaultOpen />
          )}
        </CompassSection>

        {/* COMMUNITY */}
        <CompassSection
          id="community"
          expanded={hydrated && isSectionExpanded("community")}
          onToggle={() => toggleSection("community")}
        >
          {isModuleVisible("community_activity") && (
            <div className="compass-module-block">
              <CommunityVoices champions={featuredChampions} />
            </div>
          )}

          {isModuleVisible("techxchange_tv") && (
            <div className="compass-module-block">
              <TechXchangeTV />
            </div>
          )}

          {isModuleVisible("live_highlights") && (
            <div className="compass-module-block">
              <div className="section-head narrow">
                <div>
                  <div className="section-kicker">Live highlights</div>
                  <h2>Anchor moments this week.</h2>
                </div>
              </div>
              <div className="compass-highlight-grid">
                {HIGHLIGHT_DATA.map(h => <HighlightActionCard key={h.id} h={h} />)}
              </div>
            </div>
          )}
        </CompassSection>
      </div>

      <section className="final-band">
        <div>
          <h2>Your Compass is live.</h2>
          <p>
            Refine your profile to sharpen every recommendation.
          </p>
        </div>
        <a href="/txc/enroll?mode=edit" className="action-chip">Refine My Compass →</a>
      </section>
      </SpeakerIntelligenceProvider>

      {detailChampion && (
        <ChampionDetailModal
          champion={detailChampion}
          isLoggedIn
          isSaved={savedPeople.includes(detailChampion.id)}
          matchReasons={detailChampion.compass_reasons}
          onToggleSave={() => {
            if (savedPeople.includes(detailChampion.id)) {
              handleRemoveConnection(detailChampion.id);
            } else {
              handleRequestSavePerson(toRecommendedPerson(detailChampion, sessionSpeakerNames));
            }
          }}
          onClose={() => setDetailChampion(null)}
        />
      )}

      {detailSession && (
        <SessionDetailModal
          session={detailSession}
          allSessions={allSessions}
          speakerCatalog={speakerCatalog}
          speakerCtx={speakerCtx}
          onViewSpeaker={handleDetailsPerson}
          onClose={() => setDetailSession(null)}
        />
      )}
    </>
  );
}
