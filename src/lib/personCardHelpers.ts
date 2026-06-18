import { humanizeMatchReasons, humanizeScoringReason } from "@/lib/sessionRecommendationLine";

interface PersonLike {
  display_name?: string;
  title?: string;
  organization?: string;
  company?: string;
  profile?: { domains?: string[]; products?: string[] };
  attendance?: { available_for_1x1?: boolean };
  compass_reasons?: string[];
}

export function displayFirstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name;
}

export function deriveIntentSnapshot(person: PersonLike): string[] {
  const items: string[] = [];
  if (person.attendance?.available_for_1x1) {
    items.push("Open to technical conversations");
  }
  const title = (person.title ?? "").toLowerCase();
  if (/mentor/.test(title)) {
    items.push("Open to mentoring");
  }
  if (/alumni|graduate/.test(title)) {
    items.push("Open to alumni connections");
  }
  if (/career|talent|hiring|recruit/.test(title)) {
    items.push("Open to career conversations");
  }
  if (/community|advocate|leader/.test(title)) {
    items.push("Open to community conversations");
  }
  const domains = [
    ...(person.profile?.domains ?? []),
    ...(person.profile?.products ?? []),
  ].slice(0, 3);
  if (domains.length > 0) {
    items.push(`Interested in ${domains.join(", ")}`);
  }
  return items.slice(0, 4);
}

export function deriveMatchReasons(
  person: PersonLike,
  profileSignals: string[] = [],
): string[] {
  if (person.compass_reasons?.length) {
    return humanizeMatchReasons(person.compass_reasons.slice(0, 2));
  }
  const domains = person.profile?.domains ?? [];
  if (profileSignals.length > 0 && domains.length > 0) {
    const overlap = domains.filter(d =>
      profileSignals.some(s => d.toLowerCase().includes(s) || s.includes(d.toLowerCase())),
    );
    if (overlap.length > 0) {
      return overlap.slice(0, 2).map(d => `Shared interest in ${d}`);
    }
  }
  if (domains.length > 0) {
    return [`Expertise in ${domains.slice(0, 2).join(" and ")}`];
  }
  return [];
}

/** Single primary WHY line for people cards. */
export function primaryMatchReason(
  person: PersonLike,
  profileSignals: string[] = [],
): string | null {
  const reasons = deriveMatchReasons(person, profileSignals);
  if (reasons[0]) return reasons[0];
  if (person.compass_reasons?.[0]) {
    return humanizeScoringReason(person.compass_reasons[0]);
  }
  return null;
}
