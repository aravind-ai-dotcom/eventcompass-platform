"use client";

import FocusPersonCard from "@/components/experience/FocusPersonCard";
import FocusPersonRow from "@/components/experience/FocusPersonRow";
import type { RecommendedPerson, PersonActionState } from "@/components/people/RecommendedConnectionCard";
import type { ConnectionBadgeContext } from "@/lib/connectionBadges";
import type { InboundConnectionSignal } from "@/types/connectionSignals";
import type { ConnectionBadgeId } from "@/types/connectionSignals";
import { inboundShowsMutual, inboundDisplayName } from "@/lib/sampleConnectionSignals";

const FEATURED_COUNT = 3;

interface FocusPeopleSectionProps {
  recommended: RecommendedPerson[];
  wantToMeet: RecommendedPerson[];
  inboundSignals: InboundConnectionSignal[];
  savedChampionRefs: Array<{ id: string; display_name: string }>;
  profileSignals?: string[];
  badgeContext?: ConnectionBadgeContext;
  actions?: PersonActionState;
  onOpenDetails: (id: string) => void;
  recommendedMutualCheck?: (person: RecommendedPerson) => boolean;
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
    display_name: inboundDisplayName(signal),
    organization: signal.organization,
    profile: signal.domains?.length ? { domains: signal.domains } : undefined,
    compass_reasons: signal.whyInterested ? [signal.whyInterested] : undefined,
  };
}

export default function FocusPeopleSection({
  recommended,
  wantToMeet,
  inboundSignals,
  savedChampionRefs,
  profileSignals = [],
  badgeContext,
  actions,
  onOpenDetails,
  recommendedMutualCheck,
}: FocusPeopleSectionProps) {
  const featured = recommended.slice(0, FEATURED_COUNT);
  const inboundPeople = inboundSignals.slice(0, 8).map(inboundToRecommendedPerson);

  return (
    <div className="focus-people-section">
      <div className="focus-people-featured">
        <p className="focus-people-featured__kicker">Top recommendations</p>
        {featured.length > 0 ? (
          <div className="focus-people-featured__grid">
            {featured.map(person => (
              <FocusPersonCard
                key={person.id}
                person={person}
                profileSignals={profileSignals}
                badgeContext={{
                  ...badgeContext,
                  isSpeaker: person.is_speaker,
                }}
                mutual={recommendedMutualCheck?.(person)}
                actions={actions}
                onOpenDetails={onOpenDetails}
              />
            ))}
          </div>
        ) : (
          <p className="focus-people-section__empty">
            Complete your Compass profile to unlock people matches.
          </p>
        )}
      </div>

      <div className="focus-people-matchmaking">
        <div className="focus-people-column">
          <header className="focus-people-column__head">
            <h3 className="focus-people-column__title">
              People You Want To Meet
              <span className="focus-people-column__count">({wantToMeet.length})</span>
            </h3>
            <p className="focus-people-column__desc">Saved connections and follow-up candidates.</p>
          </header>
          <div className="focus-people-column__scroll">
            {wantToMeet.length > 0 ? (
              wantToMeet.map(person => (
                <FocusPersonRow
                  key={person.id}
                  person={person}
                  profileSignals={profileSignals}
                  actions={actions}
                  onOpenDetails={onOpenDetails}
                />
              ))
            ) : (
              <p className="focus-people-column__empty">
                Save people from recommendations to build your follow-up list.
              </p>
            )}
          </div>
        </div>

        <div className="focus-people-column">
          <header className="focus-people-column__head">
            <h3 className="focus-people-column__title">
              People Interested In You
              <span className="focus-people-column__count">({inboundSignals.length})</span>
            </h3>
            <p className="focus-people-column__desc">Attendees who signaled interest — including mutual matches.</p>
          </header>
          <div className="focus-people-column__scroll">
            {inboundSignals.length > 0 ? (
              inboundSignals.map(signal => {
                const person = inboundToRecommendedPerson(signal);
                const badges = inferInboundBadges(signal);
                return (
                  <FocusPersonRow
                    key={signal.id}
                    person={person}
                    profileSignals={profileSignals}
                    badges={badges}
                    mutual={inboundShowsMutual(signal, savedChampionRefs)}
                    actions={actions}
                    onOpenDetails={onOpenDetails}
                  />
                );
              })
            ) : (
              <p className="focus-people-column__empty">
                When someone signals interest in connecting, they will appear here.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
