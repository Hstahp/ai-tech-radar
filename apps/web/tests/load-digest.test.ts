import { describe, expect, it } from "vitest";
import {
  DigestFeedPayloadSchema,
  loadLatestDigest,
  createEmptyDigestPayload,
} from "../src/features/digest/api/load-digest";

describe("DigestFeedPayloadSchema", () => {
  it("validates valid digest payload correctly", () => {
    const validData = {
      digest_date: "2026-10-12",
      generated_at: "2026-10-12T07:00:00Z",
      version: "v1.0.0",
      items_count: 1,
      items: [
        {
          digest_date: "2026-10-12",
          section: "repo",
          rank: 1,
          score: 95,
          item_id: 1,
          category: "repo",
          title: "cool-agent",
          url: "https://github.com/cool/agent",
          purpose: "Mục đích rõ ràng",
          highlight: "Điểm nổi bật",
          action: "Xem ngay",
          verdict: "try_now",
          confidence: "high",
          tags: "agent,ai",
        },
      ],
    };

    const parsed = DigestFeedPayloadSchema.parse(validData);
    expect(parsed.items.length).toBe(1);
    expect(parsed.items[0].title).toBe("cool-agent");
    expect(parsed.items[0].verdict).toBe("try_now");
  });

  it("throws validation error when required fields are missing", () => {
    const invalidData = {
      digest_date: "2026-10-12",
      // missing items, version, items_count
    };

    expect(() => DigestFeedPayloadSchema.parse(invalidData)).toThrow();
  });
});

describe("loadLatestDigest", () => {
  it("creates valid empty digest payload via createEmptyDigestPayload", () => {
    const emptyPayload = createEmptyDigestPayload("2026-10-14");
    expect(emptyPayload.digest_date).toBe("2026-10-14");
    expect(emptyPayload.items_count).toBe(0);
    expect(emptyPayload.items).toEqual([]);
    expect(() => DigestFeedPayloadSchema.parse(emptyPayload)).not.toThrow();
  });

  it("handles 404 gracefully and returns empty digest payload", async () => {
    const originalFetch = globalThis.fetch;
    try {
      globalThis.fetch = async () =>
        new Response("Not Found", {
          status: 404,
          statusText: "Not Found",
        });

      const result = await loadLatestDigest("/data/export/latest.json");
      expect(result.items_count).toBe(0);
      expect(result.items).toEqual([]);
      expect(() => DigestFeedPayloadSchema.parse(result)).not.toThrow();
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("loads and parses valid digest payload on 200 OK", async () => {
    const originalFetch = globalThis.fetch;
    const mockData = {
      digest_date: "2026-10-14",
      generated_at: "2026-10-14T07:00:00Z",
      version: "v1.0.0",
      items_count: 1,
      items: [
        {
          digest_date: "2026-10-14",
          section: "repo",
          rank: 1,
          score: 90,
          item_id: 123,
          category: "repo",
          title: "test-ai",
          url: "https://github.com/test/ai",
          purpose: "AI tool",
          highlight: "Very fast",
          action: "Try it",
          verdict: "try_now",
          confidence: "high",
          tags: "ai",
        },
      ],
    };

    try {
      globalThis.fetch = async () =>
        new Response(JSON.stringify(mockData), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });

      const result = await loadLatestDigest("/data/export/latest.json");
      expect(result.items_count).toBe(1);
      expect(result.items[0].title).toBe("test-ai");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("throws error when response status is 500", async () => {
    const originalFetch = globalThis.fetch;
    try {
      globalThis.fetch = async () =>
        new Response("Internal Server Error", {
          status: 500,
          statusText: "Internal Server Error",
        });

      await expect(loadLatestDigest("/data/export/latest.json")).rejects.toThrow("Failed to load digest feed: 500");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
