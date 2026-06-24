"use client";

import {
  SPEAKER_AVAILABLE_FOR_LABELS,
  type ScoredSpeaker,
} from "@/types/speaker";
import { displayFirstName } from "@/lib/personCardHelpers";
import type { SessionSpeakerSource } from "@/lib/speakerIntelligence";

interface SessionSpeakerPanelProps {
  speaker: ScoredSpeaker;
  currentSessionId?: string;
  allSessions?: SessionSpeakerSource[];
  onViewProfile?: (speakerId: string) => void;
  anonymous?: boolean;
}

export default function SessionSpeakerPanel({
  speaker,
  currentSessionId,
  allSessions = [],
  onViewProfile,
  anonymous = false,
}: SessionSpeakerPanelProps) {
  const otherSessions = allSessions.filter(
    s => s.id !== currentSessionId && speaker.sessionIds.includes(s.id),
  );
  const shownName = anonymous ? displayFirstName(speaker.displayName) : speaker.displayName;

  return (
    <section className="session-speaker-panel">
      <header className="session-speaker-panel__head">
        <p className="session-speaker-panel__kicker">About the speaker</p>
        <h3 className="session-speaker-panel__name">{shownName}</h3>
        {!anonymous && (speaker.title || speaker.organization) && (
          <p className="session-speaker-panel__role">
            {[speaker.title, speaker.organization].filter(Boolean).join(" · ")}
          </p>
        )}
        {speaker.isChampion && (
          <span className="session-speaker-panel__badge">IBM Champion</span>
        )}
      </header>

      {!anonymous && speaker.whyMeet.length > 0 && (
        <div className="session-speaker-panel__block">
          <p className="session-speaker-panel__block-kicker">Why meet this speaker</p>
          <ul className="session-speaker-panel__reasons">
            {speaker.whyMeet.map(reason => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </div>
      )}

      {speaker.expertiseAreas.length > 0 && (
        <div className="session-speaker-panel__block">
          <p className="session-speaker-panel__block-kicker">Expertise</p>
          <div className="session-speaker-panel__chips">
            {speaker.expertiseAreas.slice(0, 6).map(area => (
              <span key={area} className="session-speaker-panel__chip">{area}</span>
            ))}
          </div>
        </div>
      )}

      {speaker.availableFor.length > 0 && (
        <div className="session-speaker-panel__block">
          <p className="session-speaker-panel__block-kicker">Available for</p>
          <div className="session-speaker-panel__chips">
            {speaker.availableFor.map(id => (
              <span key={id} className="session-speaker-panel__chip session-speaker-panel__chip--muted">
                {SPEAKER_AVAILABLE_FOR_LABELS[id]}
              </span>
            ))}
          </div>
        </div>
      )}

      {otherSessions.length > 0 && (
        <div className="session-speaker-panel__block">
          <p className="session-speaker-panel__block-kicker">Other sessions</p>
          <ul className="session-speaker-panel__list">
            {otherSessions.slice(0, 4).map(s => (
              <li key={s.id}>{s.title}</li>
            ))}
          </ul>
        </div>
      )}

      {speaker.communities.length > 0 && (
        <div className="session-speaker-panel__block">
          <p className="session-speaker-panel__block-kicker">Communities</p>
          <div className="session-speaker-panel__chips">
            {speaker.communities.map(c => (
              <span key={c} className="session-speaker-panel__chip">{c}</span>
            ))}
          </div>
        </div>
      )}

      {(speaker.relatedHuddleIds?.length ?? 0) > 0 && (
        <div className="session-speaker-panel__block">
          <p className="session-speaker-panel__block-kicker">Related meetups</p>
          <p className="session-speaker-panel__note">
            {speaker.relatedHuddleIds!.length} live conversation
            {speaker.relatedHuddleIds!.length === 1 ? "" : "s"} linked to this speaker&apos;s topics.
          </p>
        </div>
      )}

      {onViewProfile && speaker.championId && !anonymous && (
        <button
          type="button"
          className="session-speaker-intel__action session-speaker-panel__cta"
          onClick={() => onViewProfile(speaker.championId!)}
        >
          View full profile
        </button>
      )}
    </section>
  );
}
