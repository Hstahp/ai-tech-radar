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

export default app;
