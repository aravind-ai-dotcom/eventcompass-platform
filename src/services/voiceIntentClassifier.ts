// =============================================================================
// EventCompass — Voice Intent Classifier
// src/services/voiceIntentClassifier.ts
//
// Pure TypeScript. No Firebase. No React. No LLM calls. No side effects.
//
// Exports required by VoiceCompassButton.tsx:
//   classifyVoiceIntent(transcript: string): ClassifiedIntent
//   buildVoiceResponse(classified: ClassifiedIntent, ctx: VoiceResponseContext): VoiceResponse
//   type VoiceResponse
//
// Wave 4 additions:
//   SHOW_DAY intent      — "show my day", "what does today look like"
//   WHY_RECOMMENDED      — "why was this recommended", "explain this"
//   participantGoals + participantTracks in context → goal-aware responses
//   UNKNOWN fallback updated to mention all supported questions
// =============================================================================

import type { NextBestMove, ScoredSession, ScoredChampion } from "@/types";

// ─────────────────────────────────────────────────────────────────────────────
// Intent type
// ─────────────────────────────────────────────────────────────────────────────

export type VoiceIntent =
  | "NEXT_BEST_MOVE"
  | "CHAMPION_MATCH"
  | "CURRENT_SCHEDULE"
  | "NEXT_SCHEDULED"
  | "FULL_SCHEDULE"
  | "SHOW_DAY"
  | "WHY_RECOMMENDED"
  | "ADD_TO_AGENDA"
  | "SHOW_CONFLICTS"
  | "SHOW_GAPS"
  | "SHOW_AFTERNOON"
  | "MEET_BEFORE_LUNCH"
  | "DISMISS"
  | "MARK_ATTENDED"
  | "UNKNOWN";

export interface ClassifiedIntent {
  intent:     VoiceIntent;
  transcript: string;
  confidence: "high" | "low";
}

// ─────────────────────────────────────────────────────────────────────────────
// VoiceResponse  (same shape — VoiceCompassButton.tsx unchanged)
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// Context  (participantGoals + participantTracks are new optional fields)
// ─────────────────────────────────────────────────────────────────────────────

export interface VoiceResponseContext {
  nextBestMove:        NextBestMove | null;
  topSession:          ScoredSession | null;
  topChampion:         ScoredChampion | null;
  participantGoals?:   string[];
  participantTracks?:  string[];
  /** Rotated session pick — avoids repeating the same recommendation */
  activeSession?:      ScoredSession | null;
  rankedSessions?:     ScoredSession[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Pattern table
// ─────────────────────────────────────────────────────────────────────────────

const INTENT_PATTERNS: Array<[VoiceIntent, string[]]> = [

  ["MARK_ATTENDED", [
    "i went to that", "i attended", "i was there", "i did that",
    "already went", "already attended", "been to that",
    "mark as attended", "mark attended", "attended that",
  ]],

  ["DISMISS", [
    "skip this", "skip that", "not interested", "not for me",
    "dismiss this", "dismiss that", "remove this", "don't want that",
    "ignore this", "pass on this", "pass on that", "next one",
    "something else", "done",
  ]],

  ["WHY_RECOMMENDED", [
    "why was this recommended",
    "why did compass recommend",
    "why is this recommended",
    "why this session",
    "why this champion",
    "explain this recommendation",
    "why did you pick this",
    "why compass picked",
    "how did you choose",
    "what made you recommend",
  ]],

  ["SHOW_DAY", [
    "show me my day",
    "show my day",
    "what is my day",
    "what's my day",
    "my day plan",
    "day plan",
    "what does today look like",
    "today's plan",
    "show today",
    "what is today",
    "what's today",
  ]],

  ["FULL_SCHEDULE", [
    "show me my plan", "show my plan", "my full plan", "my full schedule",
    "see my schedule", "show my schedule", "open my experience",
    "my experience", "full schedule", "everything today",
    "what is my plan", "what's my plan",
  ]],

  ["NEXT_SCHEDULED", [
    "what's next on my schedule", "what is next on my schedule",
    "next on my schedule", "what's after this", "what is after this",
    "what comes next", "next scheduled", "after this",
    "what session is next", "what's my next session",
  ]],

  ["CURRENT_SCHEDULE", [
    "where am i going", "where am i going now",
    "where should i go now", "where do i go",
    "what room", "where is my session", "where is it",
    "what is my next session", "where am i heading",
  ]],

  ["CHAMPION_MATCH", [
    "who should i meet", "who can i meet", "who should i talk to",
    "who should i connect with", "introduce me", "find me someone",
    "who is available", "meet a champion", "any champions",
    "people i should meet", "who to meet", "networking",
    "who do you recommend i meet",
  ]],

  ["ADD_TO_AGENDA", [
    "add this session",
    "add to my agenda",
    "add to agenda",
    "save this session",
    "put this in my calendar",
    "schedule this",
    "add this to my plan",
    "add this",
  ]],

  ["SHOW_CONFLICTS", [
    "any conflicts",
    "do i have conflicts",
    "show conflicts",
    "check my schedule",
    "schedule conflicts",
    "any clashes",
    "overlapping sessions",
  ]],

  ["SHOW_GAPS", [
    "what should i do between sessions",
    "any free time",
    "open slots",
    "open time",
    "what can i do in the gap",
    "fill my gap",
    "between sessions",
    "free slot",
    "open window",
  ]],

  ["SHOW_AFTERNOON", [
    "show me my afternoon",
    "what is this afternoon",
    "afternoon plan",
    "afternoon schedule",
    "my afternoon",
    "what's this afternoon",
    "later today",
  ]],

  ["MEET_BEFORE_LUNCH", [
    "who should i meet before lunch",
    "meet someone before lunch",
    "any meetings before lunch",
    "who can i meet this morning",
    "people to meet this morning",
    "connect before lunch",
  ]],

  ["NEXT_BEST_MOVE", [
    "what should i do next", "what should i do",
    "what do i do next", "what do i do now",
    "next best move", "what's next", "what is next",
    "help me decide", "what now", "recommend something",
    "give me a recommendation", "what session",
    "which session", "what should i attend", "what to do",
    "guide me", "help me",
  ]],
];

// ─────────────────────────────────────────────────────────────────────────────
// classifyVoiceIntent
// ─────────────────────────────────────────────────────────────────────────────

function normalise(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9'\s]/g, " ").replace(/\s+/g, " ").trim();
}

export function classifyVoiceIntent(transcript: string): ClassifiedIntent {
  const norm = normalise(transcript);
  for (const [intent, patterns] of INTENT_PATTERNS) {
    for (const pattern of patterns) {
      if (norm.includes(pattern)) return { intent, transcript, confidence: "high" };
    }
  }
  return { intent: "UNKNOWN", transcript, confidence: "low" };
}

// ─────────────────────────────────────────────────────────────────────────────
// Field resolution helpers — dual-schema safe
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

function goalContext(ctx: VoiceResponseContext): string {
  const goals  = (ctx.participantGoals  ?? []).slice(0, 2);
  const tracks = (ctx.participantTracks ?? []).slice(0, 2);
  const items  = [...goals, ...tracks];
  if (items.length === 0) return "";
  return `You told Compass that ${items.join(" and ")} ${items.length > 1 ? "are" : "is"} important to you. `;
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

/** Pick a session recommendation that rotates alternatives and respects time-of-day. */
export function pickSessionRecommendation(
  sessions: ScoredSession[],
  recentIds: string[] = [],
): ScoredSession | null {
  if (sessions.length === 0) return null;

  const ranked = [...sessions].sort((a, b) => (b.compass_score ?? 0) - (a.compass_score ?? 0));
  const hour = new Date().getHours();

  const fresh = ranked.filter(s => !recentIds.includes(s.id) && (s.compass_score ?? 0) > 0);
  const pool = fresh.length > 0 ? fresh : ranked.filter(s => (s.compass_score ?? 0) > 0).slice(1).length
    ? ranked.filter(s => (s.compass_score ?? 0) > 0).slice(1)
    : ranked;

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

/** Spoken TTS — title + room only (avoids time/track pronunciation issues). */
function sessionSpokenBrief(session: ScoredSession): string {
  const room = resolveRoom(session);
  return room ? `${session.title} in ${room}` : session.title;
}

// ─────────────────────────────────────────────────────────────────────────────
// buildVoiceResponse
// ─────────────────────────────────────────────────────────────────────────────

export function buildVoiceResponse(
  classified: ClassifiedIntent,
  ctx: VoiceResponseContext
): VoiceResponse {
  const { intent } = classified;
  const gc = goalContext(ctx);

  switch (intent) {

    case "NEXT_BEST_MOVE": {
      const nbm = ctx.nextBestMove;
      if (!nbm) {
        return {
          spoken:  "I don't have a recommendation ready yet. Open your Experience page to load your Compass.",
          display: "No recommendation available. Open your Experience page.",
        };
      }
      const sess = sessionForContext(ctx);
      const spoken  = sess
        ? `${gc}Your next move is ${sessionSpokenBrief(sess)}.`
        : `${gc}Your next move is ${nbm.headline}.`;
      const display = `${nbm.headline} · ${nbm.subline} · ${nbm.reason}`;
      return { spoken, display };
    }

    case "CHAMPION_MATCH": {
      const champion = ctx.topChampion;
      if (!champion) {
        return {
          spoken:  "No champions are matched to your profile yet. Make sure your Compass is built.",
          display: "No champion match available. Check your Experience page.",
        };
      }
      const org       = champion.organization ?? champion.company ?? "";
      const keywords  = champion.shared_keywords?.slice(0, 2).join(" and ") ?? "";
      const matchLine = keywords ? ` You match on ${keywords}.` : "";
      const fromLine  = org ? ` from ${org}` : "";
      const spoken    = `${gc}You should meet ${champion.display_name}${fromLine}.${matchLine}`;
      const display   = `Meet ${champion.display_name}${fromLine}${matchLine}`;
      return { spoken, display, action: "show_champions" };
    }

    case "CURRENT_SCHEDULE":
    case "NEXT_SCHEDULED": {
      const session = sessionForContext(ctx);
      if (!session) {
        return {
          spoken:  "I couldn't find a session on your schedule. Open your Experience page to see your plan.",
          display: "No upcoming session found. Check your Experience page.",
        };
      }
      const spoken  = `Your next session is ${sessionSpokenBrief(session)}.`;
      const day   = resolveDay(session);
      const start = resolveStart(session);
      const room  = resolveRoom(session);
      const when  = [day, start].filter(Boolean).join(" at ");
      const display = [session.title, session.tracks?.primary_track, when, room].filter(Boolean).join(" · ");
      return { spoken, display };
    }

    case "FULL_SCHEDULE": {
      return {
        spoken:  "I'll show your full experience plan.",
        display: "Opening your full Experience plan.",
        action:  "navigate_experience",
      };
    }

    case "SHOW_DAY": {
      const nbm     = ctx.nextBestMove;
      const session = ctx.topSession;
      const topItem = nbm?.headline ?? session?.title;
      if (!topItem) {
        return {
          spoken:  "Open your Experience page to see your full day plan across Community, Learning, and Fun.",
          display: "Open My Experience to see your day plan.",
          action:  "navigate_experience",
        };
      }
      const spoken  = `Your day is organized around ${topItem}. Open My Experience to see the full Community, Learning, and Fun schedule.`;
      const display = `Top: ${topItem}. Open My Experience for your full day plan.`;
      return { spoken, display, action: "navigate_experience" };
    }

    case "WHY_RECOMMENDED": {
      const nbm     = ctx.nextBestMove;
      const session = sessionForContext(ctx);
      if (nbm?.reason) {
        const spoken  = `${gc}That's why Compass recommended this: ${nbm.reason}.`;
        const display = `${gc}${nbm.reason}`;
        return { spoken, display };
      }
      if (session?.compass_reasons && session.compass_reasons.length > 0) {
        const reasons = session.compass_reasons.slice(0, 2).join(". ");
        const spoken  = `${gc}Here's why Compass picked this: ${reasons}.`;
        const display = `${gc}${reasons}`;
        return { spoken, display };
      }
      return {
        spoken:  `${gc}Compass matched this based on your profile signals. Open My Experience to see the full reasons.`,
        display: `${gc}Open My Experience to see scoring reasons.`,
        action:  "navigate_experience",
      };
    }

    case "DISMISS": {
      return {
        spoken:  "Got it. I'll use that to adjust your plan.",
        display: "Got it. Compass will adjust your recommendations.",
        action:  "dismiss",
      };
    }

    case "MARK_ATTENDED": {
      return {
        spoken:  "Done. I'll mark that as attended in a future version.",
        display: "Done. Compass will mark that as attended in a future update.",
        action:  "mark_attended",
      };
    }

    case "ADD_TO_AGENDA": {
      return {
        spoken:  "To add sessions to your agenda, open a session card and tap Add to Agenda. Your plan will update immediately.",
        display: "Open a session card → Add to Agenda. Your Compass plan updates in real time.",
        action:  "navigate_experience",
      };
    }

    case "SHOW_CONFLICTS": {
      return {
        spoken:  "Open My Experience to see your agenda and any schedule conflicts Compass has detected.",
        display: "Compass checks your agenda for conflicts. Open My Experience to review.",
        action:  "navigate_experience",
      };
    }

    case "SHOW_GAPS": {
      return {
        spoken:  "Compass looks for open windows in your schedule and suggests champions, community events, and activities to fill them.",
        display: "Open My Experience → My Agenda to see open slots and what Compass recommends filling them with.",
        action:  "navigate_experience",
      };
    }

    case "SHOW_AFTERNOON": {
      const session = sessionForContext(ctx);
      const hasSession = !!session;
      const spoken = hasSession
        ? `This afternoon, consider ${sessionSpokenBrief(session!)}.`
        : "Open My Experience to see your full afternoon schedule and open opportunities.";
      return {
        spoken,
        display: hasSession
          ? `Afternoon top pick: ${session!.title}. Open My Experience for your full plan.`
          : "Open My Experience to see your afternoon plan.",
        action: "navigate_experience",
      };
    }

    case "MEET_BEFORE_LUNCH": {
      const champion = ctx.topChampion;
      if (champion) {
        const org = champion.organization ?? champion.company ?? "";
        const spoken = `Before lunch, consider meeting ${champion.display_name}${org ? ` from ${org}` : ""}. ${gc}They are available for a conversation.`;
        return {
          spoken,
          display: `Meet ${champion.display_name}${org ? ` · ${org}` : ""} before lunch. Open Champions to connect.`,
          action: "show_champions",
        };
      }
      return {
        spoken:  "Check the Champions page to find someone worth meeting before lunch today.",
        display: "Browse Champions to find morning connections.",
        action:  "show_champions",
      };
    }

    case "UNKNOWN":
    default: {
      return {
        spoken:  "I can help with what to do next, who to meet, where to go, why something was recommended, or your day plan.",
        display: "Try: What should I do next? · Who should I meet? · Why was this recommended? · Show me my day.",
      };
    }
  }
}
