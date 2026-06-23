/** People + session pillars — "Your week in balance" fuel-cell card. */
export default function WeekInBalance({
  people,
  learning,
  community,
  fun,
  compact = false,
  strip = false,
}: {
  people: number;
  learning: number;
  community: number;
  fun: number;
  compact?: boolean;
  strip?: boolean;
}) {
  const sessionTotal = learning + community + fun;
  const total = people + sessionTotal;
  const BASE = 80;
  const peopleW = total > 0 ? Math.round((people / total) * BASE) : 0;
  const learnW = total > 0 ? Math.round((learning / total) * BASE) : 0;
  const commW = total > 0 ? Math.round((community / total) * BASE) : 0;
  const funW = total > 0 ? Math.round((fun / total) * BASE) : 0;
  const openW = Math.max(0, 100 - peopleW - learnW - commW - funW);

  const segments = [
    { label: "People", w: peopleW, color: "#8a3ffc" },
    { label: "Learning", w: learnW, color: "var(--accent)" },
    { label: "Networking", w: commW, color: "var(--purple-soft)" },
    { label: "Fun", w: funW, color: "#009d9a" },
    { label: "Open", w: openW, color: "var(--line-strong)" },
  ].filter(s => s.w > 0);

  const peoplePct = total > 0 ? Math.round((people / total) * 100) : 0;
  const learnPct = total > 0 ? Math.round((learning / total) * 100) : 0;
  const commPct = total > 0 ? Math.round((community / total) * 100) : 0;
  const funPct = total > 0 ? Math.round((fun / total) * 100) : 0;
  const summary = `People ${peoplePct}% · Learning ${learnPct}% · Networking ${commPct}% · Fun ${funPct}%`;

  const bar = (
    <div
      className={`week-balance-bar${strip ? " focus-metric-row__track" : ""}`}
      title={summary}
    >
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
        <span className="focus-metric-row__label">Balance</span>
        <div className="focus-metric-block__body">
          <p className="focus-metric-block__summary">{summary}</p>
          {bar}
          <div className="focus-metric-block__legend week-balance-legend">
            {[
              { label: "People", count: people, color: "#8a3ffc" },
              { label: "Learning", count: learning, color: "var(--accent)" },
              { label: "Networking", count: community, color: "var(--purple-soft)" },
              { label: "Fun", count: fun, color: "#009d9a" },
            ].map(item => (
              <span key={item.label} className="week-balance-legend-item">
                <span className="week-balance-swatch" style={{ background: item.color }} />
                {item.label}
                {total > 0 && <em>{item.count}</em>}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`week-balance-card${compact ? " week-balance-card--compact" : ""}`}>
      <p className="week-balance-kicker">Your week in balance</p>
      <p className="week-balance-sub">{summary}</p>
      {bar}
      {!compact && (
        <div className="week-balance-legend">
          {[
            { label: "People", count: people, color: "#8a3ffc" },
            { label: "Learning", count: learning, color: "var(--accent)" },
            { label: "Networking", count: community, color: "var(--purple-soft)" },
            { label: "Fun", count: fun, color: "#009d9a" },
          ].map(item => (
            <span key={item.label} className="week-balance-legend-item">
              <span className="week-balance-swatch" style={{ background: item.color }} />
              {item.label}
              {total > 0 && <em>{item.count}</em>}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
