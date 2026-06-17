// =============================================================================
// Compass Knowledge — intent matching + localized responses
// =============================================================================

import { COMPASS_KNOWLEDGE } from "./compassKnowledge";
import { trackKnowledgeIntent } from "./knowledgeAnalytics";
import { SKO_KNOWLEDGE } from "./skoKnowledge";
import { TECHXCHANGE_KNOWLEDGE } from "./techxchangeKnowledge";
import type {
  KnowledgeIntentId,
  KnowledgeItem,
  VoiceLocale,
} from "./knowledgeTypes";
import type { KnowledgeAnalyticsSource } from "./knowledgeAnalytics";
import type { VoiceExperience } from "@/services/voice/voiceDictionaryTypes";

function normalise(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9'\s]/g, " ").replace(/\s+/g, " ").trim();
}

function itemsForExperience(experience: VoiceExperience): KnowledgeItem[] {
  const eventItems = experience === "sko" ? SKO_KNOWLEDGE : TECHXCHANGE_KNOWLEDGE;
  // Event overrides first, then shared Compass knowledge
  return [...eventItems, ...COMPASS_KNOWLEDGE];
}

interface MatchCandidate {
  intent: KnowledgeIntentId;
  phrase: string;
}

function buildMatchCandidates(items: KnowledgeItem[]): MatchCandidate[] {
  const candidates: MatchCandidate[] = [];
  for (const item of items) {
    for (const example of item.examples) {
      candidates.push({ intent: item.intent, phrase: normalise(example) });
    }
  }
  return candidates.sort((a, b) => b.phrase.length - a.phrase.length);
}

const MATCH_CACHES = new Map<VoiceExperience, MatchCandidate[]>();

function matchCandidatesFor(experience: VoiceExperience): MatchCandidate[] {
  let cached = MATCH_CACHES.get(experience);
  if (!cached) {
    cached = buildMatchCandidates(itemsForExperience(experience));
    MATCH_CACHES.set(experience, cached);
  }
  return cached;
}

export function matchKnowledgeIntent(
  transcript: string,
  experience: VoiceExperience,
): KnowledgeIntentId | null {
  const norm = normalise(transcript);

  for (const { intent, phrase } of matchCandidatesFor(experience)) {
    if (norm.includes(phrase)) {
      return intent;
    }
  }
  return null;
}

export function getKnowledgeResponse(
  intent: KnowledgeIntentId,
  locale: VoiceLocale,
  experience: VoiceExperience,
): { spoken: string; display: string } | null {
  const items = itemsForExperience(experience);
  const item =
    items.find(entry => entry.intent === intent && entry.experience === experience) ??
    items.find(entry => entry.intent === intent);

  if (!item) return null;

  const spoken = item.response[locale] ?? item.response["en-US"];
  return { spoken, display: spoken };
}

export function knowledgeResponseFromTranscript(
  transcript: string,
  locale: VoiceLocale,
  experience: VoiceExperience,
  source: KnowledgeAnalyticsSource = "voice",
): { intent: KnowledgeIntentId; spoken: string; display: string } | null {
  const intent = matchKnowledgeIntent(transcript, experience);
  if (!intent) return null;
  const response = getKnowledgeResponse(intent, locale, experience);
  if (!response) return null;
  trackKnowledgeIntent(intent, experience, locale, source);
  return { intent, ...response };
}

export function getAllKnowledgeItems(experience: VoiceExperience): KnowledgeItem[] {
  return itemsForExperience(experience);
}
