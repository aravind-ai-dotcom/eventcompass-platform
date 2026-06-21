"use client";

import { CONNECTION_BADGE_LABELS } from "@/lib/connectionBadges";
import { buildPersonMatchReasons } from "@/lib/personIntelligence";
import type { RecommendedPerson, PersonActionState } from "@/components/people/RecommendedConnectionCard";
import type { ConnectionBadgeId } from "@/types/connectionSignals";

interface FocusPersonRowProps {
  person: RecommendedPerson;
  profileSignals?: string[];
  badges?: ConnectionBadgeId[];
  mutual?: boolean;
  actions?: PersonActionState;
  onOpenDetails?: (id: string) => void;
}

export default function FocusPersonRow({
  person,
  profileSignals = [],
  badges,
  mutual = false,
  actions,
  onOpenDetails,
}: FocusPersonRowProps) {
  const org = person.organization ?? person.company ?? "";
  const whyMeet = buildPersonMatchReasons(person, profileSignals);
  const reason = whyMeet[0] ?? "Aligned with your Compass profile";
  const initial = person.display_name.trim()[0]?.toUpperCase() ?? "?";
  const isHidden = actions?.hiddenPeople.includes(person.id) ?? false;

  if (isHidden) return null;

  const openDetails = () => {
    if (actions?.onDetails) actions.onDetails(person.id);
    else if (onOpenDetails) onOpenDetails(person.id);
  };

  return (
    <article className="focus-person-row">
      <button
        type="button"
        className="focus-person-row__avatar"
        aria-label={`View ${person.display_name}`}
        onClick={openDetails}
      >
        {initial}
      </button>
      <div className="focus-person-row__copy">
        <button type="button" className="focus-person-row__name" onClick={openDetails}>
          {person.display_name}
        </button>
        {(person.title || org) && (
          <p className="focus-person-row__meta">
            {[person.title, org].filter(Boolean).join(" · ")}
          </p>
        )}
        <p className="focus-person-row__why">
          <span className="focus-person-row__why-kicker">Why meet</span>
          {reason}
        </p>
        {mutual && (
          <p className="focus-person-row__mutual">Mutual interest</p>
        )}
        {badges && badges.length > 0 && (
          <div className="focus-person-row__chips">
            {badges.slice(0, 2).map(id => (
              <span key={id} className={`focus-person-row__chip focus-person-row__chip--${id}`}>
                {CONNECTION_BADGE_LABELS[id]}
              </span>
            ))}
          </div>
        )}
      </div>
      {actions && (
        <div className="focus-person-row__actions">
          <button type="button" className="action-chip action-chip--compact action-chip--quiet" onClick={openDetails}>
            Details
          </button>
        </div>
      )}
    </article>
  );
}
