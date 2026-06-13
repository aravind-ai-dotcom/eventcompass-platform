type ProfileDoc = Record<string, unknown>;

function sig(participant: ProfileDoc): ProfileDoc {
  return (participant.event_signal_profile as ProfileDoc) ?? {};
}

function intel(participant: ProfileDoc): ProfileDoc {
  return (participant.compass_intelligence as ProfileDoc) ?? {};
}

/** True when attendee selected certification intent during enrollment. */
export function hasCertificationIntent(participant: ProfileDoc): boolean {
  const goals = (sig(participant).goals as string[]) ?? [];
  if (goals.some(g => /earn a certification/i.test(g))) return true;

  const intent = (sig(participant).intent as ProfileDoc) ?? {};
  const aspiration = String(intent.aspiration ?? "");
  if (/certif|cert exam|certified|qiskit|watsonx|exam prep/i.test(aspiration)) return true;

  const keywords = (intel(participant).matching_keywords as string[]) ?? [];
  return keywords.some(k => /certif|certified|qiskit|exam prep/i.test(k));
}

/** Human-readable certification target for journey UI and recommendation copy. */
export function getCertificationLabel(participant: ProfileDoc): string | null {
  if (!hasCertificationIntent(participant)) return null;

  const intent = (sig(participant).intent as ProfileDoc) ?? {};
  const aspiration = String(intent.aspiration ?? "").trim();
  const ibmMatch = aspiration.match(/IBM Certified[^.]+/i);
  if (ibmMatch) return ibmMatch[0].trim();
  if (/qiskit/i.test(aspiration)) return "IBM Certified Developer – Qiskit";
  if (/watsonx/i.test(aspiration)) return "IBM watsonx Certification";

  const keywords = (intel(participant).matching_keywords as string[]) ?? [];
  const kwCert = keywords.find(k => /certified|certification/i.test(k));
  if (kwCert) return kwCert;

  return "IBM Certified Developer – Qiskit";
}

export const CERTIFICATION_MILESTONES = ["Choose", "Prepare", "Practice", "Mentor", "Certify"] as const;

/** Boost session score when attendee has an active certification goal. */
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

  if (type.includes("certification") || tags.includes("certification")) {
    boosted += 18;
    if (!next.some(r => /certification goal/i.test(r))) {
      next.unshift(`Recommended for your ${certLabel} goal`);
    }
  } else if (type.includes("lab") || type.includes("workshop")) {
    boosted += 12;
    if (!next.some(r => /exam readiness/i.test(r))) {
      next.push("Supports exam readiness");
    }
  } else if (/certif|exam prep|qiskit|watsonx/.test(tags)) {
    boosted += 10;
    if (!next.some(r => /certification goal/i.test(r))) {
      next.unshift(`Recommended for your ${certLabel} goal`);
    }
  }

  return { score: boosted, reasons: next };
}
