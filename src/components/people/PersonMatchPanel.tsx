"use client";

import { useState } from "react";
import {
  CONNECTION_BADGE_LABELS,
} from "@/lib/connectionBadges";
import type { ConnectionBadgeId } from "@/types/connectionSignals";
import {
  buildPersonIntelligence,
  type PersonIntelInput,
  type PersonSignalId,
  PERSON_SIGNAL_LABELS,
} from "@/lib/personIntelligence";

const DEFAULT_VISIBLE = 3;

interface PersonMatchPanelProps {
  person: PersonIntelInput;
  profileSignals?: string[];
  badges?: ConnectionBadgeId[];
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

function buildKeySignalChips(
  signals: PersonSignalId[],
  badges: ConnectionBadgeId[],
  person: PersonIntelInput,
): string[] {
  const chips: string[] = [];
  for (const id of signals) {
    chips.push(PERSON_SIGNAL_LABELS[id]);
  }
  for (const badge of badges) {
    chips.push(CONNECTION_BADGE_LABELS[badge]);
  }
  for (const domain of [...(person.profile?.domains ?? []), ...(person.profile?.products ?? [])].slice(0, 3)) {
    if (!chips.some(c => c.toLowerCase() === domain.toLowerCase())) {
      chips.push(domain);
    }
  }
  return [...new Set(chips)].slice(0, 8);
}

export default function PersonMatchPanel({
  person,
  profileSignals = [],
  badges = [],
  compact = false,
  initialVisible = DEFAULT_VISIBLE,
}: PersonMatchPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const intel = buildPersonIntelligence(person, profileSignals);
  const visibleReasons = !expanded
    ? intel.reasons.slice(0, initialVisible)
    : intel.reasons;
  const hasMore = intel.reasons.length > initialVisible;
  const keySignals = buildKeySignalChips(intel.signals, badges, person);

  if (intel.score <= 0 && intel.reasons.length === 0) return null;

  return (
    <div className={`session-intelligence-panel person-intelligence-panel${compact ? " person-intelligence-panel--compact" : ""}`}>
      <div className="session-intelligence-head">
        <MatchScoreBadge score={intel.score} compact={compact} />
        <div className="session-intelligence-head-copy">
          <p className="session-intelligence-kicker">Why Compass matched this person</p>
          {intel.score > 0 && (
            <p className="session-intelligence-score-note">
              {intel.score}% match to your profile
            </p>
          )}
        </div>
      </div>

      {visibleReasons.length > 0 && (
        <ul className="session-intelligence-reasons">
          {visibleReasons.map(reason => (
            <li key={reason}>
              <span className="session-intelligence-check" aria-hidden="true">✓</span>
              {reason}
            </li>
          ))}
        </ul>
      )}

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

      {keySignals.length > 0 && (
        <div className="session-intelligence-signals">
          <p className="session-intelligence-signals-kicker">Key signals</p>
          <div className="session-intelligence-signal-row">
            {keySignals.map(chip => (
              <span key={chip} className="session-intelligence-signal">
                {chip}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export { buildPersonIntelligence };
