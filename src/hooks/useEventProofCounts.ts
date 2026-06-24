"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { eventBasePath, TXC_EVENT_ID } from "@/lib/compassEventPaths";
import { IBM_COMMUNITY_METRICS } from "@/data/ibmCommunities";
import { aggregateIdentitySignals } from "@/lib/identitySignals";
import { tryGetDb } from "@/lib/firebase";

export interface EventProofCounts {
  sessions: number;
  champions: number;
  communities: number;
  attendees: number;
  /** Raw counts among alumni question answerers — for donut segments. */
  alumniReturning: number | null;
  alumniFirstTime: number | null;
  loading: boolean;
  isLive: boolean;
}

const FALLBACK = {
  sessions: 1400,
  champions: 600,
  communities: 200,
  attendees: 10000,
  alumniReturning: 540,
  alumniFirstTime: 612,
} as const;

function parseMetricPlus(value: string): number {
  const digits = value.replace(/[^0-9]/g, "");
  return digits ? Number(digits) : 0;
}

export function formatProofCount(value: number, usePlus: boolean): string {
  const formatted = value.toLocaleString();
  return usePlus ? `${formatted}+` : formatted;
}

export function useEventProofCounts(eventId = TXC_EVENT_ID): EventProofCounts {
  const [counts, setCounts] = useState<EventProofCounts>({
    sessions: 0,
    champions: 0,
    communities: 0,
    attendees: 0,
    alumniReturning: null,
    alumniFirstTime: null,
    loading: true,
    isLive: false,
  });

  useEffect(() => {
    const db = tryGetDb();
    if (!db) {
      setCounts({
        sessions: FALLBACK.sessions,
        champions: FALLBACK.champions,
        communities: parseMetricPlus(IBM_COMMUNITY_METRICS.topicGroups) || FALLBACK.communities,
        attendees: FALLBACK.attendees,
        alumniReturning: FALLBACK.alumniReturning,
        alumniFirstTime: FALLBACK.alumniFirstTime,
        loading: false,
        isLive: false,
      });
      return;
    }

    const base = eventBasePath(eventId);
    void Promise.all([
      getDocs(collection(db, `${base}/sessions`)),
      getDocs(collection(db, `${base}/champions`)),
      getDocs(collection(db, `${base}/participants`)),
      getDocs(collection(db, `${base}/communities`)),
    ])
      .then(([sessionsSnap, championsSnap, participantsSnap, communitiesSnap]) => {
        const participantDocs = participantsSnap.docs.map(d => d.data() as Record<string, unknown>);
        const identity = aggregateIdentitySignals(participantDocs);
        const returning = identity.alumni.returning;
        const firstTime = identity.alumni.firstTime;
        const hasAlumniMix = returning > 0 && firstTime > 0;

        setCounts({
          sessions: sessionsSnap.size || FALLBACK.sessions,
          champions: championsSnap.size || FALLBACK.champions,
          communities: communitiesSnap.size || parseMetricPlus(IBM_COMMUNITY_METRICS.topicGroups) || FALLBACK.communities,
          attendees: participantsSnap.size || FALLBACK.attendees,
          alumniReturning: hasAlumniMix ? returning : null,
          alumniFirstTime: hasAlumniMix ? firstTime : null,
          loading: false,
          isLive: true,
        });
      })
      .catch(() => {
        setCounts({
          sessions: FALLBACK.sessions,
          champions: FALLBACK.champions,
          communities: parseMetricPlus(IBM_COMMUNITY_METRICS.topicGroups) || FALLBACK.communities,
          attendees: FALLBACK.attendees,
          alumniReturning: FALLBACK.alumniReturning,
          alumniFirstTime: FALLBACK.alumniFirstTime,
          loading: false,
          isLive: false,
        });
      });
  }, [eventId]);

  return counts;
}

export function proofCountLabel(value: number, fallback: number, isLive: boolean): string {
  if (isLive && value > 0 && value !== fallback) {
    return value.toLocaleString();
  }
  const display = value > 0 ? value : fallback;
  return formatProofCount(display, true);
}
