import { describe, expect, it } from "vitest";
import {
  DEFAULT_MAX_DIGEST_ITEMS,
  DEFAULT_MAX_ITEMS_PER_CATEGORY,
  selectTopCandidates,
} from "../src/domain/selection.js";

interface Candidate {
  id: string;
  category: string;
  score: number;
}

function makeCandidates(category: string, count: number, startScore: number): Candidate[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `${category}-${index}`,
    category,
    score: startScore - index * 0.01,
  }));
}

describe("selectTopCandidates", () => {
  it("giới hạn tổng 25 bài và tối đa 8 bài mỗi category", () => {
    const candidates = [
      ...makeCandidates("repo", 10, 0.9),
      ...makeCandidates("news", 10, 0.8),
      ...makeCandidates("paper", 10, 0.7),
      ...makeCandidates("model", 10, 0.6),
    ];

    const selected = selectTopCandidates(candidates);

    expect(selected).toHaveLength(DEFAULT_MAX_DIGEST_ITEMS);
    for (const category of ["repo", "news", "paper", "model"]) {
      const count = selected.filter((item) => item.category === category).length;
      expect(count).toBeLessThanOrEqual(DEFAULT_MAX_ITEMS_PER_CATEGORY);
    }
    expect(selected[0].score).toBeGreaterThanOrEqual(selected[selected.length - 1].score);
  });

  it("không vượt quá sức chứa của một category", () => {
    const selected = selectTopCandidates(makeCandidates("repo", 20, 1));

    expect(selected).toHaveLength(DEFAULT_MAX_ITEMS_PER_CATEGORY);
    expect(selected.every((item) => item.category === "repo")).toBe(true);
  });

  it("trả về mảng rỗng khi không có ứng viên", () => {
    expect(selectTopCandidates([])).toEqual([]);
  });
});
