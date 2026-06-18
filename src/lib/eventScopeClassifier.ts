// =============================================================================
// Event scope classifier — EVENT_RELATED vs GENERAL_CONCIERGE
// =============================================================================

import { getEnabledVoiceKnowledgeRecords } from "@/services/voice/voiceKnowledgeService";
import { TXC_EVENT_ID, type CompassEventId } from "@/lib/compassEventPaths";

export type EventScope = "EVENT_RELATED" | "GENERAL_CONCIERGE" | "AMBIGUOUS";

export interface EventScopeClassification {
  scope: EventScope;
  confidence: "high" | "low";
  generalScore: number;
  eventScore: number;
  matchedGeneral?: string;
  matchedEvent?: string;
}

/** Default phrases — overridden/extended by Voice Intelligence Admin (Event Scope). */
export const DEFAULT_GENERAL_CONCIERGE_PHRASES: string[] = [
  "grocery",
  "groceries",
  "buy food",
  "buy groceries",
  "where can i buy",
  "supermarket",
  "convenience store",
  "restaurant",
  "restaurants",
  "food court",
  "eat near",
  "where to eat",
  "get food",
  "coffee",
  "starbucks",
  "cafe",
  "café",
  "espresso",
  "latte",
  "atm",
  "bank",
  "cash",
  "airport",
  "get to the airport",
  "fly out",
  "hotel",
  "motel",
  "lodging",
  "where am i staying",
  "uber",
  "lyft",
  "taxi",
  "cab",
  "transportation",
  "public transit",
  "bus to",
  "train to",
  "parking",
  "where to park",
  "park my car",
  "weather",
  "forecast",
  "rain today",
  "temperature outside",
  "pharmacy",
  "drugstore",
  "medicine",
  "directions to",
  "how do i get to",
  "navigate to",
  "google maps",
  "nearest",
  "nearby store",
  "local services",
  "dry cleaning",
  "laundry",
];

export const DEFAULT_EVENT_RELATED_PHRASES: string[] = [
  "session",
  "sessions",
  "breakout",
  "lab",
  "workshop",
  "what to attend",
  "champion",
  "champions",
  "ibm champion",
  "certification",
  "certified",
  "cert exam",
  "exam prep",
  "community day",
  "partner day",
  "meetup",
  "meet up",
  "huddle",
  "huddles",
  "networking",
  "network with",
  "tech track",
  "tech tracks",
  "techxchange",
  "tech xchange",
  "compass",
  "my compass",
  "voice compass",
  "next best move",
  "recommended session",
  "who should i meet",
  "study group",
  "sandbox block party",
  "student day",
  "data technical summit",
  "speaker",
  "keynote",
  "agenda",
  "my schedule",
  "my plan",
  "enroll",
  "build my compass",
];

export const DEFAULT_CONCIERGE_RESPONSE = `That sounds like a logistics or local question rather than an event question.

I can help with:
• Sessions
• Certifications
• People
• Communities
• Event activities

For local services, use venue resources or nearby maps.`;

export const DEFAULT_SCOPE_CLARIFY_RESPONSE =
  "Are you asking about TechXchange activities or local services nearby? I can help with sessions, certifications, people, communities, and event activities — or point you to venue maps for logistics.";

function normalise(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9'\s]/g, " ").replace(/\s+/g, " ").trim();
}

function scorePhrases(norm: string, phrases: string[]): { score: number; matched?: string } {
  let score = 0;
  let matched: string | undefined;
  for (const phrase of phrases) {
    const p = normalise(phrase);
    if (!p || !norm.includes(p)) continue;
    const points = p.includes(" ") ? 4 : 2;
    score += points;
    if (!matched || p.length > matched.length) matched = phrase;
  }
  return { score, matched };
}

function loadScopePhrases(
  eventId: CompassEventId | string,
): { general: string[]; event: string[] } {
  const general = [...DEFAULT_GENERAL_CONCIERGE_PHRASES];
  const event = [...DEFAULT_EVENT_RELATED_PHRASES];

  for (const record of getEnabledVoiceKnowledgeRecords(eventId)) {
    if (record.category !== "Event Scope") continue;
    const key = record.topic_key ?? "";
    if (key === "general_concierge" || key.startsWith("general_")) {
      general.push(...record.trigger_phrases);
    } else if (key === "event_related" || key.startsWith("event_")) {
      event.push(...record.trigger_phrases);
    }
  }

  return { general, event };
}

export function resolveConciergeResponse(eventId: CompassEventId | string = TXC_EVENT_ID): string {
  const record = getEnabledVoiceKnowledgeRecords(eventId).find(
    r => r.category === "Event Scope" && r.topic_key === "concierge_response",
  );
  return record?.response ?? DEFAULT_CONCIERGE_RESPONSE;
}

export function resolveScopeClarifyResponse(eventId: CompassEventId | string = TXC_EVENT_ID): string {
  const record = getEnabledVoiceKnowledgeRecords(eventId).find(
    r => r.category === "Event Scope" && r.topic_key === "scope_clarify",
  );
  return record?.response ?? DEFAULT_SCOPE_CLARIFY_RESPONSE;
}

export function classifyEventScope(
  transcript: string,
  eventId: CompassEventId | string = TXC_EVENT_ID,
): EventScopeClassification {
  const norm = normalise(transcript);
  if (!norm) {
    return { scope: "EVENT_RELATED", confidence: "low", generalScore: 0, eventScore: 0 };
  }

  const { general, event } = loadScopePhrases(eventId);
  const generalResult = scorePhrases(norm, general);
  const eventResult = scorePhrases(norm, event);

  const generalScore = generalResult.score;
  const eventScore = eventResult.score;

  if (generalScore > 0 && eventScore > 0) {
    const margin = Math.abs(generalScore - eventScore);
    if (margin <= 2) {
      return {
        scope: "AMBIGUOUS",
        confidence: "low",
        generalScore,
        eventScore,
        matchedGeneral: generalResult.matched,
        matchedEvent: eventResult.matched,
      };
    }
    if (generalScore > eventScore) {
      return {
        scope: "GENERAL_CONCIERGE",
        confidence: margin >= 4 ? "high" : "low",
        generalScore,
        eventScore,
        matchedGeneral: generalResult.matched,
        matchedEvent: eventResult.matched,
      };
    }
    return {
      scope: "EVENT_RELATED",
      confidence: "high",
      generalScore,
      eventScore,
      matchedGeneral: generalResult.matched,
      matchedEvent: eventResult.matched,
    };
  }

  if (generalScore > 0) {
    return {
      scope: "GENERAL_CONCIERGE",
      confidence: generalScore >= 4 ? "high" : "low",
      generalScore,
      eventScore,
      matchedGeneral: generalResult.matched,
    };
  }

  if (eventScore > 0) {
    return {
      scope: "EVENT_RELATED",
      confidence: "high",
      generalScore,
      eventScore,
      matchedEvent: eventResult.matched,
    };
  }

  return { scope: "EVENT_RELATED", confidence: "low", generalScore: 0, eventScore: 0 };
}

/** True when recommendation intents must not run (sessions, champions, certs). */
export function blocksEventRecommendations(scope: EventScopeClassification): boolean {
  if (scope.scope !== "GENERAL_CONCIERGE") return false;
  if (scope.confidence === "high") return true;
  return scope.generalScore >= 2 && scope.eventScore === 0;
}

export function needsScopeClarification(scope: EventScopeClassification): boolean {
  return scope.scope === "AMBIGUOUS" && scope.confidence === "low";
}
