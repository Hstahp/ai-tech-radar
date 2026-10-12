import { describe, it, expect, vi } from "vitest";
import { ChatService } from "../src/chat/service.js";
import { InMemoryAppDbRepository } from "../src/repositories/app-db.js";
import type { LLMProvider, SearchIndexItem } from "@radar/core";
import { RateLimitError } from "../src/lib/errors.js";

const mockSearchIndex: SearchIndexItem[] = [
  {
    key: "hash_agent_forge",
    title: "AgentForge",
    category: "repo",
    url: "https://github.com/test/agent-forge",
    tags: ["agent", "devtools"],
    purpose: "Framework xây dựng multi-agent tự động bằng TypeScript",
    highlight: "Tối ưu hóa token và hỗ trợ MCP Server",
    stars: 1200,
  },
  {
    key: "hash_cursor_copilot",
    title: "Cursor Tools Extension",
    category: "extension",
    url: "https://open-vsx.org/extension/cursor-tools",
    tags: ["extension", "coding-assistant"],
    purpose: "Tiện ích mở rộng VS Code giúp tối ưu prompt cho coding AI",
    highlight: "Tự động phân tích context trong workspace",
  },
];

describe("ChatService - Strict RAG Chat", () => {
  it("từ chối ngay các câu hỏi ngoài phạm vi mà KHÔNG gọi LLM (0 token)", async () => {
    const appDb = new InMemoryAppDbRepository();
    const generateTextMock = vi.fn();
    const mockLlm: LLMProvider = {
      providerName: "mock-llm",
      modelName: "mock-model",
      generateText: generateTextMock,
    };

    const service = new ChatService({
      appDb,
      llmProvider: mockLlm,
      searchIndexItems: mockSearchIndex,
      digestDate: "2026-10-13",
    });

    // Câu hỏi hoàn toàn ngoài phạm vi (thời tiết)
    const result = await service.processQuestion({
      question: "Hôm nay thời tiết Hà Nội thế nào bạn?",
      anonHash: "anon_user_1",
    });

    expect(result.status).toBe("refused_retrieval");
    expect(result.data.answerable).toBe(false);
    expect(result.data.answer).toContain("Mình chỉ trả lời được các câu hỏi dựa trên tin trong bản tin hiện có");
    // Tuyệt đối KHÔNG gọi LLM
    expect(generateTextMock).not.toHaveBeenCalled();

    // Sự kiện được ghi nhận vào appDb
    const events = appDb.getRecordedEvents();
    expect(events.length).toBe(1);
    expect(events[0].status).toBe("refused_retrieval");
  });

  it("trả lời thành công khi câu hỏi trong phạm vi và LLM trích dẫn đúng nguồn", async () => {
    const appDb = new InMemoryAppDbRepository();
    const mockLlm: LLMProvider = {
      providerName: "mock-llm",
      modelName: "mock-model",
      generateText: async () => ({
        content: JSON.stringify({
          answerable: true,
          answer: "AgentForge là framework xây dựng multi-agent bằng TypeScript, hỗ trợ MCP Server.",
          citations: ["hash_agent_forge"],
        }),
        provider: "mock-llm",
        model: "mock-model",
      }),
    };

    const service = new ChatService({
      appDb,
      llmProvider: mockLlm,
      searchIndexItems: mockSearchIndex,
      digestDate: "2026-10-13",
    });

    const result = await service.processQuestion({
      question: "AgentForge làm được gì?",
      anonHash: "anon_user_2",
    });

    expect(result.status).toBe("answered");
    expect(result.data.answerable).toBe(true);
    expect(result.data.answer).toContain("AgentForge");
    expect((result.data as any).citations.length).toBe(1);
    expect((result.data as any).citations[0].key).toBe("hash_agent_forge");
    expect((result.data as any).citations[0].title).toBe("AgentForge");
  });

  it("chặn câu trả lời có trích dẫn giả mạo (key không nằm trong ngữ cảnh)", async () => {
    const appDb = new InMemoryAppDbRepository();
    const mockLlm: LLMProvider = {
      providerName: "mock-llm",
      modelName: "mock-model",
      generateText: async () => ({
        content: JSON.stringify({
          answerable: true,
          answer: "Dự án ảo rất xịn.",
          citations: ["fake_nonexistent_key"], // Trích dẫn bịa đặt!
        }),
        provider: "mock-llm",
        model: "mock-model",
      }),
    };

    const service = new ChatService({
      appDb,
      llmProvider: mockLlm,
      searchIndexItems: mockSearchIndex,
      digestDate: "2026-10-13",
    });

    const result = await service.processQuestion({
      question: "Có tool nào về Agent không?",
      anonHash: "anon_user_3",
    });

    // Bị chặn vì trích dẫn giả
    expect(result.status).toBe("refused_validation");
    expect(result.data.answerable).toBe(false);
  });

  it("tái sử dụng câu trả lời từ cache cho cùng một câu hỏi trong ngày", async () => {
    const appDb = new InMemoryAppDbRepository();
    let callCount = 0;
    const mockLlm: LLMProvider = {
      providerName: "mock-llm",
      modelName: "mock-model",
      generateText: async () => {
        callCount++;
        return {
          content: JSON.stringify({
            answerable: true,
            answer: "AgentForge là framework xây dựng multi-agent.",
            citations: ["hash_agent_forge"],
          }),
          provider: "mock-llm",
          model: "mock-model",
        };
      },
    };

    const service = new ChatService({
      appDb,
      llmProvider: mockLlm,
      searchIndexItems: mockSearchIndex,
      digestDate: "2026-10-13",
    });

    // Lần 1: gọi LLM
    const res1 = await service.processQuestion({
      question: "AgentForge là gì?",
      anonHash: "anon_user_4",
    });
    expect(res1.status).toBe("answered");
    expect(callCount).toBe(1);

    // Lần 2: lấy từ cache
    const res2 = await service.processQuestion({
      question: "agentforge là gì?", // chữ thường, cùng hash
      anonHash: "anon_user_4",
    });
    expect(res2.status).toBe("cached");
    expect(callCount).toBe(1); // không gọi lại LLM
  });

  it("chặn yêu cầu khi vượt quá rate limit theo IP hash", async () => {
    const appDb = new InMemoryAppDbRepository();
    const mockLlm: LLMProvider = {
      providerName: "mock-llm",
      modelName: "mock-model",
      generateText: async () => ({
        content: "{}",
        provider: "mock-llm",
        model: "mock-model",
      }),
    };

    const service = new ChatService({
      appDb,
      llmProvider: mockLlm,
      searchIndexItems: mockSearchIndex,
      digestDate: "2026-10-13",
    });

    // Giả lập gửi 10 request
    for (let i = 0; i < 10; i++) {
      await service.processQuestion({
        question: "thời tiết",
        anonHash: "spam_user",
      });
    }

    // Request thứ 11 phải ném RateLimitError
    await expect(
      service.processQuestion({
        question: "thời tiết",
        anonHash: "spam_user",
      })
    ).rejects.toThrow(RateLimitError);
  });
});
