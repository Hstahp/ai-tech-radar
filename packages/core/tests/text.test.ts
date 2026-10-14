import { describe, it, expect } from "vitest";
import { normalizeVietnamese, tokenizeQuery, slugify } from "../src/text.js";

describe("normalizeVietnamese", () => {
  it("bỏ dấu tiếng Việt và chuyển đ thành d", () => {
    const input = "Hôm nay có công cụ Đột Phá nào không?";
    const expected = "hom nay co cong cu dot pha nao khong";
    expect(normalizeVietnamese(input)).toBe(expected);
  });

  it("xử lý chuỗi rỗng và ký tự đặc biệt", () => {
    expect(normalizeVietnamese("")).toBe("");
    expect(normalizeVietnamese("AI-Agent: Công cụ #1!")).toBe("ai-agent cong cu 1");
  });
});

describe("tokenizeQuery", () => {
  it("tách các từ khóa có độ dài >= 2", () => {
    const query = "tìm repo về AI agent và MCP";
    const tokens = tokenizeQuery(query);
    expect(tokens).toEqual(["tim", "repo", "ve", "ai", "agent", "va", "mcp"]);
  });
});

describe("slugify", () => {
  it("tạo slug thân thiện không chứa id và loại bỏ ký tự lạ", () => {
    expect(slugify("Gemini 4 Argon")).toBe("gemini-4-argon");
    expect(slugify("Mô hình AI Đột Phá 2026!")).toBe("mo-hinh-ai-dot-pha-2026");
    expect(slugify("cool/agent @v1.0")).toBe("cool-agent-v1-0");
  });
});
