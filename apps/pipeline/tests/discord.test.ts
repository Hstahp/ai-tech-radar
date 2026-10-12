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

  it("builds batches of max 10 embeds per payload", () => {
    const batches = buildDiscordEmbeds(mockItems, "2026-10-12");
    expect(batches.length).toBeGreaterThanOrEqual(1);

    const firstBatch = batches[0];
    expect(firstBatch.embeds.length).toBe(2);
    expect(firstBatch.embeds[0].title).toContain("langchain-next");
    expect(firstBatch.embeds[0].url).toBe("https://github.com/test/langchain-next");
    expect(firstBatch.embeds[0].color).toBe(0x22c55e);
    expect(firstBatch.embeds[1].color).toBe(0xf59e0b);
  });

  it("splits items across batches if more than 10 items", () => {
    const manyItems: DigestFeedItem[] = Array.from({ length: 15 }, (_, i) => ({
      ...mockItems[0],
      item_id: i + 1,
      rank: i + 1,
      title: `Repo #${i + 1}`,
    }));

    const batches = buildDiscordEmbeds(manyItems, "2026-10-12");
    expect(batches.length).toBe(2);
    expect(batches[0].embeds.length).toBe(10);
    expect(batches[1].embeds.length).toBe(5);
  });
});
