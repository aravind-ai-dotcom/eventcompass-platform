import type { LiveOpportunity } from "@/types/liveOpportunity";

const PENDING_KEY = "compass_pending_huddles";
const ON_MY_WAY_KEY = "compass_huddle_on_my_way";

export interface PendingHuddleInput {
  topics: string[];
  title: string;
  date: string;
  time: string;
  location: string;
  hostName: string;
  hostFirstName: string;
}

export function loadPendingHuddles(): LiveOpportunity[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as LiveOpportunity[];
  } catch {
    return [];
  }
}

export function savePendingHuddle(input: PendingHuddleInput): LiveOpportunity {
  const huddle: LiveOpportunity = {
    id: `pending-${Date.now()}`,
    category: input.topics[0] ?? "Community",
    title: input.title,
    description: "",
    location: input.location,
    startTime: `${input.date} ${input.time}`,
    status: "Pending · awaiting attendees",
    joinedCount: 0,
    joinedNames: [],
    hostName: input.hostName,
    hostFirstName: input.hostFirstName,
    tags: input.topics,
    source: "networking",
    emoji: "💬",
    matchReasons: input.topics.slice(0, 3),
    filterKeys: input.topics.map(t => t.toLowerCase()),
  };

  const existing = loadPendingHuddles();
  const next = [huddle, ...existing];
  localStorage.setItem(PENDING_KEY, JSON.stringify(next));
  return huddle;
}

export function loadOnMyWayIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(ON_MY_WAY_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

export function toggleOnMyWay(huddleId: string): Set<string> {
  const ids = loadOnMyWayIds();
  if (ids.has(huddleId)) ids.delete(huddleId);
  else ids.add(huddleId);
  localStorage.setItem(ON_MY_WAY_KEY, JSON.stringify([...ids]));
  return ids;
}

export function hostFirstName(opp: LiveOpportunity): string {
  if (opp.hostFirstName) return opp.hostFirstName;
  if (opp.hostName) return opp.hostName.split(/\s+/)[0] ?? "Host";
  return "Host";
}

export function hostInitials(opp: LiveOpportunity): string {
  const first = hostFirstName(opp);
  const parts = (opp.hostName ?? first).split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
  }
  return first.slice(0, 2).toUpperCase();
}

/** Attendee count including optimistic +1 when current user is heading there. */
export function headingCount(
  opp: LiveOpportunity,
  isOnMyWay: boolean,
  userFirstName: string,
): number {
  const host = hostFirstName(opp);
  const userAlreadyListed = opp.joinedNames.some(
    n => n.toLowerCase() === userFirstName.toLowerCase(),
  );
  const base = opp.joinedCount;
  if (isOnMyWay && userFirstName && !userAlreadyListed && userFirstName !== host) {
    return base + 1;
  }
  return base;
}

/** Participant first names for avatar row (excludes host). */
export function headingParticipants(
  opp: LiveOpportunity,
  isOnMyWay: boolean,
  userFirstName: string,
  max = 3,
): string[] {
  const host = hostFirstName(opp);
  let names = opp.joinedNames.filter(n => n !== host);
  if (isOnMyWay && userFirstName && userFirstName !== host && !names.includes(userFirstName)) {
    names = [userFirstName, ...names];
  } else if (!isOnMyWay && userFirstName) {
    names = names.filter(n => n !== userFirstName);
  }
  return names.slice(0, max);
}

export function extraParticipantCount(
  total: number,
  shown: number,
): number {
  return Math.max(0, total - shown);
}
