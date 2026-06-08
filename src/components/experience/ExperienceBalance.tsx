// =============================================================================
// EventCompass — Experience Balance
// src/components/experience/ExperienceBalance.tsx
//
// Phase 8: Shows attendees whether they are experiencing the event holistically.
// Derived from recommendations + schedule composition.
// Three pillars: Community | Learning | Fun
// =============================================================================

interface PillarCount {
  community: number;
  learning:  number;
  fun:       number;
}

interface Props {
  sessionCounts: PillarCount;   // scored sessions per pillar
  attendedCounts?: PillarCount; // optional: sessions actually attended
}

const PILLAR_CONFIG = [
  { key: "learning"  as const, label: "Learning",  color: "var(--accent)",  desc: "Labs, workshops, and technical sessions" },
  { key: "community" as const, label: "Community", color: "#0D9488",        desc: "Champions, experts, and peer connections" },
  { key: "fun"       as const, label: "Fun",        color: "#D97706",        desc: "Keynotes, receptions, and social moments" },
];

function BalanceBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  const filled = Math.round(pct / 10);

  return (
    <div
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`${pct}%`}
      style={{ display: "flex", alignItems: "center", gap: "6px" }}
    >
      <div style={{ flex: 1, height: "8px", background: "var(--line)", position: "relative", overflow: "hidden" }}>
        <div style={{
          position: "absolute", left: 0, top: 0, bottom: 0,
          width: `${pct}%`,
          background: color,
          transition: "width 0.6s ease-out",
        }} />
      </div>
      <span style={{ fontFamily: "var(--font-mono, ui-monospace)", fontSize: "0.78rem", color: "var(--muted)", minWidth: "36px", textAlign: "right" }}>
        {pct}%
      </span>
    </div>
  );
}

function getBalanceInsight(counts: PillarCount): string {
  const total = counts.learning + counts.community + counts.fun;
  if (total === 0) return "Complete your Compass profile to see your experience balance.";

  const pct = {
    learning:  counts.learning  / total,
    community: counts.community / total,
    fun:       counts.fun       / total,
  };

  if (pct.learning > 0.7)  return "Your plan is heavily Learning-focused. Consider adding community and social moments.";
  if (pct.fun > 0.5)       return "Your plan leans toward social experiences. Great for energy — balance with focused learning.";
  if (pct.community < 0.1) return "Your plan has very little Community time. Champions and peer conversations often create the most value.";
  if (pct.learning > 0.5 && pct.community > 0.25) return "Well balanced. Learning is your priority with strong community time.";
  return "Good mix across all three pillars. Compass will keep nudging you toward the right experience.";
}

export default function ExperienceBalance({ sessionCounts, attendedCounts }: Props) {
  const total  = sessionCounts.learning + sessionCounts.community + sessionCounts.fun;
  const insight = getBalanceInsight(sessionCounts);

  return (
    <div
      style={{
        border:     "1px solid var(--line)",
        background: "var(--panel)",
        padding:    "22px 24px",
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "20px", flexWrap: "wrap", gap: "8px" }}>
        <div>
          <p style={{ color: "var(--accent)", fontSize: "0.72rem", fontWeight: 680, textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 3px" }}>
            Experience balance
          </p>
          <p style={{ color: "var(--text)", fontSize: "1.05rem", fontWeight: 560, margin: 0, letterSpacing: "-0.02em" }}>
            {total > 0 ? `${total} matched sessions` : "Building your profile…"}
          </p>
        </div>
        {attendedCounts && (
          <p style={{ color: "var(--muted)", fontSize: "0.82rem", margin: 0 }}>
            Attended: {attendedCounts.learning + attendedCounts.community + attendedCounts.fun} sessions
          </p>
        )}
      </div>

      <div style={{ display: "grid", gap: "14px", marginBottom: "18px" }}>
        {PILLAR_CONFIG.map(pillar => {
          const count       = sessionCounts[pillar.key];
          const attended    = attendedCounts?.[pillar.key];
          return (
            <div key={pillar.key}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ fontWeight: 600, fontSize: "0.88rem", color: "var(--text)" }}>
                  {pillar.label}
                </span>
                <span style={{ color: "var(--muted)", fontSize: "0.82rem" }}>
                  {count} sessions{attended !== undefined ? ` · ${attended} attended` : ""}
                </span>
              </div>
              <BalanceBar value={count} max={total} color={pillar.color} />
              <p style={{ color: "var(--muted)", fontSize: "0.76rem", margin: "4px 0 0" }}>
                {pillar.desc}
              </p>
            </div>
          );
        })}
      </div>

      {/* Compass insight */}
      <div style={{ borderTop: "1px solid var(--line)", paddingTop: "14px" }}>
        <p style={{ color: "var(--muted)", fontSize: "0.84rem", lineHeight: 1.55, margin: 0 }}>
          <span style={{ color: "var(--accent)", fontWeight: 650 }}>Compass: </span>
          {insight}
        </p>
      </div>
    </div>
  );
}
