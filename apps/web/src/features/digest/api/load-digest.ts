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

export const RAW_GITHUB_LATEST_URL =
  "https://raw.githubusercontent.com/Hstahp/ai-tech-radar/data/latest.json";

export async function loadLatestDigest(apiUrl = "/data/export/latest.json"): Promise<DigestFeedPayload> {
  // 1. Thử tải từ static endpoint local (/data/export/latest.json)
  try {
    const response = await fetch(apiUrl);
    if (response.ok) {
      const rawJson: unknown = await response.json();
      const parsed = DigestFeedPayloadSchema.parse(rawJson);
      if (parsed.items.length > 0) {
        return parsed as DigestFeedPayload;
      }
    }
  } catch {
    // Tiếp tục fallback bên dưới
  }

  // 2. Fallback sang nhánh orphan data trên GitHub (nếu file local build rỗng hoặc chưa sync)
  try {
    const response = await fetch(RAW_GITHUB_LATEST_URL);
    if (response.ok) {
      const rawJson: unknown = await response.json();
      const parsed = DigestFeedPayloadSchema.parse(rawJson);
      if (parsed.items.length > 0) {
        return parsed as DigestFeedPayload;
      }
    }
  } catch {
    // Không có kết nối mạng hoặc lỗi
  }

  return createEmptyDigestPayload();
}
