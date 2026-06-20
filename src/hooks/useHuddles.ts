"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { findSessionConflict, type SessionConflictInput } from "@/lib/huddleConflict";
import { huddleToLiveOpportunity } from "@/lib/huddleDisplay";
import {
  matchHuddlesForParticipant,
  participantFromRaw,
} from "@/services/huddleMatchingService";
import {
  cancelHuddle,
  createHuddle,
  fetchActiveHuddles,
  fetchUserHuddleResponses,
  setHuddleResponse,
} from "@/services/huddleService";
import type {
  CreateHuddleInput,
  HuddleDoc,
  HuddleParticipantContext,
  HuddleResponseType,
  MatchedHuddle,
} from "@/types/huddleDataModel";
import type { LiveOpportunity } from "@/types/liveOpportunity";

export interface HuddlesController {
  loading: boolean;
  liveOpportunities: LiveOpportunity[];
  matchedHuddles: MatchedHuddle[];
  responses: Record<string, HuddleResponseType>;
  createHuddle: (input: CreateHuddleInput) => Promise<HuddleDoc>;
  respondOnMyWay: (huddleId: string, displayName: string) => Promise<void>;
  cancelHuddle: (huddleId: string) => Promise<void>;
}

interface UseHuddlesOptions {
  participantUid?: string;
  participantRaw?: Record<string, unknown> | null;
  savedSessionIds?: string[];
  reservedSessionIds?: string[];
  sessions?: SessionConflictInput[];
  displayLimit?: number;
}

export function useHuddles({
  participantUid,
  participantRaw,
  savedSessionIds = [],
  reservedSessionIds = [],
  sessions = [],
  displayLimit = 5,
}: UseHuddlesOptions) {
  const [allHuddles, setAllHuddles] = useState<HuddleDoc[]>([]);
  const [responses, setResponses] = useState<Record<string, HuddleResponseType>>({});
  const [loading, setLoading] = useState(true);

  const participant: HuddleParticipantContext | null = useMemo(() => {
    if (!participantUid || !participantRaw) return null;
    return participantFromRaw(participantUid, participantRaw);
  }, [participantUid, participantRaw]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const huddles = await fetchActiveHuddles();
      setAllHuddles(huddles);

      if (participantUid && huddles.length > 0) {
        const resp = await fetchUserHuddleResponses(
          participantUid,
          huddles.map(h => h.id),
        );
        setResponses(resp);
      }
    } finally {
      setLoading(false);
    }
  }, [participantUid]);

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => void refresh(), 60_000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  const reservedIds = useMemo(
    () => [...new Set([...savedSessionIds, ...reservedSessionIds])],
    [savedSessionIds, reservedSessionIds],
  );

  const matchedHuddles: MatchedHuddle[] = useMemo(() => {
    if (!participant) return [];
    const base = matchHuddlesForParticipant(allHuddles, participant, responses, displayLimit);
    return base.map(h => ({
      ...h,
      session_conflict: findSessionConflict(
        h.date,
        h.start_time,
        h.end_time,
        reservedIds,
        sessions,
      ),
    }));
  }, [allHuddles, participant, responses, displayLimit, reservedIds, sessions]);

  const liveOpportunities: LiveOpportunity[] = useMemo(
    () => matchedHuddles.map(huddleToLiveOpportunity),
    [matchedHuddles],
  );

  const create = useCallback(
    async (input: CreateHuddleInput) => {
      const created = await createHuddle(input);
      await refresh();
      return created;
    },
    [refresh],
  );

  const respondOnMyWay = useCallback(
    async (huddleId: string, displayName: string) => {
      if (!participantUid) return;
      const prev = responses[huddleId];
      const next: HuddleResponseType = prev === "on_my_way" ? "interested" : "on_my_way";
      await setHuddleResponse(huddleId, participantUid, displayName, next, prev);
      setResponses(r => ({ ...r, [huddleId]: next }));
      await refresh();
    },
    [participantUid, responses, refresh],
  );

  const cancel = useCallback(
    async (huddleId: string) => {
      if (!participantUid) return;
      await cancelHuddle(huddleId, participantUid);
      await refresh();
    },
    [participantUid, refresh],
  );

  return {
    loading,
    matchedHuddles,
    liveOpportunities,
    allHuddles,
    responses,
    refresh,
    createHuddle: create,
    respondOnMyWay,
    cancelHuddle: cancel,
  };
}
