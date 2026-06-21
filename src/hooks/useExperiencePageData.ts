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
  isCertificationJourneyActive,
} from "@/lib/certificationProfile";
import {
  buildCertificationJourneyPlan,
  resolveActiveCertification,
} from "@/lib/certificationJourneyIntelligence";
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
import { recommendedShowsMutualInterest, SAMPLE_INBOUND_SIGNALS } from "@/lib/sampleConnectionSignals";
import type { PillarWeights } from "@/types/recommendationBalance";
import type { NextBestMove, ScoredChampion, ScoredSession } from "@/types";

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
  const [savedPeople, setSavedPeople] = useState<string[]>([]);
  const [championSources, setChampionSources] = useState<ReturnType<typeof championFromRaw>[]>([]);
  const [sessionSpeakerNames, setSessionSpeakerNames] = useState<Set<string>>(() => new Set());
  const [pillarWeights, setPillarWeights] = useState<PillarWeights>(() => getCachedPillarWeights());
  const [ibmCommunityCatalog, setIbmCommunityCatalog] = useState<IbmCommunity[]>([]);
  const [ibmCommunityCatalogSource, setIbmCommunityCatalogSource] = useState<IbmCommunityCatalogSource>("seed");
  const [certificationCatalog, setCertificationCatalog] = useState<TxCertification[]>([]);
  const [certificationCatalogSource, setCertificationCatalogSource] = useState<CertificationCatalogSource>("seed");
  const [certificationEnrollments, setCertificationEnrollments] = useState<CertificationEnrollment[]>([]);
  const [certificationError, setCertificationError] = useState<string | null>(null);
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

        const certIntent = isCertificationJourneyActive(pData, {
          enrollmentCount: certEnrollments.length,
          selectedCertificationCount: ((pData.certification_goals as string[]) ?? []).length,
        });

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
        setSavedPeople((pData.saved_people as string[]) ?? []);
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

  const certLabel = useMemo(() => {
    if (!participant) return null;
    const goalsFromEnrollments = enrolledCertifications.map(c => ({
      id: c.certification_id,
      title: c.title,
      certification_code: c.exam_code,
      track: c.txc_tracks[0],
      topics: c.skill_tags,
      products: c.related_products,
    }));
    return getCertificationJourneyTitle(participant, goalsFromEnrollments);
  }, [participant, enrolledCertifications]);

  const focusCertIntent = useMemo(
    () => isCertificationJourneyActive(participant, {
      enrollmentCount: certificationEnrollments.length,
      selectedCertificationCount: certificationGoals.length,
    }),
    [participant, certificationEnrollments.length, certificationGoals.length],
  );

  const balancedInput = useMemo((): BalancedRecommendationInput => ({
    learningSessions: learningList,
    communitySessions: communityList,
    funSessions: funList,
    champions: boostedChampionsTop.filter(c => !hiddenPeople.includes(c.id)),
    liveHuddles: huddlesController.liveOpportunities,
    hiddenSessionIds: hiddenSessions,
    hiddenPeopleIds: hiddenPeople,
    rotationSeed: new Date().getDay(),
    hasCertIntent: focusCertIntent,
    pillarWeights,
    sessionMeta: s => experienceSessionMeta(s as ExperienceScoredSession),
    sessionType: s => experienceSessionTypeLabel(s as ExperienceScoredSession),
    sessionReason: s => resolveSessionWhyLine(s as ExperienceScoredSession, certLabel),
  }), [learningList, communityList, funList, boostedChampionsTop, hiddenPeople, hiddenSessions, huddlesController.liveOpportunities, focusCertIntent, certLabel, pillarWeights]);

  const nextBestMove = useMemo(
    () => determineNextBestMove({
      user,
      enrolled,
      participant,
      balancedInput,
      savedSessionIds: mergedSavedSessionIds,
      allSessions,
      certificationGoalIds: certGoalIds,
      hasCertIntent: focusCertIntent,
      savedConnectionCount: 0,
    }),
    [user, enrolled, participant, balancedInput, mergedSavedSessionIds, allSessions, certGoalIds, focusCertIntent],
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
    if (!focusCertIntent) return base;
    return applyEnrollmentCommunityReasons(base, enrolledCertifications);
  }, [ibmCommunityCatalog, pTracks, pGoals, pProducts, pRoles, pIntentKeywords, enrolledCertifications, focusCertIntent]);

  const speakerCtx = useMemo((): SpeakerParticipantContext => ({
    tracks: pTracks,
    goals: pGoals,
    hasCertIntent: focusCertIntent,
  }), [pTracks, pGoals, focusCertIntent]);

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
    return [...byId.values()]
      .sort((a, b) => (b.compass_score ?? 0) - (a.compass_score ?? 0))
      .slice(0, 8);
  }, [recommendedPeople, rankedExperts]);

  const peopleYouWantToMeet = useMemo(() => {
    const byId = new Map<string, RecommendedPerson>();

    for (const id of savedPeople) {
      const champ = allChampions.find(c => c.id === id);
      if (champ && !hiddenPeople.includes(id)) {
        byId.set(id, toRecommendedPerson(champ, sessionSpeakerNames));
      }
    }

    for (const person of focusPeople) {
      if (byId.size >= 5) break;
      if (byId.has(person.id)) continue;
      if (savedPeople.includes(person.id)) continue;
      if (recommendedShowsMutualInterest(person.id, person.display_name, SAMPLE_INBOUND_SIGNALS)) {
        byId.set(person.id, person);
      }
    }

    for (const person of focusPeople) {
      if (byId.size >= 5) break;
      if (byId.has(person.id)) continue;
      if (savedPeople.includes(person.id)) continue;
      byId.set(person.id, person);
    }

    return [...byId.values()].slice(0, 5);
  }, [savedPeople, allChampions, hiddenPeople, sessionSpeakerNames, focusPeople]);

  const selectedCertGoals = useMemo(
    () => resolveSelectedCertificationGoals(allSessions, certGoalIds),
    [allSessions, certGoalIds],
  );

  const activeCertificationsForPlan = useMemo((): TxCertification[] => {
    if (!focusCertIntent) return [];
    return enrolledCertifications;
  }, [focusCertIntent, enrolledCertifications]);

  const certificationJourneyPlan = useMemo(() => {
    if (!focusCertIntent) return null;
    const goalsForJourney = selectedCertGoals.length > 0
      ? selectedCertGoals
      : enrolledCertifications.map(c => ({
          id: c.certification_id,
          title: c.title,
          certification_code: c.exam_code,
          track: c.txc_tracks[0],
          topics: c.skill_tags,
          products: c.related_products,
        }));
    const active = resolveActiveCertification(
      goalsForJourney,
      certLabel,
      enrolledCertifications[0]?.certification_id ?? goalsForJourney[0]?.id,
    );
    if (!active) return null;
    return buildCertificationJourneyPlan(
      active,
      allSessions as unknown as ScoredSession[],
      allChampions as unknown as ScoredChampion[],
      huddlesController.liveOpportunities,
    );
  }, [
    focusCertIntent,
    selectedCertGoals,
    enrolledCertifications,
    certLabel,
    allSessions,
    allChampions,
    huddlesController.liveOpportunities,
  ]);

  const focusSessionPlan = useMemo(
    () => buildFocusSessionPlan(
      learningList,
      communityList,
      funList,
      hiddenSessions,
      focusCertIntent,
      activeCertificationsForPlan,
    ),
    [learningList, communityList, funList, hiddenSessions, focusCertIntent, activeCertificationsForPlan],
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
    const previous = certificationEnrollments;
    setCertificationEnrollments(prev => [...prev, enrollment]);
    setCertificationError(null);
    try {
      await enrollInCertification(participantId, certificationId);
    } catch (err) {
      console.error("[ExperiencePage] enroll certification:", err);
      setCertificationEnrollments(previous);
      setCertificationError(
        "Could not save your certification selection. Sign in again, or ask your admin to deploy updated Firestore rules.",
      );
    }
  }, [certificationEnrollments, participantId]);

  const handleRemoveCertification = useCallback(async (certificationId: string) => {
    const previous = certificationEnrollments;
    setCertificationEnrollments(prev => prev.filter(e => e.certification_id !== certificationId));
    setCertificationError(null);
    try {
      await removeCertificationEnrollment(participantId, certificationId);
    } catch (err) {
      console.error("[ExperiencePage] remove certification:", err);
      setCertificationEnrollments(previous);
      setCertificationError("Could not remove certification. Please try again.");
    }
  }, [certificationEnrollments, participantId]);

  const clearCertificationError = useCallback(() => setCertificationError(null), []);
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
    const next = savedPeople.includes(id)
      ? savedPeople.filter(x => x !== id)
      : [...savedPeople, id];
    setSavedPeople(next);
    void persistPrefs({ saved_people: next });
  }, [savedPeople, persistPrefs]);

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
    () => [
      ...savedPeople.map(id => {
        const c = allChampions.find(ch => ch.id === id);
        return c ? { id: c.id, display_name: c.display_name } : null;
      }).filter((r): r is { id: string; display_name: string } => !!r),
      ...focusPeople.slice(0, 5).map(p => ({ id: p.id, display_name: p.display_name })),
    ],
    [savedPeople, allChampions, focusPeople],
  );

  const peopleBadgeContext = useMemo(
    () => ({ viewerUniversities, isChampion: true as const }),
    [viewerUniversities],
  );

  const handleDetailsPerson = useCallback((id: string) => {
    const found = allChampions.find(c => c.id === id);
    return found ?? null;
  }, [allChampions]);

  const peopleActions = useMemo(
    () => ({
      savedPeople,
      hiddenPeople,
      onSave: handleSavePerson,
      onHide: handleHidePerson,
    }),
    [savedPeople, hiddenPeople, handleSavePerson, handleHidePerson],
  );

  const displayName = String(
    participant?.display_name ?? participant?.displayName ??
    [participant?.first_name, participant?.last_name].filter(Boolean).join(" ") ?? "Attendee",
  );

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
    peopleYouWantToMeet,
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
    savedPeople,
    profileSignals: [...pTracks, ...pGoals, ...pIntentKeywords],
    certificationJourneyPlan,
    certificationCatalog,
    certificationCatalogSource,
    certificationEnrollments,
    enrolledCertificationViews,
    handleEnrollCertification,
    handleRemoveCertification,
    certificationError,
    clearCertificationError,
    focusCertIntent,
  };
}

export type ExperiencePageData = ReturnType<typeof useExperiencePageData>;
