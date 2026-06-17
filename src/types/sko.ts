// =============================================================================
// Compass SKO — Firestore data model types
// =============================================================================

export const SKO_EDITION_ID = "sko2h-2026";

export type SkoAccessType = "seller" | "partner" | "se_team";

export type SkoGeoId = "EMEA" | "APAC" | "Americas" | "Japan";

export type SkoTechnologyTrack =
  | "Hybrid Cloud"
  | "AI"
  | "Automation"
  | "Transaction Processing";

export type SkoGoal =
  | "Pipeline Growth"
  | "Technical Confidence"
  | "Partner Selling"
  | "Client Engagement"
  | "Product Knowledge"
  | "Competitive Positioning"
  | "Executive Conversations"
  | "Value Creation"
  | "Select"
  | "Horizon";

export type SkoDomain =
  | "Technology"
  | "Software"
  | "Infrastructure"
  | "Ecosystem"
  | "Consulting";

export type SkoExperienceLevel =
  | "Intern / Early Career"
  | "New Seller"
  | "Experienced Seller"
  | "Senior Seller"
  | "Manager / Leader";

export type SkoJobTitle =
  | "Account Executive"
  | "Account Managing Director"
  | "Account Technical Leader"
  | "Senior Account Technical Leader"
  | "Technology Sales Leader"
  | "Brand Technical Specialist"
  | "Brand Technical Sales Specialist"
  | "Territory Sales Specialist"
  | "Partner Technical Specialist"
  | "Client Engineer"
  | "Intern"
  | "Associate Seller"
  | "Early Career Seller"
  | "Sales Manager"
  | "Ecosystem Seller";

export interface SkoUserProfile {
  uid: string;
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
  slackHandle?: string;
  accessType: SkoAccessType;
  geoId?: SkoGeoId | string;
  marketId?: string;
  personaId?: string;
  jobTitle?: SkoJobTitle | string;
  domain?: SkoDomain | string;
  technologyTracks?: SkoTechnologyTrack[];
  goals?: SkoGoal[];
  verticals?: string[];
  partnerFocus?: boolean;
  experienceLevel?: SkoExperienceLevel | string;
  product?: "sko";
  createdAt?: string;
  updatedAt?: string;
  lastLoginAt?: string;
  profileComplete: boolean;
}

export interface SkoEdition {
  id: string;
  label: string;
  theme: string;
  headline: string;
  startDate: string;
  endDate: string;
  active: boolean;
}

export interface SkoGeo {
  id: string;
  editionId: string;
  name: SkoGeoId | string;
  date: string;
  deliveryType: "Live" | "Virtual";
  cityLabel: string;
  imageUrl?: string;
  status: "upcoming" | "live" | "completed";
}

export interface SkoMarket {
  id: string;
  geoId: string;
  label: string;
  name: string;
  flag?: string;
  sortOrder: number;
  active: boolean;
}

export interface SkoSellerPersona {
  id: string;
  title: string;
  description: string;
  exampleRoles: string[];
  sortOrder: number;
  active: boolean;
}

export type SkoSpeakerType =
  | "General Manager"
  | "Client Executive"
  | "Partner Executive"
  | "Technology Leader"
  | "AI Specialist"
  | "Architecture Lead"
  | "Marketplace Lead"
  | "Sales Enablement Lead"
  | "Client Engineering Lead"
  | "SME";

export interface SkoSpeaker {
  id: string;
  firstName: string;
  lastName: string;
  displayName: string;
  title: string;
  organization: string;
  type: SkoSpeakerType | string;
  geoId?: string;
  marketId?: string;
  imageUrl?: string;
  w3Url?: string;
  linkedinUrl?: string;
  slackHandle?: string;
  relatedContentIds?: string[];
}

export type SkoAgendaType =
  | "opening"
  | "conversation"
  | "strategy"
  | "frontiers"
  | "product"
  | "tools"
  | "community"
  | "platform"
  | "partner"
  | "recharge";

export interface SkoContentItem {
  id: string;
  editionId: string;
  geoId: string;
  agendaOrder: number;
  title: string;
  agendaType: SkoAgendaType | string;
  description: string;
  durationMinutes: number;
  videoProvider?: "media_center" | "youtube" | "hosted";
  videoUrl?: string;
  mediaCenterUrl?: string;
  fallbackYoutubeUrl?: string;
  transcriptStatus?: "none" | "pending" | "ready";
  speakerIds: string[];
  technologyTracks: SkoTechnologyTrack[];
  personas: string[];
  goals: SkoGoal[];
  status: "draft" | "review" | "published" | "retired";
  createdAt: string;
  updatedAt: string;
}

export type SkoAssetType =
  | "video"
  | "pdf"
  | "pptx"
  | "docx"
  | "newsroom"
  | "seismic"
  | "transcript";

export interface SkoContentAsset {
  id: string;
  contentId: string;
  type: SkoAssetType;
  label: string;
  url: string;
  sourceSystem?: string;
  icon?: string;
}

export interface SkoContentClip {
  id: string;
  contentId: string;
  startTime: string;
  endTime?: string;
  title: string;
  teaserQuote: string;
  whyItMatters: string;
  suggestedAction: string;
  transcriptExcerpt?: string;
  speakerId?: string;
  sourceAudioUrl?: string;
  clipAudioUrl?: string;
  personas: string[];
  technologyTracks: SkoTechnologyTrack[];
  goals: SkoGoal[];
  addedCount: number;
  savedCount: number;
}

export type SkoIngestStatus =
  | "created"
  | "assets_uploaded"
  | "agenda_validated"
  | "transcript_segmented"
  | "knowledge_built"
  | "narratives_ready"
  | "podcast_ready"
  | "published"
  | "needs_review";

export interface SkoIngestJob {
  id: string;
  editionId: string;
  geoId: string;
  contentItemId: string;
  status: SkoIngestStatus;
  uploadedBy?: string;
  videoUrl?: string;
  mp4FileUrl?: string;
  mp3FileUrl?: string;
  transcriptFileUrl?: string;
  srtFileUrl?: string;
  vttFileUrl?: string;
  pptUrl?: string;
  pdfUrl?: string;
  agendaValidated: boolean;
  speakerValidated: boolean;
  transcriptSegmented: boolean;
  aiTagged: boolean;
  clipsGenerated: boolean;
  narrativesGenerated: boolean;
  podcastGenerated: boolean;
  published: boolean;
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

export interface SkoPulseMetrics {
  id: string;
  editionId: string;
  geoId: string;
  marketId?: string;
  nps?: number | null;
  attendanceRate?: number | null;
  watchedLiveRate?: number | null;
  participationRate?: number | null;
  narrativesGenerated?: number | null;
  minutesDelivered?: number | null;
  topMarket?: string;
  topAgendaSegments?: string[];
  updatedAt: string;
  sourceLabel?: string;
}

export interface SkoPulseQuote {
  id: string;
  editionId: string;
  geoId: string;
  quote: string;
  attributionLabel: string;
  marketId?: string;
  roleLabel?: string;
  approved: boolean;
  sortOrder: number;
}

export interface SkoBrief {
  id: string;
  userId: string;
  editionId: string;
  geoId: string;
  marketId?: string;
  title: string;
  summary: string;
  generatedAt: string;
  sourceContentIds: string[];
  sourceClipIds: string[];
  status: "draft" | "ready" | "archived";
}

export interface SkoBriefItem {
  id: string;
  briefId: string;
  contentId: string;
  clipId?: string;
  addedByUser: boolean;
  title: string;
  excerpt: string;
  whyItMatters: string;
  suggestedAction: string;
  sortOrder: number;
}

export type SkoPodcastFormat =
  | "quick_brief_3min"
  | "seller_podcast_15min"
  | "deep_dive_45min"
  | "executive_brief_10min";

export type SkoPodcastLanguage = "en-US" | "zh-CN" | "zh-TW";

export interface SkoPodcast {
  id: string;
  briefId?: string;
  userId: string;
  editionId: string;
  geoId: string;
  language: SkoPodcastLanguage;
  format: SkoPodcastFormat;
  voice?: string;
  script?: string;
  audioUrl?: string;
  durationMinutes: number;
  generatedAt: string;
}

export interface SkoSeatReservation {
  id: string;
  userId: string;
  editionId: string;
  geoId: string;
  marketId?: string;
  status: "reserved" | "cancelled" | "attended";
  reservedAt: string;
}

export const SKO_TECHNOLOGY_TRACKS: SkoTechnologyTrack[] = [
  "Hybrid Cloud",
  "AI",
  "Automation",
  "Transaction Processing",
];

export const SKO_GOALS: SkoGoal[] = [
  "Pipeline Growth",
  "Technical Confidence",
  "Partner Selling",
  "Client Engagement",
  "Product Knowledge",
  "Competitive Positioning",
  "Executive Conversations",
  "Value Creation",
  "Select",
  "Horizon",
];

export const SKO_DOMAINS: SkoDomain[] = [
  "Technology",
  "Software",
  "Infrastructure",
  "Ecosystem",
  "Consulting",
];

export const SKO_EXPERIENCE_LEVELS: SkoExperienceLevel[] = [
  "Intern / Early Career",
  "New Seller",
  "Experienced Seller",
  "Senior Seller",
  "Manager / Leader",
];

export const SKO_JOB_TITLES: SkoJobTitle[] = [
  "Account Executive",
  "Account Managing Director",
  "Account Technical Leader",
  "Senior Account Technical Leader",
  "Technology Sales Leader",
  "Brand Technical Specialist",
  "Brand Technical Sales Specialist",
  "Territory Sales Specialist",
  "Partner Technical Specialist",
  "Client Engineer",
  "Intern",
  "Associate Seller",
  "Early Career Seller",
  "Sales Manager",
  "Ecosystem Seller",
];

export const SKO_PODCAST_FORMATS: { id: SkoPodcastFormat; label: string; minutes: number }[] = [
  { id: "quick_brief_3min", label: "Quick Brief", minutes: 3 },
  { id: "seller_podcast_15min", label: "Seller Podcast", minutes: 15 },
  { id: "deep_dive_45min", label: "Deep Dive", minutes: 45 },
  { id: "executive_brief_10min", label: "Executive Brief", minutes: 10 },
];

export const SKO_UI_LABELS_ZH: Record<string, string> = {
  "Podcast Summary": "播客摘要",
  "Clip Summary": "视频片段摘要",
  "Listen in Chinese": "中文收听",
  "Read in Chinese": "中文阅读",
  "Generate Chinese Summary": "生成中文摘要",
  "Key Takeaways": "关键要点",
  "Action Items": "行动建议",
  "Next Best Move": "下一步推荐",
};
