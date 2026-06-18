import type { RecommendedPerson } from "@/components/people/RecommendedConnectionCard";
import {
  deriveConnectionBadges,
  type ConnectionBadgeContext,
} from "@/lib/connectionBadges";
import type { ConnectionVaultRecord, SaveReason } from "@/types/connectionVault";

function normalizeToken(value: string): string {
  return value.trim().toLowerCase();
}

function overlapTokens(a: string[], b: string[]): string[] {
  if (a.length === 0 || b.length === 0) return [];
  return a.filter(item => {
    const norm = normalizeToken(item);
    return b.some(other => {
      const on = normalizeToken(other);
      return norm.includes(on) || on.includes(norm);
    });
  });
}

export function deriveSharedInterests(
  person: RecommendedPerson,
  viewerSignals: string[],
): string[] {
  const domains = [
    ...(person.profile?.domains ?? []),
    ...(person.profile?.products ?? []),
  ];
  const unique = [...new Set(domains.map(d => d.trim()).filter(Boolean))];
  return overlapTokens(unique, viewerSignals).slice(0, 6);
}

export function deriveSharedCommunities(
  personCommunities: string[] | undefined,
  viewerCommunities: string[],
): string[] {
  return overlapTokens(personCommunities ?? [], viewerCommunities).slice(0, 4);
}

export function deriveSharedCertifications(
  person: RecommendedPerson,
  certificationGoalLabels: string[],
): string[] {
  const blob = [
    ...(person.profile?.domains ?? []),
    ...(person.compass_reasons ?? []),
    person.title ?? "",
  ]
    .join(" ")
    .toLowerCase();
  if (!/certif|credential|exam|badge/.test(blob)) return [];
  return certificationGoalLabels.slice(0, 3);
}

export interface BuildConnectionRecordInput {
  person: RecommendedPerson & {
    linkedin_url?: string;
    email?: string;
    consent?: { show_linkedin?: boolean; show_email?: boolean };
    profile?: {
      domains?: string[];
      products?: string[];
      community_interests?: string[];
    };
  };
  saveReason: SaveReason;
  badgeContext?: ConnectionBadgeContext;
  profileSignals?: string[];
  viewerCommunities?: string[];
  certificationGoalLabels?: string[];
  mutual?: boolean;
  initialNote?: string;
}

export function buildConnectionRecord(input: BuildConnectionRecordInput): ConnectionVaultRecord {
  const {
    person,
    saveReason,
    badgeContext,
    profileSignals = [],
    viewerCommunities = [],
    certificationGoalLabels = [],
    mutual,
    initialNote = "",
  } = input;

  const org = person.organization ?? person.company;
  const linkedinUrl =
    person.consent?.show_linkedin !== false && person.linkedin_url
      ? person.linkedin_url
      : undefined;
  const email =
    person.consent?.show_email && person.email ? person.email : undefined;

  return sanitizeConnectionVaultRecord({
    id: person.id,
    personId: person.id,
    displayName: person.display_name,
    title: person.title,
    organization: org,
    badges: deriveConnectionBadges(person, badgeContext),
    saveReason,
    dateAdded: new Date().toISOString(),
    sharedInterests: deriveSharedInterests(person, profileSignals),
    sharedCommunities: deriveSharedCommunities(
      person.profile?.community_interests,
      viewerCommunities,
    ),
    sharedCertifications: deriveSharedCertifications(person, certificationGoalLabels),
    notes: initialNote.trim(),
    linkedinUrl,
    email,
    mutual,
  });
}

/** Firestore rejects `undefined` field values — strip them before write. */
export function sanitizeConnectionVaultRecord(
  record: ConnectionVaultRecord,
): ConnectionVaultRecord {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(record)) {
    if (value !== undefined) out[key] = value;
  }
  return out as unknown as ConnectionVaultRecord;
}

export function sanitizeConnectionVaultForFirestore(
  vault: ConnectionVaultRecord[],
): ConnectionVaultRecord[] {
  return vault.map(sanitizeConnectionVaultRecord);
}

export function migrateLegacySavedPeople(
  savedIds: string[],
  champions: Array<RecommendedPerson & { linkedin_url?: string; consent?: { show_linkedin?: boolean } }>,
  context: Omit<BuildConnectionRecordInput, "person" | "saveReason">,
): ConnectionVaultRecord[] {
  const byId = new Map(champions.map(c => [c.id, c]));
  return savedIds
    .map(id => byId.get(id))
    .filter((c): c is NonNullable<typeof c> => !!c)
    .map(person =>
      buildConnectionRecord({
        ...context,
        person,
        saveReason: "networking",
      }),
    );
}

export function formatConnectionDateAdded(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, { month: "long", day: "numeric" });
}

function escapeVCard(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/\n/g, "\\n");
}

export function buildVCardContent(record: ConnectionVaultRecord): string {
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${escapeVCard(record.displayName)}`,
  ];
  if (record.title) lines.push(`TITLE:${escapeVCard(record.title)}`);
  if (record.organization) lines.push(`ORG:${escapeVCard(record.organization)}`);
  if (record.linkedinUrl) lines.push(`URL:${escapeVCard(record.linkedinUrl)}`);
  if (record.email) lines.push(`EMAIL:${escapeVCard(record.email)}`);
  lines.push("END:VCARD");
  return lines.join("\r\n");
}

export function downloadConnectionVCard(record: ConnectionVaultRecord): void {
  if (typeof window === "undefined") return;
  const blob = new Blob([buildVCardContent(record)], { type: "text/vcard;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const slug = record.displayName.replace(/\s+/g, "-").toLowerCase() || "connection";
  const a = document.createElement("a");
  a.href = url;
  a.download = `${slug}.vcf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function updateVaultRecordNote(
  vault: ConnectionVaultRecord[],
  personId: string,
  notes: string,
): ConnectionVaultRecord[] {
  return vault.map(r => (r.personId === personId ? { ...r, notes: notes.trim() } : r));
}

export function removeVaultRecord(
  vault: ConnectionVaultRecord[],
  personId: string,
): ConnectionVaultRecord[] {
  return vault.filter(r => r.personId !== personId);
}
