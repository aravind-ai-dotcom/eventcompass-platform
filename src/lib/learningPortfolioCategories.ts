import { isCertificationActivityType } from "@/lib/certificationProfile";
import type { ExperienceScoredSession } from "@/lib/experienceScoring";
import type { PlanningClass } from "@/lib/sessionPlanning";

export type LearningPortfolioCategory = "CORE" | "CERTIFICATION" | "PERSPECTIVE" | "NETWORKING";

export const PORTFOLIO_CATEGORY_ORDER: LearningPortfolioCategory[] = [
  "CORE",
  "CERTIFICATION",
  "PERSPECTIVE",
  "NETWORKING",
];

export const PORTFOLIO_CATEGORY_META: Record<
  LearningPortfolioCategory,
  { label: string; badge: string; purpose: string; target: string }
> = {
  CORE: {
    label: "Core Learning",
    badge: "CORE",
    purpose: "Most important sessions for your goals",
    target: "3–5 sessions",
  },
  CERTIFICATION: {
    label: "Certification Support",
    badge: "CERTIFICATION",
    purpose: "Supports your selected certification goals",
    target: "2–4 sessions",
  },
  PERSPECTIVE: {
    label: "Industry & Peer Perspective",
    badge: "PERSPECTIVE",
    purpose: "Customer stories, analyst views, and peer experiences",
    target: "2–3 sessions",
  },
  NETWORKING: {
    label: "Networking & Community",
    badge: "NETWORKING",
    purpose: "Meetups, Birds of a Feather, and community events",
    target: "2–4 opportunities",
  },
};

/** Week-level distribution targets for a balanced learning plan. */
export const PORTFOLIO_WEEK_TARGETS: Record<LearningPortfolioCategory, number> = {
  CORE: 4,
  CERTIFICATION: 3,
  PERSPECTIVE: 3,
  NETWORKING: 2,
};

function sessionBlob(session: ExperienceScoredSession): string {
  return [
    session.title,
    session.session_type,
    session.activity_type,
    session.tracks?.primary_track,
    ...(session.tracks?.topics ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function isPerspectiveSession(session: ExperienceScoredSession, blob: string): boolean {
  if (session.planning_class === "partner") return true;
  if (session.planning_class === "demo" && session.recommendation_tier === "explore") return true;
  return /customer stor|analyst|peer experience|industry trend|executive panel|thought leader|case stud/.test(blob);
}

function isNetworkingSession(session: ExperienceScoredSession, blob: string): boolean {
  if (session.planning_class === "networking" || session.planning_class === "community") return true;
  return /birds of a feather|bof\b|meetup|networking|reception|social|community (day|hub|lounge)|roundtable/.test(blob);
}

export function inferPortfolioCategory(session: ExperienceScoredSession): LearningPortfolioCategory {
  const blob = sessionBlob(session);
  const pc = session.planning_class;

  if (
    pc === "certification"
    || isCertificationActivityType(session)
    || session.certification_id
    || /supports your .+ goal/i.test((session.compass_reasons ?? []).join(" "))
  ) {
    return "CERTIFICATION";
  }

  if (isNetworkingSession(session, blob)) return "NETWORKING";
  if (isPerspectiveSession(session, blob)) return "PERSPECTIVE";

  return "CORE";
}

export function assignPortfolioCategory(
  session: ExperienceScoredSession,
): ExperienceScoredSession {
  return {
    ...session,
    portfolio_category: session.portfolio_category ?? inferPortfolioCategory(session),
  };
}

export function isLabLikeForPortfolio(pc?: PlanningClass): boolean {
  return pc === "lab" || pc === "workshop" || pc === "bootcamp";
}
