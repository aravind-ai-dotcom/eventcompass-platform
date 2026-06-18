"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import {
  resolveSpeakersForSession,
  type SessionSpeakerSource,
  type SpeakerParticipantContext,
} from "@/lib/speakerIntelligence";
import type { ScoredSpeaker, SpeakerProfile } from "@/types/speaker";

interface SpeakerIntelligenceContextValue {
  catalog: SpeakerProfile[];
  ctx: SpeakerParticipantContext;
  resolveSessionSpeakers: (session: SessionSpeakerSource) => ScoredSpeaker[];
  onViewSpeaker?: (speakerId: string) => void;
}

const SpeakerIntelligenceContext = createContext<SpeakerIntelligenceContextValue | null>(null);

interface SpeakerIntelligenceProviderProps {
  catalog: SpeakerProfile[];
  ctx: SpeakerParticipantContext;
  onViewSpeaker?: (speakerId: string) => void;
  children: ReactNode;
}

export function SpeakerIntelligenceProvider({
  catalog,
  ctx,
  onViewSpeaker,
  children,
}: SpeakerIntelligenceProviderProps) {
  const value = useMemo(
    (): SpeakerIntelligenceContextValue => ({
      catalog,
      ctx,
      resolveSessionSpeakers: session => resolveSpeakersForSession(session, catalog, ctx),
      onViewSpeaker,
    }),
    [catalog, ctx, onViewSpeaker],
  );

  return (
    <SpeakerIntelligenceContext.Provider value={value}>
      {children}
    </SpeakerIntelligenceContext.Provider>
  );
}

export function useSpeakerIntelligence(): SpeakerIntelligenceContextValue | null {
  return useContext(SpeakerIntelligenceContext);
}
