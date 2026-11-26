import type { DigestFeedItem } from "@radar/core";

export interface WeeklyItem extends DigestFeedItem {
  appearances: number;
}

export const DEFAULT_WEEKLY_ITEMS = 20;

export function buildWeeklyDigest(
  items: DigestFeedItem[],
  maxItems = DEFAULT_WEEKLY_ITEMS
): WeeklyItem[] {
  const byKey = new Map<string, { item: DigestFeedItem; dates: Set<string> }>();

  for (const item of items) {
    const key = item.key ?? `${item.category}_${item.item_id}`;
    const existing = byKey.get(key);

    if (!existing) {
      byKey.set(key, { item, dates: new Set([item.digest_date]) });
      continue;
    }

    existing.dates.add(item.digest_date);
    if ((item.score ?? 0) > (existing.item.score ?? 0)) {
      existing.item = item;
    }
  }

  return [...byKey.values()]
    .map(({ item, dates }) => ({ ...item, appearances: dates.size }))
    .sort((left, right) => {
      if (right.appearances !== left.appearances) {
        return right.appearances - left.appearances;
      }
      return (right.score ?? 0) - (left.score ?? 0);
    })
    .slice(0, maxItems);
}
