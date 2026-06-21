import type { EventDay } from "@/lib/experienceDayPlan";
import { isCertificationActivityType } from "@/lib/certificationProfile";
import type { ExperienceScoredSession } from "@/lib/experienceScoring";
import {
  isLabLikePlanningClass,
  isLearningPlanningClass,
  shouldHideFromFocus,
} from "@/lib/sessionPlanning";
import {
  hasTimeRangeConflict,
  sessionDayLabel,
  sessionTimeRange,
  sortSessionsForScheduling,
} from "@/lib/sessionTimeUtils";

export interface FocusDaySessions {
  mustAttend: ExperienceScoredSession[];
  learning: ExperienceScoredSession[];
  explore: ExperienceScoredSession[];
  certification: ExperienceScoredSession[];
}

export interface FocusSessionPlan {
  byDay: Record<EventDay, FocusDaySessions>;
  mustAttend: ExperienceScoredSession[];
  strongAlternatives: ExperienceScoredSession[];
  exploreAnytime: ExperienceScoredSession[];
  printLearning: ExperienceScoredSession[];
}

const EVENT_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday"] as const;

function visible(sessions: ExperienceScoredSession[], hiddenIds: string[]): ExperienceScoredSession[] {
  return sessions.filter(s => !hiddenIds.includes(s.id) && !shouldHideFromFocus(s));
}

function pickNonOverlapping(
  candidates: ExperienceScoredSession[],
  max: number,
  already: ExperienceScoredSession[] = [],
): ExperienceScoredSession[] {
  const picked: ExperienceScoredSession[] = [];
  const blocked = [...already];

  for (const session of candidates) {
    if (picked.length >= max) break;
    const range = sessionTimeRange(session);
    if (blocked.some(b => hasTimeRangeConflict(sessionTimeRange(b), range))) continue;
    picked.push(session);
    blocked.push(session);
  }
  return picked;
}

function sessionsForDay(all: ExperienceScoredSession[], day: EventDay): ExperienceScoredSession[] {
  return all.filter(s => {
    const label = sessionDayLabel(s);
    return label.toLowerCase().includes(day.toLowerCase());
  });
}

export function buildFocusSessionPlan(
  learning: ExperienceScoredSession[],
  community: ExperienceScoredSession[],
  fun: ExperienceScoredSession[],
  hiddenIds: string[],
  hasCertIntent: boolean,
): FocusSessionPlan {
  const pool = visible([...learning, ...community, ...fun], hiddenIds);
  const byDay = {} as Record<EventDay, FocusDaySessions>;

  const allMustAttend: ExperienceScoredSession[] = [];
  const allStrong: ExperienceScoredSession[] = [];
  const allExplore: ExperienceScoredSession[] = [];
  const printLearning: ExperienceScoredSession[] = [];

  for (const day of EVENT_DAYS) {
    const daySessions = sessionsForDay(pool, day).sort(sortSessionsForScheduling);

    const anchors = pickNonOverlapping(
      daySessions.filter(s => s.planning_class === "general_session" || s.recommendation_tier === "must_attend"),
      1,
    );

    const cert = hasCertIntent
      ? pickNonOverlapping(
          daySessions.filter(s => isCertificationActivityType(s) || s.planning_class === "certification"),
          2,
          anchors,
        )
      : [];

    const labCap = 1;
    const labs = pickNonOverlapping(
      daySessions.filter(s => isLabLikePlanningClass(s.planning_class)),
      labCap,
      [...anchors, ...cert],
    );

    const learningTarget = 5;
    const learningCandidates = daySessions.filter(
      s =>
        isLearningPlanningClass(s.planning_class)
        && s.recommendation_tier !== "explore"
        && !anchors.includes(s)
        && !labs.includes(s)
        && !cert.includes(s),
    );

    const learningPicks = pickNonOverlapping(
      learningCandidates,
      Math.max(0, learningTarget - anchors.length),
      [...anchors, ...cert, ...labs],
    );

    const communityPicks = pickNonOverlapping(
      daySessions.filter(
        s =>
          s.planning_class === "community"
          || s.planning_class === "networking"
          || s.recommendation_tier === "explore",
      ),
      2,
      [...anchors, ...cert, ...labs, ...learningPicks],
    ).slice(0, 2);

    const explorePicks = pickNonOverlapping(
      daySessions.filter(s => s.recommendation_tier === "explore" || s.explore_anytime),
      1,
      [...anchors, ...cert, ...labs, ...learningPicks, ...communityPicks],
    );

    byDay[day] = {
      mustAttend: anchors,
      learning: [...labs, ...learningPicks],
      explore: [...communityPicks, ...explorePicks],
      certification: cert,
    };

    allMustAttend.push(...anchors);
    allStrong.push(...labs, ...learningPicks);
    allExplore.push(...communityPicks, ...explorePicks);
    printLearning.push(...anchors, ...labs, ...learningPicks);
  }

  const unique = (list: ExperienceScoredSession[]) => {
    const seen = new Set<string>();
    return list.filter(s => {
      if (seen.has(s.id)) return false;
      seen.add(s.id);
      return true;
    });
  };

  return {
    byDay,
    mustAttend: unique(allMustAttend).slice(0, 12),
    strongAlternatives: unique(allStrong).slice(0, 12),
    exploreAnytime: unique(allExplore).slice(0, 8),
    printLearning: unique(printLearning).slice(0, 12),
  };
}

export function focusDayToGroups(dayPlan: FocusDaySessions) {
  const labs = dayPlan.learning.filter(s => isLabLikePlanningClass(s.planning_class));
  const coreLearning = dayPlan.learning.filter(s => !isLabLikePlanningClass(s.planning_class));

  return {
    core: [...dayPlan.mustAttend, ...coreLearning],
    cert: dayPlan.certification,
    labs,
    perspective: dayPlan.explore,
  };
}
