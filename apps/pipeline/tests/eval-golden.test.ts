import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { EvalGoldenSetSchema } from "@radar/core";
import {
  formatHumanSummary,
  parseEvalArgs,
} from "../src/cli/eval-rag.js";

const goldenPath = new URL("../../../docs/eval/golden-set.json", import.meta.url);
const golden = EvalGoldenSetSchema.parse(JSON.parse(readFileSync(goldenPath, "utf8")));

describe("golden set RAG", () => {
  it("có đúng 10 case hợp lệ", () => {
    expect(golden.cases).toHaveLength(10);
  });

  it("có đúng một case kỳ vọng từ chối", () => {
    expect(golden.cases.filter((evalCase) => evalCase.expectRefusal === true)).toHaveLength(1);
  });

  it("không có truy vấn trùng nhau", () => {
    const queries = golden.cases.map((evalCase) => evalCase.query);
    expect(new Set(queries).size).toBe(queries.length);
  });
});

describe("parseEvalArgs", () => {
  it("đọc tham số bắt buộc và mặc định k=5", () => {
    expect(parseEvalArgs(["--index", "index.json", "--golden", "golden.json"])).toEqual({
      indexPath: "index.json",
      goldenPath: "golden.json",
      k: 5,
      json: false,
    });
  });

  it("đọc --answers, --k và --json", () => {
    expect(
      parseEvalArgs([
        "--index",
        "index.json",
        "--golden",
        "golden.json",
        "--answers",
        "answers.json",
        "--k",
        "3",
        "--json",
      ])
    ).toEqual({
      indexPath: "index.json",
      goldenPath: "golden.json",
      answersPath: "answers.json",
      k: 3,
      json: true,
    });
  });

  it("từ chối cờ lạ, thiếu giá trị và --k không hợp lệ", () => {
    expect(() => parseEvalArgs(["--unknown"])).toThrow(/Unknown argument/);
    expect(() => parseEvalArgs(["--index"])).toThrow(/Missing value/);
    expect(() => parseEvalArgs(["--index", "a", "--golden"])).toThrow(/Missing value/);
    expect(
      () => parseEvalArgs(["--index", "a", "--golden", "b", "--k", "0"])
    ).toThrow(/Invalid --k/);
  });
});

describe("formatHumanSummary", () => {
  const retrieval = {
    total: 9,
    hits: 7,
    recallAtK: 7 / 9,
    mrr: 0.6111,
    cases: [],
  };
  const answers = {
    total: 10,
    citationPrecision: 1,
    citationRecall: 0.8,
    refusalAccuracy: 1,
    cases: [],
  };

  it("in dòng retrieval và citation đúng định dạng", () => {
    expect(formatHumanSummary(retrieval, answers, 5)).toBe(
      [
        "Retrieval@5: 7/9 hit (recall 0.778, MRR 0.611)",
        "Citations: precision 1.000, recall 0.800, refusal accuracy 1.000",
      ].join("\n")
    );
  });

  it("bỏ dòng citation khi không có answers và hiển thị n/a cho refusal null", () => {
    expect(formatHumanSummary(retrieval, null, 5)).not.toContain("Citations:");
    expect(
      formatHumanSummary(retrieval, { ...answers, refusalAccuracy: null }, 5)
    ).toContain("refusal accuracy n/a");
  });
});
