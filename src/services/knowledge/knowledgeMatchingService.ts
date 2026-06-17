// =============================================================================
// Knowledge matching + Firestore analytics
// =============================================================================

import { addDoc, collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  experienceToEventId,
  knowledgeAnalyticsCollection,
  SKO_EVENT_ID,
  TXC_EVENT_ID,
  type CompassEventId,
} from "@/lib/compassEventPaths";
import { getActiveKnowledgeRecords, loadKnowledgeRecords } from "./knowledgeService";
import {
  loadSkoKnowledgeRecords,
  matchSkoKnowledgeQuestion,
} from "./skoKnowledgeService";
import type {
  KnowledgeAnalyticsRecord,
  KnowledgeMatchResult,
  GovernanceLanguage,
} from "@/types/compassGovernance";

function normalise(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9'\s]/g, " ").replace(/\s+/g, " ").trim();
}

interface ScoredMatch extends KnowledgeMatchResult {
  score: number;
}

export async function ensureKnowledgeLoaded(eventId: CompassEventId | string = TXC_EVENT_ID): Promise<void> {
  if (eventId === SKO_EVENT_ID || eventId === "sko2026") {
    await loadSkoKnowledgeRecords(eventId);
    return;
  }
  await loadKnowledgeRecords(eventId);
}

export function matchKnowledgeQuestion(
  question: string,
  eventId: CompassEventId | string = TXC_EVENT_ID,
  options?: { language?: GovernanceLanguage; geoId?: string },
): KnowledgeMatchResult | null {
  if (eventId === SKO_EVENT_ID || eventId === "sko2026") {
    return matchSkoKnowledgeQuestion(
      question,
      options?.language ?? "en-US",
      eventId,
      options?.geoId,
    );
  }

  const norm = normalise(question);
  if (!norm) return null;

  const records = getActiveKnowledgeRecords(eventId);
  let best: ScoredMatch | null = null;

  for (const record of records) {
    for (const example of record.examples) {
      const phrase = normalise(example);
      if (!phrase || !norm.includes(phrase)) continue;
      const score = 0.85 + Math.min(phrase.length / 200, 0.1) + record.priority / 1000;
      if (!best || score > best.score) {
        best = {
          knowledgeId: record.id,
          intent: record.intent,
          response: record.response,
          confidence: Math.min(score, 0.99),
          category: record.category,
          score,
        };
      }
    }

    const intentPhrase = normalise(record.intent.replace(/_/g, " "));
    if (intentPhrase && norm.includes(intentPhrase)) {
      const score = 0.7 + record.priority / 1000;
      if (!best || score > best.score) {
        best = {
          knowledgeId: record.id,
          intent: record.intent,
          response: record.response,
          confidence: Math.min(score, 0.95),
          category: record.category,
          score,
        };
      }
    }

    for (const tag of record.tags) {
      const tagPhrase = normalise(tag);
      if (tagPhrase && norm.includes(tagPhrase)) {
        const score = 0.55 + record.priority / 1000;
        if (!best || score > best.score) {
          best = {
            knowledgeId: record.id,
            intent: record.intent,
            response: record.response,
            confidence: Math.min(score, 0.85),
            category: record.category,
            score,
          };
        }
      }
    }
  }

  if (!best) return null;
  const { score: _s, ...result } = best;
  return result;
}

export async function logKnowledgeAnalytics(
  eventId: CompassEventId | string,
  payload: Omit<KnowledgeAnalyticsRecord, "createdAt" | "id">,
): Promise<void> {
  const record: KnowledgeAnalyticsRecord = {
    ...payload,
    createdAt: new Date().toISOString(),
  };
  try {
    await addDoc(collection(db, knowledgeAnalyticsCollection(eventId)), record);
  } catch (err) {
    console.error("[KnowledgeAnalytics] write failed:", err);
  }
}

export async function fetchRecentAnalytics(
  eventId: CompassEventId | string = TXC_EVENT_ID,
  max = 100,
): Promise<KnowledgeAnalyticsRecord[]> {
  const snap = await getDocs(collection(db, knowledgeAnalyticsCollection(eventId)));
  return snap.docs
    .map(d => ({ id: d.id, ...(d.data() as Omit<KnowledgeAnalyticsRecord, "id">) }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, max);
}

export function matchKnowledgeForExperience(
  question: string,
  experience: "techxchange" | "sko",
  options?: {
    normalizedQuestion?: string;
    language?: GovernanceLanguage;
    source?: "typed" | "voice";
  },
): KnowledgeMatchResult | null {
  const eventId = experienceToEventId(experience);
  const raw = options?.normalizedQuestion ?? question;
  return matchKnowledgeQuestion(raw, eventId, {
    language: options?.language,
  });
}

export async function matchAndLogKnowledge(
  question: string,
  experience: "techxchange" | "sko",
  options: {
    normalizedQuestion?: string;
    language?: GovernanceLanguage;
    source?: "typed" | "voice";
  } = {},
): Promise<KnowledgeMatchResult | null> {
  const eventId = experienceToEventId(experience);
  await ensureKnowledgeLoaded(eventId);

  const match = matchKnowledgeQuestion(
    options.normalizedQuestion ?? question,
    eventId,
    { language: options.language },
  );

  void logKnowledgeAnalytics(eventId, {
    rawQuestion: question,
    normalizedQuestion: options.normalizedQuestion,
    matchedIntent: match?.intent,
    confidence: match?.confidence,
    experience,
    language: options.language ?? "en-US",
    source: options.source ?? "voice",
  });

  return match;
}
