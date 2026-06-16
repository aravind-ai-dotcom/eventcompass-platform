// =============================================================================
// Compass Knowledge Response Dictionary — types
// Separate from UI i18n and voice pronunciation dictionaries.
// =============================================================================

export type KnowledgeExperience = "shared" | "techxchange" | "sko";

export type VoiceLocale = "en-US" | "zh-CN";

export type KnowledgeIntentId =
  | "certification_prep"
  | "champion_match"
  | "fun_recommendation"
  | "out_of_scope_location"
  | "champion_playful"
  | "champion_path";

export interface LocalizedResponse {
  "en-US": string;
  "zh-CN": string;
}

export interface KnowledgeItem {
  intent: KnowledgeIntentId;
  examples: string[];
  response: LocalizedResponse;
  experience: KnowledgeExperience;
}

export interface ChampionPathStep {
  label: "DISCOVER" | "CONNECT" | "CONTRIBUTE" | "INSPIRE";
  copy: LocalizedResponse;
}
