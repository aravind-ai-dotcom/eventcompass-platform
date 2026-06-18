// =============================================================================
// Recommendation balancing — People · Learning · Community · Fun
// =============================================================================

import { isCertificationActivityType } from "@/lib/certificationProfile";
import type { LiveOpportunity } from "@/types/liveOpportunity";
import type { NextBestMove, ScoredChampion } from "@/types";

export interface BalanceScoredSession {
  id: string;
  title: string;
  session_type?: string;
  activity_type?: string;
  compass_score?: number;
  compass_reasons?: string[];
  tracks?: { primary_track?: string };
  schedule?: { day?: string; start_time?: string; room?: string };
  certification_id?: string;
  certification_code?: string;
}

export type ExperiencePillar = "people" | "learning" | "community" | "fun";

export type SessionPillar = "learning" | "community" | "fun";

export type SessionFormat =
  | "breakout"
  | "lab"
  | "meet_the_expert"
  | "peer_roundtable"
  | "networking"
  | "certification"
  | "community_event";

export const COMPASS_BALANCE_EXPLANATION =
  "Compass balances learning, people, community, and fun to help you get the most from TechXchange.";

const FUN_TYPES = new Set([
  "general session", "keynote", "reception", "social",
  "networking", "meetup", "awards", "celebration", "party", "fun",
]);

const LEARNING_TYPES = new Set([
  "instructor-led lab", "lab", "workshop",
  "technical breakout", "breakout session", "breakout", "hands-on lab", "demo",
]);

function sessionTypeLabel(s: BalanceScoredSession): string {
  return String(s.session_type ?? s.activity_type ?? "Session").trim();
}

export function classifySessionPillar(s: BalanceScoredSession): SessionPillar | null {
  if (isCertificationActivityType(s)) return "learning";
  const t = sessionTypeLabel(s).toLowerCase();
  if (FUN_TYPES.has(t)) return "fun";
  if (LEARNING_TYPES.has(t)) return "learning";
  return "community";
}

export function classifySessionFormat(s: BalanceScoredSession): SessionFormat {
  if (isCertificationActivityType(s)) return "certification";
  const t = sessionTypeLabel(s).toLowerCase();
  if (/lab|hands.on|workshop/.test(t)) return "lab";
  if (/meet the expert|expert session|office hours|ask the expert/.test(t)) return "meet_the_expert";
  if (/roundtable|peer discussion|peer roundtable/.test(t)) return "peer_roundtable";
  if (/network|reception|social|meetup|party|keynote/.test(t)) return "networking";
  if (/community|champion|user group/.test(t)) return "community_event";
  return "breakout";
}

export function pillarFromMoveType(type: NextBestMove["type"]): ExperiencePillar {
  switch (type) {
    case "champion":
      return "people";
    case "community":
      return "community";
    case "break":
    case "explore":
      return "fun";
    default:
      return "learning";
  }
}

export interface BalancedSessionOptions {
  limit?: number;
  maxCertSessions?: number;
  maxPerFormat?: number;
}

/** Pick a diverse session mix — varied pillars and formats, not only top scores. */
export function selectBalancedSessions(
  sessions: BalanceScoredSession[],
  options: BalancedSessionOptions = {},
): BalanceScoredSession[] {
  const { limit = 4, maxCertSessions = 1, maxPerFormat = 1 } = options;
  const pool = [...sessions]
    .filter(s => (s.compass_score ?? 0) > 0)
    .sort((a, b) => (b.compass_score ?? 0) - (a.compass_score ?? 0));

  const picked: BalanceScoredSession[] = [];
  const formatCounts = new Map<SessionFormat, number>();
  let certCount = 0;
  const pillarOrder: SessionPillar[] = ["learning", "community", "fun"];

  const tryPick = (s: BalanceScoredSession): boolean => {
    if (picked.some(p => p.id === s.id)) return false;
    const fmt = classifySessionFormat(s);
    if (fmt === "certification" && certCount >= maxCertSessions) return false;
    if ((formatCounts.get(fmt) ?? 0) >= maxPerFormat) return false;
    picked.push(s);
    formatCounts.set(fmt, (formatCounts.get(fmt) ?? 0) + 1);
    if (fmt === "certification") certCount += 1;
    return true;
  };

  for (let round = 0; picked.length < limit && round < 4; round += 1) {
    for (const pillar of pillarOrder) {
      if (picked.length >= limit) break;
      const candidate = pool.find(
        s => classifySessionPillar(s) === pillar && !picked.some(p => p.id === s.id),
      );
      if (candidate) tryPick(candidate);
    }
  }

  for (const s of pool) {
    if (picked.length >= limit) break;
    tryPick(s);
  }

  return picked;
}

export interface BalancedRecommendationInput {
  learningSessions: BalanceScoredSession[];
  communitySessions: BalanceScoredSession[];
  funSessions: BalanceScoredSession[];
  champions: ScoredChampion[];
  liveHuddles?: LiveOpportunity[];
  hiddenSessionIds?: string[];
  hiddenPeopleIds?: string[];
  rotationSeed?: number;
  hasCertIntent?: boolean;
  sessionMeta?: (session: BalanceScoredSession) => string;
  sessionType?: (session: BalanceScoredSession) => string;
  sessionReason?: (session: BalanceScoredSession) => string;
}

function topScored<T extends { compass_score?: number }>(items: T[]): T | null {
  return [...items].sort((a, b) => (b.compass_score ?? 0) - (a.compass_score ?? 0))[0] ?? null;
}

function buildSessionMove(
  session: BalanceScoredSession,
  input: BalancedRecommendationInput,
): NextBestMove {
  const typeLabel = input.sessionType?.(session) ?? sessionTypeLabel(session);
  const meta = input.sessionMeta?.(session) ?? "";
  return {
    type: "session",
    headline: session.title,
    subline: meta ? `${typeLabel} · ${meta}` : typeLabel,
    reason: input.sessionReason?.(session) ?? session.compass_reasons?.[0] ?? "Matched to your goals and tracks.",
    score: session.compass_score,
    entityId: session.id,
  };
}

function buildChampionMove(champion: ScoredChampion): NextBestMove {
  const reasons = (champion as ScoredChampion & { compass_reasons?: string[] }).compass_reasons;
  return {
    type: "champion",
    headline: `Meet ${champion.display_name}`,
    subline: [champion.title, champion.organization].filter(Boolean).join(" · ") || "IBM Champion",
    reason: reasons?.[0] ?? "Matched to your profile and connection goals.",
    score: champion.compass_score,
    entityId: champion.id,
  };
}

function buildHuddleMove(huddle: LiveOpportunity): NextBestMove {
  return {
    type: "community",
    headline: huddle.title,
    subline: [huddle.status, huddle.location].filter(Boolean).join(" · ") || "Live conversation",
    reason: "A peer conversation forming that aligns with your interests.",
    entityId: huddle.id,
  };
}

function buildFunMove(session: BalanceScoredSession, input: BalancedRecommendationInput): NextBestMove {
  return {
    ...buildSessionMove(session, input),
    reason: "A social moment worth adding alongside your learning plan.",
  };
}

function moveForPillar(
  pillar: ExperiencePillar,
  input: BalancedRecommendationInput,
): NextBestMove | null {
  const hiddenSessions = new Set(input.hiddenSessionIds ?? []);
  const hiddenPeople = new Set(input.hiddenPeopleIds ?? []);
  const filterSessions = (list: BalanceScoredSession[]) =>
    list.filter(s => (s.compass_score ?? 0) > 0 && !hiddenSessions.has(s.id));

  switch (pillar) {
    case "learning": {
      const pool = filterSessions(input.learningSessions);
      const diverse = selectBalancedSessions(pool, {
        limit: 1,
        maxCertSessions: input.hasCertIntent ? 1 : 0,
      });
      const session = diverse[0] ?? topScored(pool);
      return session ? buildSessionMove(session, input) : null;
    }
    case "people": {
      const champion = input.champions.find(
        c => (c.compass_score ?? 0) > 0 && !hiddenPeople.has(c.id),
      );
      return champion ? buildChampionMove(champion) : null;
    }
    case "community": {
      const session = topScored(filterSessions(input.communitySessions));
      if (session) {
        const move = buildSessionMove(session, input);
        return { ...move, type: "community" };
      }
      const huddle = input.liveHuddles?.[0];
      return huddle ? buildHuddleMove(huddle) : null;
    }
    case "fun": {
      const session = topScored(filterSessions(input.funSessions));
      return session ? buildFunMove(session, input) : null;
    }
    default:
      return null;
  }
}

export function pickBalancedNextBestMove(
  input: BalancedRecommendationInput,
): NextBestMove | null {
  const pillars: ExperiencePillar[] = ["learning", "people", "community", "fun"];
  const start = (input.rotationSeed ?? new Date().getDay()) % pillars.length;
  const order = [...pillars.slice(start), ...pillars.slice(0, start)];

  for (const pillar of order) {
    const move = moveForPillar(pillar, input);
    if (move) return move;
  }
  return null;
}

export function buildBalancedMoveSet(
  input: BalancedRecommendationInput,
): NextBestMove[] {
  const pillars: ExperiencePillar[] = ["learning", "people", "community", "fun"];
  const moves: NextBestMove[] = [];
  for (const pillar of pillars) {
    const move = moveForPillar(pillar, input);
    if (move) moves.push(move);
  }
  return moves;
}

export interface DiverseVoiceSuggestion {
  pillar: ExperiencePillar;
  spoken: string;
  display: string;
}

export function buildDiverseVoiceSuggestions(
  moves: NextBestMove[],
): DiverseVoiceSuggestion[] {
  return moves.map(move => {
    const pillar = pillarFromMoveType(move.type);
    const spoken =
      move.type === "champion"
        ? `${move.headline} — ${move.reason}`
        : `${move.headline}. ${move.reason}`;
    return {
      pillar,
      spoken,
      display: `${pillar} · ${move.headline}`,
    };
  });
}

export function pickBalancedSessionRecommendation(
  sessions: BalanceScoredSession[],
  recentIds: string[] = [],
  recentFormats: SessionFormat[] = [],
): BalanceScoredSession | null {
  const pool = sessions.filter(s => !recentIds.includes(s.id) && (s.compass_score ?? 0) > 0);
  if (pool.length === 0) return null;

  const candidates = selectBalancedSessions(pool, { limit: 6, maxCertSessions: 1 });
  const freshFormat = candidates.find(
    s => !recentFormats.includes(classifySessionFormat(s)),
  );
  return freshFormat ?? candidates[0] ?? topScored(pool);
}

export function formatBalancedVoiceAlternates(moves: NextBestMove[], limit = 3): string {
  const suggestions = buildDiverseVoiceSuggestions(moves).slice(0, limit);
  if (suggestions.length === 0) {
    return "Open My Experience for sessions, people, live huddles, and evening experiences.";
  }
  if (suggestions.length === 1) return suggestions[0].spoken;
  const [first, ...rest] = suggestions;
  return `${first.spoken} Also consider: ${rest.map(s => s.spoken).join(" ")}`;
}

export function formatWhyRecommendedWithBalance(
  primaryReason: string,
  moves: NextBestMove[],
): string {
  const others = moves
    .slice(1, 3)
    .map(m => m.headline)
    .filter(Boolean);
  if (others.length === 0) {
    return `${primaryReason} Compass balances learning, people, community, and fun across your plan.`;
  }
  return `${primaryReason} Compass also surfaces ${others.join(" and ")} so your week stays balanced.`;
}
