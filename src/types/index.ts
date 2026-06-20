export interface Participant {
  id?: string;
  participant_id?: string;
  display_name?: string;
  first_name?: string;
  last_name?: string;
  job_title?: string;
  role?: string;
  company?: string;

  registration?: {
    industry?: string;
    [key: string]: unknown;
  };

  event_signal_profile?: {
    roles_at_txc?: string[];
    tech_tracks?: string[];
    goals?: string[];
    open_to?: string[];
    intent?: {
      needs?: string[];
      contribution?: string[];
      aspiration?: string[];
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };

  compass_intelligence?: {
    matching_keywords?: string[];
    persona_tags?: string[];
    interest_tags?: string[];
    industry_tags?: string[];
    need_tags?: string[];
    [key: string]: unknown;
  };

  [key: string]: unknown;
}

export type NextBestMoveType =
  | "session"
  | "champion"
  | "community"
  | "break"
  | "explore"
  | "register"
  | "profile"
  | "certification_goal";

export interface NextBestMove {
  type: NextBestMoveType;
  headline: string;
  subline: string;
  reason: string;
  whyItMatters?: string;
  score?: number;
  entityId?: string;
  ctaLabel?: string;
  ctaHref?: string;
  priority?: 1 | 2 | 3 | 4 | 5 | 6;
}

export interface ScoredSession {
  id: string;
  title: string;

  session_type?: string;
  activity_type?: string;

  tracks?: {
    primary_track?: string;
    secondary_tracks?: string[];
    topics?: string[];
    products?: string[];
  };

  schedule?: {
    day?: string;
    date?: string;
    start_time?: string;
    end_time?: string;
    room?: string;
  };

  compass_score?: number;
  compass_reasons?: string[];
}

export interface ScoredChampion {
  id: string;
  display_name: string;
  title?: string;
  organization?: string;
  company?: string;
  compass_score?: number;
  shared_keywords?: string[];
}