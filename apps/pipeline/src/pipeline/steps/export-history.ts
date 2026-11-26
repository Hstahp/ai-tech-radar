import fs from "node:fs";
import path from "node:path";
import { subtractDays } from "../../domain/date-range.js";
import { logger } from "../../lib/logger.js";
import type { DigestsRepository } from "../../repositories/digests-repo.js";

export interface HistoryIndexItem {
  digest_date: string;
  key: string;
  title: string;
  url: string;
  category: string;
  section: string;
  tags: string | null;
  purpose: string | null;
  score?: number;
}

export interface HistoryIndexPayload {
  generated_at: string;
  days: number;
  items_count: number;
  items: HistoryIndexItem[];
}

const HISTORY_DAYS = 30;
const HISTORY_LIMIT = 500;

export function exportHistory(
  digestsRepo: Pick<DigestsRepository, "getFeedBetween">,
  exportDir: string,
  digestDate: string
): HistoryIndexPayload {
  const startDate = subtractDays(digestDate, HISTORY_DAYS - 1);
  const feedItems = digestsRepo.getFeedBetween(startDate, digestDate, HISTORY_LIMIT);

  const items: HistoryIndexItem[] = feedItems.map((item) => ({
    digest_date: item.digest_date,
    key: item.key ?? `${item.category}_${item.item_id}`,
    title: item.title,
    url: item.url,
    category: item.category,
    section: item.section,
    tags: item.tags ?? null,
    purpose: item.purpose ?? null,
    score: item.score,
  }));

  const payload: HistoryIndexPayload = {
    generated_at: new Date().toISOString(),
    days: HISTORY_DAYS,
    items_count: items.length,
    items,
  };

  fs.mkdirSync(exportDir, { recursive: true });
  const filePath = path.join(exportDir, "history-index.json");
  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), "utf-8");
  logger.info(`Exported history index to ${filePath} (${items.length} items).`);

  return payload;
}
