"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { collection, doc, getDoc, getDocs, setDoc } from "firebase/firestore";
import { tryGetDb } from "@/lib/firebase";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  applyCertificationSessionBoost,
  CERTIFICATION_JOURNEY_COPY,
  getCertificationJourneyTitle,
  isCertificationActivityType,
  listCertificationJourneys,
} from "@/lib/certificationProfile";
import { buildPublicSessionReasons, buildSessionRecommendationReasons, resolvePublicSessionHighlight } from "@/lib/sessionIntelligence";
import SessionIntelligencePanel from "@/components/sessions/SessionIntelligencePanel";
import SessionDetailModal from "@/components/sessions/SessionDetailModal";
import SessionSpeakerIntel from "@/components/sessions/SessionSpeakerIntel";
import { selectBalancedSessionBand } from "@/lib/recommendationBalancing";
import {
  isCertificationJourneyActive,
  hasCertificationGoalSelected,
} from "@/lib/certificationProfile";
import {
  buildSpeakerCatalog,
  championFromRaw,
  resolveSpeakersForSession,
  sessionFromScored,
  type SpeakerParticipantContext,
} from "@/lib/speakerIntelligence";
import type { SpeakerProfile } from "@/types/speaker";
import {
  addSessionToBothLists,
  mergeSavedSessionIds,
  removeSessionFromBothLists,
} from "@/lib/participantAgenda";

const BASE = "organizations/ibm/events/txc2026";
const IBM_BLUE = "#0f62fe";

const W = {
  track: 25,
  goal: 20,
  need: 15,
  role: 10,
  industry: 10,
  keyword: 5,
  executive: 5,
  broad: 5,
  handsOn: 5,
} as const;

type RawDoc = Record<string, unknown>;

interface ScoredSession {
  id: string;
  title: string;
  session_type?: string;
  activity_type?: string;
  schedule?: { day?: string; date?: string; start_time?: string; end_time?: string; room?: string };
  tracks?: { primary_track?: string; secondary_tracks?: string[]; topics?: string[]; products?: string[] };
  capacity?: { available_slots?: number; status?: string };
  recommendation_rules?: { executive_relevant?: boolean; everyone_encouraged?: boolean; hands_on?: boolean };
  date?: string;
  start_time?: string;
  room?: string;
  tech_track?: string | string[];
  compass_score: number;
  compass_reasons: string[];
  summary?: string;
  certification_id?: string;
  certification_code?: string;
  certification_url?: string;
  guide_url?: string;
  certification_level?: string;
  skills_measured?: string[];
  recommended_background?: string[];
  estimated_preparation_hours?: number;
  supports_certification?: boolean;
  recommended_reason?: string;
  related_session_ids?: string[];
  related_lab_ids?: string[];
  related_champion_ids?: string[];
  related_huddle_ids?: string[];
  related_community_ids?: string[];
  speakers?: unknown;
  difficulty?: string;
}

// Schedule interaction state — passed to card components
interface ScheduleState {
  savedSchedule:  string[];
  certificationGoals: string[];
  doNotSuggest:   string[];
  reservedSeats:  string[];
  allSessions:    ScoredSession[];
  isLoggedIn:     boolean;
  onSave:         (id: string) => void;
  onRemove:       (id: string) => void;
  onSaveCertification: (id: string) => void;
  onRemoveCertification: (id: string) => void;
  onDoNotSuggest: (id: string) => void;
  onReserveSeat:  (id: string) => void;
  onShowInfo:     (session: ScoredSession) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Utilities
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
  const legacyArr = Array.isArray(legacy)
    ? (legacy as string[])
    : typeof legacy === "string" && legacy ? [legacy] : [];
  return [primary, ...secondary, ...legacyArr].filter(Boolean);
}

function sessionType(s: ScoredSession): string {
  return (s.session_type ?? s.activity_type ?? "Session").trim();
}

function sessionDay(s: ScoredSession): string {
  return resolve(s as unknown as RawDoc, "date", "schedule.day");
}

function sessionStart(s: ScoredSession): string {
  return resolve(s as unknown as RawDoc, "start_time", "schedule.start_time");
}

function sessionEnd(s: ScoredSession): string {
  const raw = s as unknown as RawDoc;
  const sched = (raw.schedule as Record<string, string> | undefined) ?? {};
  return sched.end_time ?? "";
}

function sessionRoom(s: ScoredSession): string {
  return resolve(s as unknown as RawDoc, "room", "schedule.room");
}

function sessionMeta(s: ScoredSession): string {
  if (isCertificationActivityType(s)) return "";
  return [sessionDay(s), sessionStart(s), sessionRoom(s)].filter(Boolean).join(" · ");
}

function primaryTrack(s: ScoredSession): string {
  return s.tracks?.primary_track ?? "";
}

// Parse "9:00 AM", "2:30 PM", "09:00", "14:30" → minutes since midnight
function parseTime(t: string): number | null {
  if (!t) return null;
  const m12 = t.match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/i);
  if (m12) {
    let h = parseInt(m12[1], 10);
    const min = parseInt(m12[2], 10);
    const ap = m12[3].toLowerCase();
    if (ap === "pm" && h !== 12) h += 12;
    if (ap === "am" && h === 12) h = 0;
    return h * 60 + min;
  }
  const m24 = t.match(/^(\d{1,2}):(\d{2})$/);
  if (m24) return parseInt(m24[1], 10) * 60 + parseInt(m24[2], 10);
  return null;
}

// Returns true if session overlaps with any saved session on the same day
function hasConflict(s: ScoredSession, savedIds: string[], allSessions: ScoredSession[]): boolean {
  if (isCertificationActivityType(s)) return false;
  const day = sessionDay(s);
  if (!day) return false;
  const sStart = parseTime(sessionStart(s));
  if (sStart === null) return false;
  const sEnd = parseTime(sessionEnd(s)) ?? sStart + 60;

  for (const id of savedIds) {
    if (id === s.id) continue;
    const saved = allSessions.find((x) => x.id === id);
    if (!saved || isCertificationActivityType(saved) || sessionDay(saved) !== day) continue;
    const oStart = parseTime(sessionStart(saved));
    if (oStart === null) continue;
    const oEnd = parseTime(sessionEnd(saved)) ?? oStart + 60;
    if (sStart < oEnd && sEnd > oStart) return true;
  }
  return false;
}

const DAY_RANK: Record<string, number> = {
  monday: 0, mon: 0, tuesday: 1, tue: 1, wednesday: 2, wed: 2,
  thursday: 3, thu: 3, friday: 4, fri: 4,
};

function daySortKey(day: string): number {
  const lower = day.toLowerCase();
  for (const [key, rank] of Object.entries(DAY_RANK)) {
    if (lower.includes(key)) return rank;
  }
  return 50;
}

/** Sort: day → time → fit score */
function sortSessionsChronological(a: ScoredSession, b: ScoredSession): number {
  const dayA = sessionDay(a);
  const dayB = sessionDay(b);
  const dayDiff = daySortKey(dayA) - daySortKey(dayB);
  if (dayDiff !== 0) return dayDiff;
  if (dayA !== dayB) return dayA.localeCompare(dayB);

  const timeA = parseTime(sessionStart(a));
  const timeB = parseTime(sessionStart(b));
  if (timeA !== null && timeB !== null && timeA !== timeB) return timeA - timeB;
  if (timeA !== null && timeB === null) return -1;
  if (timeA === null && timeB !== null) return 1;

  return b.compass_score - a.compass_score;
}

// ─────────────────────────────────────────────────────────────────────────────
// Scoring  (unchanged)
// ─────────────────────────────────────────────────────────────────────────────

function scoreSession(participant: RawDoc, raw: RawDoc): ScoredSession {
  let score = 0;
  const reasons: string[] = [];

  const sig = (participant.event_signal_profile as RawDoc) ?? {};
  const intel = (participant.compass_intelligence as RawDoc) ?? {};
  const reg = (participant.registration as RawDoc) ?? {};
  const intent = (sig.intent as RawDoc) ?? {};

  const pTracks = lower((sig.tech_tracks as string[]) ?? []);
  const pGoals = lower((sig.goals as string[]) ?? []);
  const pNeeds = lower((intent.needs as string[]) ?? []);
  const pKeywords = lower((intel.matching_keywords as string[]) ?? []);
  const pRoles = lower((sig.roles_at_txc as string[]) ?? []);
  const pIndustry = ((reg.industry as string) ?? "").toLowerCase().trim();

  const sCI = (raw.compass_intelligence as RawDoc) ?? {};
  const sAudience = (raw.audience as RawDoc) ?? {};
  const sRules = (raw.recommendation_rules as RawDoc) ?? {};

  const sTracks = lower(allTracks(raw));
  const sIntents = lower((sCI.intent_tags as string[]) ?? []);
  const sNeeds = lower((sCI.need_tags as string[]) ?? []);
  const sKeywords = lower((sCI.matching_keywords as string[]) ?? []);
  const sRoles = lower((sAudience.roles as string[]) ?? []);
  const sIndustries = lower((sAudience.industries as string[]) ?? []);

  for (const t of pTracks) if (sTracks.includes(t)) { score += W.track; reasons.push(`Track match: ${t}`); }
  for (const g of pGoals) if (sIntents.includes(g)) { score += W.goal; reasons.push(`Goal match: ${g}`); }
  for (const n of pNeeds) if (sNeeds.includes(n)) { score += W.need; reasons.push(`Need match: ${n}`); }
  for (const r of pRoles) if (sRoles.includes(r)) { score += W.role; reasons.push(`Role match: ${r}`); }
  if (pIndustry && sIndustries.includes(pIndustry)) { score += W.industry; reasons.push(`Industry match: ${reg.industry}`); }
  for (const k of pKeywords) if (sKeywords.includes(k)) { score += W.keyword; reasons.push(`Keyword match: ${k}`); }
  if (sRules.executive_relevant) { score += W.executive; reasons.push("Executive relevant"); }
  if (sRules.everyone_encouraged) { score += W.broad; reasons.push("Broad event relevance"); }
  if (sRules.hands_on) { score += W.handsOn; reasons.push("Hands-on learning"); }

  const certLabel = getCertificationJourneyTitle(participant);
  const boosted = applyCertificationSessionBoost(score, reasons, participant, raw, certLabel);

  return {
    id: String(raw.id ?? raw.session_id ?? ""),
    title: String(raw.title ?? "Untitled session"),
    session_type: raw.session_type as string | undefined,
    activity_type: raw.activity_type as string | undefined,
    schedule: raw.schedule as ScoredSession["schedule"],
    tracks: raw.tracks as ScoredSession["tracks"],
    capacity: raw.capacity as ScoredSession["capacity"],
    recommendation_rules: raw.recommendation_rules as ScoredSession["recommendation_rules"],
    date: raw.date as string | undefined,
    start_time: raw.start_time as string | undefined,
    room: raw.room as string | undefined,
    tech_track: raw.tech_track as string | string[] | undefined,
    summary: raw.summary as string | undefined,
    certification_id: raw.certification_id as string | undefined,
    certification_code: raw.certification_code as string | undefined,
    certification_url: raw.certification_url as string | undefined,
    guide_url: raw.guide_url as string | undefined,
    certification_level: raw.certification_level as string | undefined,
    skills_measured: raw.skills_measured as string[] | undefined,
    recommended_background: raw.recommended_background as string[] | undefined,
    estimated_preparation_hours: raw.estimated_preparation_hours as number | undefined,
    supports_certification: raw.supports_certification as boolean | undefined,
    recommended_reason: raw.recommended_reason as string | undefined,
    related_session_ids: raw.related_session_ids as string[] | undefined,
    related_lab_ids: raw.related_lab_ids as string[] | undefined,
    related_champion_ids: raw.related_champion_ids as string[] | undefined,
    related_huddle_ids: raw.related_huddle_ids as string[] | undefined,
    related_community_ids: raw.related_community_ids as string[] | undefined,
    speakers: raw.speakers,
    difficulty: raw.difficulty as string | undefined,
    compass_score: boosted.score,
    compass_reasons: boosted.reasons,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// SessionActionBar — Carbon-styled action buttons for each session card
// ─────────────────────────────────────────────────────────────────────────────

function SessionActionBar({ session, sched, compact = false }: {
  session: ScoredSession;
  sched: ScheduleState;
  compact?: boolean;
}) {
  const isCert = isCertificationActivityType(session);
  const isSaved   = isCert
    ? sched.certificationGoals.includes(session.id)
    : sched.savedSchedule.includes(session.id);
  const isDns     = sched.doNotSuggest.includes(session.id);
  const isReserved = sched.reservedSeats.includes(session.id);
  const conflict  = sched.isLoggedIn && !isSaved && !isCert && hasConflict(session, sched.savedSchedule, sched.allSessions);

  const baseBtn: React.CSSProperties = {
    display: "inline-flex", alignItems: "center", gap: "3px",
    height: compact ? "24px" : "26px",
    padding: compact ? "0 8px" : "0 10px",
    border: "1px solid var(--line)",
    background: "transparent",
    color: "var(--muted)",
    fontSize: compact ? "0.70rem" : "0.73rem",
    fontWeight: 500,
    cursor: "pointer",
    fontFamily: "inherit",
    letterSpacing: "0.01em",
    whiteSpace: "nowrap" as const,
    textDecoration: "none",
  };

  const savedBtn: React.CSSProperties = {
    ...baseBtn,
    border: "1px solid rgba(15, 98, 254, 0.35)",
    color: IBM_BLUE,
    background: "rgba(15, 98, 254, 0.04)",
  };

  const dnsLabel: React.CSSProperties = {
    fontSize: "0.68rem",
    color: "var(--muted)",
    padding: "2px 7px",
    border: "1px solid var(--line)",
    letterSpacing: "0.06em",
    textTransform: "uppercase" as const,
  };

  return (
    <div style={{
      borderTop: "1px solid var(--line)",
      paddingTop: compact ? "8px" : "10px",
      marginTop: compact ? "6px" : "12px",
      display: "flex",
      flexWrap: "wrap" as const,
      gap: "5px",
      alignItems: "center",
    }}>
      {/* Info — opens in-page modal (no external route) */}
      <button
        type="button"
        onClick={() => sched.onShowInfo(session)}
        style={baseBtn}
      >
        Info
      </button>

      {!sched.isLoggedIn ? (
        <span style={{ ...baseBtn, cursor: "default", opacity: 0.85 }}>
          Sign in to save{isCert ? "" : " or reserve"}
        </span>
      ) : isCert ? (
        <>
          {isSaved ? (
            <span style={savedBtn}>✓ Saved certification</span>
          ) : (
            <button
              onClick={() => sched.onSaveCertification(session.id)}
              style={baseBtn}
              title="Add to your certification goals"
              type="button"
            >
              {compact ? "Save certification" : "Add to My Certification Goals"}
            </button>
          )}
          {isSaved && (
            <button
              onClick={() => sched.onRemoveCertification(session.id)}
              style={{ ...baseBtn, opacity: 0.75 }}
              title="Remove from certification goals"
              type="button"
            >
              Remove
            </button>
          )}
          {!isDns ? (
            <button
              onClick={() => sched.onDoNotSuggest(session.id)}
              style={{ ...baseBtn, opacity: 0.75 }}
              title="Hide from recommendations"
              type="button"
            >
              Not for me
            </button>
          ) : (
            <span style={dnsLabel}>Dismissed</span>
          )}
        </>
      ) : (
        <>
          {isReserved ? (
            <span style={savedBtn}>✓ Reserved</span>
          ) : (
            <button
              onClick={() => sched.onReserveSeat(session.id)}
              style={baseBtn}
              title="Simulated seat reservation"
              type="button"
            >
              Reserve seat
            </button>
          )}

          {isSaved ? (
            <span style={savedBtn}>✓ Added to calendar</span>
          ) : (
            <button
              onClick={() => sched.onSave(session.id)}
              style={baseBtn}
              title="Add to your personal schedule"
              type="button"
            >
              Add to calendar
            </button>
          )}

          {!isDns ? (
            <button
              onClick={() => sched.onDoNotSuggest(session.id)}
              style={{ ...baseBtn, opacity: 0.75 }}
              title="Hide from recommendations"
              type="button"
            >
              Not for me
            </button>
          ) : (
            <span style={dnsLabel}>Dismissed</span>
          )}
        </>
      )}

      {/* Time conflict warning — full width second row */}
      {conflict && (
        <span style={{
          width: "100%",
          fontSize: "0.72rem",
          color: "#b45309",
          display: "flex",
          alignItems: "center",
          gap: "4px",
          marginTop: "2px",
        }}>
          &#9888; Conflicts with another saved session
        </span>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ScoreBadge
// ─────────────────────────────────────────────────────────────────────────────

// Match badge — answers: "How relevant is this recommendation to me?"
function ScoreBadge({ score }: { score: number }) {
  if (score === 0) return null;
  return (
    <div className="compass-score-badge" style={{ minWidth: "46px", minHeight: "46px", flexShrink: 0 }} title={`${score}% match`}>
      <span className="score-number" style={{ fontSize: "1.05rem" }}>{score}%</span>
      <span className="score-label">match</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RecommendedCard — grid card with action bar
// ─────────────────────────────────────────────────────────────────────────────

function RecommendedCard({
  session,
  sched,
  certLabel,
  speakerCatalog,
  speakerCtx,
  onViewSpeaker,
  anonymous = false,
}: {
  session: ScoredSession;
  sched?: ScheduleState;
  certLabel?: string | null;
  speakerCatalog: SpeakerProfile[];
  speakerCtx: SpeakerParticipantContext;
  onViewSpeaker?: (speakerId: string) => void;
  anonymous?: boolean;
}) {
  const type = sessionType(session);
  const track = primaryTrack(session);
  const meta = sessionMeta(session);
  const sessionSpeakers = resolveSpeakersForSession(
    sessionFromScored(session),
    speakerCatalog,
    speakerCtx,
  );

  return (
    <article className="opportunity-card" style={{ display: "flex", flexDirection: "column" }}>
      <div className="card-meta">
        <span>{type}{track ? ` · ${track}` : ""}</span>
      </div>
      <h3>{session.title}</h3>
      {meta && <p className="session-card-meta">{meta}</p>}
      <SessionIntelligencePanel session={session} certLabel={certLabel} scoreSize="sm" anonymous={anonymous} />
      {sessionSpeakers.length > 0 && (
        <SessionSpeakerIntel
          speakers={sessionSpeakers}
          onViewSpeaker={onViewSpeaker}
          compact
          anonymous={anonymous}
        />
      )}
      {sched && (
        <div style={{ marginTop: "auto" }}>
          <SessionActionBar session={session} sched={sched} />
        </div>
      )}
    </article>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CatalogRow — list row with compact inline actions
// ─────────────────────────────────────────────────────────────────────────────

function CatalogRow({
  session,
  sched,
  certLabel,
  anonymous = false,
}: {
  session: ScoredSession;
  sched?: ScheduleState;
  certLabel?: string | null;
  anonymous?: boolean;
}) {
  const type = sessionType(session);
  const track = primaryTrack(session);
  const isCert = isCertificationActivityType(session);
  const day = sessionDay(session);
  const start = sessionStart(session);
  const room = sessionRoom(session);
  const capacity = session.capacity?.available_slots ?? 0;
  const status = session.capacity?.status ?? "";
  const isDns = sched ? sched.doNotSuggest.includes(session.id) : false;
  const topReason = anonymous
    ? resolvePublicSessionHighlight(session)
    : buildSessionRecommendationReasons(session, certLabel)[0];
  const publicReasons = anonymous ? buildPublicSessionReasons(session) : [];

  return (
    <article style={isDns ? { opacity: 0.5 } : undefined}>
      {!isCert && <time>{day}{start ? ` · ${start}` : ""}</time>}
      {isCert && <time>On demand</time>}
      <div>
        <span>{type}{track ? ` · ${track}` : ""}</span>
        <h3>{session.title}</h3>
        <p>
          {isCert ? "Certification testing areas — no fixed time" : room}
          {!anonymous && session.compass_score > 0 && (
            <> · <span style={{ color: "var(--accent)", fontWeight: 600 }}>{session.compass_score}% match</span></>
          )}
          {topReason && <> · {topReason}</>}
        </p>
        {anonymous && publicReasons.length > 1 && (
          <p style={{ color: "var(--muted)", fontSize: "0.82rem", margin: "4px 0 0" }}>
            {publicReasons.slice(1).join(" · ")}
          </p>
        )}
        {sched && (
          <SessionActionBar session={session} sched={sched} compact={true} />
        )}
      </div>
      <b>
        {capacity > 0 ? `${capacity} seats` : ""}
        {status ? <><br /><small style={{ fontSize: "0.72rem" }}>{status}</small></> : null}
      </b>
    </article>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// IntelligenceBand — presentation slice of scored sessions (no scoring change)
// ─────────────────────────────────────────────────────────────────────────────

function IntelligenceBand({ kicker, title, desc, sessions, sched, certLabel, speakerCatalog, speakerCtx, onViewSpeaker, anonymous = false }: {
  kicker: string;
  title: string;
  desc: string;
  sessions: ScoredSession[];
  sched: ScheduleState;
  certLabel?: string | null;
  speakerCatalog: SpeakerProfile[];
  speakerCtx: SpeakerParticipantContext;
  onViewSpeaker?: (speakerId: string) => void;
  anonymous?: boolean;
}) {
  if (sessions.length === 0) return null;
  return (
    <section className="section intelligence-band">
      <div className="section-head">
        <div>
          <div className="section-kicker">{kicker}</div>
          <h2>{title}</h2>
        </div>
        <p>{desc}</p>
      </div>
      <div className="intelligence-row">
        {sessions.map(s => (
          <RecommendedCard
            key={s.id}
            session={s}
            sched={sched}
            certLabel={certLabel}
            speakerCatalog={speakerCatalog}
            speakerCtx={speakerCtx}
            onViewSpeaker={onViewSpeaker}
            anonymous={anonymous}
          />
        ))}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FilterChip  (unchanged)
// ─────────────────────────────────────────────────────────────────────────────

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "inline-flex", alignItems: "center",
        height: "32px", padding: "0 12px",
        border: active ? "1px solid var(--accent)" : "1px solid var(--line)",
        background: active ? "var(--accent)" : "transparent",
        color: active ? "var(--accent-text)" : "var(--soft)",
        fontSize: "0.82rem", fontWeight: active ? 680 : 500,
        cursor: "pointer", fontFamily: "inherit",
        flexShrink: 0, whiteSpace: "nowrap" as const,
      }}
    >
      {label}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function SessionsPage() {
  return (
    <Suspense
      fallback={
        <section className="section no-top-border">
          <div className="section-kicker">Loading&#8230;</div>
          <h1 style={{ fontSize: "clamp(2rem,4vw,3.5rem)", fontWeight: 520, letterSpacing: "-0.04em", margin: "12px 0 16px", color: "var(--text)" }}>
            Loading sessions&#8230;
          </h1>
        </section>
      }
    >
      <SessionsPageContent />
    </Suspense>
  );
}

function isFirestorePermissionError(err: unknown): boolean {
  const code = (err as { code?: string })?.code ?? "";
  return code === "permission-denied" || code === "PERMISSION_DENIED";
}

function SessionsPageContent() {
  const { user, enrolled, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const isLoggedIn = !!user;
  const participantId = user?.uid ?? "";

  const [allScored,     setAllScored]     = useState<ScoredSession[]>([]);
  const [participantData, setParticipantData] = useState<RawDoc>({});
  const [status,        setStatus]        = useState<"loading" | "ready" | "error">("loading");
  const [errorMsg,      setErrorMsg]      = useState("");
  const [totalCount,    setTotalCount]    = useState(0);

  // Schedule state — loaded from Firestore, persisted on every action
  const [savedSchedule, setSavedSchedule] = useState<string[]>([]);
  const [savedSessions, setSavedSessions] = useState<string[]>([]);
  const [certificationGoals, setCertificationGoals] = useState<string[]>([]);
  const [removedSessions, setRemovedSessions] = useState<string[]>([]);
  const [doNotSuggest,  setDoNotSuggest]  = useState<string[]>([]);
  const [reservedSeats, setReservedSeats] = useState<string[]>([]);
  const [detailSession, setDetailSession] = useState<ScoredSession | null>(null);
  const [championSources, setChampionSources] = useState<ReturnType<typeof championFromRaw>[]>([]);

  // Filter state
  const [search,      setSearch]      = useState("");
  const [trackFilter, setTrackFilter] = useState("All");
  const [typeFilter,  setTypeFilter]  = useState("All");
  const [dayFilter,   setDayFilter]   = useState("All");
  const [typeFromUrlApplied, setTypeFromUrlApplied] = useState(false);

  const certLabel = useMemo(
    () => getCertificationJourneyTitle(participantData),
    [participantData],
  );

  const learningPathCount = useMemo(() => {
    const fromSessions = allScored.filter(s => isCertificationActivityType(s)).length;
    if (fromSessions > 0) return fromSessions;
    return listCertificationJourneys().length;
  }, [allScored]);

  const isLearningPathsView = searchParams.get("view") === "learning-paths";
  const isCertificationView = isLearningPathsView || (
    typeFilter !== "All" && typeFilter.toLowerCase().includes("certification")
  );

  const speakerCatalog = useMemo(
    () => buildSpeakerCatalog(championSources, allScored.map(sessionFromScored)),
    [championSources, allScored],
  );

  const speakerCtx = useMemo((): SpeakerParticipantContext => {
    const sig = (participantData.event_signal_profile as RawDoc) ?? {};
    const intel = (participantData.compass_intelligence as RawDoc) ?? {};
    return {
      tracks: (sig.tech_tracks as string[]) ?? [],
      goals: (sig.goals as string[]) ?? [],
      keywords: (intel.matching_keywords as string[]) ?? [],
      hasCertIntent: isCertificationJourneyActive(participantData, {
        selectedCertificationCount: certificationGoals.length,
      }),
    };
  }, [participantData, certificationGoals.length]);

  const handleViewSpeaker = useCallback((speakerId: string) => {
    const session = allScored.find(s =>
      resolveSpeakersForSession(sessionFromScored(s), speakerCatalog, speakerCtx)
        .some(sp => (sp.championId ?? sp.id) === speakerId),
    );
    if (session) setDetailSession(session);
  }, [allScored, speakerCatalog, speakerCtx]);

  useEffect(() => {
    if (authLoading) return;

    async function load() {
      const db = tryGetDb();
      if (!db) {
        setErrorMsg("Firebase is not configured. Add NEXT_PUBLIC_FIREBASE_* to .env.local.");
        setStatus("error");
        return;
      }
      try {
        const [pSnap, sessSnap] = await Promise.all([
          isLoggedIn
            ? getDoc(doc(db, `${BASE}/participants/${participantId}`))
            : Promise.resolve(null),
          getDocs(collection(db, `${BASE}/sessions`)),
        ]);

        const pData = pSnap?.exists() ? (pSnap.data() as RawDoc) : {};
        setParticipantData(pData);

        if (isLoggedIn) {
          setSavedSchedule((pData.saved_schedule as string[]) ?? []);
          setSavedSessions((pData.saved_sessions as string[]) ?? []);
          setCertificationGoals((pData.certification_goals as string[]) ?? []);
          setRemovedSessions((pData.removed_sessions as string[]) ?? []);
          setDoNotSuggest((pData.do_not_suggest_sessions as string[]) ?? []);
          setReservedSeats((pData.reserved_seats as string[]) ?? []);
        }

        const rawSessions = sessSnap.docs.map((d) => ({ id: d.id, ...d.data() } as RawDoc));
        const scored = rawSessions
          .map((s) => scoreSession(pData, s))
          .sort(sortSessionsChronological);

        setAllScored(scored);
        setTotalCount(scored.length);
        setStatus("ready");

        try {
          const champSnap = await getDocs(collection(db, `${BASE}/champions`));
          setChampionSources(champSnap.docs.map(d => championFromRaw({ id: d.id, ...d.data() } as RawDoc)));
        } catch (champErr) {
          console.warn("[SessionsPage] Champions catalog unavailable for speaker intel:", champErr);
        }
      } catch (err: unknown) {
        const e = err as { code?: string; message?: string };
        console.error("[SessionsPage] Firestore error:", err);
        if (isFirestorePermissionError(err) && !isLoggedIn) {
          setErrorMsg(
            "Sign in to load the session catalog. On mobile, Safari may block saved login — try signing in again.",
          );
        } else if (isFirestorePermissionError(err)) {
          setErrorMsg(
            "Firestore denied access to the session catalog. Confirm security rules allow reads on organizations/ibm/events/txc2026/sessions.",
          );
        } else {
          setErrorMsg(`${e.code ? `(${e.code}) ` : ""}${e.message ?? String(err)}`);
        }
        setStatus("error");
      }
    }

    load();
  }, [authLoading, participantId, isLoggedIn]);

  useEffect(() => {
    if (status !== "ready" || typeFromUrlApplied) return;
    const typeParam = searchParams.get("type");
    const viewParam = searchParams.get("view");
    if (viewParam === "learning-paths") {
      const match = [...new Set(allScored.map(s => sessionType(s)))].find(t =>
        t.toLowerCase().includes("certification"),
      );
      if (match) setTypeFilter(match);
    } else if (typeParam?.toLowerCase() === "certification") {
      const typeSet = new Set(allScored.map(s => sessionType(s)));
      const match = [...typeSet].find(t => t.toLowerCase().includes("certification"));
      if (match) setTypeFilter(match);
    }
    setTypeFromUrlApplied(true);
  }, [status, searchParams, allScored, typeFromUrlApplied]);

  // Persist schedule arrays to Firestore
  const persist = useCallback(async (updates: {
    saved_schedule?: string[];
    saved_sessions?: string[];
    certification_goals?: string[];
    active_certification_id?: string | null;
    removed_sessions?: string[];
    do_not_suggest_sessions?: string[];
    reserved_seats?: string[];
  }) => {
    if (!isLoggedIn || !participantId) return;
    const db = tryGetDb();
    if (!db) return;
    try {
      await setDoc(doc(db, `${BASE}/participants/${participantId}`), updates, { merge: true });
    } catch (e) {
      console.error("[SessionAction] Firestore write failed:", e);
    }
  }, [participantId, isLoggedIn]);

  const handleSaveCertification = useCallback((id: string) => {
    if (!isLoggedIn) return;
    const session = allScored.find(s => s.id === id);
    const raw = session as unknown as { certification_id?: string; certification_path?: { certification_id?: string } } | undefined;
    const goalId = String(raw?.certification_id ?? raw?.certification_path?.certification_id ?? id);
    const next = certificationGoals.includes(goalId) ? certificationGoals : [...certificationGoals, goalId];
    setCertificationGoals(next);
    persist({ certification_goals: next, active_certification_id: goalId });
  }, [certificationGoals, persist, isLoggedIn, allScored]);

  const handleRemoveCertification = useCallback((id: string) => {
    if (!isLoggedIn) return;
    const nextGoals = certificationGoals.filter(x => x !== id);
    const { saved_sessions, saved_schedule } = removeSessionFromBothLists(savedSessions, savedSchedule, id);
    setCertificationGoals(nextGoals);
    setSavedSessions(saved_sessions);
    setSavedSchedule(saved_schedule);
    setParticipantData(prev => ({ ...prev, saved_sessions, saved_schedule }));
    persist({
      certification_goals: nextGoals,
      saved_schedule,
      saved_sessions,
    });
  }, [certificationGoals, savedSessions, savedSchedule, persist, isLoggedIn]);

  const handleSave = useCallback((id: string) => {
    if (!isLoggedIn) return;
    const { saved_sessions, saved_schedule } = addSessionToBothLists(savedSessions, savedSchedule, id);
    setSavedSessions(saved_sessions);
    setSavedSchedule(saved_schedule);
    persist({ saved_schedule, saved_sessions });
  }, [savedSessions, savedSchedule, persist, isLoggedIn]);

  const handleRemove = useCallback((id: string) => {
    if (!isLoggedIn) return;
    const { saved_sessions, saved_schedule } = removeSessionFromBothLists(savedSessions, savedSchedule, id);
    const nextRemoved = removedSessions.includes(id) ? removedSessions : [...removedSessions, id];
    setSavedSessions(saved_sessions);
    setSavedSchedule(saved_schedule);
    setRemovedSessions(nextRemoved);
    persist({ saved_schedule, saved_sessions, removed_sessions: nextRemoved });
  }, [savedSessions, savedSchedule, removedSessions, persist, isLoggedIn]);

  const handleDoNotSuggest = useCallback((id: string) => {
    if (!isLoggedIn) return;
    const next = doNotSuggest.includes(id) ? doNotSuggest : [...doNotSuggest, id];
    setDoNotSuggest(next);
    persist({ do_not_suggest_sessions: next });
  }, [doNotSuggest, persist, isLoggedIn]);

  const handleReserveSeat = useCallback((id: string) => {
    if (!isLoggedIn) return;
    const next = reservedSeats.includes(id) ? reservedSeats : [...reservedSeats, id];
    setReservedSeats(next);
    persist({ reserved_seats: next });
  }, [reservedSeats, persist, isLoggedIn]);

  const handleShowInfo = useCallback((session: ScoredSession) => {
    setDetailSession(session);
  }, []);

  const mergedSavedSessionIds = useMemo(
    () => mergeSavedSessionIds(savedSessions, savedSchedule),
    [savedSessions, savedSchedule],
  );

  const schedState: ScheduleState = useMemo(() => ({
    savedSchedule: mergedSavedSessionIds,
    certificationGoals,
    doNotSuggest,
    reservedSeats,
    allSessions: allScored,
    isLoggedIn,
    onSave: handleSave,
    onRemove: handleRemove,
    onSaveCertification: handleSaveCertification,
    onRemoveCertification: handleRemoveCertification,
    onDoNotSuggest: handleDoNotSuggest,
    onReserveSeat: handleReserveSeat,
    onShowInfo: handleShowInfo,
  }), [mergedSavedSessionIds, certificationGoals, doNotSuggest, reservedSeats, allScored, isLoggedIn, handleSave, handleRemove, handleSaveCertification, handleRemoveCertification, handleDoNotSuggest, handleReserveSeat, handleShowInfo]);

  // Filter + derive sections
  const { tracks, types, days } = useMemo(() => {
    const trackSet = new Set<string>();
    const typeSet  = new Set<string>();
    const daySet   = new Set<string>();
    for (const s of allScored) {
      const t = primaryTrack(s);
      if (t) trackSet.add(t);
      typeSet.add(sessionType(s));
      const d = sessionDay(s);
      if (d) daySet.add(d);
    }
    return {
      tracks: ["All", ...Array.from(trackSet).sort()],
      types:  ["All", ...Array.from(typeSet).sort()],
      days:   ["All", ...Array.from(daySet).sort((a, b) => daySortKey(a) - daySortKey(b))],
    };
  }, [allScored]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return allScored.filter((s) => {
      if (q && !s.title.toLowerCase().includes(q)) return false;
      if (trackFilter !== "All" && primaryTrack(s) !== trackFilter) return false;
      if (typeFilter  !== "All" && sessionType(s)  !== typeFilter)  return false;
      if (dayFilter   !== "All" && sessionDay(s)   !== dayFilter)   return false;
      return true;
    });
  }, [allScored, search, trackFilter, typeFilter, dayFilter]);

  const isFiltered = search !== "" || trackFilter !== "All" || typeFilter !== "All" || dayFilter !== "All";

  // Base list for intelligence bands — exclude dismissed, preserve score order
  const baseList = useMemo(() => {
    return (isFiltered ? filtered : allScored).filter(s => !doNotSuggest.includes(s.id));
  }, [isFiltered, filtered, allScored, doNotSuggest]);

  const recommended = useMemo(() => {
    const hasCertIntent = isCertificationJourneyActive(participantData, {
      selectedCertificationCount: certificationGoals.length,
    });
    const balancedIds = selectBalancedSessionBand(baseList, 6, hasCertIntent).map(s => s.id);
    const byId = new Map(baseList.map(s => [s.id, s]));
    const scored = balancedIds
      .map(id => byId.get(id))
      .filter((s): s is ScoredSession => !!s);
    if (scored.length > 0) return scored;
    if (!isLoggedIn) {
      return baseList
        .filter(s => !isCertificationActivityType(s))
        .slice(0, 6);
    }
    return scored;
  }, [baseList, participantData, certificationGoals, isLoggedIn]);

  const recommendedIds = useMemo(() => new Set(recommended.map(s => s.id)), [recommended]);

  const trending = useMemo(() => {
    const fromSignals = baseList
      .filter(s => !recommendedIds.has(s.id) && (
        s.recommendation_rules?.everyone_encouraged ||
        s.capacity?.status === "limited"
      ))
      .slice(0, 4);
    if (fromSignals.length > 0) return fromSignals;
    if (!isLoggedIn) {
      return baseList
        .filter(s => !recommendedIds.has(s.id) && !isCertificationActivityType(s))
        .slice(0, 4);
    }
    return fromSignals;
  }, [baseList, recommendedIds, isLoggedIn]);

  const catalogSessions = useMemo(() => {
    const list = isFiltered ? filtered : allScored;
    return list.filter(s => !doNotSuggest.includes(s.id));
  }, [isFiltered, filtered, allScored, doNotSuggest]);

  if (status === "loading") {
    return (
      <section className="section no-top-border">
        <div className="section-kicker">Loading&#8230;</div>
        <h1 style={{ fontSize: "clamp(2rem,4vw,3.5rem)", fontWeight: 520, letterSpacing: "-0.04em", margin: "12px 0 16px", color: "var(--text)" }}>
          Scoring sessions against your profile&#8230;
        </h1>
      </section>
    );
  }

  if (status === "error") {
    return (
      <section className="section no-top-border">
        <div className="section-kicker" style={{ color: "var(--accent)" }}>Error</div>
        <h2>Could not load sessions</h2>
        <p style={{ color: "var(--muted)", maxWidth: "640px" }}>{errorMsg}</p>
        {!isLoggedIn && (
          <p style={{ marginTop: "16px" }}>
            <Link href="/txc/login" className="btn-primary">Sign in</Link>
            {" "}
            <Link href="/txc/enroll" className="btn-ghost" style={{ marginLeft: "8px" }}>Build My Compass</Link>
          </p>
        )}
      </section>
    );
  }

  return (
    <>
      <section className="compact-hero story-hero--strong">
        {isCertificationView ? (
          <>
            <div className="section-kicker">Certification journeys</div>
            <h1>{learningPathCount} learning paths available.</h1>
            <p>{CERTIFICATION_JOURNEY_COPY.pathsSupporting}</p>
            {certLabel && (
              <p className="certification-view-personal">
                Your journey: <strong>{certLabel}</strong> — Compass surfaces sessions, labs, experts,
                and community moments to help you succeed.
              </p>
            )}
          </>
        ) : (
          <>
            <div className="section-kicker">Session intelligence</div>
            <h1>Sessions that fit your week.</h1>
            <p>
              {isLoggedIn
                ? "Compass reads sessions against your profile and surfaces what to prioritize: recommended matches, room momentum, and seats filling fast."
                : "Browse the full TechXchange catalog below. Sign in or build your Compass to unlock personalized match scores."}
            </p>
          </>
        )}
      </section>

      {/* ── Filters ─────────────────────────────────────────────────── */}
      <section className="section no-top-border">
        <div style={{ marginBottom: "20px" }}>
          <input
            type="search"
            placeholder="Search sessions by title&#8230;"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search sessions"
            style={{
              width: "100%", maxWidth: "480px", height: "42px", padding: "0 14px",
              border: "1px solid var(--line-strong)", background: "var(--panel)",
              color: "var(--text)", fontSize: "0.95rem", fontFamily: "inherit",
              outline: "none", boxSizing: "border-box",
            }}
          />
        </div>

        {tracks.length > 2 && (
          <div className="filter-group">
            <p style={{ color: "var(--muted)", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 680, margin: "0 0 8px" }}>Tech track</p>
            <div className="filter-scroll-row">
              {tracks.slice(0, 12).map((track) => (
                <FilterChip key={track} label={track} active={trackFilter === track} onClick={() => setTrackFilter(track)} />
              ))}
            </div>
          </div>
        )}

        {types.length > 2 && (
          <div className="filter-group">
            <p style={{ color: "var(--muted)", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 680, margin: "0 0 8px" }}>Session type</p>
            <div className="filter-scroll-row">
              {types.slice(0, 10).map((type) => (
                <FilterChip key={type} label={type} active={typeFilter === type} onClick={() => setTypeFilter(type)} />
              ))}
            </div>
          </div>
        )}

        {days.length > 2 && (
          <div className="filter-group">
            <p style={{ color: "var(--muted)", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 680, margin: "0 0 8px" }}>Day</p>
            <div className="filter-scroll-row">
              {days.map((day) => (
                <FilterChip key={day} label={day} active={dayFilter === day} onClick={() => setDayFilter(day)} />
              ))}
            </div>
          </div>
        )}

        {isFiltered && (
          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginTop: "8px" }}>
            <span style={{ color: "var(--muted)", fontSize: "0.88rem" }}>{filtered.length} of {totalCount} sessions</span>
            <button
              onClick={() => { setSearch(""); setTrackFilter("All"); setTypeFilter("All"); setDayFilter("All"); }}
              style={{ background: "transparent", border: 0, color: "var(--accent)", fontSize: "0.88rem", fontFamily: "inherit", cursor: "pointer", padding: 0 }}
            >
              Clear filters
            </button>
          </div>
        )}
      </section>

      {/* ── Session intelligence bands ──────────────────────────────── */}
      {!isFiltered && (
        <>
          <IntelligenceBand
            kicker={isLoggedIn ? "Recommended" : "Browse"}
            title={isLoggedIn ? "Your strongest matches." : "Sessions to explore."}
            desc={isLoggedIn
              ? "Highest-scored sessions against your goals, tracks, role, and needs."
              : "A sample of what is on the schedule — build your Compass for personalized recommendations."}
            sessions={recommended}
            sched={schedState}
            certLabel={certLabel}
            speakerCatalog={speakerCatalog}
            speakerCtx={speakerCtx}
            onViewSpeaker={handleViewSpeaker}
            anonymous={!isLoggedIn}
          />
          <IntelligenceBand
            kicker="Trending"
            title="Seats filling fast."
            desc="High-demand and broadly relevant sessions worth booking early."
            sessions={trending}
            sched={schedState}
            certLabel={certLabel}
            speakerCatalog={speakerCatalog}
            speakerCtx={speakerCtx}
            onViewSpeaker={handleViewSpeaker}
            anonymous={!isLoggedIn}
          />
        </>
      )}

      {isFiltered && recommended.length > 0 && (
        <IntelligenceBand
          kicker="Top matches"
          title={`Best ${recommended.length} from your search.`}
          desc="Compass scores within your filtered results."
          sessions={recommended}
          sched={schedState}
          certLabel={certLabel}
          speakerCatalog={speakerCatalog}
          speakerCtx={speakerCtx}
          onViewSpeaker={handleViewSpeaker}
          anonymous={!isLoggedIn}
        />
      )}

      {/* ── Full catalog ─────────────────────────────────────────────── */}
      <section className="section">
        <div className="section-head">
          <div>
            <div className="section-kicker">{isCertificationView ? "Certification catalog" : isFiltered ? "Filtered results" : "Browse all"}</div>
            <h2>
              {isCertificationView
                ? `${catalogSessions.length} certification journey${catalogSessions.length !== 1 ? "s" : ""}`
                : isFiltered
                  ? `${catalogSessions.length} session${catalogSessions.length !== 1 ? "s" : ""}`
                  : `All ${totalCount} sessions`}
            </h2>
          </div>
          <p>
            {isCertificationView
              ? "One source of truth — certification journeys live in the session catalog alongside everything else at TechXchange."
              : "Sorted by day and time — match score breaks ties."}
          </p>
        </div>

        {catalogSessions.length === 0 ? (
          <div style={{ borderTop: "1px solid var(--line)", padding: "48px 0", textAlign: "center" }}>
            <p style={{ color: "var(--muted)", fontSize: "1.05rem", margin: "0 0 16px" }}>
              No sessions match your current filters.
            </p>
            <button
              onClick={() => { setSearch(""); setTrackFilter("All"); setTypeFilter("All"); setDayFilter("All"); }}
              className="btn-secondary"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="catalog-list">
            {catalogSessions.map((s) => (
              <CatalogRow key={s.id} session={s} sched={schedState} certLabel={certLabel} anonymous={!isLoggedIn} />
            ))}
          </div>
        )}
      </section>

      <section className="final-band">
        <div>
          {user && enrolled ? (
            <>
              <h2>Your full experience is on the Compass page.</h2>
              <p>Sessions are one pillar. Community, Next Best Move, and your four-day plan are on My Experience.</p>
            </>
          ) : (
            <>
              <h2>Tell Compass your intent.</h2>
              <p>Build your Compass profile to unlock personalized session scores and your four-day plan.</p>
            </>
          )}
        </div>
        {user && enrolled
          ? <Link href="/experience" className="btn-primary">Open My Compass &#8594;</Link>
          : <Link href="/txc/enroll"     className="btn-primary">Build My Compass &#8594;</Link>
        }
      </section>

      {detailSession && (
        <SessionDetailModal
          session={detailSession}
          allSessions={allScored}
          speakerCatalog={speakerCatalog}
          speakerCtx={speakerCtx}
          onViewSpeaker={handleViewSpeaker}
          anonymous={!isLoggedIn}
          onClose={() => setDetailSession(null)}
        />
      )}
    </>
  );
}
