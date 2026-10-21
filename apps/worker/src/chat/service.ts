import type { LLMProvider, SearchIndexItem } from "@radar/core";
import { sha256 } from "../lib/hash.js";
import { retrieveRelevantItems } from "../search/retrieval.js";
import { buildRefusalResponse, type RefusalResponse } from "./guard.js";
import { CHAT_SYSTEM_PROMPT, buildChatUserPrompt } from "./prompt.js";
import { validateAndEnrichChatAnswer, type ValidatedChatResult } from "./validator.js";
import type { AppDbRepository } from "../repositories/app-db.js";
import { RateLimitError, QuotaExceededError } from "../lib/errors.js";

export interface ChatServiceOptions {
  appDb: AppDbRepository;
  llmProvider: LLMProvider;
  searchIndexItems: SearchIndexItem[];
  digestDate: string;
}

export interface ChatRequestPayload {
  question: string;
  anonHash: string;
  userId?: string | null;
}

export interface ChatResponseResult {
  status:
    | "answered"
    | "refused_retrieval"
    | "refused_model"
    | "refused_validation"
    | "cached"
    | "rate_limited";
  data: ValidatedChatResult["data"] | RefusalResponse;
}

export class ChatService {
  constructor(private readonly options: ChatServiceOptions) {}

  async processQuestion(payload: ChatRequestPayload): Promise<ChatResponseResult> {
    const startTime = Date.now();
    const cleanQuestion = payload.question.trim();

    // 1. Kiểm tra độ dài câu hỏi
    const maxChars = parseInt(
      await this.options.appDb.getSetting("chat.max_question_chars", "500"),
      10
    );
    if (!cleanQuestion || cleanQuestion.length > maxChars) {
      throw new Error(`Câu hỏi không hợp lệ (tối đa ${maxChars} ký tự).`);
    }

    // 2. Rate limit theo IP hash (tối đa 10 request/phút)
    const isAllowed = await this.options.appDb.checkRateLimit(payload.anonHash, 60, 10);
    if (!isAllowed) {
      await this.options.appDb.logChatEvent({
        userId: payload.userId,
        anonHash: payload.anonHash,
        digestDate: this.options.digestDate,
        status: "rate_limited",
        questionHash: await sha256(cleanQuestion),
      });
      throw new RateLimitError();
    }

    // 2.1. Kiểm tra hạn mức theo user (nếu đã đăng nhập)
    if (payload.userId) {
      const userLimit = parseInt(
        await this.options.appDb.getSetting("chat.user_daily_limit", "10"),
        10
      );
      const userQuota = await this.options.appDb.getUserDailyQuota(
        payload.userId,
        this.options.digestDate
      );
      if (userQuota.chatRequests >= userLimit) {
        await this.options.appDb.logChatEvent({
          userId: payload.userId,
          anonHash: payload.anonHash,
          digestDate: this.options.digestDate,
          status: "quota_exceeded",
          questionHash: await sha256(cleanQuestion),
        });
        throw new QuotaExceededError(
          `Bạn đã dùng hết hạn mức chat trong ngày (${userLimit} câu). Hẹn bạn ngày mai nhé!`
        );
      }
    }

    const questionHash = await sha256(cleanQuestion.toLowerCase());

    // 3. Tra cứu Cache
    const cached = await this.options.appDb.getCachedAnswer(questionHash, this.options.digestDate);
    if (cached) {
      const parsedCache = JSON.parse(cached);
      await this.options.appDb.logChatEvent({
        userId: payload.userId,
        anonHash: payload.anonHash,
        digestDate: this.options.digestDate,
        status: "cached",
        questionHash,
        latencyMs: Date.now() - startTime,
      });
      return {
        status: "cached",
        data: parsedCache,
      };
    }

    // 4. Truy xuất (Retrieval) từ Search Index
    const minScore = parseFloat(
      await this.options.appDb.getSetting("chat.min_retrieval_score", "0.5")
    );
    const maxItems = parseInt(
      await this.options.appDb.getSetting("chat.max_context_items", "8"),
      10
    );

    const retrieval = retrieveRelevantItems(
      this.options.searchIndexItems,
      cleanQuestion,
      maxItems,
      minScore
    );

    // 5. Nếu không có mục nào đạt ngưỡng -> TỪ CHỐI NGAY (0 token LLM!)
    if (retrieval.items.length === 0) {
      const refusalData = buildRefusalResponse(this.options.searchIndexItems);
      await this.options.appDb.logChatEvent({
        userId: payload.userId,
        anonHash: payload.anonHash,
        digestDate: this.options.digestDate,
        status: "refused_retrieval",
        questionHash,
        question: cleanQuestion, // lưu để tinh chỉnh
        retrievedCount: 0,
        topScore: retrieval.topScore,
        latencyMs: Date.now() - startTime,
      });
      return {
        status: "refused_retrieval",
        data: refusalData,
      };
    }

    // 6. Gọi LLM Provider với ngữ cảnh đã truy xuất
    const userPrompt = buildChatUserPrompt(cleanQuestion, retrieval.items);
    let rawResponse = "";
    try {
      const res = await this.options.llmProvider.generateText(userPrompt, {
        systemPrompt: CHAT_SYSTEM_PROMPT,
        jsonMode: true,
      });
      rawResponse = res.content;
    } catch (err: unknown) {
      console.warn('[CHAT_LLM_ERROR]', err);
      // LLM Provider lỗi
      const refusalData = buildRefusalResponse(retrieval.items);
      await this.options.appDb.logChatEvent({
        userId: payload.userId,
        anonHash: payload.anonHash,
        digestDate: this.options.digestDate,
        status: "refused_model",
        questionHash,
        latencyMs: Date.now() - startTime,
      });
      return {
        status: "refused_model",
        data: refusalData,
      };
    }

    // 7. Validate đầu ra bằng Zod và kiểm tra trích dẫn (chống hallucination)
    let parsedJson: unknown;
    try {
      const cleaned = rawResponse
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();
      parsedJson = JSON.parse(cleaned);
    } catch {
      parsedJson = null;
    }

    const validation = validateAndEnrichChatAnswer(parsedJson, retrieval.items);

    if (!validation.isValid) {
      await this.options.appDb.logChatEvent({
        userId: payload.userId,
        anonHash: payload.anonHash,
        digestDate: this.options.digestDate,
        status: "refused_validation",
        questionHash,
        question: cleanQuestion,
        retrievedCount: retrieval.items.length,
        topScore: retrieval.topScore,
        latencyMs: Date.now() - startTime,
      });
      return {
        status: "refused_validation",
        data: validation.data,
      };
    }

    // 8. Lưu cache và ghi sự kiện thành công
    await this.options.appDb.saveCachedAnswer(
      questionHash,
      this.options.digestDate,
      JSON.stringify(validation.data)
    );

    await this.options.appDb.logChatEvent({
      userId: payload.userId,
      anonHash: payload.anonHash,
      digestDate: this.options.digestDate,
      status: "answered",
      questionHash,
      retrievedCount: retrieval.items.length,
      topScore: retrieval.topScore,
      latencyMs: Date.now() - startTime,
    });

    if (payload.userId) {
      await this.options.appDb.incrementUserChatQuota(
        payload.userId,
        this.options.digestDate
      );
    }

    return {
      status: "answered",
      data: validation.data,
    };
  }
}
