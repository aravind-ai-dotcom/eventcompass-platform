// =============================================================================
// Compass governance — Firestore collection paths per event
// =============================================================================

export const TXC_EVENT_ID = "txc2026";
export const SKO_EVENT_ID = "sko2026";

export type CompassEventId = typeof TXC_EVENT_ID | typeof SKO_EVENT_ID;

export function eventBasePath(eventId: CompassEventId | string): string {
  return `organizations/ibm/events/${eventId}`;
}

export function knowledgeBaseCollection(eventId: CompassEventId | string): string {
  return `${eventBasePath(eventId)}/knowledgeBase`;
}

export function voiceDictionaryCollection(eventId: CompassEventId | string): string {
  return `${eventBasePath(eventId)}/voiceDictionary`;
}

export function sttNormalizationCollection(eventId: CompassEventId | string): string {
  return `${eventBasePath(eventId)}/sttNormalization`;
}

export function knowledgeAnalyticsCollection(eventId: CompassEventId | string): string {
  return `${eventBasePath(eventId)}/knowledgeAnalytics`;
}

export function voiceKnowledgeCollection(eventId: CompassEventId | string): string {
  return `${eventBasePath(eventId)}/voice_knowledge`;
}

/** @deprecated Use voice_knowledge — legacy FAQ-lite collection */
export function txcFaqKnowledgeCollection(eventId: CompassEventId | string = TXC_EVENT_ID): string {
  return `${eventBasePath(eventId)}/knowledge`;
}

/** Category metadata for migrated official FAQ voice knowledge */
export function voiceKnowledgeCategoriesCollection(eventId: CompassEventId | string): string {
  return `${eventBasePath(eventId)}/voice_knowledge_categories`;
}

/** @deprecated Use voice_knowledge_categories */
export function txcFaqKnowledgeCategoriesCollection(eventId: CompassEventId | string = TXC_EVENT_ID): string {
  return `${eventBasePath(eventId)}/knowledge_categories`;
}

export function translationMemoryCollection(eventId: CompassEventId | string): string {
  return `${eventBasePath(eventId)}/translationMemory`;
}

export function contentSummariesCollection(eventId: CompassEventId | string): string {
  return `${eventBasePath(eventId)}/contentSummaries`;
}

export function experienceToEventId(experience: "techxchange" | "sko"): CompassEventId {
  return experience === "sko" ? SKO_EVENT_ID : TXC_EVENT_ID;
}

export function huddlesCollection(eventId: CompassEventId | string = TXC_EVENT_ID): string {
  return `${eventBasePath(eventId)}/huddles`;
}

export function huddleDocPath(
  huddleId: string,
  eventId: CompassEventId | string = TXC_EVENT_ID,
): string {
  return `${huddlesCollection(eventId)}/${huddleId}`;
}

export function huddleResponsesCollection(
  huddleId: string,
  eventId: CompassEventId | string = TXC_EVENT_ID,
): string {
  return `${huddleDocPath(huddleId, eventId)}/responses`;
}
