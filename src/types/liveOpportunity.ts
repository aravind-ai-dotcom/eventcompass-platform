export type LiveOpportunitySource =
  | "community"
  | "alumni"
  | "certification"
  | "networking"
  | "ai-generated";

export interface LiveOpportunity {
  id: string;
  category: string;
  title: string;
  description: string;
  location?: string;
  startTime?: string;
  endTime?: string;
  joinedCount: number;
  /** Attendee first names (excludes host) */
  joinedNames: string[];
  participantIds?: string[];
  tags?: string[];
  source: LiveOpportunitySource;
  emoji: string;
  status: string;
  matchReasons: string[];
  filterKeys: string[];
  /** Host display name, e.g. Aravind Ragupathi */
  hostName?: string;
  /** Host first name for avatar initial */
  hostFirstName?: string;
}
