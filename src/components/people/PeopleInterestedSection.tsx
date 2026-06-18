"use client";

import RecommendedConnectionCard, {
  type RecommendedPerson,
} from "@/components/people/RecommendedConnectionCard";
import type { InboundConnectionSignal } from "@/types/connectionSignals";
import { CONNECTION_BADGE_LABELS } from "@/lib/connectionBadges";
import type { ConnectionBadgeId } from "@/types/connectionSignals";
import { inboundShowsMutual } from "@/lib/sampleConnectionSignals";

interface PeopleInterestedSectionProps {
  inboundSignals: InboundConnectionSignal[];
  savedChampionRefs: Array<{ id: string; display_name: string }>;
  savedPeople?: string[];
  onRequestSave?: (person: RecommendedPerson) => void;
  onSave?: (id: string) => void;
  onShowDetails?: (personId: string) => void;
  profileSignals?: string[];
  embedded?: boolean;
  /** Renders as a column inside people-follow-up-split__layout */
  splitColumn?: boolean;
}

function inferInboundBadges(signal: InboundConnectionSignal): ConnectionBadgeId[] {
  const blob = [
    signal.topic,
    ...(signal.domains ?? []),
    signal.whyInterested ?? "",
  ]
    .join(" ")
    .toLowerCase();
  const badges: ConnectionBadgeId[] = ["peer"];
  if (/certif|exam|credential/.test(blob)) badges.push("certification-guide");
  if (/alumni|university/.test(blob)) badges.push("alumni");
  if (/mentor/.test(blob)) badges.push("mentor");
  if (/partner/.test(blob)) badges.push("partner");
  if (/community|user group/.test(blob)) badges.push("community-leader");
  return [...new Set(badges)].slice(0, 3);
}

function inboundToRecommendedPerson(signal: InboundConnectionSignal): RecommendedPerson {
  return {
    id: signal.id,
    display_name: signal.fromFirstName,
    organization: signal.organization,
    profile: signal.domains?.length ? { domains: signal.domains } : undefined,
    compass_reasons: signal.whyInterested ? [signal.whyInterested] : undefined,
  };
}

export default function PeopleInterestedSection({
  inboundSignals,
  savedChampionRefs,
  savedPeople = [],
  onRequestSave,
  onSave,
  onShowDetails,
  profileSignals = [],
  embedded = false,
  splitColumn = false,
}: PeopleInterestedSectionProps) {
  if (inboundSignals.length === 0 && !splitColumn) return null;

  const cardActions =
    onSave || onRequestSave
      ? {
          savedPeople,
          hiddenPeople: [] as string[],
          onSave: onSave ?? (() => {}),
          onRequestSave,
          onHide: () => {},
          onDetails: onShowDetails,
        }
      : undefined;

  const content = (
    <>
      <header className="people-follow-up-split__header">
        <p className="people-follow-up-split__kicker">Interested in you</p>
        <h2 className="people-follow-up-split__title">People interested in you.</h2>
        <p className="people-follow-up-split__note">
          Attendees who expressed interest in meeting you — including mutual matches.
        </p>
      </header>

      {inboundSignals.length > 0 ? (
        <div className="people-follow-up-split__cards">
          {inboundSignals.map(signal => {
          const mutual = inboundShowsMutual(signal, savedChampionRefs);
          const badges = inferInboundBadges(signal);
          const person = inboundToRecommendedPerson(signal);

          if (cardActions) {
            return (
              <RecommendedConnectionCard
                key={signal.id}
                person={person}
                profileSignals={profileSignals}
                badges={badges}
                primaryReason={signal.whyInterested ?? null}
                mutual={mutual}
                actions={cardActions}
              />
            );
          }

          const initial = signal.fromFirstName.trim()[0]?.toUpperCase() ?? "?";
          return (
            <article key={signal.id} className="connection-card connection-card--compact">
              <div className="connection-card-head">
                <div className="connection-card-avatar" aria-hidden="true">{initial}</div>
                <div className="connection-card-copy">
                  <h3 className="connection-card-name">{signal.fromFirstName}</h3>
                  {signal.organization && (
                    <p className="connection-card-org">{signal.organization}</p>
                  )}
                </div>
              </div>

              {signal.whyInterested && (
                <div className="connection-card-reason">
                  <p className="connection-card-reason-kicker">Recommended because:</p>
                  <p className="connection-card-reason-text">{signal.whyInterested}</p>
                </div>
              )}

              <div className="connection-badge-row">
                {badges.map(id => (
                  <span key={id} className={`connection-badge connection-badge--${id}`}>
                    {CONNECTION_BADGE_LABELS[id]}
                  </span>
                ))}
              </div>

              {mutual && (
                <p className="connection-card-mutual">Mutual interest — good moment to connect</p>
              )}
            </article>
          );
        })}
        </div>
      ) : (
        <p className="people-follow-up-split__empty">
          When someone signals interest in connecting, they will appear here.
        </p>
      )}
    </>
  );

  if (splitColumn) {
    return <div className="people-follow-up-split__column">{content}</div>;
  }

  if (inboundSignals.length === 0) return null;

  return (
    <section className={embedded ? "compass-module-block people-interested-section" : "section people-interested-section"}>
      {content}
    </section>
  );
}
