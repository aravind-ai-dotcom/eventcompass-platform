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
  hasCertificationIntent,
} from "@/lib/certificationProfile";
import { enrichSessionPlanningFields } from "@/lib/sessionPlanning";
import { buildFocusSessionPlan } from "@/lib/sessionFocusPlan";
import { mergeSavedSessionIds, addSessionToBothLists } from "@/lib/participantAgenda";
import { recommendIbmCommunities, type ScoredIbmCommunity } from "@/lib/ibmCommunityMatching";
import { loadIbmCommunityCatalog, type IbmCommunityCatalogSource } from "@/services/ibmCommunityService";
import {
  enrollInCertification,
  loadCertificationCatalog,
  loadCertificationEnrollments,
  removeCertificationEnrollment,
  type CertificationCatalogSource,
} from "@/services/certificationService";
import type { CertificationEnrollment, TxCertification } from "@/data/certifications";
import { MAX_CERTIFICATION_ENROLLMENTS } from "@/data/certifications";
import {
  applyEnrollmentCommunityReasons,
  boostChampionsForEnrollments,
  boostSessionsForEnrollments,
  buildEnrolledCertificationViews,
  type EnrolledCertificationView,
} from "@/lib/certificationMatching";
import type { IbmCommunity } from "@/data/ibmCommunities";
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
  const [baseAllSessions, setBaseAllSessions] = useState<ExperienceScoredSession[]>([]);
  const [baseAllChampions, setBaseAllChampions] = useState<ExperienceScoredChampion[]>([]);
  const [savedSessions, setSavedSessions] = useState<string[]>([]);
  const [savedSchedule, setSavedSchedule] = useState<string[]>([]);
  const [reservedSeats, setReservedSeats] = useState<string[]>([]);
  const [certificationGoals, setCertificationGoals] = useState<string[]>([]);
  const [hiddenSessions, setHiddenSessions] = useState<string[]>([]);
  const [hiddenPeople, setHiddenPeople] = useState<string[]>([]);
  const [championSources, setChampionSources] = useState<ReturnType<typeof championFromRaw>[]>([]);
  const [sessionSpeakerNames, setSessionSpeakerNames] = useState<Set<string>>(() => new Set());
  const [pillarWeights, setPillarWeights] = useState<PillarWeights>(() => getCachedPillarWeights());
  const [ibmCommunityCatalog, setIbmCommunityCatalog] = useState<IbmCommunity[]>([]);
  const [ibmCommunityCatalogSource, setIbmCommunityCatalogSource] = useState<IbmCommunityCatalogSource>("seed");
  const [certificationCatalog, setCertificationCatalog] = useState<TxCertification[]>([]);
  const [certificationCatalogSource, setCertificationCatalogSource] = useState<CertificationCatalogSource>("seed");
  const [certificationEnrollments, setCertificationEnrollments] = useState<CertificationEnrollment[]>([]);
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
        const [pSnap, sessSnap, champSnap, communityCatalog, certCatalog, certEnrollments] = await Promise.all([
          getDoc(doc(db, EXPERIENCE_EVENT_BASE + "/participants/" + participantId)),
          getDocs(collection(db, EXPERIENCE_EVENT_BASE + "/sessions")),
          getDocs(collection(db, EXPERIENCE_EVENT_BASE + "/champions")),
          loadIbmCommunityCatalog(),
          loadCertificationCatalog(),
          loadCertificationEnrollments(participantId),
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

        const certIntent = hasCertificationIntent(pData);

        const scored = rawSessions
          .map(s => {
            const base = scoreExperienceSession(pData, s);
            return enrichSessionPlanningFields(s, base, certIntent);
          })
          .sort((a, b) => b.compass_score - a.compass_score);

        const allScoredChampions = rawChampions
          .map(c => scoreExperienceChampion(pData, c))
          .sort((a, b) => b.compass_score - a.compass_score);

        setSessionSpeakerNames(speakerNames);
        setParticipant(pData);
        setBaseAllSessions(scored);
        setBaseAllChampions(allScoredChampions);
        setChampionSources(rawChampions.map(c => championFromRaw(c)));
        setIbmCommunityCatalog(communityCatalog.communities);
        setIbmCommunityCatalogSource(communityCatalog.source);
        setCertificationCatalog(certCatalog.certifications);
        setCertificationCatalogSource(certCatalog.source);
        setCertificationEnrollments(certEnrollments);
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

  const enrolledCertifications = useMemo((): TxCertification[] => {
    const byId = new Map(certificationCatalog.map(c => [c.certification_id, c]));
    return certificationEnrollments
      .map(e => byId.get(e.certification_id))
      .filter((c): c is TxCertification => !!c);
  }, [certificationCatalog, certificationEnrollments]);

  const allSessions = useMemo(
    () => boostSessionsForEnrollments(baseAllSessions, enrolledCertifications),
    [baseAllSessions, enrolledCertifications],
  );

  const allChampions = useMemo(
    () => boostChampionsForEnrollments(baseAllChampions, enrolledCertifications),
    [baseAllChampions, enrolledCertifications],
  );

  const { learningList, communityList, funList } = useMemo(() => {
    const partitioned = partitionExperienceSessions(allSessions);
    return {
      learningList: partitioned.learning,
      communityList: partitioned.community,
      funList: partitioned.fun,
    };
  }, [allSessions]);

  const boostedChampionsTop = useMemo(
    () => [...allChampions].sort((a, b) => b.compass_score - a.compass_score).slice(0, 12),
    [allChampions],
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
    champions: boostedChampionsTop.filter(c => !hiddenPeople.includes(c.id)),
    liveHuddles: huddlesController.liveOpportunities,
    hiddenSessionIds: hiddenSessions,
    hiddenPeopleIds: hiddenPeople,
    rotationSeed: new Date().getDay(),
    hasCertIntent: showCertJourney,
    pillarWeights,
    sessionMeta: s => experienceSessionMeta(s as ExperienceScoredSession),
    sessionType: s => experienceSessionTypeLabel(s as ExperienceScoredSession),
    sessionReason: s => resolveSessionWhyLine(s as ExperienceScoredSession, certLabel),
  }), [learningList, communityList, funList, boostedChampionsTop, hiddenPeople, hiddenSessions, huddlesController.liveOpportunities, showCertJourney, certLabel, pillarWeights]);

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
  const intel = (participant?.compass_intelligence as RawDoc) ?? {};
  const pTracks = ((sig.tech_tracks as string[]) ?? []).slice(0, 8);
  const pGoals = ((sig.goals as string[]) ?? []).slice(0, 8);
  const pProducts = ((sig.products as string[]) ?? []).slice(0, 8);
  const pRoles = ((sig.roles_at_txc as string[]) ?? []).slice(0, 6);
  const pIntentKeywords = ((intel.matching_keywords as string[]) ?? []).slice(0, 12);

  const recommendedIbmCommunities = useMemo((): ScoredIbmCommunity[] => {
    if (ibmCommunityCatalog.length === 0) return [];
    const base = recommendIbmCommunities({
      tracks: pTracks,
      goals: pGoals,
      products: pProducts,
      roles: pRoles,
      intentKeywords: pIntentKeywords,
      catalog: ibmCommunityCatalog,
      limit: 5,
    });
    return applyEnrollmentCommunityReasons(base, enrolledCertifications);
  }, [ibmCommunityCatalog, pTracks, pGoals, pProducts, pRoles, pIntentKeywords, enrolledCertifications]);

  const speakerCtx = useMemo((): SpeakerParticipantContext => ({
    tracks: pTracks,
    goals: pGoals,
    hasCertIntent: showCertJourney,
  }), [pTracks, pGoals, showCertJourney]);

  const recommendedPeople = useMemo(
    () => boostedChampionsTop
      .filter(c => !hiddenPeople.includes(c.id) && c.compass_score > 0)
      .map(c => toRecommendedPerson(c, sessionSpeakerNames)),
    [boostedChampionsTop, hiddenPeople, sessionSpeakerNames],
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

  const hasCertEnrollments = enrolledCertifications.length > 0;
  const focusCertIntent = showCertJourney || hasCertEnrollments;

  const focusSessionPlan = useMemo(
    () => buildFocusSessionPlan(
      learningList,
      communityList,
      funList,
      hiddenSessions,
      focusCertIntent,
    ),
    [learningList, communityList, funList, hiddenSessions, focusCertIntent],
  );

  const focusLearningPlan = useMemo(() => {
    const core = focusSessionPlan.printLearning.filter(
      s => !isCertificationActivityType(s) && s.planning_class !== "certification",
    ).slice(0, 5);
    const cert = focusSessionPlan.byDay.Monday.certification
      .concat(focusSessionPlan.byDay.Tuesday.certification)
      .concat(focusSessionPlan.byDay.Wednesday.certification)
      .concat(focusSessionPlan.byDay.Thursday.certification);
    const uniqueCert = [...new Map(cert.map(s => [s.id, s])).values()].slice(0, 3);
    const perspective = focusSessionPlan.exploreAnytime.slice(0, 3);
    return { core, cert: uniqueCert, perspective };
  }, [focusSessionPlan]);

  const balancedMoveSet = useMemo(
    () => buildBalancedMoveSet(balancedInput),
    [balancedInput],
  );

  const rankedSessionsForVoice = useMemo(
    () => [...learningList, ...communityList, ...funList]
      .sort((a, b) => b.compass_score - a.compass_score),
    [learningList, communityList, funList],
  );

  const enrolledCertificationViews = useMemo((): EnrolledCertificationView[] => {
    return buildEnrolledCertificationViews(
      certificationEnrollments,
      certificationCatalog,
      allSessions,
      recommendedPeople,
      recommendedIbmCommunities,
    );
  }, [
    certificationEnrollments,
    certificationCatalog,
    allSessions,
    recommendedPeople,
    recommendedIbmCommunities,
  ]);

  const handleEnrollCertification = useCallback(async (certificationId: string) => {
    if (certificationEnrollments.length >= MAX_CERTIFICATION_ENROLLMENTS) return;
    if (certificationEnrollments.some(e => e.certification_id === certificationId)) return;

    const enrollment: CertificationEnrollment = {
      certification_id: certificationId,
      status: "planned",
      added_at: new Date().toISOString(),
    };
    setCertificationEnrollments(prev => [...prev, enrollment]);
    await enrollInCertification(participantId, certificationId);
  }, [certificationEnrollments, participantId]);

  const handleRemoveCertification = useCallback(async (certificationId: string) => {
    setCertificationEnrollments(prev => prev.filter(e => e.certification_id !== certificationId));
    await removeCertificationEnrollment(participantId, certificationId);
  }, [participantId]);
  const topChampion = boostedChampionsTop.find(c => !hiddenPeople.includes(c.id) && c.compass_score > 0) ?? null;
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
    pRoles,
    ibmCommunityCatalog,
    ibmCommunityCatalogSource,
    recommendedIbmCommunities,
    nextBestMove: nextBestMove as NextBestMove | null,
    nbmSession,
    certLabel,
    focusLearningPlan,
    focusSessionPlan,
    focusPeople,
    learningList,
    communityList,
    funList,
    hiddenSessions,
    mergedSavedSessionIds,
    balancedMoveSet,
    rankedSessionsForVoice,
    champions: boostedChampionsTop,
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
    profileSignals: [...pTracks, ...pGoals, ...pIntentKeywords],
    certificationJourneyPlan: null,
    certificationCatalog,
    certificationCatalogSource,
    certificationEnrollments,
    enrolledCertificationViews,
    handleEnrollCertification,
    handleRemoveCertification,
  };
}

export type ExperiencePageData = ReturnType<typeof useExperiencePageData>;
