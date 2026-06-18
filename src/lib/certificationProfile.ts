import type { CertificationJourneyRecord } from "@/types/certificationSession";
import certificationsBundle from "../../demo-data/txc2026/certifications.json";

type ProfileDoc = Record<string, unknown>;

function sig(participant: ProfileDoc): ProfileDoc {
  return (participant.event_signal_profile as ProfileDoc) ?? {};
}

function intel(participant: ProfileDoc): ProfileDoc {
  return (participant.compass_intelligence as ProfileDoc) ?? {};
}

/** Journey milestones — vertical progression on My Compass. */
export const CERTIFICATION_MILESTONES = [
  "Certification",
  "Learn",
  "Practice",
  "Connect",
  "Community",
  "Achieve",
] as const;

export const CERTIFICATION_JOURNEY_COPY = {
  sectionKicker: "Certification journey",
  workingToward: "Working toward",
  progressSummary: "Progress summary",
  recommendedSessions: "Recommended sessions",
  labs: "Labs",
  experts: "Experts",
  studyGroups: "Study groups",
  achieveLabel: "Certification opportunity selected",
  achieveNote: "Available on demand at certification testing areas — no fixed time required.",
  exploreCertifications: "Browse certification catalog",
  addCertification: "Add a certification",
  viewAllSessions: "View all sessions",
  emptyStage: "Add sessions or resources to build this stage.",
  emptyJourney: "Choose a certification to track your learning path, knowledge, and resources in one place.",
  knowledgeLabel: "Knowledge & preparation",
  resourcesLabel: "Your resources",
  addResource: "Add resource",
  addLink: "Add link",
  pathsSupporting:
    "Join thousands of attendees using TechXchange to deepen skills, prepare for certifications, and learn alongside a global community.",
} as const;

const DEMO_CERTIFICATIONS: CertificationJourneyRecord[] =
  (certificationsBundle as { certifications: CertificationJourneyRecord[] }).certifications ?? [];

/** True when attendee selected certification intent during enrollment. */
export function hasCertificationIntent(participant: ProfileDoc): boolean {
  const goals = (sig(participant).goals as string[]) ?? [];
  if (goals.some(g => /certification|certified|cert journey|pursue a certification|earn a certification/i.test(g))) return true;

  const intent = (sig(participant).intent as ProfileDoc) ?? {};
  const aspiration = String(intent.aspiration ?? "");
  if (/certif|cert exam|certified|qiskit|watsonx|exam prep|learning path/i.test(aspiration)) {
    return true;
  }

  const keywords = (intel(participant).matching_keywords as string[]) ?? [];
  return keywords.some(k => /certif|certified|qiskit|exam prep|learning path/i.test(k));
}

/** Show Certification Journey when attendee has cert intent or saved certification goals. */
export function shouldShowCertificationJourney(
  participant: ProfileDoc,
  certGoalIds: string[],
): boolean {
  return hasCertificationIntent(participant) || certGoalIds.length > 0;
}

/** Shorter journey title for UI (learning journey, not exam card). */
export function getCertificationJourneyTitle(
  participant: ProfileDoc,
  selectedGoals: SelectedCertificationGoal[] = [],
): string | null {
  if (selectedGoals.length > 0) {
    const title = selectedGoals[0].title;
    const dash = title.split(/–|—/);
    return dash.length > 1 ? dash[dash.length - 1].trim() : title.replace(/^IBM Certified\s+/i, "").trim();
  }

  if (!hasCertificationIntent(participant)) return null;

  const intent = (sig(participant).intent as ProfileDoc) ?? {};
  const aspiration = String(intent.aspiration ?? "").trim();

  const qiskitMatch = aspiration.match(/Fundamentals of Quantum Computation Using Qiskit/i);
  if (qiskitMatch) return qiskitMatch[0];

  const ibmDevMatch = aspiration.match(/Fundamentals of Quantum[^.]+/i);
  if (ibmDevMatch) return ibmDevMatch[0];

  const ibmMatch = aspiration.match(/IBM Certified[^–—.]+(?:–|—)\s*[^.]+/i);
  if (ibmMatch) {
    const parts = ibmMatch[0].split(/–|—/);
    return parts.length > 1 ? parts[1].trim() : ibmMatch[0].trim();
  }

  if (/qiskit/i.test(aspiration)) {
    return "Fundamentals of Quantum Computation Using Qiskit";
  }
  if (/watsonx/i.test(aspiration)) {
    return "watsonx AI Engineering";
  }
  if (/agentic/i.test(aspiration)) {
    return "Agentic AI Development";
  }
  if (/openshift/i.test(aspiration)) {
    return "OpenShift Architecture";
  }

  const keywords = (intel(participant).matching_keywords as string[]) ?? [];
  const kwCert = keywords.find(k => /certified|certification|qiskit|watsonx/i.test(k));
  if (kwCert) return kwCert.replace(/^IBM Certified\s+/i, "").trim();

  return "Fundamentals of Quantum Computation Using Qiskit";
}

/** @deprecated Use getCertificationJourneyTitle — kept for scoring copy compatibility. */
export function getCertificationLabel(participant: ProfileDoc): string | null {
  return getCertificationJourneyTitle(participant);
}

export function isCertificationActivityType(raw: { session_type?: string; activity_type?: string }): boolean {
  const type = String(raw.session_type ?? raw.activity_type ?? "").toLowerCase();
  return type === "certification" || type.includes("certification exam");
}

export interface SelectedCertificationGoal {
  id: string;
  title: string;
  certification_code?: string;
  track?: string;
  topics?: string[];
  products?: string[];
  /** Catalog journey session id (Achieve milestone). */
  sessionId?: string;
}

type CertSessionLike = {
  id: string;
  title: string;
  session_type?: string;
  activity_type?: string;
  certification_code?: string;
  certification_id?: string;
  tracks?: { primary_track?: string; topics?: string[]; products?: string[] };
};

/** Collect saved certification catalog item ids from participant profile. */
export function gatherCertificationGoalIds(
  participant: ProfileDoc,
  allSessions: CertSessionLike[],
): string[] {
  const explicit = (participant.certification_goals as string[]) ?? [];
  const savedSchedule = (participant.saved_schedule as string[]) ?? [];
  const savedSessions = (participant.saved_sessions as string[]) ?? [];
  const fromSaved = [...savedSchedule, ...savedSessions].filter(id => {
    const s = allSessions.find(x => x.id === id);
    return s && isCertificationActivityType(s);
  });
  return [...new Set([...explicit, ...fromSaved])];
}

/** Resolve a single saved goal id (certification_id or legacy session id). */
export function resolveCertificationGoal(
  id: string,
  allSessions: CertSessionLike[],
): SelectedCertificationGoal | null {
  const enrichment =
    getCertificationEnrichment(id) ??
    getCertificationEnrichment(String(allSessions.find(s => s.id === id)?.certification_id ?? ""));

  if (enrichment) {
    return {
      id: enrichment.certification_id,
      title: enrichment.title,
      certification_code: enrichment.certification_code,
      track: enrichment.track,
      topics: enrichment.topics,
      products: enrichment.products,
      sessionId: enrichment.session_id,
    };
  }

  const s = allSessions.find(x => x.id === id);
  if (!s) return null;

  if (isCertificationActivityType(s)) {
    const certId = String(s.certification_id ?? s.id);
    const fromCatalog = getCertificationEnrichment(certId);
    return {
      id: fromCatalog?.certification_id ?? certId,
      title: s.title,
      certification_code: s.certification_code ?? fromCatalog?.certification_code,
      track: s.tracks?.primary_track ?? fromCatalog?.track,
      topics: (s.tracks?.topics ?? fromCatalog?.topics ?? []).slice(0, 4),
      products: (s.tracks?.products ?? fromCatalog?.products ?? []).slice(0, 3),
      sessionId: fromCatalog?.session_id ?? s.id,
    };
  }

  return null;
}

export function resolveSelectedCertificationGoals(
  allSessions: CertSessionLike[],
  ids: string[],
): SelectedCertificationGoal[] {
  const goals: SelectedCertificationGoal[] = [];
  const seen = new Set<string>();
  for (const id of ids) {
    const goal = resolveCertificationGoal(id, allSessions);
    if (!goal || seen.has(goal.id)) continue;
    seen.add(goal.id);
    goals.push(goal);
  }
  return goals;
}

export function getCertificationEnrichment(
  lookupId: string,
): CertificationJourneyRecord | undefined {
  return DEMO_CERTIFICATIONS.find(
    c => c.certification_id === lookupId || c.session_id === lookupId,
  );
}

export function listCertificationJourneys(): CertificationJourneyRecord[] {
  return DEMO_CERTIFICATIONS;
}

/** Boost session score when attendee has an active certification journey. */
export function applyCertificationSessionBoost(
  score: number,
  reasons: string[],
  participant: ProfileDoc,
  raw: ProfileDoc,
  certLabel: string | null,
): { score: number; reasons: string[] } {
  if (!certLabel) return { score, reasons };

  const next = [...reasons];
  let boosted = score;
  const type = String(raw.session_type ?? raw.activity_type ?? "").toLowerCase();
  const title = String(raw.title ?? "").toLowerCase();
  const sCI = (raw.compass_intelligence as ProfileDoc) ?? {};
  const tags = [
    title,
    ...((sCI.intent_tags as string[]) ?? []),
    ...((sCI.matching_keywords as string[]) ?? []),
  ].join(" ").toLowerCase();
  const supports = raw.supports_certification === true;
  const certId = String(raw.certification_id ?? "");

  if (isCertificationActivityType(raw)) {
    boosted += 20;
    if (!next.some(r => /certification journey|pursuing this certification|certification candidates/i.test(r))) {
      next.unshift("Popular among certification candidates.");
    }
  } else if (supports || raw.recommended_reason) {
    boosted += 14;
    if (!next.some(r => /supports certification journey|supports your certification/i.test(r))) {
      next.unshift("Supports certification journey.");
    }
  }

  if (type.includes("lab") || type.includes("workshop") || type.includes("instructor-led lab")) {
    boosted += 12;
    if (certId && !next.some(r => /recommended preparation|exam readiness|deepen skills/i.test(r))) {
      next.push("Recommended preparation.");
    } else if (!next.some(r => /recommended preparation|exam readiness|deepen skills/i.test(r))) {
      next.push("Recommended preparation.");
    }
  } else if (type.includes("huddle") || type.includes("study group")) {
    boosted += 10;
    if (!next.some(r => /study with peers|similar goals/i.test(r))) {
      next.push("Study with peers pursuing similar goals.");
    }
  } else if (type.includes("meetup") || type.includes("community")) {
    boosted += 8;
    if (!next.some(r => /learn alongside|community/i.test(r))) {
      next.push("Learn alongside experts and peers.");
    }
  } else if (/breakout|technology breakout/.test(type)) {
    boosted += 8;
    if (supports && !next.some(r => /frequently completed/i.test(r))) {
      next.push("Frequently completed before the certification exam.");
    }
  } else if (/certif|exam prep|qiskit|watsonx|agentic/.test(tags)) {
    boosted += 10;
    if (!next.some(r => /supports certification journey|supports your certification/i.test(r))) {
      next.unshift("Supports certification journey.");
    }
  }

  return { score: boosted, reasons: next };
}
