import { describe, expect, it } from "vitest";
import { DigestFeedPayloadSchema } from "../src/features/digest/api/load-digest";

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
