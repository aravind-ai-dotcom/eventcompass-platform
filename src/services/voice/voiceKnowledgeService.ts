// =============================================================================
// Voice knowledge service — Firestore source of truth
// Path: organizations/ibm/events/txc2026/voice_knowledge
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
import type {
  VoiceIntentCategory,
  VoiceKnowledgeCategory,
  VoiceKnowledgeRecord,
  VoiceKnowledgeRedirectType,
} from "@/types/voiceKnowledge";

const cache = new Map<string, VoiceKnowledgeRecord[]>();

function mapDoc(id: string, data: DocumentData): VoiceKnowledgeRecord {
  return {
    id,
    category: data.category as VoiceKnowledgeCategory,
    title: data.title ?? "",
    trigger_phrases: Array.isArray(data.trigger_phrases) ? data.trigger_phrases.map(String) : [],
    response: data.response ?? "",
    display_response: typeof data.display_response === "string" ? data.display_response : undefined,
    enabled: data.enabled !== false,
    topic_key: typeof data.topic_key === "string" ? data.topic_key : undefined,
    intent: typeof data.intent === "string" ? data.intent : undefined,
    intent_category: typeof data.intent_category === "string"
      ? data.intent_category as VoiceIntentCategory
      : undefined,
    faq_category_id: typeof data.faq_category_id === "string" ? data.faq_category_id : undefined,
    redirect_type: typeof data.redirect_type === "string"
      ? data.redirect_type as VoiceKnowledgeRedirectType
      : undefined,
    source_url: typeof data.source_url === "string" ? data.source_url : undefined,
    contact_email: typeof data.contact_email === "string" ? data.contact_email : undefined,
    tags: Array.isArray(data.tags) ? data.tags.map(String) : undefined,
    priority: typeof data.priority === "number" ? data.priority : undefined,
    source: typeof data.source === "string" ? data.source : undefined,
    updated_by: typeof data.updated_by === "string" ? data.updated_by : undefined,
    updated_at: typeof data.updated_at === "string" ? data.updated_at : "",
  };
}

function sortRecords(records: VoiceKnowledgeRecord[]): VoiceKnowledgeRecord[] {
  return [...records].sort((a, b) => {
    const priorityDiff = (b.priority ?? 50) - (a.priority ?? 50);
    if (priorityDiff !== 0) return priorityDiff;
    return a.title.localeCompare(b.title);
  });
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
    const fallback = sortRecords(TXC_VOICE_KNOWLEDGE_SEED);
    cache.set(eventId, fallback);
    return fallback;
  }

  const records = sortRecords(snap.docs.map(d => mapDoc(d.id, d.data())));
  cache.set(eventId, records);
  return records;
}

export function getCachedVoiceKnowledgeRecords(
  eventId: CompassEventId | string = TXC_EVENT_ID,
): VoiceKnowledgeRecord[] {
  return cache.get(eventId) ?? sortRecords(TXC_VOICE_KNOWLEDGE_SEED);
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
    display_response: record.display_response ?? null,
    enabled: record.enabled,
    topic_key: record.topic_key ?? null,
    intent: record.intent ?? null,
    intent_category: record.intent_category ?? null,
    faq_category_id: record.faq_category_id ?? null,
    redirect_type: record.redirect_type ?? null,
    source_url: record.source_url ?? null,
    contact_email: record.contact_email ?? null,
    tags: record.tags ?? [],
    priority: record.priority ?? 50,
    source: record.source ?? null,
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
