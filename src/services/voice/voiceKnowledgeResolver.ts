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
    case "Fallback Responses":
      return "fallback";
    default:
      return "fallback";
  }
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

  for (const record of getEnabledVoiceKnowledgeRecords(eventId)) {
    if (record.category === "Fallback Responses" && !includeFallback) continue;

    for (const phrase of record.trigger_phrases) {
      const p = normalise(phrase);
      if (!p || !norm.includes(p)) continue;
      const score = p.length + (p.includes(" ") ? 10 : 0);
      if (!best || score > best.score) {
        best = { record, score, matchedPhrase: phrase };
      }
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
