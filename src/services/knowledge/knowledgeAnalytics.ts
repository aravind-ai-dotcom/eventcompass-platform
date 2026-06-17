// =============================================================================
// Compass Knowledge — analytics (intent triggered)
// =============================================================================

import type { KnowledgeIntentId, VoiceLocale } from "./knowledgeTypes";
import type { VoiceExperience } from "@/services/voice/voiceDictionaryTypes";

export type KnowledgeAnalyticsSource = "voice" | "chat" | "search";

export interface KnowledgeAnalyticsEvent {
  intent: KnowledgeIntentId;
  experience: VoiceExperience;
  locale: VoiceLocale;
  source: KnowledgeAnalyticsSource;
  timestamp: string;
}

const MAX_RECENT = 100;
const recentEvents: KnowledgeAnalyticsEvent[] = [];

export function trackKnowledgeIntent(
  intent: KnowledgeIntentId,
  experience: VoiceExperience,
  locale: VoiceLocale,
  source: KnowledgeAnalyticsSource = "voice",
): void {
  const event: KnowledgeAnalyticsEvent = {
    intent,
    experience,
    locale,
    source,
    timestamp: new Date().toISOString(),
  };

  recentEvents.push(event);
  if (recentEvents.length > MAX_RECENT) recentEvents.shift();

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("compass:knowledge-intent", { detail: event }),
    );
  }

  if (process.env.NODE_ENV === "development") {
    console.info("[CompassKnowledge]", event.intent, event.experience, event.source);
  }
}

/** Exposed for debugging and future admin dashboards */
export function getRecentKnowledgeAnalytics(): readonly KnowledgeAnalyticsEvent[] {
  return recentEvents;
}
