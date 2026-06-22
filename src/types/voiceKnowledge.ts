// =============================================================================
// Voice Intelligence — Firestore voice_knowledge documents
// Canonical TXC Voice Compass knowledge (includes migrated official FAQ-lite)
// =============================================================================

export type VoiceKnowledgeCategory =
  | "Event Knowledge"
  | "Persona Guidance"
  | "Fun & Social"
  | "Certifications"
  | "Compass Personality"
  | "Event Scope"
  | "Fallback Responses";

export const VOICE_KNOWLEDGE_CATEGORIES: VoiceKnowledgeCategory[] = [
  "Event Knowledge",
  "Persona Guidance",
  "Fun & Social",
  "Certifications",
  "Compass Personality",
  "Event Scope",
  "Fallback Responses",
];

export type VoiceKnowledgeRedirectType =
  | "answer"
  | "official_faq"
  | "guest_services"
  | "external_site";

export type VoiceIntentCategory =
  | "EVENT_OVERVIEW"
  | "REGISTRATION_HELP"
  | "ACCESSIBILITY_HELP"
  | "ONSITE_EXPERIENCE"
  | "HOTEL_HELP"
  | "TRAVEL_HELP"
  | "PARTNER_EVENT_HELP"
  | "COMMUNITY_HELP"
  | "CERTIFICATION_HELP"
  | "SCHEDULE_HELP"
  | "SESSION_HELP"
  | "PEOPLE_HELP"
  | "NAVIGATION_HELP"
  | "FALLBACK_HELP";

export interface VoiceKnowledgeRecord {
  id: string;
  category: VoiceKnowledgeCategory;
  /** Canonical prompt / question */
  title: string;
  /** Spoken match phrases (sample utterances) */
  trigger_phrases: string[];
  /** Full voice response (compact; may include redirect suffix) */
  response: string;
  /** UI display text — usually the short answer */
  display_response?: string;
  enabled: boolean;
  /** Routes persona / event / compass conversation topics in the classifier. */
  topic_key?: string;
  /** Voice intent id, e.g. REGISTRATION_LOGIN_HELP */
  intent?: string;
  /** High-level voice routing category */
  intent_category?: VoiceIntentCategory;
  /** FAQ-lite category id, e.g. event_overview */
  faq_category_id?: string;
  redirect_type?: VoiceKnowledgeRedirectType;
  source_url?: string;
  contact_email?: string;
  tags?: string[];
  priority?: number;
  source?: string;
  updated_by?: string;
  updated_at: string;
}

export interface VoiceKnowledgeCategoryMeta {
  category_id: string;
  label: string;
  purpose: string;
  display_order: number;
}

export interface VoiceKnowledgeMatch {
  record: VoiceKnowledgeRecord;
  score: number;
  matchedPhrase: string;
}
