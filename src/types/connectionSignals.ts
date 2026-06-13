export interface InboundConnectionSignal {
  id: string;
  fromFirstName: string;
  topic: string;
  /** Match saved champion by first name (case-insensitive) for mutual state */
  anchorFirstName: string;
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
