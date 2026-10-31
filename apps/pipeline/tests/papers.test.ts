import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { HuggingFacePapersAdapter } from "../src/sources/huggingface-papers.js";

describe("HuggingFacePapersAdapter", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("trích xuất đúng danh sách bài báo khoa học AI từ Hugging Face Daily Papers", async () => {
    const mockApiResponse = [
      {
        paper: {
          id: "2610.12345",
          title: "DeepSeek-V3 Technical Report",
          summary: "We present DeepSeek-V3, a strong Mixture-of-Experts language model...",
          authors: [
            { name: "DeepSeek-AI" },
            { name: "Research Team" },
          ],
          publishedAt: "2026-10-30T10:00:00.000Z",
          upvotes: 85,
        },
      },
      {
        paper: {
          id: "2610.67890",
          title: "Large Language Models as Tool Users",
          summary: "Exploring autonomous agents that invoke tools effectively...",
          authors: [{ name: "Alice Smith" }],
          publishedAt: "2026-10-29T14:30:00.000Z",
          upvotes: 42,
        },
      },
    ];

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockApiResponse,
    } as unknown as Response);

    const adapter = new HuggingFacePapersAdapter();
    expect(adapter.key).toBe("huggingface_papers");
    expect(adapter.name).toBe("Hugging Face Daily Papers");

    const items = await adapter.fetchItems();

    expect(items.length).toBe(2);

    const first = items[0];
    expect(first.category).toBe("paper");
    expect(first.externalId).toBe("2610.12345");
    expect(first.title).toBe("DeepSeek-V3 Technical Report");
    expect(first.url).toBe("https://arxiv.org/abs/2610.12345");
    expect(first.author).toBe("DeepSeek-AI, Research Team");
    expect(first.points).toBe(85); // upvotes mapping to points
    expect(first.publishedAt).toBe("2026-10-30T10:00:00.000Z");
    expect(first.description).toContain("We present DeepSeek-V3");
  });

  it("bỏ qua các bài báo thiếu id hoặc title", async () => {
    const mockApiResponse = [
      {
        paper: {
          id: "",
          title: "Invalid Paper",
        },
      },
      {
        paper: {
          id: "2610.99999",
          title: "Valid Paper",
          summary: "Valid summary",
          upvotes: 10,
        },
      },
    ];

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockApiResponse,
    } as unknown as Response);

    const adapter = new HuggingFacePapersAdapter();
    const items = await adapter.fetchItems();

    expect(items.length).toBe(1);
    expect(items[0].externalId).toBe("2610.99999");
  });

  it("ném SourceFetchError có kiểu khi API trả lỗi HTTP", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      text: async () => "Service Unavailable",
    } as unknown as Response);

    const adapter = new HuggingFacePapersAdapter();
    await expect(adapter.fetchItems()).rejects.toThrowError();
  });
});
