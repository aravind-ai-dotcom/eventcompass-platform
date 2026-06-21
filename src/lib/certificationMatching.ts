import type { IbmCommunity } from "@/data/ibmCommunities";
import type { CertificationEnrollment, TxCertification } from "@/data/certifications";
import type { ExperienceScoredChampion, ExperienceScoredSession } from "@/lib/experienceScoring";
import type { RecommendedPerson } from "@/components/people/RecommendedConnectionCard";
import type { ScoredIbmCommunity } from "@/lib/ibmCommunityMatching";

export const CERTIFICATION_BOOSTER_REASON_PREFIX = "Supports your ";
export const CERTIFICATION_BOOSTER_BADGE = "certification-booster" as const;
export const CERTIFICATION_SESSION_BOOST = 10;

function normalize(text: string): string {
  return text.toLowerCase().trim();
}

function blob(values: (string | undefined | null)[]): string {
  return values.filter(Boolean).join(" ").toLowerCase();
}

function keywordMatch(blobText: string, keywords: string[]): boolean {
  const hay = normalize(blobText);
  return keywords.some(kw => {
    const needle = normalize(kw);
    return needle.length > 2 && hay.includes(needle);
  });
}

function sessionBlob(session: ExperienceScoredSession): string {
  const raw = session as unknown as Record<string, unknown>;
  const ci = (raw.compass_intelligence as Record<string, unknown> | undefined) ?? {};
  return blob([
    session.title,
    session.session_type,
    session.activity_type,
    session.tracks?.primary_track,
    ...(session.tracks?.secondary_tracks ?? []),
    ...(session.tracks?.topics ?? []),
    ...(session.tracks?.products ?? []),
    ...(ci.intent_tags as string[] | undefined) ?? [],
    ...(ci.matching_keywords as string[] | undefined) ?? [],
    session.certification_id,
    session.certification_code,
  ]);
}

function championBlob(champion: ExperienceScoredChampion | RecommendedPerson): string {
  const raw = champion as unknown as Record<string, unknown>;
  const profile = (raw.profile as Record<string, unknown> | undefined) ?? {};
  const ci = (raw.compass_intelligence as Record<string, unknown> | undefined) ?? {};
  return blob([
    champion.display_name,
    champion.title,
    champion.organization,
    (champion as ExperienceScoredChampion).company,
    ...((profile.domains as string[] | undefined) ?? []),
    ...((profile.products as string[] | undefined) ?? []),
    ...((ci.matching_keywords as string[] | undefined) ?? []),
    ...((raw.domains as string[] | undefined) ?? []),
    ...(champion.compass_reasons ?? []),
  ]);
}

function communityBlob(community: IbmCommunity | ScoredIbmCommunity): string {
  return blob([
    community.name,
    community.description,
    community.category,
    community.primary_product,
    ...community.topics,
    ...community.products,
    ...community.tracks,
    ...community.tags,
    ...community.domains,
  ]);
}

export function sessionMatchesCertification(
  session: ExperienceScoredSession,
  cert: TxCertification,
): boolean {
  if (session.certification_id === cert.certification_id) return true;
  if (session.certification_code && session.certification_code === cert.exam_code) return true;

  const text = sessionBlob(session);
  const keywords = [
    ...cert.recommended_session_keywords,
    ...cert.skill_tags,
    ...cert.related_products,
    cert.product,
    cert.title,
  ];
  return keywordMatch(text, keywords);
}

export function personMatchesCertification(
  person: ExperienceScoredChampion | RecommendedPerson,
  cert: TxCertification,
): boolean {
  const text = championBlob(person);
  const keywords = [
    ...cert.recommended_people_keywords,
    ...cert.skill_tags,
    ...cert.related_products,
    cert.product,
  ];
  return keywordMatch(text, keywords);
}

export function communityMatchesCertification(
  community: IbmCommunity | ScoredIbmCommunity,
  cert: TxCertification,
): boolean {
  const text = communityBlob(community);
  const keywords = [
    ...cert.recommended_community_keywords,
    ...cert.skill_tags,
    ...cert.txc_tracks,
    ...cert.related_products,
    cert.product,
  ];
  return keywordMatch(text, keywords);
}

export function findMatchingCertificationsForSession(
  session: ExperienceScoredSession,
  enrolled: TxCertification[],
): TxCertification[] {
  return enrolled.filter(cert => sessionMatchesCertification(session, cert));
}

/** Readiness: 20 base + 10/session (max 40) + 10/person (max 20) + 10/community (max 20), cap 100. */
export function calculateCertificationReadiness(
  matchedSessions: number,
  matchedPeople: number,
  matchedCommunities: number,
): number {
  const sessionPoints = Math.min(matchedSessions, 4) * 10;
  const peoplePoints = Math.min(matchedPeople, 2) * 10;
  const communityPoints = Math.min(matchedCommunities, 2) * 10;
  return Math.min(100, 20 + sessionPoints + peoplePoints + communityPoints);
}

export interface EnrolledCertificationView {
  certification: TxCertification;
  enrollment: CertificationEnrollment;
  readiness: number;
  reasonLine: string;
  sessionCount: number;
  peopleCount: number;
  communityCount: number;
  supportingSessions: ExperienceScoredSession[];
  supportingPeople: RecommendedPerson[];
  supportingCommunities: ScoredIbmCommunity[];
}

export function buildEnrolledCertificationViews(
  enrollments: CertificationEnrollment[],
  catalog: TxCertification[],
  sessions: ExperienceScoredSession[],
  people: RecommendedPerson[],
  communities: ScoredIbmCommunity[],
): EnrolledCertificationView[] {
  const byId = new Map(catalog.map(c => [c.certification_id, c]));

  return enrollments
    .map(enrollment => {
      const certification = byId.get(enrollment.certification_id);
      if (!certification) return null;

      const supportingSessions = sessions
        .filter(s => sessionMatchesCertification(s, certification))
        .sort((a, b) => b.compass_score - a.compass_score)
        .slice(0, 3);

      const supportingPeople = people
        .filter(p => personMatchesCertification(p, certification))
        .slice(0, 3);

      const supportingCommunities = communities
        .filter(c => communityMatchesCertification(c, certification))
        .slice(0, 2);

      const sessionCount = sessions.filter(s => sessionMatchesCertification(s, certification)).length;
      const peopleCount = people.filter(p => personMatchesCertification(p, certification)).length;
      const communityCount = communities.filter(c => communityMatchesCertification(c, certification)).length;

      const readiness = calculateCertificationReadiness(sessionCount, peopleCount, communityCount);

      const reasonLine = supportingSessions[0]
        ? `Sessions on ${certification.product} strengthen exam readiness`
        : `Explore ${certification.product} sessions and peers at TechXchange`;

      return {
        certification,
        enrollment,
        readiness,
        reasonLine,
        sessionCount,
        peopleCount,
        communityCount,
        supportingSessions,
        supportingPeople,
        supportingCommunities,
      };
    })
    .filter((v): v is EnrolledCertificationView => v !== null);
}

export function certificationSupportReason(certTitle: string): string {
  return `${CERTIFICATION_BOOSTER_REASON_PREFIX}${certTitle} goal`;
}

export function personCertificationReason(certTitle: string): string {
  return `Can help with your ${certTitle} path`;
}

export function communityCertificationReason(certTitle: string): string {
  return `Supports your ${certTitle} path`;
}

/** Apply moderate score boost and reason for enrolled certification matches. */
export function applyEnrollmentSessionBoost(
  session: ExperienceScoredSession,
  enrolled: TxCertification[],
): ExperienceScoredSession {
  const matches = findMatchingCertificationsForSession(session, enrolled);
  if (matches.length === 0) return session;

  const primary = matches[0];
  const reason = certificationSupportReason(primary.title);
  const reasons = session.compass_reasons.includes(reason)
    ? session.compass_reasons
    : [reason, ...session.compass_reasons];

  return {
    ...session,
    compass_score: session.compass_score + CERTIFICATION_SESSION_BOOST,
    compass_reasons: reasons,
  };
}

export function applyEnrollmentChampionBoost(
  champion: ExperienceScoredChampion,
  enrolled: TxCertification[],
): ExperienceScoredChampion {
  const match = enrolled.find(cert => personMatchesCertification(champion, cert));
  if (!match) return champion;

  const reason = personCertificationReason(match.title);
  if (champion.compass_reasons.includes(reason)) return champion;

  return {
    ...champion,
    compass_score: champion.compass_score + 8,
    compass_reasons: [reason, ...champion.compass_reasons],
  };
}

export function applyEnrollmentCommunityReasons(
  communities: ScoredIbmCommunity[],
  enrolled: TxCertification[],
): ScoredIbmCommunity[] {
  if (enrolled.length === 0) return communities;

  return communities.map(community => {
    const match = enrolled.find(cert => communityMatchesCertification(community, cert));
    if (!match) return community;

    const reason = communityCertificationReason(match.title);
    if (community.matchReasons.includes(reason)) return community;

    return {
      ...community,
      matchScore: community.matchScore + 5,
      matchReasons: [reason, ...community.matchReasons],
    };
  });
}

export function boostSessionsForEnrollments(
  sessions: ExperienceScoredSession[],
  enrolled: TxCertification[],
): ExperienceScoredSession[] {
  if (enrolled.length === 0) return sessions;
  return sessions.map(s => applyEnrollmentSessionBoost(s, enrolled));
}

export function boostChampionsForEnrollments(
  champions: ExperienceScoredChampion[],
  enrolled: TxCertification[],
): ExperienceScoredChampion[] {
  if (enrolled.length === 0) return champions;
  return champions.map(c => applyEnrollmentChampionBoost(c, enrolled));
}
