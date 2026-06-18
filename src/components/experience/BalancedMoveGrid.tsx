"use client";

import type { NextBestMove } from "@/types";
import { pillarFromMoveType, type ExperiencePillar } from "@/lib/recommendationBalancing";

const PILLAR_LABELS: Record<ExperiencePillar, string> = {
  learning: "Learning",
  people: "People",
  community: "Community",
  fun: "Fun",
};

const PILLAR_COLORS: Record<ExperiencePillar, string> = {
  learning: "var(--accent)",
  people: "#8a3ffc",
  community: "#0D9488",
  fun: "#D97706",
};

interface BalancedMoveGridProps {
  moves: NextBestMove[];
}

export default function BalancedMoveGrid({ moves }: BalancedMoveGridProps) {
  if (moves.length === 0) return null;

  return (
    <div className="balanced-move-grid" role="list" aria-label="Balanced recommendations across learning, people, community, and fun">
      {moves.map(move => {
        const pillar = pillarFromMoveType(move.type);
        return (
          <article key={`${move.type}-${move.entityId ?? move.headline}`} className="balanced-move-card" role="listitem">
            <p
              className="balanced-move-card__pillar"
              style={{ color: PILLAR_COLORS[pillar] }}
            >
              {PILLAR_LABELS[pillar]}
            </p>
            <h3 className="balanced-move-card__title">{move.headline}</h3>
            {move.subline && <p className="balanced-move-card__meta">{move.subline}</p>}
            {move.reason && <p className="balanced-move-card__reason">{move.reason}</p>}
          </article>
        );
      })}
    </div>
  );
}
