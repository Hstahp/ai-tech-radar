import { describe, expect, it } from "vitest";
import type { DigestFeedItem } from "@radar/core";
import { buildWeeklyDigest } from "../src/domain/weekly.js";

function item(overrides: Partial<DigestFeedItem>): DigestFeedItem {
  return {
    digest_date: "2026-11-20",
    section: "repo",
    rank: 1,
    score: 0.5,
    item_id: 1,
    key: "key-1",
    category: "repo",
    title: "Example",
    url: "https://example.com",
    language: null,
    purpose: null,
    highlight: null,
    action: null,
    verdict: null,
    confidence: null,
    tags: null,
    stars: null,
    author: null,
    published_at: null,
    description: null,
    ...overrides,
  };
}

describe("buildWeeklyDigest", () => {
  it("gộp mục lặp theo key và đếm số ngày xuất hiện", () => {
    const result = buildWeeklyDigest([
      item({ digest_date: "2026-11-20", score: 0.6 }),
      item({ digest_date: "2026-11-21", score: 0.9, title: "Example improved" }),
      item({ digest_date: "2026-11-22", score: 0.7 }),
    ]);

    expect(result).toHaveLength(1);
    expect(result[0].appearances).toBe(3);
    expect(result[0].score).toBe(0.9);
    expect(result[0].title).toBe("Example improved");
  });

  it("ưu tiên mục xuất hiện nhiều ngày hơn điểm cao một ngày", () => {
    const result = buildWeeklyDigest([
      item({ key: "stable", digest_date: "2026-11-20", score: 0.6 }),
      item({ key: "stable", digest_date: "2026-11-21", score: 0.6 }),
      item({ key: "flash", item_id: 2, digest_date: "2026-11-21", score: 0.95 }),
    ]);

    expect(result.map((entry) => entry.key)).toEqual(["stable", "flash"]);
  });

  it("giới hạn số mục trả về", () => {
    const items = Array.from({ length: 25 }, (_, index) =>
      item({ key: `key-${index}`, item_id: index + 1, score: 0.9 - index * 0.01 })
    );

    expect(buildWeeklyDigest(items, 10)).toHaveLength(10);
  });
});
