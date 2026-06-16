// =============================================================================
// Compass Voice — STT normalization (heard variants → canonical display terms)
// Runs before intent classification, search, and recommendations.
// =============================================================================

import { getActiveDictionaryEntries } from "./voiceDictionarySeed";
import type { VoiceExperience } from "./voiceDictionaryTypes";

interface SttReplacement {
  alias: string;
  canonical: string;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildReplacements(experience: VoiceExperience): SttReplacement[] {
  const seen = new Set<string>();
  const replacements: SttReplacement[] = [];

  for (const entry of getActiveDictionaryEntries(experience)) {
    for (const alias of entry.heardAs ?? []) {
      const key = alias.toLowerCase();
      if (!alias.trim() || seen.has(key)) continue;
      seen.add(key);
      replacements.push({ alias, canonical: entry.displayText });
    }
  }

  return replacements.sort((a, b) => b.alias.length - a.alias.length);
}

/**
 * Normalize raw speech-to-text into Compass canonical terms.
 * Original user transcript should remain unchanged in the UI.
 */
export function normalizeVoiceInput(text: string, experience: VoiceExperience): string {
  if (!text.trim()) return text;

  let normalized = text;
  for (const { alias, canonical } of buildReplacements(experience)) {
    normalized = normalized.replace(
      new RegExp(escapeRegExp(alias), "gi"),
      canonical,
    );
  }
  return normalized;
}
