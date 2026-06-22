import type { VoiceKnowledgeRecord } from "@/types/voiceKnowledge";

/** Normalize voice knowledge for Firestore writes (no undefined values). */
export function voiceKnowledgeFirestorePayload(
  record: VoiceKnowledgeRecord,
  defaults?: { source?: string; updatedBy?: string },
): Record<string, unknown> {
  return {
    category: record.category,
    title: record.title,
    trigger_phrases: record.trigger_phrases,
    response: record.response,
    display_response: record.display_response ?? record.response,
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
    source: record.source ?? defaults?.source ?? "compass_seed",
    updated_by: record.updated_by ?? defaults?.updatedBy ?? "seed",
    updated_at: record.updated_at || new Date().toISOString(),
  };
}
