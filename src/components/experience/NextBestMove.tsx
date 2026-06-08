// =============================================================================
// EventCompass — Next Best Move Component
// src/components/experience/NextBestMove.tsx
//
// The centerpiece of the Compass experience.
// One recommendation. Immediate clarity. Concierge quality.
//
// Card anatomy (full-width, accent-bordered):
//
//   ╔══════════════════════════════════════════════╗
//   ║  YOUR NEXT BEST MOVE    [▶ Session]   [score]║
//   ║                                              ║
//   ║  Attend: AI on IBM Z                         ║
//   ║  Breakout · Monday · 09:00 · Room 14B        ║
//   ║                                              ║
//   ║  Why  Top match for your AI and cloud goals  ║
//   ║                                              ║
//   ║  [View Details]  [Done]  [Skip]              ║
//   ╠══════════════════════════════════════════════╣
//   ║  VOICE COMPASS                               ║
//   ║  [Ask Compass]                               ║
//   ║  "You said / Compass says" result area       ║
//   ╚══════════════════════════════════════════════╝
//
// Design rules:
//   - globals.css CSS tokens only (var(--accent), var(--panel), etc.)
//   - No Tailwind, no new CSS classes, no inline colour hex
//   - No Firestore writes in this component
//   - Voice section is VoiceCompassButton embedded as a lower panel
// =============================================================================

import type {
  NextBestMove as NextBestMoveType,
  ScoredSession,
  ScoredChampion,
} from "@/types";
import VoiceCompassButton from "@/components/voice/VoiceCompassButton";

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

interface NextBestMoveProps {
  nextBestMove:   NextBestMoveType;
  topSession?:    ScoredSession | null;
  topChampion?:   ScoredChampion | null;
  onSkip?:        () => void;
  onDone?:        () => void;
  onViewDetails?: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Type badge metadata — one entry per NextBestMoveType value
// ─────────────────────────────────────────────────────────────────────────────

const TYPE_META: Record<
  NextBestMoveType["type"],
  { label: string; symbol: string }
> = {
  session:   { label: "Session",   symbol: "▶" },
  champion:  { label: "Champion",  symbol: "◈" },
  community: { label: "Community", symbol: "◉" },
  break:     { label: "Break",     symbol: "◌" },
  explore:   { label: "Explore",   symbol: "◎" },
};

// ─────────────────────────────────────────────────────────────────────────────
// TypeBadge — accent-outlined pill with symbol + label
// ─────────────────────────────────────────────────────────────────────────────

function TypeBadge({ type }: { type: NextBestMoveType["type"] }) {
  const { label, symbol } = TYPE_META[type];
  return (
    <span
      aria-label={`Recommendation type: ${label}`}
      style={{
        display:       "inline-flex",
        alignItems:    "center",
        gap:           "5px",
        height:        "24px",
        padding:       "0 10px",
        border:        "1px solid var(--accent)",
        color:         "var(--accent)",
        fontSize:      "0.68rem",
        fontWeight:    680,
        letterSpacing: "0.11em",
        textTransform: "uppercase",
        flexShrink:    0,
        whiteSpace:    "nowrap",
      }}
    >
      <span aria-hidden="true" style={{ fontSize: "0.75rem" }}>{symbol}</span>
      {label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ScoreBadge — renders as .compass-score-badge class from globals.css
// ─────────────────────────────────────────────────────────────────────────────

function ScoreBadge({ score }: { score: number }) {
  return (
    <div
      className="compass-score-badge"
      style={{ minWidth: "64px", minHeight: "64px" }}
      title={`Compass match score: ${score}`}
    >
      <span className="score-number" style={{ fontSize: "1.8rem" }}>
        {score}
      </span>
      <span className="score-label">match</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ActionButton — wraps btn-primary / btn-secondary with consistent sizing
// ─────────────────────────────────────────────────────────────────────────────

function ActionButton({
  label,
  variant,
  onClick,
  muted,
}: {
  label:    string;
  variant:  "primary" | "secondary";
  onClick?: () => void;
  muted?:   boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={variant === "primary" ? "btn-primary" : "btn-secondary"}
      style={{
        fontSize:    "0.88rem",
        minHeight:   "38px",
        padding:     "0 18px",
        color:       variant === "secondary" && muted ? "var(--muted)" : undefined,
        borderColor: variant === "secondary" && muted ? "var(--line)" : undefined,
        cursor:      onClick ? "pointer" : "default",
        opacity:     onClick ? 1 : 0.5,
      }}
      disabled={!onClick}
    >
      {label}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export default function NextBestMove({
  nextBestMove,
  topSession,
  topChampion,
  onSkip,
  onDone,
  onViewDetails,
}: NextBestMoveProps) {
  const hasScore = typeof nextBestMove.score === "number" && nextBestMove.score > 0;

  return (
    <div
      style={{
        border:     "1px solid var(--accent)",
        background: "var(--panel)",
      }}
    >

      {/* ══ Panel 1: Recommendation ════════════════════════════════════════ */}
      <div
        style={{
          padding: "28px 28px 26px",
          display: "grid",
          // Two columns: content | score badge (badge collapses when absent)
          gridTemplateColumns: hasScore
            ? "minmax(0, 1fr) auto"
            : "minmax(0, 1fr)",
          gap:        "24px",
          alignItems: "start",
        }}
      >

        {/* Left column: all recommendation copy + actions */}
        <div>

          {/* Row: kicker + type badge */}
          <div
            style={{
              display:      "flex",
              alignItems:   "center",
              gap:          "12px",
              marginBottom: "18px",
              flexWrap:     "wrap",
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

          {/* Headline — the primary action */}
          <h2
            style={{
              fontSize:      "clamp(1.8rem, 3.2vw, 2.8rem)",
              lineHeight:    1.0,
              letterSpacing: "-0.048em",
              fontWeight:    520,
              margin:        "0 0 12px",
              color:         "var(--text)",
            }}
          >
            {nextBestMove.headline}
          </h2>

          {/* Subline — logistics: time, room, org, availability */}
          {nextBestMove.subline && (
            <p
              style={{
                color:      "var(--soft)",
                fontSize:   "1rem",
                lineHeight: 1.5,
                margin:     "0 0 18px",
              }}
            >
              {nextBestMove.subline}
            </p>
          )}

          {/* Reason — why Compass surfaced this */}
          {nextBestMove.reason && (
            <div
              style={{
                display:    "flex",
                gap:        "10px",
                alignItems: "flex-start",
                marginBottom: "22px",
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  color:         "var(--accent)",
                  fontSize:      "0.68rem",
                  fontWeight:    680,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  paddingTop:    "3px",
                  flexShrink:    0,
                  minWidth:      "30px",
                }}
              >
                Why
              </span>
              <p
                style={{
                  color:      "var(--muted)",
                  fontSize:   "0.95rem",
                  lineHeight: 1.58,
                  margin:     0,
                }}
              >
                {nextBestMove.reason}
              </p>
            </div>
          )}

          {/* Action buttons */}
          <div
            style={{
              display:  "flex",
              gap:      "10px",
              flexWrap: "wrap",
            }}
          >
            <ActionButton
              label="View Details"
              variant="primary"
              onClick={onViewDetails}
            />
            <ActionButton
              label="Done"
              variant="secondary"
              onClick={onDone}
            />
            <ActionButton
              label="Skip"
              variant="secondary"
              onClick={onSkip}
              muted
            />
          </div>
        </div>

        {/* Right column: score badge */}
        {hasScore && <ScoreBadge score={nextBestMove.score as number} />}
      </div>

      {/* ══ Divider ════════════════════════════════════════════════════════ */}
      <div
        style={{
          height:     "1px",
          background: "var(--line)",
        }}
      />

      {/* ══ Panel 2: Voice Compass ══════════════════════════════════════════
          VoiceCompassButton renders with its own border+panel styling.
          We strip its outer border entirely here so it reads as a seamless
          lower panel of this card — the horizontal divider above is the
          only visual separator.
      ═══════════════════════════════════════════════════════════════════════ */}
      <div
        style={{
          // Override VoiceCompassButton's outer border to nothing,
          // since the card border already frames the whole component.
          // We achieve this by wrapping in a div that masks the inner border.
        }}
      >
        {/*
          VoiceCompassButton applies:  border: 1px solid var(--line)
          We cancel that by wrapping in a negative-margin div that pulls the
          inner border outside our clip area, then clip. Cleanest approach:
          override the div's own border via a wrapper with overflow hidden.
        */}
        <div
          style={{
            margin:   "-1px",        // pull VoiceCompassButton's border to align with card border
            overflow: "hidden",
          }}
        >
          <VoiceCompassButton
            nextBestMove={nextBestMove}
            topSession={topSession ?? null}
            topChampion={topChampion ?? null}
            onDismiss={onSkip}
            onMarkAttended={onDone}
          />
        </div>
      </div>

    </div>
  );
}
