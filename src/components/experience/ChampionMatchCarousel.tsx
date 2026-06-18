"use client";

import { useCallback, useState } from "react";

interface ChampionMatchCarouselProps {
  count: number;
  children: React.ReactNode[];
}

export default function ChampionMatchCarousel({ count, children }: ChampionMatchCarouselProps) {
  const [index, setIndex] = useState(0);
  const max = Math.max(0, count - 1);

  const go = useCallback(
    (delta: number) => {
      setIndex(i => Math.max(0, Math.min(max, i + delta)));
    },
    [max],
  );

  if (count === 0) return null;

  return (
    <div className="champion-match-carousel">
      <div className="champion-match-carousel-track" aria-live="polite">
        {children[index]}
      </div>
      {count > 1 && (
        <div className="champion-match-carousel-controls">
          <button
            type="button"
            className="champion-match-carousel-btn"
            onClick={() => go(-1)}
            disabled={index === 0}
            aria-label="Previous champion"
          >
            ←
          </button>
          <span className="champion-match-carousel-count">
            {index + 1} / {count}
          </span>
          <button
            type="button"
            className="champion-match-carousel-btn"
            onClick={() => go(1)}
            disabled={index >= max}
            aria-label="Next champion"
          >
            →
          </button>
        </div>
      )}
    </div>
  );
}
