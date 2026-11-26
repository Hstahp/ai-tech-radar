import { afterEach, describe, expect, it, vi } from "vitest";
import { OpenAlexAdapter, reconstructAbstract } from "../src/sources/openalex.js";

function jsonResponse(body: unknown): Response {
  return { ok: true, status: 200, json: async () => body } as unknown as Response;
}

describe("reconstructAbstract", () => {
  it("ghép lại abstract từ inverted index", () => {
    expect(
      reconstructAbstract({
        Large: [0],
        language: [1],
        models: [2],
        "improve.": [3],
      })
    ).toBe("Large language models improve.");
  });

  it("trả về chuỗi rỗng khi không có index", () => {
    expect(reconstructAbstract(null)).toBe("");
    expect(reconstructAbstract({})).toBe("");
  });
});

describe("OpenAlexAdapter", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("ánh xạ work, landing page và abstract", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse({
          results: [
            {
              id: "https://openalex.org/W123",
              title: "Large Language Models: A Survey",
              publication_date: "2026-03-01",
              cited_by_count: 500,
              doi: "https://doi.org/10.1000/xyz",
              primary_location: { landing_page_url: "https://example.org/paper" },
              abstract_inverted_index: { Large: [0], language: [1], models: [2] },
              authorships: [{ author: { display_name: "Alice Smith" } }],
            },
          ],
        })
      )
    );

    const adapter = new OpenAlexAdapter();
    const items = await adapter.fetchItems();

    expect(adapter.key).toBe("openalex");
    expect(items[0]).toMatchObject({
      externalId: "W123",
      category: "paper",
      url: "https://example.org/paper",
      description: "Large language models",
      author: "Alice Smith",
      points: 500,
    });
  });

  it("ném SourceFetchError khi schema phản hồi sai", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ results: [{ broken: true }] })));

    await expect(new OpenAlexAdapter().fetchItems()).rejects.toThrow(/openalex/i);
  });
});
