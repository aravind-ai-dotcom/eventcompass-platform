"use client";

import { formatProofCount, proofCountLabel, useEventProofCounts } from "@/hooks/useEventProofCounts";

const ITEMS = [
  { key: "sessions" as const, label: "Sessions" },
  { key: "champions" as const, label: "Champions" },
  { key: "communities" as const, label: "IBM Communities" },
  { key: "attendees" as const, label: "Attendees" },
];

const FALLBACK = {
  sessions: 1400,
  champions: 600,
  communities: 200,
  attendees: 10000,
};

export default function HomeProofStrip() {
  const counts = useEventProofCounts();

  const showIdentityRow =
    counts.returningAttendeePct !== null ||
    counts.firstTimeAttendeePct !== null ||
    counts.championSignalCount > 0;

  return (
    <section className="home-proof-strip" aria-label="TechXchange scale">
      <ul className="home-proof-strip__list">
        {ITEMS.map(item => (
          <li key={item.key} className="home-proof-strip__item">
            <span className="home-proof-strip__value" aria-busy={counts.loading}>
              {proofCountLabel(counts[item.key], FALLBACK[item.key], counts.isLive)}
            </span>
            <span className="home-proof-strip__label">{item.label}</span>
          </li>
        ))}
      </ul>

      {showIdentityRow && !counts.loading && (
        <ul className="home-proof-strip__identity" aria-label="Audience identity signals">
          {counts.returningAttendeePct !== null && (
            <li className="home-proof-strip__identity-item">
              <span className="home-proof-strip__identity-value">{counts.returningAttendeePct}%</span>
              <span className="home-proof-strip__identity-label">returning attendees</span>
            </li>
          )}
          {counts.firstTimeAttendeePct !== null && (
            <li className="home-proof-strip__identity-item">
              <span className="home-proof-strip__identity-value">{counts.firstTimeAttendeePct}%</span>
              <span className="home-proof-strip__identity-label">first-time attendees</span>
            </li>
          )}
          <li className="home-proof-strip__identity-item">
            <span className="home-proof-strip__identity-value">
              {formatProofCount(
                counts.championSignalCount || FALLBACK.champions,
                true,
              )}
            </span>
            <span className="home-proof-strip__identity-label">IBM Champions expected</span>
          </li>
        </ul>
      )}
    </section>
  );
}
