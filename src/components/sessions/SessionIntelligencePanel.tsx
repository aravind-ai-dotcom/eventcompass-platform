"use client";

import { useState } from "react";
import {
  buildSessionIntelligence,
  SESSION_BADGE_LABELS,
  SESSION_SIGNAL_LABELS,
  type SessionIntelInput,
} from "@/lib/sessionIntelligence";

interface SessionIntelligencePanelProps {
  session: SessionIntelInput;
  certLabel?: string | null;
  scoreSize?: "sm" | "md";
  /** Show 2 reasons by default; expand for all (mobile-friendly). */
  collapsible?: boolean;
  showKeySignals?: boolean;
}

function MatchScoreBadge({ score, size = "sm" }: { score: number; size?: "sm" | "md" }) {
  if (score <= 0) return null;
  const dim = size === "md"
    ? { minWidth: 54, minHeight: 54, num: "1.2rem" }
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

export default function SessionIntelligencePanel({
  session,
  certLabel,
  scoreSize = "sm",
  collapsible = true,
  showKeySignals = true,
}: SessionIntelligencePanelProps) {
  const [expanded, setExpanded] = useState(false);
  const intel = buildSessionIntelligence(session, certLabel);
  const visibleReasons = collapsible && !expanded
    ? intel.reasons.slice(0, 2)
    : intel.reasons;
  const hasMore = collapsible && intel.reasons.length > 2;

  return (
    <div className="session-intelligence-panel">
      <div className="session-intelligence-head">
        <MatchScoreBadge score={intel.score} size={scoreSize} />
        <div className="session-intelligence-head-copy">
          <p className="session-intelligence-kicker">Why Compass recommended this</p>
          {intel.score > 0 && (
            <p className="session-intelligence-score-note">{intel.score}% match to your profile</p>
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
          {expanded ? "Show fewer reasons" : `Show ${intel.reasons.length - 2} more reasons`}
        </button>
      )}

      {showKeySignals && intel.signals.length > 0 && (
        <div className="session-intelligence-signals">
          <p className="session-intelligence-signals-kicker">Key signals</p>
          <div className="session-intelligence-signal-row">
            {intel.signals.map(id => (
              <span key={id} className="session-intelligence-signal">
                {SESSION_SIGNAL_LABELS[id]}
              </span>
            ))}
          </div>
        </div>
      )}

      {intel.badges.length > 0 && (
        <div className="session-badge-row">
          {intel.badges.map(id => (
            <span key={id} className={`session-badge session-badge--${id}`}>
              {SESSION_BADGE_LABELS[id]}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
