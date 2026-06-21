import seedCatalog from "../seeds/txc2026-certifications.seed.json";

export type CertificationEnrollmentStatus = "planned" | "in_progress" | "completed";

export interface TxCertification {
  certification_id: string;
  title: string;
  product: string;
  level: string;
  exam_code: string;
  certification_url: string;
  description: string;
  skill_tags: string[];
  txc_tracks: string[];
  related_products: string[];
  recommended_session_keywords: string[];
  recommended_people_keywords: string[];
  recommended_community_keywords: string[];
  is_active: boolean;
}

export interface CertificationEnrollment {
  certification_id: string;
  status: CertificationEnrollmentStatus;
  added_at: string;
}

export const MAX_CERTIFICATION_ENROLLMENTS = 4;

export const TX_CERTIFICATIONS: TxCertification[] = seedCatalog as TxCertification[];

export function mapFirestoreCertificationDoc(data: Record<string, unknown>): TxCertification | null {
  const id = String(data.certification_id ?? data.id ?? "");
  if (!id) return null;

  return {
    certification_id: id,
    title: String(data.title ?? "Certification"),
    product: String(data.product ?? ""),
    level: String(data.level ?? ""),
    exam_code: String(data.exam_code ?? ""),
    certification_url: String(data.certification_url ?? "https://www.ibm.com/training/certification"),
    description: String(data.description ?? ""),
    skill_tags: Array.isArray(data.skill_tags) ? (data.skill_tags as string[]) : [],
    txc_tracks: Array.isArray(data.txc_tracks) ? (data.txc_tracks as string[]) : [],
    related_products: Array.isArray(data.related_products) ? (data.related_products as string[]) : [],
    recommended_session_keywords: Array.isArray(data.recommended_session_keywords)
      ? (data.recommended_session_keywords as string[])
      : [],
    recommended_people_keywords: Array.isArray(data.recommended_people_keywords)
      ? (data.recommended_people_keywords as string[])
      : [],
    recommended_community_keywords: Array.isArray(data.recommended_community_keywords)
      ? (data.recommended_community_keywords as string[])
      : [],
    is_active: data.is_active !== false,
  };
}

export function mapFirestoreEnrollmentDoc(data: Record<string, unknown>): CertificationEnrollment | null {
  const id = String(data.certification_id ?? "");
  if (!id) return null;

  const status = data.status as CertificationEnrollmentStatus;
  const validStatus = status === "planned" || status === "in_progress" || status === "completed"
    ? status
    : "planned";

  let addedAt = new Date().toISOString();
  const raw = data.added_at;
  if (typeof raw === "string") addedAt = raw;
  else if (raw && typeof raw === "object" && "toDate" in raw && typeof (raw as { toDate: () => Date }).toDate === "function") {
    addedAt = (raw as { toDate: () => Date }).toDate().toISOString();
  }

  return {
    certification_id: id,
    status: validStatus,
    added_at: addedAt,
  };
}
