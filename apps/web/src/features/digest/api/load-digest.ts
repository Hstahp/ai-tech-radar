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
  let localPayload: DigestFeedPayload | null = null;
  let remotePayload: DigestFeedPayload | null = null;

  // 1. Thử tải từ static endpoint local (/data/export/latest.json)
  try {
    const response = await fetch(apiUrl);
    if (response.ok) {
      const rawJson: unknown = await response.json();
      const parsed = DigestFeedPayloadSchema.parse(rawJson);
      if (parsed.items.length > 0) {
        localPayload = parsed as DigestFeedPayload;
      }
    }
  } catch {
    // Tiếp tục kiểm tra remote
  }

  // 2. Thử tải từ nhánh orphan data trên GitHub (runtime live data) với cache-buster
  try {
    const cacheBuster = `?_t=${Math.floor(Date.now() / 60000)}`;
    const response = await fetch(`${RAW_GITHUB_LATEST_URL}${cacheBuster}`, {
      cache: "no-cache",
    });
    if (response.ok) {
      const rawJson: unknown = await response.json();
      const parsed = DigestFeedPayloadSchema.parse(rawJson);
      if (parsed.items.length > 0) {
        remotePayload = parsed as DigestFeedPayload;
      }
    }
  } catch {
    // Bỏ qua nếu GitHub offline hoặc lỗi mạng
  }

  // Ưu tiên bản tin có digest_date mới nhất (giúp web luôn cập nhật ngay khi pipeline commit lên nhánh data)
  if (localPayload && remotePayload) {
    return remotePayload.digest_date >= localPayload.digest_date ? remotePayload : localPayload;
  }

  if (remotePayload) return remotePayload;
  if (localPayload) return localPayload;

  return createEmptyDigestPayload();
}
