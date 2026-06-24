// =============================================================================
// EventCompass — Voice Intent Classifier
// src/services/voiceIntentClassifier.ts
//
// Pure TypeScript matching. Firestore knowledge loaded into cache before use.
// =============================================================================

import type { CertificationJourneyPlan } from "@/lib/certificationJourneyIntelligence";
import {
  formatCertificationJourneyVoice,
  matchCertificationJourneyQuestion,
} from "@/lib/certificationJourneyIntelligence";
import {
  buildSessionRecommendationReasons,
  formatSessionIntelligenceVoice,
} from "@/lib/sessionIntelligence";
import {
  humanizeScoringReason,
} from "@/lib/sessionRecommendationLine";
import type { NextBestMove, ScoredSession, ScoredChampion } from "@/types";
import type { LiveOpportunity } from "@/types/liveOpportunity";
import {
  COMPASS_CONVERSATION,
  EVENT_KNOWLEDGE,
  PERSONA_GUIDANCE,
  formatFunDiscoveryDisplay,
  formatFunDiscoverySpoken,
  pickFunActivities,
  resolveCompassConversationTopic,
  type EventKnowledgeKey,
  type PersonaKey,
  type CompassConversationKey,
} from "@/data/eventKnowledge";
import {
  getKnowledgeResponse,
  matchKnowledgeIntent,
  type VoiceLocale,
} from "@/services/knowledge/knowledgeResolver";
import { logKnowledgeAnalytics } from "@/services/knowledge/knowledgeMatchingService";
import { experienceToEventId } from "@/lib/compassEventPaths";
import { resolveVoiceKnowledgeSpokenDisplay } from "@/lib/voiceKnowledgeResponse";
import {
  formatBalancedVoiceAlternates,
  formatDiverseRecommendationVoice,
  formatWhyRecommendedWithBalance,
  isDiverseRecommendationQuery,
  pickBalancedSessionRecommendation,
} from "@/lib/recommendationBalancing";
import { recommendIbmCommunities } from "@/lib/ibmCommunityMatching";
import {
  findSpeakersForQuery,
  formatSpeakerIntelligenceVoice,
  type SpeakerParticipantContext,
} from "@/lib/speakerIntelligence";
import type { ScoredSpeaker, SpeakerProfile } from "@/types/speaker";
import {
  getDefaultFallbackResponse,
  getVoiceKnowledgeRecord,
  matchVoiceKnowledge,
  resolveCompassPersonalityText,
  resolveEventKnowledgeText,
  resolvePersonaGuidanceText,
} from "@/services/voice/voiceKnowledgeResolver";
import {
  formatEventHighlightsDisplay,
  formatEventHighlightsVoice,
  findEventMomentByQuery,
} from "@/lib/eventMoments";
import type { VoiceExperience } from "@/services/voice/voiceDictionaryTypes";
import { FORGE_EVENT, FORGE_LABELS, FORGE_PRODUCT } from "@/config/forgeBrand";
import {
  blocksEventRecommendations,
  classifyEventScope,
  needsScopeClarification,
  resolveConciergeResponse,
  resolveScopeClarifyResponse,
} from "@/lib/eventScopeClassifier";

export type { VoiceLocale };

export type CoreVoiceIntent =
  | "event_knowledge"
  | "compass_conversation"
  | "fun_discovery"
  | "persona_guidance"
  | "next_best_move"
  | "find_sessions"
  | "find_people"
  | "find_huddles"
  | "ibm_community"
  | "certification_help"
  | "explain_my_day"
  | "explain_my_week"
  | "diverse_recommendations"
  | "general_concierge"
  | "scope_clarify"
  | "attendance_status"
  | "fallback"
  | "dismiss"
  | "mark_attended"
  | "why_recommended"
  | "add_to_agenda";

/** Core intents or Firestore knowledge intent id (e.g. WHAT_IS_COMPASS) */
export type VoiceIntent = CoreVoiceIntent | string;

export interface ClassifiedIntent {
  intent:     VoiceIntent;
  transcript: string;
  confidence: "high" | "low";
  topic?:     string;
  voiceKnowledgeId?: string;
}

export type VoiceResponseAction =
  | "navigate_experience"
  | "show_champions"
  | "show_sessions"
  | "show_day"
  | "show_communities"
  | "dismiss"
  | "mark_attended";

export interface VoiceResponse {
  spoken:  string;
  display: string;
  action?: VoiceResponseAction;
}

export interface VoiceResponseContext {
  nextBestMove:        NextBestMove | null;
  balancedMoves?:      NextBestMove[];
  topSession:          ScoredSession | null;
  topChampion:         ScoredChampion | null;
  participantGoals?:   string[];
  participantTracks?:  string[];
  activeSession?:      ScoredSession | null;
  rankedSessions?:     ScoredSession[];
  liveHuddles?:        LiveOpportunity[];
  isEnrolled?:         boolean;
  experience?:         VoiceExperience;
  locale?:             VoiceLocale;
  certLabel?:          string | null;
  certificationJourney?: CertificationJourneyPlan | null;
  rankedSpeakers?:     ScoredSpeaker[];
  topSpeaker?:         ScoredSpeaker | null;
  speakerCatalog?:     SpeakerProfile[];
  speakerCtx?:         SpeakerParticipantContext;
}

// ─────────────────────────────────────────────────────────────────────────────
// Keyword buckets
// ─────────────────────────────────────────────────────────────────────────────

const KEYWORD_BUCKETS: Record<
  Exclude<
    CoreVoiceIntent,
    | "fallback"
    | "dismiss"
    | "mark_attended"
    | "why_recommended"
    | "add_to_agenda"
    | "event_knowledge"
    | "compass_conversation"
    | "fun_discovery"
    | "persona_guidance"
    | "general_concierge"
    | "scope_clarify"
    | "diverse_recommendations"
    | "attendance_status"
    | "ibm_community"
  >,
  string[]
> = {
  find_sessions: [
    "session", "breakout", "lab", "workshop", "what to attend", "attend",
    "technical breakout", "hands on",
  ],
  find_people: [
    "who should i meet", "who can i meet", "who to meet", "who should i talk",
    "champion", "expert", "experts in", "mentor", "people", "connect with", "introduce me",
    "speaker", "presenter", "who should i meet for", "any experts in", "who can help with certification",
    "governance", "openshift",
  ],
  find_huddles: [
    "conversation", "huddle", "meetup", "alumni", "coffee", "roundtable",
    "live opportunit", "forming nearby", "any alumni", "peer discussion",
    "study group", "study groups", "ai meetup", "agentic ai", "anyone talking about",
    "alumni gathering", "alumni gatherings",
  ],
  certification_help: [
    "certification", "certified", "cert exam", "exam prep", "exam", "pass my cert",
    "study group", "qiskit cert", "how do i prepare", "prepare for cert",
    "sessions for cert", "certification journey",
    "i want to get certified", "help me earn a certification",
    "what certification should i pursue", "show certification opportunities",
    "get certified", "earn a certification", "pursue a certification",
  ],
  explain_my_day: [
    "today", "right now", "what now", "this afternoon", "tonight", "happening now",
    "what is next", "what's next on", "where am i going",
  ],
  explain_my_week: [
    "week", "four day", "four-day", "my plan", "full schedule", "full plan",
    "my schedule", "day by day",
  ],
  next_best_move: [
    "what should i do", "what do i do", "next best move", "help me decide",
    "recommend something", "guide me", "what now", "prioritize",
  ],
};

const ACTION_PATTERNS: Array<[CoreVoiceIntent, string[]]> = [
  ["mark_attended", [
    "i went to that", "i attended", "i was there", "mark as attended", "mark attended",
  ]],
  ["dismiss", [
    "skip this", "not interested", "not for me", "dismiss", "pass on this", "something else",
  ]],
  ["why_recommended", [
    "why was this recommended", "why did compass recommend", "why this session",
    "explain this recommendation", "why did you pick", "why did you recommend this session",
    "why is this a strong match", "what makes this relevant", "why is this relevant to me",
  ]],
  ["add_to_agenda", [
    "add to my agenda", "add to agenda", "save this session", "schedule this",
  ]],
];

const CERT_CODE = /\bc\d{3,5}\b/i;

const EVENT_HIGHLIGHTS_PHRASES = [
  "what are the major events",
  "major events at techxchange",
  "major event",
  "what should i not miss",
  "what shouldnt i miss",
  "what shouldn't i miss",
  "dont miss",
  "don't miss",
  "event highlights",
  "defining moments",
  "unmissable",
  "must attend events",
  "must-see events",
  "celebrations happening",
  "any celebrations",
  "awards and celebration",
  "what is happening at techxchange",
  "headline events",
];

const EVENT_KNOWLEDGE_PATTERNS: Array<[EventKnowledgeKey, string[]]> = [
  ["event_dates", [
    "when is techxchange", "when is the event", "what dates is techxchange", "when does techxchange",
    "what day is techxchange", "dates for techxchange", "when does it start",
  ]],
  ["event_location", [
    "where is the event", "where is techxchange", "where is it located", "event location",
    "where is it", "what city is techxchange",
  ]],
  ["tracks", [
    "what tracks are there", "what tracks", "technical tracks", "event tracks", "learning tracks at the event",
  ]],
  ["community_day", [
    "what is community day", "tell me about community day", "community day about",
  ]],
  ["partner_day", [
    "what is partner day", "tell me about partner day", "partner day about",
  ]],
  ["data_technical_summit", [
    "what is data technical summit", "data technical summit", "what is the data summit", "data summit",
  ]],
  ["student_day", [
    "what is student day", "student dev day", "what is student dev day", "student day about",
  ]],
  ["sandbox_block_party", [
    "what is sandbox block party", "what is the sandbox block party", "sandbox block party",
    "sandbox party", "block party tonight", "what is the block party",
  ]],
  ["certifications_available", [
    "what certifications are available", "certifications available", "which certifications",
    "what certs are available", "cert exams available",
  ]],
  ["certification_program", [
    "certification opportunities", "certification at techxchange", "certification program",
    "how do certifications work", "certification help at the event",
  ]],
  ["champions_program", [
    "what are ibm champions", "who are ibm champions", "what is the champions program",
    "ibm champions program", "what is an ibm champion", "what is a champion at techxchange",
  ]],
  ["event_purpose", [
    "what is the event about", "purpose of the event", "why techxchange", "why attend techxchange",
  ]],
  ["compass_about", [
    "what is compass", "what is voice compass", "who is compass",
  ]],
  ["event_overview", [
    "what is this event", "what is techxchange", "tell me about techxchange", "what is the event",
    "describe techxchange", "about techxchange",
  ]],
];

const COMPASS_CONVERSATION_PATTERNS = [
  "what do you do",
  "what can you do",
  "how can you help me",
  "how can you help",
  "how do you help",
  "what is the biggest concern",
  "biggest concern you have",
  "what should i focus on",
  "am i trying to do too much",
  "trying to do too much",
  "too much on my plate",
  "how do recommendations work",
  "how do your recommendations work",
  "why do you recommend",
];

const PERSONA_PATTERNS: Array<[PersonaKey, string[]]> = [
  ["partner", [
    "i am a partner", "i'm a partner", "im a partner", "what should a partner do",
    "what should partners do", "partner guidance", "i work for a partner", "business partner",
  ]],
  ["champion", [
    "i am a champion", "i'm a champion", "im a champion", "i am an ibm champion", "i'm an ibm champion",
    "what should a champion do", "what should champions do", "champion guidance",
  ]],
  ["student", [
    "i am a student", "i'm a student", "im a student", "what should a student do",
  ]],
  ["executive", [
    "i am an executive", "i'm an executive", "im an executive", "i am a executive", "i'm a executive",
    "what should an executive do",
  ]],
  ["finops", [
    "i'm in finops", "i am in finops", "im in finops", "financial operations",
    "in fin ops", "i'm in financial operations",
  ]],
  ["banking", [
    "i'm in banking", "i am in banking", "in banking", "financial services industry", "banking industry",
  ]],
  ["healthcare", [
    "i'm in healthcare", "i am in healthcare", "in healthcare", "health care industry", "healthcare industry",
  ]],
  ["developer", [
    "i am a developer", "i'm a developer", "im a developer", "what should a developer do",
  ]],
  ["architect", [
    "i am an architect", "i'm an architect", "im an architect", "i am a architect", "i'm a architect",
    "what should an architect do",
  ]],
];

const IBM_COMMUNITY_PATTERNS = [
  "what communities should i join",
  "which communities should i join",
  "communities should i join",
  "is there an ibm community for",
  "ibm community for",
  "any ibm community for",
  "ibm communities for",
  "where can i continue after techxchange",
  "continue after techxchange",
  "where can i continue the conversation",
  "continue the conversation after",
  "join ibm community",
  "ibm topic group",
  "ibm user group",
  "topic groups should i",
  "user groups should i",
  "ibm community hub",
  "online community after the event",
  "where can i continue learning",
  "how do i stay involved after techxchange",
  "stay involved after techxchange",
  "is there an ibm community for ai",
];

const FUN_DISCOVERY_PATTERNS = [
  "anything fun",
  "something fun today",
  "something fun",
  "anything social",
  "something social",
  "social fun",
  "block party",
  "sandbox party",
  "celebration",
  "after hours",
  "after sessions",
  "what can i do after sessions",
  "where are people gathering",
  "where is everyone gathering",
  "what is happening tonight",
  "what's happening tonight",
  "happening tonight",
  "fun tonight",
  "fun thing",
  "networking events",
  "any networking events",
  "any meetups",
  "any meet up",
  "networking tonight",
  "social events",
  "fun activities",
  "things to do tonight",
  "what should i do tonight",
];

const ATTENDANCE_STATUS_PHRASES = [
  "not attending",
  "not registered",
  "haven t registered",
  "havent registered",
  "still deciding",
  "on the fence",
  "should i attend",
  "is it worth attending",
  "thinking about attending",
  "considering techxchange",
  "why should i attend",
  "what would i gain",
  "what would i get",
  "what do i get from",
  "what is this event",
  "tell me about techxchange",
];

const PUBLIC_CORE_INTENTS = new Set<CoreVoiceIntent>([
  "event_knowledge",
  "compass_conversation",
  "fun_discovery",
  "persona_guidance",
  "general_concierge",
  "scope_clarify",
  "diverse_recommendations",
  "attendance_status",
  "ibm_community",
  "dismiss",
  "mark_attended",
]);

const RECOMMENDATION_INTENTS = new Set<CoreVoiceIntent>([
  "next_best_move",
  "find_sessions",
  "find_people",
  "find_huddles",
  "certification_help",
  "explain_my_day",
  "explain_my_week",
  "why_recommended",
]);

function isPublicIntent(intent: VoiceIntent, experience: VoiceExperience): boolean {
  if (PUBLIC_CORE_INTENTS.has(intent as CoreVoiceIntent)) return true;
  return getKnowledgeResponse(intent, "en-US", experience) !== null;
}

function isFirestoreKnowledgeIntent(intent: VoiceIntent, experience: VoiceExperience): boolean {
  return getKnowledgeResponse(intent, "en-US", experience) !== null;
}

// ─────────────────────────────────────────────────────────────────────────────
// classifyVoiceIntent
// ─────────────────────────────────────────────────────────────────────────────

function normalise(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9'\s]/g, " ").replace(/\s+/g, " ").trim();
}

function scoreKeywords(norm: string, keywords: string[]): number {
  let score = 0;
  for (const kw of keywords) {
    if (norm.includes(kw)) score += kw.includes(" ") ? 3 : 1;
  }
  return score;
}

function matchTopic(norm: string, patterns: Array<[string, string[]]>): string | null {
  for (const [topic, phrases] of patterns) {
    for (const phrase of phrases) {
      if (norm.includes(phrase)) return topic;
    }
  }
  return null;
}

function matchPhraseList(norm: string, phrases: string[]): boolean {
  return phrases.some(phrase => norm.includes(phrase));
}

function categoryToIntentFromRecord(
  category: import("@/types/voiceKnowledge").VoiceKnowledgeCategory,
): CoreVoiceIntent {
  switch (category) {
    case "Event Knowledge":
      return "event_knowledge";
    case "Persona Guidance":
      return "persona_guidance";
    case "Fun & Social":
      return "fun_discovery";
    case "Certifications":
      return "certification_help";
    case "Compass Personality":
      return "compass_conversation";
    case "Event Scope":
      return "fallback";
    case "Fallback Responses":
      return "fallback";
    default:
      return "fallback";
  }
}

export function classifyVoiceIntent(
  transcript: string,
  experience: VoiceExperience = "techxchange",
): ClassifiedIntent {
  const norm = normalise(transcript);

  for (const [intent, patterns] of ACTION_PATTERNS) {
    for (const pattern of patterns) {
      if (norm.includes(pattern)) {
        return { intent, transcript, confidence: "high" };
      }
    }
  }

  if (CERT_CODE.test(transcript)) {
    return { intent: "certification_help", transcript, confidence: "high" };
  }

  const voiceKnowledgeMatch = matchVoiceKnowledge(transcript);
  if (voiceKnowledgeMatch) {
    const { record } = voiceKnowledgeMatch;
    return {
      intent: categoryToIntentFromRecord(record.category),
      transcript,
      confidence: "high",
      topic: record.topic_key,
      voiceKnowledgeId: record.id,
    };
  }

  if (matchPhraseList(norm, ATTENDANCE_STATUS_PHRASES)) {
    return { intent: "attendance_status", transcript, confidence: "high" };
  }

  if (matchPhraseList(norm, IBM_COMMUNITY_PATTERNS)) {
    return { intent: "ibm_community", transcript, confidence: "high" };
  }

  if (matchPhraseList(norm, EVENT_HIGHLIGHTS_PHRASES)) {
    return { intent: "event_knowledge", transcript, confidence: "high", topic: "event_highlights" };
  }

  const eventTopic = matchTopic(norm, EVENT_KNOWLEDGE_PATTERNS);
  if (eventTopic) {
    return { intent: "event_knowledge", transcript, confidence: "high", topic: eventTopic };
  }

  const personaTopic = matchTopic(norm, PERSONA_PATTERNS);
  if (personaTopic) {
    return { intent: "persona_guidance", transcript, confidence: "high", topic: personaTopic };
  }

  if (matchPhraseList(norm, FUN_DISCOVERY_PATTERNS)) {
    return { intent: "fun_discovery", transcript, confidence: "high" };
  }

  if (matchPhraseList(norm, COMPASS_CONVERSATION_PATTERNS)) {
    return { intent: "compass_conversation", transcript, confidence: "high" };
  }

  if (isDiverseRecommendationQuery(norm)) {
    return { intent: "diverse_recommendations", transcript, confidence: "high" };
  }

  const eventId = experienceToEventId(experience);
  const eventScope = classifyEventScope(transcript, eventId);
  if (needsScopeClarification(eventScope)) {
    return { intent: "scope_clarify", transcript, confidence: "low" };
  }
  if (blocksEventRecommendations(eventScope)) {
    return { intent: "general_concierge", transcript, confidence: eventScope.confidence };
  }

  const knowledgeIntent = matchKnowledgeIntent(transcript, experience);
  if (knowledgeIntent) {
    return { intent: knowledgeIntent, transcript, confidence: "high" };
  }

  let best: CoreVoiceIntent = "fallback";
  let bestScore = 0;

  for (const [intent, keywords] of Object.entries(KEYWORD_BUCKETS) as Array<
    [keyof typeof KEYWORD_BUCKETS, string[]]
  >) {
    const score = scoreKeywords(norm, keywords);
    if (score > bestScore) {
      bestScore = score;
      best = intent;
    }
  }

  if (bestScore === 0) {
    return { intent: "fallback", transcript, confidence: "low" };
  }

  if (RECOMMENDATION_INTENTS.has(best)) {
    const scopeRecheck = classifyEventScope(transcript, eventId);
    if (needsScopeClarification(scopeRecheck)) {
      return { intent: "scope_clarify", transcript, confidence: "low" };
    }
    if (blocksEventRecommendations(scopeRecheck)) {
      return { intent: "general_concierge", transcript, confidence: scopeRecheck.confidence };
    }
  }

  return { intent: best, transcript, confidence: bestScore >= 2 ? "high" : "low" };
}

// ─────────────────────────────────────────────────────────────────────────────
// Session helpers
// ─────────────────────────────────────────────────────────────────────────────

function resolveDay(session: ScoredSession): string {
  const raw = session as unknown as Record<string, unknown>;
  return session.schedule?.day ?? (typeof raw.date === "string" ? raw.date : "") ?? "";
}
function resolveStart(session: ScoredSession): string {
  const raw = session as unknown as Record<string, unknown>;
  return session.schedule?.start_time ?? (typeof raw.start_time === "string" ? raw.start_time : "") ?? "";
}
function resolveRoom(session: ScoredSession): string {
  const raw = session as unknown as Record<string, unknown>;
  return session.schedule?.room ?? (typeof raw.room === "string" ? raw.room : "") ?? "";
}

function parseTimeMinutes(t: string): number | null {
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

export function pickSessionRecommendation(
  sessions: ScoredSession[],
  recentIds: string[] = [],
  recentFormats: import("@/lib/recommendationBalancing").SessionFormat[] = [],
): ScoredSession | null {
  const balanced = pickBalancedSessionRecommendation(sessions, recentIds, recentFormats);
  if (balanced) return balanced;

  if (sessions.length === 0) return null;

  const ranked = [...sessions].sort((a, b) => (b.compass_score ?? 0) - (a.compass_score ?? 0));
  const hour = new Date().getHours();

  const fresh = ranked.filter(s => !recentIds.includes(s.id) && (s.compass_score ?? 0) > 0);
  const pool = fresh.length > 0 ? fresh : ranked;

  const timeAware = pool.filter(s => {
    const mins = parseTimeMinutes(resolveStart(s));
    if (mins === null) return true;
    return hour >= 12 ? mins >= 12 * 60 : mins < 14 * 60;
  });

  return timeAware[0] ?? pool[0] ?? ranked[0];
}

function sessionForContext(ctx: VoiceResponseContext): ScoredSession | null {
  return ctx.activeSession ?? ctx.topSession ?? null;
}

function topGoal(ctx: VoiceResponseContext): string {
  return (ctx.participantGoals ?? [])[0] ?? (ctx.participantTracks ?? [])[0] ?? "your interests";
}

function topTrack(ctx: VoiceResponseContext): string {
  return (ctx.participantTracks ?? [])[0] ?? (ctx.participantGoals ?? [])[0] ?? "your tracks";
}

function championFirstName(champion: ScoredChampion): string {
  return champion.display_name?.split(/\s+/)[0] ?? champion.display_name ?? "a matched champion";
}

function sessionWhen(session: ScoredSession): string {
  const start = resolveStart(session);
  const day = resolveDay(session);
  return [day, start].filter(Boolean).join(" at ") || "soon";
}

function sessionSpokenBrief(session: ScoredSession): string {
  const room = resolveRoom(session);
  const when = sessionWhen(session);
  if (when && room) return `${session.title} at ${when} in ${room}`;
  if (when) return `${session.title} at ${when}`;
  return room ? `${session.title} in ${room}` : session.title;
}

function topHuddle(ctx: VoiceResponseContext, norm: string): LiveOpportunity | null {
  const huddles = ctx.liveHuddles ?? [];
  if (huddles.length === 0) return null;
  if (norm.includes("alumni")) {
    return huddles.find(h => h.source === "alumni" || h.category.toLowerCase() === "alumni") ?? huddles[0];
  }
  if (norm.includes("cert")) {
    return huddles.find(h => h.source === "certification") ?? huddles[0];
  }
  return huddles[0];
}

function huddleHint(ctx: VoiceResponseContext, norm: string): string {
  const h = topHuddle(ctx, norm);
  if (!h) return "";
  return ` I also see ${h.title} forming nearby in Live Huddles.`;
}

function buildFunDiscoveryResponse(
  ctx: VoiceResponseContext,
  norm: string,
  baseOverride?: string,
): VoiceResponse {
  const knowledge = knowledgeVoiceResponse("FUN_RECOMMENDATION", ctx, norm);
  const evening = /tonight|evening|after session|after sessions/.test(norm);
  const social = /social|fun|party|celebration/.test(norm);
  const networking = /network|gather|meetup|meet up|people gathering/.test(norm);
  const highlightHint = evening || social
    ? ` Don't Miss These Moments includes Sandbox Block Party Tuesday at 6 PM and Awards & Celebration Thursday.`
    : "";
  const activities = pickFunActivities({ evening, social, networking, limit: 4 });
  const huddle = topHuddle(ctx, norm);
  const spokenBody = formatFunDiscoverySpoken(activities, huddle?.title);
  const displayBody = formatFunDiscoveryDisplay(activities, huddle?.title);
  const spoken = baseOverride ? `${baseOverride} ${spokenBody}` : spokenBody + highlightHint;
  const display = displayBody;

  if (knowledge && !knowledge.spoken.toLowerCase().includes("check your agenda")) {
    return {
      spoken: `${knowledge.spoken} ${spoken}`,
      display: knowledge.display?.trim() || display,
      action: "navigate_experience",
    };
  }

  return { spoken, display, action: "navigate_experience" };
}

function buildPersonaResponse(
  persona: PersonaKey | string,
  ctx: VoiceResponseContext,
  overrideBase?: string,
  displayOverride?: string,
): VoiceResponse {
  const base =
    overrideBase ??
    resolvePersonaGuidanceText(persona) ??
    PERSONA_GUIDANCE[persona as PersonaKey] ??
    PERSONA_GUIDANCE.developer;
  const track = topTrack(ctx);
  const hasProfile = (ctx.participantTracks?.length ?? 0) > 0 || (ctx.participantGoals?.length ?? 0) > 0;
  const spoken = hasProfile
    ? `${base} On ${FORGE_PRODUCT.myJourney}, your ${track} profile can sharpen session and people matches further.`
    : base;
  return { spoken, display: displayOverride?.trim() || base };
}

function buildCompassConversationResponse(norm: string, topicOverride?: string): VoiceResponse {
  const topic = (topicOverride ?? resolveCompassConversationTopic(norm)) as CompassConversationKey;
  const spoken =
    resolveCompassPersonalityText(topic) ??
    COMPASS_CONVERSATION[topic] ??
    COMPASS_CONVERSATION.role;
  return { spoken, display: spoken };
}

function buildVoiceKnowledgeResponse(
  record: NonNullable<ReturnType<typeof getVoiceKnowledgeRecord>>,
  ctx: VoiceResponseContext,
  norm: string,
): VoiceResponse {
  switch (record.category) {
    case "Fun & Social":
      return buildFunDiscoveryResponse(ctx, norm, record.response);
    case "Persona Guidance":
      return buildPersonaResponse(
        record.topic_key ?? "developer",
        ctx,
        record.response,
        record.display_response,
      );
    case "Compass Personality":
      return buildCompassConversationResponse(norm, record.topic_key);
    case "Certifications":
      return {
        spoken: record.response,
        display: record.display_response ?? record.title,
        action: "show_sessions",
      };
    case "Fallback Responses":
      return { spoken: record.response, display: record.response };
    default: {
      const resolved = resolveVoiceKnowledgeSpokenDisplay(record);
      let display = resolved.display;
      if (record.redirect_type === "external_site" && record.source_url) {
        display = `${display} ${record.source_url}`;
      } else if (record.redirect_type === "official_faq" && record.source_url) {
        display = `${display} Official FAQ: ${record.source_url}`;
      } else if (record.redirect_type === "guest_services" && record.contact_email) {
        display = `${display} Guest Services: ${record.contact_email}`;
      }
      return { spoken: resolved.spoken, display };
    }
  }
}

function buildGeneralConciergeResponse(experience: VoiceExperience = "techxchange"): VoiceResponse {
  const text = resolveConciergeResponse(experienceToEventId(experience));
  const displayLine = text.split("\n").map(l => l.trim()).find(Boolean) ?? text;
  return { spoken: text, display: displayLine };
}

function buildScopeClarifyResponse(experience: VoiceExperience = "techxchange"): VoiceResponse {
  const text = resolveScopeClarifyResponse(experienceToEventId(experience));
  return { spoken: text, display: text };
}

function tryConciergeRecovery(
  norm: string,
  ctx: VoiceResponseContext,
  seed: string,
): VoiceResponse | null {
  const experience = ctx.experience ?? "techxchange";
  const eventId = experienceToEventId(experience);
  const scope = classifyEventScope(norm, eventId);
  if (needsScopeClarification(scope)) {
    return buildScopeClarifyResponse(experience);
  }
  if (blocksEventRecommendations(scope)) {
    return buildGeneralConciergeResponse(experience);
  }

  const vkMatch = matchVoiceKnowledge(norm);
  if (vkMatch) {
    return buildVoiceKnowledgeResponse(vkMatch.record, ctx, norm);
  }

  const eventTopic = matchTopic(norm, EVENT_KNOWLEDGE_PATTERNS);
  if (eventTopic) {
    const answer =
      resolveEventKnowledgeText(eventTopic) ??
      EVENT_KNOWLEDGE[eventTopic as EventKnowledgeKey];
    return { spoken: answer, display: answer };
  }

  const personaTopic = matchTopic(norm, PERSONA_PATTERNS);
  if (personaTopic) {
    return buildPersonaResponse(personaTopic as PersonaKey, ctx);
  }

  if (matchPhraseList(norm, ATTENDANCE_STATUS_PHRASES)) {
    return buildAttendanceStatusResponse(norm, ctx);
  }

  if (matchPhraseList(norm, FUN_DISCOVERY_PATTERNS)) {
    return buildFunDiscoveryResponse(ctx, norm);
  }

  if (matchPhraseList(norm, COMPASS_CONVERSATION_PATTERNS)) {
    return buildCompassConversationResponse(norm);
  }

  const session = sessionForContext(ctx) ?? ctx.rankedSessions?.[0] ?? null;
  if (session && /session|attend|breakout|lab|workshop|what to attend/.test(norm)) {
    const track = session.tracks?.primary_track ?? topTrack(ctx);
    const spoken = fill(pickTemplate([
      "Consider {title} at {when}. It fits {track}.",
      "A strong session pick is {title} at {when}, matched to {track}.",
    ], seed), {
      title: session.title,
      when: sessionWhen(session),
      track,
    });
    return {
      spoken,
      display: `${session.title} · ${sessionWhen(session)}`,
      action: "show_sessions",
    };
  }

  const champion = ctx.topChampion;
  if (champion && /meet|people|champion|expert|mentor|connect|talk to/.test(norm)) {
    const name = championFirstName(champion);
    const keywords = champion.shared_keywords?.slice(0, 2).join(" and ") ?? topTrack(ctx);
    const spoken = fill(pickTemplate([
      "I found {name} because their expertise overlaps with {match}.",
      `{name} is a strong match on {match}. Check ${FORGE_LABELS.guides} for details.`,
    ], seed), { name, match: keywords });
    const org = champion.organization ?? champion.company ?? "";
    return {
      spoken,
      display: `Meet ${champion.display_name}${org ? ` · ${org}` : ""}`,
      action: "show_champions",
    };
  }

  const nbm = ctx.nextBestMove;
  if ((session || nbm) && /what should i do|next|recommend|guide me|prioritize|what now/.test(norm)) {
    const title = session?.title ?? nbm!.headline;
    const when = session ? sessionWhen(session) : nbm!.subline ?? "soon";
    const goal = topGoal(ctx);
    const spoken = fill(pickTemplate([
      "Your next best move is {title} at {when}. It matches your goals around {goal}.",
      "I'd start with {title} at {when} — it aligns with {goal}.",
    ], seed), { title, when, goal });
    return {
      spoken,
      display: nbm ? `${nbm.headline} · ${nbm.subline}` : `${title} · ${when}`,
      action: "navigate_experience",
    };
  }

  return null;
}

function isEnrolled(ctx: VoiceResponseContext): boolean {
  if (ctx.isEnrolled === false) return false;
  if (ctx.isEnrolled === true) return true;
  return !!(
    ctx.nextBestMove ||
    (ctx.participantGoals?.length ?? 0) > 0 ||
    (ctx.participantTracks?.length ?? 0) > 0
  );
}

function notEnrolledResponse(locale: VoiceLocale = "en-US"): VoiceResponse {
  const spoken =
    locale === "zh-CN"
      ? `请先构建 ${FORGE_PRODUCT.myJourney}，以便我为您提供个性化回答。`
      : `You are exploring ${FORGE_EVENT.name}. Register to access your personal Compass — build your agenda, discover relevant sessions, connect with IBM Champions, and stay involved through IBM Community.`;
  const display =
    locale === "zh-CN"
      ? `请先构建 ${FORGE_PRODUCT.myJourney} 以获取个性化语音回答。`
      : `${FORGE_PRODUCT.buildMyJourney} · Register for personal Compass guidance`;
  return { spoken, display };
}

function buildAttendanceStatusResponse(norm: string, ctx: VoiceResponseContext): VoiceResponse {
  const enrolled = isEnrolled(ctx);
  const undecided =
    /not attending|still deciding|on the fence|not registered|haven t registered|havent registered|thinking about attending|considering techxchange/.test(
      norm,
    );

  if (undecided && !enrolled) {
    return {
      spoken:
        `Are you still deciding whether to attend ${FORGE_EVENT.name}? The conference includes technical sessions, certification paths, IBM Champions, and IBM Community experiences. If you register, Compass becomes your personal guide for the week.`,
      display: `${FORGE_PRODUCT.buildMyJourney} · Register`,
      action: "navigate_experience",
    };
  }

  if (/should i attend|is it worth attending|why should i attend/.test(norm)) {
    return {
      spoken:
        `That depends on your goals. ${FORGE_EVENT.name} is designed for developers, architects, AI practitioners, infrastructure teams, data experts, partners, and technology leaders looking to learn, connect, and build new skills.`,
      display: `Evaluating ${FORGE_EVENT.name} attendance`,
    };
  }

  if (/what would i gain|what would i get|what do i get/.test(norm)) {
    return {
      spoken:
        "Many attendees come to learn new technologies, pursue certifications, meet experts, discover communities, and connect with peers facing similar challenges.",
      display: `What attendees gain from ${FORGE_EVENT.name}`,
    };
  }

  if (!enrolled) {
    return {
      spoken:
        `You're still exploring ${FORGE_EVENT.name}. The conference brings together hands-on learning, IBM Champions, certification paths, and IBM Community across AI, data, automation, cloud, infrastructure, security, and more. Register when you're ready — Compass will personalize your week.`,
      display: `${FORGE_PRODUCT.buildMyJourney} · Register`,
      action: "navigate_experience",
    };
  }

  const overview =
    resolveEventKnowledgeText("event_overview") ?? EVENT_KNOWLEDGE.event_overview;
  return {
    spoken: overview,
    display: `About ${FORGE_EVENT.name}`,
  };
}

function knowledgeVoiceResponse(
  intent: string,
  ctx: VoiceResponseContext,
  rawQuestion: string,
  action?: VoiceResponseAction,
): VoiceResponse | null {
  const experience = ctx.experience ?? "techxchange";
  const locale = ctx.locale ?? "en-US";
  const response = getKnowledgeResponse(intent, locale, experience);
  if (!response) return null;
  void logKnowledgeAnalytics(experienceToEventId(experience), {
    rawQuestion,
    matchedIntent: intent,
    experience,
    language: locale,
    source: "voice",
  });
  return { spoken: response.spoken, display: response.display, action };
}

function pickTemplate(templates: string[], seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h + seed.charCodeAt(i)) % templates.length;
  return templates[h] ?? templates[0];
}

function fill(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => vars[key] ?? "");
}

// ─────────────────────────────────────────────────────────────────────────────
// buildVoiceResponse
// ─────────────────────────────────────────────────────────────────────────────

export function buildVoiceResponse(
  classified: ClassifiedIntent,
  ctx: VoiceResponseContext,
): VoiceResponse {
  const { intent, transcript } = classified;
  const norm = normalise(transcript);
  const seed = transcript + intent;
  const locale = ctx.locale ?? "en-US";
  const experience = ctx.experience ?? "techxchange";

  if (!isEnrolled(ctx) && !isPublicIntent(intent, experience)) {
    return notEnrolledResponse(locale);
  }

  const eventId = experienceToEventId(experience);
  const scopeGate = classifyEventScope(transcript, eventId);
  if (intent !== "general_concierge" && intent !== "scope_clarify") {
    if (needsScopeClarification(scopeGate)) {
      return buildScopeClarifyResponse(experience);
    }
    if (blocksEventRecommendations(scopeGate)) {
      return buildGeneralConciergeResponse(experience);
    }
  }

  if (RECOMMENDATION_INTENTS.has(intent as CoreVoiceIntent)) {
    const scopeRecheck = classifyEventScope(transcript, eventId);
    if (needsScopeClarification(scopeRecheck)) {
      return buildScopeClarifyResponse(experience);
    }
    if (blocksEventRecommendations(scopeRecheck)) {
      return buildGeneralConciergeResponse(experience);
    }
  }

  if (ctx.certificationJourney) {
    const journeyTopic = matchCertificationJourneyQuestion(norm);
    if (journeyTopic) {
      const journey = formatCertificationJourneyVoice(journeyTopic, ctx.certificationJourney);
      return { ...journey, action: "navigate_experience" };
    }
  }

  if (classified.voiceKnowledgeId) {
    const record = getVoiceKnowledgeRecord(classified.voiceKnowledgeId);
    if (record?.enabled) {
      return buildVoiceKnowledgeResponse(record, ctx, norm);
    }
  }

  if (isFirestoreKnowledgeIntent(intent, experience)) {
    const action = intent === "CHAMPION_MATCH" ? "show_champions" as const : undefined;
    return knowledgeVoiceResponse(intent, ctx, transcript, action) ?? {
      spoken:  "Let me help you with that on Compass.",
      display: "Open Compass for more guidance.",
    };
  }

  switch (intent as CoreVoiceIntent) {

    case "event_knowledge": {
      const topic = classified.topic ?? "event_overview";

      if (topic === "event_highlights") {
        return {
          spoken: formatEventHighlightsVoice(6),
          display: formatEventHighlightsDisplay(),
          action: "navigate_experience",
        };
      }

      if (topic === "sandbox_block_party") {
        const moment = findEventMomentByQuery("sandbox");
        if (moment) {
          const spoken = `${moment.title} is ${moment.day} at ${moment.time} in ${moment.location}. ${moment.description}`;
          return {
            spoken,
            display: `${moment.title} · ${moment.day} · ${moment.time}`,
            action: "navigate_experience",
          };
        }
      }

      const key = topic as EventKnowledgeKey;
      const answer =
        resolveEventKnowledgeText(key) ??
        EVENT_KNOWLEDGE[key] ??
        EVENT_KNOWLEDGE.event_overview;
      return { spoken: answer, display: answer };
    }

    case "compass_conversation": {
      return buildCompassConversationResponse(norm);
    }

    case "fun_discovery": {
      return buildFunDiscoveryResponse(ctx, norm);
    }

    case "persona_guidance": {
      const persona = (classified.topic ?? "developer") as PersonaKey;
      return buildPersonaResponse(persona, ctx);
    }

    case "general_concierge":
      return buildGeneralConciergeResponse(experience);

    case "scope_clarify":
      return buildScopeClarifyResponse(experience);

    case "attendance_status":
      return buildAttendanceStatusResponse(norm, ctx);

    case "diverse_recommendations": {
      const moves = ctx.balancedMoves ?? [];
      const diverse = formatDiverseRecommendationVoice(moves);
      return {
        spoken: diverse.spoken,
        display: diverse.display,
        action: "navigate_experience",
      };
    }

    case "next_best_move": {
      const balanced = ctx.balancedMoves ?? [];
      const primary = ctx.nextBestMove;
      const goal = topGoal(ctx);
      const huddle = huddleHint(ctx, norm);

      if (primary?.type === "register") {
        return {
          spoken:
            `You are exploring ${FORGE_EVENT.name}. Register to access your personal Compass — build your agenda, discover relevant sessions, connect with IBM Champions, and stay involved through IBM Community.`,
          display: `${FORGE_PRODUCT.buildMyJourney} · Register`,
          action: "navigate_experience",
        };
      }

      if (primary?.type === "profile") {
        return {
          spoken:
            primary.headline.toLowerCase().includes("create")
              ? "Tell Compass about your interests, goals, and areas of focus so we can personalize your event experience."
              : "The more Compass knows about your interests and goals, the more relevant your recommendations become.",
          display: `${primary.headline} · ${primary.ctaLabel ?? FORGE_PRODUCT.buildMyJourney}`,
          action: "navigate_experience",
        };
      }

      if (balanced.length > 0 || primary) {
        const lead = primary ?? balanced[0];
        if (lead) {
          const title = lead.headline;
          const when = lead.subline || "soon";
          const alternates = formatBalancedVoiceAlternates(
            balanced.filter(m => m.entityId !== lead.entityId || m.type !== lead.type),
            2,
          );
          const templates = [
            "Your next best move is {title} — {when}. It fits {goal}.{huddle}",
            "I'd start with {title}. {when}. That keeps your week balanced around {goal}.{huddle}",
          ];
          const spoken = fill(pickTemplate(templates, seed), {
            title,
            when,
            goal,
            huddle,
          });
          const balanceNote =
            alternates && !alternates.startsWith("Open My")
              ? ` ${alternates}`
              : " Compass balances learning, people, networking, and fun across your plan.";
          return {
            spoken: `${spoken}${balanceNote}`,
            display: balanced.map(m => m.headline).slice(0, 4).join(" · "),
            action: lead.type === "champion"
              ? "show_champions"
              : lead.type === "session"
                ? "show_sessions"
                : "navigate_experience",
          };
        }
      }

      const session = sessionForContext(ctx);
      const nbm = ctx.nextBestMove;

      if (!session && !nbm) {
        return {
          spoken:  "Open My Experience to load your Compass plan, then ask again for a next move.",
          display: "No recommendation loaded yet. Open My Experience first.",
          action:  "navigate_experience",
        };
      }

      const title = session?.title ?? nbm!.headline;
      const when = session ? sessionWhen(session) : nbm!.subline ?? "soon";
      const templates = [
        "Your next best move is {title} at {when}. It matches your goals around {goal}.{huddle}",
        "I'd start with {title} at {when} — it aligns with {goal}.{huddle}",
        "Compass points to {title} at {when} based on {goal}.{huddle}",
      ];
      const spoken = fill(pickTemplate(templates, seed), {
        title, when, goal, huddle,
      });
      const display = nbm
        ? `${nbm.headline} · ${nbm.subline} · ${nbm.reason}`
        : `${title} · ${when}`;
      return { spoken, display };
    }

    case "find_sessions": {
      const session = sessionForContext(ctx) ?? ctx.rankedSessions?.[0] ?? null;
      if (!session) {
        return {
          spoken:  "Browse Sessions to explore labs and breakouts, or open My Experience once your plan is loaded.",
          display: "No matched sessions yet. Try Sessions or build your Compass.",
          action:  "show_sessions",
        };
      }
      const track = session.tracks?.primary_track ?? topTrack(ctx);
      const templates = [
        "Consider {title} at {when}. It fits {track}.",
        "A strong session pick is {title} at {when}, matched to {track}.",
        "Look at {title} at {when} — Compass scored it for {track}.",
      ];
      const spoken = fill(pickTemplate(templates, seed), {
        title: session.title,
        when: sessionWhen(session),
        track,
      });
      return {
        spoken,
        display: `${session.title} · ${sessionWhen(session)}`,
        action:  "show_sessions",
      };
    }

    case "find_people": {
      const track = topTrack(ctx);
      const huddle = huddleHint(ctx, norm);

      if (ctx.speakerCatalog?.length && /speaker|expert|presenter|governance|openshift|certification|who should i meet for|any experts|who can help with/.test(norm)) {
        const expertMatch = findSpeakersForQuery(
          classified.transcript,
          ctx.speakerCatalog,
          ctx.speakerCtx ?? {},
          1,
        )[0];
        if (expertMatch) {
          const spoken = `${formatSpeakerIntelligenceVoice(expertMatch)}${huddle}`;
          const reason = expertMatch.whyMeet[0] ?? expertMatch.expertiseLabel ?? track;
          return {
            spoken,
            display: `${expertMatch.displayName} · ${reason}`,
            action: "show_champions",
          };
        }
      }

      const speaker = ctx.topSpeaker;
      if (speaker && /speaker|expert|presenter/.test(norm)) {
        const spoken = `${formatSpeakerIntelligenceVoice(speaker)}${huddle}`;
        return {
          spoken,
          display: `${speaker.displayName} · ${speaker.whyMeet[0] ?? speaker.expertiseLabel ?? "Expert"}`,
          action: "show_champions",
        };
      }

      const champion = ctx.topChampion;

      if (!champion) {
        return {
          spoken:  `Open ${FORGE_LABELS.guides} to see experts matched to your profile, and check Live Opportunities for peer conversations.` + huddle,
          display: `Browse ${FORGE_LABELS.guides} and Live Opportunities for people to meet.`,
          action:  "show_champions",
        };
      }

      const name = championFirstName(champion);
      const keywords = champion.shared_keywords?.slice(0, 2).join(" and ") ?? track;
      const templates = [
        "I found {name} because their expertise overlaps with {match}.{huddle}",
        `{name} is a strong match on {match}. Check ${FORGE_LABELS.guides} for details.{huddle}`,
        "Meet {name} — Compass matched you on {match}.{huddle}",
      ];
      const spoken = fill(pickTemplate(templates, seed), {
        name,
        match: keywords,
        huddle,
      });
      const org = champion.organization ?? champion.company ?? "";
      return {
        spoken,
        display: `Meet ${champion.display_name}${org ? ` · ${org}` : ""} · ${keywords}`,
        action:  "show_champions",
      };
    }

    case "ibm_community": {
      const matches = recommendIbmCommunities({
        tracks: ctx.participantTracks ?? [],
        topics: ctx.participantGoals ?? [],
        goals: ctx.participantGoals ?? [],
        limit: 3,
      });
      const names = matches.map(m => m.name).join(", ");
      const detail = matches
        .map(m => `${m.name} (${m.type})`)
        .join(" · ");

      const templates = [
        `Communities have topic groups and user groups across many technology areas. Based on your profile, I'd explore {names}. These are persistent destinations — not live Huddles. Open ${FORGE_LABELS.communities} in Compass for links.`,
        `After ${FORGE_EVENT.name}, communities are where the conversation continues — topic groups, user groups, and ${FORGE_LABELS.guides.toLowerCase()}. For you, I'd start with {names}. Visit ${FORGE_LABELS.communities} in Compass to join.`,
        `For topic groups and user groups beyond the event, look at {names}. Communities are separate from live Huddles on ${FORGE_PRODUCT.myJourney}. I can show you links on the Communities page.`,
      ];
      const spoken = fill(pickTemplate(templates, seed), { names });
      return {
        spoken,
        display: detail || `${FORGE_LABELS.communities} · topic groups · user groups`,
        action: "show_communities",
      };
    }

    case "find_huddles": {
      const huddle = topHuddle(ctx, norm);
      if (!huddle) {
        return {
          spoken:  "Open Live Opportunities on My Experience to see conversations forming around you.",
          display: "Check Live Opportunities for active huddles and meetups.",
          action:  "navigate_experience",
        };
      }

      if (norm.includes("alumni")) {
        const templates = [
          "Compass found alumni-oriented conversations in Live Opportunities. Start with {title} — {status}.",
          "There's an alumni meetup forming: {title} at {location}. Review who's joined before you jump in.",
          "For alumni connections, try {title} in Live Opportunities. It's {status}.",
        ];
        const spoken = fill(pickTemplate(templates, seed), {
          title: huddle.title,
          status: huddle.status,
          location: huddle.location ?? "on site",
        });
        return { spoken, display: `${huddle.title} · ${huddle.status} · Live Opportunities`, action: "navigate_experience" };
      }

      const templates = [
        "{title} is forming now — {status} at {location}. See Live Opportunities for who's joined.",
        "Check {title} in Live Opportunities. It's {status} with {joined} people already in.",
        "A live conversation worth joining: {title}, {status}, in {location}.",
      ];
      const spoken = fill(pickTemplate(templates, seed), {
        title: huddle.title,
        status: huddle.status,
        location: huddle.location ?? FORGE_EVENT.name,
        joined: String(huddle.joinedCount),
      });
      return { spoken, display: `${huddle.title} · ${huddle.status}`, action: "navigate_experience" };
    }

    case "certification_help": {
      if (ctx.certificationJourney) {
        const journeyTopic = matchCertificationJourneyQuestion(norm);
        if (journeyTopic) {
          const journey = formatCertificationJourneyVoice(journeyTopic, ctx.certificationJourney);
          return { ...journey, action: "navigate_experience" };
        }
        const short = ctx.certificationJourney.shortTitle;
        return {
          spoken: `You're working toward ${short}. Open Working Toward a Learning Path on ${FORGE_PRODUCT.myJourney} for sessions, experts, and communities matched to your path.`,
          display: `Learning path · ${short}`,
          action: "navigate_experience",
        };
      }

      const certHuddle = ctx.liveHuddles?.find(h => h.source === "certification");
      const goal = topGoal(ctx);
      const certCode = transcript.match(CERT_CODE)?.[0]?.toUpperCase() ?? "";
      const codeBit = certCode ? ` including ${certCode}` : "";
      const huddleBit = certHuddle
        ? ` There's also ${certHuddle.title} in Live Opportunities.`
        : "";

      const templates = [
        `Compass can connect sessions, labs, study groups, and expert time{code} along your learning path. Set your goal in ${FORGE_PRODUCT.buildMyJourney}.{huddle}`,
        `For your learning path{code}, focus on sessions, labs, and peers matched to {goal}.{huddle}`,
        `Start with a learning path goal in ${FORGE_PRODUCT.buildMyJourney} — Sessions and Live Opportunities will surface what to learn, practice, and attend next.{huddle}`,
      ];
      const spoken = fill(pickTemplate(templates, seed), {
        code: codeBit,
        goal,
        huddle: huddleBit,
      });
      return {
        spoken,
        display: `Learning path · ${goal}${certCode ? ` · ${certCode}` : ""}`,
        action:  "show_sessions",
      };
    }

    case "explain_my_day": {
      const session = sessionForContext(ctx);
      const nbm = ctx.nextBestMove;
      const top = session ?? (nbm ? null : null);
      const title = top?.title ?? nbm?.headline;
      const huddle = huddleHint(ctx, norm);

      if (!title) {
        return {
          spoken:  "Open My Experience for today's Networking, Learning, and Fun plan across the week.",
          display: "See your day plan on My Experience.",
          action:  "navigate_experience",
        };
      }

      const templates = [
        "Today centers on {title}. Open My Experience for the full afternoon and evening plan.{huddle}",
        "Your day leads with {title}. My Experience breaks down what's next.{huddle}",
        "For today, Compass highlights {title} first — see the rest of your plan in My Experience.{huddle}",
      ];
      const spoken = fill(pickTemplate(templates, seed), { title, huddle });
      return { spoken, display: `Today: ${title}`, action: "navigate_experience" };
    }

    case "explain_my_week": {
      const session = sessionForContext(ctx);
      const title = session?.title ?? ctx.nextBestMove?.headline ?? "your top matches";
      const templates = [
        "Your four-day plan is organized around {title} and your goals. Open My Experience for Networking, Learning, and Fun by day.",
        "Compass spread your week across sessions and moments like {title}. See the full plan on My Experience.",
        "The week plan prioritizes {title} among your matches — My Experience shows each day.",
      ];
      const spoken = fill(pickTemplate(templates, seed), { title });
      return { spoken, display: `Week plan · anchor: ${title}`, action: "navigate_experience" };
    }

    case "why_recommended": {
      const session = sessionForContext(ctx);
      const nbm = ctx.nextBestMove;
      const balanced = ctx.balancedMoves ?? [];
      if (session) {
        const primary = formatSessionIntelligenceVoice(session, ctx.certLabel ?? null);
        const spoken = formatWhyRecommendedWithBalance(primary, balanced);
        const display = buildSessionRecommendationReasons(session, ctx.certLabel ?? null)
          .slice(0, 4)
          .map(r => `✓ ${r}`)
          .join("\n");
        return { spoken, display, action: "show_sessions" };
      }
      const whyLine = nbm?.reason
        ? humanizeScoringReason(nbm.reason)
        : COMPASS_CONVERSATION.why_generic;
      const spoken = formatWhyRecommendedWithBalance(
        nbm
          ? `Compass picked this because ${whyLine.replace(/\.$/, "")}.`
          : COMPASS_CONVERSATION.why_generic,
        balanced,
      );
      return {
        spoken,
        display: whyLine,
      };
    }

    case "dismiss":
      return {
        spoken:  "Got it. I'll factor that into what Compass suggests next.",
        display: "Compass will adjust your recommendations.",
        action:  "dismiss",
      };

    case "mark_attended":
      return {
        spoken:  "Got it — I'll weigh that when suggesting what comes next.",
        display: "Noted. Compass will adjust what it suggests next.",
        action:  "mark_attended",
      };

    case "add_to_agenda":
      return {
        spoken:  "Open a session card and tap Add to schedule — your plan updates immediately.",
        display: "Use Add to schedule on any session card.",
        action:  "navigate_experience",
      };

    case "fallback":
    default: {
      const concierge = tryConciergeRecovery(norm, ctx, seed);
      if (concierge) return concierge;

      const knowledgeIntent = matchKnowledgeIntent(transcript, experience);
      if (knowledgeIntent) {
        const knowledge = knowledgeVoiceResponse(knowledgeIntent, ctx, transcript);
        if (knowledge) return knowledge;
      }

      const session = sessionForContext(ctx);
      if (session) {
        const fallback = getDefaultFallbackResponse();
        return {
          spoken: fallback,
          display: `Try: What should I do now? · Who should I meet? · Anything fun tonight? · What is ${FORGE_LABELS.builderDay}?`,
        };
      }
      const fallback = getDefaultFallbackResponse();
      return {
        spoken: fallback,
        display: `Try: What is ${FORGE_EVENT.name}? · How can you help me? · I'm a guide · Anything fun tonight?`,
      };
    }
  }
}
