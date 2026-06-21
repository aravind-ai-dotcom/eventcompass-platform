import { isCertificationActivityType } from "@/lib/certificationProfile";
import type { ExperienceScoredSession } from "@/lib/experienceScoring";

export const EVENT_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday"] as const;
export type EventDay = (typeof EVENT_DAYS)[number];

export type PlanConflictMode = "best-fit" | "show-both" | "capacity";

function sessionDayLabel(session: ExperienceScoredSession): string {
  const raw = session as unknown as Record<string, unknown>;
  return String(session.schedule?.day ?? session.date ?? raw.date ?? "");
}

function parseSessionTimeMinutes(session: ExperienceScoredSession): number {
  const raw = session as unknown as Record<string, unknown>;
  const start = String(session.schedule?.start_time ?? session.start_time ?? raw.start_time ?? "");
  if (!start) return 9999;
  const m12 = start.match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/i);
  if (m12) {
    let h = parseInt(m12[1], 10);
    const min = parseInt(m12[2], 10);
    const ap = m12[3].toLowerCase();
    if (ap === "pm" && h !== 12) h += 12;
    if (ap === "am" && h === 12) h = 0;
    return h * 60 + min;
  }
  const m24 = start.match(/^(\d{1,2}):(\d{2})$/);
  if (m24) return parseInt(m24[1], 10) * 60 + parseInt(m24[2], 10);
  return 9999;
}

function sortByEventTimeThenFit(a: ExperienceScoredSession, b: ExperienceScoredSession): number {
  const timeDiff = parseSessionTimeMinutes(a) - parseSessionTimeMinutes(b);
  if (timeDiff !== 0) return timeDiff;
  return (b.compass_score ?? 0) - (a.compass_score ?? 0);
}

function scheduleSessionsForDay(
  sessions: ExperienceScoredSession[],
  mode: PlanConflictMode,
): ExperienceScoredSession[] {
  const sorted = [...sessions].sort(sortByEventTimeThenFit);
  if (mode === "show-both") return sorted;

  const bySlot = new Map<number, ExperienceScoredSession>();
  for (const s of sorted) {
    const slot = parseSessionTimeMinutes(s);
    const existing = bySlot.get(slot);
    if (!existing) {
      bySlot.set(slot, s);
      continue;
    }
    if (mode === "capacity") {
      const capA = sessionCapacityRank(s);
      const capB = sessionCapacityRank(existing);
      if (capA !== capB) {
        if (capA > capB) bySlot.set(slot, s);
        continue;
      }
    }
    if ((s.compass_score ?? 0) > (existing.compass_score ?? 0)) {
      bySlot.set(slot, s);
    }
  }
  return [...bySlot.values()].sort(sortByEventTimeThenFit);
}

function sessionCapacityRank(session: ExperienceScoredSession): number {
  const raw = session as unknown as Record<string, unknown>;
  const cap = raw.capacity as { status?: string; available?: number } | undefined;
  if (cap?.status === "full") return 0;
  if (cap?.status === "limited") return 1;
  if (typeof cap?.available === "number" && cap.available > 0) return 2;
  return 3;
}

export function getSessionsForDay(
  sessions: ExperienceScoredSession[],
  day: EventDay,
  mode: PlanConflictMode = "best-fit",
): ExperienceScoredSession[] {
  const matched = sessions.filter(s => {
    const d = sessionDayLabel(s);
    return d && d.toLowerCase().includes(day.toLowerCase());
  });
  if (matched.length === 0) return [];
  return scheduleSessionsForDay(matched, mode);
}

export function groupDaySessions(
  learning: ExperienceScoredSession[],
  community: ExperienceScoredSession[],
  day: EventDay,
  hiddenIds: string[],
  mode: PlanConflictMode = "best-fit",
) {
  const visible = (list: ExperienceScoredSession[]) =>
    getSessionsForDay(list, day, mode).filter(s => !hiddenIds.includes(s.id));

  const core = visible(learning).filter(s => !isCertificationActivityType(s));
  const cert = visible(learning).filter(s => isCertificationActivityType(s));
  const perspective = visible(community);

  return { core, cert, perspective };
}
