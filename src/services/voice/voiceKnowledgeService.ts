// =============================================================================
// Voice knowledge service — Firestore source of truth
// =============================================================================

import {
  collection,
  doc,
  getDocs,
  setDoc,
  type DocumentData,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { voiceKnowledgeCollection, TXC_EVENT_ID, type CompassEventId } from "@/lib/compassEventPaths";
import { TXC_VOICE_KNOWLEDGE_SEED } from "@/data/seeds/txcVoiceKnowledgeSeed";
import type { VoiceKnowledgeRecord } from "@/types/voiceKnowledge";

const cache = new Map<string, VoiceKnowledgeRecord[]>();

function mapDoc(id: string, data: DocumentData): VoiceKnowledgeRecord {
  return {
    id,
    category: data.category as VoiceKnowledgeRecord["category"],
    title: data.title ?? "",
    trigger_phrases: Array.isArray(data.trigger_phrases) ? data.trigger_phrases : [],
    response: data.response ?? "",
    enabled: data.enabled !== false,
    topic_key: typeof data.topic_key === "string" ? data.topic_key : undefined,
    updated_by: typeof data.updated_by === "string" ? data.updated_by : undefined,
    updated_at: typeof data.updated_at === "string" ? data.updated_at : "",
  };
}

export function invalidateVoiceKnowledgeCache(eventId: CompassEventId | string = TXC_EVENT_ID): void {
  cache.delete(eventId);
}

export async function loadVoiceKnowledgeRecords(
  eventId: CompassEventId | string = TXC_EVENT_ID,
): Promise<VoiceKnowledgeRecord[]> {
  const col = collection(db, voiceKnowledgeCollection(eventId));
  const snap = await getDocs(col);

  if (snap.empty) {
    cache.set(eventId, TXC_VOICE_KNOWLEDGE_SEED);
    return TXC_VOICE_KNOWLEDGE_SEED;
  }

  const records = snap.docs
    .map(d => mapDoc(d.id, d.data()))
    .sort((a, b) => a.title.localeCompare(b.title));

  cache.set(eventId, records);
  return records;
}

export function getCachedVoiceKnowledgeRecords(
  eventId: CompassEventId | string = TXC_EVENT_ID,
): VoiceKnowledgeRecord[] {
  return cache.get(eventId) ?? TXC_VOICE_KNOWLEDGE_SEED;
}

export function getEnabledVoiceKnowledgeRecords(
  eventId: CompassEventId | string = TXC_EVENT_ID,
): VoiceKnowledgeRecord[] {
  return getCachedVoiceKnowledgeRecords(eventId).filter(r => r.enabled);
}

export async function saveVoiceKnowledgeRecord(
  eventId: CompassEventId | string,
  record: VoiceKnowledgeRecord,
  updatedBy = "admin",
): Promise<void> {
  const ref = doc(db, voiceKnowledgeCollection(eventId), record.id);
  const payload = {
    category: record.category,
    title: record.title,
    trigger_phrases: record.trigger_phrases,
    response: record.response,
    enabled: record.enabled,
    topic_key: record.topic_key ?? null,
    updated_by: updatedBy,
    updated_at: new Date().toISOString(),
  };
  await setDoc(ref, payload, { merge: true });
  invalidateVoiceKnowledgeCache(eventId);
}

export async function seedVoiceKnowledgeIfEmpty(
  eventId: CompassEventId | string = TXC_EVENT_ID,
): Promise<number> {
  const col = collection(db, voiceKnowledgeCollection(eventId));
  const snap = await getDocs(col);
  if (!snap.empty) return 0;

  for (const record of TXC_VOICE_KNOWLEDGE_SEED) {
    await setDoc(doc(col, record.id), {
      category: record.category,
      title: record.title,
      trigger_phrases: record.trigger_phrases,
      response: record.response,
      enabled: record.enabled,
      topic_key: record.topic_key ?? null,
      updated_by: record.updated_by ?? "seed",
      updated_at: record.updated_at,
    });
  }
  invalidateVoiceKnowledgeCache(eventId);
  return TXC_VOICE_KNOWLEDGE_SEED.length;
}

export function getVoiceKnowledgeRecord(
  id: string,
  eventId: CompassEventId | string = TXC_EVENT_ID,
): VoiceKnowledgeRecord | null {
  return getCachedVoiceKnowledgeRecords(eventId).find(r => r.id === id) ?? null;
}

export function findVoiceKnowledgeByTopic(
  category: VoiceKnowledgeRecord["category"],
  topicKey: string,
  eventId: CompassEventId | string = TXC_EVENT_ID,
): VoiceKnowledgeRecord | null {
  return (
    getEnabledVoiceKnowledgeRecords(eventId).find(
      r => r.category === category && r.topic_key === topicKey,
    ) ?? null
  );
}
