"use client";

import PulseDonutBox, { alumniDonutSegments } from "@/components/pulse/PulseDonutBox";
import { proofCountLabel, useEventProofCounts } from "@/hooks/useEventProofCounts";

const STATS = [
  { key: "sessions" as const, label: "Sessions" },
  { key: "champions" as const, label: "Expert Champions" },
  { key: "communities" as const, label: "IBM Communities" },
] as const;

const FALLBACK = {
  sessions: 1400,
  champions: 600,
  communities: 200,
  attendees: 10000,
};

export default function HomeProofStrip() {
  const counts = useEventProofCounts();

  const alumniSegments =
    counts.alumniReturning != null && counts.alumniFirstTime != null
      ? alumniDonutSegments(counts.alumniReturning, counts.alumniFirstTime)
      : [];
  const showAlumniJourney = alumniSegments.length >= 2;

  return (
    <section className="home-proof-strip" aria-label="TechXchange scale">
      <ul className="home-proof-strip__list">
        {STATS.map(item => (
          <li key={item.key} className="home-proof-strip__item">
            <span className="home-proof-strip__value" aria-busy={counts.loading}>
              {proofCountLabel(counts[item.key], FALLBACK[item.key], counts.isLive)}
            </span>
            <span className="home-proof-strip__label">{item.label}</span>
          </li>
        ))}

        {showAlumniJourney && !counts.loading && (
          <li className="home-proof-strip__item home-proof-strip__item--journey">
            <PulseDonutBox
              embed
              split
              title="TechXchange Journey"
              segments={alumniSegments}
            />
          </li>
        )}
      </ul>
    </section>
  );
}
