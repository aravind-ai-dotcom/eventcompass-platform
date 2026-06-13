import type { InboundConnectionSignal } from "@/types/connectionSignals";

/** MVP inbound interest — replace with Firestore listener when backend is ready. */
export const SAMPLE_INBOUND_SIGNALS: InboundConnectionSignal[] = [
  {
    id: "inbound-maya",
    fromFirstName: "Maya",
    topic: "AI governance",
    anchorFirstName: "maya",
    organization: "Enterprise AI team",
    domains: ["AI governance", "Responsible AI", "Policy"],
    intentSnapshot: ["Open to technical conversations", "Interested in AI governance"],
    whyInterested: "Shared interest in AI governance and responsible deployment",
  },
  {
    id: "inbound-jordan",
    fromFirstName: "Jordan",
    topic: "cloud architecture",
    anchorFirstName: "jordan",
    organization: "Cloud platform practice",
    domains: ["Cloud", "Architecture", "Hybrid cloud"],
    intentSnapshot: ["Open to mentoring", "Interested in Cloud, Automation"],
    whyInterested: "Aligns with your cloud and automation tracks",
  },
  {
    id: "inbound-priya",
    fromFirstName: "Priya",
    topic: "certification prep",
    anchorFirstName: "priya",
    organization: "Learning & certification",
    domains: ["Certification", "Cloud", "Study groups"],
    intentSnapshot: ["Open to career conversations", "Interested in certification prep"],
    whyInterested: "Preparing for the same certification path you listed",
  },
];

export function personFirstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name;
}

export function isMutualWithInbound(
  displayName: string,
  championId: string,
  savedPeopleIds: string[],
  inbound: InboundConnectionSignal[],
): boolean {
  if (!savedPeopleIds.includes(championId)) return false;
  const first = personFirstName(displayName).toLowerCase();
  return inbound.some(sig => sig.anchorFirstName === first);
}

export function inboundShowsMutual(
  signal: InboundConnectionSignal,
  savedChampions: Array<{ id: string; display_name: string }>,
): boolean {
  return savedChampions.some(
    c => signal.anchorFirstName === personFirstName(c.display_name).toLowerCase(),
  );
}
