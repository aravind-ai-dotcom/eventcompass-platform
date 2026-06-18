"use client";

import {
  CONNECTION_BADGE_LABELS,
  deriveConnectionBadges,
  formatRecommendedBecause,
  type ConnectionBadgeContext,
} from "@/lib/connectionBadges";
import { primaryMatchReason } from "@/lib/personCardHelpers";
import type { ConnectionBadgeId } from "@/types/connectionSignals";

export interface RecommendedPerson {
  id: string;
  display_name: string;
  title?: string;
  organization?: string;
  company?: string;
  photo_url?: string;
  profile?: { domains?: string[]; products?: string[] };
  attendance?: { available_for_1x1?: boolean };
  compass_reasons?: string[];
  roles?: string[];
  is_speaker?: boolean;
  education?: Array<{ institution?: string } | string>;
}

interface PersonActionState {
  savedPeople: string[];
  hiddenPeople: string[];
  onSave: (id: string) => void;
  onHide: (id: string) => void;
  onDetails?: (id: string) => void;
}

interface RecommendedConnectionCardProps {
  person: RecommendedPerson;
  profileSignals?: string[];
  badgeContext?: ConnectionBadgeContext;
  primaryReason?: string | null;
  badges?: ConnectionBadgeId[];
  mutual?: boolean;
  actions?: PersonActionState;
  compact?: boolean;
}

function PersonAvatar({ name, photoUrl }: { name: string; photoUrl?: string }) {
  const initial = name.trim()[0]?.toUpperCase() ?? "?";
  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt=""
        className="connection-card-avatar connection-card-avatar--photo"
      />
    );
  }
  return (
    <div className="connection-card-avatar" aria-hidden="true">
      {initial}
    </div>
  );
}

function ConnectionBadgeRow({ badges }: { badges: ConnectionBadgeId[] }) {
  if (badges.length === 0) return null;
  return (
    <div className="connection-badge-row">
      {badges.map(id => (
        <span key={id} className={`connection-badge connection-badge--${id}`}>
          {CONNECTION_BADGE_LABELS[id]}
        </span>
      ))}
    </div>
  );
}

export default function RecommendedConnectionCard({
  person,
  profileSignals = [],
  badgeContext,
  primaryReason,
  badges,
  mutual = false,
  actions,
  compact = false,
}: RecommendedConnectionCardProps) {
  const org = person.organization ?? person.company ?? "";
  const resolvedBadges = badges ?? deriveConnectionBadges(person, badgeContext);
  const reasonText = formatRecommendedBecause(
    primaryReason ?? primaryMatchReason(person, profileSignals),
    resolvedBadges,
  );
  const isSaved = actions?.savedPeople.includes(person.id) ?? false;
  const isHidden = actions?.hiddenPeople.includes(person.id) ?? false;

  if (isHidden) return null;

  return (
    <article className={`connection-card${compact ? " connection-card--compact" : ""}`}>
      <div className="connection-card-head">
        <PersonAvatar name={person.display_name} photoUrl={person.photo_url} />
        <div className="connection-card-copy">
          <h3 className="connection-card-name">{person.display_name}</h3>
          {person.title && <p className="connection-card-role">{person.title}</p>}
          {org && <p className="connection-card-org">{org}</p>}
        </div>
      </div>

      {reasonText && (
        <div className="connection-card-reason">
          <p className="connection-card-reason-kicker">Recommended because:</p>
          <p className="connection-card-reason-text">{reasonText}</p>
        </div>
      )}

      <ConnectionBadgeRow badges={resolvedBadges} />

      {mutual && (
        <p className="connection-card-mutual">Mutual interest — good moment to connect</p>
      )}

      {actions && (
        <div className="connection-card-actions">
          {actions.onDetails && (
            <button type="button" className="connection-card-action" onClick={() => actions.onDetails!(person.id)}>
              Details
            </button>
          )}
          {isSaved ? (
            <button type="button" className="connection-card-action connection-card-action--active" onClick={() => actions.onSave(person.id)}>
              ✓ Tracking
            </button>
          ) : (
            <button type="button" className="connection-card-action" onClick={() => actions.onSave(person.id)}>
              Track
            </button>
          )}
          {!isHidden && (
            <button type="button" className="connection-card-action connection-card-action--muted" onClick={() => actions.onHide(person.id)}>
              Not for me
            </button>
          )}
        </div>
      )}
    </article>
  );
}
