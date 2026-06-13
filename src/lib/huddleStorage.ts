import type { LiveOpportunity } from "@/types/liveOpportunity";

const PENDING_KEY = "compass_pending_huddles";
const ON_MY_WAY_KEY = "compass_huddle_on_my_way";

export interface PendingHuddleInput {
  topics: string[];
  title: string;
  date: string;
  time: string;
  location: string;
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
    joinedCount: 1,
    joinedNames: ["You"],
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
