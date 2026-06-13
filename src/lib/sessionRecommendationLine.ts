interface SessionLike {
  compass_reasons?: string[];
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

/** One-line “why should I care?” copy for session cards. */
export function sessionRecommendationLine(session: SessionLike): string | null {
  const reasons = session.compass_reasons ?? [];
  const joined = reasons.join(" ").toLowerCase();

  if (/certif|exam|credential/.test(joined)) {
    return "Supports your certification goal.";
  }
  if (/community|network|peer|alumni/.test(joined)) {
    return "Matches your community interests.";
  }
  if (session.recommendation_rules?.everyone_encouraged) {
    return "Popular among architects attending TechXchange.";
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
  if (track && /agentic|ai|cloud|automation|data|openshift/i.test(`${track} ${topics.join(" ")}`)) {
    return `Recommended because it aligns to: ${[track, ...topics].filter(Boolean).slice(0, 2).join(" + ")}`;
  }
  if (reasons[0]) {
    const line = reasons[0].trim();
    return line.endsWith(".") ? line : `${line}.`;
  }
  return null;
}
