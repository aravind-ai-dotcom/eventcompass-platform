"use client";

import type { InboundConnectionSignal, SavedPersonSignal } from "@/types/connectionSignals";
import { SAMPLE_INBOUND_SIGNALS, inboundShowsMutual } from "@/lib/sampleConnectionSignals";

interface ConnectionSignalsProps {
  savedPeople: SavedPersonSignal[];
  inboundSignals?: InboundConnectionSignal[];
  isLoggedIn: boolean;
  onShowDetails?: (personId: string) => void;
}

export default function ConnectionSignals({
  savedPeople,
  inboundSignals = SAMPLE_INBOUND_SIGNALS,
  isLoggedIn,
  onShowDetails,
}: ConnectionSignalsProps) {
  if (!isLoggedIn) return null;

  const savedChampionRefs = savedPeople.map(p => ({
    id: p.id,
    display_name: p.displayName,
  }));

  return (
    <section className="section connection-signals-section">
      <div className="section-head narrow">
        <div>
          <div className="section-kicker">Connection Signals</div>
          <h2>Meaningful connections forming around your profile.</h2>
        </div>
        <p>
          When you save someone, they can see that interest. When someone saves you, they appear here as an inbound signal.
        </p>
      </div>

      <div className="connection-signals-grid">
        <div className="connection-signals-column">
          <h3 className="connection-signals-column-title">People I saved</h3>
          {savedPeople.length === 0 ? (
            <p className="connection-signals-empty">
              No saved people yet. Save experts from Champions or My Experience to build your list.
            </p>
          ) : (
            <ul className="connection-signals-list">
              {savedPeople.map(person => (
                <li key={person.id}>
                  <article className="connection-signal-card">
                    <div className="connection-signal-card-head">
                      <div>
                        <p className="connection-signal-name">{person.displayName}</p>
                        {(person.title || person.organization) && (
                          <p className="connection-signal-meta">
                            {[person.title, person.organization].filter(Boolean).join(" · ")}
                          </p>
                        )}
                      </div>
                      {person.mutual && (
                        <span className="connection-signal-badge connection-signal-badge--mutual">
                          Mutual interest
                        </span>
                      )}
                    </div>
                    {person.domains && person.domains.length > 0 && (
                      <div className="connection-signal-tags">
                        {person.domains.slice(0, 3).map(tag => (
                          <span key={tag} className="connection-signal-tag">{tag}</span>
                        ))}
                      </div>
                    )}
                    {person.intentSnapshot && person.intentSnapshot.length > 0 && (
                      <div className="champion-person-intent">
                        {person.intentSnapshot.slice(0, 2).map(item => (
                          <span key={item} className="champion-person-intent-tag">{item}</span>
                        ))}
                      </div>
                    )}
                    {person.matchReasons && person.matchReasons.length > 0 && (
                      <p className="connection-signal-reason">
                        {person.matchReasons[0]}
                      </p>
                    )}
                    {person.mutual && (
                      <p className="connection-signal-mutual-copy">
                        You both signaled interest. Compass can help suggest a good moment to connect.
                      </p>
                    )}
                    {onShowDetails ? (
                      <button type="button" className="action-chip" onClick={() => onShowDetails(person.id)}>
                        Details
                      </button>
                    ) : null}
                  </article>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="connection-signals-column">
          <h3 className="connection-signals-column-title">People interested in me</h3>
          {inboundSignals.length === 0 ? (
            <p className="connection-signals-empty">
              No inbound signals yet. As more attendees build their Compass, people who save you will appear here.
            </p>
          ) : (
            <ul className="connection-signals-list">
              {inboundSignals.map(signal => {
                const mutual = inboundShowsMutual(signal, savedChampionRefs);
                return (
                  <li key={signal.id}>
                    <article className="connection-signal-card connection-signal-card--inbound">
                      <div className="connection-signal-card-head">
                        <div>
                          <p className="connection-signal-name">{signal.fromFirstName}</p>
                          <p className="connection-signal-meta">
                            Saved you for {signal.topic}
                          </p>
                          {signal.organization && (
                            <p className="connection-signal-meta">{signal.organization}</p>
                          )}
                        </div>
                      </div>
                      {signal.domains && signal.domains.length > 0 && (
                        <div className="connection-signal-tags">
                          {signal.domains.map(tag => (
                            <span key={tag} className="connection-signal-tag">{tag}</span>
                          ))}
                        </div>
                      )}
                      {signal.intentSnapshot && signal.intentSnapshot.length > 0 && (
                        <div className="champion-person-intent">
                          {signal.intentSnapshot.map(item => (
                            <span key={item} className="champion-person-intent-tag">{item}</span>
                          ))}
                        </div>
                      )}
                      {signal.whyInterested && (
                        <p className="connection-signal-reason">{signal.whyInterested}</p>
                      )}
                      {mutual && (
                        <>
                          <span className="connection-signal-badge connection-signal-badge--mutual">
                            Mutual interest
                          </span>
                          <p className="connection-signal-mutual-copy">
                            You both signaled interest. Compass can help suggest a good moment to connect.
                          </p>
                        </>
                      )}
                    </article>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
