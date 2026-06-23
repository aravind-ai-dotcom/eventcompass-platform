import type { RecommendedPerson } from "@/components/people/RecommendedConnectionCard";
import type { ScoredSpeaker, SpeakerAvailableFor, SpeakerProfile } from "@/types/speaker";
import type { LiveOpportunity } from "@/types/liveOpportunity";

type RawDoc = Record<string, unknown>;

export interface SpeakerParticipantContext {
  tracks?: string[];
  goals?: string[];
  keywords?: string[];
  certificationGoalLabels?: string[];
  hasCertIntent?: boolean;
}

export interface ChampionSpeakerSource {
  id: string;
  display_name: string;
  title?: string;
  organization?: string;
  company?: string;
  profile?: {
    domains?: string[];
    products?: string[];
    community_interests?: string[];
  };
  give_back?: {
    can_help_with?: string[];
    contribution_tags?: string[];
  };
  community_footprint?: {
    topics_prepared_to_discuss?: string[];
    public_speaking?: boolean;
  };
  attendance?: { available_for_1x1?: boolean };
  linkedin_url?: string;
  photo_url?: string;
  consent?: { show_linkedin?: boolean; allow_intro_requests?: boolean };
  featured?: boolean;
  roles?: string[];
}

export interface SessionSpeakerSource {
  id: string;
  title: string;
  speakers?: unknown;
  tracks?: {
    primary_track?: string;
    secondary_tracks?: string[];
    topics?: string[];
    products?: string[];
  };
  related_huddle_ids?: string[];
  related_community_ids?: string[];
}

function lower(items: (string | undefined | null)[]): string[] {
  return items
    .filter((v): v is string => typeof v === "string" && v.trim() !== "")
    .map(v => v.toLowerCase());
}

export function normalizeSpeakerName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

export function extractSpeakerNamesFromSession(raw: SessionSpeakerSource | RawDoc): string[] {
  const speakers = (raw as RawDoc).speakers;
  if (!Array.isArray(speakers)) return [];
  const names: string[] = [];
  for (const speaker of speakers) {
    const name =
      typeof speaker === "string"
        ? speaker
        : String((speaker as RawDoc).name ?? (speaker as RawDoc).display_name ?? "");
    if (name.trim()) names.push(name.trim());
  }
  return names;
}

function mapHelpToAvailableFor(text: string): SpeakerAvailableFor | null {
  const blob = text.toLowerCase();
  if (/certif|exam|credential/.test(blob)) return "certification_guidance";
  if (/architect|design|review/.test(blob)) return "architecture_discussion";
  if (/product|implementation|technical/.test(blob)) return "product_expertise";
  if (/career|hiring|talent/.test(blob)) return "career_advice";
  if (/community|speaking|forum/.test(blob)) return "community_leadership";
  if (/mentor/.test(blob)) return "mentorship";
  if (/network|connect|1x1|1:1/.test(blob)) return "networking";
  return null;
}

export function deriveAvailableFor(champion: ChampionSpeakerSource): SpeakerAvailableFor[] {
  const items = [
    ...(champion.give_back?.can_help_with ?? []),
    ...(champion.give_back?.contribution_tags ?? []),
  ];
  const out = new Set<SpeakerAvailableFor>();
  if (champion.attendance?.available_for_1x1) out.add("networking");
  for (const item of items) {
    const mapped = mapHelpToAvailableFor(item);
    if (mapped) out.add(mapped);
  }
  if (champion.community_footprint?.public_speaking) out.add("community_leadership");
  if (out.size === 0) out.add("networking");
  return [...out].slice(0, 4);
}

function expertiseLabelFromSpeaker(speaker: SpeakerProfile): string | undefined {
  const primary = speaker.expertiseAreas[0] ?? speaker.topics[0];
  if (!primary) return undefined;
  return `${primary} Expert`;
}

function inferChampionForSession(
  session: SessionSpeakerSource,
  champions: ChampionSpeakerSource[],
): ChampionSpeakerSource | null {
  const track = session.tracks?.primary_track ?? "";
  const topics = [
    ...(session.tracks?.topics ?? []),
    ...(session.tracks?.products ?? []),
    ...(session.tracks?.secondary_tracks ?? []),
  ];
  const blob = lower([track, ...topics, session.title]).join(" ");
  let best: { champ: ChampionSpeakerSource; score: number } | null = null;
  for (const champ of champions) {
    if (champ.consent?.allow_intro_requests === false) continue;
    const domains = lower([
      ...(champ.profile?.domains ?? []),
      ...(champ.profile?.products ?? []),
      ...(champ.community_footprint?.topics_prepared_to_discuss ?? []),
    ]);
    let score = 0;
    for (const d of domains) {
      if (blob.includes(d) || d.split(/\s+/).some(w => w.length > 3 && blob.includes(w))) score += 2;
    }
    if (champ.community_footprint?.public_speaking) score += 1;
    if (!best || score > best.score) best = { champ, score };
  }
  return best && best.score > 0 ? best.champ : null;
}

export function buildSpeakerCatalog(
  champions: ChampionSpeakerSource[],
  sessions: SessionSpeakerSource[],
): SpeakerProfile[] {
  const byName = new Map<string, SpeakerProfile>();

  function upsertFromChampion(champ: ChampionSpeakerSource): SpeakerProfile {
    const key = normalizeSpeakerName(champ.display_name);
    const existing = byName.get(key);
    const org = champ.organization ?? champ.company;
    const topics = [
      ...(champ.profile?.domains ?? []),
      ...(champ.profile?.products ?? []),
      ...(champ.community_footprint?.topics_prepared_to_discuss ?? []),
    ];
    const communities = champ.profile?.community_interests ?? [];
    const isChampion =
      champ.featured === true ||
      (champ.roles ?? []).some(r => /champion/i.test(r)) ||
      Boolean(champ.id);

    if (existing) {
      return existing;
    }

    const profile: SpeakerProfile = {
      id: `spk-${champ.id}`,
      displayName: champ.display_name,
      title: champ.title,
      organization: org,
      sessionIds: [],
      sessionTitles: [],
      topics: [...new Set(topics.map(t => t.trim()).filter(Boolean))],
      tracks: [...new Set((champ.profile?.domains ?? []).slice(0, 4))],
      isChampion,
      communities: [...new Set(communities)],
      expertiseAreas: [...new Set(topics.map(t => t.trim()).filter(Boolean))].slice(0, 6),
      availableFor: deriveAvailableFor(champ),
      championId: champ.id,
      linkedinUrl: champ.consent?.show_linkedin !== false ? champ.linkedin_url : undefined,
      photoUrl: champ.photo_url,
      relatedHuddleIds: [],
    };
    byName.set(key, profile);
    return profile;
  }

  for (const champ of champions) {
    if (champ.consent?.allow_intro_requests === false) continue;
    upsertFromChampion(champ);
  }

  for (const session of sessions) {
    let names = extractSpeakerNamesFromSession(session);
    if (names.length === 0) {
      const inferred = inferChampionForSession(session, champions);
      if (inferred) names = [inferred.display_name];
    }
    for (const name of names) {
      const key = normalizeSpeakerName(name);
      let profile = byName.get(key);
      if (!profile) {
        const matched = champions.find(
          c => normalizeSpeakerName(c.display_name) === key,
        );
        profile = matched
          ? upsertFromChampion(matched)
          : {
              id: `spk-name-${key.replace(/\s+/g, "-")}`,
              displayName: name,
              sessionIds: [],
              sessionTitles: [],
              topics: [...(session.tracks?.topics ?? []), ...(session.tracks?.products ?? [])],
              tracks: session.tracks?.primary_track ? [session.tracks.primary_track] : [],
              isChampion: false,
              communities: [],
              expertiseAreas: [...(session.tracks?.topics ?? [])].slice(0, 4),
              availableFor: ["networking"],
            };
        byName.set(key, profile);
      }
      if (!profile.sessionIds.includes(session.id)) {
        profile.sessionIds.push(session.id);
        profile.sessionTitles.push(session.title);
      }
      if (session.tracks?.primary_track && !profile.tracks.includes(session.tracks.primary_track)) {
        profile.tracks.push(session.tracks.primary_track);
      }
      for (const topic of [...(session.tracks?.topics ?? []), ...(session.tracks?.products ?? [])]) {
        if (topic && !profile.topics.includes(topic)) profile.topics.push(topic);
      }
      if (session.related_huddle_ids?.length) {
        profile.relatedHuddleIds = [
          ...new Set([...(profile.relatedHuddleIds ?? []), ...session.related_huddle_ids]),
        ];
      }
    }
  }

  return [...byName.values()].filter(s => s.sessionIds.length > 0 || s.isChampion);
}

export function buildWhyMeetSpeakerReasons(
  speaker: SpeakerProfile,
  ctx: SpeakerParticipantContext,
): string[] {
  const reasons: string[] = [];
  const profile = lower([...(ctx.tracks ?? []), ...(ctx.goals ?? []), ...(ctx.keywords ?? [])]);
  const topics = lower(speaker.topics);

  if (ctx.hasCertIntent && speaker.availableFor.includes("certification_guidance")) {
    reasons.push("Supports your certification goal");
  }
  for (const t of profile) {
    if (topics.some(topic => topic.includes(t) || t.includes(topic))) {
      reasons.push("Matches your interests");
      break;
    }
  }
  for (const t of profile) {
    if (speaker.expertiseAreas.some(e => e.toLowerCase().includes(t) || t.includes(e.toLowerCase()))) {
      reasons.push("Shared technology focus");
      break;
    }
  }
  if (speaker.isChampion && speaker.availableFor.includes("mentorship")) {
    reasons.push("Champion mentor");
  }
  if (speaker.availableFor.includes("community_leadership") || speaker.communities.length > 0) {
    reasons.push("Community leader");
  }
  if (speaker.sessionTitles[0]) {
    reasons.push(`Presenting ${speaker.sessionTitles[0]}`);
  }
  return [...new Set(reasons)].slice(0, 4);
}

export function scoreSpeaker(
  speaker: SpeakerProfile,
  ctx: SpeakerParticipantContext,
): ScoredSpeaker {
  let score = speaker.sessionIds.length > 0 ? 8 : 0;
  const profile = lower([...(ctx.tracks ?? []), ...(ctx.goals ?? []), ...(ctx.keywords ?? [])]);
  const keywords = lower([
    ...speaker.topics,
    ...speaker.expertiseAreas,
    ...speaker.tracks,
  ]);

  for (const p of profile) {
    if (keywords.some(k => k.includes(p) || p.includes(k))) score += 12;
  }
  if (ctx.hasCertIntent && speaker.availableFor.includes("certification_guidance")) score += 15;
  if (speaker.isChampion) score += 6;
  if (speaker.sessionIds.length > 0) score += 4;

  const whyMeet = buildWhyMeetSpeakerReasons(speaker, ctx);
  return {
    ...speaker,
    compassScore: score,
    whyMeet,
    expertiseLabel: expertiseLabelFromSpeaker(speaker),
  };
}

export function rankRecommendedExperts(
  catalog: SpeakerProfile[],
  ctx: SpeakerParticipantContext,
  limit = 5,
): ScoredSpeaker[] {
  return catalog
    .filter(s => s.sessionIds.length > 0 || s.isChampion)
    .map(s => scoreSpeaker(s, ctx))
    .filter(s => s.compassScore > 0)
    .sort((a, b) => b.compassScore - a.compassScore)
    .slice(0, limit);
}

export function resolveSpeakersForSession(
  session: SessionSpeakerSource,
  catalog: SpeakerProfile[],
  ctx?: SpeakerParticipantContext,
): ScoredSpeaker[] {
  const names = extractSpeakerNamesFromSession(session);
  const keys = new Set(names.map(normalizeSpeakerName));
  if (keys.size === 0) {
    const inferred = catalog.filter(s => s.sessionIds.includes(session.id));
    return inferred
      .map(s => scoreSpeaker(s, ctx ?? {}))
      .sort((a, b) => b.compassScore - a.compassScore);
  }
  return catalog
    .filter(s => keys.has(normalizeSpeakerName(s.displayName)))
    .map(s => scoreSpeaker(s, ctx ?? {}))
    .sort((a, b) => b.compassScore - a.compassScore);
}

export function findSpeakersForQuery(
  query: string,
  catalog: SpeakerProfile[],
  ctx: SpeakerParticipantContext,
  limit = 3,
): ScoredSpeaker[] {
  const norm = query.toLowerCase();
  const tokens = norm.split(/\W+/).filter(w => w.length > 2);
  return catalog
    .map(s => {
      const blob = [
        s.displayName,
        s.title ?? "",
        s.organization ?? "",
        ...s.topics,
        ...s.expertiseAreas,
        ...s.tracks,
        ...s.sessionTitles,
      ]
        .join(" ")
        .toLowerCase();
      let matchScore = 0;
      for (const t of tokens) {
        if (blob.includes(t)) matchScore += 3;
      }
      if (/certif|exam|credential/.test(norm) && s.availableFor.includes("certification_guidance")) {
        matchScore += 8;
      }
      if (/governance|ai|openshift|cloud|data|automation|watson/.test(norm)) {
        for (const term of ["governance", "ai", "openshift", "cloud", "data", "automation", "watson"]) {
          if (norm.includes(term) && blob.includes(term)) matchScore += 5;
        }
      }
      const scored = scoreSpeaker(s, ctx);
      return { ...scored, compassScore: scored.compassScore + matchScore };
    })
    .filter(s => s.compassScore > 0)
    .sort((a, b) => b.compassScore - a.compassScore)
    .slice(0, limit);
}

export function speakerToRecommendedPerson(speaker: ScoredSpeaker): RecommendedPerson {
  return {
    id: speaker.championId ?? speaker.id,
    display_name: speaker.displayName,
    title: speaker.title,
    organization: speaker.organization,
    photo_url: speaker.photoUrl,
    linkedin_url: speaker.linkedinUrl,
    profile: {
      domains: speaker.expertiseAreas,
      products: speaker.topics.slice(0, 3),
      community_interests: speaker.communities,
    },
    compass_reasons: speaker.whyMeet,
    is_speaker: true,
    roles: speaker.isChampion ? ["Guide"] : undefined,
  };
}

export function formatSpeakerIntelligenceVoice(speaker: ScoredSpeaker): string {
  const session = speaker.sessionTitles[0];
  const reason = speaker.whyMeet[0] ?? speaker.expertiseLabel ?? "your profile";
  if (session) {
    return `${speaker.displayName} is presenting ${session} — ${reason}.`;
  }
  return `${speaker.displayName} is a strong expert match — ${reason}.`;
}

export function enrichHuddleWithSpeakerIntel(
  huddle: LiveOpportunity,
  catalog: SpeakerProfile[],
): LiveOpportunity {
  const hostKey = huddle.hostName ? normalizeSpeakerName(huddle.hostName) : "";
  const hostMatch = hostKey
    ? catalog.find(s => normalizeSpeakerName(s.displayName) === hostKey)
    : undefined;
  if (hostMatch) {
    return {
      ...huddle,
      speakerRole: "hosting",
      speakerAttendeeName: hostMatch.displayName,
    };
  }
  const topicBlob = [huddle.title, ...huddle.filterKeys, ...(huddle.tags ?? [])].join(" ").toLowerCase();
  const attending = catalog.find(s =>
    s.sessionIds.length > 0 &&
    s.expertiseAreas.some(e => topicBlob.includes(e.toLowerCase().split(/\s+/)[0] ?? "")),
  );
  if (attending) {
    return {
      ...huddle,
      speakerRole: "attending",
      speakerAttendeeName: attending.displayName,
    };
  }
  return huddle;
}

export function championFromRaw(raw: RawDoc): ChampionSpeakerSource {
  const profile = (raw.profile as ChampionSpeakerSource["profile"]) ?? undefined;
  return {
    id: String(raw.id ?? raw.champion_id ?? ""),
    display_name: String(raw.display_name ?? "Speaker"),
    title: raw.title as string | undefined,
    organization: raw.organization as string | undefined,
    company: raw.company as string | undefined,
    profile,
    give_back: raw.give_back as ChampionSpeakerSource["give_back"],
    community_footprint: raw.community_footprint as ChampionSpeakerSource["community_footprint"],
    attendance: raw.attendance as ChampionSpeakerSource["attendance"],
    linkedin_url: raw.linkedin_url as string | undefined,
    photo_url: raw.photo_url as string | undefined,
    consent: raw.consent as ChampionSpeakerSource["consent"],
    featured: raw.featured as boolean | undefined,
    roles: raw.roles as string[] | undefined,
  };
}

export function sessionFromScored(session: {
  id: string;
  title: string;
  tracks?: SessionSpeakerSource["tracks"];
  speakers?: unknown;
  related_huddle_ids?: string[];
  related_community_ids?: string[];
}): SessionSpeakerSource {
  return {
    id: session.id,
    title: session.title,
    tracks: session.tracks,
    speakers: session.speakers,
    related_huddle_ids: session.related_huddle_ids,
    related_community_ids: session.related_community_ids,
  };
}

export function otherSessionsForSpeaker(
  speaker: SpeakerProfile,
  allSessions: SessionSpeakerSource[],
  excludeSessionId?: string,
): SessionSpeakerSource[] {
  return allSessions.filter(
    s => s.id !== excludeSessionId && speaker.sessionIds.includes(s.id),
  );
}
