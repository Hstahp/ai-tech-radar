import { describe, expect, it } from "vitest";
import type { DigestFeedItem } from "@radar/core";
import { buildDiscordEmbeds } from "../src/lib/discord.js";

describe("buildDiscordEmbeds", () => {
  const mockItems: DigestFeedItem[] = [
    {
      digest_date: "2026-10-12",
      section: "repo",
      rank: 1,
      score: 92,
      item_id: 1,
      category: "repo",
      title: "langchain-next",
      url: "https://github.com/test/langchain-next",
      purpose: "Framework AI mạnh mẽ",
      highlight: "Hỗ trợ full MCP server",
      action: "Clone repo về chạy thử",
      verdict: "try_now",
      confidence: "high",
      tags: "agents,mcp-server",
    },
    {
      digest_date: "2026-10-12",
      section: "news",
      rank: 2,
      score: 75,
      item_id: 2,
      category: "news",
      title: "OpenAI ra mắt model mới",
      url: "https://news.ycombinator.com/item?id=123",
      purpose: "Điểm tin công nghệ",
      highlight: "Tăng context window lên 2M tokens",
      action: "Đọc thông báo chính thức",
      verdict: "watch",
      confidence: "medium",
      tags: "llm",
    },
  ];

  it("builds teaser batch with web link and top highlights", () => {
    const batches = buildDiscordEmbeds(mockItems, "2026-10-12", "https://ai-tech-radar.pages.dev");
    expect(batches.length).toBe(1);

    const firstBatch = batches[0];
    expect(firstBatch.content).toContain("Bản tin AI Tech Radar mới nhất đã sẵn sàng");
    expect(firstBatch.embeds.length).toBe(1);

    const embed = firstBatch.embeds[0];
    expect(embed.title).toContain("BẢN TIN AI TECH RADAR — 2026-10-12");
    expect(embed.url).toBe("https://ai-tech-radar.pages.dev");
    expect(embed.fields?.length).toBeGreaterThan(1);
    expect(embed.fields?.some((f) => f.name.includes("langchain-next"))).toBe(true);
  });
});
