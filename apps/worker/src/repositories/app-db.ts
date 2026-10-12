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

export interface AppDbRepository {
  getSetting(key: string, defaultValue: string): Promise<string>;
  getCachedAnswer(questionHash: string, digestDate: string): Promise<string | null>;
  saveCachedAnswer(questionHash: string, digestDate: string, responseJson: string): Promise<void>;
  logChatEvent(event: ChatEventRecord): Promise<void>;
  checkRateLimit(anonHash: string, windowSeconds: number, maxRequests: number): Promise<boolean>;
}

/**
 * In-Memory implementation của App DB phục vụ kiểm thử và chạy độc lập
 */
export class InMemoryAppDbRepository implements AppDbRepository {
  private settings = new Map<string, string>();
  private cache = new Map<string, { responseJson: string; hits: number }>();
  private events: ChatEventRecord[] = [];
  private rateLimitHits = new Map<string, number[]>();

  constructor() {
    this.settings.set("chat.min_retrieval_score", "0.5");
    this.settings.set("chat.max_context_items", "8");
    this.settings.set("chat.max_question_chars", "500");
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
}
