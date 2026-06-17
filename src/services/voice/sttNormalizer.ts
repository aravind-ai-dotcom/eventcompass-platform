// =============================================================================
// Compass Voice — STT normalization (Firestore-backed, longest phrase first)
// =============================================================================

import { experienceToEventId } from "@/lib/compassEventPaths";
import { normalizeTranscriptFromCache } from "./sttNormalizationService";
import type { VoiceExperience } from "./voiceDictionaryTypes";

export function normalizeVoiceInput(text: string, experience: VoiceExperience): string {
  const eventId = experienceToEventId(experience);
  return normalizeTranscriptFromCache(text, eventId);
}
