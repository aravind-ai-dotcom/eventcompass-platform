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
// Design:
//   - classifyVoiceIntent  — deterministic keyword pattern matching
//   - buildVoiceResponse   — builds spoken + display strings from scored data
//   - No audio stored, transmitted, or logged
//   - Each function is independently testable
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
  | "DISMISS"
  | "MARK_ATTENDED"
  | "UNKNOWN";

export interface ClassifiedIntent {
  intent:     VoiceIntent;
  transcript: string;           // original, unmodified
  confidence: "high" | "low";  // high = keyword hit, low = UNKNOWN fallback
}

// ─────────────────────────────────────────────────────────────────────────────
// VoiceResponse type — consumed by VoiceCompassButton.tsx
// ─────────────────────────────────────────────────────────────────────────────

export type VoiceResponseAction =
  | "navigate_experience"
  | "show_champions"
  | "show_sessions"
  | "dismiss"
  | "mark_attended";

export interface VoiceResponse {
  /** Spoken aloud via SpeechSynthesis — concise, natural sentence */
  spoken: string;
  /** Shown in the UI result area — may include extra detail */
  display: string;
  /** Optional UI action to trigger after response is delivered */
  action?: VoiceResponseAction;
}

// ─────────────────────────────────────────────────────────────────────────────
// Context passed from VoiceCompassButton
// ─────────────────────────────────────────────────────────────────────────────

export interface VoiceResponseContext {
  nextBestMove: NextBestMove | null;
  topSession:   ScoredSession | null;
  topChampion:  ScoredChampion | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Pattern table
// Each row: [intent, string[]]
// Evaluated top-to-bottom — first match wins.
// More specific phrases listed before broad ones within each intent.
// ─────────────────────────────────────────────────────────────────────────────

const INTENT_PATTERNS: Array<[VoiceIntent, string[]]> = [

  // MARK_ATTENDED — checked before DISMISS (both contain "done")
  ["MARK_ATTENDED", [
    "i went to that",
    "i attended",
    "i was there",
    "i did that",
    "already went",
    "already attended",
    "been to that",
    "mark as attended",
    "mark attended",
    "attended that",
  ]],

  // DISMISS
  ["DISMISS", [
    "skip this",
    "skip that",
    "not interested",
    "not for me",
    "dismiss this",
    "dismiss that",
    "remove this",
    "don't want that",
    "ignore this",
    "pass on this",
    "pass on that",
    "next one",
    "something else",
    "done",
  ]],

  // FULL_SCHEDULE
  ["FULL_SCHEDULE", [
    "show me my plan",
    "show my plan",
    "my full plan",
    "my full schedule",
    "see my schedule",
    "show my schedule",
    "open my experience",
    "my experience",
    "full schedule",
    "everything today",
    "what is my plan",
    "what's my plan",
  ]],

  // NEXT_SCHEDULED — checked before CURRENT_SCHEDULE
  ["NEXT_SCHEDULED", [
    "what's next on my schedule",
    "what is next on my schedule",
    "next on my schedule",
    "what's after this",
    "what is after this",
    "what comes next",
    "next scheduled",
    "after this",
  ]],

  // CURRENT_SCHEDULE
  ["CURRENT_SCHEDULE", [
    "where am i going",
    "where am i going now",
    "where should i go now",
    "where do i go",
    "what room",
    "where is my session",
    "where is it",
    "what's my next session",
    "what is my next session",
  ]],

  // CHAMPION_MATCH
  ["CHAMPION_MATCH", [
    "who should i meet",
    "who can i meet",
    "who should i talk to",
    "who should i connect with",
    "introduce me",
    "find me someone",
    "who is available",
    "meet a champion",
    "any champions",
    "people i should meet",
    "who to meet",
    "networking",
  ]],

  // NEXT_BEST_MOVE — broadest intent, checked last
  ["NEXT_BEST_MOVE", [
    "what should i do next",
    "what should i do",
    "what do i do next",
    "what do i do now",
    "next best move",
    "what's next",
    "what is next",
    "help me decide",
    "what now",
    "recommend something",
    "give me a recommendation",
    "what session",
    "which session",
    "what should i attend",
    "what to do",
  ]],
];

// ─────────────────────────────────────────────────────────────────────────────
// classifyVoiceIntent
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Normalise a transcript for pattern matching.
 * Lowercases, strips punctuation except apostrophes, collapses whitespace.
 */
function normalise(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9'\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Classify a speech transcript into a VoiceIntent.
 *
 * @param transcript  Raw text from SpeechRecognition.results
 * @returns           ClassifiedIntent — intent, original transcript, confidence
 *
 * Strategy:
 *   1. Normalise the transcript (lowercase, strip punctuation)
 *   2. Walk INTENT_PATTERNS in order — first substring match wins
 *   3. No match → UNKNOWN with confidence "low"
 */
export function classifyVoiceIntent(transcript: string): ClassifiedIntent {
  const norm = normalise(transcript);

  for (const [intent, patterns] of INTENT_PATTERNS) {
    for (const pattern of patterns) {
      if (norm.includes(pattern)) {
        return { intent, transcript, confidence: "high" };
      }
    }
  }

  return { intent: "UNKNOWN", transcript, confidence: "low" };
}

// ─────────────────────────────────────────────────────────────────────────────
// Field resolution helpers — dual-schema safe
// Sessions may carry flat legacy fields or nested v5 schedule fields.
// ─────────────────────────────────────────────────────────────────────────────

function resolveSessionDay(session: ScoredSession): string {
  const raw = session as unknown as Record<string, unknown>;
  return session.schedule?.day
    ?? (typeof raw.date === "string" ? raw.date : "")
    ?? "";
}

function resolveSessionStart(session: ScoredSession): string {
  const raw = session as unknown as Record<string, unknown>;
  return session.schedule?.start_time
    ?? (typeof raw.start_time === "string" ? raw.start_time : "")
    ?? "";
}

function resolveSessionRoom(session: ScoredSession): string {
  const raw = session as unknown as Record<string, unknown>;
  return session.schedule?.room
    ?? (typeof raw.room === "string" ? raw.room : "")
    ?? "";
}

// ─────────────────────────────────────────────────────────────────────────────
// buildVoiceResponse
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build the spoken + display response for a classified intent.
 *
 * @param classified  Output of classifyVoiceIntent()
 * @param ctx         Pre-scored data from the experience page
 * @returns           VoiceResponse — spoken text, display text, optional action
 *
 * All data comes from ctx — no Firestore access, no side effects.
 */
export function buildVoiceResponse(
  classified: ClassifiedIntent,
  ctx: VoiceResponseContext
): VoiceResponse {
  const { intent } = classified;

  switch (intent) {

    // ── NEXT_BEST_MOVE ────────────────────────────────────────────────────────
    case "NEXT_BEST_MOVE": {
      const nbm = ctx.nextBestMove;
      if (!nbm) {
        return {
          spoken:  "I don't have a recommendation ready yet. Open your Experience page to load your Compass.",
          display: "No recommendation available. Open your Experience page to load your Compass.",
        };
      }
      const spoken  = `Your next move is ${nbm.headline}. ${nbm.subline}. ${nbm.reason}.`;
      const display = `${nbm.headline} · ${nbm.subline} · ${nbm.reason}`;
      return { spoken, display };
    }

    // ── CHAMPION_MATCH ────────────────────────────────────────────────────────
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
      const spoken    = `You should meet ${champion.display_name}${fromLine}.${matchLine}`;
      const display   = `Meet ${champion.display_name}${fromLine}${matchLine}`;
      return { spoken, display, action: "show_champions" };
    }

    // ── CURRENT_SCHEDULE / NEXT_SCHEDULED ────────────────────────────────────
    case "CURRENT_SCHEDULE":
    case "NEXT_SCHEDULED": {
      const session = ctx.topSession;
      if (!session) {
        return {
          spoken:  "I couldn't find a session on your schedule. Open your Experience page to see your plan.",
          display: "No upcoming session found. Check your Experience page.",
        };
      }
      const day   = resolveSessionDay(session);
      const start = resolveSessionStart(session);
      const room  = resolveSessionRoom(session);
      const when  = [day, start].filter(Boolean).join(" at ");
      const where = room ? ` in ${room}` : "";
      const spoken  = `Your next session is ${session.title}${when ? `, ${when}` : ""}${where}.`;
      const display = [session.title, session.tracks?.primary_track, when, room]
        .filter(Boolean)
        .join(" · ");
      return { spoken, display };
    }

    // ── FULL_SCHEDULE ─────────────────────────────────────────────────────────
    case "FULL_SCHEDULE": {
      return {
        spoken:  "I'll show your full experience plan.",
        display: "Opening your full Experience plan.",
        action:  "navigate_experience",
      };
    }

    // ── DISMISS ───────────────────────────────────────────────────────────────
    case "DISMISS": {
      return {
        spoken:  "Got it. I'll use that to adjust your plan.",
        display: "Got it. Compass will adjust your recommendations.",
        action:  "dismiss",
      };
    }

    // ── MARK_ATTENDED ─────────────────────────────────────────────────────────
    case "MARK_ATTENDED": {
      return {
        spoken:  "Done. I'll mark that as attended in a future version.",
        display: "Done. Compass will mark that as attended in a future update.",
        action:  "mark_attended",
      };
    }

    // ── UNKNOWN ───────────────────────────────────────────────────────────────
    case "UNKNOWN":
    default: {
      return {
        spoken:  "I can help with what to do next, who to meet, or where to go now.",
        display: "Try asking: What should I do next? · Who should I meet? · Where am I going now?",
      };
    }
  }
}
