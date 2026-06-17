// =============================================================================
// Compass Knowledge Response Dictionary — types
// Separate from UI i18n and voice pronunciation dictionaries.
// Future admin: /setup/knowledge
// =============================================================================

export type KnowledgeExperience = "shared" | "techxchange" | "sko";

export type VoiceLocale = "en-US" | "zh-CN";

export type KnowledgeCategory = "COMPASS_KNOWLEDGE" | "EVENT_KNOWLEDGE";

export type KnowledgeIntentId =
  | "what_is_compass"
  | "why_use_compass"
  | "how_to_maximize_event"
  | "cert_prep_with_compass"
  | "champion_match"
  | "champion_path"
  | "fun_recommendation"
  | "setup_huddle"
  | "find_alumni"
  | "edit_intent"
  | "add_more_intent"
  | "repeated_recommendations"
  | "data_security"
  | "partner_guidance"
  | "meals"
  | "champion_playful"
  | "out_of_scope_location"
  | "how_recommendations_work";

export const KNOWLEDGE_INTENT_IDS: readonly KnowledgeIntentId[] = [
  "what_is_compass",
  "why_use_compass",
  "how_to_maximize_event",
  "cert_prep_with_compass",
  "champion_match",
  "champion_path",
  "fun_recommendation",
  "setup_huddle",
  "find_alumni",
  "edit_intent",
  "add_more_intent",
  "repeated_recommendations",
  "data_security",
  "partner_guidance",
  "meals",
  "champion_playful",
  "out_of_scope_location",
  "how_recommendations_work",
] as const;

export interface LocalizedResponse {
  "en-US": string;
  "zh-CN": string;
}

export interface KnowledgeItem {
  intent: KnowledgeIntentId;
  examples: string[];
  response: LocalizedResponse;
  experience: KnowledgeExperience;
  category?: KnowledgeCategory;
  /** Reserved for future admin editing at /setup/knowledge */
  adminEditable?: boolean;
}

export interface ChampionPathStep {
  label: "DISCOVER" | "CONNECT" | "CONTRIBUTE" | "INSPIRE";
  copy: LocalizedResponse;
}

export function isKnowledgeIntentId(value: string): value is KnowledgeIntentId {
  return (KNOWLEDGE_INTENT_IDS as readonly string[]).includes(value);
}
