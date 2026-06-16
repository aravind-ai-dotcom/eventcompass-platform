// =============================================================================
// Compass Voice — TTS pronunciation layer (display → spoken form for Google TTS)
// Separate from STT normalization.
// =============================================================================

import { getActiveDictionaryEntries } from "./voiceDictionarySeed";
import type { VoiceExperience } from "./voiceDictionaryTypes";

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Apply pronunciation dictionary before sending text to TTS.
 * Display terms in UI/responses stay canonical; speech uses spokenText.
 */
export function applyTtsPronunciation(
  text: string,
  experience: VoiceExperience,
): string {
  if (!text.trim()) return text;

  let spoken = text;
  const entries = getActiveDictionaryEntries(experience)
    .filter(entry => entry.spokenText !== entry.displayText)
    .sort((a, b) => b.displayText.length - a.displayText.length);

  for (const entry of entries) {
    spoken = spoken.replace(
      new RegExp(escapeRegExp(entry.displayText), "gi"),
      entry.spokenText,
    );
  }
  return spoken;
}
