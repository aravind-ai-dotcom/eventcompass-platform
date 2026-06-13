import type { LiveOpportunity } from "@/types/liveOpportunity";
import {
  HUDDLE_COPY,
  formatHuddleClock,
  isHuddleExpired,
  parseDateAndTimeInput,
  withHuddleSchedule,
} from "@/lib/huddleLifecycle";

const PENDING_KEY = "compass_pending_huddles";
const ON_MY_WAY_KEY = "compass_huddle_on_my_way";
const ENDED_KEY = "compass_ended_huddles";

export interface PendingHuddleInput {
  topics: string[];
  title: string;
  date: string;
  time: string;
  location: string;
  hostName: string;
  hostFirstName: string;
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function loadEndedHuddleIds(): Set<string> {
  return new Set(readJson<string[]>(ENDED_KEY, []));
}

export function loadPendingHuddles(): LiveOpportunity[] {
  return readJson<LiveOpportunity[]>(PENDING_KEY, [])
    .filter(h => !isHuddleExpired(h));
}

export function savePendingHuddles(huddles: LiveOpportunity[]): void {
  writeJson(PENDING_KEY, huddles.filter(h => !isHuddleExpired(h)));
}

export function savePendingHuddle(input: PendingHuddleInput): LiveOpportunity {
  const scheduled = parseDateAndTimeInput(input.date, input.time) ?? new Date();
  const base: LiveOpportunity = {
    id: `pending-${Date.now()}`,
    category: input.topics[0] ?? "Community",
    title: input.title,
    description: "",
    location: input.location,
    joinedCount: 0,
    joinedNames: [],
    hostName: input.hostName,
    hostFirstName: input.hostFirstName,
    tags: input.topics,
    source: "networking",
    emoji: "💬",
    matchReasons: input.topics.slice(0, 3),
    filterKeys: input.topics.map(t => t.toLowerCase()),
    status: HUDDLE_COPY.slotNote,
  };
  const huddle = withHuddleSchedule(base, scheduled);

  const existing = loadPendingHuddles();
  savePendingHuddles([huddle, ...existing]);
  return huddle;
}

export function endHuddle(huddleId: string): void {
  if (huddleId.startsWith("pending-")) {
    savePendingHuddles(loadPendingHuddles().filter(h => h.id !== huddleId));
    return;
  }
  const ended = loadEndedHuddleIds();
  ended.add(huddleId);
  writeJson(ENDED_KEY, [...ended]);
}

export function loadOnMyWayIds(): Set<string> {
  return new Set(readJson<string[]>(ON_MY_WAY_KEY, []));
}

export function toggleOnMyWay(huddleId: string): Set<string> {
  const ids = loadOnMyWayIds();
  if (ids.has(huddleId)) ids.delete(huddleId);
  else ids.add(huddleId);
  writeJson(ON_MY_WAY_KEY, [...ids]);
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

/** Migrate legacy pending rows that stored raw date/time in startTime. */
export function normalizeHuddleSchedule(opp: LiveOpportunity): LiveOpportunity {
  if (opp.scheduledAt && opp.expiresAt) return opp;
  if (opp.startTime?.includes("-") && opp.startTime.includes(":")) {
    const [datePart, timePart] = opp.startTime.split(" ");
    const scheduled = parseDateAndTimeInput(datePart, timePart?.slice(0, 5) ?? "");
    if (scheduled) return withHuddleSchedule(opp, scheduled);
  }
  return opp;
}

export function formatEndTimeLabel(opp: LiveOpportunity): string | null {
  if (!opp.expiresAt) return null;
  return formatHuddleClock(new Date(opp.expiresAt));
}
