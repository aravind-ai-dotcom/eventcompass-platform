import { buildPersonMatchReasons } from "@/lib/personIntelligence";
import { humanizeScoringReason } from "@/lib/sessionRecommendationLine";

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

/** Domains and product skills safe to show when identity is camouflaged. */
export function personSkillDomainTags(
  person: PersonLike & { profile?: { community_interests?: string[] } },
): string[] {
  const domains = person.profile?.domains ?? [];
  const products = person.profile?.products ?? [];
  return [...new Set([...domains, ...products])].slice(0, 6);
}

export function deriveIntentSnapshot(person: PersonLike): string[] {
  const items: string[] = [];
  if (person.attendance?.available_for_1x1) {
    items.push("Open to technical conversations");
  }
  const title = (person.title ?? "").toLowerCase();
  if (/champion|ibm champion/i.test(title)) {
    items.push("IBM Champion — mentorship and community leadership");
  }
  if (/mentor/.test(title)) {
    items.push("Open to mentoring conversations");
  }
  if (/alumni|graduate/.test(title)) {
    items.push("Open to alumni connections");
  }
  if (/career|talent|hiring|recruit/.test(title)) {
    items.push("Open to career conversations");
  }
  if (/certif|credential|exam prep/i.test(title)) {
    items.push("Certification support and study guidance");
  }
  if (/community|advocate|leader/.test(title) && !items.some(i => i.includes("IBM Community"))) {
    items.push("Active in IBM Community programs");
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
  return buildPersonMatchReasons(person, profileSignals).slice(0, 3);
}

/** Single primary WHY line for people cards. */
export function primaryMatchReason(
  person: PersonLike,
  profileSignals: string[] = [],
): string | null {
  const reasons = buildPersonMatchReasons(person, profileSignals);
  if (reasons[0]) return reasons[0];
  if (person.compass_reasons?.[0]) {
    return humanizeScoringReason(person.compass_reasons[0]);
  }
  return null;
}
