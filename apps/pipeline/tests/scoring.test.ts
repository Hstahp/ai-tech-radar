import { describe, expect, it } from "vitest";
import { calculateItemScore } from "../src/domain/scoring.js";

describe("calculateItemScore", () => {
  it("tính điểm chuẩn xác theo công thức trọng số", () => {
    const score = calculateItemScore({
      velocity: 1.0,
      recency: 1.0,
      quality: 1.0,
      sourceWeight: 1.0,
      novelty: 1.0,
    });
    expect(score).toBe(1.0);
  });

  it("giới hạn điểm trong khoảng [0, 1] khi nhận trọng số cực đoan", () => {
    const score = calculateItemScore({
      velocity: 2.0,
      recency: -0.5,
      quality: 1.5,
      sourceWeight: 1.0,
      novelty: 1.0,
    });
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(1.0);
  });
});
