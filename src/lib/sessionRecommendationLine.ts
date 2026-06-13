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
    const line = reasons[0].trim();
    return line.endsWith(".") ? line : `${line}.`;
  }
  return null;
}
