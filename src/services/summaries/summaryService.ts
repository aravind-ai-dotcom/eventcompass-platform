// =============================================================================
// SKO content summaries — Firestore governance service
// Path: organizations/ibm/events/sko2026/contentSummaries/{summaryId}
// =============================================================================

import { collection, doc, getDocs, setDoc, type DocumentData } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { contentSummariesCollection, SKO_EVENT_ID, type CompassEventId } from "@/lib/compassEventPaths";
import { SKO_GOVERNANCE_SUMMARIES_SEED } from "@/data/seeds/skoGovernanceSeed";
import type { SkoGovernanceSummaryRecord, SkoSummaryGeo } from "@/types/compassGovernance";

const cache = new Map<string, SkoGovernanceSummaryRecord[]>();

function mapDoc(id: string, data: DocumentData): SkoGovernanceSummaryRecord {
  return { id, ...(data as Omit<SkoGovernanceSummaryRecord, "id">) };
}

export function invalidateSummaryCache(eventId: CompassEventId | string = SKO_EVENT_ID): void {
  cache.delete(eventId);
}

export async function loadGovernanceSummaries(
  eventId: CompassEventId | string = SKO_EVENT_ID,
): Promise<SkoGovernanceSummaryRecord[]> {
  const snap = await getDocs(collection(db, contentSummariesCollection(eventId)));

  if (snap.empty) {
    cache.set(eventId, SKO_GOVERNANCE_SUMMARIES_SEED);
    return SKO_GOVERNANCE_SUMMARIES_SEED;
  }

  const records = snap.docs.map(d => mapDoc(d.id, d.data()));
  cache.set(eventId, records);
  return records;
}

export function getCachedGovernanceSummaries(
  eventId: CompassEventId | string = SKO_EVENT_ID,
): SkoGovernanceSummaryRecord[] {
  return cache.get(eventId) ?? SKO_GOVERNANCE_SUMMARIES_SEED;
}

export async function saveGovernanceSummary(
  eventId: CompassEventId | string,
  record: SkoGovernanceSummaryRecord,
): Promise<void> {
  await setDoc(
    doc(db, contentSummariesCollection(eventId), record.id),
    { ...record, updatedAt: new Date().toISOString() },
    { merge: true },
  );
  invalidateSummaryCache(eventId);
}

export async function seedGovernanceSummariesIfEmpty(
  eventId: CompassEventId | string = SKO_EVENT_ID,
): Promise<number> {
  const col = collection(db, contentSummariesCollection(eventId));
  const snap = await getDocs(col);
  if (!snap.empty) return 0;

  for (const record of SKO_GOVERNANCE_SUMMARIES_SEED) {
    await setDoc(doc(col, record.id), record);
  }
  invalidateSummaryCache(eventId);
  return SKO_GOVERNANCE_SUMMARIES_SEED.length;
}

export function filterSummariesByGeo(
  records: SkoGovernanceSummaryRecord[],
  geo?: SkoSummaryGeo | string,
): SkoGovernanceSummaryRecord[] {
  if (!geo) return records;
  return records.filter(r => r.geo === geo || r.geo === "global");
}
