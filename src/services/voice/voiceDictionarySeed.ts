// =============================================================================
// Compass Voice Dictionary — seed entries (STT normalization + TTS pronunciation)
// Future admin: /setup/voice
// =============================================================================

import type { VoiceDictionaryEntry } from "./voiceDictionaryTypes";

export const VOICE_DICTIONARY_SEED: VoiceDictionaryEntry[] = [
  {
    displayText: "TechXchange",
    spokenText: "Tech Exchange",
    heardAs: ["Tech Exchange", "tech exchange", "tech change", "text change"],
    experience: "techxchange",
    active: true,
    notes: "STT often splits the event name into two words.",
  },
  {
    displayText: "watsonx",
    spokenText: "Watson Ex",
    heardAs: ["Watson X", "Watson Ex", "Watson acts", "Watson axe"],
    experience: "shared",
    active: true,
  },
  {
    displayText: "Qiskit",
    spokenText: "Kiss kit",
    heardAs: ["Kiss kit", "Q kit", "quiz kit"],
    experience: "techxchange",
    active: true,
  },
  {
    displayText: "IBM Champions",
    spokenText: "IBM Champions",
    heardAs: ["IBM champion", "I B M champion"],
    experience: "techxchange",
    active: true,
  },
  {
    displayText: "Sandbox Block Party",
    spokenText: "Sandbox Block Party",
    heardAs: ["sandbox block party", "block party"],
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
