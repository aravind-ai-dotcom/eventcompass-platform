import type { ConnectionBadgeId } from "@/types/connectionSignals";
import { humanizeScoringReason } from "@/lib/sessionRecommendationLine";

export const CONNECTION_BADGE_LABELS: Record<ConnectionBadgeId, string> = {
  champion: "Champion",
  speaker: "Speaker",
  alumni: "Alumni",
  peer: "Peer",
  partner: "Partner",
  mentor: "Mentor",
  "community-leader": "Community Leader",
  "certification-guide": "Certification Guide",
};

interface PersonBadgeInput {
  display_name?: string;
  title?: string;
  organization?: string;
  company?: string;
  profile?: { domains?: string[]; products?: string[] };
  attendance?: { available_for_1x1?: boolean };
  compass_reasons?: string[];
  roles?: string[];
  is_speaker?: boolean;
  education?: Array<{ institution?: string } | string>;
}

export interface ConnectionBadgeContext {
  /** Person is from the champions catalog */
  isChampion?: boolean;
  /** Matched as speaker in session data */
  isSpeaker?: boolean;
  /** Viewer universities for alumni overlap */
  viewerUniversities?: string[];
  /** Viewer employers for colleague overlap */
  viewerEmployers?: string[];
}

function personBlob(person: PersonBadgeInput): string {
  const domains = person.profile?.domains ?? [];
  const products = person.profile?.products ?? [];
  return [
    person.title,
    person.organization,
    person.company,
    ...domains,
    ...products,
    ...(person.roles ?? []),
    ...(person.compass_reasons ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function personUniversities(person: PersonBadgeInput): string[] {
  const edu = person.education ?? [];
  return edu
    .map(e => (typeof e === "string" ? e : e.institution ?? ""))
    .filter(Boolean)
    .map(u => u.toLowerCase());
}

function hasUniversityOverlap(
  person: PersonBadgeInput,
  viewerUniversities: string[],
): boolean {
  if (viewerUniversities.length === 0) return false;
  const theirs = personUniversities(person);
  return theirs.some(u => viewerUniversities.some(v => v === u || u.includes(v) || v.includes(u)));
}

/** Derive connection type badges — reasons live on the card, not separate modules. */
export function deriveConnectionBadges(
  person: PersonBadgeInput,
  context: ConnectionBadgeContext = {},
): ConnectionBadgeId[] {
  const badges: ConnectionBadgeId[] = [];
  const blob = personBlob(person);
  const reasons = (person.compass_reasons ?? []).join(" ").toLowerCase();

  if (context.isChampion === true) {
    badges.push("champion");
  }

  if (
    context.isSpeaker ||
    person.is_speaker ||
    /\bspeaker\b/.test(blob) ||
    /\bspeaker\b/.test(reasons)
  ) {
    badges.push("speaker");
  }

  if (
    reasons.includes("alumni") ||
    /alumni|university|fellow alum/.test(blob) ||
    hasUniversityOverlap(person, context.viewerUniversities ?? [])
  ) {
    badges.push("alumni");
  }

  if (
    person.attendance?.available_for_1x1 ||
    /mentor/.test(blob) ||
    reasons.includes("mentoring")
  ) {
    badges.push("mentor");
  }

  if (
    reasons.includes("certification") ||
    /certif|exam prep|credential/.test(blob)
  ) {
    badges.push("certification-guide");
  }

  if (/community leader|community advocate|user group lead/.test(blob)) {
    badges.push("community-leader");
  }

  if (/business partner|\bpartner\b|ibm partner/.test(blob)) {
    badges.push("partner");
  }

  if (context.isChampion === false && !badges.includes("champion")) {
    badges.push("peer");
  }

  // De-dupe while preserving order; cap visible badges
  return [...new Set(badges)].slice(0, 4);
}

/** Primary recommendation line with optional alumni-specific copy. */
export function formatRecommendedBecause(
  reason: string | null | undefined,
  badges: ConnectionBadgeId[] = [],
): string | null {
  if (badges.includes("alumni") && !reason) {
    return "You share the same university.";
  }
  if (!reason?.trim()) return null;
  const cleaned = humanizeScoringReason(reason.trim());
  if (/^recommended because/i.test(cleaned)) {
    return cleaned.replace(/^recommended because:?\s*/i, "").trim() || null;
  }
  return cleaned;
}
