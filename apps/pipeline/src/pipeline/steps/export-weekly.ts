import fs from "node:fs";
import path from "node:path";
import type { DigestFeedItem } from "@radar/core";
import { subtractDays } from "../../domain/date-range.js";
import { buildWeeklyDigest, DEFAULT_WEEKLY_ITEMS, type WeeklyItem } from "../../domain/weekly.js";
import { logger } from "../../lib/logger.js";
import { generateRssXml } from "../../lib/rss.js";
import type { DigestsRepository } from "../../repositories/digests-repo.js";

export interface WeeklyPayload {
  generated_at: string;
  week_start: string;
  week_end: string;
  items_count: number;
  items: WeeklyItem[];
}

const WEEK_DAYS = 7;
const CANDIDATE_LIMIT = 500;

export function exportWeekly(
  digestsRepo: Pick<DigestsRepository, "getFeedBetween">,
  exportDir: string,
  digestDate: string
): WeeklyPayload {
  const weekStart = subtractDays(digestDate, WEEK_DAYS - 1);
  const feedItems = digestsRepo.getFeedBetween(weekStart, digestDate, CANDIDATE_LIMIT);
  const items = buildWeeklyDigest(feedItems, DEFAULT_WEEKLY_ITEMS);

  const payload: WeeklyPayload = {
    generated_at: new Date().toISOString(),
    week_start: weekStart,
    week_end: digestDate,
    items_count: items.length,
    items,
  };

  fs.mkdirSync(exportDir, { recursive: true });
  const jsonPath = path.join(exportDir, "weekly.json");
  fs.writeFileSync(jsonPath, JSON.stringify(payload, null, 2), "utf-8");

  const rssItems: DigestFeedItem[] = items;
  const rssPath = path.join(exportDir, "weekly-feed.xml");
  fs.writeFileSync(rssPath, generateRssXml(rssItems, digestDate), "utf-8");

  logger.info(
    `Exported weekly digest to ${jsonPath} and ${rssPath} (${items.length} items, ${weekStart}..${digestDate}).`
  );
  return payload;
}
