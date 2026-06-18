// =============================================================================
// Recommendation balance config — Firestore-backed pillar weights
// =============================================================================

import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { eventBasePath, TXC_EVENT_ID, type CompassEventId } from "@/lib/compassEventPaths";
import {
  DEFAULT_PILLAR_WEIGHTS,
  type PillarWeights,
  type RecommendationBalanceConfig,
} from "@/types/recommendationBalance";

const cache = new Map<string, PillarWeights>();

function balanceDocPath(eventId: CompassEventId | string): string {
  return `${eventBasePath(eventId)}/recommendation_balance/default`;
}

function normalizeWeights(raw: Partial<PillarWeights> | undefined): PillarWeights {
  const w = { ...DEFAULT_PILLAR_WEIGHTS, ...raw };
  return {
    learning: Math.max(0.1, Number(w.learning) || 1),
    people: Math.max(0.1, Number(w.people) || 1),
    community: Math.max(0.1, Number(w.community) || 1),
    fun: Math.max(0.1, Number(w.fun) || 1),
  };
}

export function invalidateRecommendationBalanceCache(
  eventId: CompassEventId | string = TXC_EVENT_ID,
): void {
  cache.delete(eventId);
}

export function getCachedPillarWeights(
  eventId: CompassEventId | string = TXC_EVENT_ID,
): PillarWeights {
  return cache.get(eventId) ?? DEFAULT_PILLAR_WEIGHTS;
}

export async function loadRecommendationBalanceConfig(
  eventId: CompassEventId | string = TXC_EVENT_ID,
): Promise<PillarWeights> {
  try {
    const snap = await getDoc(doc(db, balanceDocPath(eventId)));
    if (!snap.exists()) {
      cache.set(eventId, DEFAULT_PILLAR_WEIGHTS);
      return DEFAULT_PILLAR_WEIGHTS;
    }
    const data = snap.data() as RecommendationBalanceConfig;
    const weights = normalizeWeights(data.pillar_weights);
    cache.set(eventId, weights);
    return weights;
  } catch {
    return DEFAULT_PILLAR_WEIGHTS;
  }
}

export async function saveRecommendationBalanceConfig(
  eventId: CompassEventId | string,
  weights: PillarWeights,
  updatedBy = "admin",
): Promise<void> {
  const pillar_weights = normalizeWeights(weights);
  await setDoc(
    doc(db, balanceDocPath(eventId)),
    {
      pillar_weights,
      updated_at: new Date().toISOString(),
      updated_by: updatedBy,
    } satisfies RecommendationBalanceConfig,
    { merge: true },
  );
  cache.set(eventId, pillar_weights);
}
