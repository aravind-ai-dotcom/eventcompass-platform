"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { collection, doc, getDoc, getDocs, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { sessionRecommendationLine } from "@/lib/sessionRecommendationLine";

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
}

// Schedule interaction state — passed to card components
interface ScheduleState {
  savedSchedule:  string[];
  doNotSuggest:   string[];
  reservedSeats:  string[];
  allSessions:    ScoredSession[];
  isLoggedIn:     boolean;
  onSave:         (id: string) => void;
  onRemove:       (id: string) => void;
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
  const day = sessionDay(s);
  if (!day) return false;
  const sStart = parseTime(sessionStart(s));
  if (sStart === null) return false;
  const sEnd = parseTime(sessionEnd(s)) ?? sStart + 60;

  for (const id of savedIds) {
    if (id === s.id) continue;
    const saved = allSessions.find((x) => x.id === id);
    if (!saved || sessionDay(saved) !== day) continue;
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
// Session detail modal — avoids dead /sessions/{id} routes
// ─────────────────────────────────────────────────────────────────────────────

function SessionDetailModal({ session, onClose }: { session: ScoredSession; onClose: () => void }) {
  const type = sessionType(session);
  const track = primaryTrack(session);
  const meta = sessionMeta(session);
  const tags = [
    ...(session.tracks?.topics ?? []),
    ...(session.tracks?.products ?? []),
    ...(session.tracks?.secondary_tracks ?? []),
  ].filter(Boolean);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="session-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="session-modal-title"
      onClick={onClose}
    >
      <div className="session-modal" onClick={e => e.stopPropagation()}>
        <button type="button" className="session-modal-close" onClick={onClose} aria-label="Close">
          ×
        </button>
        <p style={{ color: "var(--accent)", fontSize: "0.68rem", fontWeight: 680, textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 8px" }}>
          {type}{track ? ` · ${track}` : ""}
        </p>
        <h2 id="session-modal-title">{session.title}</h2>
        {meta && <p className="session-modal-meta">{meta}</p>}
        {session.compass_score > 0 && (
          <p style={{ fontSize: "0.88rem", color: "var(--text)", margin: "0 0 16px" }}>
            Compass match: <strong>{session.compass_score}</strong>
          </p>
        )}
        {tags.length > 0 && (
          <div className="chip-row" style={{ marginBottom: "16px" }}>
            {tags.slice(0, 8).map(tag => <span key={tag} className="chip">{tag}</span>)}
          </div>
        )}
        {session.compass_reasons.length > 0 && (
          <>
            <p style={{ color: "var(--muted)", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.09em", fontWeight: 680, margin: "0 0 8px" }}>
              Why Compass matched this
            </p>
            <ul className="session-modal-reasons">
              {session.compass_reasons.map(r => <li key={r}>{r}</li>)}
            </ul>
          </>
        )}
      </div>
    </div>
  );
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

  return {
    id: String(raw.id ?? ""),
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
    compass_score: score,
    compass_reasons: reasons,
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
  const isSaved   = sched.savedSchedule.includes(session.id);
  const isDns     = sched.doNotSuggest.includes(session.id);
  const isReserved = sched.reservedSeats.includes(session.id);
  const conflict  = sched.isLoggedIn && !isSaved && hasConflict(session, sched.savedSchedule, sched.allSessions);

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
          Sign in to save or reserve
        </span>
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

function RecommendedCard({ session, sched }: { session: ScoredSession; sched?: ScheduleState }) {
  const type = sessionType(session);
  const track = primaryTrack(session);
  const meta = sessionMeta(session);
  const tags = [...(session.tracks?.topics ?? []), ...(session.tracks?.products ?? [])].slice(0, 4);
  const recommendation = sessionRecommendationLine(session);

  return (
    <article className="opportunity-card" style={{ display: "flex", flexDirection: "column" }}>
      <div className="card-meta">
        <span>{type}{track ? ` · ${track}` : ""}</span>
        <ScoreBadge score={session.compass_score} />
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

function CatalogRow({ session, sched }: { session: ScoredSession; sched?: ScheduleState }) {
  const type = sessionType(session);
  const track = primaryTrack(session);
  const day = sessionDay(session);
  const start = sessionStart(session);
  const room = sessionRoom(session);
  const capacity = session.capacity?.available_slots ?? 0;
  const status = session.capacity?.status ?? "";
  const isDns = sched ? sched.doNotSuggest.includes(session.id) : false;

  return (
    <article style={isDns ? { opacity: 0.5 } : undefined}>
      <time>{day}{start ? ` · ${start}` : ""}</time>
      <div>
        <span>{type}{track ? ` · ${track}` : ""}</span>
        <h3>{session.title}</h3>
        <p>
          {room}
          {session.compass_score > 0 && (
            <> · <span style={{ color: "var(--accent)", fontWeight: 600 }}>{session.compass_score}% match</span></>
          )}
          {session.compass_reasons[0] && <> · {session.compass_reasons[0]}</>}
        </p>
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

function IntelligenceBand({ kicker, title, desc, sessions, sched }: {
  kicker: string;
  title: string;
  desc: string;
  sessions: ScoredSession[];
  sched: ScheduleState;
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
        {sessions.map(s => <RecommendedCard key={s.id} session={s} sched={sched} />)}
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
  const { user, enrolled, loading: authLoading } = useAuth();
  const isLoggedIn = !!user;
  const participantId = user?.uid ?? "";

  const [allScored,     setAllScored]     = useState<ScoredSession[]>([]);
  const [status,        setStatus]        = useState<"loading" | "ready" | "error">("loading");
  const [errorMsg,      setErrorMsg]      = useState("");
  const [totalCount,    setTotalCount]    = useState(0);

  // Schedule state — loaded from Firestore, persisted on every action
  const [savedSchedule, setSavedSchedule] = useState<string[]>([]);
  const [removedSessions, setRemovedSessions] = useState<string[]>([]);
  const [doNotSuggest,  setDoNotSuggest]  = useState<string[]>([]);
  const [reservedSeats, setReservedSeats] = useState<string[]>([]);
  const [detailSession, setDetailSession] = useState<ScoredSession | null>(null);

  // Filter state
  const [search,      setSearch]      = useState("");
  const [trackFilter, setTrackFilter] = useState("All");
  const [typeFilter,  setTypeFilter]  = useState("All");
  const [dayFilter,   setDayFilter]   = useState("All");

  useEffect(() => {
    if (authLoading) return;

    async function load() {
      try {
        const [pSnap, sessSnap] = await Promise.all([
          isLoggedIn
            ? getDoc(doc(db, `${BASE}/participants/${participantId}`))
            : Promise.resolve(null),
          getDocs(collection(db, `${BASE}/sessions`)),
        ]);

        const pData = pSnap?.exists() ? (pSnap.data() as RawDoc) : {};

        if (isLoggedIn) {
          setSavedSchedule((pData.saved_schedule as string[]) ?? []);
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
      } catch (err: unknown) {
        const e = err as { code?: string; message?: string };
        setErrorMsg(`${e.code ? `(${e.code}) ` : ""}${e.message ?? String(err)}`);
        setStatus("error");
      }
    }

    load();
  }, [authLoading, participantId, isLoggedIn]);

  // Persist schedule arrays to Firestore
  const persist = useCallback(async (updates: {
    saved_schedule?: string[];
    removed_sessions?: string[];
    do_not_suggest_sessions?: string[];
    reserved_seats?: string[];
  }) => {
    if (!isLoggedIn || !participantId) return;
    try {
      await setDoc(doc(db, `${BASE}/participants/${participantId}`), updates, { merge: true });
    } catch (e) {
      console.error("[SessionAction] Firestore write failed:", e);
    }
  }, [participantId, isLoggedIn]);

  const handleSave = useCallback((id: string) => {
    if (!isLoggedIn) return;
    const next = savedSchedule.includes(id) ? savedSchedule : [...savedSchedule, id];
    setSavedSchedule(next);
    persist({ saved_schedule: next });
  }, [savedSchedule, persist, isLoggedIn]);

  const handleRemove = useCallback((id: string) => {
    if (!isLoggedIn) return;
    const nextSaved   = savedSchedule.filter((x) => x !== id);
    const nextRemoved = removedSessions.includes(id) ? removedSessions : [...removedSessions, id];
    setSavedSchedule(nextSaved);
    setRemovedSessions(nextRemoved);
    persist({ saved_schedule: nextSaved, removed_sessions: nextRemoved });
  }, [savedSchedule, removedSessions, persist, isLoggedIn]);

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

  const schedState: ScheduleState = useMemo(() => ({
    savedSchedule,
    doNotSuggest,
    reservedSeats,
    allSessions: allScored,
    isLoggedIn,
    onSave: handleSave,
    onRemove: handleRemove,
    onDoNotSuggest: handleDoNotSuggest,
    onReserveSeat: handleReserveSeat,
    onShowInfo: handleShowInfo,
  }), [savedSchedule, doNotSuggest, reservedSeats, allScored, isLoggedIn, handleSave, handleRemove, handleDoNotSuggest, handleReserveSeat, handleShowInfo]);

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

  const recommended = useMemo(
    () => [...baseList].sort((a, b) => b.compass_score - a.compass_score).slice(0, 6),
    [baseList],
  );

  const recommendedIds = useMemo(() => new Set(recommended.map(s => s.id)), [recommended]);

  const trending = useMemo(() => {
    return baseList
      .filter(s => !recommendedIds.has(s.id) && (
        s.recommendation_rules?.everyone_encouraged ||
        s.capacity?.status === "limited"
      ))
      .slice(0, 4);
  }, [baseList, recommendedIds]);

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
      </section>
    );
  }

  return (
    <>
      <section className="compact-hero story-hero--strong">
        <div className="section-kicker">Session intelligence</div>
        <h1>Sessions that fit your week.</h1>
        <p>
          Compass reads sessions against your profile and surfaces what to prioritize:
          recommended matches, room momentum, and seats filling fast.
        </p>
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
            kicker="Recommended"
            title="Your strongest matches."
            desc="Highest-scored sessions against your goals, tracks, role, and needs."
            sessions={recommended}
            sched={schedState}
          />
          <IntelligenceBand
            kicker="Trending"
            title="Seats filling fast."
            desc="High-demand and broadly relevant sessions worth booking early."
            sessions={trending}
            sched={schedState}
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
        />
      )}

      {/* ── Full catalog ─────────────────────────────────────────────── */}
      <section className="section">
        <div className="section-head">
          <div>
            <div className="section-kicker">{isFiltered ? "Filtered results" : "Browse all"}</div>
            <h2>{isFiltered ? `${catalogSessions.length} session${catalogSessions.length !== 1 ? "s" : ""}` : `All ${totalCount} sessions`}</h2>
          </div>
          <p>Sorted by day and time — match score breaks ties.</p>
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
            {catalogSessions.map((s) => <CatalogRow key={s.id} session={s} sched={schedState} />)}
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
          : <Link href="/enroll"     className="btn-primary">Build My Compass &#8594;</Link>
        }
      </section>

      {detailSession && (
        <SessionDetailModal session={detailSession} onClose={() => setDetailSession(null)} />
      )}
    </>
  );
}
