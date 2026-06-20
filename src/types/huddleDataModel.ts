/** Huddle invitation signal — Firestore-backed, not chat. */

export const HUDDLE_CLASSIFICATIONS = [
  "alumni",
  "past_employer",
  "certification",
  "technology",
  "industry",
  "career",
  "community",
  "partner",
  "champion",
  "general",
] as const;

export type HuddleClassification = (typeof HUDDLE_CLASSIFICATIONS)[number];

export const HUDDLE_STATUSES = [
  "scheduled",
  "happening_now",
  "expired",
  "cancelled",
] as const;

export type HuddleStatus = (typeof HUDDLE_STATUSES)[number];

export const HUDDLE_VISIBILITY = ["public", "matched", "private"] as const;
export type HuddleVisibility = (typeof HUDDLE_VISIBILITY)[number];

export const HUDDLE_RESPONSES = ["on_my_way", "interested", "not_for_me"] as const;
export type HuddleResponseType = (typeof HUDDLE_RESPONSES)[number];

export interface HuddleTargetAudience {
  universities?: string[];
  past_employers?: string[];
  roles?: string[];
  tracks?: string[];
  products?: string[];
  certifications?: string[];
}

export interface HuddleDoc {
  id: string;
  event_id: string;
  title: string;
  description: string;
  classification: HuddleClassification;
  topics: string[];
  target_audience: HuddleTargetAudience;
  host_participant_id: string;
  host_name: string;
  date: string;
  start_time: string;
  end_time: string;
  timezone: string;
  location: string;
  status: HuddleStatus;
  visibility: HuddleVisibility;
  on_my_way_count: number;
  on_my_way_names: string[];
  created_at: string;
  updated_at: string;
  expires_at: string;
}

export interface HuddleResponseDoc {
  participant_id: string;
  display_name: string;
  response: HuddleResponseType;
  created_at: string;
  updated_at: string;
}

export interface CreateHuddleInput {
  title: string;
  description: string;
  classification: HuddleClassification;
  topics: string[];
  target_audience: HuddleTargetAudience;
  host_participant_id: string;
  host_name: string;
  date: string;
  start_time: string;
  end_time: string;
  timezone?: string;
  location: string;
  visibility?: HuddleVisibility;
}

export interface HuddleParticipantContext {
  uid: string;
  display_name: string;
  education: { institution: string }[];
  past_employers: { company: string }[];
  networking_identity: {
    open_to_alumni_connections?: boolean;
    open_to_past_colleague_connections?: boolean;
    open_to_career_conversations?: boolean;
    open_to_university_connections?: boolean;
  };
  consent: {
    discoverable?: boolean;
    public_profile?: boolean;
    share_with_matched_attendees?: boolean;
    allow_alumni_matching?: boolean;
    allow_employer_matching?: boolean;
  };
  event_signal_profile?: {
    goals?: string[];
    tech_tracks?: string[];
    roles_at_txc?: string[];
  };
  certification_goals?: string[];
  career_interests?: string[];
  compass_intelligence?: { matching_keywords?: string[] };
}

export interface MatchedHuddle extends HuddleDoc {
  match_score: number;
  match_reasons: string[];
  user_response?: HuddleResponseType;
  session_conflict?: string;
}
