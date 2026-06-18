interface SessionLike {
  compass_reasons?: string[];
  session_type?: string;
  activity_type?: string;
  supports_certification?: boolean;
  recommended_reason?: string;
  tracks?: {
    primary_track?: string;
    topics?: string[];
    products?: string[];
  };
  recommendation_rules?: {
    executive_relevant?: boolean;
    everyone_encouraged?: boolean;
  };
}

/** Default when scoring produced no readable reason. */
export const DEFAULT_RECOMMENDATION_REASON = "Strong fit for your goals this week.";

/** Turn raw scoring strings into attendee-friendly copy. */
export function humanizeScoringReason(reason: string): string {
  const t = reason.trim();
  if (!t) return "";

  const track = t.match(/^track match:\s*(.+)$/i);
  if (track) return `Aligns with your ${track[1]} track.`;

  const goal = t.match(/^goal match:\s*(.+)$/i);
  if (goal) return `Supports your goal: ${goal[1]}.`;

  const keyword = t.match(/^keyword match:\s*(.+)$/i);
  if (keyword) return `Matches your interest in ${keyword[1]}.`;

  const need = t.match(/^need match:\s*(.+)$/i);
  if (need) return `Addresses what you said you need: ${need[1]}.`;

  const role = t.match(/^role match:\s*(.+)$/i);
  if (role) return `Built for your role as ${role[1]}.`;

  const industry = t.match(/^industry match:\s*(.+)$/i);
  if (industry) return `Relevant to your industry (${industry[1]}).`;

  const shared = t.match(/^shared expertise:\s*(.+)$/i);
  if (shared) return `You both work in ${shared[1]}.`;

  if (/available for 1:1/i.test(t)) return "Available for a 1:1 conversation.";
  if (/executive relevant/i.test(t)) return "Relevant for executive priorities this week.";
  if (/hands-on learning/i.test(t)) return "Hands-on learning that fits your goals.";
  if (/recommended for your certification|supports certification journey|supports your certification/i.test(t)) {
    return "Supports certification journey.";
  }
  if (/popular among certification|pursuing this certification/i.test(t)) {
    return "Popular among certification candidates.";
  }
  if (/recommended preparation|exam readiness/i.test(t)) {
    return "Recommended preparation.";
  }
  if (/broad event relevance/i.test(t)) return "Popular at TechXchange this week.";

  return t.endsWith(".") ? t : `${t}.`;
}

export function humanizeMatchReasons(reasons: string[]): string[] {
  return reasons.map(humanizeScoringReason).filter(Boolean);
}

/** Best available WHY line for a scored session. */
export function resolveSessionWhyLine(
  session: SessionLike & { compass_score?: number },
  certLabel?: string | null,
): string {
  const line =
    sessionRecommendationLine(session, certLabel)
    ?? humanizeScoringReason(session.compass_reasons?.[0] ?? "");
  return line || DEFAULT_RECOMMENDATION_REASON;
}

/** One-line journey-focused copy for session cards. */
export function sessionRecommendationLine(
  session: SessionLike,
  certLabel?: string | null,
): string | null {
  const reasons = session.compass_reasons ?? [];
  const joined = reasons.join(" ").toLowerCase();
  const type = String(session.session_type ?? session.activity_type ?? "").toLowerCase();

  if (session.recommended_reason && certLabel) {
    return session.recommended_reason.endsWith(".")
      ? session.recommended_reason
      : `${session.recommended_reason}.`;
  }

  if (certLabel) {
    if (reasons.some(r => /supports your certification journey/i.test(r))) {
      return "Supports your certification journey.";
    }
    if (reasons.some(r => /exam readiness/i.test(r)) || type.includes("lab")) {
      return "Recommended for exam readiness.";
    }
    if (reasons.some(r => /pursuing this certification|pursuing/i.test(r)) || type.includes("certification")) {
      const short = certLabel.replace(/^IBM Certified\s+/i, "").trim();
      return `Popular among attendees pursuing ${short}.`;
    }
    if (reasons.some(r => /frequently completed/i.test(r))) {
      return "Frequently completed before the certification exam.";
    }
    if (reasons.some(r => /study with peers|similar goals/i.test(r))) {
      return "Study with peers pursuing similar goals.";
    }
    if (reasons.some(r => /learn alongside/i.test(r))) {
      return "Learn alongside experts and peers.";
    }
    if (session.supports_certification) {
      return "Supports your certification journey.";
    }
  }

  if (/certification journey|supports your certification/i.test(joined)) {
    return "Supports your certification journey.";
  }
  if (/community|network|peer|alumni|study with peers/i.test(joined)) {
    return "Connect with others pursuing similar goals.";
  }
  if (session.recommendation_rules?.everyone_encouraged) {
    return certLabel
      ? "Popular among attendees pursuing certification journeys."
      : "Popular among architects attending TechXchange.";
  }

  const track = session.tracks?.primary_track?.trim();
  const topics = [
    ...(session.tracks?.topics ?? []),
    ...(session.tracks?.products ?? []),
  ].filter(Boolean);

  if (track && topics.length > 0) {
    return `Recommended because it aligns to: ${track} + ${topics[0]}`;
  }
  if (topics.length >= 2) {
    return `Recommended because it aligns to: ${topics.slice(0, 2).join(" + ")}`;
  }
  if (reasons[0]) {
    return humanizeScoringReason(reasons[0]);
  }
  return null;
}
