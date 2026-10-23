import type { Category } from "@radar/core";
import { calculateItemScore } from "../../domain/scoring.js";
import { logger } from "../../lib/logger.js";
import type { DBAdapter } from "../../repositories/db.js";

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
  maxPerCategory: number = 5
): ScoredCandidate[] {
  logger.info(`Scoring items for digest date: ${todayStr}`);

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
        LIMIT 200`
    )
    .all(todayStr) as any[];

  const candidatesByCategory = new Map<Category, ScoredCandidate[]>();

  for (const row of rows) {
    const category = row.category as Category;
    const sourceWeight = row.source_weight ?? 1.0;
    const novelty = row.digest_appearances === 0 ? 1.0 : 0.2;

    const stars = row.stars ?? 0;
    const points = row.points ?? 0;
    const installs = row.installs ?? 0;

    const velocity = Math.min((stars + points * 2 + installs) / 1000, 1.0);
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

    if (!candidatesByCategory.has(category)) {
      candidatesByCategory.set(category, []);
    }
    candidatesByCategory.get(category)!.push(candidate);
  }

  const selected: ScoredCandidate[] = [];
  for (const [cat, list] of candidatesByCategory.entries()) {
    list.sort((a, b) => b.score - a.score);
    const top = list.slice(0, maxPerCategory);
    selected.push(...top);
    logger.info(`Selected top ${top.length} candidates for category=${cat}`);
  }

  return selected;
}
