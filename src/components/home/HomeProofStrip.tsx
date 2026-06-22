"use client";

import { proofCountLabel, useEventProofCounts } from "@/hooks/useEventProofCounts";

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
    </section>
  );
}
