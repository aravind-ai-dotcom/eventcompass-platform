import type { HuddleDoc, HuddleStatus } from "@/types/huddleDataModel";

const DEFAULT_TZ = "America/New_York";

export function addMinutesToTime(time: string, minutes: number): string {
  const parts = time.split(":");
  if (parts.length < 2) return "";
  const h = Number(parts[0]);
  const m = Number(parts[1]);
  if (Number.isNaN(h) || Number.isNaN(m)) return "";
  const total = h * 60 + m + minutes;
  const nh = Math.floor(total / 60) % 24;
  const nm = total % 60;
  return `${String(nh).padStart(2, "0")}:${String(nm).padStart(2, "0")}`;
}

/** Build local Date from YYYY-MM-DD + HH:mm (24h). */
export function huddleWindow(
  date: string,
  startTime: string,
  endTime: string,
): { start: Date; end: Date } | null {
  if (!date || !startTime || !endTime) return null;
  const start = new Date(`${date}T${startTime}:00`);
  const end = new Date(`${date}T${endTime}:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
  if (end <= start) end.setDate(end.getDate() + 1);
  return { start, end };
}

export function computeHuddleStatus(
  huddle: Pick<HuddleDoc, "status" | "date" | "start_time" | "end_time">,
  now = new Date(),
): HuddleStatus {
  if (huddle.status === "cancelled") return "cancelled";

  const window = huddleWindow(huddle.date, huddle.start_time, huddle.end_time);
  if (!window) return "scheduled";

  const t = now.getTime();
  if (t >= window.end.getTime()) return "expired";
  if (t >= window.start.getTime() && t < window.end.getTime()) return "happening_now";
  return "scheduled";
}

export function withComputedStatus(huddle: HuddleDoc, now = new Date()): HuddleDoc {
  return {
    ...huddle,
    status: computeHuddleStatus(huddle, now),
  };
}

export function formatHuddleTimeRange(huddle: Pick<HuddleDoc, "date" | "start_time" | "end_time">): string {
  const window = huddleWindow(huddle.date, huddle.start_time, huddle.end_time);
  if (!window) return "Time TBD";

  const fmt = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  const startLabel = fmt.format(window.start);
  const endLabel = fmt.format(window.end);
  const now = new Date();
  const sameDay = window.start.toDateString() === now.toDateString();

  if (sameDay) return `Today · ${startLabel} – ${endLabel}`;
  const dayFmt = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  return `${dayFmt.format(window.start)} · ${startLabel} – ${endLabel}`;
}

export function defaultTimezone(): string {
  return DEFAULT_TZ;
}
