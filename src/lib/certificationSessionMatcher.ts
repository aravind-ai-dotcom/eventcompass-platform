import type { CertificationJourneyRecord } from "@/types/certificationSession";
import { isCertificationActivityType } from "@/lib/certificationProfile";

type SessionLike = {
  id: string;
  title: string;
  session_type?: string;
  activity_type?: string;
  certification_id?: string;
  certification_code?: string;
  supports_certification?: boolean;
  recommended_reason?: string;
  topics?: string[];
  tracks?: {
    primary_track?: string;
    topics?: string[];
    products?: string[];
  };
  certification_path?: {
    certification_id?: string;
    certification_code?: string;
  };
  compass_intelligence?: {
    matching_keywords?: string[];
    intent_tags?: string[];
  };
};

function sessionType(raw: SessionLike): string {
  return String(raw.session_type ?? raw.activity_type ?? "").toLowerCase();
}

function normTokens(values: string[]): string[] {
  return values.map(v => v.trim().toLowerCase()).filter(Boolean);
}

export function sessionCertificationId(session: SessionLike): string | null {
  const direct = session.certification_id ?? session.certification_path?.certification_id;
  return direct ? String(direct) : null;
}

function topicOverlap(session: SessionLike, cert: CertificationJourneyRecord): boolean {
  const sessionTopics = normTokens([
    ...(session.tracks?.topics ?? []),
    ...(session.topics ?? []),
    session.tracks?.primary_track ?? "",
  ]);
  const certTopics = normTokens([...cert.topics, cert.track, ...cert.products]);
  return certTopics.some(ct =>
    sessionTopics.some(st => st.includes(ct) || ct.includes(st)),
  );
}

function keywordOverlap(session: SessionLike, cert: CertificationJourneyRecord): boolean {
  const keywords = normTokens([
    ...(session.compass_intelligence?.matching_keywords ?? []),
    ...(session.compass_intelligence?.intent_tags ?? []),
    session.title,
    session.certification_code ?? "",
  ]);
  const certKeys = normTokens([
    cert.certification_code,
    cert.certification_id,
    ...cert.topics,
    ...cert.products,
    cert.title,
  ]);
  return certKeys.some(ck => keywords.some(kw => kw.includes(ck) || ck.includes(kw)));
}

export function sessionMatchesCertification(
  session: SessionLike,
  cert: CertificationJourneyRecord,
): boolean {
  const sid = sessionCertificationId(session);
  if (sid === cert.certification_id) return true;

  const related = new Set([
    ...(cert.related_session_ids ?? []),
    ...(cert.related_lab_ids ?? []),
    ...(cert.related_huddle_ids ?? []),
    ...(cert.related_community_ids ?? []),
    cert.session_id,
  ]);
  if (related.has(session.id)) return true;

  if (isCertificationActivityType(session) && sid === cert.certification_id) return true;

  if (session.supports_certification && (topicOverlap(session, cert) || keywordOverlap(session, cert))) {
    return true;
  }

  if (topicOverlap(session, cert) && keywordOverlap(session, cert)) return true;

  return false;
}

export function isPracticeSession(raw: SessionLike): boolean {
  const type = sessionType(raw);
  return /lab|workshop|hands-on|instructor-led/.test(type);
}

export function isCommunitySession(raw: SessionLike): boolean {
  const type = sessionType(raw);
  const title = String(raw.title ?? "").toLowerCase();
  return /huddle|meetup|study group|community|roundtable|user group/.test(`${type} ${title}`);
}

export interface MatchedCertSessions {
  all: SessionLike[];
  learn: SessionLike[];
  practice: SessionLike[];
  community: SessionLike[];
  achieve: SessionLike | null;
}

export function matchSessionsForCertification(
  cert: CertificationJourneyRecord,
  allSessions: SessionLike[],
): MatchedCertSessions {
  const matched = allSessions.filter(s => sessionMatchesCertification(s, cert));

  const learn = matched.filter(
    s => !isPracticeSession(s) && !isCommunitySession(s) && !isCertificationActivityType(s),
  );
  const practice = matched.filter(s => isPracticeSession(s));
  const community = matched.filter(s => isCommunitySession(s));
  const achieve =
    matched.find(s => isCertificationActivityType(s) || s.id === cert.session_id) ??
    allSessions.find(
      s =>
        isCertificationActivityType(s) &&
        sessionCertificationId(s) === cert.certification_id,
    ) ??
    null;

  return { all: matched, learn, practice, community, achieve };
}
