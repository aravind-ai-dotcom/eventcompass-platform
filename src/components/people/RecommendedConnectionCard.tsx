"use client";

import { useEffect, useState } from "react";
import {
  CONNECTION_BADGE_LABELS,
  deriveConnectionBadges,
  type ConnectionBadgeContext,
} from "@/lib/connectionBadges";
import { enrichLinkedInForPerson } from "@/lib/demoLinkedInEnrichment";
import {
  displayFirstName,
  personSkillDomainTags,
} from "@/lib/personCardHelpers";
import { hasMeetSignal, sendCanWeMeetSignal } from "@/lib/meetSignals";
import PersonMatchPanel from "@/components/people/PersonMatchPanel";
import type { ConnectionBadgeId } from "@/types/connectionSignals";

export interface RecommendedPerson {
  id: string;
  display_name: string;
  title?: string;
  organization?: string;
  company?: string;
  photo_url?: string;
  linkedin_url?: string;
  consent?: { show_linkedin?: boolean; show_email?: boolean };
  profile?: { domains?: string[]; products?: string[]; community_interests?: string[] };
  attendance?: { available_for_1x1?: boolean };
  compass_reasons?: string[];
  compass_score?: number;
  roles?: string[];
  is_speaker?: boolean;
  education?: Array<{ institution?: string } | string>;
}

export interface PersonActionState {
  savedPeople: string[];
  hiddenPeople: string[];
  onSave: (id: string) => void;
  onRequestSave?: (person: RecommendedPerson) => void;
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
  allowMeetSignal?: boolean;
  compact?: boolean;
  anonymous?: boolean;
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
  badges,
  mutual = false,
  actions,
  compact = false,
  allowMeetSignal = false,
  anonymous = false,
}: RecommendedConnectionCardProps) {
  const [meetSent, setMeetSent] = useState(false);

  useEffect(() => {
    setMeetSent(hasMeetSignal(person.id));
  }, [person.id]);

  const org = person.organization ?? person.company ?? "";
  const shownName = anonymous ? displayFirstName(person.display_name) : person.display_name;
  const skillTags = personSkillDomainTags(person);
  const resolvedBadges = badges ?? deriveConnectionBadges(person, badgeContext);
  const linkedIn = anonymous ? null : enrichLinkedInForPerson(person);
  const isSaved = actions?.savedPeople.includes(person.id) ?? false;
  const isHidden = actions?.hiddenPeople.includes(person.id) ?? false;

  const showLinkedIn = !anonymous && linkedIn?.linkedinVisibility === "visible" && linkedIn.linkedin_url;
  const linkedInBlocked = !anonymous && linkedIn?.linkedinVisibility === "consent_blocked";
  const hasMetaRow = resolvedBadges.length > 0 || showLinkedIn || linkedInBlocked;

  if (isHidden) return null;

  return (
    <article className={`connection-card${compact ? " connection-card--compact" : ""}`}>
      <header className="connection-card-head">
        <PersonAvatar name={shownName} photoUrl={anonymous ? undefined : person.photo_url} />
        <div className="connection-card-copy">
          <h3 className="connection-card-name">{shownName}</h3>
          {!anonymous && person.title && <p className="connection-card-role">{person.title}</p>}
          {!anonymous && org && <p className="connection-card-org">{org}</p>}
        </div>
      </header>

      <div className="connection-card-body">
        {!anonymous && (
          <PersonMatchPanel
            person={person}
            profileSignals={profileSignals}
            compact={compact}
          />
        )}

        {anonymous && skillTags.length > 0 && (
          <div className="connection-card-skills">
            <p className="connection-card-skills-kicker">Skills &amp; domains</p>
            <div className="champion-person-tags">
              {skillTags.map(tag => (
                <span key={tag} className="champion-person-tag">{tag}</span>
              ))}
            </div>
          </div>
        )}

        {hasMetaRow && (
          <div className="connection-card-meta">
            <ConnectionBadgeRow badges={resolvedBadges} />
            {showLinkedIn && (
              <a
                href={linkedIn!.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="connection-card-linkedin"
              >
                <span className="connection-card-linkedin__label">LinkedIn profile</span>
                <span className="connection-card-linkedin__arrow" aria-hidden="true">↗</span>
              </a>
            )}
            {linkedInBlocked && (
              <p className="connection-card-linkedin connection-card-linkedin--blocked">
                LinkedIn · not shared
              </p>
            )}
          </div>
        )}

        {mutual && (
          <p className="connection-card-mutual">Mutual interest — good moment to connect</p>
        )}

        {allowMeetSignal && !anonymous && (
          <div className="connection-card-meet-signal">
            {meetSent ? (
              <p className="connection-card-meet-signal__sent">
                ✓ Signal sent — they&apos;ll know you&apos;d like to connect
              </p>
            ) : (
              <button
                type="button"
                className="connection-card-action connection-card-action--signal"
                title="A lightweight interest signal — not a formal introduction."
                onClick={() => {
                  sendCanWeMeetSignal(person.id, person.display_name);
                  setMeetSent(true);
                }}
              >
                Can we meet?
              </button>
            )}
            {!meetSent && !compact && (
              <p className="connection-card-meet-signal__note">
                Lightweight interest signal — lets them know you&apos;d welcome a conversation.
              </p>
            )}
          </div>
        )}
      </div>

      {actions && !anonymous && (
        <footer className="connection-card-actions">
          {actions.onDetails && (
            <button type="button" className="connection-card-action" onClick={() => actions.onDetails!(person.id)}>
              Details
            </button>
          )}
          {isSaved ? (
            <button type="button" className="connection-card-action connection-card-action--active" onClick={() => actions.onSave(person.id)}>
              ✓ Saved
            </button>
          ) : (
            <button
              type="button"
              className="connection-card-action"
              onClick={() =>
                actions.onRequestSave
                  ? actions.onRequestSave(person)
                  : actions.onSave(person.id)
              }
            >
              Save
            </button>
          )}
          {!isHidden && (
            <button type="button" className="connection-card-action connection-card-action--muted" onClick={() => actions.onHide(person.id)}>
              Not for me
            </button>
          )}
        </footer>
      )}
    </article>
  );
}
