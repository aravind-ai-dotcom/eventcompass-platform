/** What a speaker is open to discussing — extensible for future meet-context fields. */
export const SPEAKER_AVAILABLE_FOR = [
  "networking",
  "certification_guidance",
  "architecture_discussion",
  "product_expertise",
  "career_advice",
  "community_leadership",
  "mentorship",
] as const;

export type SpeakerAvailableFor = (typeof SPEAKER_AVAILABLE_FOR)[number];

export const SPEAKER_AVAILABLE_FOR_LABELS: Record<SpeakerAvailableFor, string> = {
  networking: "Networking",
  certification_guidance: "Certification Guidance",
  architecture_discussion: "Architecture Discussion",
  product_expertise: "Product Expertise",
  career_advice: "Career Advice",
  community_leadership: "Community Leadership",
  mentorship: "Mentorship",
};

export interface SpeakerProfile {
  id: string;
  displayName: string;
  title?: string;
  organization?: string;
  sessionIds: string[];
  sessionTitles: string[];
  topics: string[];
  tracks: string[];
  isChampion: boolean;
  communities: string[];
  expertiseAreas: string[];
  availableFor: SpeakerAvailableFor[];
  championId?: string;
  linkedinUrl?: string;
  photoUrl?: string;
  /** Future-ready */
  relatedMeetupIds?: string[];
  relatedHuddleIds?: string[];
  sharedCertificationGoals?: string[];
}

export interface ScoredSpeaker extends SpeakerProfile {
  compassScore: number;
  whyMeet: string[];
  /** Primary expertise label for compact UI, e.g. "AI Governance Expert" */
  expertiseLabel?: string;
}

export type SpeakerHuddleRole = "hosting" | "attending";
