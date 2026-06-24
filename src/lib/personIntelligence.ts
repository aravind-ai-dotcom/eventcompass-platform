import { humanizeMatchReasons, humanizeScoringReason } from "@/lib/sessionRecommendationLine";

export type PersonSignalId = "technology" | "industry" | "goal" | "networking" | "certification";

export const PERSON_SIGNAL_LABELS: Record<PersonSignalId, string> = {
  technology: "Technology Match",
  industry: "Industry Match",
  goal: "Goal Match",
  networking: "Networking Match",
  certification: "Certification Match",
};

export interface PersonIntelInput {
  compass_score?: number;
  compass_reasons?: string[];
  title?: string;
  organization?: string;
  company?: string;
  profile?: { domains?: string[]; products?: string[] };
  attendance?: { available_for_1x1?: boolean };
  education?: Array<{ institution?: string } | string>;
}

export interface PersonIntelligence {
  score: number;
  reasons: string[];
  signals: PersonSignalId[];
  signalStrengths: Partial<Record<PersonSignalId, number>>;
}

function strengthForSignal(
  id: PersonSignalId,
  reasons: string[],
  score: number,
): number {
  const hits = reasons.filter(r => inferSignalFromReason(r) === id).length;
  const base = score > 0 ? Math.round(score * 0.5) : 38;
  return Math.min(96, Math.max(32, base + hits * 14));
}

function inferSignalFromReason(line: string): PersonSignalId | null {
  const t = line.toLowerCase();
  if (/technology|track|expertise|domain|product|interest in/i.test(t)) return "technology";
  if (/industry|sector|vertical/i.test(t)) return "industry";
  if (/goal|certification|journey|pursuing/i.test(t)) return "goal";
  if (/1:1|network|connect|conversation|peer|alumni|community/i.test(t)) return "networking";
  if (/certif|exam|credential/i.test(t)) return "certification";
  return null;
}

export function buildPersonMatchReasons(
  person: PersonIntelInput,
  profileSignals: string[] = [],
): string[] {
  const lines: string[] = [];
  const seen = new Set<string>();

  for (const raw of person.compass_reasons ?? []) {
    const t = raw.trim().toLowerCase();
    let line: string | null = null;

    if (/champion|ibm champion/i.test(t)) {
      const domain = person.profile?.domains?.[0] ?? person.profile?.products?.[0];
      line = domain
        ? `Champion in ${domain}`
        : "Champion in your area of interest";
    } else if (/speaker|presenting|session speaker/i.test(t)) {
      line = "Speaker on a recommended session";
    } else if (/certif|exam|credential/i.test(t)) {
      line = "Preparing for same certification";
    } else if (/partner|business partner/i.test(t)) {
      line = "Partner ecosystem expertise";
    } else if (/industry|sector|vertical/i.test(t)) {
      line = "Similar industry focus";
    } else if (/former ibm|ex-ibm|past employer.*ibm/i.test(t)) {
      line = "Former IBM employee";
    } else if (/alumni|university|nc state/i.test(t)) {
      const uni = person.education?.[0];
      const name = typeof uni === "string" ? uni : uni?.institution;
      line = name ? `${name} alumni` : "Shared alumni network";
    } else if (/shared expertise|shared interest|technology|track|domain|product|watsonx|agentic|data govern/i.test(t)) {
      const domain = person.profile?.domains?.[0] ?? person.profile?.products?.[0];
      if (/agentic/i.test(t) || /agentic/i.test(domain ?? "")) {
        line = "Champion in Agentic AI";
      } else if (/data govern/i.test(t) || /data govern/i.test(domain ?? "")) {
        line = "Data governance expertise";
      } else if (domain && profileSignals.some(s => domain.toLowerCase().includes(s.toLowerCase()))) {
        line = `Works on ${domain}, matching your learning path`;
      } else if (domain) {
        line = `Deep ${domain} expertise`;
      } else {
        line = "Aligned technical focus";
      }
    } else {
      line = humanizeScoringReason(raw);
    }

    if (line && !seen.has(line)) {
      seen.add(line);
      lines.push(line);
    }
  }

  const domains = [
    ...(person.profile?.domains ?? []),
    ...(person.profile?.products ?? []),
  ];
  if (profileSignals.length > 0 && domains.length > 0) {
    const overlap = domains.filter(d =>
      profileSignals.some(s => {
        const dl = d.toLowerCase();
        const sl = s.toLowerCase();
        return dl.includes(sl) || sl.includes(dl);
      }),
    );
    for (const d of overlap.slice(0, 2)) {
      const line = `Works on ${d}, matching your learning path`;
      if (!seen.has(line)) {
        seen.add(line);
        lines.push(line);
      }
    }
  }

  if (domains.length > 0 && !lines.some(l => /technology/i.test(l))) {
    const line = `Expertise in ${domains.slice(0, 2).join(" and ")}`;
    if (!seen.has(line)) {
      seen.add(line);
      lines.push(line);
    }
  }

  const org = person.organization ?? person.company ?? "";
  if (org && profileSignals.some(s => org.toLowerCase().includes(s.toLowerCase()))) {
    const line = `Relevant to your industry (${org})`;
    if (!seen.has(line)) {
      seen.add(line);
      lines.push(line);
    }
  }

  if (person.attendance?.available_for_1x1 && !lines.some(l => /1:1|conversation/i.test(l))) {
    lines.push("Available for a 1:1 conversation");
  }

  if (lines.length === 0 && person.compass_reasons?.length) {
    return humanizeMatchReasons(person.compass_reasons);
  }

  if (lines.length === 0 && domains.length > 0) {
    lines.push(`Expertise in ${domains.slice(0, 2).join(" and ")}`);
  }

  return lines.slice(0, 8);
}

function computeDisplayScore(
  rawScore: number,
  reasons: string[],
  signals: PersonSignalId[],
): number {
  if (rawScore >= 55) return Math.min(99, rawScore);
  let score = rawScore;
  score += signals.length * 12;
  score += Math.min(reasons.length * 7, 28);
  if (reasons.length >= 3 && signals.length >= 2) score = Math.max(score, 58);
  if (reasons.length >= 2) score = Math.max(score, 48);
  return Math.min(95, Math.max(score, reasons.length > 0 ? 42 : 0));
}

export function buildPersonIntelligence(
  person: PersonIntelInput,
  profileSignals: string[] = [],
): PersonIntelligence {
  const reasons = buildPersonMatchReasons(person, profileSignals);
  const signals: PersonSignalId[] = [];

  for (const line of reasons) {
    const sig = inferSignalFromReason(line);
    if (sig && !signals.includes(sig)) signals.push(sig);
  }

  if (reasons.some(r => /technology|track|expertise|domain/i.test(r)) && !signals.includes("technology")) {
    signals.push("technology");
  }
  if (reasons.some(r => /industry/i.test(r)) && !signals.includes("industry")) {
    signals.push("industry");
  }
  if (reasons.some(r => /goal|certification/i.test(r)) && !signals.includes("goal")) {
    signals.push("goal");
  }

  const score = computeDisplayScore(person.compass_score ?? 0, reasons, signals);

  const signalStrengths: Partial<Record<PersonSignalId, number>> = {};
  for (const id of signals) {
    signalStrengths[id] = strengthForSignal(id, reasons, score);
  }

  return {
    score,
    reasons,
    signals: signals.slice(0, 5),
    signalStrengths,
  };
}
