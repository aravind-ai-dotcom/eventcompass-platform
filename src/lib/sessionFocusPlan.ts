import type { TxCertification } from "@/data/certifications";
import { isCertificationActivityType } from "@/lib/certificationProfile";
import { sessionMatchesCertification } from "@/lib/certificationMatching";
import type { EventDay } from "@/lib/experienceDayPlan";
import type { ExperienceScoredSession } from "@/lib/experienceScoring";
import {
  inferPortfolioCategory,
  PORTFOLIO_WEEK_TARGETS,
  type LearningPortfolioCategory,
} from "@/lib/learningPortfolioCategories";
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
  certification: ExperienceScoredSession[];
  perspective: ExperienceScoredSession[];
  networking: ExperienceScoredSession[];
}

export interface FocusSessionPlan {
  byDay: Record<EventDay, FocusDaySessions>;
  mustAttend: ExperienceScoredSession[];
  strongAlternatives: ExperienceScoredSession[];
  exploreAnytime: ExperienceScoredSession[];
  printLearning: ExperienceScoredSession[];
  portfolioCounts: Record<LearningPortfolioCategory, number>;
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

function unique(list: ExperienceScoredSession[]): ExperienceScoredSession[] {
  const seen = new Set<string>();
  return list.filter(s => {
    if (seen.has(s.id)) return false;
    seen.add(s.id);
    return true;
  });
}

function isNetworkingCandidate(s: ExperienceScoredSession): boolean {
  const cat = inferPortfolioCategory(s);
  return cat === "NETWORKING";
}

function isPerspectiveCandidate(s: ExperienceScoredSession): boolean {
  const cat = inferPortfolioCategory(s);
  return cat === "PERSPECTIVE" || (cat === "NETWORKING" && s.recommendation_tier === "explore");
}

function isCertLikeSession(s: ExperienceScoredSession): boolean {
  const raw = s as unknown as { supports_certification?: boolean };
  return (
    isCertificationActivityType(s)
    || s.planning_class === "certification"
    || raw.supports_certification === true
  );
}

function sessionSupportsActiveCerts(
  session: ExperienceScoredSession,
  activeCerts: TxCertification[],
): boolean {
  if (activeCerts.length === 0) return false;
  return activeCerts.some(cert => sessionMatchesCertification(session, cert));
}

export function buildFocusSessionPlan(
  learning: ExperienceScoredSession[],
  community: ExperienceScoredSession[],
  fun: ExperienceScoredSession[],
  hiddenIds: string[],
  hasCertIntent: boolean,
  activeCertifications: TxCertification[] = [],
): FocusSessionPlan {
  const pool = visible([...learning, ...community, ...fun], hiddenIds);
  const byDay = {} as Record<EventDay, FocusDaySessions>;

  const allMustAttend: ExperienceScoredSession[] = [];
  const allStrong: ExperienceScoredSession[] = [];
  const allExplore: ExperienceScoredSession[] = [];
  const printLearning: ExperienceScoredSession[] = [];
  const portfolioCounts: Record<LearningPortfolioCategory, number> = {
    CORE: 0,
    CERTIFICATION: 0,
    PERSPECTIVE: 0,
    NETWORKING: 0,
  };

  for (const day of EVENT_DAYS) {
    const daySessions = sessionsForDay(pool, day).sort(sortSessionsForScheduling);
    const blocked: ExperienceScoredSession[] = [];

    const anchors = pickNonOverlapping(
      daySessions.filter(s => s.planning_class === "general_session" || s.recommendation_tier === "must_attend"),
      1,
    );
    blocked.push(...anchors);

    const certCap = hasCertIntent && activeCertifications.length > 0
      ? Math.min(2, Math.max(0, PORTFOLIO_WEEK_TARGETS.CERTIFICATION - portfolioCounts.CERTIFICATION))
      : 0;
    const cert = certCap > 0
      ? pickNonOverlapping(
          daySessions.filter(
            s => isCertLikeSession(s) && sessionSupportsActiveCerts(s, activeCertifications),
          ),
          certCap,
          blocked,
        )
      : [];
    blocked.push(...cert);

    const labCap = portfolioCounts.CORE < PORTFOLIO_WEEK_TARGETS.CORE ? 1 : 0;
    const labs = labCap > 0
      ? pickNonOverlapping(
          daySessions.filter(s => isLabLikePlanningClass(s.planning_class)),
          labCap,
          blocked,
        )
      : [];
    blocked.push(...labs);

    const coreTarget = Math.min(
      3,
      Math.max(0, PORTFOLIO_WEEK_TARGETS.CORE - portfolioCounts.CORE - anchors.length - labs.length),
    );
    const learningCandidates = daySessions.filter(
      s =>
        isLearningPlanningClass(s.planning_class)
        && inferPortfolioCategory(s) === "CORE"
        && s.recommendation_tier !== "explore"
        && !blocked.includes(s)
        && !isCertLikeSession(s),
    );
    const learningPicks = pickNonOverlapping(learningCandidates, coreTarget, blocked);
    blocked.push(...learningPicks);

    const perspectiveCap = Math.min(
      2,
      Math.max(0, PORTFOLIO_WEEK_TARGETS.PERSPECTIVE - portfolioCounts.PERSPECTIVE),
    );
    const perspectivePicks = pickNonOverlapping(
      daySessions.filter(s => isPerspectiveCandidate(s) && !blocked.includes(s)),
      perspectiveCap,
      blocked,
    );
    blocked.push(...perspectivePicks);

    const networkingCap = Math.min(
      2,
      Math.max(0, PORTFOLIO_WEEK_TARGETS.NETWORKING - portfolioCounts.NETWORKING),
    );
    const networkingPicks = pickNonOverlapping(
      daySessions.filter(s => isNetworkingCandidate(s) && !blocked.includes(s)),
      networkingCap,
      blocked,
    );
    blocked.push(...networkingPicks);

    const explorePicks = pickNonOverlapping(
      daySessions.filter(
        s =>
          (s.recommendation_tier === "explore" || s.explore_anytime)
          && !blocked.includes(s),
      ),
      1,
      blocked,
    );

    const perspective = [...perspectivePicks, ...explorePicks.filter(s => inferPortfolioCategory(s) !== "NETWORKING")];
    const networking = networkingPicks;

    byDay[day] = {
      mustAttend: anchors,
      learning: [...labs, ...learningPicks],
      certification: cert,
      perspective,
      networking,
    };

    for (const s of [...anchors, ...labs, ...learningPicks]) portfolioCounts.CORE += 1;
    for (const s of cert) portfolioCounts.CERTIFICATION += 1;
    for (const s of perspective) portfolioCounts.PERSPECTIVE += 1;
    for (const s of networking) portfolioCounts.NETWORKING += 1;

    allMustAttend.push(...anchors);
    allStrong.push(...labs, ...learningPicks);
    allExplore.push(...perspective, ...networking);
    printLearning.push(...anchors, ...labs, ...learningPicks, ...cert);
  }

  return {
    byDay,
    mustAttend: unique(allMustAttend).slice(0, 12),
    strongAlternatives: unique(allStrong).slice(0, 12),
    exploreAnytime: unique(allExplore).slice(0, 10),
    printLearning: unique(printLearning).slice(0, 14),
    portfolioCounts,
  };
}

export function focusDayToGroups(dayPlan: FocusDaySessions) {
  const labs = dayPlan.learning.filter(s => isLabLikePlanningClass(s.planning_class));
  const coreLearning = dayPlan.learning.filter(s => !isLabLikePlanningClass(s.planning_class));

  return {
    core: [...dayPlan.mustAttend, ...coreLearning],
    cert: dayPlan.certification,
    labs,
    perspective: dayPlan.perspective,
    networking: dayPlan.networking,
  };
}
