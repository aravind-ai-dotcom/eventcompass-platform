"use client";

import type { NextBestMove } from "@/types";
import { pillarFromMoveType, type ExperiencePillar } from "@/lib/recommendationBalancing";

const PILLAR_ORDER: ExperiencePillar[] = ["learning", "people", "community", "fun"];

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

  const groups = PILLAR_ORDER.map(pillar => ({
    pillar,
    moves: moves.filter(move => pillarFromMoveType(move.type) === pillar),
  })).filter(group => group.moves.length > 0);

  return (
    <div
      className="balanced-move-groups"
      aria-label="Balanced recommendations across learning, people, community, and fun"
    >
      {groups.map(({ pillar, moves: pillarMoves }) => (
        <section
          key={pillar}
          className="balanced-move-group"
          aria-labelledby={`balanced-move-group-${pillar}`}
        >
          <header className="balanced-move-group__head">
            <h3
              id={`balanced-move-group-${pillar}`}
              className="balanced-move-group__title"
              style={{ color: PILLAR_COLORS[pillar] }}
            >
              {PILLAR_LABELS[pillar]}
            </h3>
          </header>
          <div className="balanced-move-group__cards" role="list">
            {pillarMoves.map(move => (
              <article
                key={`${move.type}-${move.entityId ?? move.headline}`}
                className="balanced-move-card"
                role="listitem"
              >
                <p
                  className="balanced-move-card__pillar"
                  style={{ color: PILLAR_COLORS[pillar] }}
                >
                  {PILLAR_LABELS[pillar]}
                </p>
                <h4 className="balanced-move-card__title">{move.headline}</h4>
                {move.subline && <p className="balanced-move-card__meta">{move.subline}</p>}
                {move.reason && <p className="balanced-move-card__reason">{move.reason}</p>}
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
