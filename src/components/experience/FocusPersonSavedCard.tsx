"use client";

import {
  CONNECTION_BADGE_LABELS,
  deriveConnectionBadges,
  type ConnectionBadgeContext,
} from "@/lib/connectionBadges";
import { buildPersonIntelligence } from "@/lib/personIntelligence";
import type { RecommendedPerson, PersonActionState } from "@/components/people/RecommendedConnectionCard";
import type { ConnectionBadgeId } from "@/types/connectionSignals";

interface FocusPersonSavedCardProps {
  person: RecommendedPerson;
  profileSignals?: string[];
  badgeContext?: ConnectionBadgeContext;
  badges?: ConnectionBadgeId[];
  mutual?: boolean;
  saved?: boolean;
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
        className="focus-person-saved-card__avatar focus-person-saved-card__avatar--photo"
      />
    );
  }
  return (
    <div className="focus-person-saved-card__avatar" aria-hidden="true">
      {initial}
    </div>
  );
}

export default function FocusPersonSavedCard({
  person,
  profileSignals = [],
  badgeContext,
  badges,
  mutual = false,
  saved = true,
  actions,
  onOpenDetails,
}: FocusPersonSavedCardProps) {
  const org = person.organization ?? person.company ?? "";
  const resolvedBadges = badges ?? deriveConnectionBadges(person, badgeContext);
  const intel = buildPersonIntelligence(person, profileSignals);
  const essence = intel.reasons[0] ?? "Aligned with your Compass profile";
  const isHidden = actions?.hiddenPeople.includes(person.id) ?? false;

  if (isHidden) return null;

  const openDetails = () => {
    if (actions?.onDetails) actions.onDetails(person.id);
    else if (onOpenDetails) onOpenDetails(person.id);
  };

  return (
    <article className="focus-person-saved-card">
      <button type="button" className="focus-person-saved-card__surface" onClick={openDetails}>
        <div className="focus-person-saved-card__header">
          <PersonAvatar name={person.display_name} photoUrl={person.photo_url} />
          <div className="focus-person-saved-card__identity">
            <h4 className="focus-person-saved-card__name">{person.display_name}</h4>
            {(person.title || org) && (
              <p className="focus-person-saved-card__meta">
                {[person.title, org].filter(Boolean).join(" · ")}
              </p>
            )}
          </div>
          {intel.score > 0 && (
            <span className="focus-person-saved-card__match" aria-label={`${intel.score}% match`}>
              {intel.score}%
            </span>
          )}
        </div>

        <p className="focus-person-saved-card__essence">{essence}</p>

        <div className="focus-person-saved-card__foot">
          <div className="focus-person-saved-card__signals">
            {mutual && <span className="focus-person-saved-card__mutual">Mutual interest</span>}
            {saved && !mutual && (
              <span className="focus-person-saved-card__saved">Saved</span>
            )}
            {resolvedBadges.slice(0, 2).map(id => (
              <span key={id} className={`focus-person-saved-card__chip focus-person-saved-card__chip--${id}`}>
                {CONNECTION_BADGE_LABELS[id]}
              </span>
            ))}
          </div>
          <span className="focus-person-saved-card__cta">Details</span>
        </div>
      </button>
    </article>
  );
}
