// =============================================================================
// Compass Knowledge — resolver (Firestore-backed via matching service)
// =============================================================================

import { experienceToEventId } from "@/lib/compassEventPaths";
import {
  matchKnowledgeForExperience,
  matchAndLogKnowledge,
  ensureKnowledgeLoaded,
} from "./knowledgeMatchingService";
import { getActiveKnowledgeRecords } from "./knowledgeService";
import type { GovernanceLanguage } from "@/types/compassGovernance";
import type { VoiceExperience } from "@/services/voice/voiceDictionaryTypes";

export type VoiceLocale = GovernanceLanguage;

export function matchKnowledgeIntent(
  transcript: string,
  experience: VoiceExperience,
): string | null {
  const match = matchKnowledgeForExperience(transcript, experience, {
    language: "en-US",
    source: "voice",
  });
  return match?.intent ?? null;
}

export function getKnowledgeResponse(
  intent: string,
  locale: VoiceLocale,
  experience: VoiceExperience,
): { spoken: string; display: string } | null {
  if (locale !== "en-US") {
    // TechXchange is English-first; SKO Chinese handled in Part 5–7
  }
  const eventId = experienceToEventId(experience);
  const record = getActiveKnowledgeRecords(eventId).find(r => r.intent === intent);
  if (!record) return null;
  return { spoken: record.response, display: record.response };
}

export async function knowledgeResponseFromTranscript(
  transcript: string,
  locale: VoiceLocale,
  experience: VoiceExperience,
  source: "typed" | "voice" = "voice",
): Promise<{ intent: string; spoken: string; display: string; confidence: number } | null> {
  await ensureKnowledgeLoaded(experienceToEventId(experience));
  const match = await matchAndLogKnowledge(transcript, experience, { language: locale, source });
  if (!match) return null;
  return {
    intent: match.intent,
    spoken: match.response,
    display: match.response,
    confidence: match.confidence,
  };
}

export { ensureKnowledgeLoaded, matchAndLogKnowledge };
