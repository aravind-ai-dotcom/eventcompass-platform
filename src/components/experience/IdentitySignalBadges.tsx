"use client";

import {
  formatAlumHistorySubtitle,
  getIdentityBadges,
  getIdentityWelcomeLine,
  parseIdentitySignals,
} from "@/lib/identitySignals";

interface IdentitySignalBadgesProps {
  participant: Record<string, unknown>;
  firstName?: string;
  compact?: boolean;
}

export default function IdentitySignalBadges({
  participant,
  firstName,
  compact = false,
}: IdentitySignalBadgesProps) {
  const signals = parseIdentitySignals(participant);
  const badges = getIdentityBadges(signals);
  const welcome = compact ? null : getIdentityWelcomeLine(signals, firstName);
  const historyLine = signals?.attended_txc_before === true
    ? formatAlumHistorySubtitle(signals.techxchange_history)
    : null;

  if (badges.length === 0 && !welcome && !historyLine) return null;

  return (
    <div className="identity-signal-badges">
      {welcome && <p className="identity-signal-badges__welcome">{welcome}</p>}
      {badges.length > 0 && (
        <div className="identity-signal-badges__row" aria-label="TechXchange identity">
          {badges.map(badge => (
            <span
              key={badge.id}
              className={`identity-signal-badge identity-signal-badge--${badge.variant}`}
            >
              {badge.label}
            </span>
          ))}
        </div>
      )}
      {historyLine && (
        <p className="identity-signal-badges__history">{historyLine}</p>
      )}
    </div>
  );
}
