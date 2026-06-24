"use client";

import RecommendedConnectionCard, {
  type RecommendedPerson,
} from "@/components/people/RecommendedConnectionCard";
import type { InboundConnectionSignal } from "@/types/connectionSignals";
import type { ConnectionBadgeId } from "@/types/connectionSignals";
import { inboundShowsMutual } from "@/lib/sampleConnectionSignals";

export interface TrackedConnection {
  person: RecommendedPerson;
  mutual?: boolean;
}

interface PeopleFollowUpSplitProps {
  tracked: TrackedConnection[];
  inboundSignals: InboundConnectionSignal[];
  savedChampionRefs: Array<{ id: string; display_name: string }>;
  profileSignals?: string[];
  savedPeople: string[];
  onSave: (id: string) => void;
  onShowDetails?: (personId: string) => void;
  embedded?: boolean;
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

export default function PeopleFollowUpSplit({
  tracked,
  inboundSignals,
  savedChampionRefs,
  profileSignals = [],
  savedPeople,
  onSave,
  onShowDetails,
  embedded = false,
}: PeopleFollowUpSplitProps) {
  if (tracked.length === 0 && inboundSignals.length === 0) return null;

  const outerClass = embedded
    ? "compass-module-block people-follow-up-split"
    : "section people-follow-up-split";

  const cardActions = {
    savedPeople,
    hiddenPeople: [] as string[],
    onSave,
    onHide: () => {},
    onDetails: onShowDetails,
  };

  return (
    <section className={outerClass}>
      <div className="people-follow-up-split__layout">
        <div className="people-follow-up-split__column">
          <header className="people-follow-up-split__header">
            <p className="people-follow-up-split__kicker">People I&apos;m tracking</p>
            <h2 className="people-follow-up-split__title">Connections you want to follow up with.</h2>
            <p className="people-follow-up-split__note">
              People you saved or want to reconnect with during TechXchange.
            </p>
          </header>
          {tracked.length > 0 ? (
            <div className="people-follow-up-split__cards connection-cards-grid">
              {tracked.map(({ person, mutual }) => (
                <RecommendedConnectionCard
                  key={person.id}
                  person={person}
                  profileSignals={profileSignals}
                  badgeContext={{ isChampion: true }}
                  mutual={mutual}
                  actions={cardActions}
                />
              ))}
            </div>
          ) : (
            <p className="people-follow-up-split__empty">
              Save champions from Recommended Connections to track follow-ups here.
            </p>
          )}
        </div>

        <div className="people-follow-up-split__divider" role="separator" aria-orientation="vertical" />

        <div className="people-follow-up-split__column">
          <header className="people-follow-up-split__header">
            <p className="people-follow-up-split__kicker">Interested in you</p>
            <h2 className="people-follow-up-split__title">People interested in you.</h2>
            <p className="people-follow-up-split__note">
              Attendees who expressed interest in meeting you — including mutual matches.
            </p>
          </header>
          {inboundSignals.length > 0 ? (
            <div className="people-follow-up-split__cards connection-cards-grid">
              {inboundSignals.map(signal => {
                const mutual = inboundShowsMutual(signal, savedChampionRefs);
                const badges = inferInboundBadges(signal);
                return (
                  <RecommendedConnectionCard
                    key={signal.id}
                    person={inboundToRecommendedPerson(signal)}
                    profileSignals={profileSignals}
                    badges={badges}
                    primaryReason={signal.whyInterested ?? null}
                    mutual={mutual}
                    actions={cardActions}
                  />
                );
              })}
            </div>
          ) : (
            <p className="people-follow-up-split__empty">
              When someone signals interest in connecting, they will appear here.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
