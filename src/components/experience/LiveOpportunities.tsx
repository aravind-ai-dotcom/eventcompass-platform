"use client";

import { useState } from "react";
import type { HuddleParticipantPreview } from "@/types/huddleDataModel";
import type { HuddlesController } from "@/hooks/useHuddles";
import type { SpeakerProfile } from "@/types/speaker";
import { enrichHuddleWithSpeakerIntel } from "@/lib/speakerIntelligence";
import HuddleCard from "@/components/experience/HuddleCard";
import StartConversationModal from "@/components/experience/StartConversationModal";
import CompassPanel from "@/components/experience/CompassPanel";

interface LiveOpportunitiesProps {
  huddles: HuddlesController;
  speakerCatalog?: SpeakerProfile[];
  userDisplayName?: string;
  userFirstName?: string;
  participantUid?: string;
  hostJobTitle?: string;
  hostOrganization?: string;
  visibleLimit?: number;
  embedded?: boolean;
  onSaveContact?: (preview: HuddleParticipantPreview) => void;
}

export default function LiveOpportunities({
  huddles,
  speakerCatalog = [],
  userDisplayName = "You",
  userFirstName = "You",
  participantUid,
  hostJobTitle,
  hostOrganization,
  visibleLimit = 5,
  embedded = false,
  onSaveContact,
}: LiveOpportunitiesProps) {
  const [showStart, setShowStart] = useState(false);

  const {
    loading,
    liveOpportunities,
    matchedHuddles,
    createHuddle,
  } = huddles;

  const visible = liveOpportunities
    .slice(0, visibleLimit)
    .map(opp => (speakerCatalog.length > 0 ? enrichHuddleWithSpeakerIntel(opp, speakerCatalog) : opp));

  const liveCount = visible.filter(h => h.displayStatus === "happening_now" || h.displayStatus === "ending_soon").length;

  const panelDescription =
    liveCount > 0
      ? `${liveCount} in-person invitation${liveCount === 1 ? "" : "s"} happening now — right people, right place, right time.`
      : "Lightweight invitations for real-world conversations. No chat — just show up.";

  const body = (
    <>
      {participantUid && (
        <div className="live-opportunities-actions">
          <button
            type="button"
            className="action-chip live-opportunities-start"
            onClick={() => setShowStart(true)}
          >
            Start a Conversation
          </button>
        </div>
      )}

      {loading && visible.length === 0 && (
        <p className="live-opportunities-desc">Loading matched huddles…</p>
      )}

      {!loading && visible.length === 0 && (
        <div className="live-opportunities-empty">
          <p className="live-opportunities-desc">
            No huddles matched yet — start an invitation and others can join you on site.
          </p>
          {participantUid && (
            <button
              type="button"
              className="action-chip live-opportunities-start live-opportunities-start--empty"
              onClick={() => setShowStart(true)}
            >
              Start a Conversation
            </button>
          )}
        </div>
      )}

      <ul className="huddle-feed" aria-label="Matched huddles">
        {visible.map(opp => {
          const matched = matchedHuddles.find(h => h.id === opp.id);
          if (!matched) return null;
          return (
            <li key={opp.id}>
              <HuddleCard
                opp={opp}
                matched={matched}
                huddles={huddles}
                userDisplayName={userDisplayName}
                userFirstName={userFirstName}
                participantUid={participantUid}
                onSaveContact={onSaveContact}
              />
            </li>
          );
        })}
      </ul>

      {showStart && participantUid && (
        <StartConversationModal
          hostParticipantId={participantUid}
          hostName={userDisplayName}
          hostJobTitle={hostJobTitle}
          hostOrganization={hostOrganization}
          onClose={() => setShowStart(false)}
          onCreate={async (input) => {
            await createHuddle({
              ...input,
              host_job_title: hostJobTitle,
              host_organization: hostOrganization,
            });
          }}
        />
      )}
    </>
  );

  if (embedded) {
    return (
      <CompassPanel
        icon="huddles"
        kicker="Networking & Connections"
        title="Huddles near you"
        description={panelDescription}
        className="live-opportunities live-opportunities--embedded"
      >
        {body}
      </CompassPanel>
    );
  }

  return (
    <div className="live-opportunities">
      <header className="live-opportunities-head">
        <span className="live-opportunities-kicker">Networking & Connections</span>
        <h2 className="live-opportunities-title">Huddles near you</h2>
      </header>
      {body}
    </div>
  );
}
