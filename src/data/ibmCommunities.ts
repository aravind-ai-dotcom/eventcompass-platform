// IBM TechXchange Community catalog — normalized for Firestore + Compass matching
import seedCatalog from "../seeds/ibm-techxchange-communities.seed.json";

export type IbmCommunityType = "Topic Group" | "User Group" | "Program";

export type IbmCommunityCategory =
  | "AI"
  | "Automation"
  | "Data"
  | "Security"
  | "Sustainability"
  | "Cloud"
  | "IBM Z & LinuxONE"
  | "Power"
  | "Storage"
  | "IBM Champions"
  | "IBM Japan";

export type IbmCommunityVisibility = "view_only";

export type IbmCommunityTrack =
  | "AI"
  | "Application Development"
  | "Application Integration"
  | "Business Management & FinOps"
  | "Cloud"
  | "Data"
  | "Data Security & IAM"
  | "IBM Z & LinuxONE"
  | "IT Optimization & Automation"
  | "Power"
  | "Red Hat"
  | "Storage";

export interface IbmTechXchangeCommunity {
  community_id: string;
  name: string;
  category: IbmCommunityCategory | string;
  visibility: IbmCommunityVisibility;
  primary_product: string;
  tags: string[];
  domains: string[];
  recommended_roles: string[];
  recommended_tracks: IbmCommunityTrack[] | string[];
  is_active: boolean;
  source: "ibm_techxchange_communities";
}

/** UI-facing community shape (legacy + Compass cards). */
export interface IbmCommunity {
  community_id: string;
  name: string;
  type: IbmCommunityType;
  category: string;
  description: string;
  url: string;
  topics: string[];
  products: string[];
  tracks: string[];
  tags: string[];
  domains: string[];
  recommended_roles: string[];
  visibility: IbmCommunityVisibility;
  primary_product: string;
  member_count?: number;
  thread_count?: number;
  library_count?: number;
}

export const IBM_COMMUNITY_METRICS = {
  members: "500k+",
  topicGroups: "200+",
  userGroups: "250+",
} as const;

/** Demo display names when seed catalog is shown */
export const FORGE_COMMUNITY_DISPLAY_NAMES = [
  "AI Builders Guild",
  "Cloud Architects Network",
  "Data Innovators Forum",
  "Security Collective",
  "Platform Engineering Community",
  "Product Leaders Exchange",
  "Women Building Technology",
  "Startup Founders Circle",
  "Future Technologies Network",
  "Developer Experience Guild",
  "Modern Infrastructure Forum",
  "Digital Transformation Network",
] as const;

export const IBM_TECHXCHANGE_COMMUNITIES: IbmTechXchangeCommunity[] =
  seedCatalog as IbmTechXchangeCommunity[];

const CATEGORY_URL_SEGMENT: Record<string, string> = {
  AI: "ai",
  Automation: "automation",
  Data: "data",
  Security: "security",
  Cloud: "cloud",
  Power: "power",
  Storage: "storage",
  "IBM Champions": "champions",
};

function categoryToType(category: string): IbmCommunityType {
  if (category === "IBM Champions") return "Program";
  return "Topic Group";
}

function communityUrl(category: string): string {
  const segment = CATEGORY_URL_SEGMENT[category] ?? "home";
  return `https://community.ibm.com/community/user/${segment}`;
}

function buildDescription(c: IbmTechXchangeCommunity): string {
  const focus = c.domains.length > 0 ? c.domains.join(", ") : c.category;
  return `${c.name} — practitioners focused on ${focus}. Continue the conversation in your community after FORGE.`;
}

function toIbmCommunity(c: IbmTechXchangeCommunity): IbmCommunity {
  const topics = [...new Set([...c.tags, ...c.domains])];
  return {
    community_id: c.community_id,
    name: c.name,
    type: categoryToType(c.category),
    category: c.category,
    description: buildDescription(c),
    url: communityUrl(c.category),
    topics,
    products: [c.primary_product],
    tracks: [...c.recommended_tracks],
    tags: c.tags,
    domains: c.domains,
    recommended_roles: c.recommended_roles,
    visibility: c.visibility,
    primary_product: c.primary_product,
  };
}

export function mapTechXchangeCommunityToIbmCommunity(c: IbmTechXchangeCommunity): IbmCommunity {
  return toIbmCommunity(c);
}

/** Map a Firestore communities doc to the UI catalog shape. */
export function mapFirestoreCommunityDoc(raw: Record<string, unknown>): IbmCommunity | null {
  const communityId = String(raw.community_id ?? raw.id ?? "").trim();
  if (!communityId || raw.is_active === false) return null;

  const seedLike: IbmTechXchangeCommunity = {
    community_id: communityId,
    name: String(raw.name ?? communityId),
    category: String(raw.category ?? "AI"),
    visibility: (raw.visibility as IbmTechXchangeCommunity["visibility"]) ?? "view_only",
    primary_product: String(raw.primary_product ?? raw.name ?? communityId),
    tags: Array.isArray(raw.tags) ? raw.tags.map(String) : [],
    domains: Array.isArray(raw.domains) ? raw.domains.map(String) : [],
    recommended_roles: Array.isArray(raw.recommended_roles) ? raw.recommended_roles.map(String) : [],
    recommended_tracks: Array.isArray(raw.recommended_tracks) ? raw.recommended_tracks.map(String) : [],
    is_active: raw.is_active !== false,
    source: "ibm_techxchange_communities",
  };

  return toIbmCommunity(seedLike);
}

export const IBM_COMMUNITIES: IbmCommunity[] = IBM_TECHXCHANGE_COMMUNITIES
  .filter(c => c.is_active)
  .map(toIbmCommunity);
