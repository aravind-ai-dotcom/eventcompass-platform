// =============================================================================
// Voice dictionary service — Firestore source of truth (TTS pronunciation)
// =============================================================================

import { collection, doc, getDocs, setDoc, type DocumentData } from "firebase/firestore";
import { tryGetDb } from "@/lib/firebase";
import { voiceDictionaryCollection, TXC_EVENT_ID, type CompassEventId } from "@/lib/compassEventPaths";
import { TXC_VOICE_DICTIONARY_SEED } from "@/data/seeds/txcGovernanceSeed";
import type { VoiceDictionaryRecord } from "@/types/compassGovernance";

const cache = new Map<string, VoiceDictionaryRecord[]>();

function requireDb() {
  const db = tryGetDb();
  if (!db) throw new Error("Firebase is not configured. Add NEXT_PUBLIC_FIREBASE_* to .env.local.");
  return db;
}

function mapDoc(id: string, data: DocumentData): VoiceDictionaryRecord {
  return { id, ...(data as Omit<VoiceDictionaryRecord, "id">) };
}

function slugifyDisplayText(text: string): string {
  return text.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "entry";
}

export function buildVoiceDictionaryId(displayText: string, existingIds: Iterable<string>): string {
  const used = new Set(existingIds);
  const base = `vd-${slugifyDisplayText(displayText)}`;
  if (!used.has(base)) return base;
  let n = 2;
  while (used.has(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}

export function isPendingVoiceDictionaryRecord(record: VoiceDictionaryRecord): boolean {
  return record.id.startsWith("new-");
}

export function invalidateVoiceDictionaryCache(eventId: CompassEventId | string = TXC_EVENT_ID): void {
  cache.delete(eventId);
}

export async function loadVoiceDictionaryRecords(
  eventId: CompassEventId | string = TXC_EVENT_ID,
): Promise<VoiceDictionaryRecord[]> {
  const db = requireDb();
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
  const db = requireDb();
  const now = new Date().toISOString();
  const payload = voiceDictionaryToFirestore(record, now);
  await setDoc(
    doc(db, voiceDictionaryCollection(eventId), record.id),
    payload,
    { merge: true },
  );
  invalidateVoiceDictionaryCache(eventId);
}

function voiceDictionaryToFirestore(record: VoiceDictionaryRecord, now: string): DocumentData {
  const payload: DocumentData = {
    displayText: record.displayText.trim(),
    spokenText: record.spokenText.trim(),
    experience: record.experience,
    language: record.language ?? "en-US",
    active: record.active,
    createdAt: record.createdAt || now,
    updatedAt: now,
  };
  const notes = record.notes?.trim();
  if (notes) payload.notes = notes;
  return payload;
}

export async function createVoiceDictionaryRecord(
  eventId: CompassEventId | string,
  input: {
    displayText: string;
    spokenText: string;
    notes?: string;
    active?: boolean;
    experience?: VoiceDictionaryRecord["experience"];
  },
): Promise<VoiceDictionaryRecord> {
  const displayText = input.displayText.trim();
  const spokenText = input.spokenText.trim();
  if (!displayText) throw new Error("Display text is required.");
  if (!spokenText) throw new Error("Spoken text is required.");

  const existing = await loadVoiceDictionaryRecords(eventId);
  const duplicate = existing.find(
    r => r.experience === (input.experience ?? "techxchange")
      && r.displayText.toLowerCase() === displayText.toLowerCase(),
  );
  if (duplicate) {
    throw new Error(`"${displayText}" already exists. Select it in the table to edit.`);
  }

  const now = new Date().toISOString();
  const record: VoiceDictionaryRecord = {
    id: buildVoiceDictionaryId(displayText, existing.map(r => r.id)),
    displayText,
    spokenText,
    experience: input.experience ?? "techxchange",
    language: "en-US",
    active: input.active ?? true,
    createdAt: now,
    updatedAt: now,
  };
  const notes = input.notes?.trim();
  if (notes) record.notes = notes;

  await saveVoiceDictionaryRecord(eventId, record);
  return record;
}

export async function seedVoiceDictionaryIfEmpty(
  eventId: CompassEventId | string = TXC_EVENT_ID,
): Promise<number> {
  const db = requireDb();
  const col = collection(db, voiceDictionaryCollection(eventId));
  const snap = await getDocs(col);
  if (!snap.empty) return 0;

  for (const record of TXC_VOICE_DICTIONARY_SEED) {
    await setDoc(doc(col, record.id), voiceDictionaryToFirestore(record, record.updatedAt));
  }
  invalidateVoiceDictionaryCache(eventId);
  return TXC_VOICE_DICTIONARY_SEED.length;
}
