import { z } from "zod";
import { SourceFetchError } from "../lib/errors.js";
import { logger } from "../lib/logger.js";
import type { RawItemData, SourceAdapter } from "./source.js";

const AI_SUBREDDITS = ["LocalLLaMA", "MachineLearning", "artificial"] as const;
const POSTS_PER_SUBREDDIT = 25;
const REDDIT_BASE_URL = "https://www.reddit.com";
const REDDIT_OAUTH_BASE_URL = "https://oauth.reddit.com";
const REDDIT_TOKEN_URL = "https://www.reddit.com/api/v1/access_token";

const RedditPostSchema = z.object({
  id: z.string(),
  title: z.string(),
  permalink: z.string(),
  selftext: z.string().optional().default(""),
  author: z.string().optional(),
  created_utc: z.number().optional(),
  ups: z.number().optional(),
  num_comments: z.number().optional(),
  over_18: z.boolean().optional().default(false),
  stickied: z.boolean().optional().default(false),
});

const RedditListingSchema = z.object({
  data: z.object({
    children: z.array(z.object({ data: RedditPostSchema })),
  }),
});

const TokenSchema = z.object({
  access_token: z.string().optional(),
});

export interface RedditAdapterOptions {
  userAgent?: string;
  clientId?: string;
  clientSecret?: string;
}

export class RedditAdapter implements SourceAdapter {
  readonly key = "reddit";
  readonly name = "Reddit AI Communities";

  private readonly userAgent: string;
  private readonly clientId?: string;
  private readonly clientSecret?: string;
  private accessToken?: string;

  constructor(options: RedditAdapterOptions = {}) {
    this.userAgent = options.userAgent ?? "AI-Tech-Radar/1.0";
    this.clientId = options.clientId;
    this.clientSecret = options.clientSecret;
  }

  private async getAccessToken(): Promise<string | undefined> {
    if (!this.clientId || !this.clientSecret) return undefined;
    if (this.accessToken) return this.accessToken;

    const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString("base64");
    const response = await fetch(REDDIT_TOKEN_URL, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": this.userAgent,
      },
      body: "grant_type=client_credentials",
    });

    if (!response.ok) {
      throw new Error(`Reddit token HTTP ${response.status}`);
    }

    const parsed = TokenSchema.safeParse(await response.json());
    if (!parsed.success || !parsed.data.access_token) {
      throw new Error("Reddit token response missing access_token");
    }

    this.accessToken = parsed.data.access_token;
    return this.accessToken;
  }

  async fetchItems(): Promise<RawItemData[]> {
    const items: RawItemData[] = [];
    let successCount = 0;

    const token = await this.getAccessToken().catch((err: unknown) => {
      const message = err instanceof Error ? err.message : String(err);
      logger.warn(`Reddit OAuth unavailable, falling back to public JSON: ${message}`);
      return undefined;
    });
    const baseUrl = token ? REDDIT_OAUTH_BASE_URL : REDDIT_BASE_URL;

    for (const subreddit of AI_SUBREDDITS) {
      const url = `${baseUrl}/r/${subreddit}/hot?limit=${POSTS_PER_SUBREDDIT}&raw_json=1`;

      try {
        const response = await fetch(url, {
          headers: {
            "User-Agent": this.userAgent,
            Accept: "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const listing = RedditListingSchema.parse(await response.json());
        successCount += 1;

        for (const child of listing.data.children) {
          const post = child.data;
          if (post.stickied || post.over_18) continue;

          items.push({
            externalId: post.id,
            category: "news" as const,
            url: `${REDDIT_BASE_URL}${post.permalink}`,
            title: post.title,
            description: post.selftext ? post.selftext.slice(0, 300) : post.title,
            author: post.author,
            publishedAt: post.created_utc
              ? new Date(post.created_utc * 1000).toISOString()
              : undefined,
            points: post.ups ?? 0,
            comments: post.num_comments ?? 0,
            rawJson: JSON.stringify(post),
          });
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        logger.warn(`Reddit r/${subreddit} fetch failed: ${message}`);
      }
    }

    if (successCount === 0) {
      throw new SourceFetchError(this.key, "All subreddit requests failed");
    }

    logger.info(`Fetched ${items.length} Reddit posts from ${successCount} subreddits.`);
    return items;
  }
}
