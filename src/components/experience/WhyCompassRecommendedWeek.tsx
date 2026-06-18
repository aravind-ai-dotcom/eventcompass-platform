"use client";

interface WhyCompassRecommendedWeekProps {
  signals: string[];
  embedded?: boolean;
  defaultOpen?: boolean;
}

export default function WhyCompassRecommendedWeek({
  signals,
  embedded = false,
  defaultOpen = false,
}: WhyCompassRecommendedWeekProps) {
  const items = signals.filter(Boolean);
  if (items.length === 0) return null;

  return (
    <section className={embedded ? "compass-module-block why-compass-trust-section" : "section why-compass-trust-section"}>
      <details className="why-compass-trust" open={defaultOpen || undefined}>
        <summary className="why-compass-trust-summary">
          <span className="section-kicker">Your intent</span>
          <span className="why-compass-trust-title">Why Compass shaped this week for you</span>
        </summary>
        <div className="why-compass-trust-body">
          <p className="why-compass-trust-lead">Compass is prioritizing around:</p>
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
