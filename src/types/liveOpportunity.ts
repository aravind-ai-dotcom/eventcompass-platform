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
  /** Display-friendly clock time, e.g. 2:30 PM */
  startTime?: string;
  endTime?: string;
  /** ISO — when the catchup begins */
  scheduledAt?: string;
  /** ISO — auto-close after 30 minutes */
  expiresAt?: string;
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
  /** Host is a known session speaker / expert */
  speakerRole?: "hosting" | "attending";
  /** Matched speaker display name for badge copy */
  speakerAttendeeName?: string;
  /** Saved session title if huddle overlaps reserved agenda */
  sessionConflict?: string;
  /** Firestore huddle classification */
  classification?: string;
  /** Current user's response */
  userResponse?: string;
}
