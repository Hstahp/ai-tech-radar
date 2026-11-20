import { describe, expect, it } from "vitest";
import {
  EvalGoldenSetSchema,
  RecordedAnswerSetSchema,
  evaluateAnswers,
  evaluateRetrieval,
  matchesExpectedTitle,
} from "../src/eval.js";
import type { SearchIndexItem } from "../src/schemas.js";

const ITEMS: SearchIndexItem[] = [
  {
    key: "deepinfer",
    title: "DeepInfer: High-performance inference framework for DeepSeek models",
    category: "news",
    url: "https://github.com/deepseek-ai/DeepInfer",
    tags: ["model", "open-source"],
  },
  {
    key: "whatsapp-mcp",
    title: "finereli/whatsapp-mcp",
    category: "repo",
    url: "https://github.com/finereli/whatsapp-mcp",
    tags: ["mcp", "agent"],
  },
];

describe("matchesExpectedTitle", () => {
  it("so khớp tiêu đề tiếng Việt sau khi bỏ dấu", () => {
    expect(matchesExpectedTitle("Mô hình AI Đột Phá", ["dot pha"])).toBe(true);
    expect(matchesExpectedTitle("DeepInfer", ["không có"])).toBe(false);
  });
});

describe("evaluateRetrieval", () => {
  const cases = [
    { query: "DeepInfer", expectedTitleContains: ["DeepInfer"] },
    { query: "whatsapp mcp", expectedTitleContains: ["whatsapp-mcp"] },
    { query: "quantum computing", expectedTitleContains: ["quantum"] },
    { query: "Giá vàng hôm nay", expectedTitleContains: ["không có"], expectRefusal: true },
  ];

  it("tính recall@k và MRR, bỏ qua case kỳ vọng từ chối", () => {
    const summary = evaluateRetrieval(cases, ITEMS, 5);

    expect(summary.total).toBe(3);
    expect(summary.hits).toBe(2);
    expect(summary.recallAtK).toBeCloseTo(2 / 3);
    expect(summary.mrr).toBeCloseTo(2 / 3);
    expect(summary.cases[2]).toMatchObject({ rank: null, hit: false, reciprocalRank: 0 });
  });

  it("trả về metric rỗng khi không có case truy xuất", () => {
    const summary = evaluateRetrieval([cases[3]], ITEMS);
    expect(summary).toMatchObject({ total: 0, hits: 0, recallAtK: 0, mrr: 0, cases: [] });
  });
});

describe("evaluateAnswers", () => {
  const cases = [
    { query: "DeepInfer", expectedTitleContains: ["DeepInfer"] },
    { query: "whatsapp mcp", expectedTitleContains: ["whatsapp-mcp"] },
    {
      query: "Giá vàng hôm nay",
      expectedTitleContains: ["không có"],
      expectRefusal: true,
    },
  ];

  const answers = RecordedAnswerSetSchema.parse({
    answers: [
      {
        query: "DeepInfer",
        answer: "DeepInfer là framework inference.",
        citations: [{ title: "DeepInfer: High-performance inference framework" }],
      },
      { query: "whatsapp mcp", answer: "Có một MCP server." },
      { query: "Giá vàng hôm nay", answer: "Không có thông tin.", refused: true },
    ],
  }).answers;

  it("tính precision/recall của citation và độ chính xác từ chối", () => {
    const summary = evaluateAnswers(cases, answers);

    expect(summary.total).toBe(3);
    expect(summary.citationPrecision).toBeCloseTo(1);
    expect(summary.citationRecall).toBeCloseTo(0.5);
    expect(summary.refusalAccuracy).toBeCloseTo(1);
    expect(summary.cases[1]).toMatchObject({ citationsCorrect: 0, expectedCovered: 0 });
    expect(summary.cases[2]).toMatchObject({ refused: true, refusalCorrect: true });
  });

  it("trả về refusalAccuracy null khi không có case từ chối", () => {
    const summary = evaluateAnswers([cases[0]], answers);
    expect(summary.refusalAccuracy).toBeNull();
  });

  it("áp dụng mặc định refused=false và citations=[] cho câu trả lời ghi lại", () => {
    const parsed = RecordedAnswerSetSchema.parse({ answers: [{ query: "x", answer: "y" }] });
    expect(parsed.answers[0]).toMatchObject({ refused: false, citations: [] });
  });
});

describe("golden set schema", () => {
  it("từ chối golden set rỗng hoặc case thiếu tiêu đề kỳ vọng", () => {
    expect(() => EvalGoldenSetSchema.parse({ cases: [] })).toThrow();
    expect(() => EvalGoldenSetSchema.parse({ cases: [{ query: "x" }] })).toThrow();
  });
});
