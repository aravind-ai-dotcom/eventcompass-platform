"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { collection, doc, getDoc, getDocs, setDoc } from "firebase/firestore";
import { tryGetDb } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useHuddles } from "@/hooks/useHuddles";
import {
  gatherCertificationGoalIds,
  getCertificationJourneyTitle,
  isCertificationActivityType,
  resolveSelectedCertificationGoals,
  shouldShowCertificationJourney,
} from "@/lib/certificationProfile";
import { mergeSavedSessionIds, addSessionToBothLists } from "@/lib/participantAgenda";
import { enrichLinkedInForPerson } from "@/lib/demoLinkedInEnrichment";
import { resolveSessionWhyLine } from "@/lib/sessionRecommendationLine";
import {
  buildBalancedMoveSet,
  type BalancedRecommendationInput,
} from "@/lib/recommendationBalancing";
import { getCachedPillarWeights, loadRecommendationBalanceConfig } from "@/services/recommendationBalanceConfig";
import { determineNextBestMove } from "@/services/nextBestMoveEngine";
import {
  buildSpeakerCatalog,
  championFromRaw,
  rankRecommendedExperts,
  sessionFromScored,
  speakerToRecommendedPerson,
  type SpeakerParticipantContext,
} from "@/lib/speakerIntelligence";
import {
  EXPERIENCE_EVENT_BASE,
  extractSessionSpeakerNames,
  experienceSessionMeta,
  experienceSessionTypeLabel,
  partitionExperienceSessions,
  scoreExperienceChampion,
  scoreExperienceSession,
  type ExperienceScoredChampion,
  type ExperienceScoredSession,
} from "@/lib/experienceScoring";
import type { RecommendedPerson } from "@/components/people/RecommendedConnectionCard";
import type { PillarWeights } from "@/types/recommendationBalance";
import type { NextBestMove } from "@/types";

type RawDoc = Record<string, unknown>;

function toRecommendedPerson(
  champion: ExperienceScoredChampion,
  speakerNames: Set<string>,
): RecommendedPerson {
  const base = {
    id: champion.id,
    display_name: champion.display_name,
    title: champion.title,
    organization: champion.organization,
    company: champion.company,
    profile: champion.profile,
    attendance: champion.attendance,
    compass_reasons: champion.compass_reasons,
    compass_score: champion.compass_score,
    is_speaker: speakerNames.has(champion.display_name.toLowerCase()),
    linkedin_url: champion.linkedin_url,
    consent: champion.consent,
  };
  const linkedIn = enrichLinkedInForPerson(base);
  return {
    ...base,
    linkedin_url: linkedIn.linkedinVisibility === "visible" ? linkedIn.linkedin_url : base.linkedin_url,
    consent: linkedIn.consent ?? base.consent,
  };
}

export function useExperiencePageData() {
  const [participant, setParticipant] = useState<RawDoc | null>(null);
  const [learningList, setLearningList] = useState<ExperienceScoredSession[]>([]);
  const [communityList, setCommunityList] = useState<ExperienceScoredSession[]>([]);
  const [funList, setFunList] = useState<ExperienceScoredSession[]>([]);
  const [allSessions, setAllSessions] = useState<ExperienceScoredSession[]>([]);
  const [champions, setChampions] = useState<ExperienceScoredChampion[]>([]);
  const [allChampions, setAllChampions] = useState<ExperienceScoredChampion[]>([]);
  const [savedSessions, setSavedSessions] = useState<string[]>([]);
  const [savedSchedule, setSavedSchedule] = useState<string[]>([]);
  const [reservedSeats, setReservedSeats] = useState<string[]>([]);
  const [certificationGoals, setCertificationGoals] = useState<string[]>([]);
  const [hiddenSessions, setHiddenSessions] = useState<string[]>([]);
  const [hiddenPeople, setHiddenPeople] = useState<string[]>([]);
  const [championSources, setChampionSources] = useState<ReturnType<typeof championFromRaw>[]>([]);
  const [sessionSpeakerNames, setSessionSpeakerNames] = useState<Set<string>>(() => new Set());
  const [pillarWeights, setPillarWeights] = useState<PillarWeights>(() => getCachedPillarWeights());
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  const { user, loading: authLoading, enrolled } = useAuth();
  const participantId = user?.uid ?? "";

  const persistPrefs = useCallback(async (updates: Record<string, unknown>) => {
    if (!participantId) return;
    const db = tryGetDb();
    if (!db) return;
    try {
      await setDoc(doc(db, EXPERIENCE_EVENT_BASE + "/participants/" + participantId), updates, { merge: true });
    } catch (e) {
      console.error("[ExperiencePage] persist:", e);
    }
  }, [participantId]);

  useEffect(() => {
    async function load() {
      const db = tryGetDb();
      if (!db) {
        setErrorMsg("Firebase is not configured. Add NEXT_PUBLIC_FIREBASE_* to .env.local.");
        setStatus("error");
        return;
      }
      try {
        const [pSnap, sessSnap, champSnap] = await Promise.all([
          getDoc(doc(db, EXPERIENCE_EVENT_BASE + "/participants/" + participantId)),
          getDocs(collection(db, EXPERIENCE_EVENT_BASE + "/sessions")),
          getDocs(collection(db, EXPERIENCE_EVENT_BASE + "/champions")),
        ]);

        if (!pSnap.exists()) {
          setErrorMsg(`Participant not found. Sign in or complete enrollment.`);
          setStatus("error");
          return;
        }

        const pData = pSnap.data() as RawDoc;
        const rawSessions = sessSnap.docs.map(d => ({ id: d.id, ...d.data() } as RawDoc));
        const rawChampions = champSnap.docs.map(d => ({ id: d.id, ...d.data() } as RawDoc));
        const speakerNames = extractSessionSpeakerNames(rawSessions);

        const scored = rawSessions
          .map(s => scoreExperienceSession(pData, s))
          .sort((a, b) => b.compass_score - a.compass_score);

        const { learning, community, fun } = partitionExperienceSessions(scored);
        const allScoredChampions = rawChampions
          .map(c => scoreExperienceChampion(pData, c))
          .sort((a, b) => b.compass_score - a.compass_score);

        setSessionSpeakerNames(speakerNames);
        setParticipant(pData);
        setAllSessions(scored);
        setLearningList(learning);
        setCommunityList(community);
        setFunList(fun);
        setChampions(allScoredChampions.slice(0, 12));
        setAllChampions(allScoredChampions);
        setChampionSources(rawChampions.map(c => championFromRaw(c)));
        setSavedSessions((pData.saved_sessions as string[]) ?? []);
        setSavedSchedule((pData.saved_schedule as string[]) ?? []);
        setReservedSeats((pData.reserved_seats as string[]) ?? []);
        setCertificationGoals((pData.certification_goals as string[]) ?? []);
        setHiddenSessions((pData.hidden_sessions as string[]) ?? []);
        setHiddenPeople((pData.hidden_people as string[]) ?? []);
        setStatus("ready");
        void loadRecommendationBalanceConfig().then(setPillarWeights);
      } catch (err: unknown) {
        const e = err as { message?: string };
        setErrorMsg(e.message ?? String(err));
        setStatus("error");
      }
    }
    if (!authLoading && participantId) load();
    else if (!authLoading && !participantId) {
      setStatus("error");
      setErrorMsg("Sign in to view your personalized Compass experience.");
    }
  }, [authLoading, participantId]);

  const mergedSavedSessionIds = useMemo(
    () => mergeSavedSessionIds(savedSessions, savedSchedule),
    [savedSessions, savedSchedule],
  );

  const huddleSessionInputs = useMemo(
    () => allSessions.map(s => ({
      id: s.id,
      title: s.title,
      start_time: s.start_time ?? s.schedule?.start_time,
      end_time: s.schedule?.end_time,
      schedule: s.schedule,
    })),
    [allSessions],
  );

  const huddlesController = useHuddles({
    participantUid: participantId || undefined,
    participantRaw: participant,
    savedSessionIds: mergedSavedSessionIds,
    reservedSessionIds: reservedSeats,
    sessions: huddleSessionInputs,
    displayLimit: 6,
  });

  const certGoalIds = useMemo(
    () => participant
      ? gatherCertificationGoalIds(
          { ...participant, certification_goals: certificationGoals, saved_sessions: savedSessions, saved_schedule: savedSchedule },
          allSessions,
        )
      : [],
    [participant, certificationGoals, savedSessions, savedSchedule, allSessions],
  );

  const certLabel = participant ? getCertificationJourneyTitle(participant, resolveSelectedCertificationGoals(allSessions, certGoalIds)) : null;
  const showCertJourney = participant ? shouldShowCertificationJourney(participant, certGoalIds) : false;

  const balancedInput = useMemo((): BalancedRecommendationInput => ({
    learningSessions: learningList,
    communitySessions: communityList,
    funSessions: funList,
    champions: champions.filter(c => !hiddenPeople.includes(c.id)),
    liveHuddles: huddlesController.liveOpportunities,
    hiddenSessionIds: hiddenSessions,
    hiddenPeopleIds: hiddenPeople,
    rotationSeed: new Date().getDay(),
    hasCertIntent: showCertJourney,
    pillarWeights,
    sessionMeta: s => experienceSessionMeta(s as ExperienceScoredSession),
    sessionType: s => experienceSessionTypeLabel(s as ExperienceScoredSession),
    sessionReason: s => resolveSessionWhyLine(s as ExperienceScoredSession, certLabel),
  }), [learningList, communityList, funList, champions, hiddenPeople, hiddenSessions, huddlesController.liveOpportunities, showCertJourney, certLabel, pillarWeights]);

  const nextBestMove = useMemo(
    () => determineNextBestMove({
      user,
      enrolled,
      participant,
      balancedInput,
      savedSessionIds: mergedSavedSessionIds,
      allSessions,
      certificationGoalIds: certGoalIds,
      hasCertIntent: showCertJourney,
      savedConnectionCount: 0,
    }),
    [user, enrolled, participant, balancedInput, mergedSavedSessionIds, allSessions, certGoalIds, showCertJourney],
  );

  const nbmSession = useMemo(() => {
    if (nextBestMove?.type !== "session" || !nextBestMove.entityId) return null;
    return allSessions.find(s => s.id === nextBestMove.entityId) ?? null;
  }, [nextBestMove, allSessions]);

  const speakerCatalog = useMemo(
    () => buildSpeakerCatalog(championSources, allSessions.map(sessionFromScored)),
    [championSources, allSessions],
  );

  const sig = (participant?.event_signal_profile as RawDoc) ?? {};
  const pTracks = ((sig.tech_tracks as string[]) ?? []).slice(0, 8);
  const pGoals = ((sig.goals as string[]) ?? []).slice(0, 8);
  const pProducts = ((sig.products as string[]) ?? []).slice(0, 8);

  const speakerCtx = useMemo((): SpeakerParticipantContext => ({
    tracks: pTracks,
    goals: pGoals,
    hasCertIntent: showCertJourney,
  }), [pTracks, pGoals, showCertJourney]);

  const recommendedPeople = useMemo(
    () => champions
      .filter(c => !hiddenPeople.includes(c.id) && c.compass_score > 0)
      .map(c => toRecommendedPerson(c, sessionSpeakerNames)),
    [champions, hiddenPeople, sessionSpeakerNames],
  );

  const rankedExperts = useMemo(
    () => rankRecommendedExperts(speakerCatalog, speakerCtx, 8),
    [speakerCatalog, speakerCtx],
  );

  const focusPeople = useMemo(() => {
    const expertPeople = rankedExperts.map(speakerToRecommendedPerson);
    const byId = new Map<string, RecommendedPerson>();
    for (const p of [...recommendedPeople, ...expertPeople]) {
      if (!byId.has(p.id)) byId.set(p.id, p);
    }
    return [...byId.values()].slice(0, 8);
  }, [recommendedPeople, rankedExperts]);

  const focusLearningPlan = useMemo(() => {
    const core = learningList
      .filter(s => !isCertificationActivityType(s) && !hiddenSessions.includes(s.id))
      .slice(0, 4);
    const cert = learningList
      .filter(s => isCertificationActivityType(s) && !hiddenSessions.includes(s.id))
      .slice(0, 3);
    const perspective = communityList
      .filter(s => !hiddenSessions.includes(s.id))
      .slice(0, 3);
    return { core, cert, perspective };
  }, [learningList, communityList, hiddenSessions]);

  const balancedMoveSet = useMemo(
    () => buildBalancedMoveSet(balancedInput),
    [balancedInput],
  );

  const rankedSessionsForVoice = useMemo(
    () => [...learningList, ...communityList, ...funList]
      .sort((a, b) => b.compass_score - a.compass_score),
    [learningList, communityList, funList],
  );

  const topChampion = champions.find(c => !hiddenPeople.includes(c.id) && c.compass_score > 0) ?? null;
  const topSpeaker = rankedExperts[0] ?? null;

  const handleSaveSession = useCallback((id: string) => {
    const { saved_sessions, saved_schedule } = addSessionToBothLists(savedSessions, savedSchedule, id);
    setSavedSessions(saved_sessions);
    setSavedSchedule(saved_schedule);
    void persistPrefs({ saved_sessions, saved_schedule });
  }, [savedSessions, savedSchedule, persistPrefs]);

  const handleHideSession = useCallback((id: string) => {
    const next = hiddenSessions.includes(id) ? hiddenSessions : [...hiddenSessions, id];
    setHiddenSessions(next);
    void persistPrefs({ hidden_sessions: next });
  }, [hiddenSessions, persistPrefs]);

  const handleSavePerson = useCallback((id: string) => {
    const next = hiddenPeople.filter(x => x !== id);
    setHiddenPeople(next);
    void persistPrefs({ hidden_people: next });
  }, [hiddenPeople, persistPrefs]);

  const handleHidePerson = useCallback((id: string) => {
    const next = hiddenPeople.includes(id) ? hiddenPeople : [...hiddenPeople, id];
    setHiddenPeople(next);
    void persistPrefs({ hidden_people: next });
  }, [hiddenPeople, persistPrefs]);

  const viewerUniversities = useMemo(
    () => ((participant?.education as Array<{ institution?: string }> | undefined) ?? [])
      .map(e => e.institution?.trim().toLowerCase())
      .filter((u): u is string => !!u),
    [participant],
  );

  const savedChampionRefs = useMemo(
    () => allChampions.slice(0, 5).map(c => ({ id: c.id, display_name: c.display_name })),
    [allChampions],
  );

  const peopleBadgeContext = useMemo(
    () => ({ viewerUniversities, isChampion: true as const }),
    [viewerUniversities],
  );

  const peopleActions = useMemo(
    () => ({
      savedPeople: [] as string[],
      hiddenPeople,
      onSave: handleSavePerson,
      onHide: handleHidePerson,
    }),
    [hiddenPeople, handleSavePerson, handleHidePerson],
  );

  const displayName = String(
    participant?.display_name ?? participant?.displayName ??
    [participant?.first_name, participant?.last_name].filter(Boolean).join(" ") ?? "Attendee",
  );

  const handleDetailsPerson = useCallback((id: string) => {
    const found = allChampions.find(c => c.id === id);
    return found ?? null;
  }, [allChampions]);

  return {
    status,
    errorMsg,
    participantId,
    participant,
    enrolled,
    displayName,
    pTracks,
    pGoals,
    pProducts,
    nextBestMove: nextBestMove as NextBestMove | null,
    nbmSession,
    certLabel,
    focusLearningPlan,
    focusPeople,
    learningList,
    communityList,
    funList,
    hiddenSessions,
    mergedSavedSessionIds,
    balancedMoveSet,
    rankedSessionsForVoice,
    champions,
    topChampion,
    topSpeaker,
    rankedExperts,
    recommendedPeople,
    huddlesController,
    speakerCatalog,
    speakerCtx,
    userDisplayName: displayName,
    userFirstName: String(participant?.first_name ?? displayName.split(/\s+/)[0] ?? "You"),
    hostJobTitle: String(participant?.job_title ?? ""),
    hostOrganization: String(participant?.organization ?? participant?.company ?? ""),
    handleDetailsPerson,
    handleSaveSession,
    handleHideSession,
    handleSavePerson,
    handleHidePerson,
    peopleBadgeContext,
    peopleActions,
    savedChampionRefs,
    profileSignals: [...pTracks, ...pGoals],
    certificationJourneyPlan: null,
  };
}

export type ExperiencePageData = ReturnType<typeof useExperiencePageData>;
