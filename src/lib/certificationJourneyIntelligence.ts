import {
  getCertificationEnrichment,
  isCertificationActivityType,
  listCertificationJourneys,
  type SelectedCertificationGoal,
} from "@/lib/certificationProfile";
import {
  matchSessionsForCertification,
  sessionCertificationId,
} from "@/lib/certificationSessionMatcher";
import { selectBalancedSessions } from "@/lib/recommendationBalancing";
import type { CertificationJourneyRecord } from "@/types/certificationSession";
import type {
  CertificationCustomLink,
  CertificationStage,
  CertificationStagePins,
} from "@/types/certificationTracker";
import { emptyCertPins } from "@/types/certificationTracker";
import type { ScoredChampion, ScoredSession } from "@/types";
import type { LiveOpportunity } from "@/types/liveOpportunity";

export interface JourneyLinkItem {
  id: string;
  title: string;
  meta?: string;
  href: string;
  external?: boolean;
}

export interface CertificationKnowledge {
  skills: string[];
  background: string[];
  guideUrl?: string;
  certUrl?: string;
  preparationHours?: number;
  description?: string;
}

export interface CertificationJourneyPlan {
  certificationId: string;
  certificationTitle: string;
  shortTitle: string;
  track?: string;
  product?: string;
  certificationCode?: string;
  knowledge: CertificationKnowledge;
  summary: {
    recommendedSessions: number;
    labs: number;
    experts: number;
    studyGroups: number;
  };
  learn: JourneyLinkItem[];
  practice: JourneyLinkItem[];
  connect: JourneyLinkItem[];
  community: JourneyLinkItem[];
  achieve: JourneyLinkItem | null;
  /** Sessions available to pin per stage (not yet pinned). */
  availableByStage: Record<CertificationStage, JourneyLinkItem[]>;
}

function sessionMeta(s: ScoredSession): string | undefined {
  const parts = [s.schedule?.day, s.schedule?.start_time, s.schedule?.room].filter(Boolean);
  return parts.length ? parts.join(" · ") : undefined;
}

function sessionHref(id: string): string {
  return `/txc/sessions?highlight=${encodeURIComponent(id)}`;
}

function championHref(id: string): string {
  return `/txc/champions?highlight=${encodeURIComponent(id)}`;
}

export function shortenCertificationTitle(title: string): string {
  const dash = title.split(/–|—/);
  if (dash.length > 1) {
    const tail = dash[dash.length - 1].trim();
    if (tail.length >= 8) return tail;
  }
  return title.replace(/^IBM Certified\s+/i, "").trim() || title;
}

export function resolveActiveCertification(
  selected: SelectedCertificationGoal[],
  certLabel: string | null,
  activeId?: string | null,
): { goal: SelectedCertificationGoal; enrichment?: CertificationJourneyRecord } | null {
  if (selected.length > 0) {
    const goal =
      (activeId ? selected.find(g => g.id === activeId) : undefined) ?? selected[0];
    const enrichment =
      getCertificationEnrichment(goal.id) ??
      getCertificationEnrichment(String(goal.certification_code ?? ""));
    return { goal, enrichment };
  }

  if (!certLabel) return null;

  const journeys = listCertificationJourneys();
  const norm = certLabel.toLowerCase();
  const enrichment =
    journeys.find(j =>
      j.title.toLowerCase().includes(norm) ||
      norm.includes(shortenCertificationTitle(j.title).toLowerCase()),
    ) ?? journeys.find(j => j.track.toLowerCase() === norm);

  if (enrichment) {
    return {
      goal: {
        id: enrichment.certification_id,
        title: enrichment.title,
        certification_code: enrichment.certification_code,
        track: enrichment.track,
        topics: enrichment.topics,
        products: enrichment.products,
        sessionId: enrichment.session_id,
      },
      enrichment,
    };
  }

  return {
    goal: {
      id: "inferred-journey",
      title: certLabel,
    },
  };
}

function toSessionItem(s: ScoredSession): JourneyLinkItem {
  return {
    id: s.id,
    title: s.title,
    meta: sessionMeta(s),
    href: sessionHref(s.id),
  };
}

function toLinkItem(link: CertificationCustomLink): JourneyLinkItem {
  return {
    id: link.id,
    title: link.title,
    meta: "External resource",
    href: link.url,
    external: true,
  };
}

function scoreSort(a: ScoredSession, b: ScoredSession): number {
  return (b.compass_score ?? 0) - (a.compass_score ?? 0);
}

function pinnedSessionItems(
  ids: string[],
  allSessions: ScoredSession[],
): JourneyLinkItem[] {
  return ids
    .map(id => allSessions.find(s => s.id === id))
    .filter((s): s is ScoredSession => !!s)
    .map(toSessionItem);
}

function mergeUniqueItems(...groups: JourneyLinkItem[][]): JourneyLinkItem[] {
  const seen = new Set<string>();
  const out: JourneyLinkItem[] = [];
  for (const group of groups) {
    for (const item of group) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      out.push(item);
    }
  }
  return out;
}

function buildKnowledge(
  goal: SelectedCertificationGoal,
  enrichment?: CertificationJourneyRecord,
): CertificationKnowledge {
  return {
    skills: enrichment?.skills_measured ?? [],
    background: enrichment?.recommended_background ?? [],
    guideUrl: enrichment?.guide_url,
    certUrl: enrichment?.certification_url,
    preparationHours: enrichment?.estimated_preparation_hours,
    description: enrichment?.description,
  };
}

export function buildCertificationJourneyPlan(
  active: { goal: SelectedCertificationGoal; enrichment?: CertificationJourneyRecord },
  allSessions: ScoredSession[],
  champions: ScoredChampion[],
  liveHuddles: LiveOpportunity[] = [],
  userPins: CertificationStagePins = emptyCertPins(),
): CertificationJourneyPlan {
  const { goal, enrichment } = active;
  const catalog =
    enrichment ??
    getCertificationEnrichment(goal.id) ??
    listCertificationJourneys().find(j => j.certification_id === goal.id);

  const matched = catalog
    ? matchSessionsForCertification(catalog, allSessions)
    : {
        all: allSessions.filter(s => sessionCertificationId(s) === goal.id),
        learn: [] as ScoredSession[],
        practice: [] as ScoredSession[],
        community: [] as ScoredSession[],
        achieve: null as ScoredSession | null,
      };

  const learnPool = [...matched.learn].sort(scoreSort);
  const practicePool = [...matched.practice].sort(scoreSort);
  const communityPool = [...matched.community].sort(scoreSort);

  const dynamicLearn = selectBalancedSessions(learnPool as ScoredSession[], {
    limit: 6,
    maxCertSessions: 1,
  }).map(toSessionItem);
  const dynamicPractice = selectBalancedSessions(practicePool as ScoredSession[], {
    limit: 6,
    maxCertSessions: 0,
  }).map(toSessionItem);
  const dynamicCommunity = communityPool.slice(0, 4).map(s => toSessionItem(s as ScoredSession));

  const pinnedLearn = mergeUniqueItems(
    pinnedSessionItems(userPins.learn, allSessions),
    (userPins.links ?? []).map(toLinkItem),
  );
  const pinnedPractice = pinnedSessionItems(userPins.practice, allSessions);
  const pinnedCommunity = pinnedSessionItems(userPins.community, allSessions);

  const learn = mergeUniqueItems(pinnedLearn, dynamicLearn).slice(0, 6);
  const practice = mergeUniqueItems(pinnedPractice, dynamicPractice).slice(0, 6);

  const relatedChampionIds = new Set(catalog?.related_champion_ids ?? []);
  const connectChamps = champions
    .filter(c => relatedChampionIds.has(c.id) || userPins.connect.includes(c.id))
    .slice(0, 4)
    .map(c => ({
      id: c.id,
      title: c.display_name,
      meta: [c.title, c.organization ?? c.company].filter(Boolean).join(" · ") || undefined,
      href: championHref(c.id),
    }));

  if (connectChamps.length === 0) {
    champions
      .sort((a, b) => (b.compass_score ?? 0) - (a.compass_score ?? 0))
      .slice(0, 3)
      .forEach(c => {
        connectChamps.push({
          id: c.id,
          title: c.display_name,
          meta: [c.title, c.organization ?? c.company].filter(Boolean).join(" · ") || undefined,
          href: championHref(c.id),
        });
      });
  }

  const communityItems = mergeUniqueItems(
    pinnedCommunity,
    dynamicCommunity,
  );

  const certHuddles = liveHuddles.filter(h =>
    h.source === "certification" ||
    /study group|certification|cert prep|exam prep/i.test(`${h.title} ${h.category}`),
  );
  for (const h of certHuddles.slice(0, 2)) {
    communityItems.push({
      id: h.id,
      title: h.title,
      meta: [h.status, h.location].filter(Boolean).join(" · ") || "Live Huddle",
      href: "/txc/experience#live",
    });
  }

  const achieveSession =
    (goal.sessionId ? allSessions.find(s => s.id === goal.sessionId) : undefined) ??
    matched.achieve ??
    allSessions.find(
      s =>
        isCertificationActivityType(s) &&
        sessionCertificationId(s) === goal.id,
    );

  const achieve: JourneyLinkItem | null = achieveSession
    ? {
        id: achieveSession.id,
        title: goal.title,
        meta: "Certification opportunity · available on demand",
        href: sessionHref(achieveSession.id),
      }
    : catalog
      ? {
          id: catalog.session_id,
          title: goal.title,
          meta: "Certification opportunity · available on demand",
          href: sessionHref(catalog.session_id),
        }
      : null;

  const pinnedIds = new Set([
    ...userPins.learn,
    ...userPins.practice,
    ...userPins.community,
  ]);

  const availableByStage: Record<CertificationStage, JourneyLinkItem[]> = {
    learn: dynamicLearn.filter(i => !pinnedIds.has(i.id)).slice(0, 8),
    practice: dynamicPractice.filter(i => !pinnedIds.has(i.id)).slice(0, 8),
    connect: connectChamps.filter(c => !userPins.connect.includes(c.id)).slice(0, 6),
    community: dynamicCommunity.filter(i => !pinnedIds.has(i.id)).slice(0, 8),
  };

  const studyGroupCount = communityItems.filter(i =>
    /study group|huddle|cert prep/i.test(i.title),
  ).length;

  return {
    certificationId: goal.id,
    certificationTitle: goal.title,
    shortTitle: shortenCertificationTitle(goal.title),
    track: goal.track ?? catalog?.track,
    product: goal.products?.[0] ?? catalog?.products?.[0],
    certificationCode: goal.certification_code ?? catalog?.certification_code,
    knowledge: buildKnowledge(goal, catalog),
    summary: {
      recommendedSessions: learnPool.length,
      labs: practicePool.length,
      experts: connectChamps.length,
      studyGroups: Math.max(studyGroupCount, certHuddles.length, communityItems.length > 0 ? 1 : 0),
    },
    learn,
    practice,
    connect: connectChamps.slice(0, 4),
    community: communityItems.slice(0, 5),
    achieve,
    availableByStage,
  };
}

export type CertJourneyVoiceTopic = "prepare" | "sessions" | "people" | "study_groups";

export function matchCertificationJourneyQuestion(norm: string): CertJourneyVoiceTopic | null {
  if (/how do i prepare|prepare for (this|my|the) cert|exam prep|get ready for cert/.test(norm)) {
    return "prepare";
  }
  if (/what sessions should i attend|sessions for (my|this|the) cert|which sessions for cert/.test(norm)) {
    return "sessions";
  }
  if (/who should i meet.*cert|meet.*certification|experts for (my|this) cert/.test(norm)) {
    return "people";
  }
  if (/study group|study groups|any study groups|cert prep group/.test(norm)) {
    return "study_groups";
  }
  return null;
}

export function formatCertificationJourneyVoice(
  topic: CertJourneyVoiceTopic,
  plan: CertificationJourneyPlan,
): { spoken: string; display: string } {
  const short = plan.shortTitle;
  switch (topic) {
    case "prepare":
      return {
        spoken: `For ${short}, start with ${plan.summary.recommendedSessions} recommended sessions and ${plan.summary.labs} labs. ${plan.learn[0] ? `Begin with ${plan.learn[0].title}.` : "Open your Certification Journey on My Compass for the full path."} Practice sessions build exam readiness, and ${plan.summary.experts} experts are matched to help.`,
        display: `Prepare · ${plan.summary.recommendedSessions} sessions · ${plan.summary.labs} labs · ${plan.summary.experts} experts`,
      };
    case "sessions":
      if (plan.learn.length === 0) {
        return {
          spoken: `Open your Certification Journey on My Compass — Compass will surface learn and practice sessions for ${short}.`,
          display: "Certification Journey · Learn + Practice",
        };
      }
      return {
        spoken: `For ${short}, I recommend ${plan.learn.slice(0, 2).map(s => s.title).join(", then ")}.${plan.practice[0] ? ` For hands-on prep, try ${plan.practice[0].title}.` : ""}`,
        display: [...plan.learn, ...plan.practice].slice(0, 4).map(s => s.title).join(" · "),
      };
    case "people":
      if (plan.connect.length === 0) {
        return {
          spoken: `Browse Champions for experts aligned to ${short}. Your Certification Journey also lists mentors as you save related sessions.`,
          display: "Champions · Certification Journey",
        };
      }
      return {
        spoken: `For ${short}, connect with ${plan.connect.slice(0, 2).map(c => c.title).join(" and ")}. They are recommended experts for this journey.`,
        display: plan.connect.map(c => c.title).join(" · "),
      };
    case "study_groups":
      if (plan.community.length === 0) {
        return {
          spoken: `Check Live Huddles on My Experience for certification study conversations forming around ${short}.`,
          display: "Live Huddles · Certification community",
        };
      }
      return {
        spoken: `For ${short}, look at ${plan.community.slice(0, 2).map(c => c.title).join(" and ")}. These are community and study opportunities on your journey.`,
        display: plan.community.map(c => c.title).join(" · "),
      };
  }
}
