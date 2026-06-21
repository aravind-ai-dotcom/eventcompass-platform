import {
  applyCertificationSessionBoost,
  getCertificationJourneyTitle,
  hasCertificationIntent,
  isCertificationActivityType,
} from "@/lib/certificationProfile";
import type { PlanningClass, RecommendationTier } from "@/lib/sessionPlanning";

export const EXPERIENCE_EVENT_BASE = "organizations/ibm/events/txc2026";

const W = {
  track: 25,
  goal: 20,
  need: 15,
  role: 10,
  industry: 10,
  keyword: 5,
  executive: 5,
  broad: 5,
  handsOn: 5,
} as const;

const FUN_TYPES = new Set([
  "general session", "keynote", "reception", "social",
  "networking", "meetup", "awards", "celebration", "party", "fun",
]);

const LEARNING_TYPES = new Set([
  "instructor-led lab", "lab", "workshop",
  "technical breakout", "breakout session", "breakout", "hands-on lab", "demo",
]);

type RawDoc = Record<string, unknown>;

export interface ExperienceScoredSession {
  id: string;
  title: string;
  session_type?: string;
  activity_type?: string;
  schedule?: { day?: string; date?: string; start_time?: string; end_time?: string; room?: string };
  tracks?: { primary_track?: string; secondary_tracks?: string[]; topics?: string[]; products?: string[] };
  recommendation_rules?: { executive_relevant?: boolean; everyone_encouraged?: boolean; hands_on?: boolean };
  date?: string;
  start_time?: string;
  room?: string;
  tech_track?: string | string[];
  compass_score: number;
  compass_reasons: string[];
  certification_id?: string;
  certification_code?: string;
  planning_class?: PlanningClass;
  recommendation_tier?: RecommendationTier;
  start_minutes?: number;
  end_minutes?: number;
  display_time?: string;
  explore_anytime?: boolean;
}

export interface ExperienceScoredChampion {
  id: string;
  display_name: string;
  title?: string;
  organization?: string;
  company?: string;
  profile?: { domains?: string[]; products?: string[] };
  attendance?: { available_for_1x1?: boolean };
  linkedin_url?: string;
  consent?: { show_linkedin?: boolean };
  compass_score: number;
  shared_keywords: string[];
  compass_reasons: string[];
}

function lower(items: (string | undefined | null)[]): string[] {
  return items
    .filter((v): v is string => typeof v === "string" && v.trim() !== "")
    .map(v => v.toLowerCase());
}

function allTracks(raw: RawDoc): string[] {
  const tracks = (raw.tracks as RawDoc | undefined) ?? {};
  const primary = (tracks.primary_track as string) ?? "";
  const secondary = (tracks.secondary_tracks as string[]) ?? [];
  const legacy = raw.tech_track;
  const legacyArr = Array.isArray(legacy) ? (legacy as string[])
    : typeof legacy === "string" && legacy ? [legacy] : [];
  return [primary, ...secondary, ...legacyArr].filter(Boolean);
}

export function experienceSessionTypeLabel(s: ExperienceScoredSession): string {
  return (s.session_type ?? s.activity_type ?? "Session").trim();
}

export function experienceSessionMeta(s: ExperienceScoredSession): string {
  if (isCertificationActivityType(s)) return "";
  const raw = s as unknown as RawDoc;
  const day = String(raw.date ?? s.schedule?.day ?? "");
  const start = String(raw.start_time ?? s.schedule?.start_time ?? "");
  const room = String(raw.room ?? s.schedule?.room ?? "");
  return [day, start, room].filter(Boolean).join(" · ");
}

function getPillar(s: ExperienceScoredSession): "Learning" | "Community" | "Fun" | null {
  if (isCertificationActivityType(s)) return null;
  const t = experienceSessionTypeLabel(s).toLowerCase();
  if (FUN_TYPES.has(t)) return "Fun";
  if (LEARNING_TYPES.has(t)) return "Learning";
  return "Community";
}

export function scoreExperienceSession(participant: RawDoc, raw: RawDoc): ExperienceScoredSession {
  let score = 0;
  const reasons: string[] = [];

  const sig = (participant.event_signal_profile as RawDoc) ?? {};
  const intel = (participant.compass_intelligence as RawDoc) ?? {};
  const reg = (participant.registration as RawDoc) ?? {};
  const intent = (sig.intent as RawDoc) ?? {};

  const pTracks = lower((sig.tech_tracks as string[]) ?? []);
  const pGoals = lower((sig.goals as string[]) ?? []);
  const pNeeds = lower((intent.needs as string[]) ?? []);
  const pKeywords = lower((intel.matching_keywords as string[]) ?? []);
  const pRoles = lower((sig.roles_at_txc as string[]) ?? []);
  const pIndustry = ((reg.industry as string) ?? "").toLowerCase().trim();

  const sCI = (raw.compass_intelligence as RawDoc) ?? {};
  const sAudience = (raw.audience as RawDoc) ?? {};
  const sRules = (raw.recommendation_rules as RawDoc) ?? {};

  const sTracks = lower(allTracks(raw));
  const sIntents = lower((sCI.intent_tags as string[]) ?? []);
  const sNeeds = lower((sCI.need_tags as string[]) ?? []);
  const sKeywords = lower((sCI.matching_keywords as string[]) ?? []);
  const sRoles = lower((sAudience.roles as string[]) ?? []);
  const sIndustries = lower((sAudience.industries as string[]) ?? []);

  for (const t of pTracks) { if (sTracks.includes(t)) { score += W.track; reasons.push("Track match: " + t); } }
  for (const g of pGoals) { if (sIntents.includes(g)) { score += W.goal; reasons.push("Goal match: " + g); } }
  for (const n of pNeeds) { if (sNeeds.includes(n)) { score += W.need; reasons.push("Need match: " + n); } }
  for (const r of pRoles) { if (sRoles.includes(r)) { score += W.role; reasons.push("Role match: " + r); } }
  if (pIndustry && sIndustries.includes(pIndustry)) { score += W.industry; reasons.push("Industry match: " + String(reg.industry)); }
  for (const k of pKeywords) { if (sKeywords.includes(k)) { score += W.keyword; reasons.push("Keyword match: " + k); } }
  if (sRules.executive_relevant) { score += W.executive; reasons.push("Executive relevant"); }
  if (sRules.everyone_encouraged) { score += W.broad; reasons.push("Broad event relevance"); }
  if (sRules.hands_on) { score += W.handsOn; reasons.push("Hands-on learning"); }

  const certLabel = getCertificationJourneyTitle(participant);
  const boosted = applyCertificationSessionBoost(score, reasons, participant, raw, certLabel);

  return {
    id: String(raw.id ?? raw.session_id ?? ""),
    title: String(raw.title ?? "Untitled session"),
    session_type: raw.session_type as string | undefined,
    activity_type: raw.activity_type as string | undefined,
    schedule: raw.schedule as ExperienceScoredSession["schedule"],
    tracks: raw.tracks as ExperienceScoredSession["tracks"],
    recommendation_rules: raw.recommendation_rules as ExperienceScoredSession["recommendation_rules"],
    date: raw.date as string | undefined,
    start_time: raw.start_time as string | undefined,
    room: raw.room as string | undefined,
    tech_track: raw.tech_track as string | string[] | undefined,
    certification_id: raw.certification_id as string | undefined,
    certification_code: raw.certification_code as string | undefined,
    compass_score: boosted.score,
    compass_reasons: boosted.reasons,
  };
}

export function scoreExperienceChampion(participant: RawDoc, raw: RawDoc): ExperienceScoredChampion {
  if ((raw.consent as RawDoc | undefined)?.allow_intro_requests === false) {
    return {
      id: String(raw.id ?? ""),
      display_name: String(raw.display_name ?? "Champion"),
      compass_score: 0,
      shared_keywords: [],
      compass_reasons: [],
    };
  }
  const intel = (participant.compass_intelligence as RawDoc) ?? {};
  const pKws = lower((intel.matching_keywords as string[]) ?? []);
  const profile = (raw.profile as RawDoc) ?? {};
  const cIntel = (raw.compass_intelligence as RawDoc) ?? {};
  const cKws = lower([
    ...((profile.domains as string[]) ?? []),
    ...((profile.products as string[]) ?? []),
    ...((cIntel.matching_keywords as string[]) ?? []),
    ...((raw.domains as string[]) ?? []),
  ]);
  const shared: string[] = [];
  let score = 0;
  for (const kw of pKws) { if (cKws.includes(kw)) { score += 10; shared.push(kw); } }
  const attendance = raw.attendance as RawDoc | undefined;
  if (attendance?.available_for_1x1 === true) score += 5;

  const reasons: string[] = shared.map(kw => "Shared expertise: " + kw);
  if (attendance?.available_for_1x1 === true) reasons.push("Available for 1:1");

  if (hasCertificationIntent(participant)) {
    const domains = lower([
      ...((profile.domains as string[]) ?? []),
      ...((raw.domains as string[]) ?? []),
    ]);
    if (domains.some(d => /certif|qiskit|developer|training|sme|exam/i.test(d))) {
      score += 15;
      reasons.unshift("goal match: certification journey");
    }
  }

  const sig = (participant.event_signal_profile as RawDoc) ?? {};
  const pTracks = lower((sig.tech_tracks as string[]) ?? []);
  const pGoals = lower((sig.goals as string[]) ?? []);
  const reg = (participant.registration as RawDoc) ?? {};
  const pIndustry = ((reg.industry as string) ?? "").toLowerCase().trim();
  const champOrg = String(raw.organization ?? raw.company ?? "").toLowerCase();

  for (const track of pTracks) {
    if (cKws.some(k => k.includes(track) || track.includes(k))) {
      score += 8;
      reasons.push(`track match: ${track}`);
      break;
    }
  }

  for (const goal of pGoals.slice(0, 2)) {
    if (cKws.some(k => k.includes(goal) || goal.includes(k))) {
      score += 6;
      reasons.push(`goal match: ${goal}`);
    }
  }

  if (pIndustry && champOrg && (champOrg.includes(pIndustry) || pIndustry.includes(champOrg.split(/\s+/)[0] ?? ""))) {
    score += 8;
    reasons.push(`industry match: ${pIndustry}`);
  }

  return {
    id: String(raw.id ?? ""),
    display_name: String(raw.display_name ?? "Champion"),
    title: raw.title as string | undefined,
    organization: raw.organization as string | undefined,
    profile: raw.profile as ExperienceScoredChampion["profile"],
    attendance: raw.attendance as ExperienceScoredChampion["attendance"],
    linkedin_url: raw.linkedin_url as string | undefined,
    consent: raw.consent as ExperienceScoredChampion["consent"],
    compass_score: score,
    shared_keywords: shared,
    compass_reasons: [...new Set(reasons)],
  };
}

export function partitionExperienceSessions(scored: ExperienceScoredSession[]) {
  const learning: ExperienceScoredSession[] = [];
  const community: ExperienceScoredSession[] = [];
  const fun: ExperienceScoredSession[] = [];
  for (const s of scored) {
    const p = getPillar(s);
    if (!p) continue;
    if (p === "Learning") learning.push(s);
    else if (p === "Fun") fun.push(s);
    else community.push(s);
  }
  return { learning, community, fun };
}

export function extractSessionSpeakerNames(rawSessions: RawDoc[]): Set<string> {
  const names = new Set<string>();
  for (const session of rawSessions) {
    const speakers = session.speakers;
    if (!Array.isArray(speakers)) continue;
    for (const speaker of speakers) {
      const name =
        typeof speaker === "string"
          ? speaker
          : String((speaker as RawDoc).name ?? (speaker as RawDoc).display_name ?? "");
      if (name.trim()) names.add(name.trim().toLowerCase());
    }
  }
  return names;
}
