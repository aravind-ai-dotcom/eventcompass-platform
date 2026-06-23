"use client";

import HomeJourneyTile from "@/components/home/HomeJourneyTile";
import { alumniDonutSegments } from "@/components/pulse/PulseDonutBox";
import { FORGE_LABELS, FORGE_PRODUCT } from "@/config/forgeBrand";
import { proofCountLabel, useEventProofCounts } from "@/hooks/useEventProofCounts";

const STATS = [
  { key: "sessions" as const, label: "Sessions" },
  { key: "champions" as const, label: FORGE_LABELS.expertGuides },
  { key: "communities" as const, label: FORGE_LABELS.communities },
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
    <section className="home-proof-strip" aria-label="FORGE scale">
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
          <HomeJourneyTile segments={alumniSegments} title={FORGE_PRODUCT.forgeJourney} />
        </li>
      </ul>
    </section>
  );
}
