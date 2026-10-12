import { describe, expect, it } from "vitest";
import { normalizeUrl, sha256Hex, computeContentHash } from "./url.js";
import { parseSummaries } from "./schemas.js";

describe("URL normalization and hashing", () => {
  it("chuẩn hóa URL bỏ slash cuối và tracking query params", () => {
    const raw = "https://GitHub.com/acme/repo/?utm_source=twitter&ref=123";
    const normalized = normalizeUrl(raw);
    expect(normalized).toBe("https://github.com/acme/repo");
  });

  it("tính SHA-256 hash chuẩn cho chuỗi", async () => {
    const hash = await sha256Hex("hello world");
    expect(hash).toBe("b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9");
  });

  it("tính content hash cho tiêu đề và mô tả", async () => {
    const hash = await computeContentHash("  Title  ", "  Desc  ");
    const expected = await sha256Hex("Title\nDesc");
    expect(hash).toBe(expected);
  });
});

describe("Summaries parsing and validation", () => {
  it("parse JSON hợp lệ và lọc đúng id", () => {
    const sampleJson = JSON.stringify({
      items: [
        {
          id: 1,
          purpose: "Mục đích test",
          highlight: "Điểm nổi bật test",
          action: "Xem thêm tại GitHub",
          verdict: "try_now",
          confidence: "high",
          tags: ["github", "agent"],
        },
      ],
    });

    const result = parseSummaries(sampleJson, [1]);
    expect(result.items.length).toBe(1);
    expect(result.items[0].id).toBe(1);
    expect(result.missing.length).toBe(0);
  });

  it("phát hiện thiếu id trong kết quả LLM", () => {
    const sampleJson = JSON.stringify({
      items: [
        {
          id: 1,
          purpose: "Mục đích test",
          highlight: "Điểm nổi bật test",
          action: "Xem thêm tại GitHub",
          verdict: "try_now",
          confidence: "high",
          tags: ["github"],
        },
      ],
    });

    const result = parseSummaries(sampleJson, [1, 2]);
    expect(result.missing).toEqual([2]);
  });
});
