// =============================================================================
// Voice knowledge resolver — phrase matching (Phase 1, no embeddings)
// =============================================================================

import { TXC_EVENT_ID, type CompassEventId } from "@/lib/compassEventPaths";
import {
  getEnabledVoiceKnowledgeRecords,
  getVoiceKnowledgeRecord,
} from "@/services/voice/voiceKnowledgeService";
import type {
  VoiceKnowledgeCategory,
  VoiceKnowledgeMatch,
  VoiceKnowledgeRecord,
} from "@/types/voiceKnowledge";

export type VoiceKnowledgeIntent =
  | "event_knowledge"
  | "compass_conversation"
  | "fun_discovery"
  | "persona_guidance"
  | "certification_help"
  | "fallback";

function normalise(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9'\s]/g, " ").replace(/\s+/g, " ").trim();
}

export function categoryToIntent(category: VoiceKnowledgeCategory): VoiceKnowledgeIntent {
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

function scorePhraseMatch(norm: string, phrase: string): number {
  const p = normalise(phrase);
  if (!p || !norm.includes(p)) return 0;
  return p.length + (p.includes(" ") ? 12 : 0);
}

function scoreRecordMatch(norm: string, record: VoiceKnowledgeRecord): VoiceKnowledgeMatch | null {
  let bestScore = 0;
  let matchedPhrase = "";

  for (const phrase of record.trigger_phrases) {
    const score = scorePhraseMatch(norm, phrase);
    if (score > bestScore) {
      bestScore = score;
      matchedPhrase = phrase;
    }
  }

  const titleScore = scorePhraseMatch(norm, record.title);
  if (titleScore > bestScore) {
    bestScore = titleScore;
    matchedPhrase = record.title;
  }

  if (record.intent) {
    const intentScore = scorePhraseMatch(norm, record.intent.replace(/_/g, " "));
    if (intentScore > bestScore) {
      bestScore = intentScore;
      matchedPhrase = record.intent;
    }
  }

  for (const tag of record.tags ?? []) {
    const tagScore = scorePhraseMatch(norm, tag.replace(/_/g, " "));
    if (tagScore > bestScore) {
      bestScore = tagScore;
      matchedPhrase = tag;
    }
  }

  if (bestScore <= 0) return null;
  return {
    record,
    score: bestScore + (record.priority ?? 50) / 100,
    matchedPhrase,
  };
}

export function matchVoiceKnowledge(
  transcript: string,
  eventId: CompassEventId | string = TXC_EVENT_ID,
  options?: { includeFallback?: boolean },
): VoiceKnowledgeMatch | null {
  const norm = normalise(transcript);
  if (!norm) return null;

  const includeFallback = options?.includeFallback ?? false;
  let best: VoiceKnowledgeMatch | null = null;

  const records = [...getEnabledVoiceKnowledgeRecords(eventId)].sort(
    (a, b) => (b.priority ?? 50) - (a.priority ?? 50),
  );

  for (const record of records) {
    if (record.category === "Fallback Responses" && !includeFallback) continue;
    if (record.category === "Event Scope") continue;

    const candidate = scoreRecordMatch(norm, record);
    if (!candidate) continue;
    if (!best || candidate.score > best.score) {
      best = candidate;
    } else if (candidate.score === best.score) {
      const candidatePriority = candidate.record.priority ?? 50;
      const bestPriority = best.record.priority ?? 50;
      if (candidatePriority > bestPriority) best = candidate;
    }
  }

  return best;
}

export function getDefaultFallbackResponse(
  eventId: CompassEventId | string = TXC_EVENT_ID,
): string {
  const fallback = getEnabledVoiceKnowledgeRecords(eventId).find(
    r => r.category === "Fallback Responses" && r.id === "fallback_default",
  ) ?? getEnabledVoiceKnowledgeRecords(eventId).find(
    r => r.category === "Fallback Responses",
  );

  return (
    fallback?.response ??
    "I couldn't find a strong event-specific answer for that. Would you like help with sessions, people, certifications, communities, or activities?"
  );
}

export function resolveEventKnowledgeText(
  topicKey: string,
  eventId: CompassEventId | string = TXC_EVENT_ID,
): string | null {
  return findVoiceKnowledgeByTopic("Event Knowledge", topicKey, eventId)?.response ?? null;
}

export function resolvePersonaGuidanceText(
  topicKey: string,
  eventId: CompassEventId | string = TXC_EVENT_ID,
): string | null {
  return findVoiceKnowledgeByTopic("Persona Guidance", topicKey, eventId)?.response ?? null;
}

export function resolveCompassPersonalityText(
  topicKey: string,
  eventId: CompassEventId | string = TXC_EVENT_ID,
): string | null {
  return findVoiceKnowledgeByTopic("Compass Personality", topicKey, eventId)?.response ?? null;
}

function findVoiceKnowledgeByTopic(
  category: VoiceKnowledgeCategory,
  topicKey: string,
  eventId: CompassEventId | string,
): VoiceKnowledgeRecord | null {
  return (
    getEnabledVoiceKnowledgeRecords(eventId).find(
      r => r.category === category && r.topic_key === topicKey,
    ) ?? null
  );
}

export interface VoiceKnowledgeTestResult {
  matchedIntent: VoiceKnowledgeIntent;
  match: VoiceKnowledgeMatch | null;
  responsePreview: string;
}

export function testVoiceKnowledgeMatch(
  transcript: string,
  eventId: CompassEventId | string = TXC_EVENT_ID,
): VoiceKnowledgeTestResult {
  const match = matchVoiceKnowledge(transcript, eventId);
  if (!match) {
    return {
      matchedIntent: "fallback",
      match: null,
      responsePreview: getDefaultFallbackResponse(eventId),
    };
  }
  return {
    matchedIntent: categoryToIntent(match.record.category),
    match,
    responsePreview: match.record.response,
  };
}

export { getVoiceKnowledgeRecord };
