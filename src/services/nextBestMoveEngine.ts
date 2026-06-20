// =============================================================================
// Next Best Move — primary decision engine (one recommendation, one action)
// =============================================================================

import { isCertificationActivityType } from "@/lib/certificationProfile";
import {
  type BalanceScoredSession,
  type BalancedRecommendationInput,
} from "@/lib/recommendationBalancing";
import type { NextBestMove, ScoredChampion } from "@/types";
import type { LiveOpportunity } from "@/types/liveOpportunity";

export interface NextBestMoveEngineInput {
  user: { uid?: string } | null;
  enrolled: boolean;
  participant: Record<string, unknown> | null;
  balancedInput: BalancedRecommendationInput;
  savedSessionIds?: string[];
  allSessions?: BalanceScoredSession[];
  certificationGoalIds?: string[];
  hasCertIntent?: boolean;
  savedConnectionCount?: number;
  now?: Date;
}

type EventPhase = "before" | "during" | "after";

const EVENT_START = new Date("2026-10-28T08:00:00-05:00");
const EVENT_END = new Date("2026-11-01T00:00:00-05:00");
const STRONG_SESSION_SCORE = 62;
const TIME_WINDOW_HOURS = 4;

const FALLBACK_SLOTS = [
  { day: 28, h: 10, m: 0 },
  { day: 28, h: 14, m: 30 },
  { day: 29, h: 9, m: 0 },
  { day: 29, h: 15, m: 0 },
  { day: 30, h: 11, m: 0 },
  { day: 30, h: 16, m: 0 },
  { day: 31, h: 10, m: 0 },
];

function resolve(raw: Record<string, unknown>, ...paths: string[]): string {
  for (const path of paths) {
    const parts = path.split(".");
    let cur: unknown = raw;
    for (const p of parts) {
      if (cur == null || typeof cur !== "object") {
        cur = undefined;
        break;
      }
      cur = (cur as Record<string, unknown>)[p];
    }
    if (cur != null && String(cur).trim()) return String(cur).trim();
  }
  return "";
}

function fallbackSessionTime(index: number): { start: Date; end: Date } {
  const slot = FALLBACK_SLOTS[index % FALLBACK_SLOTS.length];
  const start = new Date(Date.UTC(2026, 9, slot.day, slot.h, slot.m, 0));
  const end = new Date(start.getTime() + 45 * 60 * 1000);
  return { start, end };
}

export function parseSessionWindow(
  session: BalanceScoredSession,
  index = 0,
): { start: Date; end: Date } | null {
  const raw = session as unknown as Record<string, unknown>;
  const date =
    resolve(raw, "date", "schedule.date") ||
    resolve(raw, "schedule.day") ||
    "";
  const startTime = resolve(raw, "start_time", "schedule.start_time");
  const endTime = resolve(raw, "end_time", "schedule.end_time");

  if (date && startTime) {
    const start = new Date(`${date} ${startTime}`);
    if (!Number.isNaN(start.getTime())) {
      const end =
        endTime && !Number.isNaN(new Date(`${date} ${endTime}`).getTime())
          ? new Date(`${date} ${endTime}`)
          : new Date(start.getTime() + 45 * 60 * 1000);
      return { start, end };
    }
  }

  const schedule = session.schedule;
  if (schedule?.day && schedule.start_time) {
    const start = new Date(`${schedule.day} ${schedule.start_time}`);
    if (!Number.isNaN(start.getTime())) {
      const end = new Date(start.getTime() + 45 * 60 * 1000);
      return { start, end };
    }
  }

  return fallbackSessionTime(index);
}

function getEventPhase(now: Date): EventPhase {
  if (now < EVENT_START) return "before";
  if (now >= EVENT_END) return "after";
  return "during";
}

function withAction(
  move: NextBestMove,
  ctaLabel: string,
  ctaHref: string,
  whyItMatters: string,
  priority: NextBestMove["priority"],
): NextBestMove {
  return {
    ...move,
    ctaLabel,
    ctaHref,
    whyItMatters,
    reason: whyItMatters,
    priority,
  };
}

function gateMove(
  type: NextBestMove["type"],
  headline: string,
  subline: string,
  whyItMatters: string,
  ctaLabel: string,
  ctaHref: string,
  priority: NextBestMove["priority"],
): NextBestMove {
  return {
    type,
    headline,
    subline,
    reason: whyItMatters,
    whyItMatters,
    ctaLabel,
    ctaHref,
    priority,
  };
}

function sessionTypeLabel(s: BalanceScoredSession): string {
  return String(s.session_type ?? s.activity_type ?? "Session").trim();
}

function buildSessionMove(
  session: BalanceScoredSession,
  input: BalancedRecommendationInput,
  whyItMatters: string,
): NextBestMove {
  const typeLabel = input.sessionType?.(session) ?? sessionTypeLabel(session);
  const meta = input.sessionMeta?.(session) ?? "";
  return {
    type: "session",
    headline: session.title,
    subline: meta ? `${typeLabel} · ${meta}` : typeLabel,
    reason: whyItMatters,
    whyItMatters,
    score: session.compass_score,
    entityId: session.id,
    ctaLabel: "View Session",
    ctaHref: `/txc/sessions#${session.id}`,
    priority: 4,
  };
}

function buildChampionMove(champion: ScoredChampion, whyItMatters: string): NextBestMove {
  const reasons = (champion as ScoredChampion & { compass_reasons?: string[] }).compass_reasons;
  return {
    type: "champion",
    headline: `Meet ${champion.display_name}`,
    subline: [champion.title, champion.organization].filter(Boolean).join(" · ") || "IBM Champion",
    reason: whyItMatters,
    whyItMatters,
    score: champion.compass_score,
    entityId: champion.id,
    ctaLabel: "View Profile",
    ctaHref: `/txc/experience#people`,
    priority: 4,
  };
}

function buildHuddleMove(huddle: LiveOpportunity, whyItMatters: string): NextBestMove {
  return {
    type: "community",
    headline: huddle.title,
    subline: [huddle.status, huddle.location].filter(Boolean).join(" · ") || "Live conversation",
    reason: whyItMatters,
    whyItMatters,
    entityId: huddle.id,
    ctaLabel: "Join Huddle",
    ctaHref: "/txc/experience#community",
    priority: 4,
  };
}

function buildFunMove(
  session: BalanceScoredSession,
  input: BalancedRecommendationInput,
  whyItMatters: string,
): NextBestMove {
  const move = buildSessionMove(session, input, whyItMatters);
  return { ...move, type: "break", priority: 5 };
}

function deriveWhyItMatters(
  session: BalanceScoredSession,
  input: BalancedRecommendationInput,
  extras: string[] = [],
): string {
  const base =
    input.sessionReason?.(session) ??
    session.compass_reasons?.[0] ??
    "Strong match to your interests.";
  const bits = [base, ...extras].filter(Boolean);
  return bits[0];
}

function sessionsOverlap(
  a: { start: Date; end: Date },
  b: { start: Date; end: Date },
): boolean {
  return a.start < b.end && b.start < a.end;
}

function buildBusyWindows(
  savedIds: Set<string>,
  allSessions: BalanceScoredSession[],
  now: Date,
): { start: Date; end: Date }[] {
  const windows: { start: Date; end: Date }[] = [];
  allSessions.forEach((s, i) => {
    if (!savedIds.has(s.id)) return;
    const w = parseSessionWindow(s, i);
    if (!w) return;
    if (w.end >= now) windows.push(w);
  });
  return windows;
}

function sessionFitsSchedule(
  session: BalanceScoredSession,
  index: number,
  now: Date,
  busy: { start: Date; end: Date }[],
  phase: EventPhase,
): boolean {
  const window = parseSessionWindow(session, index);
  if (!window) return phase !== "during";

  if (window.end <= now) return false;

  if (phase === "during") {
    const horizon = new Date(now.getTime() + TIME_WINDOW_HOURS * 60 * 60 * 1000);
    const inWindow = window.start <= horizon && window.end > now;
    if (!inWindow) return false;
  }

  return !busy.some(b => sessionsOverlap(window, b));
}

function topScored<T extends { compass_score?: number }>(items: T[]): T | null {
  return [...items].sort((a, b) => (b.compass_score ?? 0) - (a.compass_score ?? 0))[0] ?? null;
}

function filterPool(
  sessions: BalanceScoredSession[],
  hidden: Set<string>,
  savedIds: Set<string>,
  allSessions: BalanceScoredSession[],
  now: Date,
  phase: EventPhase,
): BalanceScoredSession[] {
  const busy = buildBusyWindows(savedIds, allSessions, now);
  return sessions
    .filter(s => (s.compass_score ?? 0) > 0 && !hidden.has(s.id))
    .filter((s, i) => sessionFitsSchedule(s, i, now, busy, phase))
    .sort((a, b) => (b.compass_score ?? 0) - (a.compass_score ?? 0));
}

function isDenseSchedule(savedIds: Set<string>, allSessions: BalanceScoredSession[], now: Date): boolean {
  const busy = buildBusyWindows(savedIds, allSessions, now);
  const horizon = new Date(now.getTime() + 3 * 60 * 60 * 1000);
  const overlapping = busy.filter(w => w.start <= horizon && w.end > now);
  return overlapping.length >= 3;
}

function pickStrongSession(
  input: BalancedRecommendationInput,
  allSessions: BalanceScoredSession[],
  now: Date,
  phase: EventPhase,
  savedIds: Set<string>,
  preferCert = false,
): NextBestMove | null {
  const hidden = new Set(input.hiddenSessionIds ?? []);
  const learning = filterPool(input.learningSessions, hidden, savedIds, allSessions, now, phase);
  const community = filterPool(input.communitySessions, hidden, savedIds, allSessions, now, phase);
  const fun = filterPool(input.funSessions, hidden, savedIds, allSessions, now, phase);

  let pool = [...learning, ...community];
  if (preferCert && input.hasCertIntent) {
    const certFirst = learning.filter(isCertificationActivityType);
    if (certFirst.length > 0) pool = certFirst;
  }

  const session = topScored(pool.filter(s => !savedIds.has(s.id))) ?? topScored(pool);
  if (!session || (session.compass_score ?? 0) < STRONG_SESSION_SCORE) {
    if (phase === "during" && isDenseSchedule(savedIds, allSessions, now)) {
      const funSession = topScored(fun.filter(s => !savedIds.has(s.id))) ?? topScored(fun);
      if (funSession) {
        return buildFunMove(
          funSession,
          input,
          "Your schedule is packed — a social moment helps you recharge and connect.",
        );
      }
    }
    return null;
  }

  const extras: string[] = [];
  if (isCertificationActivityType(session) && input.hasCertIntent) {
    extras.push("Supports your certification goal.");
  }
  if (phase === "during") extras.push("Fits your schedule in the next few hours.");

  const why = deriveWhyItMatters(session, input, extras);
  return buildSessionMove(session, input, why);
}

function pickChampionMove(input: BalancedRecommendationInput): NextBestMove | null {
  const hidden = new Set(input.hiddenPeopleIds ?? []);
  const champion = input.champions.find(c => (c.compass_score ?? 0) > 0 && !hidden.has(c.id));
  if (!champion) return null;
  const why =
    (champion as ScoredChampion & { compass_reasons?: string[] }).compass_reasons?.[0] ??
    "Strong match to your interests — a valuable connection opportunity.";
  return buildChampionMove(champion, why);
}

function pickCommunityMove(input: BalancedRecommendationInput): NextBestMove | null {
  const hidden = new Set(input.hiddenSessionIds ?? []);

  if (input.hasCertIntent) {
    const certHuddle = input.liveHuddles?.find(
      h =>
        h.source === "certification" ||
        /study group|cert prep|certification/i.test(`${h.title} ${h.category}`),
    );
    if (certHuddle) {
      return buildHuddleMove(certHuddle, "Community opportunity aligned with your certification path.");
    }
  }

  const huddle = input.liveHuddles?.[0];
  if (huddle) {
    return buildHuddleMove(huddle, "A peer conversation forming that aligns with your interests.");
  }

  const communityPool = input.communitySessions.filter(
    s => (s.compass_score ?? 0) > 0 && !hidden.has(s.id),
  );
  const session = topScored(communityPool);
  if (session) {
    const why = deriveWhyItMatters(session, input, ["Community opportunity."]);
    const move = buildSessionMove(session, input, why);
    return { ...move, type: "community" };
  }

  return null;
}

function pickBeforeEventMove(
  input: BalancedRecommendationInput,
  allSessions: BalanceScoredSession[],
  savedIds: Set<string>,
  now: Date,
): NextBestMove | null {
  const hidden = new Set(input.hiddenSessionIds ?? []);
  const unsavedLearning = input.learningSessions.filter(
    s => (s.compass_score ?? 0) > 0 && !hidden.has(s.id) && !savedIds.has(s.id),
  );
  const topLearning = topScored(unsavedLearning);
  const topChampion = pickChampionMove(input);
  const topCommunity = pickCommunityMove(input);

  const candidates: { score: number; move: NextBestMove }[] = [];
  if (topLearning) {
    const why = deriveWhyItMatters(
      topLearning,
      input,
      input.hasCertIntent && isCertificationActivityType(topLearning)
        ? ["Supports your certification goal."]
        : ["Strong match to your interests."],
    );
    candidates.push({
      score: topLearning.compass_score ?? 0,
      move: buildSessionMove(topLearning, input, why),
    });
  }
  if (topChampion) {
    candidates.push({ score: topChampion.score ?? 0, move: topChampion });
  }
  if (topCommunity) {
    candidates.push({ score: topCommunity.score ?? 50, move: topCommunity });
  }

  candidates.sort((a, b) => b.score - a.score);
  return candidates[0]?.move ?? null;
}

function pickDuringEventMove(
  input: BalancedRecommendationInput,
  allSessions: BalanceScoredSession[],
  savedIds: Set<string>,
  now: Date,
): NextBestMove | null {
  const sessionMove = pickStrongSession(input, allSessions, now, "during", savedIds, input.hasCertIntent);
  if (sessionMove) return sessionMove;

  const champion = pickChampionMove(input);
  if (champion) {
    return withAction(
      champion,
      champion.ctaLabel ?? "View Profile",
      champion.ctaHref ?? "/txc/experience#people",
      champion.whyItMatters ?? champion.reason,
      5,
    );
  }

  const community = pickCommunityMove(input);
  if (community) return community;

  return pickBeforeEventMove(input, allSessions, savedIds, now);
}

function pickAfterEventMove(
  input: BalancedRecommendationInput,
  savedConnectionCount: number,
  certGoalIds: string[],
): NextBestMove | null {
  if (savedConnectionCount > 0) {
    return gateMove(
      "explore",
      "Follow Up With Your Connections",
      "Keep momentum from TechXchange",
      "Networking opportunity — follow up while conversations are still fresh.",
      "Review Connections",
      "/txc/experience#people",
      6,
    );
  }

  if (certGoalIds.length > 0 || input.hasCertIntent) {
    return gateMove(
      "explore",
      "Continue Certification Preparation",
      "Build on what you learned at TechXchange",
      "Supports your certification goal — keep learning while momentum is high.",
      "View Certification Journey",
      "/txc/experience#goals",
      6,
    );
  }

  const hidden = new Set(input.hiddenSessionIds ?? []);
  const session = topScored(
    input.learningSessions.filter(s => (s.compass_score ?? 0) > 0 && !hidden.has(s.id)),
  );
  if (session) {
    return buildSessionMove(
      session,
      input,
      "Continue learning with on-demand sessions matched to your profile.",
    );
  }

  return gateMove(
    "explore",
    "Review Your TechXchange Experience",
    "Reflect and plan your next steps",
    "Popular among peers — revisit highlights and sharpen your learning plan.",
    "Open My Compass",
    "/txc/experience",
    6,
  );
}

/** Single decision — one recommendation, one action, one reason. */
export function determineNextBestMove(input: NextBestMoveEngineInput): NextBestMove | null {
  const now = input.now ?? new Date();
  const savedIds = new Set(input.savedSessionIds ?? []);
  const allSessions = input.allSessions ?? [
    ...input.balancedInput.learningSessions,
    ...input.balancedInput.communitySessions,
    ...input.balancedInput.funSessions,
  ];
  const certGoalIds = input.certificationGoalIds ?? [];
  const hasCertIntent = input.hasCertIntent ?? false;
  const phase = getEventPhase(now);

  // Priority 1 — visitor (not registered / no Compass access yet)
  if (!input.user?.uid) {
    return gateMove(
      "register",
      "Start Your TechXchange Journey",
      "You’re exploring TechXchange.",
      "Registering gives you access to your personal Compass, where you can build your agenda, discover relevant sessions, connect with experts, and participate in the event experience.",
      "Register",
      "/txc/enroll",
      1,
    );
  }

  // Priority 2 — registered user, but Compass profile not created yet
  if (input.user?.uid && !input.participant) {
    return gateMove(
      "profile",
      "Create Your Compass",
      "Start personalizing your TechXchange experience",
      "Tell Compass about your interests, goals, and areas of focus so we can personalize your event experience.",
      "Build My Compass",
      "/txc/enroll?mode=edit",
      2,
    );
  }

  // Priority 3 — profile exists but incomplete
  if (!input.enrolled) {
    return gateMove(
      "profile",
      "Refine Your Compass",
      "Improve recommendation quality with better signals",
      "The more Compass knows about your interests and goals, the more relevant your recommendations become.",
      "Refine My Compass",
      "/txc/enroll?mode=edit",
      3,
    );
  }

  // Priority 4 — certification goal missing when cert interest exists
  if (hasCertIntent && certGoalIds.length === 0) {
    return gateMove(
      "certification_goal",
      "Select a Certification Goal",
      "Track your learning path in one place",
      "Supports your certification goal — choose a credential to guide sessions and resources.",
      "Choose Certification",
      "/txc/experience#goals",
      4,
    );
  }

  // Priority 5 — before event
  if (phase === "before") {
    const move =
      pickBeforeEventMove(input.balancedInput, allSessions, savedIds, now) ??
      pickChampionMove(input.balancedInput) ??
      pickCommunityMove(input.balancedInput);
    return move;
  }

  // Priority 6 — during event (time-aware)
  if (phase === "during") {
    return pickDuringEventMove(input.balancedInput, allSessions, savedIds, now);
  }

  // After event
  return pickAfterEventMove(
    input.balancedInput,
    input.savedConnectionCount ?? 0,
    certGoalIds,
  );
}
