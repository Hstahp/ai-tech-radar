import fs from "node:fs";
import path from "node:path";
import { PROMPT_VERSION, type DigestFeedItem } from "@radar/core";
import { logger } from "../../lib/logger.js";
import { generateRssXml } from "../../lib/rss.js";
import type { DigestsRepository } from "../../repositories/digests-repo.js";
import type { ScoredCandidate } from "./score-items.js";

export function publishAndExportDigest(
  digestsRepo: DigestsRepository,
  digestDate: string,
  candidates: ScoredCandidate[],
  exportDir: string,
  providerName: string,
  modelName: string
): DigestFeedItem[] {
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

  // Export RSS feed XML
  const rssXml = generateRssXml(feedItems, digestDate);
  const rssPath = path.join(exportDir, "feed.xml");
  fs.writeFileSync(rssPath, rssXml, "utf-8");

  // Export search index JSON for Chatbox RAG
  const searchIndexPayload = {
    generated_at: new Date().toISOString(),
    items: feedItems.map((item) => ({
      key: item.key ?? String(item.item_id),
      title: item.title,
      category: item.category,
      url: item.url,
      tags: item.tags ? item.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
      purpose: item.purpose,
      highlight: item.highlight,
      action: item.action,
      verdict: item.verdict,
      stars: item.stars,
    })),
  };
  const searchIndexPath = path.join(exportDir, "search-index.json");
  fs.writeFileSync(searchIndexPath, JSON.stringify(searchIndexPayload, null, 2), "utf-8");

  logger.info(
    `Exported digest to ${datedFilePath}, ${latestFilePath}, ${rssPath}, and ${searchIndexPath} (${feedItems.length} items).`
  );
  return feedItems;
}
