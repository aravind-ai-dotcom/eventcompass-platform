// ─────────────────────────────────────────────────────────────────────────────
// CompassScore — score badge shown on SessionCard, ChampionCard, ParticipantHero
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  score: number;
  /** Show a colored ring when score is high */
  size?: "sm" | "md" | "lg";
}

function scoreLabel(score: number): string {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Strong";
  if (score >= 40) return "Good";
  if (score >= 20) return "Some fit";
  return "General";
}

export default function CompassScore({ score, size = "md" }: Props) {
  const sizeMap = {
    sm: { badge: "42px", number: "1.1rem" },
    md: { badge: "54px", number: "1.45rem" },
    lg: { badge: "72px", number: "2rem" },
  };
  const { badge, number } = sizeMap[size];

  return (
    <div
      className="compass-score-badge"
      style={{ minWidth: badge, minHeight: badge }}
      title={`Compass score: ${score} — ${scoreLabel(score)}`}
    >
      <span className="score-number" style={{ fontSize: number }}>
        {score}
      </span>
      <span className="score-label">fit</span>
    </div>
  );
}
