import { describe, it, expect, vi } from "vitest";
import { ExplainService } from "../src/explain/service.js";
import { InMemoryAppDbRepository } from "../src/repositories/app-db.js";
import { isAllowedHost, fetchSafeContent } from "../src/explain/fetcher.js";
import { AppError } from "../src/lib/errors.js";
import type { LLMProvider, SearchIndexItem } from "@radar/core";

const mockItem: SearchIndexItem = {
  key: "hash_agent_forge",
  title: "AgentForge",
  category: "repo",
  url: "https://github.com/test/agent-forge",
  tags: ["agent", "devtools"],
  purpose: "Framework xây dựng multi-agent",
  highlight: "Hỗ trợ MCP và tối ưu token",
};

describe("Deep Explain Service", () => {
  it("khóa mềm hoạt động: hai request đồng thời chỉ có 1 request gọi LLM", async () => {
    const appDb = new InMemoryAppDbRepository();
    let llmCallCount = 0;

    const mockLlm: LLMProvider = {
      providerName: "mock-llm",
      modelName: "mock-model",
      generateText: async () => {
        llmCallCount++;
        // Giả lập độ trễ xử lý
        await new Promise((r) => setTimeout(r, 20));
        return {
          content: JSON.stringify({
            what_it_is: "AgentForge là framework mã nguồn mở xây dựng agent.",
            how_it_works: "Sử dụng kiến trúc DAG để điều phối các worker agent.",
            use_cases: ["Tự động hóa coding", "Data scraping"],
            limitations: ["Yêu cầu Node 22+"],
            getting_started: "npm install agent-forge",
            confidence: "high",
          }),
          provider: "mock-llm",
          model: "mock-model",
        };
      },
    };

    const service = new ExplainService({
      appDb,
      llmProvider: mockLlm,
      searchIndexItems: [mockItem],
      customFetch: async () => new Response("Sample README content"),
    });

    // Chạy đồng thời 2 request cho cùng một item
    const [res1, res2] = await Promise.all([
      service.explainItem("hash_agent_forge"),
      service.explainItem("hash_agent_forge"),
    ]);

    // Request 1 thành công 'ready', Request 2 bị chặn bởi khóa mềm nhận 'pending'
    const readyRes = res1.status === "ready" ? res1 : res2;
    const pendingRes = res1.status === "pending" ? res1 : res2;

    expect(readyRes.status).toBe("ready");
    expect(pendingRes.status).toBe("pending");
    // LLM chỉ được gọi ĐÚNG 1 LẦN
    expect(llmCallCount).toBe(1);
  });

  it("lần gọi thứ hai lấy từ cache và không gọi lại LLM (0 token)", async () => {
    const appDb = new InMemoryAppDbRepository();
    let llmCallCount = 0;

    const mockLlm: LLMProvider = {
      providerName: "mock-llm",
      modelName: "mock-model",
      generateText: async () => {
        llmCallCount++;
        return {
          content: JSON.stringify({
            what_it_is: "AgentForge là framework mã nguồn mở xây dựng agent.",
            how_it_works: "Sử dụng kiến trúc DAG.",
            use_cases: ["Tự động hóa"],
            limitations: ["Chưa có UI"],
            getting_started: "npm i agent-forge",
            confidence: "high",
          }),
          provider: "mock-llm",
          model: "mock-model",
        };
      },
    };

    const service = new ExplainService({
      appDb,
      llmProvider: mockLlm,
      searchIndexItems: [mockItem],
      customFetch: async () => new Response("Sample README"),
    });

    // Lần 1: Gọi LLM và lưu DB
    const firstRes = await service.explainItem("hash_agent_forge");
    expect(firstRes.status).toBe("ready");
    expect(llmCallCount).toBe(1);

    // Lần 2: Lấy ngay từ DB
    const secondRes = await service.explainItem("hash_agent_forge");
    expect(secondRes.status).toBe("ready");
    expect(secondRes.data.what_it_is).toContain("AgentForge");
    // LLM không bị gọi lại lần nào nữa!
    expect(llmCallCount).toBe(1);
  });

  it("chống SSRF: chỉ cho phép tải nội dung từ các host trong allowlist", async () => {
    expect(isAllowedHost("https://github.com/user/repo")).toBe(true);
    expect(isAllowedHost("https://raw.githubusercontent.com/user/repo/main/README.md")).toBe(true);
    expect(isAllowedHost("https://api.github.com/repos/user/repo")).toBe(true);
    expect(isAllowedHost("https://open-vsx.org/extension/abc")).toBe(true);

    // Host độc hại hoặc ngoài allowlist bị chặn
    expect(isAllowedHost("https://evil-site.com/exploit")).toBe(false);
    expect(isAllowedHost("http://192.168.1.1/admin")).toBe(false);
    expect(isAllowedHost("http://169.254.169.254/metadata")).toBe(false);

    // Hàm fetchSafeContent ném lỗi khi gặp host bị cấm
    await expect(fetchSafeContent("https://malicious-domain.com/data")).rejects.toThrow(AppError);
  });
});
