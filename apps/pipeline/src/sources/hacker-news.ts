import type { RawItemData, SourceAdapter } from "./source.js";
import { logger } from "../lib/logger.js";
import { SourceFetchError } from "../lib/errors.js";

export class HackerNewsAdapter implements SourceAdapter {
  readonly key = "hackernews";
  readonly name = "Hacker News";

  async fetchItems(): Promise<RawItemData[]> {
    const topStoriesUrl = "https://hacker-news.firebaseio.com/v0/topstories.json";
    logger.info("Fetching Hacker News top stories...");

    try {
      const res = await fetch(topStoriesUrl);
      if (!res.ok) {
        throw new SourceFetchError(this.key, `HTTP ${res.status}`);
      }

      const storyIds = ((await res.json()) as number[]).slice(0, 30);
      const items: RawItemData[] = [];

      for (const id of storyIds) {
        const itemUrl = `https://hacker-news.firebaseio.com/v0/item/${id}.json`;
        const itemRes = await fetch(itemUrl);
        if (!itemRes.ok) continue;

        const story = (await itemRes.json()) as any;
        if (!story || story.type !== "story" || !story.title) continue;

        const titleLower = story.title.toLowerCase();
        // Filter AI related stories
        const aiKeywords = ["ai", "llm", "gpt", "claude", "gemini", "agent", "mcp", "transformer", "neural", "deepseek"];
        const isAiRelated = aiKeywords.some((kw) => titleLower.includes(kw));

        if (isAiRelated) {
          const targetUrl = story.url || `https://news.ycombinator.com/item?id=${id}`;
          items.push({
            externalId: String(story.id),
            category: "news" as const,
            url: targetUrl,
            title: story.title,
            description: story.text ? story.text.slice(0, 300) : story.title,
            author: story.by,
            publishedAt: story.time ? new Date(story.time * 1000).toISOString() : undefined,
            points: story.score ?? 0,
            comments: story.descendants ?? 0,
            rawJson: JSON.stringify(story),
          });
        }
      }

      return items;
    } catch (err: any) {
      if (err instanceof SourceFetchError) throw err;
      throw new SourceFetchError(this.key, err.message);
    }
  }
}
