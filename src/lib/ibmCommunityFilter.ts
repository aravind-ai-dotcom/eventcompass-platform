import type { IbmCommunity } from "@/data/ibmCommunities";

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function communityBlob(c: IbmCommunity): string {
  return normalize(
    [
      c.name,
      c.category,
      c.primary_product,
      c.type,
      ...c.tags,
      ...c.domains,
      ...c.tracks,
      ...c.products,
      ...c.topics,
      ...c.recommended_roles,
    ].join(" "),
  );
}

function keywordMatches(community: IbmCommunity, keyword: string): boolean {
  const blob = communityBlob(community);
  const token = normalize(keyword);
  if (!token) return false;
  return blob.includes(token) || token.split(" ").every(part => part.length > 1 && blob.includes(part));
}

export interface CommunityFilterFacets {
  categories: string[];
  keywords: string[];
}

/** Build selectable filter chips from the catalog (scales to hundreds of records). */
export function buildCommunityFilterFacets(communities: IbmCommunity[]): CommunityFilterFacets {
  const categorySet = new Set<string>();
  const keywordCounts = new Map<string, number>();

  const addKeyword = (raw: string) => {
    const label = raw.trim();
    if (!label || label.length < 2) return;
    const key = label.toLowerCase();
    keywordCounts.set(key, (keywordCounts.get(key) ?? 0) + 1);
  };

  for (const c of communities) {
    categorySet.add(c.category);
    for (const tag of c.tags) addKeyword(tag);
    for (const domain of c.domains) addKeyword(domain);
    for (const track of c.tracks) addKeyword(track);
    addKeyword(c.primary_product);
  }

  const categories = [...categorySet].sort((a, b) => a.localeCompare(b));
  const keywords = [...keywordCounts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([key]) => {
      for (const c of communities) {
        for (const tag of [...c.tags, ...c.domains, ...c.tracks, c.primary_product]) {
          if (tag.toLowerCase() === key) return tag;
        }
      }
      return key;
    });

  return { categories, keywords };
}

export function filterIbmCommunities(
  communities: IbmCommunity[],
  category: string | null,
  keywords: string[],
): IbmCommunity[] {
  return communities.filter(c => {
    if (category && c.category !== category) return false;
    if (keywords.length === 0) return true;
    return keywords.every(kw => keywordMatches(c, kw));
  });
}
