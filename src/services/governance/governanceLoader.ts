// =============================================================================
// Load all governance data for an event (knowledge + voice + STT)
// =============================================================================

import { experienceToEventId } from "@/lib/compassEventPaths";
import { loadKnowledgeRecords } from "@/services/knowledge/knowledgeService";
import { loadVoiceDictionaryRecords } from "@/services/voice/voiceDictionaryService";
import { loadSttNormalizationRecords } from "@/services/voice/sttNormalizationService";

const loaded = new Set<string>();

export async function ensureGovernanceLoaded(
  experience: "techxchange" | "sko" = "techxchange",
): Promise<void> {
  const eventId = experienceToEventId(experience);
  if (loaded.has(eventId)) return;

  await Promise.all([
    loadKnowledgeRecords(eventId),
    loadVoiceDictionaryRecords(eventId),
    loadSttNormalizationRecords(eventId),
  ]);

  loaded.add(eventId);
}

export function invalidateGovernanceCache(experience: "techxchange" | "sko" = "techxchange"): void {
  loaded.delete(experienceToEventId(experience));
}
