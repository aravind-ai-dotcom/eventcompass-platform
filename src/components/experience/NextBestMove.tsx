// =============================================================================
// EventCompass — Next Best Move Component
// src/components/experience/NextBestMove.tsx
// =============================================================================

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
  break: { label: "Break", symbol: "◌" },
  explore: { label: "Explore", symbol: "◎" },
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
  muted,
}: {
  label: string;
  variant: "primary" | "secondary";
  onClick?: () => void;
  muted?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        variant === "primary" ? "btn-primary" : "btn-secondary",
        "next-best-move-card__action",
        variant === "secondary" && muted ? "next-best-move-card__action--muted" : "",
      ].filter(Boolean).join(" ")}
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
  const hasScore =
    typeof nextBestMove.score === "number" && nextBestMove.score > 0;
  const showSideScore = hasScore && !(nextBestMove.type === "session" && intelSession);

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
          ) : nextBestMove.reason ? (
            <div className="next-best-move-card__reason">
              <span className="next-best-move-card__reason-label" aria-hidden="true">
                Why
              </span>
              <p className="next-best-move-card__reason-copy">
                {nextBestMove.reason}
              </p>
            </div>
          ) : null}

          <div className="next-best-move-card__actions">
            {onViewDetails && (
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
