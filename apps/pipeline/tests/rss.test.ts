import { describe, expect, it } from "vitest";
import type { DigestFeedItem } from "@radar/core";
import { generateRssXml } from "../src/lib/rss.js";

describe("generateRssXml", () => {
  const mockItems: DigestFeedItem[] = [
    {
      digest_date: "2026-10-12",
      section: "repo",
      rank: 1,
      score: 85,
      item_id: 101,
      category: "repo",
      title: "awesome-ai & tools <v2>",
      url: "https://github.com/test/awesome-ai",
      language: "TypeScript",
      purpose: "Bộ công cụ AI thế hệ mới",
      highlight: "Tăng 500 sao trong 24h",
      action: "Thử nghiệm ngay",
      verdict: "try_now",
      confidence: "high",
      tags: "ai,agents",
    },
  ];

  it("generates valid RSS 2.0 xml structure", () => {
    const xml = generateRssXml(mockItems, "2026-10-12");

    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('<rss version="2.0"');
    expect(xml).toContain("<title>AI Tech Radar - 2026-10-12</title>");
    expect(xml).toContain("<item>");
    expect(xml).toContain("https://github.com/test/awesome-ai");
    // Escaped title
    expect(xml).toContain("awesome-ai &amp; tools &lt;v2&gt;");
  });

  it("handles empty feed items list", () => {
    const xml = generateRssXml([], "2026-10-12");
    expect(xml).toContain("<channel>");
    expect(xml).not.toContain("<item>");
  });
});
