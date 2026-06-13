/** Certification enrichment on session catalog items (activity_type = Certification). */
export interface CertificationSessionFields {
  certification_id?: string;
  certification_code?: string;
  certification_url?: string;
  guide_url?: string;
  certification_level?: "Associate" | "Professional" | "Advanced";
  skills_measured?: string[];
  recommended_background?: string[];
  estimated_preparation_hours?: number;
  supports_certification?: boolean;
  recommended_reason?: string;
  related_session_ids?: string[];
  related_lab_ids?: string[];
  related_champion_ids?: string[];
  related_huddle_ids?: string[];
  related_community_ids?: string[];
}

export interface CertificationJourneyRecord {
  certification_id: string;
  certification_code: string;
  title: string;
  description: string;
  difficulty: string;
  track: string;
  topics: string[];
  products: string[];
  guide_url: string;
  certification_url: string;
  certification_level: "Associate" | "Professional" | "Advanced";
  skills_measured: string[];
  recommended_background: string[];
  estimated_preparation_hours: number;
  session_id: string;
  related_session_ids: string[];
  related_lab_ids: string[];
  related_champion_ids: string[];
  related_huddle_ids: string[];
  related_community_ids: string[];
}
