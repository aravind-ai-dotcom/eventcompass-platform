"use client";

import { useCallback, useMemo, useState } from "react";
import { formatHuddleMatchLine } from "@/lib/huddleLifecycle";
import { formatHuddleTimeRange } from "@/lib/huddleSchedule";
import {
  extraParticipantCount,
  headingCount,
  headingParticipants,
  hostFirstName,
  hostInitials,
} from "@/lib/huddleStorage";
import type { HuddlesController } from "@/hooks/useHuddles";
import { enrichHuddleWithSpeakerIntel } from "@/lib/speakerIntelligence";
import type { SpeakerProfile } from "@/types/speaker";
import StartConversationModal from "@/components/experience/StartConversationModal";

interface LiveOpportunitiesProps {
  huddles: HuddlesController;
  speakerCatalog?: SpeakerProfile[];
  userDisplayName?: string;
  userFirstName?: string;
  participantUid?: string;
  visibleLimit?: number;
}

export default function LiveOpportunities({
  huddles,
  speakerCatalog = [],
  userDisplayName = "You",
  userFirstName = "You",
  participantUid,
  visibleLimit = 5,
}: LiveOpportunitiesProps) {
  const [showStart, setShowStart] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const {
    loading,
    liveOpportunities,
    matchedHuddles,
    responses,
    createHuddle,
    respondOnMyWay,
    cancelHuddle,
  } = huddles;

  const visibleAll = useMemo(() => {
    return liveOpportunities.map(opp => {
      if (speakerCatalog.length === 0) return opp;
      return enrichHuddleWithSpeakerIntel(opp, speakerCatalog);
    });
  }, [liveOpportunities, speakerCatalog]);

  const visible = showAll ? visibleAll : visibleAll.slice(0, visibleLimit);
  const liveCount = visibleAll.filter(h => h.status === "Happening now").length;

  const handleOnMyWay = useCallback(
    (huddleId: string) => {
      void respondOnMyWay(huddleId, userDisplayName);
    },
    [respondOnMyWay, userDisplayName],
  );

  const isHost = useCallback(
    (hostName?: string) =>
      !!hostName &&
      hostName.trim().toLowerCase() === userDisplayName.trim().toLowerCase(),
    [userDisplayName],
  );

  return (
    <div className="live-opportunities">
      <header className="live-opportunities-head live-opportunities-head--row">
        <div>
          <span className="live-opportunities-kicker">Live opportunities</span>
          <h2 className="live-opportunities-title">Conversations forming around you</h2>
          <p className="live-opportunities-desc">
            {liveCount > 0
              ? `${liveCount} huddle${liveCount === 1 ? "" : "s"} happening now.`
              : "Lightweight invitations for real-world conversations — no chat threads."}
          </p>
        </div>
        {participantUid && (
          <button
            type="button"
            className="action-chip live-opportunities-start"
            onClick={() => setShowStart(true)}
          >
            Start a Conversation
          </button>
        )}
      </header>

      {loading && visibleAll.length === 0 && (
        <p className="live-opportunities-desc">Loading matched huddles…</p>
      )}

      {!loading && visibleAll.length === 0 && (
        <p className="live-opportunities-desc">
          No matched huddles yet. Start a conversation or refine your Compass profile.
        </p>
      )}

      <ul className="huddle-feed" aria-label="Live huddles">
        {visible.map(opp => {
          const matched = matchedHuddles.find(h => h.id === opp.id);
          const isOnMyWay = responses[opp.id] === "on_my_way" || opp.userResponse === "on_my_way";
          const isLive = opp.status === "Happening now";
          const count = headingCount(opp, isOnMyWay, userFirstName);
          const participants = headingParticipants(opp, isOnMyWay, userFirstName);
          const extra = extraParticipantCount(count, participants.length);
          const host = hostFirstName(opp);
          const hostLabel = opp.hostName ?? host;
          const scheduleLabel = matched
            ? formatHuddleTimeRange(matched)
            : opp.startTime ?? "Time TBD";
          const userIsHost = isHost(opp.hostName);
          const isExpanded = expandedId === opp.id;
          const whyLine = formatHuddleMatchLine(opp.matchReasons);

          return (
            <li key={opp.id}>
              <article className={`huddle-row${isLive ? " huddle-row--live" : ""}`}>
                <div className="huddle-row-badge">
                  {isLive && <span className="huddle-live-dot" aria-hidden="true" />}
                  <span aria-hidden="true">{opp.emoji}</span>
                  {isLive ? "Live now" : opp.category}
                </div>

                <div className="huddle-row-body">
                  <h3 className="huddle-row-title">{opp.title}</h3>
                  <p className="huddle-row-time">{isLive ? "Happening now" : scheduleLabel}</p>
                  <p className="huddle-row-meta huddle-row-meta--compact">
                    {count} heading there
                    {opp.location ? ` · ${opp.location}` : ""}
                  </p>
                  <p className="huddle-row-match">Matched because: {whyLine}</p>

                  {opp.sessionConflict && (
                    <p className="huddle-row-slot-note" style={{ color: "var(--warn, #b8860b)" }}>
                      Conflicts with a saved session at this time ({opp.sessionConflict}).
                    </p>
                  )}

                  <div className="huddle-host-block">
                    <p className="huddle-role-label">Host</p>
                    <div className="huddle-host-row">
                      <span className="huddle-avatar huddle-avatar--host" aria-hidden="true">
                        {hostInitials(opp)}
                      </span>
                      <span className="huddle-host-name">{hostLabel}</span>
                    </div>
                  </div>

                  {(isExpanded || participants.length > 0) && (
                    <>
                      <div className="huddle-attendee-divider" />
                      <div className="huddle-attendee-block">
                        <p className="huddle-role-label">Heading there</p>
                        <div className="huddle-row-people-compact">
                          {participants.map(name => (
                            <span
                              key={name}
                              className="huddle-avatar"
                              title={name}
                            >
                              {name[0]?.toUpperCase()}
                            </span>
                          ))}
                          {extra > 0 && (
                            <span className="huddle-avatar huddle-avatar--more">+{extra}</span>
                          )}
                          <span className="huddle-row-people">
                            {participants.length > 0
                              ? `${participants.join(", ")}${extra > 0 ? ` +${extra}` : ""}`
                              : "Be the first to head over"}
                          </span>
                        </div>
                      </div>
                    </>
                  )}

                  {isExpanded && opp.description && (
                    <div className="huddle-row-detail">
                      <p>{opp.description}</p>
                    </div>
                  )}
                </div>

                <div className="huddle-row-actions">
                  {!userIsHost && (
                    <button
                      type="button"
                      className={`action-chip action-chip--primary${isOnMyWay ? " action-chip--active" : ""}`}
                      aria-pressed={isOnMyWay}
                      onClick={() => handleOnMyWay(opp.id)}
                    >
                      {isOnMyWay ? "✓ On My Way" : "On My Way"}
                    </button>
                  )}
                  {userIsHost && (
                    <button
                      type="button"
                      className="action-chip"
                      onClick={() => void cancelHuddle(opp.id)}
                    >
                      Cancel huddle
                    </button>
                  )}
                  <button
                    type="button"
                    className="action-chip"
                    aria-expanded={isExpanded}
                    onClick={() => setExpandedId(isExpanded ? null : opp.id)}
                  >
                    {isExpanded ? "Less" : "Details"}
                  </button>
                </div>
              </article>
            </li>
          );
        })}
      </ul>

      {visibleAll.length > visibleLimit && !showAll && (
        <button
          type="button"
          className="action-chip compass-view-more"
          onClick={() => setShowAll(true)}
        >
          View more ({visibleAll.length - visibleLimit} more)
        </button>
      )}

      {showStart && participantUid && (
        <StartConversationModal
          hostParticipantId={participantUid}
          hostName={userDisplayName}
          onClose={() => setShowStart(false)}
          onCreate={createHuddle}
        />
      )}
    </div>
  );
}
