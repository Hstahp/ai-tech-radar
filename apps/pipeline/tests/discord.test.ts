import { describe, expect, it } from "vitest";
import type { DigestFeedItem } from "@radar/core";
import { buildDiscordEmbeds, DISCORD_TEASER_ITEMS } from "../src/lib/discord.js";

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
    const batches = buildDiscordEmbeds(mockItems, "2026-10-12", "https://ai-tech-radar-fe.phatle219.workers.dev");
    expect(batches.length).toBe(1);

    const firstBatch = batches[0];
    expect(firstBatch.content).toContain("Bản tin AI Tech Radar mới nhất đã sẵn sàng");
    expect(firstBatch.embeds.length).toBe(1);

    const embed = firstBatch.embeds[0];
    expect(embed.title).toContain("BẢN TIN AI TECH RADAR — 2026-10-12");
    expect(embed.url).toBe("https://ai-tech-radar-fe.phatle219.workers.dev");
    expect(embed.fields?.length).toBeGreaterThan(1);
    expect(embed.fields?.some((f) => f.name.includes("langchain-next"))).toBe(true);
    expect(embed.fields?.[0].value).toContain("/item/langchain-next");
  });

  it("chỉ gửi teaser giới hạn và trỏ người đọc sang web khi bản tin có 25 mục", () => {
    const manyItems: DigestFeedItem[] = Array.from({ length: 25 }, (_, index) => ({
      ...mockItems[0],
      item_id: index + 1,
      key: `item-${index + 1}`,
      rank: index + 1,
      title: `Item ${index + 1}`,
    }));

    const batches = buildDiscordEmbeds(manyItems, "2026-10-12", "https://radar.example.com");
    const embed = batches[0].embeds[0];
    const teaserFields = embed.fields?.filter((field) => field.name.includes("Item ")) ?? [];
    const webField = embed.fields?.[embed.fields.length - 1];

    expect(teaserFields).toHaveLength(DISCORD_TEASER_ITEMS);
    expect(teaserFields.some((field) => field.name.includes("Item 5"))).toBe(false);
    expect(webField?.value).toContain("toàn bộ 25");
    expect(webField?.value).toContain("https://radar.example.com");
  });
});
