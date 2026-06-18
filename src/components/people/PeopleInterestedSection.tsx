"use client";

import type { InboundConnectionSignal } from "@/types/connectionSignals";
import { CONNECTION_BADGE_LABELS } from "@/lib/connectionBadges";
import type { ConnectionBadgeId } from "@/types/connectionSignals";
import { inboundShowsMutual } from "@/lib/sampleConnectionSignals";

interface PeopleInterestedSectionProps {
  inboundSignals: InboundConnectionSignal[];
  savedChampionRefs: Array<{ id: string; display_name: string }>;
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

export default function PeopleInterestedSection({
  inboundSignals,
  savedChampionRefs,
  embedded = false,
}: PeopleInterestedSectionProps) {
  if (inboundSignals.length === 0) return null;

  return (
    <section className={embedded ? "compass-module-block people-interested-section" : "section people-interested-section"}>
      <div className="section-head narrow">
        <div>
          <div className="section-kicker">People interested in connecting</div>
          <h2>People interested in you.</h2>
        </div>
        <p className="section-head-note">
          These attendees have expressed interest in meeting you during the event.
        </p>
      </div>

      <div className="recommended-connections-stack">
        {inboundSignals.map(signal => {
          const mutual = inboundShowsMutual(signal, savedChampionRefs);
          const badges = inferInboundBadges(signal);
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
    </section>
  );
}
