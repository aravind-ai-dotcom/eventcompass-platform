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
  /** First names shown in "Joined:" line */
  joinedNames: string[];
  participantIds?: string[];
  tags?: string[];
  source: LiveOpportunitySource;
  emoji: string;
  status: string;
  matchReasons: string[];
  filterKeys: string[];
}
