/** Admin-tunable pillar weights for recommendation balancing (defaults = 1 each). */
export interface PillarWeights {
  learning: number;
  people: number;
  community: number;
  fun: number;
}

export const DEFAULT_PILLAR_WEIGHTS: PillarWeights = {
  learning: 1,
  people: 1,
  community: 1,
  fun: 1,
};

export interface RecommendationBalanceConfig {
  pillar_weights: PillarWeights;
  updated_at?: string;
  updated_by?: string;
}
