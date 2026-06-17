// =============================================================================
// Compass Voice — TTS pronunciation (Firestore-backed)
// =============================================================================

import { experienceToEventId } from "@/lib/compassEventPaths";
import { applyPronunciationFromCache } from "./sttNormalizationService";
import type { VoiceExperience } from "./voiceDictionaryTypes";

export function applyTtsPronunciation(text: string, experience: VoiceExperience): string {
  const eventId = experienceToEventId(experience);
  return applyPronunciationFromCache(text, eventId);
}
