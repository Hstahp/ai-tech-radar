import { z } from "zod";

const HistoryItemSchema = z.object({
  digest_date: z.string(),
  key: z.string(),
  title: z.string(),
  url: z.string(),
  category: z.string(),
  section: z.string(),
  tags: z.string().nullable(),
  purpose: z.string().nullable(),
  score: z.number().optional(),
});

export const HistoryIndexSchema = z.object({
  generated_at: z.string(),
  days: z.number(),
  items_count: z.number(),
  items: z.array(HistoryItemSchema),
});

export type HistoryItem = z.infer<typeof HistoryItemSchema>;
export type HistoryIndex = z.infer<typeof HistoryIndexSchema>;

export async function loadHistoryIndex(
  url = "/data/export/history-index.json"
): Promise<HistoryIndex | null> {
  try {
    const response = await fetch(url, { cache: "no-cache" });
    if (!response.ok) return null;
    const parsed = HistoryIndexSchema.safeParse(await response.json());
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
