"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { SAMPLE_LIVE_HUDDLES, rankLiveHuddles } from "@/lib/sampleLiveHuddles";
import {
  HUDDLE_COPY,
  formatHuddleScheduleLabel,
  isHuddleExpired,
  isHuddleHost,
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
import HuddleParticipantMiniCard from "@/components/experience/HuddleParticipantMiniCard";
import StartConversationModal from "@/components/experience/StartConversationModal";

interface LiveOpportunitiesProps {
  participantTracks?: string[];
  participantGoals?: string[];
  userDisplayName?: string;
  userFirstName?: string;
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
  userDisplayName = "You",
  userFirstName = "You",
}: LiveOpportunitiesProps) {
  const [pending, setPending] = useState<LiveOpportunity[]>([]);
  const [onMyWay, setOnMyWay] = useState<Set<string>>(new Set());
  const [ended, setEnded] = useState<Set<string>>(new Set());
  const [now, setNow] = useState(() => Date.now());
  const [showStart, setShowStart] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setPending(loadPendingHuddles().map(normalizeHuddleSchedule));
    setOnMyWay(loadOnMyWayIds());
    setEnded(loadEndedHuddleIds());
    setNow(Date.now());
  }, []);

  useEffect(() => {
    refresh();
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  const visible = useMemo(() => {
    const ranked = rankLiveHuddles(SAMPLE_LIVE_HUDDLES, participantTracks, participantGoals);
    const merged = [...pending, ...ranked];
    const seen = new Set<string>();
    return merged.filter(h => {
      if (seen.has(h.id)) return false;
      seen.add(h.id);
      return isVisibleHuddle(h, ended, now);
    }).slice(0, 4);
  }, [participantTracks, participantGoals, pending, ended, now]);

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
          <p className="live-opportunities-desc">{HUDDLE_COPY.sectionLead}</p>
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
          const count = headingCount(opp, isOnMyWay, userFirstName);
          const participants = headingParticipants(opp, isOnMyWay, userFirstName);
          const extra = extraParticipantCount(count, participants.length);
          const host = hostFirstName(opp);
          const hostLabel = opp.hostName ?? host;
          const scheduleLabel = formatHuddleScheduleLabel(opp);
          const endLabel = formatEndTimeLabel(opp);
          const userIsHost = isHuddleHost(opp, userDisplayName);

          return (
            <li key={opp.id}>
              <article className="huddle-row">
                <div className="huddle-row-badge">
                  <span aria-hidden="true">{opp.emoji}</span>
                  {opp.category}
                </div>

                <div className="huddle-row-body">
                  <h3 className="huddle-row-title">{opp.title}</h3>
                  <p className="huddle-row-time">{scheduleLabel}</p>
                  <p className="huddle-row-slot-note">
                    {HUDDLE_COPY.slotNote}
                    {endLabel ? ` · wraps ${endLabel}` : ""}
                  </p>
                  <p className="huddle-row-meta">
                    {count} {count === 1 ? "attendee" : "attendees"} heading there
                    {opp.location ? ` · ${opp.location}` : ""}
                  </p>

                  <div className="huddle-host-block">
                    <p className="huddle-role-label">Host</p>
                    <div className="huddle-host-row">
                      <button
                        type="button"
                        className="huddle-avatar huddle-avatar--host huddle-avatar--btn"
                        title={hostLabel}
                        onClick={() => setSelectedPerson(host)}
                      >
                        {hostInitials(opp)}
                      </button>
                      <button
                        type="button"
                        className="huddle-host-name"
                        onClick={() => setSelectedPerson(host)}
                      >
                        {hostLabel}
                      </button>
                    </div>
                  </div>

                  <hr className="huddle-attendee-divider" />

                  <div className="huddle-attendee-block">
                    <p className="huddle-role-label">Heading There</p>
                    <div className="huddle-row-people-row">
                      <div className="huddle-row-people-avatars" aria-label="Attendees heading there">
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
                      </div>
                      <p className="huddle-row-people">
                        {participants.length > 0
                          ? `${participants.join(", ")}${extra > 0 ? ` +${extra}` : ""}`
                          : extra > 0
                            ? `+${extra}`
                            : "Be the first to head over"}
                      </p>
                    </div>
                  </div>

                  <p className="huddle-row-match">
                    Matched because: {opp.matchReasons.join(" · ")}
                  </p>
                </div>

                <div className="huddle-row-actions">
                  <button
                    type="button"
                    className={`action-chip${isOnMyWay ? " action-chip--active" : ""}`}
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
                  <button type="button" className="action-chip">Details</button>
                </div>
              </article>
            </li>
          );
        })}
      </ul>

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
