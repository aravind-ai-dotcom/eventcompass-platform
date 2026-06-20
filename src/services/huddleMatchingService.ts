import { formatHuddleMatchBullets } from "@/lib/huddleMatchReasons";
import { isOpenToAlumniConnections } from "@/lib/networkingIdentity";
import { normalizeName } from "@/services/networkSignalService";
import type { HuddlePreferences } from "@/services/huddlePreferencesService";
import type {
  HuddleClassification,
  HuddleDoc,
  HuddleParticipantContext,
  MatchedHuddle,
} from "@/types/huddleDataModel";

function isDiscoverable(p: HuddleParticipantContext): boolean {
  const c = p.consent ?? {};
  if (c.discoverable === false) return false;
  return !!(
    c.discoverable ||
    c.public_profile ||
    c.share_with_matched_attendees
  );
}

function institutions(p: HuddleParticipantContext): string[] {
  return (p.education ?? [])
    .map(e => e.institution?.trim())
    .filter(Boolean) as string[];
}

function employers(p: HuddleParticipantContext): string[] {
  return (p.past_employers ?? [])
    .map(e => e.company?.trim())
    .filter(Boolean) as string[];
}

function normMatch(a: string, b: string): boolean {
  return normalizeName(a) === normalizeName(b);
}

function overlap(a: string[], b: string[]): string[] {
  const hits: string[] = [];
  for (const x of a) {
    for (const y of b) {
      if (normMatch(x, y)) hits.push(x);
    }
  }
  return hits;
}

function keywordOverlap(huddle: HuddleDoc, p: HuddleParticipantContext): string[] {
  const blob = [
    ...huddle.topics,
    ...Object.values(huddle.target_audience).flat(),
    huddle.title,
    huddle.description,
  ]
    .join(" ")
    .toLowerCase();

  const keywords = [
    ...(p.compass_intelligence?.matching_keywords ?? []),
    ...(p.event_signal_profile?.goals ?? []),
    ...(p.event_signal_profile?.tech_tracks ?? []),
    ...(p.career_interests ?? []),
    ...(p.certification_goals ?? []),
  ].filter(Boolean);

  return keywords.filter(k => blob.includes(k.toLowerCase()));
}

export function scoreHuddleMatch(
  huddle: HuddleDoc,
  participant: HuddleParticipantContext,
): { matches: boolean; score: number; reasons: string[] } {
  if (huddle.host_participant_id === participant.uid) {
    return { matches: true, score: 100, reasons: ["You are hosting this huddle"] };
  }

  if (huddle.visibility === "private") {
    return { matches: false, score: 0, reasons: [] };
  }

  if (!isDiscoverable(participant)) {
    return { matches: false, score: 0, reasons: [] };
  }

  const ta = huddle.target_audience ?? {};
  const ni = participant.networking_identity ?? {};
  let score = 0;
  const reasons: string[] = [];

  switch (huddle.classification) {
    case "alumni": {
      if (!isOpenToAlumniConnections(ni)) {
        return { matches: false, score: 0, reasons: [] };
      }
      const uniHits = overlap(institutions(participant), ta.universities ?? []);
      if (uniHits.length === 0) return { matches: false, score: 0, reasons: [] };
      score += 40 + uniHits.length * 10;
      reasons.push(`${uniHits[0]} Alumni`);
      break;
    }
    case "past_employer": {
      if (!ni.open_to_past_colleague_connections) {
        return { matches: false, score: 0, reasons: [] };
      }
      const empHits = overlap(employers(participant), ta.past_employers ?? []);
      if (empHits.length === 0) return { matches: false, score: 0, reasons: [] };
      score += 40 + empHits.length * 10;
      reasons.push(`Former ${empHits[0]} Employees`);
      break;
    }
    case "certification": {
      const certHits = overlap(
        participant.certification_goals ?? [],
        ta.certifications ?? [],
      );
      const topicHits = keywordOverlap(huddle, participant);
      if (certHits.length === 0 && topicHits.length === 0) {
        return { matches: false, score: 0, reasons: [] };
      }
      if (certHits.length) {
        score += 35;
        reasons.push(`${certHits[0]} Certification Goal`);
      }
      if (topicHits.length) {
        score += 20;
        reasons.push(`${topicHits[0]} Interest`);
      }
      break;
    }
    default:
      break;
  }

  const trackHits = overlap(
    participant.event_signal_profile?.tech_tracks ?? [],
    ta.tracks ?? huddle.topics,
  );
  if (trackHits.length) {
    score += 15;
    reasons.push(`${trackHits[0]} Interest`);
  }

  const roleHits = overlap(
    participant.event_signal_profile?.roles_at_txc ?? [],
    ta.roles ?? [],
  );
  if (roleHits.length) {
    score += 10;
    reasons.push(`Role: ${roleHits[0]}`);
  }

  const kw = keywordOverlap(huddle, participant);
  if (kw.length) {
    score += Math.min(25, kw.length * 8);
    if (!reasons.some(r => r.includes(kw[0]))) {
      reasons.push(`${kw[0]} Interest`);
    }
  }

  if (huddle.visibility === "public") {
    score += 5;
  }

  if (huddle.classification === "general" && score === 0) {
    score = 10;
    reasons.push("Open conversation at the event");
  }

  const topicOnly: HuddleClassification[] = [
    "technology",
    "industry",
    "career",
    "community",
    "partner",
    "champion",
    "general",
  ];
  if (topicOnly.includes(huddle.classification) && score < 10) {
    const hits = keywordOverlap(huddle, participant);
    if (hits.length === 0 && huddle.topics.length === 0) {
      return { matches: huddle.visibility === "public", score: 5, reasons: ["Public huddle"] };
    }
    if (hits.length === 0) {
      return { matches: false, score: 0, reasons: [] };
    }
  }

  return {
    matches: score > 0 || huddle.visibility === "public",
    score,
    reasons: reasons.slice(0, 3),
  };
}

export function matchHuddlesForParticipant(
  huddles: HuddleDoc[],
  participant: HuddleParticipantContext,
  responses: Record<string, string> = {},
  preferences: HuddlePreferences | null = null,
  limit = 5,
): MatchedHuddle[] {
  const matched: MatchedHuddle[] = [];
  const hidden = new Set(preferences?.hidden_huddle_ids ?? []);
  const muted = new Set(preferences?.muted_classifications ?? []);

  for (const huddle of huddles) {
    if (huddle.status === "expired" || huddle.status === "cancelled") continue;
    if (hidden.has(huddle.id)) continue;
    if (muted.has(huddle.classification)) continue;
    if (responses[huddle.id] === "not_for_me") continue;

    const { matches, score, reasons } = scoreHuddleMatch(huddle, participant);
    if (!matches) continue;

    const bullets = formatHuddleMatchBullets(reasons, huddle.classification);
    if (bullets.length === 0) continue;

    matched.push({
      ...huddle,
      match_score: score,
      match_reasons: bullets,
      user_response: responses[huddle.id] as MatchedHuddle["user_response"],
    });
  }

  return matched
    .sort((a, b) => {
      const statusOrder = (s: string) => {
        if (s === "happening_now" || s === "ending_soon") return 0;
        if (s === "scheduled") return 1;
        return 2;
      };
      const sa = statusOrder(a.status);
      const sb = statusOrder(b.status);
      if (sa !== sb) return sa - sb;

      const startA = new Date(`${a.date}T${a.start_time}`).getTime();
      const startB = new Date(`${b.date}T${b.start_time}`).getTime();
      if (sa <= 1 && startA !== startB) return startA - startB;

      if (b.match_score !== a.match_score) return b.match_score - a.match_score;
      if (b.on_my_way_count !== a.on_my_way_count) return b.on_my_way_count - a.on_my_way_count;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    })
    .slice(0, limit);
}

export function classificationLabel(c: HuddleClassification): string {
  return c
    .split("_")
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function classificationEmoji(c: HuddleClassification): string {
  const map: Record<HuddleClassification, string> = {
    alumni: "🎓",
    past_employer: "💼",
    certification: "📜",
    technology: "⚡",
    industry: "🏭",
    career: "🚀",
    community: "🤝",
    partner: "🔗",
    champion: "⭐",
    general: "💬",
  };
  return map[c] ?? "💬";
}

export function participantFromRaw(
  uid: string,
  raw: Record<string, unknown>,
): HuddleParticipantContext {
  const consent = (raw.consent as HuddleParticipantContext["consent"]) ?? {};
  return {
    uid,
    display_name: String(raw.display_name ?? ""),
    education: Array.isArray(raw.education)
      ? (raw.education as { institution: string }[])
      : [],
    past_employers: Array.isArray(raw.past_employers)
      ? (raw.past_employers as { company: string }[])
      : [],
    networking_identity: (raw.networking_identity as HuddleParticipantContext["networking_identity"]) ?? {},
    consent: {
      ...consent,
      discoverable:
        consent.discoverable ??
        consent.public_profile ??
        consent.share_with_matched_attendees,
    },
    event_signal_profile: raw.event_signal_profile as HuddleParticipantContext["event_signal_profile"],
    certification_goals: Array.isArray(raw.certification_goals)
      ? (raw.certification_goals as string[])
      : [],
    career_interests: Array.isArray(raw.career_interests)
      ? (raw.career_interests as string[])
      : [],
    compass_intelligence: raw.compass_intelligence as HuddleParticipantContext["compass_intelligence"],
  };
}
