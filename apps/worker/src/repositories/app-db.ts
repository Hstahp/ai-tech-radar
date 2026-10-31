import type { CreateBookmark, UserBookmarkItem } from '@radar/core';
export interface ChatEventRecord {
    userId?: string | null;
    anonHash?: string;
    digestDate?: string;
    status:
        | 'answered'
        | 'refused_retrieval'
        | 'refused_model'
        | 'refused_validation'
        | 'cached'
        | 'rate_limited'
        | 'quota_exceeded'
        | 'error';
    keySource?: 'none' | 'system' | 'byok_browser' | 'byok_server';
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
    status: 'pending' | 'ready' | 'failed';
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
    role: 'user' | 'admin';
    status: 'active' | 'suspended';
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
        lockDurationSeconds: number,
    ): Promise<boolean>;
    updateExplanationReady(itemKey: string, bodyJson: string, provider: string, model: string): Promise<void>;
    updateExplanationFailed(itemKey: string): Promise<void>;

    // Quan ly User & Auth
    findUserById(id: string): Promise<UserRecord | null>;
    findUserByEmail(email: string): Promise<UserRecord | null>;
    findUserByOAuth(provider: 'github' | 'google', providerUserId: string): Promise<UserRecord | null>;
    createUser(user: {
        id: string;
        email: string;
        displayName?: string | null;
        avatarUrl?: string | null;
        role?: 'user' | 'admin';
    }): Promise<UserRecord>;
    linkOAuthAccount(provider: 'github' | 'google', providerUserId: string, userId: string): Promise<void>;
    updateUserLastLogin(id: string): Promise<void>;
    deleteUser(id: string): Promise<void>;

    // Session
    createSession(tokenHash: string, userId: string, expiresAt: string, userAgent?: string | null): Promise<void>;
    getSession(tokenHash: string): Promise<SessionRecord | null>;
    deleteSession(tokenHash: string): Promise<void>;
    isSessionRevoked?(tokenHash: string): Promise<boolean>;
    isUserDeleted?(userId: string): Promise<boolean>;

    // User Tags
    getUserTags(userId: string): Promise<string[]>;
    setUserTags(userId: string, tags: string[]): Promise<void>;

    // User Quota
    getUserDailyQuota(userId: string, usageDate: string): Promise<UserQuotaDailyRecord>;
    incrementUserChatQuota(userId: string, usageDate: string, tokensIn?: number, tokensOut?: number): Promise<void>;
    incrementUserExplainQuota(userId: string, usageDate: string, tokensIn?: number, tokensOut?: number): Promise<void>;

    // Admin & Settings
    getAllSettings(): Promise<Record<string, string>>;
    updateSetting(key: string, value: string, actorUserId?: string): Promise<void>;

    // Tag Settings & Active Tags
    getTagSettings(): Promise<TagSettingRecord[]>;
    getActiveTags(): Promise<Array<{ slug: string; maxItems: number }>>;
    updateTagSetting(
        slug: string,
        updates: Partial<{ enabled: number; isSystem: number; maxItems: number | null }>,
    ): Promise<void>;
    createTagSetting(tag: {
        slug: string;
        label: string;
        enabled?: number;
        isSystem?: number;
        maxItems?: number | null;
    }): Promise<void>;

    // Tag Requests
    getTagRequests(status?: 'pending' | 'approved' | 'rejected'): Promise<TagRequestRecord[]>;
    createTagRequest(userId: string, slugProposed: string, label: string, reason?: string): Promise<TagRequestRecord>;
    reviewTagRequest(id: number, status: 'approved' | 'rejected', reviewerId: string): Promise<TagRequestRecord | null>;

    // Admin Users
    getAdminUsers(
        search?: string,
    ): Promise<Array<UserRecord & { dailyChatRequests: number; dailyExplainRequests: number }>>;
    updateUserRoleAndStatus(
        userId: string,
        updates: { role?: 'user' | 'admin'; status?: 'active' | 'suspended' },
    ): Promise<UserRecord | null>;

    // Audit Log
    insertAuditLog(log: {
        actorUserId?: string | null;
        action: string;
        targetType?: string | null;
        targetId?: string | null;
        metadataJson?: string | null;
    }): Promise<AuditLogRecord>;
    getAuditLogs(limit?: number, offset?: number): Promise<AuditLogRecord[]>;

    // Admin Overview
    getAdminOverview(today: string): Promise<AdminOverviewMetrics>;

    // User Bookmarks
    addBookmark(userId: string, data: CreateBookmark): Promise<UserBookmarkItem>;
    removeBookmark(userId: string, itemKey: string): Promise<void>;
    getUserBookmarks(userId: string): Promise<UserBookmarkItem[]>;
}

export interface TagSettingRecord {
    slug: string;
    label: string;
    enabled: number;
    isSystem: number;
    maxItems: number | null;
    followers?: number;
}

export interface TagRequestRecord {
    id: number;
    userId: string;
    userEmail?: string;
    slugProposed: string;
    label: string;
    reason?: string | null;
    status: 'pending' | 'approved' | 'rejected';
    reviewedBy?: string | null;
    reviewedAt?: string | null;
    createdAt: string;
}

export interface AuditLogRecord {
    id: number;
    actorUserId?: string | null;
    actorEmail?: string | null;
    action: string;
    targetType?: string | null;
    targetId?: string | null;
    metadataJson?: string | null;
    createdAt: string;
}

export interface AdminOverviewMetrics {
    today: string;
    totalChatRequests: number;
    totalExplainRequests: number;
    totalTokens: number;
    refusedChatRequests: number;
    activeUsersCount: number;
    chatLimit: number;
    explainLimit: number;
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
    private oauthAccounts = new Map<
        string,
        { provider: 'github' | 'google'; providerUserId: string; userId: string }
    >();
    private sessions = new Map<string, SessionRecord>();
    private userTags = new Map<string, Set<string>>();
    private userQuotas = new Map<string, UserQuotaDailyRecord>();
    private tagSettings = new Map<string, TagSettingRecord>();
    private tagRequests: TagRequestRecord[] = [];
    private auditLogs: AuditLogRecord[] = [];
    private nextTagRequestId = 1;
    private nextAuditLogId = 1;
    private bookmarks = new Map<string, UserBookmarkItem & { userId: string }>();
    private revokedTokens = new Set<string>();
    private deletedUserIds = new Set<string>();

    async isSessionRevoked(tokenHash: string): Promise<boolean> {
        return this.revokedTokens.has(tokenHash);
    }

    async isUserDeleted(userId: string): Promise<boolean> {
        return this.deletedUserIds.has(userId);
    }

    constructor() {
        this.settings.set('chat.user_daily_limit', '10');
        this.settings.set('chat.global_daily_limit', '300');
        this.settings.set('chat.max_question_chars', '500');
        this.settings.set('chat.history_turns', '2');
        this.settings.set('chat.max_context_items', '8');
        this.settings.set('chat.min_retrieval_score', '0.5');
        this.settings.set('explain.user_daily_limit', '5');
        this.settings.set('explain.global_daily_limit', '30');
        this.settings.set('tags.max_per_user', '10');
        this.settings.set('tags.max_active', '30');
        this.settings.set('tags.max_items_per_tag', '10');

        const defaultTags: TagSettingRecord[] = [
            { slug: 'github', label: 'GitHub Trending', enabled: 1, isSystem: 1, maxItems: 10 },
            { slug: 'extension', label: 'VS Code Extensions', enabled: 1, isSystem: 1, maxItems: 10 },
            { slug: 'model', label: 'AI Models', enabled: 1, isSystem: 1, maxItems: 10 },
            { slug: 'paper', label: 'AI Research Papers', enabled: 1, isSystem: 1, maxItems: 10 },
            { slug: 'mcp', label: 'Model Context Protocol', enabled: 1, isSystem: 1, maxItems: 10 },
            { slug: 'agent', label: 'AI Agents', enabled: 1, isSystem: 1, maxItems: 10 },
            { slug: 'coding-assistant', label: 'Coding Assistants', enabled: 1, isSystem: 1, maxItems: 10 },
            { slug: 'rag', label: 'RAG & Retrieval', enabled: 1, isSystem: 1, maxItems: 10 },
            { slug: 'local-llm', label: 'Local LLMs', enabled: 1, isSystem: 1, maxItems: 10 },
            { slug: 'testing', label: 'AI Testing', enabled: 1, isSystem: 1, maxItems: 10 },
            { slug: 'devtools', label: 'Developer Tools', enabled: 1, isSystem: 1, maxItems: 10 },
            { slug: 'security', label: 'AI Security', enabled: 1, isSystem: 1, maxItems: 10 },
            { slug: 'data', label: 'Data & Vector DBs', enabled: 1, isSystem: 1, maxItems: 10 },
            { slug: 'infra', label: 'AI Infrastructure', enabled: 1, isSystem: 1, maxItems: 10 },
            { slug: 'open-source', label: 'Open Source AI', enabled: 1, isSystem: 1, maxItems: 10 },
        ];
        for (const tag of defaultTags) {
            this.tagSettings.set(tag.slug, tag);
        }
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
    async getExplanation(itemKey: string, lang: string = 'vi'): Promise<ExplanationRecord | null> {
        return this.explanations.get(`${itemKey}:${lang}`) ?? null;
    }

    async createPendingExplanation(
        itemKey: string,
        contentHash: string,
        promptVersion: number,
        lang: string = 'vi',
        lockDurationSeconds: number = 60,
    ): Promise<boolean> {
        const key = `${itemKey}:${lang}`;
        const existing = this.explanations.get(key);
        const now = new Date();

        if (existing) {
            if (existing.status === 'ready') {
                return false;
            }
            if (existing.status === 'pending' && existing.lockedUntil) {
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
            status: 'pending',
            lockedUntil,
        });
        return true;
    }

    async updateExplanationReady(itemKey: string, bodyJson: string, provider: string, model: string): Promise<void> {
        const key = `${itemKey}:vi`;
        const record = this.explanations.get(key) ?? {
            itemKey,
            contentHash: 'hash',
            promptVersion: 1,
            lang: 'vi',
            status: 'ready',
        };
        record.status = 'ready';
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
            record.status = 'failed';
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

    async findUserByOAuth(provider: 'github' | 'google', providerUserId: string): Promise<UserRecord | null> {
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
        role?: 'user' | 'admin';
    }): Promise<UserRecord> {
        const record: UserRecord = {
            id: data.id,
            email: data.email,
            displayName: data.displayName ?? null,
            avatarUrl: data.avatarUrl ?? null,
            role: data.role ?? 'user',
            status: 'active',
            createdAt: new Date().toISOString(),
            lastLoginAt: new Date().toISOString(),
        };
        this.users.set(data.id, record);
        return record;
    }

    async linkOAuthAccount(provider: 'github' | 'google', providerUserId: string, userId: string): Promise<void> {
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
        this.deletedUserIds.add(id);
        for (const [key, link] of this.oauthAccounts.entries()) {
            if (link.userId === id) this.oauthAccounts.delete(key);
        }
        for (const [key, session] of this.sessions.entries()) {
            if (session.userId === id) this.sessions.delete(key);
        }
        this.userTags.delete(id);
        for (const [key, b] of this.bookmarks.entries()) {
            if (b.userId === id) this.bookmarks.delete(key);
        }
        for (const [key, quota] of this.userQuotas.entries()) {
            if (quota.userId === id) this.userQuotas.delete(key);
        }
    }

    // Session
    async createSession(
        tokenHash: string,
        userId: string,
        expiresAt: string,
        userAgent?: string | null,
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
        this.revokedTokens.add(tokenHash);
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
        tokensOut: number = 0,
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
        tokensOut: number = 0,
    ): Promise<void> {
        const key = `${userId}:${usageDate}`;
        const quota = await this.getUserDailyQuota(userId, usageDate);
        quota.explainRequests += 1;
        quota.tokensIn += tokensIn;
        quota.tokensOut += tokensOut;
        this.userQuotas.set(key, quota);
    }

    // Bookmarks
    async addBookmark(userId: string, data: CreateBookmark): Promise<UserBookmarkItem> {
        const item: UserBookmarkItem = {
            itemKey: data.itemKey,
            title: data.title,
            url: data.url,
            category: data.category,
            author: data.author ?? null,
            tags: data.tags ?? null,
            summary: data.summary ?? null,
            createdAt: new Date().toISOString(),
        };
        const key = `${userId}:${data.itemKey}`;
        this.bookmarks.set(key, { ...item, userId });
        return item;
    }

    async removeBookmark(userId: string, itemKey: string): Promise<void> {
        const key = `${userId}:${itemKey}`;
        this.bookmarks.delete(key);
    }

    async getUserBookmarks(userId: string): Promise<UserBookmarkItem[]> {
        const results: UserBookmarkItem[] = [];
        for (const b of this.bookmarks.values()) {
            if (b.userId === userId) {
                const { userId: _, ...item } = b;
                results.push(item);
            }
        }
        results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        return results;
    }

    // Settings
    async getAllSettings(): Promise<Record<string, string>> {
        const res: Record<string, string> = {};
        for (const [k, v] of this.settings.entries()) {
            res[k] = v;
        }
        return res;
    }

    async updateSetting(key: string, value: string, _actorUserId?: string): Promise<void> {
        this.settings.set(key, value);
    }

    // Tag Settings
    async getTagSettings(): Promise<TagSettingRecord[]> {
        const followersMap = new Map<string, number>();
        for (const [userId, tags] of this.userTags.entries()) {
            const user = this.users.get(userId);
            if (user && user.status === 'active') {
                for (const t of tags) {
                    followersMap.set(t, (followersMap.get(t) ?? 0) + 1);
                }
            }
        }

        return Array.from(this.tagSettings.values()).map((tag) => ({
            ...tag,
            followers: followersMap.get(tag.slug) ?? 0,
        }));
    }

    async getActiveTags(): Promise<Array<{ slug: string; maxItems: number }>> {
        const maxActive = Number(await this.getSetting('tags.max_active', '30'));
        const defaultMaxItems = Number(await this.getSetting('tags.max_items_per_tag', '10'));

        const allTags = await this.getTagSettings();
        // Tag hoạt động = enabled && (isSystem = 1 hoặc followers > 0)
        const active = allTags.filter((t) => t.enabled === 1 && (t.isSystem === 1 || (t.followers ?? 0) > 0));

        // Sắp xếp: follower giảm dần, sau đó isSystem giảm dần, sau đó slug tăng dần
        active.sort((a, b) => {
            const followersDiff = (b.followers ?? 0) - (a.followers ?? 0);
            if (followersDiff !== 0) return followersDiff;
            const systemDiff = (b.isSystem ?? 0) - (a.isSystem ?? 0);
            if (systemDiff !== 0) return systemDiff;
            return a.slug.localeCompare(b.slug);
        });

        const sliced = active.slice(0, maxActive);
        return sliced.map((t) => ({
            slug: t.slug,
            maxItems: t.maxItems ?? defaultMaxItems,
        }));
    }

    async updateTagSetting(
        slug: string,
        updates: Partial<{ enabled: number; isSystem: number; maxItems: number | null }>,
    ): Promise<void> {
        const existing = this.tagSettings.get(slug);
        if (!existing) return;
        if (updates.enabled !== undefined) existing.enabled = updates.enabled;
        if (updates.isSystem !== undefined) existing.isSystem = updates.isSystem;
        if (updates.maxItems !== undefined) existing.maxItems = updates.maxItems;
        this.tagSettings.set(slug, existing);
    }

    async createTagSetting(tag: {
        slug: string;
        label: string;
        enabled?: number;
        isSystem?: number;
        maxItems?: number | null;
    }): Promise<void> {
        this.tagSettings.set(tag.slug, {
            slug: tag.slug,
            label: tag.label,
            enabled: tag.enabled ?? 1,
            isSystem: tag.isSystem ?? 0,
            maxItems: tag.maxItems ?? null,
        });
    }

    // Tag Requests
    async getTagRequests(status?: 'pending' | 'approved' | 'rejected'): Promise<TagRequestRecord[]> {
        const list = status ? this.tagRequests.filter((r) => r.status === status) : [...this.tagRequests];
        return list
            .map((r) => {
                const u = this.users.get(r.userId);
                return {
                    ...r,
                    userEmail: u?.email,
                };
            })
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    async createTagRequest(
        userId: string,
        slugProposed: string,
        label: string,
        reason?: string,
    ): Promise<TagRequestRecord> {
        const user = this.users.get(userId);
        const record: TagRequestRecord = {
            id: this.nextTagRequestId++,
            userId,
            userEmail: user?.email,
            slugProposed,
            label,
            reason: reason || null,
            status: 'pending',
            reviewedBy: null,
            reviewedAt: null,
            createdAt: new Date().toISOString(),
        };
        this.tagRequests.push(record);
        return record;
    }

    async reviewTagRequest(
        id: number,
        status: 'approved' | 'rejected',
        reviewerId: string,
    ): Promise<TagRequestRecord | null> {
        const req = this.tagRequests.find((r) => r.id === id);
        if (!req) return null;
        req.status = status;
        req.reviewedBy = reviewerId;
        req.reviewedAt = new Date().toISOString();

        if (status === 'approved') {
            await this.createTagSetting({
                slug: req.slugProposed,
                label: req.label,
                enabled: 1,
                isSystem: 0,
            });
        }
        return req;
    }

    // Admin Users
    async getAdminUsers(
        search?: string,
    ): Promise<Array<UserRecord & { dailyChatRequests: number; dailyExplainRequests: number }>> {
        const today = new Date().toISOString().split('T')[0];
        const result: Array<UserRecord & { dailyChatRequests: number; dailyExplainRequests: number }> = [];

        for (const user of this.users.values()) {
            if (search) {
                const term = search.toLowerCase();
                const matchEmail = user.email.toLowerCase().includes(term);
                const matchName = user.displayName?.toLowerCase().includes(term);
                if (!matchEmail && !matchName) continue;
            }
            const quotaKey = `${user.id}:${today}`;
            const quota = this.userQuotas.get(quotaKey);
            result.push({
                ...user,
                dailyChatRequests: quota?.chatRequests ?? 0,
                dailyExplainRequests: quota?.explainRequests ?? 0,
            });
        }
        return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    async updateUserRoleAndStatus(
        userId: string,
        updates: { role?: 'user' | 'admin'; status?: 'active' | 'suspended' },
    ): Promise<UserRecord | null> {
        const user = this.users.get(userId);
        if (!user) return null;
        if (updates.role) user.role = updates.role;
        if (updates.status) user.status = updates.status;
        this.users.set(userId, user);
        return user;
    }

    // Audit Log
    async insertAuditLog(log: {
        actorUserId?: string | null;
        action: string;
        targetType?: string | null;
        targetId?: string | null;
        metadataJson?: string | null;
    }): Promise<AuditLogRecord> {
        const actor = log.actorUserId ? this.users.get(log.actorUserId) : null;
        const record: AuditLogRecord = {
            id: this.nextAuditLogId++,
            actorUserId: log.actorUserId ?? null,
            actorEmail: actor?.email ?? null,
            action: log.action,
            targetType: log.targetType ?? null,
            targetId: log.targetId ?? null,
            metadataJson: log.metadataJson ?? null,
            createdAt: new Date().toISOString(),
        };
        this.auditLogs.unshift(record);
        return record;
    }

    async getAuditLogs(limit: number = 50, offset: number = 0): Promise<AuditLogRecord[]> {
        return this.auditLogs.slice(offset, offset + limit);
    }

    // Admin Overview
    async getAdminOverview(today: string): Promise<AdminOverviewMetrics> {
        let totalChatRequests = 0;
        let totalExplainRequests = 0;
        let totalTokens = 0;
        let refusedChatRequests = 0;
        const activeUsers = new Set<string>();

        for (const [key, quota] of this.userQuotas.entries()) {
            if (key.endsWith(`:${today}`)) {
                totalChatRequests += quota.chatRequests;
                totalExplainRequests += quota.explainRequests;
                totalTokens += quota.tokensIn + quota.tokensOut;
                if (quota.chatRequests > 0 || quota.explainRequests > 0) {
                    activeUsers.add(quota.userId);
                }
            }
        }

        for (const event of this.events) {
            if (event.digestDate === today || (event.status && event.status.startsWith('refused'))) {
                refusedChatRequests++;
            }
        }

        const chatLimit = parseInt(this.settings.get('chat.global_daily_limit') ?? '300', 10);
        const explainLimit = parseInt(this.settings.get('explain.global_daily_limit') ?? '30', 10);

        return {
            today,
            totalChatRequests,
            totalExplainRequests,
            totalTokens,
            refusedChatRequests,
            activeUsersCount: activeUsers.size,
            chatLimit,
            explainLimit,
        };
    }
}
