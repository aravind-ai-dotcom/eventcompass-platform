"use client";

import { useMemo } from "react";
import { SAMPLE_LIVE_HUDDLES, rankLiveHuddles } from "@/lib/sampleLiveHuddles";

function formatJoined(names: string[], total: number): string {
  const shown = names.slice(0, 3).join(", ");
  const extra = Math.max(0, total - Math.min(3, names.length));
  return extra > 0 ? `${shown} +${extra}` : shown;
}

interface LiveOpportunitiesProps {
  participantTracks?: string[];
  participantGoals?: string[];
}

export default function LiveOpportunities({
  participantTracks = [],
  participantGoals = [],
}: LiveOpportunitiesProps) {
  const visible = useMemo(() => {
    return rankLiveHuddles(SAMPLE_LIVE_HUDDLES, participantTracks, participantGoals).slice(0, 4);
  }, [participantTracks, participantGoals]);

  return (
    <div className="live-opportunities">
      <header className="live-opportunities-head">
        <span className="live-opportunities-kicker">Live opportunities</span>
        <h2 className="live-opportunities-title">Conversations forming around you</h2>
        <p className="live-opportunities-desc">
          Small huddles, study groups, alumni moments, and topic conversations matched to your intent.
        </p>
      </header>

      <ul className="huddle-feed" aria-label="Live huddles">
        {visible.map(opp => (
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
                  {` · ${opp.joinedCount} joined`}
                </p>
                <p className="huddle-row-people">
                  Joined by {formatJoined(opp.joinedNames, opp.joinedCount)}
                </p>
                <div className="huddle-row-people-avatars" aria-hidden="true">
                  {opp.joinedNames.slice(0, 3).map(name => (
                    <span key={name} className="huddle-avatar">{name[0]?.toUpperCase()}</span>
                  ))}
                </div>
                <p className="huddle-row-match">
                  Matched because: {opp.matchReasons.join(" · ")}
                </p>
              </div>

              <div className="huddle-row-actions">
                <button type="button" className="action-chip">Join</button>
                <button type="button" className="action-chip">Details</button>
              </div>
            </article>
          </li>
        ))}
      </ul>
    </div>
  );
}
