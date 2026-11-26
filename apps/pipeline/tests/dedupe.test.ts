import { describe, expect, it } from "vitest";
import {
  DEFAULT_DUPLICATE_TITLE_THRESHOLD,
  dedupeCandidates,
  titleSimilarity,
} from "../src/domain/dedupe.js";

interface Candidate {
  title: string;
  score: number;
  urlHash?: string;
}

function candidate(title: string, score: number, urlHash?: string): Candidate {
  return { title, score, urlHash };
}

describe("titleSimilarity", () => {
  it("coi hai tiêu đề cùng nội dung, khác dấu câu là giống nhau", () => {
    expect(titleSimilarity("OpenAI ra mắt GPT-5!", "openai ra mat gpt 5")).toBe(1);
  });

  it("trả về 0 khi hai tiêu đề không có token chung", () => {
    expect(titleSimilarity("OpenAI ra mắt GPT-5", "Rust compiler release notes")).toBe(0);
  });
});

describe("dedupeCandidates", () => {
  it("giữ item điểm cao hơn khi trùng urlHash", () => {
    const result = dedupeCandidates([
      candidate("MCP server toolkit", 0.6, "hash-1"),
      candidate("MCP server toolkit", 0.9, "hash-1"),
    ]);

    expect(result).toHaveLength(1);
    expect(result[0].score).toBe(0.9);
  });

  it("gộp tiêu đề gần giống nhau và giữ bản điểm cao", () => {
    const result = dedupeCandidates([
      candidate("OpenAI ra mắt GPT-5", 0.7),
      candidate("OpenAI ra mat GPT 5", 0.9),
    ]);

    expect(result).toHaveLength(1);
    expect(result[0].score).toBe(0.9);
  });

  it("giữ lại hai tin khác chủ đề", () => {
    const result = dedupeCandidates([
      candidate("OpenAI ra mắt GPT-5", 0.8),
      candidate("Anthropic công bố Claude 4", 0.7),
    ]);

    expect(result).toHaveLength(2);
  });

  it("ngưỡng thấp hơn sẽ gộp nhiều hơn", () => {
    const items = [
      candidate("Large language model inference benchmark", 0.9),
      candidate("Large language model serving benchmark", 0.8),
    ];

    expect(dedupeCandidates(items)).toHaveLength(2);
    expect(dedupeCandidates(items, 0.6)).toHaveLength(1);
    expect(DEFAULT_DUPLICATE_TITLE_THRESHOLD).toBe(0.85);
  });
});
