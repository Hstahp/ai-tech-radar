import { afterEach, describe, expect, it, vi } from "vitest";
import { SemanticScholarAdapter } from "../src/sources/semantic-scholar.js";

function jsonResponse(body: unknown): Response {
  return { ok: true, status: 200, json: async () => body } as unknown as Response;
}

function rateLimitedResponse(retryAfter = "1"): Response {
  return {
    ok: false,
    status: 429,
    headers: { get: (name: string) => (name.toLowerCase() === "retry-after" ? retryAfter : null) },
    text: async () => "Too Many Requests",
  } as unknown as Response;
}

const PAPER_RESPONSE = {
  data: [
    {
      paperId: "abc123",
      title: "Retrieval-Augmented Generation for Knowledge-Intensive NLP",
      abstract: "We explore RAG for knowledge-intensive tasks.",
      url: "https://www.semanticscholar.org/paper/abc123",
      publicationDate: "2026-05-01",
      citationCount: 321,
      authors: [{ name: "Patrick Lewis" }, { name: "Ethan Perez" }],
    },
  ],
};

describe("SemanticScholarAdapter", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("bỏ qua hoàn toàn khi chưa cấu hình API key", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const items = await new SemanticScholarAdapter().fetchItems();

    expect(items).toEqual([]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("ánh xạ bài báo và citation count", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse(PAPER_RESPONSE)));

    const adapter = new SemanticScholarAdapter("test-key");
    const items = await adapter.fetchItems();

    expect(adapter.key).toBe("semantic_scholar");
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      externalId: "abc123",
      category: "paper",
      points: 321,
      author: "Patrick Lewis, Ethan Perez",
    });
  });

  it("retry theo Retry-After khi gặp 429 rồi thành công", async () => {
    const fetchSpy = vi
      .fn()
      .mockResolvedValueOnce(rateLimitedResponse("1"))
      .mockResolvedValueOnce(jsonResponse(PAPER_RESPONSE));
    vi.stubGlobal("fetch", fetchSpy);

    const items = await new SemanticScholarAdapter("test-key").fetchItems();

    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(items).toHaveLength(1);
  });

  it("ném SourceFetchError khi schema phản hồi sai", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ data: [{ unexpected: true }] })));

    await expect(
      new SemanticScholarAdapter("test-key").fetchItems()
    ).rejects.toThrow(/semantic_scholar/i);
  });
});
