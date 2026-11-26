import type { Category } from "@radar/core";
import { calculateItemScore } from "../../domain/scoring.js";
import { calculateDailyVelocity } from "../../domain/metrics.js";
import { dedupeCandidates } from "../../domain/dedupe.js";
import { selectTopCandidates, type SelectionOptions } from "../../domain/selection.js";
import { logger } from "../../lib/logger.js";
import type { DBAdapter } from "../../repositories/db.js";
import { MetricsRepository } from "../../repositories/metrics-repo.js";

const CANDIDATE_POOL_LIMIT = 500;

export interface ScoredCandidate {
  id: number;
  category: Category;
  title: string;
  url: string;
  urlHash?: string;
  description: string;
  contentHash: string;
  publishedAt?: string;
  stars?: number;
  points?: number;
  installs?: number;
  score: number;
}

export function scoreAndSelectCandidates(
  db: DBAdapter,
  todayStr: string,
  options: SelectionOptions = {}
): ScoredCandidate[] {
  logger.info(`Scoring items for digest date: ${todayStr}`);

  const deltaRows = new MetricsRepository(db).getDeltasForDate(todayStr);
  const deltaByItem = new Map(deltaRows.map((row) => [row.itemId, row]));

  // Fetch active items with metrics
  const rows = db
    .prepare(
      `SELECT i.id, i.category, i.title, i.url, i.url_hash, i.description, i.content_hash, i.published_at,
              s.weight AS source_weight,
              m.stars, m.points, m.installs,
              (SELECT COUNT(*) FROM digest_items di WHERE di.item_id = i.id) AS digest_appearances
         FROM items i
         JOIN sources s ON s.id = i.source_id
    LEFT JOIN metrics m ON m.item_id = i.id AND m.date = ?
        WHERE i.status = 'active'
        ORDER BY i.first_seen_at DESC
        LIMIT ?`
    )
    .all(todayStr, CANDIDATE_POOL_LIMIT) as any[];

  const allCandidates: ScoredCandidate[] = [];

  for (const row of rows) {
    const category = row.category as Category;
    const sourceWeight = row.source_weight ?? 1.0;
    const novelty = row.digest_appearances === 0 ? 1.0 : 0.2;

    const deltaRow = deltaByItem.get(row.id);
    const velocity = deltaRow
      ? calculateDailyVelocity(deltaRow.previous, deltaRow.current, deltaRow.days)
      : 0;
    const recency = 0.8;
    const quality = row.description && row.description.length > 20 ? 0.9 : 0.5;

    const score = calculateItemScore({
      velocity,
      recency,
      quality,
      sourceWeight,
      novelty,
    });

    const candidate: ScoredCandidate = {
      id: row.id,
      category,
      title: row.title,
      url: row.url,
      urlHash: row.url_hash,
      description: row.description || "",
      contentHash: row.content_hash,
      publishedAt: row.published_at,
      stars: row.stars,
      points: row.points,
      installs: row.installs,
      score,
    };

    allCandidates.push(candidate);
  }

  const deduped = dedupeCandidates(allCandidates);
  const duplicatesRemoved = allCandidates.length - deduped.length;
  if (duplicatesRemoved > 0) {
    logger.info(`Removed ${duplicatesRemoved} duplicate candidates before selection.`);
  }

  const selected = selectTopCandidates(deduped, options);
  const counts = new Map<Category, number>();
  for (const candidate of selected) {
    counts.set(candidate.category, (counts.get(candidate.category) ?? 0) + 1);
  }
  for (const [category, count] of counts.entries()) {
    logger.info(`Selected ${count} candidates for category=${category}`);
  }

  return selected;
}
