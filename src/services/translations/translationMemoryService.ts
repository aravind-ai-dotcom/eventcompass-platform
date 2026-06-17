// =============================================================================
// SKO translation memory — Firestore source of truth
// Path: organizations/ibm/events/sko2026/translationMemory/{entryId}
// =============================================================================

import { collection, doc, getDocs, setDoc, type DocumentData } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { SKO_EVENT_ID, translationMemoryCollection, type CompassEventId } from "@/lib/compassEventPaths";
import { SKO_TRANSLATION_MEMORY_SEED } from "@/data/seeds/skoGovernanceSeed";
import type { TranslationMemoryRecord } from "@/types/compassGovernance";

const cache = new Map<string, TranslationMemoryRecord[]>();

function mapDoc(id: string, data: DocumentData): TranslationMemoryRecord {
  return { id, ...(data as Omit<TranslationMemoryRecord, "id">) };
}

export function invalidateTranslationMemoryCache(eventId: CompassEventId | string = SKO_EVENT_ID): void {
  cache.delete(eventId);
}

export async function loadTranslationMemoryRecords(
  eventId: CompassEventId | string = SKO_EVENT_ID,
): Promise<TranslationMemoryRecord[]> {
  const snap = await getDocs(collection(db, translationMemoryCollection(eventId)));

  if (snap.empty) {
    cache.set(eventId, SKO_TRANSLATION_MEMORY_SEED);
    return SKO_TRANSLATION_MEMORY_SEED;
  }

  const records = snap.docs.map(d => mapDoc(d.id, d.data()));
  cache.set(eventId, records);
  return records;
}

export function getCachedTranslationMemoryRecords(
  eventId: CompassEventId | string = SKO_EVENT_ID,
): TranslationMemoryRecord[] {
  return cache.get(eventId) ?? SKO_TRANSLATION_MEMORY_SEED;
}

export function getApprovedTranslationMemory(
  eventId: CompassEventId | string = SKO_EVENT_ID,
): TranslationMemoryRecord[] {
  return getCachedTranslationMemoryRecords(eventId).filter(r => r.approved);
}

export async function saveTranslationMemoryRecord(
  eventId: CompassEventId | string,
  record: TranslationMemoryRecord,
): Promise<void> {
  await setDoc(
    doc(db, translationMemoryCollection(eventId), record.id),
    { ...record, updatedAt: new Date().toISOString() },
    { merge: true },
  );
  invalidateTranslationMemoryCache(eventId);
}

export async function seedTranslationMemoryIfEmpty(
  eventId: CompassEventId | string = SKO_EVENT_ID,
): Promise<number> {
  const col = collection(db, translationMemoryCollection(eventId));
  const snap = await getDocs(col);
  if (!snap.empty) return 0;

  for (const record of SKO_TRANSLATION_MEMORY_SEED) {
    await setDoc(doc(col, record.id), record);
  }
  invalidateTranslationMemoryCache(eventId);
  return SKO_TRANSLATION_MEMORY_SEED.length;
}

/** Apply approved translation memory to English text (longest phrase first). */
export function translateWithMemory(
  text: string,
  eventId: CompassEventId | string = SKO_EVENT_ID,
): string {
  if (!text.trim()) return text;

  const entries = getApprovedTranslationMemory(eventId)
    .filter(e => e.sourceLanguage === "en-US" && e.targetLanguage === "zh-CN")
    .sort((a, b) => b.sourceText.length - a.sourceText.length);

  let translated = text;
  for (const entry of entries) {
    if (!entry.sourceText.trim()) continue;
    translated = translated.split(entry.sourceText).join(entry.translatedText);
  }
  return translated;
}
