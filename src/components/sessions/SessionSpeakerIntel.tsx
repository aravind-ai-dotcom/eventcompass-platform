"use client";

import type { ScoredSpeaker } from "@/types/speaker";

interface SessionSpeakerIntelProps {
  speakers: ScoredSpeaker[];
  onViewSpeaker?: (speakerId: string) => void;
  compact?: boolean;
}

export default function SessionSpeakerIntel({
  speakers,
  onViewSpeaker,
  compact = false,
}: SessionSpeakerIntelProps) {
  const primary = speakers[0];
  if (!primary) return null;

  const extra = speakers.length - 1;

  return (
    <div className={`session-speaker-intel${compact ? " session-speaker-intel--compact" : ""}`}>
      <p className="session-speaker-intel__kicker">Speaker</p>
      <div className="session-speaker-intel__body">
        <div className="session-speaker-intel__copy">
          <p className="session-speaker-intel__name">{primary.displayName}</p>
          <p className="session-speaker-intel__meta">
            {[
              primary.isChampion ? "IBM Champion" : null,
              primary.expertiseLabel ?? primary.expertiseAreas[0],
            ]
              .filter(Boolean)
              .join(" · ")}
            {extra > 0 ? ` · +${extra} more` : ""}
          </p>
        </div>
        {onViewSpeaker && (
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
