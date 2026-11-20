import { describe, expect, it } from "vitest";
import {
  createEmptyTrendingPayload,
  loadTrending,
  TrendingPayloadSchema,
} from "../src/features/trending/api/load-trending";

const SAMPLE_PAYLOAD = {
  generated_at: "2026-11-20T07:00:00Z",
  window_days: 7,
  from_date: "2026-11-13",
  digest_date: "2026-11-20",
  items_count: 1,
  items: [
    {
      item_id: 1,
      title: "cool-agent",
      url: "https://github.com/cool/agent",
      category: "repo",
      delta: 150,
      stars: 250,
    },
  ],
};

describe("TrendingPayloadSchema", () => {
  it("chấp nhận payload trending hợp lệ", () => {
    const parsed = TrendingPayloadSchema.parse(SAMPLE_PAYLOAD);
    expect(parsed.items).toHaveLength(1);
    expect(parsed.items[0].delta).toBe(150);
  });

  it("báo lỗi khi thiếu trường bắt buộc", () => {
    expect(() => TrendingPayloadSchema.parse({ digest_date: "2026-11-20" })).toThrow();
  });
});

describe("loadTrending", () => {
  it("trả về payload rỗng khi endpoint không khả dụng", async () => {
    const originalFetch = globalThis.fetch;
    try {
      globalThis.fetch = async () => new Response("Not Found", { status: 404 });

      const result = await loadTrending("/data/export/trending.json");
      expect(result.items_count).toBe(0);
      expect(result.items).toEqual([]);
      expect(() => TrendingPayloadSchema.parse(result)).not.toThrow();
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("tải và xác thực payload trending từ endpoint 200 OK", async () => {
    const originalFetch = globalThis.fetch;
    try {
      globalThis.fetch = async () =>
        new Response(JSON.stringify(SAMPLE_PAYLOAD), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });

      const result = await loadTrending("/data/export/trending.json");
      expect(result.items_count).toBe(1);
      expect(result.items[0].title).toBe("cool-agent");
      expect(result.items[0].stars).toBe(250);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("tạo payload rỗng hợp lệ bằng createEmptyTrendingPayload", () => {
    const empty = createEmptyTrendingPayload("2026-11-20");
    expect(empty.digest_date).toBe("2026-11-20");
    expect(empty.items).toEqual([]);
    expect(() => TrendingPayloadSchema.parse(empty)).not.toThrow();
  });
});
