"use client";

import { useState } from "react";
import {
  buildPublicSessionReasons,
  buildSessionIntelligence,
  resolvePublicSessionHighlight,
  SESSION_BADGE_LABELS,
  SESSION_SIGNAL_LABELS,
  type SessionIntelInput,
} from "@/lib/sessionIntelligence";

interface SessionIntelInputWithId extends SessionIntelInput {
  id?: string;
  title?: string;
}

interface SessionIntelligencePanelProps {
  session: SessionIntelInputWithId;
  certLabel?: string | null;
  scoreSize?: "sm" | "md";
  collapsible?: boolean;
  showKeySignals?: boolean;
  initialVisible?: number;
  /** Signed-out catalog — no match % or profile-based copy. */
  anonymous?: boolean;
}

const DEFAULT_VISIBLE_REASONS = 3;

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
  initialVisible = DEFAULT_VISIBLE_REASONS,
  anonymous = false,
}: SessionIntelligencePanelProps) {
  const [expanded, setExpanded] = useState(false);
  const intel = buildSessionIntelligence(session, certLabel);

  if (anonymous) {
    const publicReasons = buildPublicSessionReasons(session);
    const highlight = resolvePublicSessionHighlight(session);
    return (
      <div className="session-intelligence-panel session-intelligence-panel--public">
        <p className="session-intelligence-kicker">{highlight}</p>
        {publicReasons.length > 0 && (
          <ul className="session-intelligence-reasons">
            {publicReasons.map(reason => (
              <li key={reason}>
                <span className="session-intelligence-check" aria-hidden="true">✓</span>
                {reason}
              </li>
            ))}
          </ul>
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

  const visibleReasons = collapsible && !expanded
    ? intel.reasons.slice(0, initialVisible)
    : intel.reasons;
  const hasMore = collapsible && intel.reasons.length > initialVisible;

  return (
    <div className="session-intelligence-panel">
      <div className="session-intelligence-head">
        <MatchScoreBadge score={intel.score} size={scoreSize} />
        <div className="session-intelligence-head-copy">
          <p className="session-intelligence-kicker">Recommended because:</p>
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
          {expanded ? "Show fewer reasons" : `Show ${intel.reasons.length - initialVisible} more reason${intel.reasons.length - initialVisible === 1 ? "" : "s"}`}
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
