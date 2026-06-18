// =============================================================================
// Voice Intelligence — Firestore voice_knowledge documents
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

export interface VoiceKnowledgeRecord {
  id: string;
  category: VoiceKnowledgeCategory;
  title: string;
  trigger_phrases: string[];
  response: string;
  enabled: boolean;
  /** Routes persona / event / compass conversation topics in the classifier. */
  topic_key?: string;
  updated_by?: string;
  updated_at: string;
}

export interface VoiceKnowledgeMatch {
  record: VoiceKnowledgeRecord;
  score: number;
  matchedPhrase: string;
}
