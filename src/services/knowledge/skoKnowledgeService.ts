// =============================================================================
// SKO bilingual knowledge service — Firestore source of truth
// Path: organizations/ibm/events/sko2026/knowledgeBase/{id}
// =============================================================================

import { collection, doc, getDocs, setDoc, type DocumentData } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { knowledgeBaseCollection, SKO_EVENT_ID, type CompassEventId } from "@/lib/compassEventPaths";
import { SKO_KNOWLEDGE_SEED } from "@/data/seeds/skoGovernanceSeed";
import type {
  GovernanceLanguage,
  KnowledgeMatchResult,
  SkoKnowledgeRecord,
} from "@/types/compassGovernance";

const cache = new Map<string, SkoKnowledgeRecord[]>();

function mapDoc(id: string, data: DocumentData): SkoKnowledgeRecord {
  return { id, ...(data as Omit<SkoKnowledgeRecord, "id">) };
}

export function invalidateSkoKnowledgeCache(eventId: CompassEventId | string = SKO_EVENT_ID): void {
  cache.delete(eventId);
}

export async function loadSkoKnowledgeRecords(
  eventId: CompassEventId | string = SKO_EVENT_ID,
): Promise<SkoKnowledgeRecord[]> {
  const snap = await getDocs(collection(db, knowledgeBaseCollection(eventId)));

  if (snap.empty) {
    cache.set(eventId, SKO_KNOWLEDGE_SEED);
    return SKO_KNOWLEDGE_SEED;
  }

  const records = snap.docs
    .map(d => mapDoc(d.id, d.data()))
    .sort((a, b) => b.priority - a.priority);

  cache.set(eventId, records);
  return records;
}

export function getCachedSkoKnowledgeRecords(
  eventId: CompassEventId | string = SKO_EVENT_ID,
): SkoKnowledgeRecord[] {
  return cache.get(eventId) ?? SKO_KNOWLEDGE_SEED;
}

export function getActiveSkoKnowledgeRecords(
  eventId: CompassEventId | string = SKO_EVENT_ID,
): SkoKnowledgeRecord[] {
  return getCachedSkoKnowledgeRecords(eventId).filter(r => r.active && r.status === "active");
}

export async function saveSkoKnowledgeRecord(
  eventId: CompassEventId | string,
  record: SkoKnowledgeRecord,
): Promise<void> {
  await setDoc(
    doc(db, knowledgeBaseCollection(eventId), record.id),
    { ...record, updatedAt: new Date().toISOString() },
    { merge: true },
  );
  invalidateSkoKnowledgeCache(eventId);
}

export async function seedSkoKnowledgeIfEmpty(
  eventId: CompassEventId | string = SKO_EVENT_ID,
): Promise<number> {
  const col = collection(db, knowledgeBaseCollection(eventId));
  const snap = await getDocs(col);
  if (!snap.empty) return 0;

  for (const record of SKO_KNOWLEDGE_SEED) {
    await setDoc(doc(col, record.id), record);
  }
  invalidateSkoKnowledgeCache(eventId);
  return SKO_KNOWLEDGE_SEED.length;
}

function normalise(text: string): string {
  return text.toLowerCase().replace(/[^\p{L}\p{N}'\s]/gu, " ").replace(/\s+/g, " ").trim();
}

function responseForLanguage(
  record: SkoKnowledgeRecord,
  language: GovernanceLanguage,
): string {
  return record.response[language] ?? record.response["en-US"] ?? "";
}

export function matchSkoKnowledgeQuestion(
  question: string,
  language: GovernanceLanguage = "en-US",
  eventId: CompassEventId | string = SKO_EVENT_ID,
  geoId?: string,
): KnowledgeMatchResult | null {
  const norm = normalise(question);
  if (!norm) return null;

  const records = getActiveSkoKnowledgeRecords(eventId).filter(
    r => !r.geoId || !geoId || r.geoId === geoId,
  );

  let best: (KnowledgeMatchResult & { score: number }) | null = null;

  for (const record of records) {
    const langs: GovernanceLanguage[] = language === "zh-CN"
      ? ["zh-CN", "en-US"]
      : ["en-US", "zh-CN"];

    for (const lang of langs) {
      const examples = record.examples[lang] ?? [];
      for (const example of examples) {
        const phrase = normalise(example);
        if (!phrase || !norm.includes(phrase)) continue;
        const score = 0.85 + Math.min(phrase.length / 200, 0.1) + record.priority / 1000;
        if (!best || score > best.score) {
          best = {
            knowledgeId: record.id,
            intent: record.intent,
            response: responseForLanguage(record, lang),
            confidence: Math.min(score, 0.99),
            category: record.category,
            language: lang,
            score,
          };
        }
      }
    }

    const intentPhrase = normalise(record.intent.replace(/_/g, " "));
    if (intentPhrase && norm.includes(intentPhrase)) {
      const score = 0.7 + record.priority / 1000;
      if (!best || score > best.score) {
        best = {
          knowledgeId: record.id,
          intent: record.intent,
          response: responseForLanguage(record, language),
          confidence: Math.min(score, 0.95),
          category: record.category,
          language,
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
            response: responseForLanguage(record, language),
            confidence: Math.min(score, 0.85),
            category: record.category,
            language,
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

export function hasChinese(record: SkoKnowledgeRecord): boolean {
  return Boolean(record.response["zh-CN"] || record.examples["zh-CN"]?.length);
}
