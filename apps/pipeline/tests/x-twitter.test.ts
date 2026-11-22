import { afterEach, describe, expect, it, vi } from "vitest";
import { XRecentSearchAdapter } from "../src/sources/x-twitter.js";

function jsonResponse(body: unknown): Response {
  return { ok: true, status: 200, json: async () => body } as unknown as Response;
}

describe("XRecentSearchAdapter", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("bỏ qua hoàn toàn khi chưa cấu hình X_BEARER_TOKEN", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const items = await new XRecentSearchAdapter().fetchItems();

    expect(items).toEqual([]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("ánh xạ tweet, tác giả và metrics từ API chính thức", async () => {
    const fetchSpy = vi.fn(async () =>
      jsonResponse({
        data: [
          {
            id: "t1",
            text: "AI agent news\nChi tiết bên dưới",
            created_at: "2026-11-20T08:00:00.000Z",
            author_id: "u1",
            public_metrics: { like_count: 120, reply_count: 8 },
          },
        ],
        includes: { users: [{ id: "u1", username: "aiteam", name: "AI Team" }] },
      })
    );
    vi.stubGlobal("fetch", fetchSpy);

    const adapter = new XRecentSearchAdapter("test-token");
    const items = await adapter.fetchItems();

    expect(fetchSpy).toHaveBeenCalledOnce();
    expect(adapter.key).toBe("x_twitter");
    expect(items[0]).toMatchObject({
      externalId: "t1",
      category: "news",
      url: "https://x.com/aiteam/status/t1",
      title: "AI agent news",
      author: "aiteam",
      points: 120,
      comments: 8,
    });
  });

  it("ném SourceFetchError khi API trả lỗi", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: false, status: 403, text: async () => "Forbidden" }) as unknown as Response)
    );

    await expect(new XRecentSearchAdapter("bad-token").fetchItems()).rejects.toThrow(/x_twitter/i);
  });
});
