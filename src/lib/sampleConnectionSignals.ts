import type { InboundConnectionSignal } from "@/types/connectionSignals";

export function personFirstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name;
}

/** Full display name for inbound signal (falls back to first name). */
export function inboundDisplayName(signal: InboundConnectionSignal): string {
  return signal.fromDisplayName?.trim() || signal.fromFirstName;
}

/** MVP inbound interest — replace with Firestore listener when backend is ready. */
export const SAMPLE_INBOUND_SIGNALS: InboundConnectionSignal[] = [
  {
    id: "inbound-maya",
    fromFirstName: "Maya",
    fromDisplayName: "Maya Patel",
    topic: "AI governance",
    anchorFirstName: "maya",
    anchorChampionId: "champion-maya-patel",
    organization: "Northwind Health",
    domains: ["watsonx", "healthcare AI", "Responsible AI"],
    intentSnapshot: ["Open to technical conversations", "Interested in AI governance"],
    whyInterested: "Shared interest in watsonx and healthcare AI — would love to compare rollout notes.",
  },
  {
    id: "inbound-jordan",
    fromFirstName: "Jordan",
    fromDisplayName: "Jordan Lee",
    topic: "cloud architecture",
    anchorFirstName: "jordan",
    organization: "RetailCo",
    domains: ["Cloud", "Architecture", "Hybrid cloud"],
    intentSnapshot: ["Open to mentoring", "Interested in Cloud, Automation"],
    whyInterested: "Aligns with your cloud and automation tracks",
  },
  {
    id: "inbound-priya",
    fromFirstName: "Priya",
    fromDisplayName: "Priya Chandrasekaran",
    topic: "certification prep",
    anchorFirstName: "priya",
    anchorChampionId: "champion-priya-c",
    organization: "Summit Financial",
    domains: ["Data fabric", "Governance", "Certification"],
    intentSnapshot: ["Open to career conversations", "Interested in certification prep"],
    whyInterested: "Preparing for the same certification path — happy to share fabric governance patterns.",
  },
];

export function isMutualWithInbound(
  displayName: string,
  championId: string,
  savedPeopleIds: string[],
  inbound: InboundConnectionSignal[],
): boolean {
  if (!savedPeopleIds.includes(championId)) return false;
  return recommendedShowsMutualInterest(championId, displayName, inbound);
}

/** True when this inbound person also appears in your recommended / saved champions list. */
export function inboundShowsMutual(
  signal: InboundConnectionSignal,
  savedChampionRefs: Array<{ id: string; display_name: string }>,
): boolean {
  const anchor = signal.anchorFirstName.trim().toLowerCase();
  const display = inboundDisplayName(signal).toLowerCase();
  const anchorId = signal.anchorChampionId;

  return savedChampionRefs.some(ref => {
    if (anchorId && ref.id === anchorId) return true;
    const name = ref.display_name.trim().toLowerCase();
    if (name === display) return true;
    const first = personFirstName(ref.display_name).toLowerCase();
    return first === anchor || name.startsWith(`${anchor} `);
  });
}

/** Recommended champion also signaled interest in you. */
export function recommendedShowsMutualInterest(
  personId: string,
  displayName: string,
  inboundSignals: InboundConnectionSignal[],
): boolean {
  const first = personFirstName(displayName).toLowerCase();
  return inboundSignals.some(signal => {
    if (signal.anchorChampionId && signal.anchorChampionId === personId) return true;
    const inboundFirst = signal.fromFirstName.trim().toLowerCase();
    const inboundFull = inboundDisplayName(signal).toLowerCase();
    const personFull = displayName.trim().toLowerCase();
    return (
      inboundFull === personFull ||
      inboundFirst === first ||
      personFull.startsWith(`${inboundFirst} `) ||
      signal.anchorFirstName === first
    );
  });
}
