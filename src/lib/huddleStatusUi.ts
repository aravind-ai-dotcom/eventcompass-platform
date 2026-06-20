import { huddleWindow } from "@/lib/huddleSchedule";
import type { HuddleDoc, HuddleStatus } from "@/types/huddleDataModel";

const ENDING_SOON_MS = 15 * 60 * 1000;
export const STARTING_SOON_MS = 45 * 60 * 1000;

export type HuddleDisplayStatus =
  | "scheduled"
  | "happening_now"
  | "ending_soon"
  | "expired"
  | "cancelled";

export function resolveDisplayStatus(
  huddle: Pick<HuddleDoc, "status" | "date" | "start_time" | "end_time">,
  now = new Date(),
): HuddleDisplayStatus {
  if (huddle.status === "cancelled") return "cancelled";
  if (huddle.status === "expired") return "expired";

  const window = huddleWindow(huddle.date, huddle.start_time, huddle.end_time);
  if (!window) return huddle.status === "happening_now" ? "happening_now" : "scheduled";

  const t = now.getTime();
  if (t >= window.end.getTime()) return "expired";
  if (t >= window.start.getTime()) {
    if (window.end.getTime() - t <= ENDING_SOON_MS) return "ending_soon";
    return "happening_now";
  }
  return "scheduled";
}

export function statusBadgeLabel(status: HuddleDisplayStatus): string {
  const map: Record<HuddleDisplayStatus, string> = {
    scheduled: "Scheduled",
    happening_now: "Happening Now",
    ending_soon: "Ending Soon",
    expired: "Expired",
    cancelled: "Cancelled",
  };
  return map[status];
}

export function statusBadgeClass(status: HuddleDisplayStatus): string {
  return `huddle-status-badge huddle-status-badge--${status.replace(/_/g, "-")}`;
}

export function classificationBadgeClass(classification: string): string {
  return `huddle-class-badge huddle-class-badge--${classification.replace(/_/g, "-")}`;
}

export function isStartingSoon(
  huddle: Pick<HuddleDoc, "status" | "date" | "start_time" | "end_time">,
  now = new Date(),
): boolean {
  if (resolveDisplayStatus(huddle, now) !== "scheduled") return false;
  const window = huddleWindow(huddle.date, huddle.start_time, huddle.end_time);
  if (!window) return false;
  const delta = window.start.getTime() - now.getTime();
  return delta > 0 && delta <= STARTING_SOON_MS;
}

/** Walking-attendee feed order: live → starting soon → scheduled → other. */
export function huddleDisplaySortTier(
  huddle: Pick<HuddleDoc, "status" | "date" | "start_time" | "end_time">,
  now = new Date(),
): number {
  const display = resolveDisplayStatus(huddle, now);
  if (display === "happening_now" || display === "ending_soon") return 0;
  if (isStartingSoon(huddle, now)) return 1;
  if (display === "scheduled") return 2;
  return 3;
}

export function statusBadgeLabelForHuddle(
  huddle: Pick<HuddleDoc, "status" | "date" | "start_time" | "end_time">,
  now = new Date(),
): string {
  if (isStartingSoon(huddle, now)) return "Starting Soon";
  return statusBadgeLabel(resolveDisplayStatus(huddle, now));
}

export function statusBadgeClassForHuddle(
  huddle: Pick<HuddleDoc, "status" | "date" | "start_time" | "end_time">,
  now = new Date(),
): string {
  if (isStartingSoon(huddle, now)) {
    return "huddle-status-badge huddle-status-badge--starting-soon";
  }
  return statusBadgeClass(resolveDisplayStatus(huddle, now));
}
