// =============================================================================
// Load all governance data for an event (knowledge + voice + STT)
// =============================================================================

import { experienceToEventId } from "@/lib/compassEventPaths";
import { loadKnowledgeRecords } from "@/services/knowledge/knowledgeService";
import { loadSkoKnowledgeRecords } from "@/services/knowledge/skoKnowledgeService";
import { loadGovernanceSummaries } from "@/services/summaries/summaryService";
import { loadTranslationMemoryRecords } from "@/services/translations/translationMemoryService";
import { loadVoiceKnowledgeRecords } from "@/services/voice/voiceKnowledgeService";
import { loadRecommendationBalanceConfig, invalidateRecommendationBalanceCache } from "@/services/recommendationBalanceConfig";
import { loadVoiceDictionaryRecords } from "@/services/voice/voiceDictionaryService";
import { loadSttNormalizationRecords } from "@/services/voice/sttNormalizationService";

const loaded = new Set<string>();

export async function ensureGovernanceLoaded(
  experience: "techxchange" | "sko" = "techxchange",
): Promise<void> {
  const eventId = experienceToEventId(experience);
  if (loaded.has(eventId)) return;

  if (experience === "sko") {
    await Promise.all([
      loadSkoKnowledgeRecords(eventId),
      loadTranslationMemoryRecords(eventId),
      loadGovernanceSummaries(eventId),
      loadVoiceDictionaryRecords(eventId),
      loadSttNormalizationRecords(eventId),
    ]);
  } else {
    await Promise.all([
      loadKnowledgeRecords(eventId),
      loadVoiceKnowledgeRecords(eventId),
      loadRecommendationBalanceConfig(eventId),
      loadVoiceDictionaryRecords(eventId),
      loadSttNormalizationRecords(eventId),
    ]);
  }

  loaded.add(eventId);
}

export function invalidateGovernanceCache(experience: "techxchange" | "sko" = "techxchange"): void {
  const eventId = experienceToEventId(experience);
  loaded.delete(eventId);
  invalidateRecommendationBalanceCache(eventId);
}
