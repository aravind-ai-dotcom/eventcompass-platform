"use client";

import { useState } from "react";
import type { InboundConnectionSignal, SavedPersonSignal } from "@/types/connectionSignals";
import { SAMPLE_INBOUND_SIGNALS, inboundShowsMutual } from "@/lib/sampleConnectionSignals";

interface ConnectionSignalsProps {
  savedPeople: SavedPersonSignal[];
  inboundSignals?: InboundConnectionSignal[];
  isLoggedIn: boolean;
  onShowDetails?: (personId: string) => void;
  embedded?: boolean;
}

const MOBILE_CHIP_LIMIT = 2;

function collectSignalChips(domains: string[] = [], intent: string[] = []): string[] {
  return [...intent, ...domains];
}

function SavedSignalCard({
  person,
  onShowDetails,
}: {
  person: SavedPersonSignal;
  onShowDetails?: (personId: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const chips = collectSignalChips(person.domains, person.intentSnapshot);
  const hiddenChipCount = Math.max(0, chips.length - MOBILE_CHIP_LIMIT);
  const hasExtraChips = hiddenChipCount > 0;
  const hasExtraCopy = Boolean(
    (person.matchReasons && person.matchReasons.length > 0) || person.mutual,
  );
  const showMoreToggle = hasExtraChips || hasExtraCopy;

  return (
    <article className={`connection-signal-card${expanded ? " connection-signal-card--expanded" : ""}`}>
      <div className="connection-signal-card-head">
        <div className="connection-signal-card-identity">
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

      {chips.length > 0 && (
        <div className="connection-signal-tags">
          {chips.map((tag, index) => (
            <span
              key={tag}
              className={`connection-signal-tag${!expanded && index >= MOBILE_CHIP_LIMIT ? " connection-signal-tag--mobile-collapsed" : ""}`}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {showMoreToggle && (
        <button
          type="button"
          className="connection-signal-more-toggle"
          aria-expanded={expanded}
          onClick={() => setExpanded(open => !open)}
        >
          {expanded ? "Less" : hasExtraChips ? `More signals (+${hiddenChipCount})` : "More signals"}
        </button>
      )}

      <div className="connection-signal-extra">
        {person.matchReasons && person.matchReasons.length > 0 && (
          <p className="connection-signal-reason">{person.matchReasons[0]}</p>
        )}
        {person.mutual && (
          <p className="connection-signal-mutual-copy">
            You both signaled interest. Compass can help suggest a good moment to connect.
          </p>
        )}
      </div>

      {onShowDetails ? (
        <button type="button" className="action-chip" onClick={() => onShowDetails(person.id)}>
          Details
        </button>
      ) : null}
    </article>
  );
}

function InboundSignalCard({
  signal,
  mutual,
}: {
  signal: InboundConnectionSignal;
  mutual: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const chips = collectSignalChips(signal.domains, signal.intentSnapshot);
  const hiddenChipCount = Math.max(0, chips.length - MOBILE_CHIP_LIMIT);
  const hasExtraChips = hiddenChipCount > 0;
  const hasExtraCopy = Boolean(signal.whyInterested || mutual);
  const showMoreToggle = hasExtraChips || hasExtraCopy;

  return (
    <article className={`connection-signal-card connection-signal-card--inbound${expanded ? " connection-signal-card--expanded" : ""}`}>
      <div className="connection-signal-card-head">
        <div className="connection-signal-card-identity">
          <p className="connection-signal-name">{signal.fromFirstName}</p>
          <p className="connection-signal-meta">Saved you for {signal.topic}</p>
          {signal.organization && (
            <p className="connection-signal-meta">{signal.organization}</p>
          )}
        </div>
      </div>

      {chips.length > 0 && (
        <div className="connection-signal-tags">
          {chips.map((tag, index) => (
            <span
              key={tag}
              className={`connection-signal-tag${!expanded && index >= MOBILE_CHIP_LIMIT ? " connection-signal-tag--mobile-collapsed" : ""}`}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {showMoreToggle && (
        <button
          type="button"
          className="connection-signal-more-toggle"
          aria-expanded={expanded}
          onClick={() => setExpanded(open => !open)}
        >
          {expanded ? "Less" : hasExtraChips ? `More signals (+${hiddenChipCount})` : "More signals"}
        </button>
      )}

      <div className="connection-signal-extra">
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
      </div>
    </article>
  );
}

export default function ConnectionSignals({
  savedPeople,
  inboundSignals = SAMPLE_INBOUND_SIGNALS,
  isLoggedIn,
  onShowDetails,
  embedded = false,
}: ConnectionSignalsProps) {
  if (!isLoggedIn) return null;

  const savedChampionRefs = savedPeople.map(p => ({
    id: p.id,
    display_name: p.displayName,
  }));

  return (
    <section className={embedded ? "compass-module-block connection-signals-section" : "section connection-signals-section"}>
      <div className="section-head narrow">
        <div>
          <div className="section-kicker">Connection signals</div>
          <h2>Professional connections worth your attention.</h2>
        </div>
        <p>
          These attendees have signaled interest in connecting based on shared goals,
          expertise, or topic interests.
        </p>
      </div>

      <div className="connection-signals-grid">
        <div className="connection-signals-column">
          <h3 className="connection-signals-column-title">People I&apos;ve Saved</h3>
          {savedPeople.length === 0 ? (
            <p className="connection-signals-empty">
              No saved people yet. Save experts from Champions or My Compass to build your list.
            </p>
          ) : (
            <ul className="connection-signals-list">
              {savedPeople.map(person => (
                <li key={person.id}>
                  <SavedSignalCard person={person} onShowDetails={onShowDetails} />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="connection-signals-column">
          <h3 className="connection-signals-column-title">Connections Worth Exploring</h3>
          {inboundSignals.length === 0 ? (
            <p className="connection-signals-empty">
              No inbound signals yet. As more attendees build their Compass, people who save you will appear here.
            </p>
          ) : (
            <ul className="connection-signals-list">
              {inboundSignals.map(signal => (
                <li key={signal.id}>
                  <InboundSignalCard
                    signal={signal}
                    mutual={inboundShowsMutual(signal, savedChampionRefs)}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
