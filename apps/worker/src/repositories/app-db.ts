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

export interface UserRecord {
  id: string;
  email: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  role: "user" | "admin";
  status: "active" | "suspended";
  createdAt: string;
  lastLoginAt?: string | null;
}

export interface SessionRecord {
  tokenHash: string;
  userId: string;
  expiresAt: string;
  createdAt: string;
  userAgent?: string | null;
}

export interface UserQuotaDailyRecord {
  userId: string;
  usageDate: string;
  chatRequests: number;
  explainRequests: number;
  tokensIn: number;
  tokensOut: number;
}

export interface AppDbRepository {
  getSetting(key: string, defaultValue: string): Promise<string>;
  getCachedAnswer(questionHash: string, digestDate: string): Promise<string | null>;
  saveCachedAnswer(questionHash: string, digestDate: string, responseJson: string): Promise<void>;
  logChatEvent(event: ChatEventRecord): Promise<void>;
  checkRateLimit(anonHash: string, windowSeconds: number, maxRequests: number): Promise<boolean>;

  // Quan ly Giai thich sau (Deep Explain)
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

  // Quan ly User & Auth
  findUserById(id: string): Promise<UserRecord | null>;
  findUserByEmail(email: string): Promise<UserRecord | null>;
  findUserByOAuth(provider: "github" | "google", providerUserId: string): Promise<UserRecord | null>;
  createUser(user: {
    id: string;
    email: string;
    displayName?: string | null;
    avatarUrl?: string | null;
    role?: "user" | "admin";
  }): Promise<UserRecord>;
  linkOAuthAccount(provider: "github" | "google", providerUserId: string, userId: string): Promise<void>;
  updateUserLastLogin(id: string): Promise<void>;
  deleteUser(id: string): Promise<void>;

  // Session
  createSession(tokenHash: string, userId: string, expiresAt: string, userAgent?: string | null): Promise<void>;
  getSession(tokenHash: string): Promise<SessionRecord | null>;
  deleteSession(tokenHash: string): Promise<void>;

  // User Tags
  getUserTags(userId: string): Promise<string[]>;
  setUserTags(userId: string, tags: string[]): Promise<void>;

  // User Quota
  getUserDailyQuota(userId: string, usageDate: string): Promise<UserQuotaDailyRecord>;
  incrementUserChatQuota(userId: string, usageDate: string, tokensIn?: number, tokensOut?: number): Promise<void>;
  incrementUserExplainQuota(userId: string, usageDate: string, tokensIn?: number, tokensOut?: number): Promise<void>;
}

/**
 * In-Memory implementation cua App DB phuc vu kiem thu va chay doc lap
 */
export class InMemoryAppDbRepository implements AppDbRepository {
  private settings = new Map<string, string>();
  private cache = new Map<string, { responseJson: string; hits: number }>();
  private events: ChatEventRecord[] = [];
  private rateLimitHits = new Map<string, number[]>();
  private explanations = new Map<string, ExplanationRecord>();

  private users = new Map<string, UserRecord>();
  private oauthAccounts = new Map<string, { provider: "github" | "google"; providerUserId: string; userId: string }>();
  private sessions = new Map<string, SessionRecord>();
  private userTags = new Map<string, Set<string>>();
  private userQuotas = new Map<string, UserQuotaDailyRecord>();


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

  // Quan ly User & Auth
  async findUserById(id: string): Promise<UserRecord | null> {
    return this.users.get(id) ?? null;
  }

  async findUserByEmail(email: string): Promise<UserRecord | null> {
    const lower = email.toLowerCase();
    for (const user of this.users.values()) {
      if (user.email.toLowerCase() === lower) {
        return user;
      }
    }
    return null;
  }

  async findUserByOAuth(
    provider: "github" | "google",
    providerUserId: string
  ): Promise<UserRecord | null> {
    const key = `${provider}:${providerUserId}`;
    const link = this.oauthAccounts.get(key);
    if (!link) return null;
    return this.findUserById(link.userId);
  }

  async createUser(data: {
    id: string;
    email: string;
    displayName?: string | null;
    avatarUrl?: string | null;
    role?: "user" | "admin";
  }): Promise<UserRecord> {
    const record: UserRecord = {
      id: data.id,
      email: data.email,
      displayName: data.displayName ?? null,
      avatarUrl: data.avatarUrl ?? null,
      role: data.role ?? "user",
      status: "active",
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };
    this.users.set(data.id, record);
    return record;
  }

  async linkOAuthAccount(
    provider: "github" | "google",
    providerUserId: string,
    userId: string
  ): Promise<void> {
    const key = `${provider}:${providerUserId}`;
    this.oauthAccounts.set(key, { provider, providerUserId, userId });
  }

  async updateUserLastLogin(id: string): Promise<void> {
    const user = this.users.get(id);
    if (user) {
      user.lastLoginAt = new Date().toISOString();
    }
  }

  async deleteUser(id: string): Promise<void> {
    this.users.delete(id);
    for (const [key, link] of this.oauthAccounts.entries()) {
      if (link.userId === id) this.oauthAccounts.delete(key);
    }
    for (const [key, session] of this.sessions.entries()) {
      if (session.userId === id) this.sessions.delete(key);
    }
    this.userTags.delete(id);
    for (const [key, quota] of this.userQuotas.entries()) {
      if (quota.userId === id) this.userQuotas.delete(key);
    }
  }

  // Session
  async createSession(
    tokenHash: string,
    userId: string,
    expiresAt: string,
    userAgent?: string | null
  ): Promise<void> {
    this.sessions.set(tokenHash, {
      tokenHash,
      userId,
      expiresAt,
      createdAt: new Date().toISOString(),
      userAgent: userAgent ?? null,
    });
  }

  async getSession(tokenHash: string): Promise<SessionRecord | null> {
    const session = this.sessions.get(tokenHash);
    if (!session) return null;
    if (new Date(session.expiresAt) < new Date()) {
      this.sessions.delete(tokenHash);
      return null;
    }
    return session;
  }

  async deleteSession(tokenHash: string): Promise<void> {
    this.sessions.delete(tokenHash);
  }

  // User Tags
  async getUserTags(userId: string): Promise<string[]> {
    const tags = this.userTags.get(userId);
    return tags ? Array.from(tags) : [];
  }

  async setUserTags(userId: string, tags: string[]): Promise<void> {
    this.userTags.set(userId, new Set(tags));
  }

  // User Quota Daily
  async getUserDailyQuota(userId: string, usageDate: string): Promise<UserQuotaDailyRecord> {
    const key = `${userId}:${usageDate}`;
    return (
      this.userQuotas.get(key) ?? {
        userId,
        usageDate,
        chatRequests: 0,
        explainRequests: 0,
        tokensIn: 0,
        tokensOut: 0,
      }
    );
  }

  async incrementUserChatQuota(
    userId: string,
    usageDate: string,
    tokensIn: number = 0,
    tokensOut: number = 0
  ): Promise<void> {
    const key = `${userId}:${usageDate}`;
    const quota = await this.getUserDailyQuota(userId, usageDate);
    quota.chatRequests += 1;
    quota.tokensIn += tokensIn;
    quota.tokensOut += tokensOut;
    this.userQuotas.set(key, quota);
  }

  async incrementUserExplainQuota(
    userId: string,
    usageDate: string,
    tokensIn: number = 0,
    tokensOut: number = 0
  ): Promise<void> {
    const key = `${userId}:${usageDate}`;
    const quota = await this.getUserDailyQuota(userId, usageDate);
    quota.explainRequests += 1;
    quota.tokensIn += tokensIn;
    quota.tokensOut += tokensOut;
    this.userQuotas.set(key, quota);
  }
}

