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

export function createEmptyDigestPayload(
  digestDate: string = new Date().toISOString().slice(0, 10)
): DigestFeedPayload {
  return {
    digest_date: digestDate,
    generated_at: new Date().toISOString(),
    version: "v1.0.0",
    items_count: 0,
    items: [],
  };
}

export async function loadLatestDigest(apiUrl = "/data/export/latest.json"): Promise<DigestFeedPayload> {
  const response = await fetch(apiUrl);
  if (!response.ok) {
    if (response.status === 404) {
      return createEmptyDigestPayload();
    }
    throw new Error(`Failed to load digest feed: ${response.status} ${response.statusText}`);
  }

  const rawJson: unknown = await response.json();
  const parsed = DigestFeedPayloadSchema.parse(rawJson);
  return parsed as DigestFeedPayload;
}
