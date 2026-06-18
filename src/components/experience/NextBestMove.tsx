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
  champion: { label: "Champion", symbol: "◈" },
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
      className="compass-score-badge"
      style={{
        minWidth: "72px",
        minHeight: "72px",
        justifySelf: "end",
      }}
      title={`Compass match score: ${score}`}
    >
      <span className="score-number" style={{ fontSize: "1.9rem" }}>
        {score}
      </span>
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
      className={variant === "primary" ? "btn-primary" : "btn-secondary"}
      style={{
        fontSize: "0.88rem",
        minHeight: "38px",
        padding: "0 18px",
        color: variant === "secondary" && muted ? "var(--muted)" : undefined,
        borderColor:
          variant === "secondary" && muted ? "var(--line)" : undefined,
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
    <section
      style={{
        border: "1px solid var(--accent)",
        background: "var(--panel)",
      }}
    >
      <div
        style={{
          padding: "30px 30px 28px",
          display: "grid",
          gridTemplateColumns: showSideScore
            ? "minmax(0, 1fr) 92px"
            : "minmax(0, 1fr)",
          gap: "28px",
          alignItems: "start",
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "18px",
              flexWrap: "wrap",
            }}
          >
            <span
              className="next-best-move-label"
              style={{ margin: 0, display: "block" }}
            >
              Your next best move
            </span>
            <TypeBadge type={nextBestMove.type} />
          </div>

          <h2
            style={{
              fontSize: "clamp(1.75rem, 3.2vw, 2.65rem)",
              lineHeight: 1,
              letterSpacing: "-0.048em",
              fontWeight: 520,
              margin: "0 0 12px",
              color: "var(--text)",
            }}
          >
            {nextBestMove.headline}
          </h2>

          {nextBestMove.subline && (
            <p
              style={{
                color: "var(--soft)",
                fontSize: "1rem",
                lineHeight: 1.5,
                margin: "0 0 18px",
              }}
            >
              {nextBestMove.subline}
            </p>
          )}

          {nextBestMove.type === "session" && intelSession ? (
            <div style={{ marginBottom: "22px" }}>
              <SessionIntelligencePanel
                session={intelSession}
                certLabel={certLabel}
                scoreSize="md"
                showKeySignals
              />
            </div>
          ) : nextBestMove.reason ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "44px minmax(0, 1fr)",
                gap: "10px",
                alignItems: "start",
                marginBottom: "22px",
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  color: "var(--accent)",
                  fontSize: "0.68rem",
                  fontWeight: 680,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  paddingTop: "3px",
                }}
              >
                Why
              </span>
              <p
                style={{
                  color: "var(--muted)",
                  fontSize: "0.95rem",
                  lineHeight: 1.58,
                  margin: 0,
                }}
              >
                {nextBestMove.reason}
              </p>
            </div>
          ) : null}

          <div
            style={{
              display: "flex",
              gap: "10px",
              flexWrap: "wrap",
            }}
          >
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