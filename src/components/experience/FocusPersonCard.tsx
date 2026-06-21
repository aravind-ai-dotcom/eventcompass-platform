"use client";

import { useEffect, useState } from "react";
import {
  CONNECTION_BADGE_LABELS,
  deriveConnectionBadges,
  type ConnectionBadgeContext,
} from "@/lib/connectionBadges";
import { enrichLinkedInForPerson } from "@/lib/demoLinkedInEnrichment";
import { hasMeetSignal, sendCanWeMeetSignal } from "@/lib/meetSignals";
import { buildPersonIntelligence } from "@/lib/personIntelligence";
import { downloadPersonVCard } from "@/lib/personVcard";
import PersonMatchPanel from "@/components/people/PersonMatchPanel";
import type { RecommendedPerson, PersonActionState } from "@/components/people/RecommendedConnectionCard";
import type { ConnectionBadgeId } from "@/types/connectionSignals";

interface FocusPersonCardProps {
  person: RecommendedPerson;
  profileSignals?: string[];
  badgeContext?: ConnectionBadgeContext;
  badges?: ConnectionBadgeId[];
  mutual?: boolean;
  actions?: PersonActionState;
  onOpenDetails?: (id: string) => void;
}

function PersonAvatar({ name, photoUrl }: { name: string; photoUrl?: string }) {
  const initial = name.trim()[0]?.toUpperCase() ?? "?";
  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt=""
        className="focus-person-card__avatar focus-person-card__avatar--photo"
      />
    );
  }
  return (
    <div className="focus-person-card__avatar" aria-hidden="true">
      {initial}
    </div>
  );
}

function ConnectionBadgeRow({ badges }: { badges: ConnectionBadgeId[] }) {
  if (badges.length === 0) return null;
  return (
    <div className="focus-person-card__badges">
      {badges.map(id => (
        <span key={id} className={`focus-person-card__badge focus-person-card__badge--${id}`}>
          {CONNECTION_BADGE_LABELS[id]}
        </span>
      ))}
    </div>
  );
}

export default function FocusPersonCard({
  person,
  profileSignals = [],
  badgeContext,
  badges,
  mutual = false,
  actions,
  onOpenDetails,
}: FocusPersonCardProps) {
  const [meetSent, setMeetSent] = useState(false);
  const org = person.organization ?? person.company ?? "";
  const resolvedBadges = badges ?? deriveConnectionBadges(person, badgeContext);
  const linkedIn = enrichLinkedInForPerson(person);
  const intel = buildPersonIntelligence(person, profileSignals);
  const isSaved = actions?.savedPeople.includes(person.id) ?? false;
  const isHidden = actions?.hiddenPeople.includes(person.id) ?? false;

  useEffect(() => {
    setMeetSent(hasMeetSignal(person.id));
  }, [person.id]);

  const openDetails = () => {
    if (actions?.onDetails) actions.onDetails(person.id);
    else if (onOpenDetails) onOpenDetails(person.id);
  };

  if (isHidden) return null;

  const showLinkedIn = linkedIn?.linkedinVisibility === "visible" && linkedIn.linkedin_url;

  return (
    <article className="focus-person-card focus-person-card--featured">
      <header className="focus-person-card__header">
        <PersonAvatar name={person.display_name} photoUrl={person.photo_url} />
        <div className="focus-person-card__identity">
          <h3 className="focus-person-card__name">{person.display_name}</h3>
          {person.title && <p className="focus-person-card__title">{person.title}</p>}
          {org && <p className="focus-person-card__org">{org}</p>}
        </div>
        {intel.score > 0 && (
          <div className="focus-person-card__score-pill" title={`${intel.score}% match`}>
            <span className="focus-person-card__score-value">{intel.score}%</span>
            <span className="focus-person-card__score-label">Match</span>
          </div>
        )}
      </header>

      <PersonMatchPanel
        person={person}
        profileSignals={profileSignals}
        badges={resolvedBadges}
      />

      <ConnectionBadgeRow badges={resolvedBadges} />

      {showLinkedIn && (
        <a
          href={linkedIn!.linkedin_url}
          target="_blank"
          rel="noopener noreferrer"
          className="focus-person-card__linkedin"
          onClick={e => e.stopPropagation()}
        >
          LinkedIn profile ↗
        </a>
      )}

      {mutual && (
        <p className="focus-person-card__mutual">Mutual interest — good moment to connect</p>
      )}

      <div className="focus-person-card__meet">
        {meetSent ? (
          <p className="focus-person-card__meet-sent">
            ✓ Signal sent — they&apos;ll know you&apos;d like to connect
          </p>
        ) : (
          <button
            type="button"
            className="action-chip focus-person-card__meet-btn"
            onClick={() => {
              sendCanWeMeetSignal(person.id, person.display_name);
              setMeetSent(true);
            }}
          >
            Can we meet?
          </button>
        )}
      </div>

      {actions && (
        <footer className="focus-person-card__actions">
          <button type="button" className="action-chip action-chip--quiet" onClick={openDetails}>
            Details
          </button>
          <button
            type="button"
            className={`action-chip${isSaved ? " action-chip--saved" : ""}`}
            onClick={() => actions.onSave(person.id)}
          >
            {isSaved ? "✓ Saved" : "Save"}
          </button>
          <button
            type="button"
            className="action-chip action-chip--quiet"
            onClick={() => downloadPersonVCard(person, intel.reasons)}
          >
            Download VCard
          </button>
        </footer>
      )}
    </article>
  );
}
