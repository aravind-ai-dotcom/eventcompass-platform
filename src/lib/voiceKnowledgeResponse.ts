import type { VoiceKnowledgeRecord } from "@/types/voiceKnowledge";

export function resolveVoiceKnowledgeSpokenDisplay(record: VoiceKnowledgeRecord): {
  spoken: string;
  display: string;
  sourceUrl?: string;
  contactEmail?: string;
} {
  const display = record.display_response?.trim() || record.response;
  const spoken = record.response;
  return {
    spoken,
    display,
    sourceUrl: record.source_url,
    contactEmail: record.contact_email,
  };
}

export function voiceKnowledgeNeedsReview(record: VoiceKnowledgeRecord): string[] {
  const issues: string[] = [];
  if ((record.trigger_phrases?.length ?? 0) < 3) {
    issues.push("Missing sample utterances (fewer than 3)");
  }
  if (!record.response?.trim()) issues.push("Missing voice response");
  if (!record.title?.trim()) issues.push("Missing canonical question");
  if (record.source === "official_txc_faq" && !record.redirect_type) {
    issues.push("Missing redirect type");
  }
  if (record.redirect_type === "guest_services" && !record.contact_email) {
    issues.push("Guest Services record missing contact email");
  }
  if ((record.priority ?? 0) < 60) issues.push("Low priority");
  if (!record.enabled) issues.push("Inactive / disabled");
  return issues;
}
