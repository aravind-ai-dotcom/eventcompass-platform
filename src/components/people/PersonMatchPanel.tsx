"use client";

import { useState } from "react";
import {
  buildPersonIntelligence,
  PERSON_SIGNAL_LABELS,
  type PersonIntelInput,
  type PersonSignalId,
} from "@/lib/personIntelligence";

const DEFAULT_VISIBLE = 3;

interface PersonMatchPanelProps {
  person: PersonIntelInput;
  profileSignals?: string[];
  compact?: boolean;
  initialVisible?: number;
}

function MatchScoreBadge({ score, compact }: { score: number; compact?: boolean }) {
  if (score <= 0) return null;
  const dim = compact
    ? { minWidth: 42, minHeight: 42, num: "0.95rem" }
    : { minWidth: 46, minHeight: 46, num: "1.05rem" };
  return (
    <div
      className="compass-score-badge session-intel-score"
      style={{ minWidth: dim.minWidth, minHeight: dim.minHeight, flexShrink: 0 }}
      title={`${score}% match`}
    >
      <span className="score-number" style={{ fontSize: dim.num }}>{score}%</span>
      <span className="score-label">match</span>
    </div>
  );
}

function MatchDimensionBars({
  signals,
  strengths,
}: {
  signals: PersonSignalId[];
  strengths: Partial<Record<PersonSignalId, number>>;
}) {
  if (signals.length === 0) return null;

  return (
    <div className="person-match-dimensions">
      <p className="person-match-dimensions__kicker">Match dimensions</p>
      <div className="person-match-dimensions__list">
        {signals.map(id => {
          const strength = strengths[id] ?? 50;
          return (
            <div key={id} className="person-match-dimension">
              <div className="person-match-dimension__head">
                <span className="person-match-dimension__label">{PERSON_SIGNAL_LABELS[id]}</span>
                <span className="person-match-dimension__value">{strength}%</span>
              </div>
              <div className="person-match-dimension__track" aria-hidden="true">
                <div
                  className="person-match-dimension__fill"
                  style={{ width: `${strength}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function PersonMatchPanel({
  person,
  profileSignals = [],
  compact = false,
  initialVisible = DEFAULT_VISIBLE,
}: PersonMatchPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const intel = buildPersonIntelligence(person, profileSignals);
  const visibleReasons = !expanded
    ? intel.reasons.slice(0, initialVisible)
    : intel.reasons;
  const hasMore = intel.reasons.length > initialVisible;

  if (intel.score <= 0 && intel.reasons.length === 0) return null;

  return (
    <div className={`person-match-panel${compact ? " person-match-panel--compact" : ""}`}>
      <div className="person-match-panel__head">
        <MatchScoreBadge score={intel.score} compact={compact} />
        <div className="person-match-panel__head-copy">
          <p className="person-match-panel__kicker">Why Compass matched this person</p>
          {intel.score > 0 && (
            <p className="person-match-panel__score-note">
              {intel.score}% alignment to your profile
            </p>
          )}
        </div>
      </div>

      {visibleReasons.length > 0 && (
        <ul className="person-match-panel__reasons">
          {visibleReasons.map(reason => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      )}

      {hasMore && (
        <button
          type="button"
          className="person-match-panel__expand"
          onClick={() => setExpanded(v => !v)}
          aria-expanded={expanded}
        >
          {expanded
            ? "Show fewer reasons"
            : `Show ${intel.reasons.length - initialVisible} more`}
        </button>
      )}

      <MatchDimensionBars signals={intel.signals} strengths={intel.signalStrengths} />
    </div>
  );
}
