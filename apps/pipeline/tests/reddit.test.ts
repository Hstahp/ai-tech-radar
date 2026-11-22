import { afterEach, describe, expect, it, vi } from "vitest";
import { RedditAdapter } from "../src/sources/reddit.js";

function jsonResponse(body: unknown): Response {
  return { ok: true, status: 200, json: async () => body } as unknown as Response;
}

function listing(posts: Array<Record<string, unknown>>) {
  return { data: { children: posts.map((post) => ({ data: post })) } };
}

function post(id: string, overrides: Record<string, unknown> = {}) {
  return {
    id,
    title: `Post ${id}`,
    permalink: `/r/LocalLLaMA/comments/${id}`,
    selftext: "Nội dung bài viết",
    author: "redditor",
    created_utc: 1_700_000_000,
    ups: 42,
    num_comments: 7,
    over_18: false,
    stickied: false,
    ...overrides,
  };
}

describe("RedditAdapter", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("gộp bài từ 3 subreddit và bỏ bài stickied hoặc NSFW", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: string | URL) => {
        const url = String(input);
        if (url.includes("LocalLLaMA")) {
          return jsonResponse(listing([post("1"), post("2", { stickied: true })]));
        }
        if (url.includes("MachineLearning")) {
          return jsonResponse(listing([post("3", { over_18: true }), post("4")]));
        }
        return jsonResponse(listing([post("5")]));
      })
    );

    const adapter = new RedditAdapter({ userAgent: "Test-Agent/1.0" });
    const items = await adapter.fetchItems();

    expect(adapter.key).toBe("reddit");
    expect(items).toHaveLength(3);
    expect(items.map((item) => item.externalId)).toEqual(["1", "4", "5"]);
    expect(items[0].category).toBe("news");
    expect(items[0].url).toBe("https://www.reddit.com/r/LocalLLaMA/comments/1");
    expect(items[0].points).toBe(42);
  });

  it("ném SourceFetchError khi cả 3 subreddit đều lỗi", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: false, status: 500 }) as unknown as Response)
    );

    await expect(new RedditAdapter().fetchItems()).rejects.toThrow(/reddit/i);
  });

  it("dùng OAuth client credentials khi được cấu hình", async () => {
    const fetchSpy = vi.fn(async (input: string | URL) => {
      const url = String(input);
      if (url.includes("access_token")) {
        return jsonResponse({ access_token: "test-token" });
      }

      const id = url.includes("LocalLLaMA") ? "1" : url.includes("MachineLearning") ? "2" : "3";
      return jsonResponse(listing([post(id)]));
    });
    vi.stubGlobal("fetch", fetchSpy);

    const adapter = new RedditAdapter({ clientId: "client-id", clientSecret: "client-secret" });
    const items = await adapter.fetchItems();

    expect(items).toHaveLength(3);
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining("oauth.reddit.com"),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Bearer test-token" }),
      })
    );
  });
});
