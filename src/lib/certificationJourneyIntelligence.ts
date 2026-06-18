import {
  getCertificationEnrichment,
  isCertificationActivityType,
  listCertificationJourneys,
  type SelectedCertificationGoal,
} from "@/lib/certificationProfile";
import type { CertificationJourneyRecord } from "@/types/certificationSession";
import type { ScoredChampion, ScoredSession } from "@/types";
import type { LiveOpportunity } from "@/types/liveOpportunity";

export interface JourneyLinkItem {
  id: string;
  title: string;
  meta?: string;
  href: string;
}

export interface CertificationJourneyPlan {
  certificationTitle: string;
  shortTitle: string;
  track?: string;
  product?: string;
  certificationCode?: string;
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
}

function sessionType(raw: { session_type?: string; activity_type?: string }): string {
  return String(raw.session_type ?? raw.activity_type ?? "").toLowerCase();
}

function isPracticeSession(raw: { session_type?: string; activity_type?: string }): boolean {
  const type = sessionType(raw);
  return /lab|workshop|hands-on|instructor-led/.test(type);
}

function isCommunitySession(raw: { session_type?: string; activity_type?: string; title?: string }): boolean {
  const type = sessionType(raw);
  const title = String(raw.title ?? "").toLowerCase();
  return /huddle|meetup|study group|community|roundtable|user group/.test(`${type} ${title}`);
}

function sessionMeta(s: ScoredSession): string | undefined {
  const parts = [
    s.schedule?.day,
    s.schedule?.start_time,
    s.schedule?.room,
  ].filter(Boolean);
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
): { goal: SelectedCertificationGoal; enrichment?: CertificationJourneyRecord } | null {
  if (selected.length > 0) {
    const goal = selected[0];
    const enrichment =
      getCertificationEnrichment(String(goal.id)) ??
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
        id: enrichment.session_id,
        title: enrichment.title,
        certification_code: enrichment.certification_code,
        track: enrichment.track,
        topics: enrichment.topics,
        products: enrichment.products,
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

function scoreSort(a: ScoredSession, b: ScoredSession): number {
  return (b.compass_score ?? 0) - (a.compass_score ?? 0);
}

export function buildCertificationJourneyPlan(
  active: { goal: SelectedCertificationGoal; enrichment?: CertificationJourneyRecord },
  allSessions: ScoredSession[],
  champions: ScoredChampion[],
  liveHuddles: LiveOpportunity[] = [],
): CertificationJourneyPlan {
  const { goal, enrichment } = active;
  const certId = enrichment?.certification_id ?? goal.id;
  const relatedSessionIds = new Set(enrichment?.related_session_ids ?? []);
  const relatedLabIds = new Set(enrichment?.related_lab_ids ?? []);
  const relatedCommunityIds = new Set([
    ...(enrichment?.related_huddle_ids ?? []),
    ...(enrichment?.related_community_ids ?? []),
  ]);
  const relatedChampionIds = new Set(enrichment?.related_champion_ids ?? []);

  const matchedSessions = allSessions.filter(s => {
    if (relatedSessionIds.has(s.id) || relatedLabIds.has(s.id) || relatedCommunityIds.has(s.id)) {
      return true;
    }
    const sid = String((s as unknown as { certification_id?: string }).certification_id ?? "");
    return sid && sid === certId;
  });

  const learnPool = matchedSessions
    .filter(s => !isPracticeSession(s) && !isCommunitySession(s) && !isCertificationActivityType(s))
    .sort(scoreSort);

  const practicePool = matchedSessions
    .filter(s => isPracticeSession(s) || relatedLabIds.has(s.id))
    .sort(scoreSort);

  const communityFromSessions = matchedSessions
    .filter(s => isCommunitySession(s) || relatedCommunityIds.has(s.id))
    .sort(scoreSort);

  const learn = learnPool.slice(0, 4).map(toSessionItem);
  const practice = practicePool.slice(0, 4).map(toSessionItem);

  const connectChamps = champions
    .filter(c => relatedChampionIds.has(c.id))
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

  const communityItems: JourneyLinkItem[] = communityFromSessions.slice(0, 3).map(toSessionItem);
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

  const achieveSession = allSessions.find(s =>
    s.id === goal.id ||
    s.id === enrichment?.session_id ||
    isCertificationActivityType(s) && String((s as unknown as { certification_id?: string }).certification_id ?? "") === certId,
  );

  const achieve: JourneyLinkItem | null = achieveSession
    ? {
        id: achieveSession.id,
        title: goal.title,
        meta: "Certification opportunity selected · available on demand",
        href: sessionHref(achieveSession.id),
      }
    : {
        id: goal.id,
        title: goal.title,
        meta: "Certification opportunity selected · available on demand",
        href: "/txc/sessions?type=certification",
      };

  const studyGroupCount = communityItems.filter(i =>
    /study group|huddle|cert prep/i.test(i.title),
  ).length;

  return {
    certificationTitle: goal.title,
    shortTitle: shortenCertificationTitle(goal.title),
    track: goal.track ?? enrichment?.track,
    product: goal.products?.[0] ?? enrichment?.products?.[0],
    certificationCode: goal.certification_code ?? enrichment?.certification_code,
    summary: {
      recommendedSessions: learnPool.length,
      labs: practicePool.length,
      experts: connectChamps.length,
      studyGroups: Math.max(studyGroupCount, certHuddles.length, communityItems.length > 0 ? 1 : 0),
    },
    learn,
    practice,
    connect: connectChamps,
    community: communityItems,
    achieve,
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
