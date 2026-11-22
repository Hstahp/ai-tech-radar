import { afterEach, describe, expect, it, vi } from "vitest";
import { SemanticScholarAdapter } from "../src/sources/semantic-scholar.js";

function jsonResponse(body: unknown): Response {
  return { ok: true, status: 200, json: async () => body } as unknown as Response;
}

describe("SemanticScholarAdapter", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("ánh xạ bài báo và citation count", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse({
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
        })
      )
    );

    const adapter = new SemanticScholarAdapter();
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

  it("ném SourceFetchError khi schema phản hồi sai", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ data: [{ unexpected: true }] })));

    await expect(new SemanticScholarAdapter().fetchItems()).rejects.toThrow(/semantic_scholar/i);
  });
});
