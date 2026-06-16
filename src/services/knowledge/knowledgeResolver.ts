// =============================================================================
// Compass Knowledge — intent matching + localized responses
// =============================================================================

import { COMPASS_KNOWLEDGE } from "./compassKnowledge";
import { SKO_KNOWLEDGE } from "./skoKnowledge";
import { TECHXCHANGE_KNOWLEDGE } from "./techxchangeKnowledge";
import type {
  KnowledgeIntentId,
  KnowledgeItem,
  VoiceLocale,
} from "./knowledgeTypes";
import type { VoiceExperience } from "@/services/voice/voiceDictionaryTypes";

function normalise(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9'\s]/g, " ").replace(/\s+/g, " ").trim();
}

function itemsForExperience(experience: VoiceExperience): KnowledgeItem[] {
  const eventItems = experience === "sko" ? SKO_KNOWLEDGE : TECHXCHANGE_KNOWLEDGE;
  return [...COMPASS_KNOWLEDGE, ...eventItems];
}

export function matchKnowledgeIntent(
  transcript: string,
  experience: VoiceExperience,
): KnowledgeIntentId | null {
  const norm = normalise(transcript);

  for (const item of itemsForExperience(experience)) {
    for (const example of item.examples) {
      if (norm.includes(normalise(example))) {
        return item.intent;
      }
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
): { intent: KnowledgeIntentId; spoken: string; display: string } | null {
  const intent = matchKnowledgeIntent(transcript, experience);
  if (!intent) return null;
  const response = getKnowledgeResponse(intent, locale, experience);
  if (!response) return null;
  return { intent, ...response };
}
