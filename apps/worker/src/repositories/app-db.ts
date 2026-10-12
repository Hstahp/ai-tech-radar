export interface ChatEventRecord {
  userId?: string | null;
  anonHash?: string;
  digestDate?: string;
  status:
    | "answered"
    | "refused_retrieval"
    | "refused_model"
    | "refused_validation"
    | "cached"
    | "rate_limited"
    | "quota_exceeded"
    | "error";
  keySource?: "none" | "system" | "byok_browser" | "byok_server";
  questionHash: string;
  question?: string | null;
  retrievedCount?: number;
  topScore?: number;
  tokensIn?: number;
  tokensOut?: number;
  latencyMs?: number;
}

export interface ExplanationRecord {
  itemKey: string;
  contentHash: string;
  promptVersion: number;
  lang: string;
  status: "pending" | "ready" | "failed";
  bodyJson?: string | null;
  provider?: string | null;
  model?: string | null;
  lockedUntil?: string | null;
}

export interface AppDbRepository {
  getSetting(key: string, defaultValue: string): Promise<string>;
  getCachedAnswer(questionHash: string, digestDate: string): Promise<string | null>;
  saveCachedAnswer(questionHash: string, digestDate: string, responseJson: string): Promise<void>;
  logChatEvent(event: ChatEventRecord): Promise<void>;
  checkRateLimit(anonHash: string, windowSeconds: number, maxRequests: number): Promise<boolean>;

  // Quản lý Giải thích sâu (Deep Explain)
  getExplanation(itemKey: string, lang?: string): Promise<ExplanationRecord | null>;
  createPendingExplanation(
    itemKey: string,
    contentHash: string,
    promptVersion: number,
    lang: string,
    lockDurationSeconds: number
  ): Promise<boolean>;
  updateExplanationReady(
    itemKey: string,
    bodyJson: string,
    provider: string,
    model: string
  ): Promise<void>;
  updateExplanationFailed(itemKey: string): Promise<void>;
}

/**
 * In-Memory implementation của App DB phục vụ kiểm thử và chạy độc lập
 */
export class InMemoryAppDbRepository implements AppDbRepository {
  private settings = new Map<string, string>();
  private cache = new Map<string, { responseJson: string; hits: number }>();
  private events: ChatEventRecord[] = [];
  private rateLimitHits = new Map<string, number[]>();
  private explanations = new Map<string, ExplanationRecord>();

  constructor() {
    this.settings.set("chat.min_retrieval_score", "0.5");
    this.settings.set("chat.max_context_items", "8");
    this.settings.set("chat.max_question_chars", "500");
    this.settings.set("explain.user_daily_limit", "5");
    this.settings.set("explain.global_daily_limit", "30");
  }

  async getSetting(key: string, defaultValue: string): Promise<string> {
    return this.settings.get(key) ?? defaultValue;
  }

  async getCachedAnswer(questionHash: string, digestDate: string): Promise<string | null> {
    const key = `${questionHash}:${digestDate}`;
    const entry = this.cache.get(key);
    if (entry) {
      entry.hits++;
      return entry.responseJson;
    }
    return null;
  }

  async saveCachedAnswer(questionHash: string, digestDate: string, responseJson: string): Promise<void> {
    const key = `${questionHash}:${digestDate}`;
    this.cache.set(key, { responseJson, hits: 0 });
  }

  async logChatEvent(event: ChatEventRecord): Promise<void> {
    this.events.push(event);
  }

  async checkRateLimit(anonHash: string, windowSeconds: number, maxRequests: number): Promise<boolean> {
    const now = Date.now();
    const windowMs = windowSeconds * 1000;
    const timestamps = this.rateLimitHits.get(anonHash) ?? [];
    const validTimestamps = timestamps.filter((t) => now - t < windowMs);

    if (validTimestamps.length >= maxRequests) {
      return false; // Bị rate limit
    }

    validTimestamps.push(now);
    this.rateLimitHits.set(anonHash, validTimestamps);
    return true;
  }

  getRecordedEvents(): ChatEventRecord[] {
    return [...this.events];
  }

  // Quản lý Deep Explain với khóa mềm (soft lock)
  async getExplanation(itemKey: string, lang: string = "vi"): Promise<ExplanationRecord | null> {
    return this.explanations.get(`${itemKey}:${lang}`) ?? null;
  }

  async createPendingExplanation(
    itemKey: string,
    contentHash: string,
    promptVersion: number,
    lang: string = "vi",
    lockDurationSeconds: number = 60
  ): Promise<boolean> {
    const key = `${itemKey}:${lang}`;
    const existing = this.explanations.get(key);
    const now = new Date();

    if (existing) {
      if (existing.status === "ready") {
        return false;
      }
      if (existing.status === "pending" && existing.lockedUntil) {
        const lockExpire = new Date(existing.lockedUntil);
        if (now < lockExpire) {
          // Còn hạn khóa mềm -> không cho phép tạo đè
          return false;
        }
      }
    }

    const lockedUntil = new Date(now.getTime() + lockDurationSeconds * 1000).toISOString();
    this.explanations.set(key, {
      itemKey,
      contentHash,
      promptVersion,
      lang,
      status: "pending",
      lockedUntil,
    });
    return true;
  }

  async updateExplanationReady(
    itemKey: string,
    bodyJson: string,
    provider: string,
    model: string
  ): Promise<void> {
    const key = `${itemKey}:vi`;
    const record = this.explanations.get(key) ?? {
      itemKey,
      contentHash: "hash",
      promptVersion: 1,
      lang: "vi",
      status: "ready",
    };
    record.status = "ready";
    record.bodyJson = bodyJson;
    record.provider = provider;
    record.model = model;
    record.lockedUntil = null;
    this.explanations.set(key, record);
  }

  async updateExplanationFailed(itemKey: string): Promise<void> {
    const key = `${itemKey}:vi`;
    const record = this.explanations.get(key);
    if (record) {
      record.status = "failed";
      record.lockedUntil = null;
    }
  }
}
