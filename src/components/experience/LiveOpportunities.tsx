"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { SAMPLE_LIVE_HUDDLES, rankLiveHuddles } from "@/lib/sampleLiveHuddles";
import {
  loadOnMyWayIds,
  loadPendingHuddles,
  toggleOnMyWay,
} from "@/lib/huddleStorage";
import { getHuddleParticipant } from "@/lib/huddleParticipants";
import type { LiveOpportunity } from "@/types/liveOpportunity";
import HuddleParticipantMiniCard from "@/components/experience/HuddleParticipantMiniCard";
import StartConversationModal from "@/components/experience/StartConversationModal";

interface LiveOpportunitiesProps {
  participantTracks?: string[];
  participantGoals?: string[];
}

export default function LiveOpportunities({
  participantTracks = [],
  participantGoals = [],
}: LiveOpportunitiesProps) {
  const [pending, setPending] = useState<LiveOpportunity[]>([]);
  const [onMyWay, setOnMyWay] = useState<Set<string>>(new Set());
  const [showStart, setShowStart] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<string | null>(null);

  useEffect(() => {
    setPending(loadPendingHuddles());
    setOnMyWay(loadOnMyWayIds());
  }, []);

  const visible = useMemo(() => {
    const ranked = rankLiveHuddles(SAMPLE_LIVE_HUDDLES, participantTracks, participantGoals);
    const merged = [...pending, ...ranked];
    const seen = new Set<string>();
    return merged.filter(h => {
      if (seen.has(h.id)) return false;
      seen.add(h.id);
      return true;
    }).slice(0, 4);
  }, [participantTracks, participantGoals, pending]);

  const handleOnMyWay = useCallback((huddleId: string) => {
    setOnMyWay(toggleOnMyWay(huddleId));
  }, []);

  const handleProposed = useCallback((huddle: LiveOpportunity) => {
    setPending(prev => [huddle, ...prev]);
  }, []);

  const extraCount = (total: number, shown: number) => Math.max(0, total - shown);

  return (
    <div className="live-opportunities">
      <header className="live-opportunities-head live-opportunities-head--row">
        <div>
          <span className="live-opportunities-kicker">Live opportunities</span>
          <h2 className="live-opportunities-title">Conversations forming around you</h2>
          <p className="live-opportunities-desc">
            Physical conversations at the event — signal intent and head over in person.
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
          const shownNames = opp.joinedNames.slice(0, 3);
          const extra = extraCount(opp.joinedCount, shownNames.length);

          return (
            <li key={opp.id}>
              <article className="huddle-row">
                <div className="huddle-row-badge">
                  <span aria-hidden="true">{opp.emoji}</span>
                  {opp.category}
                </div>

                <div className="huddle-row-body">
                  <h3 className="huddle-row-title">{opp.title}</h3>
                  <p className="huddle-row-meta">
                    {opp.status}
                    {opp.location ? ` · ${opp.location}` : ""}
                    {opp.startTime ? ` · ${opp.startTime}` : ""}
                  </p>
                  <div className="huddle-row-people-row">
                    <div className="huddle-row-people-avatars" aria-label="Participants">
                      {shownNames.map(name => (
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
                      {shownNames.join(", ")}
                      {extra > 0 ? ` +${extra}` : ""}
                    </p>
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
                    {isOnMyWay ? "On my way ✓" : "On my way"}
                  </button>
                  <button type="button" className="action-chip">Details</button>
                </div>
              </article>
            </li>
          );
        })}
      </ul>

      {showStart && (
        <StartConversationModal
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
