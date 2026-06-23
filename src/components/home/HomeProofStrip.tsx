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

const JOURNEY_FALLBACK = {
  returning: 47,
  firstTime: 53,
};

function homeJourneySegments(returning: number | null, firstTime: number | null) {
  const ret = returning != null && returning > 0 ? returning : JOURNEY_FALLBACK.returning;
  const first = firstTime != null && firstTime > 0 ? firstTime : JOURNEY_FALLBACK.firstTime;
  return alumniDonutSegments(ret, first).map(segment => ({
    ...segment,
    label:
      segment.label === "Returning Attendees"
        ? "Returning"
        : segment.label === "First-Time Attendees"
          ? "First-time"
          : segment.label,
  }));
}

export default function HomeProofStrip() {
  const counts = useEventProofCounts();
  const alumniSegments = homeJourneySegments(counts.alumniReturning, counts.alumniFirstTime);

  return (
    <section className="home-proof-strip" aria-label="TechXchange scale">
      <ul className="home-proof-strip__list home-proof-strip__list--with-journey">
        {STATS.map(item => (
          <li key={item.key} className="home-proof-strip__item">
            <span className="home-proof-strip__value" aria-busy={counts.loading}>
              {proofCountLabel(counts[item.key], FALLBACK[item.key], counts.isLive)}
            </span>
            <span className="home-proof-strip__label">{item.label}</span>
          </li>
        ))}

        <li className="home-proof-strip__item home-proof-strip__item--journey" aria-busy={counts.loading}>
          <PulseDonutBox
            embed
            mini
            split
            title="TechXchange Journey"
            segments={alumniSegments}
          />
        </li>
      </ul>
    </section>
  );
}
