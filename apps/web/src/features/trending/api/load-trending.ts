import { z } from "zod";

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

export const TrendingPayloadSchema = z.object({
  generated_at: z.string(),
  window_days: z.number(),
  from_date: z.string(),
  digest_date: z.string(),
  items_count: z.number(),
  items: z.array(
    z.object({
      item_id: z.number(),
      title: z.string(),
      url: z.string(),
      category: z.string(),
      delta: z.number(),
      stars: z.number(),
    })
  ),
});

export const DEFAULT_TRENDING_URL = "/data/export/trending.json";
export const RAW_GITHUB_TRENDING_URL =
  "https://raw.githubusercontent.com/Hstahp/ai-tech-radar/data/trending.json";

const EMPTY_WINDOW_DAYS = 0;

export function createEmptyTrendingPayload(
  digestDate: string = new Date().toISOString().slice(0, 10)
): TrendingPayload {
  return {
    generated_at: new Date().toISOString(),
    window_days: EMPTY_WINDOW_DAYS,
    from_date: digestDate,
    digest_date: digestDate,
    items_count: 0,
    items: [],
  };
}

async function fetchTrending(url: string): Promise<TrendingPayload | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const rawJson: unknown = await response.json();
    const parsed = TrendingPayloadSchema.parse(rawJson);
    return parsed.items.length > 0 ? parsed : null;
  } catch {
    // Trending la du lieu phu: loi mang/JSON khong duoc lam hong trang chu.
    return null;
  }
}

export async function loadTrending(apiUrl = DEFAULT_TRENDING_URL): Promise<TrendingPayload> {
  const localPayload = await fetchTrending(apiUrl);
  if (localPayload) return localPayload;

  const remotePayload = await fetchTrending(RAW_GITHUB_TRENDING_URL);
  return remotePayload ?? createEmptyTrendingPayload();
}
