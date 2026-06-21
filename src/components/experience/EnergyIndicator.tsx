/** Session-pillar energy bar — Learning · Networking · Fun (+ open time). */
export default function EnergyIndicator({
  learning,
  community,
  fun,
  compact = false,
  strip = false,
}: {
  learning: number;
  community: number;
  fun: number;
  compact?: boolean;
  strip?: boolean;
}) {
  const total = learning + community + fun;
  const BASE = 80;
  const learnW = total > 0 ? Math.round((learning / total) * BASE) : 0;
  const commW = total > 0 ? Math.round((community / total) * BASE) : 0;
  const funW = total > 0 ? Math.round((fun / total) * BASE) : 0;
  const openW = Math.max(0, 100 - learnW - commW - funW);

  const segments = [
    { label: "Learning", w: learnW, color: "#0f62fe" },
    { label: "Networking", w: commW, color: "var(--purple-soft)" },
    { label: "Fun", w: funW, color: "#009d9a" },
    { label: "Open", w: openW, color: "var(--line-strong)" },
  ].filter(s => s.w > 0);

  const bar = (
    <div className={`week-balance-bar compass-energy-bar${strip ? " focus-metric-row__track" : ""}`}>
      {total === 0 ? (
        <div className="week-balance-bar-empty" />
      ) : (
        segments.map(s => (
          <div
            key={s.label}
            className="week-balance-segment"
            style={{ flex: s.w, background: s.color }}
            title={s.label}
          />
        ))
      )}
    </div>
  );

  if (strip) {
    return (
      <div className="focus-metric-block">
        <span className="focus-metric-row__label">Energy</span>
        <div className="focus-metric-block__body">
          {bar}
          <div className="focus-metric-block__legend week-balance-legend">
            {segments.filter(s => s.label !== "Open").map(s => (
              <span key={s.label} className="week-balance-legend-item">
                <span className="week-balance-swatch" style={{ background: s.color }} />
                {s.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`compass-energy-card${compact ? " compass-energy-card--compact" : ""}`}>
      <p className="compass-signal-kicker">Energy</p>
      {bar}
      {!compact && (
        <div className="week-balance-legend">
          {segments.filter(s => s.label !== "Open").map(s => (
            <span key={s.label} className="week-balance-legend-item">
              <span className="week-balance-swatch" style={{ background: s.color }} />
              {s.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
