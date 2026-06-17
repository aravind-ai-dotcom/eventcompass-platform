// =============================================================================
// Knowledge service — Firestore source of truth
// =============================================================================

import {
  collection,
  doc,
  getDocs,
  setDoc,
  type DocumentData,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { knowledgeBaseCollection, TXC_EVENT_ID, type CompassEventId } from "@/lib/compassEventPaths";
import { TXC_KNOWLEDGE_SEED } from "@/data/seeds/txcGovernanceSeed";
import type { TechXchangeKnowledgeRecord } from "@/types/compassGovernance";

const cache = new Map<string, TechXchangeKnowledgeRecord[]>();

function mapDoc(id: string, data: DocumentData): TechXchangeKnowledgeRecord {
  return { id, ...(data as Omit<TechXchangeKnowledgeRecord, "id">) };
}

export function invalidateKnowledgeCache(eventId: CompassEventId | string = TXC_EVENT_ID): void {
  cache.delete(eventId);
}

export async function loadKnowledgeRecords(
  eventId: CompassEventId | string = TXC_EVENT_ID,
): Promise<TechXchangeKnowledgeRecord[]> {
  const col = collection(db, knowledgeBaseCollection(eventId));
  const snap = await getDocs(col);

  if (snap.empty) {
    const fallback = TXC_KNOWLEDGE_SEED;
    cache.set(eventId, fallback);
    return fallback;
  }

  const records = snap.docs
    .map(d => mapDoc(d.id, d.data()))
    .sort((a, b) => b.priority - a.priority);

  cache.set(eventId, records);
  return records;
}

export function getCachedKnowledgeRecords(
  eventId: CompassEventId | string = TXC_EVENT_ID,
): TechXchangeKnowledgeRecord[] {
  return cache.get(eventId) ?? TXC_KNOWLEDGE_SEED;
}

export async function saveKnowledgeRecord(
  eventId: CompassEventId | string,
  record: TechXchangeKnowledgeRecord,
): Promise<void> {
  const ref = doc(db, knowledgeBaseCollection(eventId), record.id);
  await setDoc(ref, { ...record, updatedAt: new Date().toISOString() }, { merge: true });
  invalidateKnowledgeCache(eventId);
}

export async function seedKnowledgeIfEmpty(eventId: CompassEventId | string = TXC_EVENT_ID): Promise<number> {
  const col = collection(db, knowledgeBaseCollection(eventId));
  const snap = await getDocs(col);
  if (!snap.empty) return 0;

  for (const record of TXC_KNOWLEDGE_SEED) {
    await setDoc(doc(col, record.id), record);
  }
  invalidateKnowledgeCache(eventId);
  return TXC_KNOWLEDGE_SEED.length;
}

export function getActiveKnowledgeRecords(
  eventId: CompassEventId | string = TXC_EVENT_ID,
): TechXchangeKnowledgeRecord[] {
  return getCachedKnowledgeRecords(eventId).filter(
    r => r.active && r.status === "active",
  );
}
