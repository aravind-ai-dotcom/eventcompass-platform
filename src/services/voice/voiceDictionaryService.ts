// =============================================================================
// Voice dictionary service — Firestore source of truth (TTS pronunciation)
// =============================================================================

import { collection, doc, getDocs, setDoc, type DocumentData } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { voiceDictionaryCollection, TXC_EVENT_ID, type CompassEventId } from "@/lib/compassEventPaths";
import { TXC_VOICE_DICTIONARY_SEED } from "@/data/seeds/txcGovernanceSeed";
import type { VoiceDictionaryRecord } from "@/types/compassGovernance";

const cache = new Map<string, VoiceDictionaryRecord[]>();

function mapDoc(id: string, data: DocumentData): VoiceDictionaryRecord {
  return { id, ...(data as Omit<VoiceDictionaryRecord, "id">) };
}

export function invalidateVoiceDictionaryCache(eventId: CompassEventId | string = TXC_EVENT_ID): void {
  cache.delete(eventId);
}

export async function loadVoiceDictionaryRecords(
  eventId: CompassEventId | string = TXC_EVENT_ID,
): Promise<VoiceDictionaryRecord[]> {
  const snap = await getDocs(collection(db, voiceDictionaryCollection(eventId)));

  if (snap.empty) {
    cache.set(eventId, TXC_VOICE_DICTIONARY_SEED);
    return TXC_VOICE_DICTIONARY_SEED;
  }

  const records = snap.docs
    .map(d => mapDoc(d.id, d.data()))
    .sort((a, b) => b.displayText.length - a.displayText.length);

  cache.set(eventId, records);
  return records;
}

export function getCachedVoiceDictionaryRecords(
  eventId: CompassEventId | string = TXC_EVENT_ID,
): VoiceDictionaryRecord[] {
  return cache.get(eventId) ?? TXC_VOICE_DICTIONARY_SEED;
}

export function getActiveVoiceDictionaryRecords(
  eventId: CompassEventId | string = TXC_EVENT_ID,
): VoiceDictionaryRecord[] {
  return getCachedVoiceDictionaryRecords(eventId).filter(r => r.active);
}

export async function saveVoiceDictionaryRecord(
  eventId: CompassEventId | string,
  record: VoiceDictionaryRecord,
): Promise<void> {
  await setDoc(
    doc(db, voiceDictionaryCollection(eventId), record.id),
    { ...record, updatedAt: new Date().toISOString() },
    { merge: true },
  );
  invalidateVoiceDictionaryCache(eventId);
}

export async function seedVoiceDictionaryIfEmpty(
  eventId: CompassEventId | string = TXC_EVENT_ID,
): Promise<number> {
  const col = collection(db, voiceDictionaryCollection(eventId));
  const snap = await getDocs(col);
  if (!snap.empty) return 0;

  for (const record of TXC_VOICE_DICTIONARY_SEED) {
    await setDoc(doc(col, record.id), record);
  }
  invalidateVoiceDictionaryCache(eventId);
  return TXC_VOICE_DICTIONARY_SEED.length;
}
