import type { LiveOpportunity } from "@/types/liveOpportunity";

export const HUDDLE_DURATION_MINUTES = 30;

export const HUDDLE_COPY = {
  sectionLead:
    "In-person power catchups at the event — pick a time, connect face-to-face, then back to the floor.",
  slotNote: "30-minute power catchup",
  modalNote:
    "Each slot runs 30 minutes — focused time to connect, then it clears for the next group.",
  proposeNote: "Your catchup appears in the feed until it ends or the 30-minute window closes.",
  endCatchup: "End catchup",
} as const;

export function huddleDurationMs(): number {
  return HUDDLE_DURATION_MINUTES * 60 * 1000;
}

export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

/** Parse "2:30 PM" onto a calendar day. */
export function parseClockTimeOnDay(clock: string, day: Date): Date | null {
  const m12 = clock.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!m12) return null;
  let h = parseInt(m12[1], 10);
  const min = parseInt(m12[2], 10);
  const ap = m12[3].toUpperCase();
  if (ap === "PM" && h !== 12) h += 12;
  if (ap === "AM" && h === 12) h = 0;
  const d = new Date(day);
  d.setHours(h, min, 0, 0);
  return d;
}

/** Next future occurrence of a wall-clock time (today or tomorrow). */
export function nextFutureClockTime(clock: string, from = new Date()): Date {
  const today = parseClockTimeOnDay(clock, from);
  if (today && today.getTime() > from.getTime()) return today;
  const tomorrow = new Date(from);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return parseClockTimeOnDay(clock, tomorrow) ?? addMinutes(from, 60);
}

export function parseDateAndTimeInput(date: string, time: string): Date | null {
  if (!date || !time) return null;
  const [y, mo, d] = date.split("-").map(Number);
  const [h, mi] = time.split(":").map(Number);
  if (!y || !mo || !d || Number.isNaN(h) || Number.isNaN(mi)) return null;
  return new Date(y, mo - 1, d, h, mi, 0, 0);
}

export function withHuddleSchedule(
  opp: LiveOpportunity,
  scheduledAt: Date,
): LiveOpportunity {
  const expiresAt = addMinutes(scheduledAt, HUDDLE_DURATION_MINUTES);
  return {
    ...opp,
    scheduledAt: scheduledAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
    startTime: formatHuddleClock(scheduledAt),
    endTime: formatHuddleClock(expiresAt),
    status: HUDDLE_COPY.slotNote,
  };
}

export function formatHuddleClock(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function formatHuddleScheduleLabel(opp: LiveOpportunity): string {
  if (opp.scheduledAt) {
    const d = new Date(opp.scheduledAt);
    const now = new Date();
    const sameDay = d.toDateString() === now.toDateString();
    const time = formatHuddleClock(d);
    if (sameDay) return `Today · ${time}`;
    return new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(d);
  }
  if (opp.startTime && !opp.startTime.includes("-")) return opp.startTime;
  return "Time TBD";
}

export function isHuddleExpired(opp: LiveOpportunity, now = Date.now()): boolean {
  if (!opp.expiresAt) return false;
  return new Date(opp.expiresAt).getTime() <= now;
}

export function isHuddleHost(opp: LiveOpportunity, userDisplayName: string): boolean {
  if (!userDisplayName.trim() || !opp.hostName) return false;
  return opp.hostName.trim().toLowerCase() === userDisplayName.trim().toLowerCase();
}
