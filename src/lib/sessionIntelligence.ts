import { humanizeScoringReason } from "@/lib/sessionRecommendationLine";

export type SessionSignalId =
  | "track_match"
  | "goal_match"
  | "role_match"
  | "industry_match"
  | "certification_match"
  | "hands_on"
  | "community_match"
  | "champion_match"
  | "executive_relevant"
  | "need_match"
  | "keyword_match"
  | "popular";

export type SessionBadgeId =
  | "hands-on"
  | "certification"
  | "certification-booster"
  | "champion-led"
  | "community-favorite"
  | "popular"
  | "limited-capacity"
  | "networking"
  | "executive";

export const SESSION_BADGE_LABELS: Record<SessionBadgeId, string> = {
  "hands-on": "Hands-On",
  certification: "Essential for Certification",
  "certification-booster": "Supports Certification Goal",
  "champion-led": "Champion-Led",
  "community-favorite": "Community Favorite",
  popular: "Popular",
  "limited-capacity": "Limited Capacity",
  networking: "Networking Opportunity",
  executive: "Executive Relevant",
};

export const SESSION_SIGNAL_LABELS: Record<SessionSignalId, string> = {
  track_match: "Track match",
  goal_match: "Goal match",
  role_match: "Role match",
  industry_match: "Industry match",
  certification_match: "Certification path",
  hands_on: "Hands-on",
  community_match: "Community",
  champion_match: "Champion-led",
  executive_relevant: "Executive",
  need_match: "Need match",
  keyword_match: "Interest match",
  popular: "Popular",
};

export interface SessionIntelInput {
  compass_score?: number;
  compass_reasons?: string[];
  session_type?: string;
  activity_type?: string;
  supports_certification?: boolean;
  recommended_reason?: string;
  certification_id?: string;
  related_champion_ids?: string[];
  related_community_ids?: string[];
  tracks?: {
    primary_track?: string;
    topics?: string[];
    products?: string[];
  };
  recommendation_rules?: {
    executive_relevant?: boolean;
    everyone_encouraged?: boolean;
    hands_on?: boolean;
    good_for_networking?: boolean;
  };
  capacity?: { status?: string; available_slots?: number };
}

export interface SessionIntelligence {
  score: number;
  reasons: string[];
  signals: SessionSignalId[];
  badges: SessionBadgeId[];
}

function sessionType(session: SessionIntelInput): string {
  return String(session.session_type ?? session.activity_type ?? "").toLowerCase();
}

function classifyReason(raw: string, certLabel?: string | null): { signal: SessionSignalId; line: string } | null {
  const t = raw.trim();
  if (!t) return null;

  const track = t.match(/^track match:\s*(.+)$/i);
  if (track) {
    const name = track[1].trim();
    return {
      signal: "track_match",
      line: name.length > 2
        ? `Matches your technology interests (${name})`
        : "Matches your technology interests",
    };
  }

  const goal = t.match(/^goal match:\s*(.+)$/i);
  if (goal) {
    const g = goal[1].trim();
    if (/certif/i.test(g) || certLabel) {
      return { signal: "goal_match", line: "Supports your certification goal" };
    }
    return { signal: "goal_match", line: `Aligns with your goal: ${g}` };
  }

  const role = t.match(/^role match:\s*(.+)$/i);
  if (role) {
    return { signal: "role_match", line: "Relevant to your role" };
  }

  const industry = t.match(/^industry match:\s*(.+)$/i);
  if (industry) {
    return { signal: "industry_match", line: "Relevant to your industry" };
  }

  const need = t.match(/^need match:\s*(.+)$/i);
  if (need) {
    return { signal: "need_match", line: `Addresses what you need: ${need[1].trim()}` };
  }

  const keyword = t.match(/^keyword match:\s*(.+)$/i);
  if (keyword) {
    return { signal: "keyword_match", line: `Matches your interest in ${keyword[1].trim()}` };
  }

  if (/executive relevant/i.test(t)) {
    return { signal: "executive_relevant", line: "Relevant for executive priorities" };
  }

  if (/hands-on learning/i.test(t)) {
    return { signal: "hands_on", line: "Hands-on learning experience" };
  }

  if (/broad event relevance|popular among/i.test(t)) {
    return { signal: "popular", line: "Popular among attendees with similar goals" };
  }

  if (/supports your .+ goal/i.test(t)) {
    const title = t.replace(/^supports your /i, "").replace(/ goal$/i, "").trim();
    return { signal: "certification_match", line: `Supports your ${title} goal` };
  }

  if (/supports your certification|supports certification journey|certification journey|exam readiness|pursuing this certification|frequently completed|study with peers|learn alongside|recommended preparation|popular among certification/i.test(t)) {
    if (/popular among certification|pursuing this certification/i.test(t)) {
      return { signal: "certification_match", line: "Popular among certification candidates" };
    }
    if (/recommended preparation|exam readiness|frequently completed/i.test(t)) {
      return { signal: "certification_match", line: "Recommended preparation" };
    }
    return { signal: "certification_match", line: "Supports certification journey" };
  }

  if (/community|study with peers|learn alongside|network|peer|alumni/i.test(t)) {
    return { signal: "community_match", line: "Connect with others pursuing similar goals" };
  }

  if (/champion|expert|1:1|mentor/i.test(t)) {
    return { signal: "champion_match", line: "Opportunity to learn from an expert" };
  }

  const human = humanizeScoringReason(t);
  if (human) {
    return { signal: "keyword_match", line: human.replace(/\.$/, "") };
  }

  return null;
}

export function deriveSessionBadges(session: SessionIntelInput): SessionBadgeId[] {
  const badges: SessionBadgeId[] = [];
  const type = sessionType(session);
  const rules = session.recommendation_rules ?? {};
  const reasons = (session.compass_reasons ?? []).join(" ").toLowerCase();

  if (rules.hands_on || /lab|workshop|hands-on|instructor-led lab/.test(type)) {
    badges.push("hands-on");
  }

  if (/supports your .+ goal/i.test(reasons)) {
    badges.push("certification-booster");
  }

  if (
    session.supports_certification ||
    session.certification_id ||
    type.includes("certification") ||
    /certification journey|supports your certification/.test(reasons)
  ) {
    badges.push("certification");
  }

  if ((session.related_champion_ids?.length ?? 0) > 0 || /champion|expert-led/.test(type)) {
    badges.push("champion-led");
  }

  if (
    (session.related_community_ids?.length ?? 0) > 0 ||
    /community|meetup|user group|study group|huddle/.test(type)
  ) {
    badges.push("community-favorite");
  }

  if (rules.everyone_encouraged || /broad event relevance|popular among/.test(reasons)) {
    badges.push("popular");
  }

  if (session.capacity?.status === "limited" || (session.capacity?.available_slots ?? 99) <= 20) {
    badges.push("limited-capacity");
  }

  if (
    rules.good_for_networking ||
    /network|reception|social|meetup|roundtable/.test(type)
  ) {
    badges.push("networking");
  }

  if (rules.executive_relevant || /executive relevant/.test(reasons)) {
    badges.push("executive");
  }

  return [...new Set(badges)].slice(0, 5);
}

/** Structured recommendation bullets from scoring engine inputs. */
export function buildSessionRecommendationReasons(
  session: SessionIntelInput,
  certLabel?: string | null,
): string[] {
  const lines: string[] = [];
  const seen = new Set<string>();
  const signals: SessionSignalId[] = [];

  for (const raw of session.compass_reasons ?? []) {
    const parsed = classifyReason(raw, certLabel);
    if (!parsed) continue;
    signals.push(parsed.signal);
    if (!seen.has(parsed.line)) {
      seen.add(parsed.line);
      lines.push(parsed.line);
    }
  }

  if (session.recommended_reason && certLabel) {
    const line = session.recommended_reason.replace(/\.$/, "");
    if (!seen.has(line)) {
      seen.add(line);
      lines.push(line);
      signals.push("certification_match");
    }
  }

  const rules = session.recommendation_rules ?? {};
  if (rules.hands_on && !lines.some(l => /hands-on/i.test(l))) {
    lines.push("Hands-on learning experience");
    signals.push("hands_on");
  }

  if (rules.executive_relevant && !lines.some(l => /executive/i.test(l))) {
    lines.push("Relevant for executive priorities");
    signals.push("executive_relevant");
  }

  if (rules.everyone_encouraged && !lines.some(l => /popular/i.test(l))) {
    lines.push("Popular among attendees with similar goals");
    signals.push("popular");
  }

  if (
    certLabel &&
    (session.supports_certification || session.certification_id) &&
    !lines.some(l => /certification/i.test(l))
  ) {
    lines.push("Supports your certification goal");
    signals.push("certification_match");
  }

  if ((session.related_champion_ids?.length ?? 0) > 0 && !lines.some(l => /expert|champion/i.test(l))) {
    lines.push("Champion-led learning opportunity");
    signals.push("champion_match");
  }

  const track = session.tracks?.primary_track?.trim();
  if (track && !lines.some(l => /technology interests|track/i.test(l))) {
    lines.push(`Matches your technology interests (${track})`);
    signals.push("track_match");
  }

  if (lines.length < 2 && session.compass_score && session.compass_score >= 30) {
    if (!lines.some(l => /profile|goals/i.test(l))) {
      lines.push("Highly relevant to your selected tracks");
    }
  }

  if (lines.length < 2) {
    lines.push("Recommended for attendees with similar interests");
  }

  return lines.slice(0, 4);
}

function uniqueSessionSignals(ids: SessionSignalId[]): SessionSignalId[] {
  const seen = new Set<SessionSignalId>();
  const out: SessionSignalId[] = [];
  for (const id of ids) {
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out.slice(0, 5);
}

export function buildSessionIntelligence(
  session: SessionIntelInput,
  certLabel?: string | null,
): SessionIntelligence {
  const reasons = buildSessionRecommendationReasons(session, certLabel);
  const signals: SessionSignalId[] = [];

  for (const raw of session.compass_reasons ?? []) {
    const parsed = classifyReason(raw, certLabel);
    if (parsed) signals.push(parsed.signal);
  }

  const resolvedSignals = signals.length > 0
    ? uniqueSessionSignals(signals)
    : uniqueSessionSignals(inferSignalsFromBadges(deriveSessionBadges(session)));

  return {
    score: session.compass_score ?? 0,
    reasons,
    signals: resolvedSignals,
    badges: deriveSessionBadges(session),
  };
}

function inferSignalsFromBadges(badges: SessionBadgeId[]): SessionSignalId[] {
  const map: Partial<Record<SessionBadgeId, SessionSignalId>> = {
    "hands-on": "hands_on",
    certification: "certification_match",
    "champion-led": "champion_match",
    "community-favorite": "community_match",
    popular: "popular",
    executive: "executive_relevant",
    networking: "community_match",
  };
  return badges.map(b => map[b]).filter((s): s is SessionSignalId => !!s).slice(0, 5);
}

/** Voice + compact cards — first 2 reasons as one line. */
export function formatSessionIntelligenceSummary(
  session: SessionIntelInput,
  certLabel?: string | null,
  maxReasons = 2,
): string {
  const reasons = buildSessionRecommendationReasons(session, certLabel);
  return reasons.slice(0, maxReasons).join(". ") + (reasons.length ? "." : "");
}

/** Voice — full spoken explanation. */
export function formatSessionIntelligenceVoice(
  session: SessionIntelInput,
  certLabel?: string | null,
): string {
  const intel = buildSessionIntelligence(session, certLabel);
  const parts = intel.reasons.slice(0, 4);
  if (parts.length === 0) return "Compass matched this to your profile signals.";
  if (parts.length === 1) return `Compass recommended this because ${parts[0].toLowerCase()}.`;
  return `Compass recommended this because ${parts.slice(0, -1).join(", ").toLowerCase()}, and ${parts[parts.length - 1].toLowerCase()}.`;
}
