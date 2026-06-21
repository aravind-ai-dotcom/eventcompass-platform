import type { ExperienceScoredSession } from "@/lib/experienceScoring";

export type PlanningClass =
  | "core_session"
  | "general_session"
  | "lab"
  | "workshop"
  | "bootcamp"
  | "demo"
  | "certification"
  | "community"
  | "networking"
  | "sandbox"
  | "destination"
  | "partner"
  | "open_activity";

export type RecommendationTier =
  | "must_attend"
  | "strong_match"
  | "optional"
  | "explore"
  | "hidden_from_focus";

type RawDoc = Record<string, unknown>;

function blob(raw: RawDoc): string {
  return [
    raw.title,
    raw.activity_type,
    raw.session_type,
    raw.summary,
    raw.room,
    (raw.schedule as RawDoc | undefined)?.room,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function inferPlanningClass(raw: RawDoc): PlanningClass {
  const b = blob(raw);

  if (/certif|exam prep|certification test|credential/.test(b)) return "certification";
  if (/keynote|general session/.test(b)) return "general_session";
  if (/block party|reception|networking|community night|social|meetup|lunch|grab-and-go|departure/.test(b)) {
    return /community day|community hub/.test(b) ? "community" : "networking";
  }
  if (/sandbox|expo|open destination|explore anytime/.test(b)) return "sandbox";
  if (/partner day|partner theater|partner session/.test(b)) return "partner";
  if (/community day|community hub|community lounge/.test(b)) return "community";
  if (/demo|tech desk|agent connect|lightning demo/.test(b)) return "demo";
  if (/bootcamp/.test(b)) return "bootcamp";
  if (/workshop/.test(b)) return "workshop";
  if (/instructor-led lab|hands-on lab|\blab\b/.test(b)) return "lab";
  if (/technical breakout|breakout session|\bbreakout\b/.test(b)) return "core_session";
  if (/destination|open activity|walk-in/.test(b)) return "open_activity";

  const activity = String(raw.activity_type ?? "").toLowerCase();
  if (activity.includes("lab")) return "lab";
  if (activity.includes("workshop")) return "workshop";
  if (activity.includes("keynote") || activity.includes("general")) return "general_session";
  if (activity.includes("breakout")) return "core_session";

  return "core_session";
}

export function inferRecommendationTier(
  planningClass: PlanningClass,
  compassScore: number,
  hasCertIntent: boolean,
): RecommendationTier {
  switch (planningClass) {
    case "general_session":
      return "must_attend";
    case "certification":
      return hasCertIntent ? "strong_match" : "hidden_from_focus";
    case "demo":
      return compassScore >= 35 ? "optional" : "explore";
    case "sandbox":
    case "community":
    case "partner":
    case "open_activity":
    case "destination":
      return "explore";
    case "networking":
      return "explore";
    case "lab":
    case "workshop":
    case "bootcamp":
      return compassScore >= 25 ? "strong_match" : "optional";
    case "core_session":
      if (compassScore >= 45) return "strong_match";
      if (compassScore >= 30) return "optional";
      return "explore";
    default:
      return "optional";
  }
}

export function isLearningPlanningClass(pc?: PlanningClass): boolean {
  return pc === "core_session" || pc === "lab" || pc === "workshop" || pc === "bootcamp" || pc === "general_session";
}

export function isLabLikePlanningClass(pc?: PlanningClass): boolean {
  return pc === "lab" || pc === "workshop" || pc === "bootcamp";
}

export function shouldHideFromFocus(session: ExperienceScoredSession): boolean {
  return session.recommendation_tier === "hidden_from_focus";
}

export function enrichSessionPlanningFields(
  raw: RawDoc,
  scored: ExperienceScoredSession,
  hasCertIntent: boolean,
): ExperienceScoredSession {
  const planning_class = (raw.planning_class as PlanningClass | undefined) ?? inferPlanningClass(raw);
  const recommendation_tier =
    (raw.recommendation_tier as RecommendationTier | undefined)
    ?? inferRecommendationTier(planning_class, scored.compass_score, hasCertIntent);

  return {
    ...scored,
    planning_class,
    recommendation_tier,
    start_minutes: typeof raw.start_minutes === "number" ? raw.start_minutes : scored.start_minutes,
    end_minutes: typeof raw.end_minutes === "number" ? raw.end_minutes : scored.end_minutes,
    display_time: typeof raw.display_time === "string" ? raw.display_time : scored.display_time,
    explore_anytime: raw.explore_anytime === true || recommendation_tier === "explore",
  };
}
