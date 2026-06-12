"use client";

// =============================================================================
// EventCompass — My Experience  /experience
//
// Polish pass (Task 30, Job 4):
//   • Compass Signal: lighter surface, left accent bar, softer pill colors
//   • Identity: stacked business-card layout, job title + company on own lines
//   • Next Best Move: Info ↗ / Add to schedule / Not for me action chips
//   • Ask Compass: centered VoiceCompassButton section (circular premium)
//   • EventUniverseStats: 3-col quiet counts instead of 4-col scoreboard
//
// All Firestore scoring logic, data loading, and component wiring unchanged.
// =============================================================================

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { getFeaturedChampions } from "@/services/firestoreService";
import NextBestMoveCard from "@/components/experience/NextBestMove";
import EventHighlights    from "@/components/experience/EventHighlights";
import TechXchangeBanner  from "@/components/experience/TechXchangeBanner";
import CommunityVoices    from "@/components/experience/CommunityVoices";
import ExperienceBalance  from "@/components/experience/ExperienceBalance";
import PrintExport        from "@/components/experience/PrintExport";
import TechXchangeTV      from "@/components/experience/TechXchangeTV";
import VoiceCompassButton from "@/components/voice/VoiceCompassButton";
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
    compass_score:   score,
    shared_keywords: shared,
    compass_reasons: reasons,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components  (unchanged from original)
// ─────────────────────────────────────────────────────────────────────────────

function ScoreBadge({ score, size = "md" }: { score: number; size?: "sm" | "md" | "lg" }) {
  const sz = { sm: { badge: 42, num: "1.1rem" }, md: { badge: 54, num: "1.45rem" }, lg: { badge: 72, num: "2rem" } }[size];
  return (
    <div className="compass-score-badge" style={{ minWidth: sz.badge, minHeight: sz.badge }} title={"Compass score: " + score}>
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
        {champion.compass_reasons.length > 0 && (
          <>
            <p style={{ color: "var(--muted)", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.09em", fontWeight: 680, margin: "14px 0 6px" }}>
              Why Compass recommends this connection
            </p>
            <ul className="reason-list">
              {champion.compass_reasons.map((r) => <li key={r}>{r}</li>)}
            </ul>
          </>
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
// Compass Signal Strength — polished (lighter surface, accent bar, softer pills)
// ─────────────────────────────────────────────────────────────────────────────

function CompassSignalStrength({ participant }: { participant: RawDoc }) {
  const sig  = (participant.event_signal_profile as RawDoc) ?? {};
  const ni   = (participant.networking_identity  as Record<string, boolean>) ?? {};
  const edu  = (participant.education            as { institution?: string }[] | undefined) ?? [];
  const emp  = (participant.past_employers       as { company?: string }[]    | undefined) ?? [];
  const ci   = (participant.career_interests     as string[] | undefined) ?? [];
  const cons = (participant.consent              as Record<string, boolean>   | undefined) ?? {};

  const dimensions = [
    { label: "Identity",     done: !!(participant.first_name && participant.last_name) },
    { label: "Professional", done: !!(participant.job_title && (participant.organization ?? participant.company)) },
    { label: "Background",   done: !!(edu[0]?.institution || emp[0]?.company || ci.length > 0) },
    { label: "Intent",       done: !!(((sig.goals as string[] | undefined) ?? []).length > 0 && ((sig.tech_tracks as string[] | undefined) ?? []).length > 0) },
    { label: "Consent",      done: Object.keys(cons).length > 0 || Object.values(ni).some(Boolean) },
  ];

  const score  = dimensions.filter(d => d.done).length;
  const pct    = Math.round((score / dimensions.length) * 100);
  const color  = pct === 100 ? "#24a148" : "var(--accent)";

  return (
    <section className="section">
      {/* Lighter surface: --surface instead of --panel, left accent bar */}
      <div style={{
        background: "var(--surface)",
        borderLeft: "3px solid var(--accent)",
        padding: "24px 28px",
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "20px", flexWrap: "wrap", marginBottom: "16px" }}>
          <div>
            <p style={{ color: "var(--accent)", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 4px" }}>
              Compass Signal
            </p>
            <p style={{ color: "var(--muted)", fontSize: "0.88rem", margin: 0, maxWidth: "480px", lineHeight: 1.5 }}>
              Your profile completeness. A stronger signal means more precise recommendations.
            </p>
          </div>
          <span style={{ fontSize: "2.2rem", fontWeight: 520, color, letterSpacing: "-0.04em", lineHeight: 1, flexShrink: 0 }}>
            {pct}%
          </span>
        </div>

        {/* Progress bar — thinner, subtler */}
        <div style={{ height: "4px", background: "var(--line)", borderRadius: "2px", marginBottom: "16px" }}>
          <div style={{ width: pct + "%", height: "100%", background: color, borderRadius: "2px", transition: "width 0.4s" }} />
        </div>

        {/* Dimension pills — filled when done, outline when not */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {dimensions.map(d => (
            <span key={d.label} style={{
              fontSize: "0.8rem",
              padding: "4px 11px",
              background: d.done ? (pct === 100 ? "rgba(36, 161, 72, 0.12)" : "rgba(120, 169, 255, 0.12)") : "transparent",
              border: "1px solid " + (d.done ? color : "var(--line)"),
              color: d.done ? color : "var(--muted)",
            }}>
              {d.done ? "✓" : "○"} {d.label}
            </span>
          ))}
        </div>

        {pct < 100 && (
          <p style={{ color: "var(--muted)", fontSize: "0.82rem", margin: "14px 0 0" }}>
            <a href="/enroll?mode=edit" style={{ color: "var(--accent)" }}>Refine My Compass &rarr;</a>
            {" "}to improve signal quality.
          </p>
        )}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// "What You Told Compass"  (unchanged from original)
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
    { label: "Goals",            items: goals,     accent: true  },
    { label: "Tech tracks",      items: tracks,    accent: false },
    { label: "Career interests", items: ci,        accent: false },
    { label: "Needs",            items: needs,     accent: false },
    { label: "Open to",          items: openTo,    accent: false },
    { label: "Networking",       items: niLabels,  accent: false },
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

      {identityItems.length > 0 && (
        <div style={{
          display: "flex", flexWrap: "wrap", gap: "1px",
          background: "var(--line)", border: "1px solid var(--line)",
          marginBottom: "1px",
        }}>
          {identityItems.map(function(item) { return (
            <div key={item.key} style={{ background: "var(--panel)", padding: "14px 18px", minWidth: "160px", flex: "1 1 160px" }}>
              <p style={{ color: "var(--muted)", fontSize: "0.7rem", fontWeight: 680, textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 5px" }}>{item.key}</p>
              <p style={{ color: "var(--soft)", fontSize: "0.92rem", margin: 0, fontWeight: 500 }}>{item.value}</p>
            </div>
          ); })}
        </div>
      )}

      {groups.length > 0 && (
        <div style={{
          display:             "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
          gap:                 "1px",
          background:          "var(--line)",
          border:              "1px solid var(--line)",
        }}>
          {groups.map(function(group) { return (
            <div key={group.label} style={{ background: "var(--panel)", padding: "16px 18px" }}>
              <p style={{
                color:         group.accent ? "var(--accent)" : "var(--muted)",
                fontSize:      "0.7rem",
                fontWeight:    680,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                margin:        "0 0 9px",
              }}>
                {group.label}
              </p>
              <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "5px" }}>
                {group.items.map(function(item) { return (
                  <li key={item} style={{ display: "flex", alignItems: "flex-start", gap: "6px", color: "var(--soft)", fontSize: "0.88rem", lineHeight: 1.35 }}>
                    <span style={{ color: "var(--accent)", fontSize: "0.45rem", marginTop: "0.55em", flexShrink: 0 }}>&#9670;</span>
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
// Day-tab experience  (unchanged from original)
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
}: {
  learningList:  ScoredSession[];
  communityList: ScoredSession[];
  funList:       ScoredSession[];
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
            <PillarSection pillar="Learning" sessions={dayLearning} limit={3} />
          )}
          {dayCommunity.length > 0 && (
            <PillarSection pillar="Community" sessions={dayCommunity} limit={3} />
          )}
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
  // Action chip state — track dismissed Next Best Move
  const [dismissedNextId, setDismissedNextId] = useState<string | null>(null);
  const { user, loading: authLoading } = useAuth();
  const participantId = user?.uid ?? "";

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
        <div className="section-kicker">Firestore</div>
        <h2 style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)", fontWeight: 520, letterSpacing: "-0.04em", margin: "12px 0 16px", color: "var(--text)" }}>
          Building your Compass&hellip;
        </h2>
        <p style={{ color: "var(--muted)", fontSize: "0.95rem" }}>
          Reading participant profile, sessions, and champions from{" "}
          <span style={{ fontFamily: "var(--font-mono, ui-monospace)", color: "var(--accent)" }}>{BASE}</span>
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

  // The displayed next best move (null if user dismissed it)
  const visibleNextBestMove = nextBestMove && dismissedNextId !== nextBestMove.id
    ? nextBestMove
    : null;

  return (
    <>
      {/* ── ParticipantHero — business-card layout ─────────────────────── */}
      <section className="section no-top-border">
        <div style={{
          borderLeft: "4px solid var(--accent)",
          paddingLeft: "24px",
          marginBottom: tracks.length > 0 || goals.length > 0 ? "20px" : 0,
        }}>
          <div className="section-kicker" style={{ marginBottom: "6px" }}>My Compass</div>
          <h1 style={{
            fontSize: "clamp(2.6rem, 5vw, 4.6rem)",
            lineHeight: 0.97,
            letterSpacing: "-0.05em",
            fontWeight: 520,
            margin: "0 0 10px",
            color: "var(--text)",
          }}>
            {displayName}
          </h1>
          {jobTitle && (
            <p style={{ color: "var(--muted)", margin: "0 0 2px", fontSize: "1.05rem" }}>{jobTitle}</p>
          )}
          {company && (
            <p style={{ color: "var(--muted)", margin: 0, fontSize: "1.05rem" }}>{company}</p>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
          {(tracks.length > 0 || goals.length > 0) && (
            <div className="chip-row" style={{ marginTop: 0 }}>
              {tracks.map((t) => <span key={t} className="chip">{t}</span>)}
              {goals.map((g)  => <span key={g} className="chip">{g}</span>)}
            </div>
          )}
          {topScore > 0 && <ScoreBadge score={topScore} size="lg" />}
        </div>
      </section>

      {/* ── EventUniverseStats — 3-col quiet counts ────────────────────── */}
      <section className="section">
        <div style={{ marginBottom: "20px" }}>
          <div className="section-kicker">Event universe</div>
          <h2 style={{ fontSize: "clamp(1.6rem, 3vw, 2.4rem)", fontWeight: 520, letterSpacing: "-0.04em", margin: "4px 0 0" }}>
            What Compass is working with.
          </h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "1px", background: "var(--line)", border: "1px solid var(--line)" }}>
          {[
            { label: "Sessions indexed",  val: counts.sessions   },
            { label: "Champions",         val: counts.champions  },
            { label: "Attendee signals",  val: counts.participants },
          ].map(item => (
            <div key={item.label} style={{ background: "var(--panel)", padding: "20px 22px" }}>
              <p style={{ color: "var(--muted)", fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 680, margin: "0 0 8px" }}>{item.label}</p>
              <p style={{ fontSize: "clamp(2rem, 3.5vw, 3rem)", fontWeight: 420, letterSpacing: "-0.05em", lineHeight: 1, color: "var(--text)", margin: 0 }}>{item.val}</p>
            </div>
          ))}
        </div>
        <p style={{ color: "var(--muted)", fontSize: "0.78rem", marginTop: "10px" }}>
          Top match score: <span style={{ color: "var(--accent)", fontWeight: 600 }}>{topScore}</span>.
          Recommendations are computed dynamically — no stored collection.
        </p>
      </section>

      {/* ── Compass Signal Strength ────────────────────────────────────── */}
      <CompassSignalStrength participant={participant} />

      {/* ── What You Told Compass ──────────────────────────────────────── */}
      <WhatYouToldCompass participant={participant} />

      {/* ── NextBestMove + action chips ────────────────────────────────── */}
      {visibleNextBestMove && (
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
              headline: visibleNextBestMove.title,
              subline:  sessionTypeLabel(visibleNextBestMove) + " · " + sessionMeta(visibleNextBestMove),
              reason:   visibleNextBestMove.compass_reasons[0] ?? "Top Compass match",
              score:    visibleNextBestMove.compass_score,
              entityId: visibleNextBestMove.id,
            }}
            topSession={visibleNextBestMove}
            topChampion={champions[0] ?? null}
            participantGoals={pGoals}
            participantTracks={pTracks}
          />
          {/* Action chips */}
          <div style={{ display: "flex", gap: "8px", marginTop: "12px", flexWrap: "wrap" }}>
            <a
              href={`/sessions#${visibleNextBestMove.id}`}
              className="action-chip"
              title="Open session details"
            >
              Info ↗
            </a>
            <a
              href="/sessions"
              className="action-chip"
              title="View in session guide"
            >
              + Add to schedule
            </a>
            <button
              className="action-chip destructive"
              onClick={() => setDismissedNextId(visibleNextBestMove.id)}
              title="Remove this suggestion"
            >
              × Not for me
            </button>
          </div>
        </section>
      )}

      {/* ── Ask Compass — centered VoiceCompassButton ──────────────────── */}
      <section className="section" style={{ textAlign: "center" }}>
        <div className="section-kicker" style={{ justifyContent: "center" }}>Ask Compass</div>
        <h2 style={{ fontSize: "clamp(1.6rem, 3vw, 2.4rem)", fontWeight: 520, letterSpacing: "-0.04em", margin: "4px 0 12px" }}>
          Not sure what to do next?
        </h2>
        <p style={{ color: "var(--muted)", maxWidth: "480px", margin: "0 auto 32px", lineHeight: 1.6, fontSize: "0.95rem" }}>
          Speak to Compass. Describe what you are looking for and get a spoken recommendation
          matched to your profile.
        </p>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <VoiceCompassButton />
        </div>
      </section>

      {/* ── Day-tab experience ─────────────────────────────────────────── */}
      <DayTabExperience
        learningList={learningList}
        communityList={communityList}
        funList={funList}
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
            {champions.map(function(c) { return <ChampionCard key={c.id} champion={c} />; })}
          </div>
        </section>
      )}

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
