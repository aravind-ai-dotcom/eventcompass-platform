// =============================================================================
// STT normalization service — Firestore source of truth
// =============================================================================

import { collection, doc, getDocs, setDoc, type DocumentData } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { sttNormalizationCollection, TXC_EVENT_ID, type CompassEventId } from "@/lib/compassEventPaths";
import { TXC_STT_NORMALIZATION_SEED } from "@/data/seeds/txcGovernanceSeed";
import type { SttNormalizationRecord } from "@/types/compassGovernance";
import { getActiveVoiceDictionaryRecords } from "@/services/voice/voiceDictionaryService";

const cache = new Map<string, SttNormalizationRecord[]>();

function mapDoc(id: string, data: DocumentData): SttNormalizationRecord {
  return { id, ...(data as Omit<SttNormalizationRecord, "id">) };
}

export function invalidateSttCache(eventId: CompassEventId | string = TXC_EVENT_ID): void {
  cache.delete(eventId);
}

export async function loadSttNormalizationRecords(
  eventId: CompassEventId | string = TXC_EVENT_ID,
): Promise<SttNormalizationRecord[]> {
  const snap = await getDocs(collection(db, sttNormalizationCollection(eventId)));

  if (snap.empty) {
    cache.set(eventId, TXC_STT_NORMALIZATION_SEED);
    return TXC_STT_NORMALIZATION_SEED;
  }

  const records = snap.docs.map(d => mapDoc(d.id, d.data()));
  cache.set(eventId, records);
  return records;
}

export function getCachedSttRecords(
  eventId: CompassEventId | string = TXC_EVENT_ID,
): SttNormalizationRecord[] {
  return cache.get(eventId) ?? TXC_STT_NORMALIZATION_SEED;
}

export function getActiveSttRecords(
  eventId: CompassEventId | string = TXC_EVENT_ID,
): SttNormalizationRecord[] {
  return getCachedSttRecords(eventId).filter(r => r.active);
}

export async function saveSttNormalizationRecord(
  eventId: CompassEventId | string,
  record: SttNormalizationRecord,
): Promise<void> {
  await setDoc(
    doc(db, sttNormalizationCollection(eventId), record.id),
    { ...record, updatedAt: new Date().toISOString() },
    { merge: true },
  );
  invalidateSttCache(eventId);
}

export async function seedSttIfEmpty(eventId: CompassEventId | string = TXC_EVENT_ID): Promise<number> {
  const col = collection(db, sttNormalizationCollection(eventId));
  const snap = await getDocs(col);
  if (!snap.empty) return 0;

  for (const record of TXC_STT_NORMALIZATION_SEED) {
    await setDoc(doc(col, record.id), record);
  }
  invalidateSttCache(eventId);
  return TXC_STT_NORMALIZATION_SEED.length;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Normalize STT transcript using Firestore-backed aliases (longest phrase first). */
export function normalizeTranscriptFromCache(
  text: string,
  eventId: CompassEventId | string = TXC_EVENT_ID,
): string {
  if (!text.trim()) return text;

  const replacements: Array<{ alias: string; canonical: string }> = [];
  const seen = new Set<string>();

  for (const entry of getActiveSttRecords(eventId)) {
    for (const alias of entry.heardAs) {
      const key = alias.toLowerCase();
      if (!alias.trim() || seen.has(key)) continue;
      seen.add(key);
      replacements.push({ alias, canonical: entry.canonicalText });
    }
  }

  replacements.sort((a, b) => b.alias.length - a.alias.length);

  let normalized = text;
  for (const { alias, canonical } of replacements) {
    normalized = normalized.replace(new RegExp(escapeRegExp(alias), "gi"), canonical);
  }
  return normalized;
}

/** Apply TTS pronunciation from Firestore voice dictionary. */
export function applyPronunciationFromCache(
  text: string,
  eventId: CompassEventId | string = TXC_EVENT_ID,
): string {
  if (!text.trim()) return text;

  let spoken = text;
  const entries = getActiveVoiceDictionaryRecords(eventId)
    .filter(e => e.spokenText !== e.displayText)
    .sort((a, b) => b.displayText.length - a.displayText.length);

  for (const entry of entries) {
    spoken = spoken.replace(
      new RegExp(escapeRegExp(entry.displayText), "gi"),
      entry.spokenText,
    );
  }
  return spoken;
}
