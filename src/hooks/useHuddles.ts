"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { findSessionConflict, type SessionConflictInput } from "@/lib/huddleConflict";
import { huddleToLiveOpportunity, sampleLiveOpportunityToMatched } from "@/lib/huddleDisplay";
import { SAMPLE_LIVE_HUDDLES } from "@/lib/sampleLiveHuddles";
import {
  matchHuddlesForParticipant,
  participantFromRaw,
} from "@/services/huddleMatchingService";
import { logHuddleAnalytics } from "@/services/huddleAnalyticsService";
import {
  hideHuddle,
  loadHuddlePreferences,
  notForMeHuddle,
  reportHuddle,
  type HuddlePreferences,
} from "@/services/huddlePreferencesService";
import {
  cancelHuddle,
  createHuddle,
  duplicateHuddle,
  extendHuddleTime,
  fetchActiveHuddles,
  fetchUserHuddleResponses,
  setHuddleResponse,
  updateHuddle,
} from "@/services/huddleService";
import type {
  CreateHuddleInput,
  HuddleDoc,
  HuddleParticipantContext,
  HuddleResponseType,
  MatchedHuddle,
  UpdateHuddleInput,
} from "@/types/huddleDataModel";
import type { LiveOpportunity } from "@/types/liveOpportunity";

export interface HuddlesController {
  loading: boolean;
  liveOpportunities: LiveOpportunity[];
  matchedHuddles: MatchedHuddle[];
  responses: Record<string, HuddleResponseType>;
  preferences: HuddlePreferences;
  createHuddle: (input: CreateHuddleInput) => Promise<HuddleDoc>;
  respondOnMyWay: (huddleId: string, displayName: string) => Promise<void>;
  respondNotForMe: (huddleId: string, classification: MatchedHuddle["classification"]) => Promise<void>;
  hideHuddleById: (huddleId: string) => Promise<void>;
  reportHuddleById: (huddleId: string) => Promise<void>;
  cancelHuddle: (huddleId: string) => Promise<void>;
  updateHuddleById: (huddleId: string, updates: UpdateHuddleInput) => Promise<void>;
  extendHuddle: (huddleId: string) => Promise<void>;
  duplicateHuddleById: (huddleId: string) => Promise<void>;
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
  const [preferences, setPreferences] = useState<HuddlePreferences>({
    hidden_huddle_ids: [],
    muted_classifications: [],
    reported_huddle_ids: [],
  });
  const [loading, setLoading] = useState(true);
  const [sampleAttendeeOverrides, setSampleAttendeeOverrides] = useState<Record<string, string[]>>({});
  const loggedViews = useRef(new Set<string>());

  const participant: HuddleParticipantContext | null = useMemo(() => {
    if (!participantUid || !participantRaw) return null;
    return participantFromRaw(participantUid, participantRaw);
  }, [participantUid, participantRaw]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [huddles, prefs] = await Promise.all([
        fetchActiveHuddles(),
        participantUid ? loadHuddlePreferences(participantUid) : Promise.resolve({
          hidden_huddle_ids: [],
          muted_classifications: [],
          reported_huddle_ids: [],
        }),
      ]);
      setAllHuddles(huddles);
      setPreferences(prefs);

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
    const active = allHuddles.filter(
      h => h.status !== "expired" && h.status !== "cancelled",
    );

    let base: MatchedHuddle[] = [];

    if (active.length === 0) {
      base = SAMPLE_LIVE_HUDDLES.slice(0, displayLimit).map(opp => {
        const matched = sampleLiveOpportunityToMatched(opp);
        const extra = sampleAttendeeOverrides[opp.id] ?? [];
        const names = [...new Set([...matched.on_my_way_names, ...extra])];
        return {
          ...matched,
          on_my_way_names: names,
          on_my_way_count: names.length,
          user_response: responses[opp.id] as MatchedHuddle["user_response"],
        };
      });
    } else if (participant) {
      const matched = matchHuddlesForParticipant(
        active,
        participant,
        responses,
        preferences,
        displayLimit,
      );
      if (matched.length > 0) {
        base = matched;
      } else {
        base = active
          .filter(h => h.host_participant_id === participant.uid)
          .map(h => ({
            ...h,
            match_score: 100,
            match_reasons: ["You are hosting"],
            user_response: responses[h.id] as MatchedHuddle["user_response"],
          }))
          .slice(0, displayLimit);
      }
    } else {
      base = active
        .filter(h => h.visibility === "public" || h.visibility === "matched")
        .map(h => ({
          ...h,
          match_score: 5,
          match_reasons: ["Open event invitation"],
          user_response: responses[h.id] as MatchedHuddle["user_response"],
        }))
        .slice(0, displayLimit);
    }

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
  }, [allHuddles, participant, responses, preferences, displayLimit, reservedIds, sessions, sampleAttendeeOverrides]);

  useEffect(() => {
    if (!participantUid) return;
    for (const h of matchedHuddles) {
      if (loggedViews.current.has(h.id)) continue;
      loggedViews.current.add(h.id);
      void logHuddleAnalytics({
        event_type: "match",
        huddle_id: h.id,
        classification: h.classification,
        participant_id: participantUid,
      });
      void logHuddleAnalytics({
        event_type: "view",
        huddle_id: h.id,
        classification: h.classification,
        participant_id: participantUid,
      });
    }
  }, [matchedHuddles, participantUid]);

  const liveOpportunities: LiveOpportunity[] = useMemo(
    () => matchedHuddles.map(huddleToLiveOpportunity),
    [matchedHuddles],
  );

  const create = useCallback(
    async (input: CreateHuddleInput) => {
      const created = await createHuddle(input);
      void logHuddleAnalytics({
        event_type: "create",
        huddle_id: created.id,
        classification: created.classification,
        participant_id: input.host_participant_id,
      });
      await refresh();
      return created;
    },
    [refresh],
  );

  const respondOnMyWay = useCallback(
    async (huddleId: string, displayName: string) => {
      const isSample = SAMPLE_LIVE_HUDDLES.some(s => s.id === huddleId);
      const prev = responses[huddleId];
      const next: HuddleResponseType = prev === "on_my_way" ? "interested" : "on_my_way";
      const firstName = displayName.split(/\s+/)[0] ?? displayName;

      if (isSample) {
        setResponses(r => ({ ...r, [huddleId]: next }));
        setSampleAttendeeOverrides(prevNames => {
          const current = prevNames[huddleId] ?? [];
          if (next === "on_my_way") {
            return { ...prevNames, [huddleId]: [...new Set([...current, firstName])] };
          }
          return { ...prevNames, [huddleId]: current.filter(n => n.toLowerCase() !== firstName.toLowerCase()) };
        });
        return;
      }

      if (!participantUid) return;
      await setHuddleResponse(huddleId, participantUid, displayName, next, prev);
      setResponses(r => ({ ...r, [huddleId]: next }));
      if (next === "on_my_way") {
        const h = matchedHuddles.find(x => x.id === huddleId);
        void logHuddleAnalytics({
          event_type: "on_my_way",
          huddle_id: huddleId,
          classification: h?.classification,
          participant_id: participantUid,
        });
      }
      await refresh();
    },
    [participantUid, responses, refresh, matchedHuddles],
  );

  const respondNotForMe = useCallback(
    async (huddleId: string, classification: MatchedHuddle["classification"]) => {
      if (!participantUid) return;
      await setHuddleResponse(huddleId, participantUid, "", "not_for_me", responses[huddleId]);
      const prefs = await notForMeHuddle(participantUid, huddleId, classification);
      setPreferences(prefs);
      setResponses(r => ({ ...r, [huddleId]: "not_for_me" }));
      void logHuddleAnalytics({
        event_type: "not_for_me",
        huddle_id: huddleId,
        classification,
        participant_id: participantUid,
      });
      await refresh();
    },
    [participantUid, responses, refresh],
  );

  const hideHuddleById = useCallback(
    async (huddleId: string) => {
      if (!participantUid) return;
      const prefs = await hideHuddle(participantUid, huddleId);
      setPreferences(prefs);
      void logHuddleAnalytics({
        event_type: "hide",
        huddle_id: huddleId,
        participant_id: participantUid,
      });
      await refresh();
    },
    [participantUid, refresh],
  );

  const reportHuddleById = useCallback(
    async (huddleId: string) => {
      if (!participantUid) return;
      const prefs = await reportHuddle(participantUid, huddleId);
      setPreferences(prefs);
      void logHuddleAnalytics({
        event_type: "report",
        huddle_id: huddleId,
        participant_id: participantUid,
      });
      await refresh();
    },
    [participantUid, refresh],
  );

  const cancel = useCallback(
    async (huddleId: string) => {
      if (!participantUid) return;
      await cancelHuddle(huddleId, participantUid);
      void logHuddleAnalytics({
        event_type: "cancel",
        huddle_id: huddleId,
        participant_id: participantUid,
      });
      await refresh();
    },
    [participantUid, refresh],
  );

  const updateHuddleById = useCallback(
    async (huddleId: string, updates: UpdateHuddleInput) => {
      if (!participantUid) return;
      await updateHuddle(huddleId, participantUid, updates);
      await refresh();
    },
    [participantUid, refresh],
  );

  const extendHuddle = useCallback(
    async (huddleId: string) => {
      if (!participantUid) return;
      await extendHuddleTime(huddleId, participantUid);
      void logHuddleAnalytics({
        event_type: "extend",
        huddle_id: huddleId,
        participant_id: participantUid,
      });
      await refresh();
    },
    [participantUid, refresh],
  );

  const duplicateHuddleById = useCallback(
    async (huddleId: string) => {
      if (!participantUid) return;
      const dup = await duplicateHuddle(huddleId, participantUid);
      if (dup) {
        void logHuddleAnalytics({
          event_type: "duplicate",
          huddle_id: dup.id,
          classification: dup.classification,
          participant_id: participantUid,
        });
      }
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
    preferences,
    refresh,
    createHuddle: create,
    respondOnMyWay,
    respondNotForMe,
    hideHuddleById,
    reportHuddleById,
    cancelHuddle: cancel,
    updateHuddleById,
    extendHuddle,
    duplicateHuddleById,
  };
}
