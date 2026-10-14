import type { AppDbRepository, UserRecord } from '../repositories/app-db.js';
import { generateSessionToken, hashSessionToken } from './token.js';
import { AppError, AuthError } from '../lib/errors.js';
import type { UserProfile } from '@radar/core';

export interface AuthServiceOptions {
    appDb: AppDbRepository;
    adminEmails?: string[];
}

export class AuthService {
    private adminEmails: Set<string>;

    constructor(private readonly options: AuthServiceOptions) {
        this.adminEmails = new Set((options.adminEmails ?? []).map((e) => e.toLowerCase()));
    }

    setAdminEmails(emails: string[]): void {
        this.adminEmails = new Set(emails.map((e) => e.trim().toLowerCase()));
    }

    async createSessionForUser(
        userId: string,
        userAgent?: string | null,
        maxAgeSeconds: number = 30 * 86400,
    ): Promise<{ token: string; expiresAt: string }> {
        const token = generateSessionToken();
        const tokenHash = await hashSessionToken(token);
        const expiresAt = new Date(Date.now() + maxAgeSeconds * 1000).toISOString();

        await this.options.appDb.createSession(tokenHash, userId, expiresAt, userAgent);
        await this.options.appDb.updateUserLastLogin(userId);

        return { token, expiresAt };
    }

    async validateSession(rawToken: string): Promise<{ user: UserRecord; tags: string[] } | null> {
        if (!rawToken) return null;
        const tokenHash = await hashSessionToken(rawToken);
        const session = await this.options.appDb.getSession(tokenHash);
        if (!session) return null;

        const user = await this.options.appDb.findUserById(session.userId);
        if (!user || user.status !== 'active') {
            return null;
        }

        const tags = await this.options.appDb.getUserTags(user.id);
        return { user, tags };
    }

    async handleOAuthUser(params: {
        provider: 'github' | 'google';
        providerUserId: string;
        email: string;
        displayName?: string | null;
        avatarUrl?: string | null;
    }): Promise<UserRecord> {
        const cleanEmail = params.email.trim().toLowerCase();
        let user = await this.options.appDb.findUserByOAuth(params.provider, params.providerUserId);

        if (!user) {
            user = await this.options.appDb.findUserByEmail(cleanEmail);
            if (user) {
                await this.options.appDb.linkOAuthAccount(params.provider, params.providerUserId, user.id);
                if (this.adminEmails.has(cleanEmail) && user.role !== 'admin') {
                    await this.options.appDb.updateUserRoleAndStatus(user.id, { role: 'admin' });
                    user = { ...user, role: 'admin' };
                }
            } else {
                const role = this.adminEmails.has(cleanEmail) ? 'admin' : 'user';
                user = await this.options.appDb.createUser({
                    id: crypto.randomUUID(),
                    email: cleanEmail,
                    displayName: params.displayName,
                    avatarUrl: params.avatarUrl,
                    role,
                });
                await this.options.appDb.linkOAuthAccount(params.provider, params.providerUserId, user.id);
            }
        } else if (this.adminEmails.has(cleanEmail) && user.role !== 'admin') {
            await this.options.appDb.updateUserRoleAndStatus(user.id, { role: 'admin' });
            user = { ...user, role: 'admin' };
        }

        await this.options.appDb.updateUserLastLogin(user.id);
        return user;
    }

    async getUserProfile(userId: string): Promise<UserProfile> {
        const user = await this.options.appDb.findUserById(userId);
        if (!user) {
            throw new AuthError('Nguoi dung khong ton tai.');
        }
        const tags = await this.options.appDb.getUserTags(userId);
        return {
            id: user.id,
            email: user.email,
            displayName: user.displayName,
            avatarUrl: user.avatarUrl,
            role: user.role,
            tags,
            createdAt: user.createdAt,
            lastLoginAt: user.lastLoginAt,
        };
    }

    async updateUserTags(userId: string, tags: string[]): Promise<string[]> {
        const maxPerUserStr = await this.options.appDb.getSetting('tags.max_per_user', '10');
        const maxPerUser = parseInt(maxPerUserStr, 10);

        const uniqueTags = Array.from(new Set(tags.map((t) => t.trim().toLowerCase())));
        if (uniqueTags.length > maxPerUser) {
            throw new AppError('TAG_LIMIT_EXCEEDED', `So luong tag toi da duoc chon la ${maxPerUser}.`);
        }

        await this.options.appDb.setUserTags(userId, uniqueTags);
        return uniqueTags;
    }

    async deleteUserAccount(userId: string): Promise<void> {
        await this.options.appDb.deleteUser(userId);
    }

    async logout(rawToken: string): Promise<void> {
        const tokenHash = await hashSessionToken(rawToken);
        await this.options.appDb.deleteSession(tokenHash);
    }

    async requestTag(userId: string, slugProposed: string, label: string, reason?: string) {
        return this.options.appDb.createTagRequest(userId, slugProposed, label, reason);
    }
}
