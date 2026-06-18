// =============================================================================
// Recommendation balancing — People · Learning · Community · Fun
// =============================================================================

import { isCertificationActivityType } from "@/lib/certificationProfile";
import { getCachedPillarWeights } from "@/services/recommendationBalanceConfig";
import type { PillarWeights } from "@/types/recommendationBalance";
import type { LiveOpportunity } from "@/types/liveOpportunity";
import type { NextBestMove, ScoredChampion } from "@/types";

export interface BalanceScoredSession {
  id: string;
  title: string;
  session_type?: string;
  activity_type?: string;
  compass_score?: number;
  compass_reasons?: string[];
  tracks?: { primary_track?: string; topics?: string[] };
  schedule?: { day?: string; start_time?: string; room?: string };
  certification_id?: string;
  certification_code?: string;
}

export type ExperiencePillar = "people" | "learning" | "community" | "fun";

export type SessionPillar = "learning" | "community" | "fun";

export type SessionFormat =
  | "breakout"
  | "lab"
  | "workshop"
  | "meet_the_expert"
  | "peer_roundtable"
  | "networking"
  | "certification"
  | "community_event"
  | "meetup"
  | "general_session";

export const COMPASS_BALANCE_EXPLANATION =
  "Compass balances learning, people, community, and fun to help you get the most from TechXchange.";

export const DIVERSE_RECOMMENDATION_PATTERNS = [
  "what else should i do",
  "what else can i do",
  "anything else should i do",
  "anything different",
  "something different",
  "anything beyond sessions",
  "beyond sessions",
  "not just sessions",
  "more than sessions",
  "other than sessions",
  "besides sessions",
  "mix it up",
  "diverse recommendations",
  "other recommendations",
  "what else",
];

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

export function sessionPrimaryTrack(s: BalanceScoredSession): string {
  return String(s.tracks?.primary_track ?? "").trim().toLowerCase();
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
  if (/instructor.led lab|^lab|hands.on/.test(t)) return "lab";
  if (/workshop/.test(t)) return "workshop";
  if (/meet the expert|expert session|office hours|ask the expert/.test(t)) return "meet_the_expert";
  if (/roundtable|peer discussion|peer roundtable/.test(t)) return "peer_roundtable";
  if (/network|reception|social/.test(t)) return "networking";
  if (/meetup|user group/.test(t)) return "meetup";
  if (/community|champion|study group|huddle/.test(t)) return "community_event";
  if (/general session|keynote/.test(t)) return "general_session";
  if (/breakout|technology breakout/.test(t)) return "breakout";
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

export function isDiverseRecommendationQuery(norm: string): boolean {
  return DIVERSE_RECOMMENDATION_PATTERNS.some(p => norm.includes(p));
}

export interface BalancedSessionOptions {
  limit?: number;
  maxCertSessions?: number;
  maxPerFormat?: number;
  maxPerTrack?: number;
  maxPerPillar?: number;
}

/** Pick a diverse session mix — varied pillars, formats, and tracks. */
export function selectBalancedSessions(
  sessions: BalanceScoredSession[],
  options: BalancedSessionOptions = {},
): BalanceScoredSession[] {
  const {
    limit = 4,
    maxCertSessions = 1,
    maxPerFormat = 1,
    maxPerTrack = 1,
    maxPerPillar = 2,
  } = options;

  const pool = [...sessions]
    .filter(s => (s.compass_score ?? 0) > 0)
    .sort((a, b) => (b.compass_score ?? 0) - (a.compass_score ?? 0));

  const picked: BalanceScoredSession[] = [];
  const formatCounts = new Map<SessionFormat, number>();
  const trackCounts = new Map<string, number>();
  const pillarCounts = new Map<SessionPillar, number>();
  let certCount = 0;
  const pillarOrder: SessionPillar[] = ["learning", "community", "fun"];

  const tryPick = (s: BalanceScoredSession): boolean => {
    if (picked.some(p => p.id === s.id)) return false;
    const fmt = classifySessionFormat(s);
    const track = sessionPrimaryTrack(s);
    const pillar = classifySessionPillar(s);
    if (fmt === "certification" && certCount >= maxCertSessions) return false;
    if ((formatCounts.get(fmt) ?? 0) >= maxPerFormat) return false;
    if (track && (trackCounts.get(track) ?? 0) >= maxPerTrack) return false;
    if (pillar && (pillarCounts.get(pillar) ?? 0) >= maxPerPillar) return false;
    picked.push(s);
    formatCounts.set(fmt, (formatCounts.get(fmt) ?? 0) + 1);
    if (track) trackCounts.set(track, (trackCounts.get(track) ?? 0) + 1);
    if (pillar) pillarCounts.set(pillar, (pillarCounts.get(pillar) ?? 0) + 1);
    if (fmt === "certification") certCount += 1;
    return true;
  };

  for (let round = 0; picked.length < limit && round < 5; round += 1) {
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
  pillarWeights?: PillarWeights;
  sessionMeta?: (session: BalanceScoredSession) => string;
  sessionType?: (session: BalanceScoredSession) => string;
  sessionReason?: (session: BalanceScoredSession) => string;
}

function topScored<T extends { compass_score?: number }>(items: T[]): T | null {
  return [...items].sort((a, b) => (b.compass_score ?? 0) - (a.compass_score ?? 0))[0] ?? null;
}

function weightedPillarOrder(
  weights: PillarWeights,
  rotationSeed: number,
): ExperiencePillar[] {
  const pillars: ExperiencePillar[] = ["learning", "people", "community", "fun"];
  const weighted = pillars
    .map((pillar, i) => ({
      pillar,
      score: weights[pillar] * 100 - (rotationSeed + i) % 7,
    }))
    .sort((a, b) => b.score - a.score)
    .map(x => x.pillar);

  const start = rotationSeed % weighted.length;
  return [...weighted.slice(start), ...weighted.slice(0, start)];
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

function pickCommunityMove(input: BalancedRecommendationInput): NextBestMove | null {
  const hiddenSessions = new Set(input.hiddenSessionIds ?? []);
  const filterSessions = (list: BalanceScoredSession[]) =>
    list.filter(s => (s.compass_score ?? 0) > 0 && !hiddenSessions.has(s.id));

  if (input.hasCertIntent) {
    const certHuddle = input.liveHuddles?.find(
      h =>
        h.source === "certification" ||
        /study group|cert prep|certification/i.test(`${h.title} ${h.category}`),
    );
    if (certHuddle) return buildHuddleMove(certHuddle);
  }

  const communityPool = filterSessions(input.communitySessions);
  const diverse = selectBalancedSessions(communityPool, {
    limit: 1,
    maxCertSessions: 0,
    maxPerFormat: 1,
  });
  const session = diverse[0] ?? topScored(communityPool);
  if (session) {
    const move = buildSessionMove(session, input);
    return { ...move, type: "community" };
  }

  const huddle = input.liveHuddles?.[0];
  return huddle ? buildHuddleMove(huddle) : null;
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
        maxPerFormat: 1,
        maxPerTrack: 1,
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
    case "community":
      return pickCommunityMove(input);
    case "fun": {
      const pool = filterSessions(input.funSessions);
      const diverse = selectBalancedSessions(pool, {
        limit: 1,
        maxCertSessions: 0,
        maxPerFormat: 1,
      });
      const session = diverse[0] ?? topScored(pool);
      return session ? buildFunMove(session, input) : null;
    }
    default:
      return null;
  }
}

export function pickBalancedNextBestMove(
  input: BalancedRecommendationInput,
): NextBestMove | null {
  const weights = input.pillarWeights ?? getCachedPillarWeights();
  const order = weightedPillarOrder(weights, input.rotationSeed ?? new Date().getDay());

  for (const pillar of order) {
    const move = moveForPillar(pillar, input);
    if (move) return move;
  }
  return null;
}

export function buildBalancedMoveSet(
  input: BalancedRecommendationInput,
): NextBestMove[] {
  const weights = input.pillarWeights ?? getCachedPillarWeights();
  const order = weightedPillarOrder(weights, input.rotationSeed ?? new Date().getDay());
  const moves: NextBestMove[] = [];
  const usedEntityIds = new Set<string>();

  for (const pillar of order) {
    const move = moveForPillar(pillar, input);
    if (!move) continue;
    const key = `${move.type}-${move.entityId ?? move.headline}`;
    if (usedEntityIds.has(key)) continue;
    usedEntityIds.add(key);
    moves.push(move);
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

export function formatDiverseRecommendationVoice(moves: NextBestMove[]): {
  spoken: string;
  display: string;
} {
  const suggestions = buildDiverseVoiceSuggestions(moves);
  if (suggestions.length === 0) {
    return {
      spoken: "Open My Compass for a balanced mix of sessions, people, communities, and fun.",
      display: "My Compass · balanced recommendations",
    };
  }

  const intro =
    "Compass keeps your week curated across learning, people, community, and fun. Here are diverse picks:";
  const lines = suggestions.map(s => {
    const label = s.pillar.charAt(0).toUpperCase() + s.pillar.slice(1);
    return `${label}: ${s.spoken.split(".")[0]}.`;
  });
  return {
    spoken: `${intro} ${lines.join(" ")}`,
    display: suggestions.map(s => s.display).join(" · "),
  };
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

/** Session recommendations with format/track diversity for catalog bands. */
export function selectBalancedSessionBand(
  sessions: BalanceScoredSession[],
  limit = 6,
  hasCertIntent = false,
): BalanceScoredSession[] {
  return selectBalancedSessions(sessions, {
    limit,
    maxCertSessions: hasCertIntent ? 1 : 0,
    maxPerFormat: 1,
    maxPerTrack: 1,
    maxPerPillar: Math.ceil(limit / 2),
  });
}
