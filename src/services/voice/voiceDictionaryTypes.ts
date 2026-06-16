// =============================================================================
// Compass Voice Dictionary — shared entry model
// Separate from UI i18n and knowledge response dictionaries.
// =============================================================================

export type DictionaryExperience = "shared" | "techxchange" | "sko";

export interface VoiceDictionaryEntry {
  displayText: string;
  spokenText: string;
  heardAs?: string[];
  experience: DictionaryExperience;
  active: boolean;
  notes?: string;
}

export type VoiceExperience = "techxchange" | "sko";
