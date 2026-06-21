import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { tryGetDb } from "@/lib/firebase";
import { EXPERIENCE_EVENT_BASE } from "@/lib/experienceScoring";
import {
  mapFirestoreCertificationDoc,
  mapFirestoreEnrollmentDoc,
  TX_CERTIFICATIONS,
  type CertificationEnrollment,
  type TxCertification,
} from "@/data/certifications";

export type CertificationCatalogSource = "firestore" | "seed";

export interface CertificationCatalogResult {
  certifications: TxCertification[];
  source: CertificationCatalogSource;
}

/** Load active certifications from Firestore; fall back to bundled seed catalog. */
export async function loadCertificationCatalog(): Promise<CertificationCatalogResult> {
  const db = tryGetDb();
  if (!db) {
    return { certifications: TX_CERTIFICATIONS.filter(c => c.is_active), source: "seed" };
  }

  try {
    const snap = await getDocs(collection(db, `${EXPERIENCE_EVENT_BASE}/certifications`));
    if (snap.empty) {
      return { certifications: TX_CERTIFICATIONS.filter(c => c.is_active), source: "seed" };
    }

    const mapped = snap.docs
      .map(d => mapFirestoreCertificationDoc({ id: d.id, ...d.data() }))
      .filter((c): c is TxCertification => c !== null && c.is_active)
      .sort((a, b) => a.title.localeCompare(b.title));

    if (mapped.length === 0) {
      return { certifications: TX_CERTIFICATIONS.filter(c => c.is_active), source: "seed" };
    }

    return { certifications: mapped, source: "firestore" };
  } catch {
    return { certifications: TX_CERTIFICATIONS.filter(c => c.is_active), source: "seed" };
  }
}

/** Load participant certification enrollments from subcollection. */
export async function loadCertificationEnrollments(
  participantId: string,
): Promise<CertificationEnrollment[]> {
  if (!participantId) return [];
  const db = tryGetDb();
  if (!db) return [];

  try {
    const snap = await getDocs(
      collection(db, `${EXPERIENCE_EVENT_BASE}/participants/${participantId}/certification_enrollments`),
    );
    return snap.docs
      .map(d => mapFirestoreEnrollmentDoc({ certification_id: d.id, ...d.data() }))
      .filter((e): e is CertificationEnrollment => e !== null)
      .sort((a, b) => a.added_at.localeCompare(b.added_at));
  } catch {
    return [];
  }
}

export async function enrollInCertification(
  participantId: string,
  certificationId: string,
  status: CertificationEnrollment["status"] = "planned",
): Promise<void> {
  const db = tryGetDb();
  if (!db || !participantId || !certificationId) return;

  await setDoc(
    doc(db, `${EXPERIENCE_EVENT_BASE}/participants/${participantId}/certification_enrollments/${certificationId}`),
    {
      certification_id: certificationId,
      status,
      added_at: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function removeCertificationEnrollment(
  participantId: string,
  certificationId: string,
): Promise<void> {
  const db = tryGetDb();
  if (!db || !participantId || !certificationId) return;

  await deleteDoc(
    doc(db, `${EXPERIENCE_EVENT_BASE}/participants/${participantId}/certification_enrollments/${certificationId}`),
  );
}
