"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { SAMPLE_LIVE_HUDDLES, rankLiveHuddles } from "@/lib/sampleLiveHuddles";
import {
  HUDDLE_COPY,
  formatHuddleMatchLine,
  formatHuddleScheduleLabel,
  isHuddleExpired,
  isHuddleHost,
  isHuddleLiveNow,
} from "@/lib/huddleLifecycle";
import {
  endHuddle,
  extraParticipantCount,
  formatEndTimeLabel,
  headingCount,
  headingParticipants,
  hostFirstName,
  hostInitials,
  loadEndedHuddleIds,
  loadOnMyWayIds,
  loadPendingHuddles,
  normalizeHuddleSchedule,
  toggleOnMyWay,
} from "@/lib/huddleStorage";
import { getHuddleParticipant } from "@/lib/huddleParticipants";
import type { LiveOpportunity } from "@/types/liveOpportunity";
import { enrichHuddleWithSpeakerIntel } from "@/lib/speakerIntelligence";
import type { SpeakerProfile } from "@/types/speaker";
import HuddleParticipantMiniCard from "@/components/experience/HuddleParticipantMiniCard";
import StartConversationModal from "@/components/experience/StartConversationModal";

interface LiveOpportunitiesProps {
  participantTracks?: string[];
  participantGoals?: string[];
  speakerCatalog?: SpeakerProfile[];
  userDisplayName?: string;
  userFirstName?: string;
  visibleLimit?: number;
}

function isVisibleHuddle(
  h: LiveOpportunity,
  ended: Set<string>,
  now: number,
): boolean {
  return !ended.has(h.id) && !isHuddleExpired(h, now);
}

export default function LiveOpportunities({
  participantTracks = [],
  participantGoals = [],
  speakerCatalog = [],
  userDisplayName = "You",
  userFirstName = "You",
  visibleLimit = 4,
}: LiveOpportunitiesProps) {
  const [pending, setPending] = useState<LiveOpportunity[]>([]);
  const [onMyWay, setOnMyWay] = useState<Set<string>>(new Set());
  const [ended, setEnded] = useState<Set<string>>(new Set());
  const [now, setNow] = useState(() => Date.now());
  const [showStart, setShowStart] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const refresh = useCallback(() => {
    setPending(loadPendingHuddles().map(normalizeHuddleSchedule));
    setOnMyWay(loadOnMyWayIds());
    setEnded(loadEndedHuddleIds());
    setNow(Date.now());
  }, []);

  useEffect(() => {
    refresh();
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  const visibleAll = useMemo(() => {
    const ranked = rankLiveHuddles(SAMPLE_LIVE_HUDDLES, participantTracks, participantGoals)
      .map(h => (speakerCatalog.length > 0 ? enrichHuddleWithSpeakerIntel(h, speakerCatalog) : h));
    const merged = [...pending.map(h => speakerCatalog.length > 0 ? enrichHuddleWithSpeakerIntel(h, speakerCatalog) : h), ...ranked];
    const seen = new Set<string>();
    return merged.filter(h => {
      if (seen.has(h.id)) return false;
      seen.add(h.id);
      return isVisibleHuddle(h, ended, now);
    });
  }, [participantTracks, participantGoals, pending, ended, now, speakerCatalog]);

  const visible = showAll ? visibleAll : visibleAll.slice(0, visibleLimit);
  const liveCount = visibleAll.filter(h => isHuddleLiveNow(h, now)).length;

  const handleOnMyWay = useCallback((huddleId: string) => {
    setOnMyWay(toggleOnMyWay(huddleId));
  }, []);

  const handleProposed = useCallback((huddle: LiveOpportunity) => {
    setPending(prev => [normalizeHuddleSchedule(huddle), ...prev]);
  }, []);

  const handleEndCatchup = useCallback((huddleId: string) => {
    endHuddle(huddleId);
    refresh();
  }, [refresh]);

  return (
    <div className="live-opportunities">
      <header className="live-opportunities-head live-opportunities-head--row">
        <div>
          <span className="live-opportunities-kicker">Live opportunities</span>
          <h2 className="live-opportunities-title">Conversations forming around you</h2>
          <p className="live-opportunities-desc">
            {liveCount > 0
              ? `${liveCount} catchup${liveCount === 1 ? "" : "s"} happening now — join before the window closes.`
              : HUDDLE_COPY.sectionLead}
          </p>
        </div>
        <button
          type="button"
          className="action-chip live-opportunities-start"
          onClick={() => setShowStart(true)}
        >
          Start a conversation
        </button>
      </header>

      <ul className="huddle-feed" aria-label="Live huddles">
        {visible.map(opp => {
          const isOnMyWay = onMyWay.has(opp.id);
          const isLive = isHuddleLiveNow(opp, now);
          const count = headingCount(opp, isOnMyWay, userFirstName);
          const participants = headingParticipants(opp, isOnMyWay, userFirstName);
          const extra = extraParticipantCount(count, participants.length);
          const host = hostFirstName(opp);
          const hostLabel = opp.hostName ?? host;
          const scheduleLabel = formatHuddleScheduleLabel(opp);
          const endLabel = formatEndTimeLabel(opp);
          const userIsHost = isHuddleHost(opp, userDisplayName);
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
                    {hostLabel ? ` · Host ${hostLabel}` : ""}
                    {opp.speakerRole === "hosting" && " · Speaker Hosting"}
                    {opp.speakerRole === "attending" && opp.speakerAttendeeName && ` · Speaker Attending (${opp.speakerAttendeeName})`}
                  </p>
                  <p className="huddle-row-match">{whyLine}</p>

                  {isExpanded && (
                    <div className="huddle-row-detail">
                      {opp.description && <p>{opp.description}</p>}
                      {!isLive && (
                        <p className="huddle-row-slot-note">
                          {HUDDLE_COPY.slotNote}
                          {endLabel ? ` · wraps ${endLabel}` : ""}
                        </p>
                      )}
                      <div className="huddle-row-people-compact">
                        {participants.map(name => (
                          <button
                            key={name}
                            type="button"
                            className="huddle-avatar huddle-avatar--btn"
                            title={name}
                            onClick={() => setSelectedPerson(name)}
                          >
                            {name[0]?.toUpperCase()}
                          </button>
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
                  )}
                </div>

                <div className="huddle-row-actions">
                  <button
                    type="button"
                    className={`action-chip action-chip--primary${isOnMyWay ? " action-chip--active" : ""}`}
                    aria-pressed={isOnMyWay}
                    onClick={() => handleOnMyWay(opp.id)}
                  >
                    {isOnMyWay ? "✓ On My Way" : "On My Way"}
                  </button>
                  {userIsHost && (
                    <button
                      type="button"
                      className="action-chip"
                      onClick={() => handleEndCatchup(opp.id)}
                    >
                      {HUDDLE_COPY.endCatchup}
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

      {showStart && (
        <StartConversationModal
          hostName={userDisplayName}
          hostFirstName={userFirstName}
          onClose={() => setShowStart(false)}
          onProposed={handleProposed}
        />
      )}

      {selectedPerson && (
        <HuddleParticipantMiniCard
          participant={getHuddleParticipant(selectedPerson)}
          onClose={() => setSelectedPerson(null)}
        />
      )}
    </div>
  );
}
