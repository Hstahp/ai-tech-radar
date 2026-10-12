export interface ScoringFactors {
  /** Delta stars or points since previous snapshot (0 to 1 normalized) */
  velocity: number;
  /** Recency score based on publication / first seen date (0 to 1 normalized) */
  recency: number;
  /** Quality score based on language, license, rating (0 to 1 normalized) */
  quality: number;
  /** Source weight factor (e.g. GitHub Search = 1.0, HN = 0.9, Trending = 0.6) */
  sourceWeight: number;
  /** Novelty score: 1.0 if item has never been in a published digest, 0.0 otherwise */
  novelty: number;
}

export function calculateItemScore(factors: ScoringFactors): number {
  const v = Math.min(Math.max(factors.velocity, 0), 1);
  const r = Math.min(Math.max(factors.recency, 0), 1);
  const q = Math.min(Math.max(factors.quality, 0), 1);
  const sw = Math.min(Math.max(factors.sourceWeight, 0), 1);
  const n = Math.min(Math.max(factors.novelty, 0), 1);

  const score = 0.4 * v + 0.2 * r + 0.2 * q + 0.1 * sw + 0.1 * n;
  return Math.round(score * 10000) / 10000;
}
