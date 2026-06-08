"use client";

// =============================================================================
// EventCompass — My Experience  /experience
//
// The live Firestore-powered Compass experience page.
//
// Data flow:
//   Firestore (organizations/ibm/events/txc2026)
//     → raw participant + sessions + champions
//     → weighted scoring (inline, no external deps)
//     → four experience sections:
//         ParticipantHero  — who you are + your compass score
//         EventUniverseStats — live counts
//         NextBestMove     — single highest-scoring session
//         Learning         — top scored sessions (breakouts, labs, workshops)
//         Community        — top scored champions + meet-the-expert
//         Fun              — social, keynote, general, reception, meetup
//
// Firestore path: organizations/ibm/events/txc2026
// Participant:    ATT-0001 (no auth yet)
//
// CSS: globals.css class names only. No inline layout inventing.
// =============================================================================

import { useEffect, useState } from "react";
import { db } from "../../lib/firebase";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const BASE           = "organizations/ibm/events/txc2026";
const PARTICIPANT_ID = "ATT-0001";

// Scoring weights — exact per specification
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

// Session types that belong to each pillar
const FUN_TYPES = new Set([
  "general session",
  "keynote",
  "reception",
  "social",
  "networking",
  "meetup",
  "awards",
  "celebration",
  "party",
  "fun",
]);

const LEARNING_TYPES = new Set([
  "instructor-led lab",
  "lab",
  "workshop",
  "certification",
  "technical breakout",
  "breakout session",
  "breakout",
  "hands-on lab",
  "demo",
]);

// ─────────────────────────────────────────────────────────────────────────────
// Local types — self-contained so this page works before services are wired in
// ─────────────────────────────────────────────────────────────────────────────

type RawDoc = Record<string, unknown>;

interface ScoredSession {
  id: string;
  title: string;
  session_type?: string;
  activity_type?: string;
  schedule?: {
    day?: string;
    date?: string;
    start_time?: string;
    end_time?: string;
    room?: string;
  };
  tracks?: {
    primary_track?: string;
    secondary_tracks?: string[];
    topics?: string[];
    products?: string[];
  };
  recommendation_rules?: {
    executive_relevant?: boolean;
    everyone_encouraged?: boolean;
    hands_on?: boolean;
  };
  // legacy flat fields
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
  sessions:     number;
  champions:    number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Pure utilities — no Firebase, no side effects
// ─────────────────────────────────────────────────────────────────────────────

/** Lowercase + filter empties — used before every comparison */
function lower(items: (string | undefined | null)[]): string[] {
  return items
    .filter((v): v is string => typeof v === "string" && v.trim() !== "")
    .map((v) => v.toLowerCase());
}

/**
 * Resolve a field that may live in either the legacy flat schema or the
 * nested v5 schema. Nested path is tried first.
 */
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

/** Collect all tracks from both schema forms */
function allTracks(raw: RawDoc): string[] {
  const tracks  = (raw.tracks as RawDoc | undefined) ?? {};
  const primary = (tracks.primary_track as string) ?? "";
  const secondary = (tracks.secondary_tracks as string[]) ?? [];
  const legacy  = raw.tech_track;
  const legacyArr = Array.isArray(legacy)
    ? (legacy as string[])
    : typeof legacy === "string" && legacy
    ? [legacy]
    : [];
  return [primary, ...secondary, ...legacyArr].filter(Boolean);
}

/** Human-readable session meta line: day · time · room */
function sessionMeta(s: ScoredSession): string {
  const raw = s as unknown as RawDoc;
  const day   = resolve(raw, "date",       "schedule.day");
  const start = resolve(raw, "start_time", "schedule.start_time");
  const room  = resolve(raw, "room",       "schedule.room");
  return [day, start, room].filter(Boolean).join(" · ");
}

/** Canonical session type label */
function sessionTypeLabel(s: ScoredSession): string {
  return (s.session_type ?? s.activity_type ?? "Session").trim();
}

/** Which experience pillar does this session belong to? */
type Pillar = "Learning" | "Community" | "Fun";

function getPillar(s: ScoredSession): Pillar {
  const t = sessionTypeLabel(s).toLowerCase();
  if (FUN_TYPES.has(t))      return "Fun";
  if (LEARNING_TYPES.has(t)) return "Learning";
  // Community covers everything else: meet the expert, roundtable, special program, etc.
  return "Community";
}

// ─────────────────────────────────────────────────────────────────────────────
// Scoring
// ─────────────────────────────────────────────────────────────────────────────

function scoreSession(participant: RawDoc, raw: RawDoc): ScoredSession {
  let score = 0;
  const reasons: string[] = [];

  // Participant signal vectors
  const sig    = (participant.event_signal_profile as RawDoc) ?? {};
  const intel  = (participant.compass_intelligence  as RawDoc) ?? {};
  const reg    = (participant.registration          as RawDoc) ?? {};
  const intent = (sig.intent                        as RawDoc) ?? {};

  const pTracks   = lower((sig.tech_tracks              as string[]) ?? []);
  const pGoals    = lower((sig.goals                    as string[]) ?? []);
  const pNeeds    = lower((intent.needs                 as string[]) ?? []);
  const pKeywords = lower((intel.matching_keywords      as string[]) ?? []);
  const pRoles    = lower((sig.roles_at_txc             as string[]) ?? []);
  const pIndustry = ((reg.industry as string) ?? "").toLowerCase().trim();

  // Session signal vectors
  const sCI       = (raw.compass_intelligence    as RawDoc) ?? {};
  const sAudience = (raw.audience                as RawDoc) ?? {};
  const sRules    = (raw.recommendation_rules    as RawDoc) ?? {};

  const sTracks     = lower(allTracks(raw));
  const sIntents    = lower((sCI.intent_tags         as string[]) ?? []);
  const sNeeds      = lower((sCI.need_tags            as string[]) ?? []);
  const sKeywords   = lower((sCI.matching_keywords    as string[]) ?? []);
  const sRoles      = lower((sAudience.roles          as string[]) ?? []);
  const sIndustries = lower((sAudience.industries     as string[]) ?? []);

  // Track match +25 per matching track
  for (const t of pTracks) {
    if (sTracks.includes(t)) {
      score += W.track;
      reasons.push(`Track match: ${t}`);
    }
  }
  // Goal match +20 per goal → intent_tag
  for (const g of pGoals) {
    if (sIntents.includes(g)) {
      score += W.goal;
      reasons.push(`Goal match: ${g}`);
    }
  }
  // Need match +15 per need tag
  for (const n of pNeeds) {
    if (sNeeds.includes(n)) {
      score += W.need;
      reasons.push(`Need match: ${n}`);
    }
  }
  // Role match +10
  for (const r of pRoles) {
    if (sRoles.includes(r)) {
      score += W.role;
      reasons.push(`Role match: ${r}`);
    }
  }
  // Industry match +10
  if (pIndustry && sIndustries.includes(pIndustry)) {
    score += W.industry;
    reasons.push(`Industry match: ${reg.industry as string}`);
  }
  // Keyword match +5 each
  for (const k of pKeywords) {
    if (sKeywords.includes(k)) {
      score += W.keyword;
      reasons.push(`Keyword match: ${k}`);
    }
  }
  // Recommendation rule bonuses
  if (sRules.executive_relevant)  { score += W.executive; reasons.push("Executive relevant"); }
  if (sRules.everyone_encouraged) { score += W.broad;     reasons.push("Broad event relevance"); }
  if (sRules.hands_on)            { score += W.handsOn;   reasons.push("Hands-on learning"); }

  const scheduleRaw = raw.schedule as ScoredSession["schedule"] | undefined;
  const tracksRaw   = raw.tracks   as ScoredSession["tracks"]   | undefined;
  const rulesRaw    = raw.recommendation_rules as ScoredSession["recommendation_rules"] | undefined;

  return {
    id:                  String(raw.id ?? ""),
    title:               String(raw.title ?? "Untitled session"),
    session_type:        raw.session_type  as string | undefined,
    activity_type:       raw.activity_type as string | undefined,
    schedule:            scheduleRaw,
    tracks:              tracksRaw,
    recommendation_rules: rulesRaw,
    date:                raw.date       as string | undefined,
    start_time:          raw.start_time as string | undefined,
    room:                raw.room       as string | undefined,
    tech_track:          raw.tech_track as string | string[] | undefined,
    compass_score:   score,
    compass_reasons: reasons,
  };
}

function scoreChampion(participant: RawDoc, raw: RawDoc): ScoredChampion {
  // Consent gate: explicit false = opted out
  const consent = raw.consent as RawDoc | undefined;
  if (consent?.allow_intro_requests === false) {
    return {
      id:            String(raw.id ?? ""),
      display_name:  String(raw.display_name ?? "Champion"),
      compass_score: 0,
      shared_keywords: [],
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
    ...((raw.domains       as string[]) ?? []),   // legacy flat field
  ]);

  const shared: string[] = [];
  let score = 0;

  for (const kw of pKws) {
    if (cKws.includes(kw)) {
      score += 10;
      shared.push(kw);
    }
  }

  const attendance = raw.attendance as RawDoc | undefined;
  if (attendance?.available_for_1x1 === true) score += 5;

  const profileTyped = raw.profile as ScoredChampion["profile"] | undefined;
  const attendanceTyped = raw.attendance as ScoredChampion["attendance"] | undefined;

  return {
    id:              String(raw.id ?? ""),
    display_name:    String(raw.display_name ?? "Champion"),
    title:           raw.title        as string | undefined,
    organization:    raw.organization as string | undefined,
    profile:         profileTyped,
    attendance:      attendanceTyped,
    compass_score:   score,
    shared_keywords: shared,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components — inline, scoped to this page
// ─────────────────────────────────────────────────────────────────────────────

// ── Compass score badge ────────────────────────────────────────────────────────

function ScoreBadge({ score, size = "md" }: { score: number; size?: "sm" | "md" | "lg" }) {
  const sz = { sm: { badge: 42, num: "1.1rem" }, md: { badge: 54, num: "1.45rem" }, lg: { badge: 72, num: "2rem" } }[size];
  return (
    <div
      className="compass-score-badge"
      style={{ minWidth: sz.badge, minHeight: sz.badge }}
      title={`Compass score: ${score}`}
    >
      <span className="score-number" style={{ fontSize: sz.num }}>{score}</span>
      <span className="score-label">fit</span>
    </div>
  );
}

// ── Session card ───────────────────────────────────────────────────────────────

function SessionCard({ session }: { session: ScoredSession }) {
  const type  = sessionTypeLabel(session);
  const track = session.tracks?.primary_track ?? "";
  const meta  = sessionMeta(session);
  const tags  = [
    ...(session.tracks?.topics   ?? []),
    ...(session.tracks?.products ?? []),
  ].slice(0, 4);

  return (
    <article className="opportunity-card">
      <div className="card-meta">
        <span>{type}{track ? ` · ${track}` : ""}</span>
        <ScoreBadge score={session.compass_score} size="sm" />
      </div>

      <h3>{session.title}</h3>

      {meta && (
        <p>{meta}</p>
      )}

      {tags.length > 0 && (
        <div className="chip-row" style={{ marginTop: 0, marginBottom: "14px" }}>
          {tags.map((tag) => (
            <span key={tag} className="chip">{tag}</span>
          ))}
        </div>
      )}

      {session.compass_reasons.length > 0 && (
        <>
          <p
            style={{
              color: "var(--muted)",
              fontSize: "0.72rem",
              textTransform: "uppercase",
              letterSpacing: "0.09em",
              fontWeight: 680,
              margin: "14px 0 6px",
            }}
          >
            Why Compass picked this
          </p>
          <ul className="reason-list">
            {session.compass_reasons.slice(0, 4).map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </>
      )}
    </article>
  );
}

// ── Champion card ──────────────────────────────────────────────────────────────

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
        {domains.length > 0 && (
          <small>{domains.join(" · ")}</small>
        )}
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

// ── Pillar section ─────────────────────────────────────────────────────────────

const PILLAR_META = {
  Learning: {
    kicker: "Learning",
    heading: "Sessions matched to your goals.",
    description: "Labs, breakouts, workshops, and certifications scored against your tracks, goals, needs, and keywords.",
  },
  Community: {
    kicker: "Community",
    heading: "People and moments worth your time.",
    description: "Expert sessions, roundtables, and experiences that connect you with the right people.",
  },
  Fun: {
    kicker: "Fun",
    heading: "Moments that make the week memorable.",
    description: "Keynotes, general sessions, social events, and networking moments worth adding to your plan.",
  },
} as const;

function PillarSection({
  pillar,
  sessions,
  limit = 3,
}: {
  pillar: Pillar;
  sessions: ScoredSession[];
  limit?: number;
}) {
  if (sessions.length === 0) return null;
  const { kicker, heading, description } = PILLAR_META[pillar];
  const visible = sessions.slice(0, limit);

  return (
    <section className="section">
      <div className="section-head">
        <div>
          <div className="section-kicker">{kicker}</div>
          <h2>{heading}</h2>
        </div>
        <p>{description}</p>
      </div>

      <div className="opportunity-grid three">
        {visible.map((s) => (
          <SessionCard key={s.id} session={s} />
        ))}
      </div>

      {sessions.length > limit && (
        <p className="section-note">
          +{sessions.length - limit} more {pillar.toLowerCase()} sessions matched your profile.
        </p>
      )}
    </section>
  );
}

// ── Next best move ──────────────────────────────────────────────────────────────

function NextBestMove({ session }: { session: ScoredSession }) {
  const type  = sessionTypeLabel(session);
  const track = session.tracks?.primary_track ?? "";
  const meta  = sessionMeta(session);
  const top   = session.compass_reasons[0] ?? "Top Compass match";

  return (
    <div className="next-best-move">
      <div>
        <span className="next-best-move-label">Your next best move</span>
        <h3>{session.title}</h3>
        <p>
          {type}{track ? ` · ${track}` : ""}
          {meta ? ` · ${meta}` : ""}
        </p>
        <p style={{ marginTop: "10px", color: "var(--accent)", fontSize: "0.9rem" }}>
          {top}
        </p>
      </div>
      <ScoreBadge score={session.compass_score} size="lg" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page component
// ─────────────────────────────────────────────────────────────────────────────

export default function ExperiencePage() {
  // ── State ──────────────────────────────────────────────────────────────────
  const [participant,      setParticipant]      = useState<RawDoc | null>(null);
  const [learningList,     setLearningList]     = useState<ScoredSession[]>([]);
  const [communityList,    setCommunityList]    = useState<ScoredSession[]>([]);
  const [funList,          setFunList]          = useState<ScoredSession[]>([]);
  const [nextBestMove,     setNextBestMove]     = useState<ScoredSession | null>(null);
  const [allSessions,      setAllSessions]      = useState<ScoredSession[]>([]);
  const [champions,        setChampions]        = useState<ScoredChampion[]>([]);
  const [counts,           setCounts]           = useState<EventCounts>({ participants: 0, sessions: 0, champions: 0 });
  const [status,           setStatus]           = useState<"loading" | "ready" | "error">("loading");
  const [errorMsg,         setErrorMsg]         = useState("");

  // ── Load ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      try {
        // All four reads in parallel — matches proven working prototype
        const [pSnap, sessSnap, partSnap, champSnap] = await Promise.all([
          getDoc(doc(db, `${BASE}/participants/${PARTICIPANT_ID}`)),
          getDocs(collection(db, `${BASE}/sessions`)),
          getDocs(collection(db, `${BASE}/participants`)),
          getDocs(collection(db, `${BASE}/champions`)),
        ]);

        if (!pSnap.exists()) {
          setErrorMsg(`Participant "${PARTICIPANT_ID}" not found at ${BASE}/participants/${PARTICIPANT_ID}`);
          setStatus("error");
          return;
        }

        const pData        = pSnap.data() as RawDoc;
        const rawSessions  = sessSnap.docs.map((d) => ({ id: d.id, ...d.data() } as RawDoc));
        const rawChampions = champSnap.docs.map((d) => ({ id: d.id, ...d.data() } as RawDoc));

        // Score and sort all sessions
        const scored = rawSessions
          .map((s) => scoreSession(pData, s))
          .sort((a, b) => b.compass_score - a.compass_score);

        // Bucket into pillars
        const learning:  ScoredSession[] = [];
        const community: ScoredSession[] = [];
        const fun:       ScoredSession[] = [];

        for (const s of scored) {
          const p = getPillar(s);
          if (p === "Learning")  learning.push(s);
          else if (p === "Fun")  fun.push(s);
          else                   community.push(s);
        }

        // Score and sort champions
        const scoredChampions = rawChampions
          .map((c) => scoreChampion(pData, c))
          .sort((a, b) => b.compass_score - a.compass_score)
          .slice(0, 5);

        // Next best move = overall highest-scoring session
        const best = scored[0] ?? null;

        setParticipant(pData);
        setAllSessions(scored);
        setLearningList(learning);
        setCommunityList(community);
        setFunList(fun);
        setNextBestMove(best);
        setChampions(scoredChampions);
        setCounts({
          participants: partSnap.size,
          sessions:     sessSnap.size,
          champions:    champSnap.size,
        });
        setStatus("ready");

      } catch (err: unknown) {
        const e = err as { code?: string; message?: string };
        console.error("[ExperiencePage] Firestore error:", err);
        setErrorMsg(`${e.code ? `(${e.code}) ` : ""}${e.message ?? String(err)}`);
        setStatus("error");
      }
    }

    load();
  }, []);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (status === "loading") {
    return (
      <section className="section no-top-border">
        <div className="section-kicker">Firestore</div>
        <h2
          style={{
            fontSize: "clamp(2rem, 4vw, 3.5rem)",
            fontWeight: 520,
            letterSpacing: "-0.04em",
            margin: "12px 0 16px",
            color: "var(--text)",
          }}
        >
          Building your Compass…
        </h2>
        <p style={{ color: "var(--muted)", fontSize: "0.95rem" }}>
          Reading participant profile, sessions, and champions from{" "}
          <span
            style={{
              fontFamily: "var(--font-mono, ui-monospace)",
              color: "var(--accent)",
            }}
          >
            {BASE}
          </span>
        </p>
      </section>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (status === "error" || !participant) {
    return (
      <section className="section no-top-border">
        <div className="section-kicker" style={{ color: "var(--accent)" }}>
          Compass error
        </div>
        <h2
          style={{
            fontSize: "clamp(2rem, 4vw, 3.5rem)",
            fontWeight: 520,
            letterSpacing: "-0.04em",
            margin: "12px 0 16px",
          }}
        >
          Could not load experience
        </h2>
        <p style={{ color: "var(--muted)", maxWidth: "640px", lineHeight: 1.6 }}>
          {errorMsg}
        </p>
        <p style={{ color: "var(--muted)", marginTop: "10px", fontSize: "0.88rem" }}>
          Verify Firebase environment variables and Firestore security rules.
        </p>
      </section>
    );
  }

  // ── Participant field helpers ───────────────────────────────────────────────
  const displayName = String(participant.display_name ?? "Attendee");
  const jobTitle    = String(participant.job_title    ?? "");
  const company     = String(participant.company      ?? "");
  const sig         = (participant.event_signal_profile as RawDoc) ?? {};
  const tracks      = ((sig.tech_tracks as string[]) ?? []).slice(0, 5);
  const goals       = ((sig.goals       as string[]) ?? []).slice(0, 3);
  const topScore    = allSessions[0]?.compass_score ?? 0;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── ParticipantHero ───────────────────────────────────────────────── */}
      <section className="section no-top-border">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) auto",
            gap: "28px",
            alignItems: "start",
          }}
        >
          <div>
            <div className="section-kicker">My Compass</div>
            <h1
              style={{
                fontSize: "clamp(2.6rem, 5vw, 4.6rem)",
                lineHeight: 0.97,
                letterSpacing: "-0.05em",
                fontWeight: 520,
                margin: "0 0 12px",
                color: "var(--text)",
              }}
            >
              {displayName}
            </h1>
            {(jobTitle || company) && (
              <p
                style={{
                  color: "var(--muted)",
                  margin: "0 0 20px",
                  fontSize: "1.05rem",
                }}
              >
                {[jobTitle, company].filter(Boolean).join(" · ")}
              </p>
            )}
            {(tracks.length > 0 || goals.length > 0) && (
              <div className="chip-row">
                {tracks.map((t) => (
                  <span key={t} className="chip">{t}</span>
                ))}
                {goals.map((g) => (
                  <span key={g} className="chip">{g}</span>
                ))}
              </div>
            )}
          </div>

          {topScore > 0 && <ScoreBadge score={topScore} size="lg" />}
        </div>
      </section>

      {/* ── EventUniverseStats ────────────────────────────────────────────── */}
      <section className="section">
        <div className="section-head">
          <div>
            <div className="section-kicker">Event universe</div>
            <h2>What Compass is working with.</h2>
          </div>
          <p>
            Live counts from Firestore. Recommendations are computed
            dynamically — no stored recommendation collection.
          </p>
        </div>
        <div className="pulse-scoreboard">
          <article>
            <span>Sessions indexed</span>
            <b>{counts.sessions}</b>
          </article>
          <article>
            <span>Champions available</span>
            <b>{counts.champions}</b>
          </article>
          <article>
            <span>Attendee signals</span>
            <b>{counts.participants}</b>
          </article>
          <article>
            <span>Top match score</span>
            <b>{topScore}</b>
          </article>
        </div>
      </section>

      {/* ── NextBestMove ──────────────────────────────────────────────────── */}
      {nextBestMove && (
        <section className="section">
          <div className="section-head narrow">
            <div>
              <div className="section-kicker">Right now</div>
              <h2>Your next best move.</h2>
            </div>
          </div>
          <NextBestMove session={nextBestMove} />
        </section>
      )}

      {/* ── Learning pillar ───────────────────────────────────────────────── */}
      <PillarSection pillar="Learning" sessions={learningList} limit={3} />

      {/* ── Community: Champions (People You Should Meet) ─────────────────── */}
      {champions.length > 0 && (
        <section className="section">
          <div className="section-head">
            <div>
              <div className="section-kicker">Community</div>
              <h2>People you should meet.</h2>
            </div>
            <p>
              Champions matched to your profile by keyword overlap across
              domains, products, and intelligence tags.
            </p>
          </div>
          <div className="champion-grid three-champions">
            {champions.map((c) => (
              <ChampionCard key={c.id} champion={c} />
            ))}
          </div>
        </section>
      )}

      {/* ── Community: sessions ───────────────────────────────────────────── */}
      <PillarSection pillar="Community" sessions={communityList} limit={3} />

      {/* ── Fun pillar ────────────────────────────────────────────────────── */}
      <PillarSection pillar="Fun" sessions={funList} limit={3} />

      {/* ── Footer CTA ────────────────────────────────────────────────────── */}
      <section className="final-band">
        <div>
          <h2>Your Compass is live.</h2>
          <p>
            Sessions, Champions, and moments are scored in real time from
            Firestore. No cached lists. Update your intent to refine the
            experience.
          </p>
        </div>
        <a href="/enroll" className="btn-primary">
          Update My Compass
        </a>
      </section>
    </>
  );
}
