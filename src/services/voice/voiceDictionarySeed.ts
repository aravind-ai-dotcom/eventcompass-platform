// =============================================================================
// Compass Voice Dictionary — seed entries (STT normalization + TTS pronunciation)
// Future admin: /setup/voice
// =============================================================================

import type { VoiceDictionaryEntry } from "./voiceDictionaryTypes";

export const VOICE_DICTIONARY_SEED: VoiceDictionaryEntry[] = [
  {
    displayText: "FORGE",
    spokenText: "Forge",
    heardAs: ["forge", "forged", "fourge"],
    experience: "techxchange",
    active: true,
    notes: "Event name — mission designation.",
  },
  {
    displayText: "Compass Intelligence",
    spokenText: "Compass Intelligence",
    heardAs: ["compass intelligence", "compass AI", "compass ai"],
    experience: "techxchange",
    active: true,
  },
  {
    displayText: "Guides",
    spokenText: "Guides",
    heardAs: ["guide", "guides", "forge guides"],
    experience: "techxchange",
    active: true,
  },
  {
    displayText: "Bayfront Innovation Center",
    spokenText: "Bayfront Innovation Center",
    heardAs: ["bayfront", "innovation center", "bay front"],
    experience: "techxchange",
    active: true,
  },
  {
    displayText: "Sales Kickoff",
    spokenText: "Sales Kickoff",
    heardAs: ["sales kick off", "S K O", "SKO"],
    experience: "sko",
    active: true,
  },
];

export function getActiveDictionaryEntries(
  experience: "techxchange" | "sko",
): VoiceDictionaryEntry[] {
  return VOICE_DICTIONARY_SEED.filter(
    entry =>
      entry.active &&
      (entry.experience === "shared" || entry.experience === experience),
  );
}
