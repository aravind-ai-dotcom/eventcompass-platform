import type { ConnectionBadgeId } from "@/types/connectionSignals";

export const SAVE_REASONS = [
  "certification_guidance",
  "technology_discussion",
  "networking",
  "career_advice",
  "mentorship",
  "partnership",
  "potential_customer",
  "community",
  "other",
] as const;

export type SaveReason = (typeof SAVE_REASONS)[number];

export const SAVE_REASON_LABELS: Record<SaveReason, string> = {
  certification_guidance: "Certification Guidance",
  technology_discussion: "Technology Discussion",
  networking: "Networking",
  career_advice: "Career Advice",
  mentorship: "Mentorship",
  partnership: "Partnership",
  potential_customer: "Potential Customer",
  community: "Community",
  other: "Other",
};

/** Relationship vault record — extensible for future meet-context fields. */
export interface ConnectionVaultRecord {
  /** Stable key; matches personId for one record per person. */
  id: string;
  personId: string;
  displayName: string;
  title?: string;
  organization?: string;
  badges: ConnectionBadgeId[];
  saveReason: SaveReason;
  /** ISO 8601 */
  dateAdded: string;
  sharedInterests: string[];
  sharedCommunities: string[];
  sharedCertifications: string[];
  notes: string;
  linkedinUrl?: string;
  email?: string;
  mutual?: boolean;
  /** Future-ready — optional meet context (not populated yet). */
  metAtSession?: string;
  metAtHuddle?: string;
  metAtMeetup?: string;
  sharedCertificationGoal?: string;
  sharedCommunity?: string;
}
