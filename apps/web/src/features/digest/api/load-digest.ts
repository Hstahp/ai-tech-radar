import { z } from "zod";
import { DigestFeedItemSchema } from "@radar/core";
import type { DigestFeedPayload } from "../../../types";

export const DigestFeedPayloadSchema = z.object({
  digest_date: z.string(),
  generated_at: z.string(),
  version: z.string(),
  items_count: z.number(),
  items: z.array(DigestFeedItemSchema),
});

export async function loadLatestDigest(apiUrl = "/data/export/latest.json"): Promise<DigestFeedPayload> {
  const response = await fetch(apiUrl);
  if (!response.ok) {
    throw new Error(`Failed to load digest feed: ${response.status} ${response.statusText}`);
  }

  const rawJson: unknown = await response.json();
  const parsed = DigestFeedPayloadSchema.parse(rawJson);
  return parsed as DigestFeedPayload;
}
