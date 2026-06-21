"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import NextBestMoveCard from "@/components/experience/NextBestMove";
import LiveOpportunities from "@/components/experience/LiveOpportunities";
import FocusDayPlanSection from "@/components/experience/FocusDayPlanSection";
import FocusCompassHero from "@/components/experience/FocusCompassHero";
import FocusCompassGroup from "@/components/experience/FocusCompassGroup";
import FocusMomentCard from "@/components/experience/FocusMomentCard";
import CompassModuleHead from "@/components/experience/CompassModuleHead";
import RecommendedConnectionCard from "@/components/people/RecommendedConnectionCard";
import PeopleInterestedSection from "@/components/people/PeopleInterestedSection";
import IbmCommunityCard from "@/components/communities/IbmCommunityCard";
import ChampionDetailModal from "@/components/people/ChampionDetailModal";
import VoiceCompassButton from "@/components/voice/VoiceCompassButton";
import { SpeakerIntelligenceProvider } from "@/context/SpeakerIntelligenceContext";
import { EVENT_MOMENT_HIGHLIGHTS } from "@/lib/eventMoments";
import { SAMPLE_INBOUND_SIGNALS, recommendedShowsMutualInterest } from "@/lib/sampleConnectionSignals";
import type { ExperienceScoredChampion } from "@/lib/experienceScoring";
import { useExperiencePageData } from "@/hooks/useExperiencePageData";
import { useFocusCompassGroups } from "@/hooks/useFocusCompassGroups";
import type { ScoredSession, ScoredChampion } from "@/types";

export default function FocusCompassExperience() {
  const data = useExperiencePageData();
  const { toggleGroup, isGroupExpanded } = useFocusCompassGroups();
  const [detailChampion, setDetailChampion] = useState<ExperienceScoredChampion | null>(null);

  const ibmCommunities = data.recommendedIbmCommunities;
  const hasCommunityMatches = ibmCommunities.some(c => c.matchScore > 0);

  const peopleToMeet = data.recommendedPeople.slice(0, 8);

  const peopleMutualRefs = useMemo(
    () => [
      ...data.savedChampionRefs,
      ...peopleToMeet.map(p => ({ id: p.id, display_name: p.display_name })),
    ],
    [data.savedChampionRefs, peopleToMeet],
  );

  const openPersonDetails = (id: string) => {
    const champ = data.handleDetailsPerson(id);
    if (champ) setDetailChampion(champ);
  };

  if (data.status === "loading") {
    return (
      <section className="focus-compass-page section no-top-border">
        <div className="section-kicker">My Compass</div>
        <h1 className="focus-compass-hero__title">Building your plan…</h1>
        <p className="focus-compass-hero__subtitle">Compass is shaping a focused path for your week.</p>
      </section>
    );
  }

  if (data.status === "error" || !data.participant) {
    return (
      <section className="focus-compass-page section no-top-border">
        <div className="section-kicker">My Compass</div>
        <h1 className="focus-compass-hero__title">Could not load Compass</h1>
        <p className="focus-compass-hero__subtitle">{data.errorMsg}</p>
        {!data.participantId && (
          <Link href="/txc/login" className="action-chip" style={{ marginTop: "16px" }}>
            Sign in →
          </Link>
        )}
      </section>
    );
  }

  const voiceSessions = data.rankedSessionsForVoice as unknown as ScoredSession[];
  const voiceChampion = data.topChampion as unknown as ScoredChampion | null;
  const voiceNbmSession = data.nbmSession as unknown as ScoredSession | null;
  const peopleBalanceCount = data.champions.filter(c => c.compass_score > 0).length;

  return (
    <SpeakerIntelligenceProvider
      catalog={data.speakerCatalog}
      ctx={data.speakerCtx}
      onViewSpeaker={id => {
        const champ = data.handleDetailsPerson(id);
        if (champ) setDetailChampion(champ);
      }}
    >
      <div className="focus-compass-page">
        <FocusCompassHero
          displayName={data.displayName}
          participant={data.participant}
          tracks={data.pTracks}
          goals={data.pGoals}
          peopleCount={peopleBalanceCount}
          learningCount={data.learningList.length}
          communityCount={data.communityList.length}
          funCount={data.funList.length}
        />

        <FocusCompassGroup
          id="today"
          icon="next-move"
          label="Today"
          title="What matters now"
          description="Ask Compass, act on your next move, and join live conversations on site."
          expanded={isGroupExpanded("today")}
          onToggle={() => toggleGroup("today")}
        >
          <div className="focus-compass-block focus-compass-block--voice">
            <VoiceCompassButton
              variant="companion"
              nextBestMove={data.nextBestMove}
              balancedMoves={data.balancedMoveSet}
              topSession={voiceNbmSession}
              topChampion={voiceChampion}
              topSpeaker={data.topSpeaker}
              rankedSpeakers={data.rankedExperts}
              speakerCatalog={data.speakerCatalog}
              speakerCtx={data.speakerCtx}
              rankedSessions={voiceSessions}
              participantGoals={data.pGoals}
              participantTracks={data.pTracks}
              certLabel={data.certLabel}
              certificationJourney={data.certificationJourneyPlan}
              isEnrolled={data.enrolled}
              onAddToSchedule={data.handleSaveSession}
              onDoNotSuggestSession={data.handleHideSession}
              onSavePerson={data.handleSavePerson}
              onDoNotSuggestPerson={data.handleHidePerson}
            />
          </div>

          {data.nextBestMove && (
            <div className="focus-compass-block">
              <CompassModuleHead
                icon="next-move"
                kicker="Right now"
                title="Next best move"
                description="The single most valuable thing to do next."
                className="focus-compass-submodule"
              />
              <NextBestMoveCard
                nextBestMove={data.nextBestMove}
                intelSession={voiceNbmSession}
                certLabel={data.certLabel}
              />
            </div>
          )}

          <div className="focus-compass-block">
            <LiveOpportunities
              huddles={data.huddlesController}
              speakerCatalog={data.speakerCatalog}
              participantUid={data.participantId}
              userDisplayName={data.userDisplayName}
              userFirstName={data.userFirstName}
              hostJobTitle={data.hostJobTitle}
              hostOrganization={data.hostOrganization}
              visibleLimit={6}
              embedded
            />
          </div>
        </FocusCompassGroup>

        <FocusCompassGroup
          id="learning"
          icon="learning"
          label="My Learning"
          title="Your week plan"
          description="Curated sessions by day — core learning, certification, and peer perspective."
          expanded={isGroupExpanded("learning")}
          onToggle={() => toggleGroup("learning")}
        >
          <FocusDayPlanSection
            focusPlan={data.focusSessionPlan}
            learningList={data.learningList}
            communityList={data.communityList}
            hiddenSessionIds={data.hiddenSessions}
            certLabel={data.certLabel}
            savedSessionIds={data.mergedSavedSessionIds}
            onSaveSession={data.handleSaveSession}
          />

          <div className="focus-compass-block focus-compass-block--moments">
            <CompassModuleHead
              icon="moments"
              kicker="Event"
              title="Moments not to miss"
              description="Anchor experiences that shape the week."
              className="focus-compass-submodule"
            />
            <div className="opportunity-grid three focus-moment-grid">
              {EVENT_MOMENT_HIGHLIGHTS.map(moment => (
                <FocusMomentCard key={moment.id} moment={moment} />
              ))}
            </div>
          </div>
        </FocusCompassGroup>

        <FocusCompassGroup
          id="people"
          icon="connections"
          label="My People"
          title="Connections for you"
          description="Who Compass recommends — and who has signaled interest in meeting you."
          expanded={isGroupExpanded("people")}
          onToggle={() => toggleGroup("people")}
        >
          <div className="people-dual-panel-grid focus-people-dual">
            <div className="focus-people-column compass-panel people-panel-box">
              <CompassModuleHead
                icon="connections"
                kicker="Recommended"
                title="People I should meet"
                description="Champions, speakers, and peers matched to your interests."
                className="focus-compass-submodule focus-compass-submodule--compact"
              />
              {peopleToMeet.length > 0 ? (
                <div className="focus-people-stack">
                  {peopleToMeet.map(person => (
                    <RecommendedConnectionCard
                      key={person.id}
                      person={person}
                      profileSignals={data.profileSignals}
                      badgeContext={{
                        ...data.peopleBadgeContext,
                        isSpeaker: person.is_speaker,
                      }}
                      primaryReason={person.compass_reasons?.[0] ?? null}
                      mutual={recommendedShowsMutualInterest(
                        person.id,
                        person.display_name,
                        SAMPLE_INBOUND_SIGNALS,
                      )}
                      allowMeetSignal
                      compact
                      actions={{
                        ...data.peopleActions,
                        onDetails: openPersonDetails,
                      }}
                    />
                  ))}
                </div>
              ) : (
                <p className="people-follow-up-split__empty">
                  Complete your Compass profile to unlock people matches.
                </p>
              )}
            </div>

            <PeopleInterestedSection
              inboundSignals={SAMPLE_INBOUND_SIGNALS}
              savedChampionRefs={peopleMutualRefs}
              savedPeople={data.peopleActions.savedPeople}
              onSave={data.handleSavePerson}
              onShowDetails={openPersonDetails}
              profileSignals={data.profileSignals}
              splitColumn
            />
          </div>
        </FocusCompassGroup>

        <FocusCompassGroup
          id="community"
          icon="community"
          label="My Community"
          title="IBM Communities for you"
          description={
            hasCommunityMatches
              ? "Matched to your tracks, goals, and Compass intent from the TechXchange community catalog."
              : "Persistent topic groups aligned to your profile — loaded from the IBM Community catalog."
          }
          expanded={isGroupExpanded("community")}
          onToggle={() => toggleGroup("community")}
        >
          <div className="opportunity-grid three focus-ibm-grid">
            {ibmCommunities.length > 0 ? (
              ibmCommunities.map(community => (
                <IbmCommunityCard
                  key={community.community_id}
                  community={community}
                  matchReasons={community.matchScore > 0 ? community.matchReasons : undefined}
                  compact
                />
              ))
            ) : (
              <p className="people-follow-up-split__empty">
                Community recommendations will appear once your catalog is loaded.
              </p>
            )}
          </div>
        </FocusCompassGroup>

        <footer className="focus-compass-footer">
          <Link href="/txc/experience/print" className="focus-compass-advanced-link">
            Print &amp; export plan →
          </Link>
          <Link href="/txc/experience/classic" className="focus-compass-advanced-link">
            Advanced View →
          </Link>
        </footer>

        {detailChampion && (
          <ChampionDetailModal
            champion={detailChampion}
            isLoggedIn
            isSaved={false}
            matchReasons={detailChampion.compass_reasons}
            profileSignals={data.profileSignals}
            onToggleSave={() => setDetailChampion(null)}
            onClose={() => setDetailChampion(null)}
          />
        )}
      </div>
    </SpeakerIntelligenceProvider>
  );
}
