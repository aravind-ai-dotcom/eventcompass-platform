import { IBM_COMMUNITIES, type IbmCommunity } from "@/data/ibmCommunities";

export interface IbmCommunityMatchInput {
  tracks?: string[];
  topics?: string[];
  goals?: string[];
  products?: string[];
  roles?: string[];
  intentKeywords?: string[];
  /** Override catalog (e.g. Firestore-loaded). Defaults to bundled seed. */
  catalog?: IbmCommunity[];
  limit?: number;
}

export interface ScoredIbmCommunity extends IbmCommunity {
  matchScore: number;
  matchReasons: string[];
}

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function tokens(text: string): string[] {
  return normalize(text).split(" ").filter(t => t.length > 1);
}

function overlaps(a: string, b: string): boolean {
  const na = normalize(a);
  const nb = normalize(b);
  if (!na || !nb) return false;
  return na.includes(nb) || nb.includes(na);
}

function scoreFieldOverlap(
  attendeeValues: string[],
  communityValues: string[],
  label: string,
  reasons: string[],
): number {
  let score = 0;
  for (const attendee of attendeeValues) {
    for (const community of communityValues) {
      if (overlaps(attendee, community)) {
        score += 3;
        const reason = `${label}: ${community}`;
        if (!reasons.includes(reason)) reasons.push(reason);
      }
    }
  }
  return score;
}

export function recommendIbmCommunities(input: IbmCommunityMatchInput): ScoredIbmCommunity[] {
  const catalog = input.catalog ?? IBM_COMMUNITIES;
  const attendeeTracks = [...(input.tracks ?? []), ...(input.goals ?? [])];
  const attendeeTopics = [...(input.topics ?? []), ...(input.goals ?? []), ...(input.intentKeywords ?? [])];
  const attendeeProducts = input.products ?? [];
  const attendeeRoles = input.roles ?? [];
  const limit = input.limit ?? 4;

  const scored = catalog.map(community => {
    const matchReasons: string[] = [];
    let matchScore = 0;

    matchScore += scoreFieldOverlap(attendeeTracks, community.tracks, "Track", matchReasons);
    matchScore += scoreFieldOverlap(attendeeTopics, community.topics, "Topic", matchReasons);
    matchScore += scoreFieldOverlap(attendeeProducts, community.products, "Product", matchReasons);
    matchScore += scoreFieldOverlap(attendeeTracks, community.domains, "Domain", matchReasons);
    matchScore += scoreFieldOverlap(attendeeTopics, community.tags, "Tag", matchReasons);
    matchScore += scoreFieldOverlap(attendeeRoles, community.recommended_roles, "Role", matchReasons);
    matchScore += scoreFieldOverlap(attendeeTracks, [community.category], "Category", matchReasons);
    matchScore += scoreFieldOverlap(attendeeTopics, [community.primary_product], "Product focus", matchReasons);

    const attendeeBlob = normalize([
      ...attendeeTracks,
      ...attendeeTopics,
      ...attendeeProducts,
      ...attendeeRoles,
    ].join(" "));

    for (const tag of [...community.tags, ...community.domains]) {
      for (const token of tokens(tag)) {
        if (token.length >= 3 && attendeeBlob.includes(token)) {
          matchScore += 1;
          const reason = `Tag: ${tag}`;
          if (!matchReasons.includes(reason)) matchReasons.push(reason);
        }
      }
    }

    return { ...community, matchScore, matchReasons: matchReasons.slice(0, 3) };
  })
    .filter(c => c.matchScore > 0)
    .sort((a, b) => b.matchScore - a.matchScore);

  if (scored.length === 0) {
    return catalog.slice(0, limit).map(c => ({
      ...c,
      matchScore: 0,
      matchReasons: ["Popular IBM Community destination"],
    }));
  }

  return scored.slice(0, limit);
}

export function formatMemberCount(count?: number): string | null {
  if (count == null) return null;
  if (count >= 1000) return `${Math.round(count / 1000)}k+ members`;
  return `${count.toLocaleString()} members`;
}
