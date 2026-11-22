import { z } from "zod";
import { SourceFetchError } from "../lib/errors.js";
import { logger } from "../lib/logger.js";
import type { RawItemData, SourceAdapter } from "./source.js";

const X_QUERY = "(AI OR LLM OR agent OR MCP) -is:retweet lang:en";
const X_MAX_RESULTS = 25;
const X_SEARCH_URL = "https://api.twitter.com/2/tweets/search/recent";

const TweetMetricsSchema = z.object({
  like_count: z.number().optional(),
  reply_count: z.number().optional(),
});

const TweetSchema = z.object({
  id: z.string(),
  text: z.string(),
  created_at: z.string().optional(),
  author_id: z.string().optional(),
  public_metrics: TweetMetricsSchema.optional(),
});

const UserSchema = z.object({
  id: z.string(),
  username: z.string(),
  name: z.string().optional(),
});

const XResponseSchema = z.object({
  data: z.array(TweetSchema).optional().default([]),
  includes: z.object({ users: z.array(UserSchema).optional().default([]) }).optional(),
});

export class XRecentSearchAdapter implements SourceAdapter {
  readonly key = "x_twitter";
  readonly name = "X (Twitter) Recent Search";

  constructor(private readonly bearerToken?: string) {}

  async fetchItems(): Promise<RawItemData[]> {
    if (!this.bearerToken) {
      logger.info("X adapter skipped: X_BEARER_TOKEN is not configured.");
      return [];
    }

    const params = new URLSearchParams({
      query: X_QUERY,
      max_results: String(X_MAX_RESULTS),
      "tweet.fields": "created_at,public_metrics,author_id",
      expansions: "author_id",
      "user.fields": "username,name",
    });

    try {
      const response = await fetch(`${X_SEARCH_URL}?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${this.bearerToken}`,
          "User-Agent": "AI-Tech-Radar/1.0",
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new SourceFetchError(this.key, `HTTP ${response.status}: ${await response.text()}`);
      }

      const parsed = XResponseSchema.safeParse(await response.json());
      if (!parsed.success) {
        throw new SourceFetchError(this.key, "Invalid response schema from X API");
      }

      const usersById = new Map(
        (parsed.data.includes?.users ?? []).map((user) => [user.id, user.username])
      );

      return parsed.data.data.map((tweet) => {
        const username = tweet.author_id ? usersById.get(tweet.author_id) : undefined;
        const firstLine = tweet.text.split("\n")[0] ?? tweet.text;

        return {
          externalId: tweet.id,
          category: "news" as const,
          url: username
            ? `https://x.com/${username}/status/${tweet.id}`
            : `https://x.com/i/web/status/${tweet.id}`,
          title: firstLine.slice(0, 160),
          description: tweet.text.slice(0, 300),
          author: username,
          publishedAt: tweet.created_at,
          points: tweet.public_metrics?.like_count ?? 0,
          comments: tweet.public_metrics?.reply_count ?? 0,
          rawJson: JSON.stringify(tweet),
        };
      });
    } catch (err: unknown) {
      if (err instanceof SourceFetchError) throw err;
      const message = err instanceof Error ? err.message : String(err);
      throw new SourceFetchError(this.key, message);
    }
  }
}
