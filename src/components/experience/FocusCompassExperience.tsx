"use client";

import Link from "next/link";
import { useState } from "react";
import NextBestMoveCard from "@/components/experience/NextBestMove";
import LiveOpportunities from "@/components/experience/LiveOpportunities";
import FocusDayPlanSection from "@/components/experience/FocusDayPlanSection";
import DontMissMomentsSection from "@/components/experience/DontMissMomentsSection";
import FocusCompassHero from "@/components/experience/FocusCompassHero";
import FocusCompassGroup from "@/components/experience/FocusCompassGroup";
import FocusCustomizePanel from "@/components/experience/FocusCustomizePanel";
import FocusPeopleSection from "@/components/experience/FocusPeopleSection";
import IbmCommunityCard from "@/components/communities/IbmCommunityCard";
import MyCertifications from "@/components/experience/MyCertifications";
import ChampionDetailModal from "@/components/people/ChampionDetailModal";
import VoiceCompassButton from "@/components/voice/VoiceCompassButton";
import { SpeakerIntelligenceProvider } from "@/context/SpeakerIntelligenceContext";
import { isFocusGroupVisible } from "@/lib/focusCompassUiPreferences";
import { SAMPLE_INBOUND_SIGNALS, recommendedShowsMutualInterest } from "@/lib/sampleConnectionSignals";
import type { ExperienceScoredChampion } from "@/lib/experienceScoring";
import { useExperiencePageData } from "@/hooks/useExperiencePageData";
import { useFocusCompassGroups } from "@/hooks/useFocusCompassGroups";
import { useFocusCompassUiPreferences } from "@/hooks/useFocusCompassUiPreferences";
import type { ScoredSession, ScoredChampion } from "@/types";

export default function FocusCompassExperience() {
  const data = useExperiencePageData();
  const { toggleGroup, isGroupExpanded } = useFocusCompassGroups();
  const {
    prefs: uiPrefs,
    customizeOpen,
    setCustomizeOpen,
    setBlockVisible,
    isBlockVisible,
  } = useFocusCompassUiPreferences();
  const [detailChampion, setDetailChampion] = useState<ExperienceScoredChampion | null>(null);

  const showGroup = (groupId: Parameters<typeof isFocusGroupVisible>[0]) =>
    isFocusGroupVisible(groupId, uiPrefs.blocks);

  const ibmCommunities = data.recommendedIbmCommunities;

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

  const voicePanel = (
    <VoiceCompassButton
      variant="companion"
      embedInCommandCenter
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
  );

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
        <FocusCustomizePanel
          open={customizeOpen}
          prefs={uiPrefs}
          showCertifications={data.focusCertIntent}
          onClose={() => setCustomizeOpen(false)}
          onBlockChange={setBlockVisible}
        />

        <FocusCompassHero
          displayName={data.displayName}
          participant={data.participant}
          tracks={data.pTracks}
          goals={data.pGoals}
          peopleCount={peopleBalanceCount}
          learningCount={data.learningList.length}
          communityCount={data.communityList.length}
          funCount={data.funList.length}
          onCustomize={() => setCustomizeOpen(true)}
          voicePanel={voicePanel}
        />

        {showGroup("today") && isBlockVisible("next_best_move") && (
        <FocusCompassGroup
          id="today"
          icon="next-move"
          label="Today"
          title="Next best move"
          description="The single most valuable thing to do next."
          expanded={isGroupExpanded("today")}
          onToggle={() => toggleGroup("today")}
        >
          {data.nextBestMove ? (
            <NextBestMoveCard
              nextBestMove={data.nextBestMove}
              intelSession={voiceNbmSession}
              certLabel={data.certLabel}
            />
          ) : (
            <p className="focus-compass-section__desc">
              Complete your profile and Compass will surface your next best move.
            </p>
          )}
        </FocusCompassGroup>
        )}

        {showGroup("conversations") && isBlockVisible("live_huddles") && (
        <FocusCompassGroup
          id="conversations"
          icon="huddles"
          label="Live"
          title="Conversations around you"
          description="Time-sensitive invitations nearby. Join in person while the moment is open."
          expanded={isGroupExpanded("conversations")}
          onToggle={() => toggleGroup("conversations")}
        >
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
        </FocusCompassGroup>
        )}

        {showGroup("learning") && isBlockVisible("learning_plan") && (
        <FocusCompassGroup
          id="learning"
          icon="learning"
          label="My Learning"
          title="Your learning plan"
          description="A curated plan based on your interests, goals, and certifications."
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
        </FocusCompassGroup>
        )}

        {showGroup("moments") && isBlockVisible("event_moments") && (
        <FocusCompassGroup
          id="moments"
          icon="moments"
          label="Event"
          title="Don't miss these moments"
          description="Defining TechXchange experiences — shared by everyone, not session recommendations."
          expanded={isGroupExpanded("moments")}
          onToggle={() => toggleGroup("moments")}
        >
          <DontMissMomentsSection />
        </FocusCompassGroup>
        )}

        {showGroup("people") && isBlockVisible("people_to_meet") && (
        <FocusCompassGroup
          id="people"
          icon="connections"
          label="My People"
          title="People to meet"
          description="Who Compass recommends — champions, speakers, and peers matched to your goals."
          expanded={isGroupExpanded("people")}
          onToggle={() => toggleGroup("people")}
        >
          <FocusPeopleSection
            recommended={data.focusPeople}
            wantToMeet={data.peopleYouWantToMeet}
            inboundSignals={SAMPLE_INBOUND_SIGNALS}
            savedChampionRefs={data.savedChampionRefs}
            profileSignals={data.profileSignals}
            badgeContext={data.peopleBadgeContext}
            actions={{
              ...data.peopleActions,
              onDetails: openPersonDetails,
            }}
            onOpenDetails={openPersonDetails}
            recommendedMutualCheck={person =>
              recommendedShowsMutualInterest(person.id, person.display_name, SAMPLE_INBOUND_SIGNALS)
            }
          />
        </FocusCompassGroup>
        )}

        {data.focusCertIntent && showGroup("certifications") && isBlockVisible("certifications") && (
        <FocusCompassGroup
          id="certifications"
          icon="certifications"
          label="My Certifications"
          title="Working Toward a Certification"
          description="Great choice. Compass can help you identify learning opportunities, experts, study groups, and certification-related sessions throughout TechXchange."
          expanded={isGroupExpanded("certifications")}
          onToggle={() => toggleGroup("certifications")}
        >
          <MyCertifications
            views={data.enrolledCertificationViews}
            catalog={data.certificationCatalog}
            enrolledIds={data.certificationEnrollments.map(e => e.certification_id)}
            enrollmentError={data.certificationError}
            onEnroll={data.handleEnrollCertification}
            onRemove={data.handleRemoveCertification}
            onClearError={data.clearCertificationError}
          />
        </FocusCompassGroup>
        )}

        {showGroup("community") && isBlockVisible("ibm_communities") && (
        <FocusCompassGroup
          id="community"
          icon="community"
          label="My Community"
          title="Recommended IBM Communities"
          description="Where to continue learning, discussion, and participation after TechXchange — official IBM Community destinations only."
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
        )}

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
            isSaved={data.savedPeople.includes(detailChampion.id)}
            matchReasons={detailChampion.compass_reasons}
            profileSignals={data.profileSignals}
            onToggleSave={() => data.handleSavePerson(detailChampion.id)}
            onClose={() => setDetailChampion(null)}
          />
        )}
      </div>
    </SpeakerIntelligenceProvider>
  );
}
