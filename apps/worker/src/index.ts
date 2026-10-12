import { Hono } from "hono";
import { cors } from "hono/cors";
import { hashIp } from "./lib/hash.js";
import { ChatService } from "./chat/service.js";
import { InMemoryAppDbRepository } from "./repositories/app-db.js";
import type { SearchIndexItem, LLMProvider } from "@radar/core";

export interface Env {
  GEMINI_API_KEY?: string;
  GROQ_API_KEY?: string;
  ALLOWED_ORIGIN?: string;
  SEARCH_INDEX_URL?: string;
}

const app = new Hono<{ Bindings: Env }>();

app.use("*", cors());

app.get("/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.post("/api/chat", async (c) => {
  try {
    const body = await c.req.json<{ question?: string }>();
    if (!body || !body.question) {
      return c.json({ error: { code: "BAD_REQUEST", message: "Thiếu trường 'question'." } }, 400);
    }

    const clientIp = c.req.header("cf-connecting-ip") ?? c.req.header("x-forwarded-for") ?? "127.0.0.1";
    const anonHash = await hashIp(clientIp);

    // Mock search index và AppDb cho instance
    const appDb = new InMemoryAppDbRepository();

    // LLM Provider mock/wrapper
    const llmProvider: LLMProvider = {
      providerName: "worker-llm",
      modelName: "mock-model",
      generateText: async () => {
        return {
          content: JSON.stringify({
            answerable: true,
            answer: "Đây là câu trả lời mẫu dựa trên tin tức trong ngày.",
            citations: ["demo_key"],
          }),
          provider: "worker-llm",
          model: "mock-model",
        };
      },
    };

    const mockItems: SearchIndexItem[] = [
      {
        key: "demo_key",
        title: "Demo AI Project",
        category: "repo",
        url: "https://github.com/demo/project",
        tags: ["agent", "devtools"],
        purpose: "Dự án thử nghiệm AI",
        highlight: "Tính năng nổi bật",
      },
    ];

    const chatService = new ChatService({
      appDb,
      llmProvider,
      searchIndexItems: mockItems,
      digestDate: new Date().toISOString().split("T")[0],
    });

    const result = await chatService.processQuestion({
      question: body.question,
      anonHash,
    });

    return c.json(result);
  } catch (err: any) {
    if (err.statusCode) {
      return c.json({ error: { code: err.code, message: err.message } }, err.statusCode);
    }
    return c.json({ error: { code: "INTERNAL_ERROR", message: "Đã xảy ra lỗi hệ thống." } }, 500);
  }
});

app.post("/api/items/:key/explain", async (c) => {
  try {
    const key = c.req.param("key");
    const appDb = new InMemoryAppDbRepository();

    const llmProvider: LLMProvider = {
      providerName: "worker-llm",
      modelName: "mock-model",
      generateText: async () => {
        return {
          content: JSON.stringify({
            what_it_is: "Bản chất dự án mẫu",
            how_it_works: "Cơ chế hoạt động chi tiết",
            use_cases: ["Trường hợp 1", "Trường hợp 2"],
            limitations: ["Hạn chế 1"],
            getting_started: "npm install demo",
            confidence: "high",
          }),
          provider: "worker-llm",
          model: "mock-model",
        };
      },
    };

    const mockItems: SearchIndexItem[] = [
      {
        key,
        title: "Demo AI Project",
        category: "repo",
        url: "https://github.com/demo/project",
        tags: ["agent", "devtools"],
        purpose: "Dự án thử nghiệm AI",
        highlight: "Tính năng nổi bật",
      },
    ];

    const { ExplainService } = await import("./explain/service.js");
    const explainService = new ExplainService({
      appDb,
      llmProvider,
      searchIndexItems: mockItems,
    });

    const result = await explainService.explainItem(key);
    if (result.status === "pending") {
      return c.json(result, 202);
    }
    return c.json(result);
  } catch (err: any) {
    if (err.statusCode) {
      return c.json({ error: { code: err.code, message: err.message } }, err.statusCode);
    }
    return c.json({ error: { code: "INTERNAL_ERROR", message: "Đã xảy ra lỗi hệ thống." } }, 500);
  }
});

export default app;
