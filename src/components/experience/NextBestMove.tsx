// =============================================================================
// EventCompass — Next Best Move Component
// src/components/experience/NextBestMove.tsx
// =============================================================================

import Link from "next/link";
import type { NextBestMove as NextBestMoveData } from "@/types";
import SessionIntelligencePanel from "@/components/sessions/SessionIntelligencePanel";
import type { SessionIntelInput } from "@/lib/sessionIntelligence";

interface NextBestMoveProps {
  nextBestMove:        NextBestMoveData;
  intelSession?:       SessionIntelInput | null;
  certLabel?:          string | null;
  onSkip?: () => void;
  onDone?: () => void;
  onViewDetails?: () => void;
}

const TYPE_META: Record<
  NextBestMoveData["type"],
  { label: string; symbol: string }
> = {
  session: { label: "Session", symbol: "▶" },
  champion: { label: "People", symbol: "◈" },
  community: { label: "Community", symbol: "◉" },
  break: { label: "Fun", symbol: "◌" },
  explore: { label: "Explore", symbol: "◎" },
  register: { label: "Register", symbol: "◇" },
  profile: { label: "Profile", symbol: "◆" },
  certification_goal: { label: "Certification", symbol: "◐" },
};

function TypeBadge({ type }: { type: NextBestMoveData["type"] }) {
  const { label, symbol } = TYPE_META[type];

  return (
    <span
      aria-label={`Recommendation type: ${label}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        height: "26px",
        padding: "0 11px",
        border: "1px solid var(--accent)",
        color: "var(--accent)",
        fontSize: "0.68rem",
        fontWeight: 680,
        letterSpacing: "0.11em",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
      }}
    >
      <span aria-hidden="true">{symbol}</span>
      {label}
    </span>
  );
}

function ScoreBadge({ score }: { score: number }) {
  return (
    <div
      className="compass-score-badge next-best-move-card__score"
      title={`Compass match score: ${score}`}
    >
      <span className="score-number">{score}</span>
      <span className="score-label">match</span>
    </div>
  );
}

function ActionButton({
  label,
  variant,
  onClick,
  href,
  muted,
}: {
  label: string;
  variant: "primary" | "secondary";
  onClick?: () => void;
  href?: string;
  muted?: boolean;
}) {
  const className = [
    variant === "primary" ? "btn-primary" : "btn-secondary",
    "next-best-move-card__action",
    variant === "secondary" && muted ? "next-best-move-card__action--muted" : "",
  ].filter(Boolean).join(" ");

  if (href && !onClick) {
    return (
      <Link href={href} className={className}>
        {label}
      </Link>
    );
  }

  return (
    <button
      onClick={onClick}
      className={className}
      style={{
        cursor: onClick ? "pointer" : "default",
        opacity: onClick ? 1 : 0.55,
      }}
      disabled={!onClick}
    >
      {label}
    </button>
  );
}

export default function NextBestMove({
  nextBestMove,
  intelSession,
  certLabel,
  onSkip,
  onDone,
  onViewDetails,
}: NextBestMoveProps) {
  const whyCopy = nextBestMove.whyItMatters ?? nextBestMove.reason;
  const hasScore =
    typeof nextBestMove.score === "number" && nextBestMove.score > 0;
  const showSideScore = hasScore && !(nextBestMove.type === "session" && intelSession);
  const primaryCtaLabel = nextBestMove.ctaLabel;
  const primaryCtaHref = nextBestMove.ctaHref;

  return (
    <section className="next-best-move-card">
      <div
        className={`next-best-move-card__layout${showSideScore ? " next-best-move-card__layout--scored" : ""}`}
      >
        <div className="next-best-move-card__main">
          <div className="next-best-move-card__head">
            <span className="next-best-move-label" style={{ margin: 0, display: "block" }}>
              Your next best move
            </span>
            <TypeBadge type={nextBestMove.type} />
          </div>

          <h2 className="next-best-move-card__headline">
            {nextBestMove.headline}
          </h2>

          {nextBestMove.subline && (
            <p className="next-best-move-card__subline">
              {nextBestMove.subline}
            </p>
          )}

          {nextBestMove.type === "session" && intelSession ? (
            <div className="next-best-move-card__intel">
              <SessionIntelligencePanel
                session={intelSession}
                certLabel={certLabel}
                scoreSize="md"
                showKeySignals
              />
            </div>
          ) : whyCopy ? (
            <div className="next-best-move-card__reason">
              <span className="next-best-move-card__reason-label" aria-hidden="true">
                Why this matters
              </span>
              <p className="next-best-move-card__reason-copy">
                {whyCopy}
              </p>
            </div>
          ) : null}

          <div className="next-best-move-card__actions">
            {primaryCtaLabel && (
              <ActionButton
                label={primaryCtaLabel}
                variant="primary"
                href={primaryCtaHref}
                onClick={onViewDetails && !primaryCtaHref ? onViewDetails : undefined}
              />
            )}
            {!primaryCtaLabel && onViewDetails && (
              <ActionButton label="View Details" variant="primary" onClick={onViewDetails} />
            )}
            {onDone && <ActionButton label="Done" variant="secondary" onClick={onDone} />}
            {onSkip && (
              <ActionButton label="Skip" variant="secondary" onClick={onSkip} muted />
            )}
          </div>
        </div>

        {showSideScore && <ScoreBadge score={nextBestMove.score as number} />}
      </div>
    </section>
  );
}
