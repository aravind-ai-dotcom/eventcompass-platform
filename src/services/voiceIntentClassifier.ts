// =============================================================================
// EventCompass — Voice Intent Classifier
// src/services/voiceIntentClassifier.ts
//
// Pure TypeScript matching. Firestore knowledge loaded into cache before use.
// =============================================================================

import type { NextBestMove, ScoredSession, ScoredChampion } from "@/types";
import type { LiveOpportunity } from "@/types/liveOpportunity";
import {
  EVENT_KNOWLEDGE,
  PERSONA_GUIDANCE,
  type EventKnowledgeKey,
  type PersonaKey,
} from "@/data/eventKnowledge";
import {
  getKnowledgeResponse,
  matchKnowledgeIntent,
  type VoiceLocale,
} from "@/services/knowledge/knowledgeResolver";
import { logKnowledgeAnalytics } from "@/services/knowledge/knowledgeMatchingService";
import { experienceToEventId } from "@/lib/compassEventPaths";
import type { VoiceExperience } from "@/services/voice/voiceDictionaryTypes";

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
  | "certification_help"
  | "explain_my_day"
  | "explain_my_week"
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
}

export type VoiceResponseAction =
  | "navigate_experience"
  | "show_champions"
  | "show_sessions"
  | "show_day"
  | "dismiss"
  | "mark_attended";

export interface VoiceResponse {
  spoken:  string;
  display: string;
  action?: VoiceResponseAction;
}

export interface VoiceResponseContext {
  nextBestMove:        NextBestMove | null;
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
  >,
  string[]
> = {
  find_sessions: [
    "session", "breakout", "lab", "workshop", "what to attend", "attend",
    "technical breakout", "hands on",
  ],
  find_people: [
    "who should i meet", "who can i meet", "who to meet", "who should i talk",
    "champion", "expert", "mentor", "people", "connect with", "introduce me",
  ],
  find_huddles: [
    "conversation", "huddle", "meetup", "alumni", "coffee", "roundtable",
    "live opportunit", "forming nearby", "any alumni", "peer discussion",
  ],
  certification_help: [
    "certification", "certified", "cert exam", "exam prep", "exam", "test", "pass my cert",
    "study group", "qiskit cert",
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
    "explain this recommendation", "why did you pick",
  ]],
  ["add_to_agenda", [
    "add to my agenda", "add to agenda", "save this session", "schedule this",
  ]],
];

const CERT_CODE = /\bc\d{3,5}\b/i;

const EVENT_KNOWLEDGE_PATTERNS: Array<[EventKnowledgeKey, string[]]> = [
  ["event_dates", ["when is techxchange", "when is the event", "what dates is techxchange", "when does techxchange"]],
  ["event_location", ["where is the event", "where is techxchange", "where is it located", "event location"]],
  ["tracks", ["what tracks are there", "what tracks", "technical tracks", "event tracks"]],
  ["community_day", ["what is community day"]],
  ["partner_day", ["what is partner day"]],
  ["sandbox_block_party", ["what is sandbox block party", "what is the sandbox block party"]],
  ["certification_program", ["what certifications are available", "certifications available", "certification opportunities"]],
  ["champions_program", ["what are ibm champions", "who are ibm champions", "what is the champions program", "ibm champions program"]],
  ["event_purpose", ["what is the event about", "purpose of the event", "why techxchange"]],
  ["event_overview", ["what is this event", "what is techxchange", "tell me about techxchange", "what is the event"]],
];

const COMPASS_CONVERSATION_PATTERNS = [
  "what do you do",
  "how can you help me",
  "how can you help",
  "what is the biggest concern",
  "biggest concern you have",
  "what should i focus on",
  "am i trying to do too much",
  "trying to do too much",
  "too much on my plate",
];

const PERSONA_PATTERNS: Array<[PersonaKey, string[]]> = [
  ["champion", ["i am a champion", "i'm a champion", "im a champion", "i am an ibm champion", "i'm an ibm champion"]],
  ["student", ["i am a student", "i'm a student", "im a student"]],
  ["executive", ["i am an executive", "i'm an executive", "im an executive", "i am a executive", "i'm a executive"]],
  ["finops", ["i'm in finops", "i am in finops", "im in finops", "financial operations", "in fin ops", "i'm in financial operations"]],
  ["developer", ["i am a developer", "i'm a developer", "im a developer"]],
  ["architect", ["i am an architect", "i'm an architect", "im an architect", "i am a architect", "i'm a architect"]],
];

const FUN_DISCOVERY_PATTERNS = [
  "anything fun",
  "something fun today",
  "something fun",
  "social fun",
  "block party",
  "sandbox party",
  "celebration",
  "after hours",
  "where are people gathering",
  "what is happening tonight",
  "what's happening tonight",
  "happening tonight",
  "fun tonight",
  "fun thing",
];

const PUBLIC_CORE_INTENTS = new Set<CoreVoiceIntent>([
  "event_knowledge",
  "compass_conversation",
  "fun_discovery",
  "persona_guidance",
  "dismiss",
  "mark_attended",
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

  const knowledgeIntent = matchKnowledgeIntent(transcript, experience);
  if (knowledgeIntent) {
    return { intent: knowledgeIntent, transcript, confidence: "high" };
  }

  const eventTopic = matchTopic(norm, EVENT_KNOWLEDGE_PATTERNS);
  if (eventTopic) {
    return { intent: "event_knowledge", transcript, confidence: "high", topic: eventTopic };
  }

  if (matchPhraseList(norm, COMPASS_CONVERSATION_PATTERNS)) {
    return { intent: "compass_conversation", transcript, confidence: "high" };
  }

  const personaTopic = matchTopic(norm, PERSONA_PATTERNS);
  if (personaTopic) {
    return { intent: "persona_guidance", transcript, confidence: "high", topic: personaTopic };
  }

  if (matchPhraseList(norm, FUN_DISCOVERY_PATTERNS)) {
    return { intent: "fun_discovery", transcript, confidence: "high" };
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
): ScoredSession | null {
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
  return ` I also see ${h.title} forming nearby in Live Opportunities.`;
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
      ? "请先构建 My Compass，以便我为您提供个性化回答。"
      : "Build your Compass first so I can personalize this.";
  const display =
    locale === "zh-CN"
      ? "请先构建 My Compass 以解锁个性化语音回答。"
      : "Build My Compass first to unlock personalized voice answers.";
  return { spoken, display };
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

  if (isFirestoreKnowledgeIntent(intent, experience)) {
    const action = intent === "CHAMPION_MATCH" ? "show_champions" as const : undefined;
    return knowledgeVoiceResponse(intent, ctx, transcript, action) ?? {
      spoken:  "Let me help you with that on Compass.",
      display: "Open Compass for more guidance.",
    };
  }

  switch (intent as CoreVoiceIntent) {

    case "event_knowledge": {
      const key = (classified.topic ?? "event_overview") as EventKnowledgeKey;
      const answer = EVENT_KNOWLEDGE[key] ?? EVENT_KNOWLEDGE.event_overview;
      return { spoken: answer, display: answer };
    }

    case "compass_conversation": {
      if (
        norm.includes("biggest concern") ||
        norm.includes("focus on") ||
        norm.includes("too much")
      ) {
        const spoken =
          "The biggest challenge is focus. TechXchange has many sessions, people, certifications, and conversations. My job is to help you decide what matters most for your goals.";
        return { spoken, display: EVENT_KNOWLEDGE.compass_biggest_concern };
      }
      const spoken = EVENT_KNOWLEDGE.compass_about;
      return { spoken, display: spoken };
    }

    case "fun_discovery": {
      const knowledge = knowledgeVoiceResponse("FUN_RECOMMENDATION", ctx, transcript);
      if (knowledge) {
        const huddle = huddleHint(ctx, norm);
        return {
          spoken: knowledge.spoken + (huddle ? huddle : ""),
          display: knowledge.display,
        };
      }
      const huddle = huddleHint(ctx, norm);
      const spoken =
        "Yes. If you are looking for something social, start with Sandbox Block Party and the live conversations forming around your interests." +
        (huddle ? huddle : " Networking and Entertainment in the evening is another good place to gather.");
      return {
        spoken,
        display: "Sandbox Block Party · live conversations · evening networking",
      };
    }

    case "persona_guidance": {
      const persona = (classified.topic ?? "developer") as PersonaKey;
      const spoken = PERSONA_GUIDANCE[persona] ?? PERSONA_GUIDANCE.developer;
      return { spoken, display: spoken };
    }

    case "next_best_move": {
      const session = sessionForContext(ctx);
      const nbm = ctx.nextBestMove;
      const goal = topGoal(ctx);
      const huddle = huddleHint(ctx, norm);

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
        display: `${session.title} · ${sessionWhen(session)} · score ${session.compass_score ?? "—"}`,
        action:  "show_sessions",
      };
    }

    case "find_people": {
      const champion = ctx.topChampion;
      const track = topTrack(ctx);
      const huddle = huddleHint(ctx, norm);

      if (!champion) {
        return {
          spoken:  "Open Champions to see experts matched to your profile, and check Live Opportunities for peer conversations." + huddle,
          display: "Browse Champions and Live Opportunities for people to meet.",
          action:  "show_champions",
        };
      }

      const name = championFirstName(champion);
      const keywords = champion.shared_keywords?.slice(0, 2).join(" and ") ?? track;
      const templates = [
        "I found {name} because their expertise overlaps with {match}.{huddle}",
        "{name} is a strong match on {match}. Check Champions for details.{huddle}",
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
        location: huddle.location ?? "TechXchange",
        joined: String(huddle.joinedCount),
      });
      return { spoken, display: `${huddle.title} · ${huddle.status}`, action: "navigate_experience" };
    }

    case "certification_help": {
      const certHuddle = ctx.liveHuddles?.find(h => h.source === "certification");
      const goal = topGoal(ctx);
      const certCode = transcript.match(CERT_CODE)?.[0]?.toUpperCase() ?? "";
      const codeBit = certCode ? ` including ${certCode}` : "";
      const huddleBit = certHuddle
        ? ` There's also ${certHuddle.title} in Live Opportunities.`
        : "";

      const templates = [
        "Compass can connect sessions, labs, study groups, and expert time{code} along your certification journey. Set your goal in Build My Compass.{huddle}",
        "For your certification journey{code}, focus on learning paths, labs, and peers matched to {goal}.{huddle}",
        "Start with a certification goal in Build My Compass — Sessions and Live Opportunities will surface what to learn, practice, and attend next.{huddle}",
      ];
      const spoken = fill(pickTemplate(templates, seed), {
        code: codeBit,
        goal,
        huddle: huddleBit,
      });
      return {
        spoken,
        display: `Certification journey · ${goal}${certCode ? ` · ${certCode}` : ""}`,
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
          spoken:  "Open My Experience for today's Community, Learning, and Fun plan across the week.",
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
        "Your four-day plan is organized around {title} and your goals. Open My Experience for Community, Learning, and Fun by day.",
        "Compass spread your week across sessions and moments like {title}. See the full plan on My Experience.",
        "The week plan prioritizes {title} among your matches — My Experience shows each day.",
      ];
      const spoken = fill(pickTemplate(templates, seed), { title });
      return { spoken, display: `Week plan · anchor: ${title}`, action: "navigate_experience" };
    }

    case "why_recommended": {
      const session = sessionForContext(ctx);
      const nbm = ctx.nextBestMove;
      if (nbm?.reason) {
        return {
          spoken:  `Compass recommended this because ${nbm.reason}.`,
          display: nbm.reason,
        };
      }
      if (session?.compass_reasons?.length) {
        const reasons = session.compass_reasons.slice(0, 2).join(". ");
        return { spoken: `Here's why: ${reasons}.`, display: reasons };
      }
      return {
        spoken:  "Open My Experience to see match reasons on your session and people cards.",
        display: "See scoring reasons on My Experience.",
        action:  "navigate_experience",
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
        spoken:  "Noted. Attendance tracking is coming in a future Compass update.",
        display: "Marked for a future attendance feature.",
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
      const knowledgeIntent = matchKnowledgeIntent(transcript, experience);
      if (knowledgeIntent) {
        const knowledge = knowledgeVoiceResponse(knowledgeIntent, ctx, transcript);
        if (knowledge) return knowledge;
      }
      const eventTopic = matchTopic(norm, EVENT_KNOWLEDGE_PATTERNS);
      if (eventTopic) {
        const answer = EVENT_KNOWLEDGE[eventTopic as EventKnowledgeKey];
        return { spoken: answer, display: answer };
      }
      if (matchPhraseList(norm, COMPASS_CONVERSATION_PATTERNS)) {
        const spoken = EVENT_KNOWLEDGE.compass_about;
        return { spoken, display: spoken };
      }
      const personaTopic = matchTopic(norm, PERSONA_PATTERNS);
      if (personaTopic) {
        const spoken = PERSONA_GUIDANCE[personaTopic as PersonaKey];
        return { spoken, display: spoken };
      }
      if (matchPhraseList(norm, FUN_DISCOVERY_PATTERNS)) {
        const spoken =
          "Yes. If you are looking for something social, start with Sandbox Block Party and the live conversations forming around your interests.";
        return { spoken, display: "Sandbox Block Party · live conversations" };
      }
      const session = sessionForContext(ctx);
      if (session) {
        return {
          spoken:  `Try asking about ${session.title}, who to meet, live huddles, or your week plan.`,
          display: "Try: What should I do now? · Who should I meet? · Any alumni here? · Show my week.",
        };
      }
      return {
        spoken:  "Ask about TechXchange, what Compass does, sessions, people to meet, live huddles, certification, or something fun tonight.",
        display: "Try: What is TechXchange? · What is Compass? · Who should I meet? · Anything fun tonight?",
      };
    }
  }
}
