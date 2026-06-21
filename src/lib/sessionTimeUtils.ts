import type { ExperienceScoredSession } from "@/lib/experienceScoring";

/** Official TechXchange demo slot boundaries (minutes from midnight). */
export const OFFICIAL_DAY_SLOTS: Record<string, Array<{ start: number; end: number; keynote?: boolean; evening?: boolean }>> = {
  Monday: [
    { start: 630, end: 690 },
    { start: 750, end: 810 },
    { start: 930, end: 990 },
    { start: 1080, end: 1260, evening: true },
  ],
  Tuesday: [
    { start: 540, end: 600, keynote: true },
    { start: 630, end: 690 },
    { start: 750, end: 810 },
    { start: 840, end: 900 },
    { start: 930, end: 990 },
    { start: 1020, end: 1080 },
  ],
  Wednesday: [
    { start: 540, end: 600, keynote: true },
    { start: 630, end: 690 },
    { start: 750, end: 810 },
    { start: 840, end: 900 },
    { start: 930, end: 990 },
    { start: 1020, end: 1080 },
  ],
  Thursday: [
    { start: 540, end: 600 },
    { start: 630, end: 690 },
    { start: 750, end: 810 },
  ],
};

/** Disallowed start times for core technical sessions (minutes from midnight). */
export const DISALLOWED_CORE_STARTS = new Set([
  420, 450, 480, 510, 555, 570, 585, 615, 675, 690, 705,
  780, 810, 870, 885, 900, 960, 975, 990, 1020, 1050, 1230,
]);

export function parseTimeToMinutes(value: string | undefined | null): number | null {
  const t = String(value ?? "").trim();
  if (!t) return null;
  const m12 = t.match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/i);
  if (m12) {
    let h = parseInt(m12[1], 10);
    const min = parseInt(m12[2], 10);
    const ap = m12[3].toLowerCase();
    if (ap === "pm" && h !== 12) h += 12;
    if (ap === "am" && h === 12) h = 0;
    return h * 60 + min;
  }
  const m24 = t.match(/^(\d{1,2}):(\d{2})$/);
  if (m24) return parseInt(m24[1], 10) * 60 + parseInt(m24[2], 10);
  return null;
}

export function minutesToHHmm(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function formatDisplayTimeRange(startMinutes: number, endMinutes: number): string {
  const fmt = (mins: number) => {
    const h24 = Math.floor(mins / 60) % 24;
    const m = mins % 60;
    const ap = h24 >= 12 ? "PM" : "AM";
    let h12 = h24 % 12;
    if (h12 === 0) h12 = 12;
    return `${h12}:${String(m).padStart(2, "0")} ${ap}`;
  };
  return `${fmt(startMinutes)} – ${fmt(endMinutes)}`;
}

export function normalizeEventDay(raw: string | undefined): string {
  const d = String(raw ?? "").toLowerCase();
  if (d.includes("mon")) return "Monday";
  if (d.includes("tue")) return "Tuesday";
  if (d.includes("wed")) return "Wednesday";
  if (d.includes("thu")) return "Thursday";
  if (d.includes("2026-10-26")) return "Monday";
  if (d.includes("2026-10-27")) return "Tuesday";
  if (d.includes("2026-10-28")) return "Wednesday";
  if (d.includes("2026-10-29")) return "Thursday";
  return "";
}

export function sessionDayLabel(session: ExperienceScoredSession): string {
  const raw = session as unknown as Record<string, unknown>;
  const schedule = session.schedule;
  return normalizeEventDay(
    String(schedule?.day ?? session.date ?? raw.date ?? ""),
  ) || String(schedule?.day ?? session.date ?? raw.date ?? "");
}

export function getSessionStartMinutes(session: ExperienceScoredSession): number {
  if (typeof session.start_minutes === "number") return session.start_minutes;
  const raw = session as unknown as Record<string, unknown>;
  const start = String(session.schedule?.start_time ?? session.start_time ?? raw.start_time ?? "");
  return parseTimeToMinutes(start) ?? 9999;
}

export function getSessionEndMinutes(session: ExperienceScoredSession): number {
  if (typeof session.end_minutes === "number") return session.end_minutes;
  const start = getSessionStartMinutes(session);
  if (start === 9999) return 9999;
  const raw = session as unknown as Record<string, unknown>;
  const end = parseTimeToMinutes(String(session.schedule?.end_time ?? raw.end_time ?? ""));
  return end ?? start + 60;
}

export function hasTimeRangeConflict(
  a: { start_minutes: number; end_minutes: number },
  b: { start_minutes: number; end_minutes: number },
): boolean {
  return a.start_minutes < b.end_minutes && b.start_minutes < a.end_minutes;
}

export function sessionTimeRange(session: ExperienceScoredSession): {
  start_minutes: number;
  end_minutes: number;
} {
  return {
    start_minutes: getSessionStartMinutes(session),
    end_minutes: getSessionEndMinutes(session),
  };
}

export function sessionDisplayTime(session: ExperienceScoredSession): string {
  if (session.display_time) return session.display_time;
  const { start_minutes, end_minutes } = sessionTimeRange(session);
  if (start_minutes === 9999) return "TBA";
  return formatDisplayTimeRange(start_minutes, end_minutes);
}

export function nearestOfficialSlot(
  day: string,
  startMinutes: number,
  opts: { eveningOk?: boolean; keynoteOk?: boolean } = {},
): { start: number; end: number } | null {
  const slots = OFFICIAL_DAY_SLOTS[day];
  if (!slots?.length) return null;

  let candidates = slots;
  if (!opts.eveningOk) candidates = candidates.filter(s => !s.evening);
  if (!opts.keynoteOk) candidates = candidates.filter(s => !s.keynote);

  if (candidates.length === 0) candidates = slots;

  let best = candidates[0];
  let bestDist = Math.abs(startMinutes - best.start);
  for (const slot of candidates) {
    const dist = Math.abs(startMinutes - slot.start);
    if (dist < bestDist) {
      best = slot;
      bestDist = dist;
    }
  }
  return { start: best.start, end: best.end };
}

export function tierSortRank(tier?: string): number {
  switch (tier) {
    case "must_attend": return 0;
    case "strong_match": return 1;
    case "optional": return 2;
    case "explore": return 3;
    case "hidden_from_focus": return 9;
    default: return 4;
  }
}

export function sortSessionsForScheduling(a: ExperienceScoredSession, b: ExperienceScoredSession): number {
  const tierDiff = tierSortRank(a.recommendation_tier) - tierSortRank(b.recommendation_tier);
  if (tierDiff !== 0) return tierDiff;
  const timeDiff = getSessionStartMinutes(a) - getSessionStartMinutes(b);
  if (timeDiff !== 0) return timeDiff;
  return (b.compass_score ?? 0) - (a.compass_score ?? 0);
}
