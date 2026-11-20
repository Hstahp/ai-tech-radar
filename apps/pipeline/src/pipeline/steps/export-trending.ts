import fs from "node:fs";
import path from "node:path";
import { calculateMetricDelta } from "../../domain/metrics.js";
import { logger } from "../../lib/logger.js";
import type { MetricsRepository } from "../../repositories/metrics-repo.js";

export interface TrendingItem {
  item_id: number;
  title: string;
  url: string;
  category: string;
  delta: number;
  stars: number;
}

export interface TrendingPayload {
  generated_at: string;
  window_days: number;
  from_date: string;
  digest_date: string;
  items_count: number;
  items: TrendingItem[];
}

export const TRENDING_WINDOW_DAYS = 7;
export const TRENDING_LIMIT = 10;

const MS_PER_DAY = 86_400_000;

function subtractDays(date: string, days: number): string {
  return new Date(Date.parse(`${date}T00:00:00Z`) - days * MS_PER_DAY).toISOString().slice(0, 10);
}

export function exportTrending(
  metricsRepo: Pick<MetricsRepository, "listWindowGainers">,
  exportDir: string,
  digestDate: string,
  windowDays = TRENDING_WINDOW_DAYS
): TrendingPayload {
  const fromDate = subtractDays(digestDate, windowDays);
  const rows = metricsRepo.listWindowGainers(fromDate, digestDate);

  const items = rows
    .map((row) => ({
      item_id: row.itemId,
      title: row.title,
      url: row.url,
      category: row.category,
      delta: calculateMetricDelta(row.previous, row.current),
      stars: row.current.stars ?? 0,
    }))
    .filter((item) => item.delta > 0)
    .sort((a, b) => b.delta - a.delta)
    .slice(0, TRENDING_LIMIT);

  const payload: TrendingPayload = {
    generated_at: new Date().toISOString(),
    window_days: windowDays,
    from_date: fromDate,
    digest_date: digestDate,
    items_count: items.length,
    items,
  };

  fs.mkdirSync(exportDir, { recursive: true });
  const filePath = path.join(exportDir, "trending.json");
  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), "utf-8");

  logger.info(`Exported trending snapshot to ${filePath} (${payload.items_count} items).`);
  return payload;
}
