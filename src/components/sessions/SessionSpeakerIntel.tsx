"use client";

import { displayFirstName } from "@/lib/personCardHelpers";
import type { ScoredSpeaker } from "@/types/speaker";

interface SessionSpeakerIntelProps {
  speakers: ScoredSpeaker[];
  onViewSpeaker?: (speakerId: string) => void;
  compact?: boolean;
  anonymous?: boolean;
}

export default function SessionSpeakerIntel({
  speakers,
  onViewSpeaker,
  compact = false,
  anonymous = false,
}: SessionSpeakerIntelProps) {
  const primary = speakers[0];
  if (!primary) return null;

  const extra = speakers.length - 1;
  const shownName = anonymous ? displayFirstName(primary.displayName) : primary.displayName;
  const skillTags = [...new Set(primary.expertiseAreas)].slice(0, 4);

  return (
    <div className={`session-speaker-intel${compact ? " session-speaker-intel--compact" : ""}`}>
      <p className="session-speaker-intel__kicker">Speaker</p>
      <div className="session-speaker-intel__body">
        <div className="session-speaker-intel__copy">
          <p className="session-speaker-intel__name">{shownName}</p>
          {anonymous ? (
            skillTags.length > 0 && (
              <div className="session-speaker-intel__chips">
                {skillTags.map(tag => (
                  <span key={tag} className="session-speaker-intel__chip">{tag}</span>
                ))}
                {extra > 0 && (
                  <span className="session-speaker-intel__chip session-speaker-intel__chip--muted">
                    +{extra} more
                  </span>
                )}
              </div>
            )
          ) : (
            <p className="session-speaker-intel__meta">
              {[
                primary.isChampion ? "IBM Champion" : null,
                primary.expertiseLabel ?? primary.expertiseAreas[0],
              ]
                .filter(Boolean)
                .join(" · ")}
              {extra > 0 ? ` · +${extra} more` : ""}
            </p>
          )}
        </div>
        {onViewSpeaker && !anonymous && (
          <button
            type="button"
            className="session-speaker-intel__action"
            onClick={() => onViewSpeaker(primary.championId ?? primary.id)}
          >
            View Speaker
          </button>
        )}
      </div>
    </div>
  );
}
