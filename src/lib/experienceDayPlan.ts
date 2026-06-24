import { isCertificationActivityType } from "@/lib/certificationProfile";
import type { ExperienceScoredSession } from "@/lib/experienceScoring";
import { inferPortfolioCategory } from "@/lib/learningPortfolioCategories";
import { shouldHideFromFocus } from "@/lib/sessionPlanning";
import {
  getSessionEndMinutes,
  getSessionStartMinutes,
  hasTimeRangeConflict,
  sessionDayLabel,
  sessionTimeRange,
  sortSessionsForScheduling,
} from "@/lib/sessionTimeUtils";

export const EVENT_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday"] as const;
export type EventDay = (typeof EVENT_DAYS)[number];

export type PlanConflictMode = "best-fit" | "show-both" | "capacity";

function sessionCapacityRank(session: ExperienceScoredSession): number {
  const raw = session as unknown as Record<string, unknown>;
  const cap = raw.capacity as { status?: string; available?: number } | undefined;
  if (cap?.status === "full") return 0;
  if (cap?.status === "limited") return 1;
  if (typeof cap?.available === "number" && cap.available > 0) return 2;
  return 3;
}

function scheduleSessionsForDay(
  sessions: ExperienceScoredSession[],
  mode: PlanConflictMode,
): ExperienceScoredSession[] {
  const sorted = [...sessions].sort(sortSessionsForScheduling);
  if (mode === "show-both") {
    return sorted.filter(s => !shouldHideFromFocus(s));
  }

  const selected: ExperienceScoredSession[] = [];

  for (const session of sorted) {
    if (shouldHideFromFocus(session)) continue;

    const range = sessionTimeRange(session);
    const conflictIndex = selected.findIndex(existing =>
      hasTimeRangeConflict(sessionTimeRange(existing), range),
    );

    if (conflictIndex === -1) {
      selected.push(session);
      continue;
    }

    if (mode === "capacity") {
      const existing = selected[conflictIndex];
      const capA = sessionCapacityRank(session);
      const capB = sessionCapacityRank(existing);
      if (capA > capB) selected[conflictIndex] = session;
      else if (capA === capB && (session.compass_score ?? 0) > (existing.compass_score ?? 0)) {
        selected[conflictIndex] = session;
      }
    }
    // best-fit: keep higher-ranked session already selected (sorted order)
  }

  return selected.sort((a, b) => getSessionStartMinutes(a) - getSessionStartMinutes(b));
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

  const core = visible(learning).filter(
    s => !isCertificationActivityType(s) && s.planning_class !== "lab" && s.planning_class !== "workshop" && s.planning_class !== "bootcamp",
  );
  const cert = visible(learning).filter(s => isCertificationActivityType(s) || s.planning_class === "certification");

  const communityVisible = visible(community);
  const networking = communityVisible.filter(s => inferPortfolioCategory(s) === "NETWORKING");
  const perspective = communityVisible.filter(s => inferPortfolioCategory(s) !== "NETWORKING");

  const labs = visible(learning).filter(
    s => s.planning_class === "lab" || s.planning_class === "workshop" || s.planning_class === "bootcamp",
  );

  return { core, cert, perspective, networking, labs };
}

export { getSessionEndMinutes, getSessionStartMinutes, sessionDayLabel };
