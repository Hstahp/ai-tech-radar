import fs from "node:fs";
import path from "node:path";
import { PROMPT_VERSION } from "@radar/core";
import { logger } from "../../lib/logger.js";
import type { DigestsRepository } from "../../repositories/digests-repo.js";
import type { ScoredCandidate } from "./score-items.js";

export function publishAndExportDigest(
  digestsRepo: DigestsRepository,
  digestDate: string,
  candidates: ScoredCandidate[],
  exportDir: string,
  providerName: string,
  modelName: string
): void {
  logger.info(`Publishing digest for date: ${digestDate}`);

  const digestId = digestsRepo.createOrUpdateDigest(digestDate, "published", providerName, modelName, PROMPT_VERSION);

  const digestItems = candidates.map((cand, index) => ({
    itemId: cand.id,
    section: cand.category,
    rank: index + 1,
    score: cand.score,
  }));

  digestsRepo.saveDigestItems(digestId, digestItems);

  const feedItems = digestsRepo.getFeedByDate(digestDate);

  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
  }

  const exportPayload = {
    digest_date: digestDate,
    generated_at: new Date().toISOString(),
    version: PROMPT_VERSION,
    items_count: feedItems.length,
    items: feedItems,
  };

  const datedFilePath = path.join(exportDir, `${digestDate}.json`);
  const latestFilePath = path.join(exportDir, "latest.json");

  fs.writeFileSync(datedFilePath, JSON.stringify(exportPayload, null, 2), "utf-8");
  fs.writeFileSync(latestFilePath, JSON.stringify(exportPayload, null, 2), "utf-8");

  logger.info(`Exported digest to ${datedFilePath} and ${latestFilePath} (${feedItems.length} items).`);
}
