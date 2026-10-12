import { describe, it, expect } from "vitest";
import { normalizeVietnamese, tokenizeQuery } from "../src/text.js";

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
