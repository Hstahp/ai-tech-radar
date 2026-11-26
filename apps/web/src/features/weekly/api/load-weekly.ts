import { z } from "zod";
import { DigestFeedItemSchema } from "@radar/core";

const WeeklyItemSchema = DigestFeedItemSchema.extend({ appearances: z.number() });

export const WeeklyPayloadSchema = z.object({
  generated_at: z.string(),
  week_start: z.string(),
  week_end: z.string(),
  items_count: z.number(),
  items: z.array(WeeklyItemSchema),
});

export type WeeklyItem = z.infer<typeof WeeklyItemSchema>;
export type WeeklyPayload = z.infer<typeof WeeklyPayloadSchema>;

export async function loadWeeklyDigest(
  url = "/data/export/weekly.json"
): Promise<WeeklyPayload | null> {
  try {
    const response = await fetch(url, { cache: "no-cache" });
    if (!response.ok) return null;
    const parsed = WeeklyPayloadSchema.safeParse(await response.json());
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
