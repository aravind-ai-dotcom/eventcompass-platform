"use client";

interface WhyCompassRecommendedWeekProps {
  signals: string[];
}

export default function WhyCompassRecommendedWeek({ signals }: WhyCompassRecommendedWeekProps) {
  const items = signals.filter(Boolean);
  if (items.length === 0) return null;

  return (
    <section className="section why-compass-trust-section">
      <details className="why-compass-trust">
        <summary className="why-compass-trust-summary">
          <span className="section-kicker">Transparency</span>
          <span className="why-compass-trust-title">Why Compass recommended this week</span>
        </summary>
        <div className="why-compass-trust-body">
          <p className="why-compass-trust-lead">Based on:</p>
          <ul className="why-compass-trust-list">
            {items.map(item => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </details>
    </section>
  );
}
