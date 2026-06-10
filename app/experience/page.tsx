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
// Firestore path: organizations/ibm/events/txc2026
// Participant:    ATT-0001 (no auth yet)
// CSS:            globals.css class names only
// =============================================================================

import { useEffect, useState } from "react";
import { db } from "../../src/lib/firebase";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { getFeaturedChampions } from "@/services/firestoreService";
import NextBestMoveCard from "@/components/experience/NextBestMove";
import EventHighlights    from "@/components/experience/EventHighlights";
import TechXchangeBanner  from "@/components/experience/TechXchangeBanner";
import CommunityVoices    from "@/components/experience/CommunityVoices";
import PeopleRecommendations from "@/components/experience/PeopleRecommendations";
import ExperienceBalance  from "@/components/experience/ExperienceBalance";
import PrintExport        from "@/components/experience/PrintExport";
import TechXchangeTV      from "@/components/experience/TechXchangeTV";
import { useAuth } from "@/context/AuthContext";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const BASE           = "organizations/ibm/events/txc2026";
const DEV_FALLBACK_ID = "ATT-0001";

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
  compass_score: number;
  shared_keywords: string[];
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

  for (const t of pTracks)   { if (sTracks.includes(t))     { score += W.track;    reasons.push(`Track match: ${t}`); } }
  for (const g of pGoals)    { if (sIntents.includes(g))    { score += W.goal;     reasons.push(`Goal match: ${g}`); } }
  for (const n of pNeeds)    { if (sNeeds.includes(n))      { score += W.need;     reasons.push(`Need match: ${n}`); } }
  for (const r of pRoles)    { if (sRoles.includes(r))      { score += W.role;     reasons.push(`Role match: ${r}`); } }
  if (pIndustry && sIndustries.includes(pIndustry)) { score += W.industry; reasons.push(`Industry match: ${reg.industry}`); }
  for (const k of pKeywords) { if (sKeywords.includes(k))  { score += W.keyword;  reasons.push(`Keyword match: ${k}`); } }
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
    return { id: String(raw.id ?? ""), display_name: String(raw.display_name ?? "Champion"), compass_score: 0, shared_keywords: [] };
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
  return {
    id:           String(raw.id ?? ""),
    display_name: String(raw.display_name ?? "Champion"),
    title:        raw.title        as string | undefined,
    organization: raw.organization as string | undefined,
    profile:      raw.profile      as ScoredChampion["profile"],
    attendance:   raw.attendance   as ScoredChampion["attendance"],
    compass_score:   score,
    shared_keywords: shared,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components  (unchanged from original)
// ─────────────────────────────────────────────────────────────────────────────

function ScoreBadge({ score, size = "md" }: { score: number; size?: "sm" | "md" | "lg" }) {
  const sz = { sm: { badge: 42, num: "1.1rem" }, md: { badge: 54, num: "1.45rem" }, lg: { badge: 72, num: "2rem" } }[size];
  return (
    <div className="compass-score-badge" style={{ minWidth: sz.badge, minHeight: sz.badge }} title={`Compass score: ${score}`}>
      <span className="score-number" style={{ fontSize: sz.num }}>{score}</span>
      <span className="score-label">fit</span>
    </div>
  );
}

function SessionCard({ session }: { session: ScoredSession }) {
  const type  = sessionTypeLabel(session);
  const track = session.tracks?.primary_track ?? "";
  const meta  = sessionMeta(session);
  const tags  = [...(session.tracks?.topics ?? []), ...(session.tracks?.products ?? [])].slice(0, 4);
  return (
    <article className="opportunity-card">
      <div className="card-meta">
        <span>{type}{track ? ` · ${track}` : ""}</span>
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
    </article>
  );
}

function ChampionCard({ champion }: { champion: ScoredChampion }) {
  const initial = champion.display_name[0]?.toUpperCase() ?? "C";
  const domains = (champion.profile?.domains ?? []).slice(0, 3);
  return (
    <article className="champion-mini">
      <div className="avatar-fallback" aria-hidden="true">{initial}</div>
      <div>
        <h3>{champion.display_name}</h3>
        {(champion.title || champion.organization) && (
          <p>{[champion.title, champion.organization].filter(Boolean).join(" · ")}</p>
        )}
        {domains.length > 0 && <small>{domains.join(" · ")}</small>}
        {champion.shared_keywords.length > 0 && (
          <div className="chip-row" style={{ marginTop: "10px" }}>
            {champion.shared_keywords.slice(0, 3).map((kw) => (
              <span key={kw} className="chip">{kw}</span>
            ))}
          </div>
        )}
        {champion.attendance?.available_for_1x1 && (
          <p style={{ marginTop: "8px", fontSize: "0.82rem", color: "var(--accent)" }}>
            Available for 1:1
          </p>
        )}
      </div>
    </article>
  );
}

function PillarSection({ pillar, sessions, limit = 3 }: { pillar: string; sessions: ScoredSession[]; limit?: number }) {
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
        {sessions.slice(0, limit).map((s) => <SessionCard key={s.id} session={s} />)}
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
// NEW: "What You Told Compass" section  (Wave 4 addition)
// ─────────────────────────────────────────────────────────────────────────────

function WhatYouToldCompass({ participant }: { participant: RawDoc }) {
  const sig    = (participant.event_signal_profile as RawDoc) ?? {};
  const intent = (sig.intent as RawDoc) ?? {};

  const goals   = ((sig.goals          as string[]) ?? []).slice(0, 5);
  const tracks  = ((sig.tech_tracks    as string[]) ?? []).slice(0, 6);
  const needs   = ((intent.needs       as string[]) ?? []).slice(0, 4);
  const openTo  = ((sig.open_to        as string[]) ?? []).slice(0, 4);

  const groups = [
    { label: "Goals",      items: goals,  accent: true  },
    { label: "Tech tracks", items: tracks, accent: false },
    { label: "Needs",       items: needs,  accent: false },
    { label: "Open to",     items: openTo, accent: false },
  ].filter(g => g.items.length > 0);

  if (groups.length === 0) return null;

  return (
    <section className="section">
      <div className="section-kicker">What you told Compass</div>
      <p style={{ color: "var(--muted)", margin: "4px 0 20px", fontSize: "0.92rem" }}>
        These signals drive every recommendation on this page.{" "}
        <a href="/enroll" style={{ color: "var(--accent)" }}>Update your intent →</a>
      </p>

      <div
        style={{
          display:         "grid",
          gridTemplateColumns: `repeat(${groups.length}, minmax(0, 1fr))`,
          gap:             "1px",
          background:      "var(--line)",
          border:          "1px solid var(--line)",
        }}
      >
        {groups.map(group => (
          <div key={group.label} style={{ background: "var(--panel)", padding: "18px 20px" }}>
            <p style={{
              color:         group.accent ? "var(--accent)" : "var(--muted)",
              fontSize:      "0.72rem",
              fontWeight:    680,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              margin:        "0 0 10px",
            }}>
              {group.label}
            </p>
            <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "6px" }}>
              {group.items.map(item => (
                <li key={item} style={{ display: "flex", alignItems: "flex-start", gap: "7px", color: "var(--soft)", fontSize: "0.9rem", lineHeight: 1.35 }}>
                  <span style={{ color: "var(--accent)", fontSize: "0.5rem", marginTop: "0.5em", flexShrink: 0 }}>◆</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NEW: Day-tab experience  (Wave 4 addition)
// Replaces flat pillar sections.
// Distributes sessions by schedule.day when present, falls back to
// even distribution for demo when day data is sparse.
// ─────────────────────────────────────────────────────────────────────────────

const EVENT_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday"] as const;
type EventDay = typeof EVENT_DAYS[number];

function getSessionsForDay(sessions: ScoredSession[], day: EventDay, fallbackIndex: number): ScoredSession[] {
  // Try matching on schedule.day (exact or case-insensitive includes)
  const matched = sessions.filter(s => {
    const d = resolve(s as unknown as RawDoc, "date", "schedule.day");
    return d && d.toLowerCase().includes(day.toLowerCase());
  });
  if (matched.length > 0) return matched;

  // Fallback: even distribution across 4 days for demo
  const perDay = Math.ceil(sessions.length / 4);
  return sessions.slice(fallbackIndex * perDay, (fallbackIndex + 1) * perDay);
}

function DayTabExperience({
  learningList,
  communityList,
  funList,
  champions,
}: {
  learningList:  ScoredSession[];
  communityList: ScoredSession[];
  funList:       ScoredSession[];
  champions:     ScoredChampion[];
}) {
  const [activeDay, setActiveDay] = useState<EventDay>("Monday");
  const dayIdx = EVENT_DAYS.indexOf(activeDay);

  const dayLearning  = getSessionsForDay(learningList,  activeDay, dayIdx).slice(0, 3);
  const dayCommunity = getSessionsForDay(communityList, activeDay, dayIdx).slice(0, 3);
  const dayFun       = getSessionsForDay(funList,       activeDay, dayIdx).slice(0, 3);
  // Champions shown on every day — rotated slightly per day to feel fresh
  const dayChampions = champions.slice(dayIdx % 2, (dayIdx % 2) + 3);

  const hasContent = dayLearning.length > 0 || dayCommunity.length > 0 || dayFun.length > 0 || dayChampions.length > 0;

  return (
    <section className="section">
      <div className="section-head">
        <div>
          <div className="section-kicker">Your four-day plan</div>
          <h2>TechXchange 2026.</h2>
        </div>
        <p>
          Community, Learning, and Fun — organised day-by-day and scored for your profile.
        </p>
      </div>

      {/* Tab row */}
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
        {EVENT_DAYS.map(day => (
          <button
            key={day}
            role="tab"
            aria-selected={activeDay === day}
            onClick={() => setActiveDay(day)}
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
        ))}
      </div>

      {/* Day content */}
      {!hasContent ? (
        <p style={{ color: "var(--muted)", padding: "24px 0" }}>
          No sessions scheduled for {activeDay} yet. Check back as the catalog updates.
        </p>
      ) : (
        <div style={{ display: "grid", gap: "36px" }}>

          {/* Learning */}
          {dayLearning.length > 0 && (
            <PillarSection pillar="Learning" sessions={dayLearning} limit={3} />
          )}

          {/* Community — champions first, then sessions */}
          {(dayChampions.length > 0 || dayCommunity.length > 0) && (
            <div>
              <div style={{ marginBottom: "16px" }}>
                <p style={{ color: "var(--accent)", fontSize: "0.72rem", fontWeight: 680, textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 4px" }}>Community</p>
                <p style={{ color: "var(--muted)", margin: 0, fontSize: "0.88rem" }}>Champions and community sessions matched to your profile.</p>
              </div>
              {dayChampions.length > 0 && (
                <div className="champion-grid three-champions" style={{ marginBottom: dayCommunity.length > 0 ? "20px" : 0 }}>
                  {dayChampions.map(c => <ChampionCard key={c.id} champion={c} />)}
                </div>
              )}
              {dayCommunity.length > 0 && (
                <div className="opportunity-grid three">
                  {dayCommunity.map(s => <SessionCard key={s.id} session={s} />)}
                </div>
              )}
            </div>
          )}

          {/* Fun */}
          {dayFun.length > 0 && (
            <PillarSection pillar="Fun" sessions={dayFun} limit={3} />
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
  // ── State ──────────────────────────────────────────────────────────────────
  const [participant,  setParticipant]  = useState<RawDoc | null>(null);
  const [learningList, setLearningList] = useState<ScoredSession[]>([]);
  const [communityList,setCommunityList]= useState<ScoredSession[]>([]);
  const [funList,      setFunList]      = useState<ScoredSession[]>([]);
  const [nextBestMove, setNextBestMove] = useState<ScoredSession | null>(null);
  const [allSessions,  setAllSessions]  = useState<ScoredSession[]>([]);
  const [champions,    setChampions]    = useState<ScoredChampion[]>([]);
  const [featuredChampions, setFeaturedChampions] = useState<FeaturedChampion[]>([]);
  const [counts,       setCounts]       = useState<EventCounts>({ participants: 0, sessions: 0, champions: 0 });
  const [status,       setStatus]       = useState<"loading" | "ready" | "error">("loading");
  const [errorMsg,     setErrorMsg]     = useState("");
  const { user, loading: authLoading } = useAuth();
  const participantId = user?.uid ?? "";

  // ── Load ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      try {
        const [pSnap, sessSnap, partSnap, champSnap] = await Promise.all([
          getDoc(doc(db, `${BASE}/participants/${participantId}`)),
          getDocs(collection(db, `${BASE}/sessions`)),
          getDocs(collection(db, `${BASE}/participants`)),
          getDocs(collection(db, `${BASE}/champions`)),
        ]);

        if (!pSnap.exists()) {
          setErrorMsg(`Participant "${participantId}" not found at ${BASE}/participants/${participantId}`);          setStatus("error");
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

        const scoredChampions = rawChampions
          .map((c) => scoreChampion(pData, c))
          .sort((a, b) => b.compass_score - a.compass_score)
          .slice(0, 5);

        const best = scored[0] ?? null;

        setParticipant(pData);
        setAllSessions(scored);
        setLearningList(learning);
        setCommunityList(community);
        setFunList(fun);
        setNextBestMove(best);
        setChampions(scoredChampions);
        setCounts({ participants: partSnap.size, sessions: sessSnap.size, champions: champSnap.size });
        setStatus("ready");

        // Load featured champions for CommunityVoices section
        try {
          const featured = await getFeaturedChampions();
          setFeaturedChampions(featured);
        } catch {
          // Non-fatal — section renders nothing if this fails
        }

      } catch (err: unknown) {
        const e = err as { code?: string; message?: string };
        console.error("[ExperiencePage] Firestore error:", err);
        setErrorMsg(`${e.code ? `(${e.code}) ` : ""}${e.message ?? String(err)}`);
        setStatus("error");
      }
    }
if (!authLoading && participantId) {
  load();
}
}, [authLoading, participantId]);

  // ── Loading ─────────────────────────────────────────────────────────────
  if (status === "loading") {
    return (
      <section className="section no-top-border">
        <div className="section-kicker">Firestore</div>
        <h2 style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)", fontWeight: 520, letterSpacing: "-0.04em", margin: "12px 0 16px", color: "var(--text)" }}>
          Building your Compass…
        </h2>
        <p style={{ color: "var(--muted)", fontSize: "0.95rem" }}>
          Reading participant profile, sessions, and champions from{" "}
          <span style={{ fontFamily: "var(--font-mono, ui-monospace)", color: "var(--accent)" }}>{BASE}</span>
        </p>
      </section>
    );
  }

  // ── Error ───────────────────────────────────────────────────────────────
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

  // ── Participant field helpers ─────────────────────────────────────────────

const displayName = String(
  participant.display_name ??
  participant.displayName ??
  participant.email ??
  "Attendee"
);

  const jobTitle    = String(participant.job_title    ?? "");

  const company = String(
  participant.company ??
  participant.organization ??
  ""
);

  const sig         = (participant.event_signal_profile as RawDoc) ?? {};
  const tracks      = ((sig.tech_tracks as string[]) ?? []).slice(0, 5);
  const goals       = ((sig.goals       as string[]) ?? []).slice(0, 3);
  const topScore    = allSessions[0]?.compass_score ?? 0;

  // Pillar counts for ExperienceBalance
  const pillarCounts = {
    learning:  learningList.length,
    community: communityList.length,
    fun:       funList.length,
  };

  // Goals and tracks for voice context
  const pGoals  = (sig.goals        as string[]) ?? [];
  const pTracks = (sig.tech_tracks  as string[]) ?? [];

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── ParticipantHero ────────────────────────────────────────────── */}
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
            {(tracks.length > 0 || goals.length > 0) && (
              <div className="chip-row">
                {tracks.map((t) => <span key={t} className="chip">{t}</span>)}
                {goals.map((g)  => <span key={g} className="chip">{g}</span>)}
              </div>
            )}
          </div>
          {topScore > 0 && <ScoreBadge score={topScore} size="lg" />}
        </div>
      </section>

      {/* ── EventUniverseStats ─────────────────────────────────────────── */}
      <section className="section">
        <div className="section-head">
          <div>
            <div className="section-kicker">Event universe</div>
            <h2>What Compass is working with.</h2>
          </div>
          <p>Live counts from Firestore. Recommendations are computed dynamically — no stored recommendation collection.</p>
        </div>
        <div className="pulse-scoreboard">
          <article><span>Sessions indexed</span><b>{counts.sessions}</b></article>
          <article><span>Champions available</span><b>{counts.champions}</b></article>
          <article><span>Attendee signals</span><b>{counts.participants}</b></article>
          <article><span>Top match score</span><b>{topScore}</b></article>
        </div>
      </section>

      {/* ── NEW: What You Told Compass ─────────────────────────────────── */}
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
              subline:  `${sessionTypeLabel(nextBestMove)} · ${sessionMeta(nextBestMove)}`,
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

      {/* ── NEW: Day-tab experience ─────────────────────────────────────── */}
      <DayTabExperience
        learningList={learningList}
        communityList={communityList}
        funList={funList}
        champions={champions}
      />

      {/* ── TechXchange Banner ────────────────────────────────────────── */}
      <section className="section">
        <TechXchangeBanner />
      </section>

      {/* ── Event Highlights ───────────────────────────────────────────── */}
      <section className="section">
        <EventHighlights />
      </section>

      {/* ── Experience Balance + Export row ────────────────────────────── */}
      <section className="section">
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: "16px", alignItems: "start" }}>
          <ExperienceBalance sessionCounts={pillarCounts} />
          <div style={{ display: "grid", gap: "14px" }}>
            <PrintExport participantId={participantId} hasPinnedSessions={allSessions.length > 0} />
            <TechXchangeTV />
          </div>
        </div>
      </section>

      {/* ── Community Voices ───────────────────────────────────────────── */}
      <section className="section">
        <CommunityVoices champions={featuredChampions} />
      </section>

      {/* ── People Recommendations ─────────────────────────────────────── */}
      <section className="section">
        <PeopleRecommendations
          people={champions.map(c => ({
            id:           c.id,
            display_name: c.display_name,
            title:        c.title,
            organization: c.organization,
            categories:   ["Champions", ...(c.profile?.domains ?? [])],
            shared_keywords: c.shared_keywords,
            is_champion:  true,
          }))}
          currentUserId={participantId}
        />
      </section>

      {/* ── Footer CTA ─────────────────────────────────────────────────── */}
      <section className="final-band">
        <div>
          <h2>Your Compass is live.</h2>
          <p>
            Sessions, Champions, and moments are scored in real time from Firestore.
            No cached lists. Update your intent to refine the experience.
          </p>
        </div>
        <a href="/enroll" className="btn-primary">Update My Compass</a>
      </section>
    </>
  );
}
