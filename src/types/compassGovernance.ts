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
  category: string;
  language?: GovernanceLanguage;
}

// ── SKO bilingual governance ──────────────────────────────────────────────────

export type SkoKnowledgeCategory =
  | "Compass"
  | "Sales Enablement"
  | "Podcast"
  | "Clip Summary"
  | "Geo"
  | "AI Tools"
  | "Action Items"
  | "Fallback";

export interface SkoKnowledgeRecord {
  id: string;
  intent: string;
  category: SkoKnowledgeCategory;
  experience: "sko";
  languages: GovernanceLanguage[];
  examples: Partial<Record<GovernanceLanguage, string[]>>;
  response: Partial<Record<GovernanceLanguage, string>>;
  active: boolean;
  status: KnowledgeStatus;
  priority: number;
  tags: string[];
  geoId?: string;
  createdAt: string;
  updatedAt: string;
  updatedBy?: string;
}

export type TranslationMemoryCategory =
  | "ui"
  | "summary"
  | "podcast"
  | "clip"
  | "voice"
  | "product";

export interface TranslationMemoryRecord {
  id: string;
  sourceText: string;
  translatedText: string;
  sourceLanguage: "en-US";
  targetLanguage: "zh-CN";
  category: TranslationMemoryCategory;
  notes?: string;
  approved: boolean;
  createdAt: string;
  updatedAt: string;
}

export type SkoSummaryContentType = "podcast" | "clip" | "segment" | "dailyRecap";

export type SkoSummaryGeo =
  | "global"
  | "americas"
  | "apac"
  | "emea"
  | "japan"
  | "gcg"
  | "hk";

export interface SkoGovernanceSummaryRecord {
  id: string;
  contentId: string;
  contentType: SkoSummaryContentType;
  title: string;
  geo: SkoSummaryGeo;
  sourceLanguage: "en-US";
  availableLanguages: GovernanceLanguage[];
  summary: Partial<Record<GovernanceLanguage, string>>;
  keyTakeaways: Partial<Record<GovernanceLanguage, string[]>>;
  actionItems: Partial<Record<GovernanceLanguage, string[]>>;
  transcriptUrl?: string;
  videoUrl?: string;
  audioUrl?: string;
  status: "draft" | "review" | "approved" | "retired";
  createdAt: string;
  updatedAt: string;
}
