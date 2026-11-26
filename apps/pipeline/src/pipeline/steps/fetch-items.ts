import { computeContentHash, normalizeUrl, sha256Hex } from "@radar/core";
import { logger } from "../../lib/logger.js";
import type { ItemsRepository } from "../../repositories/items-repo.js";
import type { SourceAdapter } from "../../sources/source.js";

export interface SourceRunStat {
  key: string;
  fetched: number;
  error?: string;
}

export interface FetchResult {
  itemsFetched: number;
  itemsNew: number;
  sourceStats: SourceRunStat[];
}

export async function fetchAllSources(
  sources: SourceAdapter[],
  itemsRepo: ItemsRepository,
  todayStr: string
): Promise<FetchResult> {
  let itemsFetched = 0;
  let itemsNew = 0;
  const sourceStats: SourceRunStat[] = [];

  for (const source of sources) {
    let fetched = 0;

    try {
      logger.info(`Running source fetcher: ${source.name} [key=${source.key}]`);
      const rawItems = await source.fetchItems();
      fetched = rawItems.length;
      itemsFetched += fetched;

      for (const raw of rawItems) {
        const normalizedUrl = normalizeUrl(raw.url);
        const urlHash = await sha256Hex(normalizedUrl);
        const contentHash = await computeContentHash(raw.title, raw.description);

        const { id, isNew } = itemsRepo.upsertItem({
          sourceKey: source.key,
          externalId: raw.externalId,
          category: raw.category,
          url: normalizedUrl,
          urlHash,
          title: raw.title,
          description: raw.description,
          author: raw.author,
          programmingLanguage: raw.programmingLanguage,
          license: raw.license,
          publishedAt: raw.publishedAt,
          contentHash,
          rawJson: raw.rawJson,
        });

        if (isNew) {
          itemsNew++;
        }

        // Record daily snapshot metrics
        itemsRepo.recordMetrics({
          itemId: id,
          date: todayStr,
          stars: raw.stars,
          forks: raw.forks,
          points: raw.points,
          comments: raw.comments,
          installs: raw.installs,
          rating: raw.rating,
        });
      }

      sourceStats.push({ key: source.key, fetched });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error(`Error fetching source [${source.key}]: ${message}`);
      sourceStats.push({ key: source.key, fetched, error: message });
    }
  }

  return { itemsFetched, itemsNew, sourceStats };
}
