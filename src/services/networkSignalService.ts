// =============================================================================
// EventCompass — Network Signal Service
// src/services/networkSignalService.ts
// Pure TypeScript. No Firebase. No React. No side effects.
// =============================================================================

import { isOpenToAlumniConnections } from "@/lib/networkingIdentity";

type RawDoc = Record<string, unknown>;

export interface EducationEntry {
  institution:      string;
  degree?:          string;
  field?:           string;
  graduation_year?: string;
}

export interface PastEmployerEntry {
  company: string;
  role?:   string;
  years?:  string;
}

export interface NetworkingIdentity {
  open_to_alumni_connections:          boolean;
  open_to_past_colleague_connections:  boolean;
  /** @deprecated Read via isOpenToAlumniConnections — merged into alumni signal */
  open_to_university_connections?:     boolean;
  open_to_career_conversations:        boolean;
}

export interface ParticipantNetworkSignals {
  uid:              string;
  display_name:     string;
  education:        EducationEntry[];
  past_employers:   PastEmployerEntry[];
  current_org:      string;
  career_interests: string[];
  linkedin_url?:    string;
  networking_identity: NetworkingIdentity;
  consent_public:   boolean;
}

export interface NetworkMatchResult {
  uid:          string;
  display_name: string;
  score:        number;
  reasons:      string[];
  linkedin_url?: string;
  current_org:  string;
}

export interface NetworkPulseSummary {
  topUniversities:    [string, number][];
  topPastEmployers:   [string, number][];
  topCareerInterests: [string, number][];
  openToAlumni:       number;
  openToColleagues:   number;
  openToCareer:       number;
  total:              number;
}

// ─────────────────────────────────────────────────────────────────────────────

export function normalizeName(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
}

function arrStr(val: unknown): string[] {
  if (!Array.isArray(val)) return [];
  return (val as unknown[]).filter(v => typeof v === "string" && (v as string).trim()).map(v => String(v).trim());
}

export function getParticipantNetworkSignals(raw: RawDoc): ParticipantNetworkSignals {
  const edu = (raw.education      as EducationEntry[])    ?? [];
  const emp = (raw.past_employers as PastEmployerEntry[]) ?? [];
  const ni  = (raw.networking_identity as NetworkingIdentity) ?? {};
  const consent = (raw.consent as RawDoc) ?? {};

  return {
    uid:              String(raw.id ?? raw.uid ?? ""),
    display_name:     String(raw.display_name ?? ""),
    education:        Array.isArray(edu) ? edu : [],
    past_employers:   Array.isArray(emp) ? emp : [],
    current_org:      String(raw.company ?? raw.organization ?? ""),
    career_interests: arrStr(raw.career_interests),
    linkedin_url:     typeof raw.linkedin_url === "string" ? raw.linkedin_url : undefined,
    networking_identity: {
      open_to_alumni_connections:         isOpenToAlumniConnections(ni),
      open_to_past_colleague_connections: ni.open_to_past_colleague_connections ?? false,
      open_to_career_conversations:       ni.open_to_career_conversations       ?? false,
    },
    consent_public: !!(
      (consent.networking as boolean) ||
      (consent.public_profile as boolean) ||
      (consent.allow_intro_requests as boolean)
    ),
  };
}

export function scoreNetworkMatch(
  current: ParticipantNetworkSignals,
  other:   ParticipantNetworkSignals
): NetworkMatchResult {
  if (other.uid === current.uid || !other.consent_public) {
    return { uid: other.uid, display_name: other.display_name, score: 0, reasons: [], current_org: other.current_org };
  }

  let score = 0;
  const reasons: string[] = [];

  // Same university — alumni signal covers legacy university community intent
  for (const ce of current.education) {
    for (const oe of other.education) {
      if (normalizeName(ce.institution) === normalizeName(oe.institution) &&
          isOpenToAlumniConnections(other.networking_identity)) {
        score += 30;
        reasons.push(`Alumni: ${ce.institution}`);
        break;
      }
    }
  }

  // Same past employer (+25)
  for (const ce of current.past_employers) {
    for (const oe of other.past_employers) {
      if (normalizeName(ce.company) === normalizeName(oe.company) &&
          other.networking_identity.open_to_past_colleague_connections) {
        score += 25;
        reasons.push(`Past colleague: ${ce.company}`);
        break;
      }
    }
  }

  // Same current org (+15)
  if (current.current_org && other.current_org &&
      normalizeName(current.current_org) === normalizeName(other.current_org)) {
    score += 15;
    reasons.push(`Same organisation: ${other.current_org}`);
  }

  // Shared career interests (+10 each, cap 2)
  let ciCount = 0;
  for (const ci of current.career_interests) {
    if (ciCount >= 2) break;
    if (other.career_interests.some(oi => normalizeName(oi) === normalizeName(ci))) {
      score += 10; ciCount++;
      reasons.push(`Career interest: ${ci}`);
    }
  }

  // LinkedIn present (+5)
  if (other.linkedin_url) score += 5;

  // Open to career conversations (+10)
  if (other.networking_identity.open_to_career_conversations && current.career_interests.length > 0) {
    score += 10;
    reasons.push("Open to career conversations");
  }

  return { uid: other.uid, display_name: other.display_name, score, reasons, linkedin_url: other.linkedin_url, current_org: other.current_org };
}

export function summarizeNetworkPulse(participants: RawDoc[]): NetworkPulseSummary {
  const univCounts: Record<string, number> = {};
  const empCounts:  Record<string, number> = {};
  const ciCounts:   Record<string, number> = {};
  let openToAlumni = 0, openToColleagues = 0, openToCareer = 0;

  for (const p of participants) {
    const sig = getParticipantNetworkSignals(p);
    for (const e of sig.education)       if (e.institution) { const k = e.institution.trim(); univCounts[k] = (univCounts[k] ?? 0) + 1; }
    for (const e of sig.past_employers)  if (e.company)     { const k = e.company.trim();     empCounts[k]  = (empCounts[k]  ?? 0) + 1; }
    for (const ci of sig.career_interests) if (ci)          { ciCounts[ci] = (ciCounts[ci] ?? 0) + 1; }
    if (isOpenToAlumniConnections(sig.networking_identity)) openToAlumni++;
    if (sig.networking_identity.open_to_past_colleague_connections) openToColleagues++;
    if (sig.networking_identity.open_to_career_conversations)       openToCareer++;
  }

  const sortTop = (m: Record<string, number>, n = 6): [string, number][] =>
    Object.entries(m).sort(([, a], [, b]) => b - a).slice(0, n);

  return {
    topUniversities:    sortTop(univCounts),
    topPastEmployers:   sortTop(empCounts),
    topCareerInterests: sortTop(ciCounts),
    openToAlumni, openToColleagues, openToCareer,
    total: participants.length,
  };
}
