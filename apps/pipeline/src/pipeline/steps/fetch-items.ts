import { computeContentHash, normalizeUrl, sha256Hex } from "@radar/core";
import { logger } from "../../lib/logger.js";
import type { ItemsRepository } from "../../repositories/items-repo.js";
import type { SourceAdapter } from "../../sources/source.js";

export interface FetchResult {
  itemsFetched: number;
  itemsNew: number;
}

export async function fetchAllSources(
  sources: SourceAdapter[],
  itemsRepo: ItemsRepository,
  todayStr: string
): Promise<FetchResult> {
  let itemsFetched = 0;
  let itemsNew = 0;

  for (const source of sources) {
    try {
      logger.info(`Running source fetcher: ${source.name} [key=${source.key}]`);
      const rawItems = await source.fetchItems();
      itemsFetched += rawItems.length;

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
    } catch (err: any) {
      logger.error(`Error fetching source [${source.key}]: ${err.message}`);
    }
  }

  return { itemsFetched, itemsNew };
}
