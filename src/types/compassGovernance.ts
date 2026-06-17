// =============================================================================
// Compass Knowledge + Voice Governance — Firestore document models
// =============================================================================

export type KnowledgeCategory =
  | "Compass"
  | "Champion"
  | "Certification"
  | "Partner"
  | "Event Logistics"
  | "Networking"
  | "Fun"
  | "Privacy"
  | "Fallback";

export type KnowledgeStatus = "draft" | "active" | "retired";

export type GovernanceLanguage = "en-US" | "zh-CN";

export interface TechXchangeKnowledgeRecord {
  id: string;
  intent: string;
  category: KnowledgeCategory;
  experience: "techxchange";
  language: "en-US";
  examples: string[];
  response: string;
  active: boolean;
  status: KnowledgeStatus;
  priority: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  updatedBy?: string;
}

export interface VoiceDictionaryRecord {
  id: string;
  displayText: string;
  spokenText: string;
  experience: "techxchange" | "sko";
  language: GovernanceLanguage;
  active: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SttNormalizationRecord {
  id: string;
  canonicalText: string;
  heardAs: string[];
  experience: "techxchange" | "sko";
  language: GovernanceLanguage;
  active: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeAnalyticsRecord {
  id?: string;
  rawQuestion: string;
  normalizedQuestion?: string;
  matchedIntent?: string;
  confidence?: number;
  experience: "techxchange" | "sko";
  language: GovernanceLanguage;
  source: "typed" | "voice";
  createdAt: string;
}

export interface KnowledgeMatchResult {
  knowledgeId: string;
  intent: string;
  response: string;
  confidence: number;
  category: KnowledgeCategory;
}
