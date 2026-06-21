export type ConnectionBadgeId =
  | "champion"
  | "speaker"
  | "alumni"
  | "peer"
  | "partner"
  | "mentor"
  | "community-leader"
  | "certification-guide";

export interface InboundConnectionSignal {
  id: string;
  fromFirstName: string;
  /** Full name when available (demo + production enrichment). */
  fromDisplayName?: string;
  topic: string;
  /** Match saved champion by first name (case-insensitive) for mutual state */
  anchorFirstName: string;
  /** Optional champion id when inbound maps to a recommended person */
  anchorChampionId?: string;
  organization?: string;
  domains?: string[];
  intentSnapshot?: string[];
  whyInterested?: string;
}

export interface SavedPersonSignal {
  id: string;
  displayName: string;
  title?: string;
  organization?: string;
  domains?: string[];
  matchReasons?: string[];
  intentSnapshot: string[];
  mutual: boolean;
}
