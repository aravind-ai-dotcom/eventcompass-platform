"use client";

import { useState } from "react";
import {
  buildPersonIntelligence,
  PERSON_SIGNAL_LABELS,
  type PersonIntelInput,
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
    <div className={`session-intelligence-panel person-match-panel${compact ? " person-match-panel--compact" : ""}`}>
      <div className="session-intelligence-head">
        <MatchScoreBadge score={intel.score} compact={compact} />
        <div className="session-intelligence-head-copy">
          <p className="session-intelligence-kicker">Why Compass matched this person</p>
          {intel.score > 0 && (
            <p className="session-intelligence-score-note">
              {intel.score}% match across {intel.signals.length > 0
                ? intel.signals.map(s => PERSON_SIGNAL_LABELS[s].toLowerCase()).join(", ")
                : "your profile signals"}
            </p>
          )}
        </div>
      </div>

      <ul className="session-intelligence-reasons">
        {visibleReasons.map(reason => (
          <li key={reason}>
            <span className="session-intelligence-check" aria-hidden="true">✓</span>
            {reason}
          </li>
        ))}
      </ul>

      {hasMore && (
        <button
          type="button"
          className="session-intelligence-expand"
          onClick={() => setExpanded(v => !v)}
          aria-expanded={expanded}
        >
          {expanded
            ? "Show fewer reasons"
            : `Show ${intel.reasons.length - initialVisible} more reason${intel.reasons.length - initialVisible === 1 ? "" : "s"}`}
        </button>
      )}

      {intel.signals.length > 0 && (
        <div className="session-intelligence-signals">
          <p className="session-intelligence-signals-kicker">Match dimensions</p>
          <div className="session-intelligence-signal-row">
            {intel.signals.map(id => (
              <span key={id} className="session-intelligence-signal">
                {PERSON_SIGNAL_LABELS[id]}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
