import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryAppDbRepository } from '../src/repositories/app-db.js';
import { AuthService } from '../src/auth/service.js';
import { createAuthRouter } from '../src/auth/routes.js';
import { createAuthMiddleware } from '../src/auth/middleware.js';
import { ChatService } from '../src/chat/service.js';
import { ExplainService } from '../src/explain/service.js';
import { appErrorHandler } from '../src/lib/errors.js';
import { Hono } from 'hono';
import type { LLMProvider, SearchIndexItem } from '@radar/core';

describe('Phase 2 - Step C: Auth and Personal Tags', () => {
    let appDb: InMemoryAppDbRepository;
    let authService: AuthService;

    beforeEach(() => {
        appDb = new InMemoryAppDbRepository();
        authService = new AuthService({
            appDb,
            adminEmails: ['admin@ideal.ai'],
        });
    });

    it('tao tai khoan qua Google OAuth va cap session an toan (token hash)', async () => {
        const user = await authService.handleOAuthUser({
            provider: 'google',
            providerUserId: 'google_sub_12345',
            email: 'developer@example.com',
            displayName: 'Dev Viet Nam',
            avatarUrl: 'https://example.com/avatar.png',
        });

        expect(user.id).toBeDefined();
        expect(user.email).toBe('developer@example.com');
        expect(user.role).toBe('user');

        // Cap session
        const { token, expiresAt } = await authService.createSessionForUser(user.id);
        expect(token.length).toBeGreaterThan(64); // Signed stateless JWT session token
        expect(new Date(expiresAt).getTime()).toBeGreaterThan(Date.now());

        // Kiem tra validate session
        const sessionAuth = await authService.validateSession(token);
        expect(sessionAuth).not.toBeNull();
        expect(sessionAuth?.user.id).toBe(user.id);
        expect(sessionAuth?.user.email).toBe('developer@example.com');

        // Token gia mao phai tra ve null
        const invalidAuth = await authService.validateSession('fake_token_123456');
        expect(invalidAuth).toBeNull();
    });

    it('tu dong khoi phuc session va thong tin user khi worker isolate bi restart (Bug 1 - stateless recovery)', async () => {
        // 1. User dang nhap o isolate A
        const user = await authService.handleOAuthUser({
            provider: 'github',
            providerUserId: 'gh_98765',
            email: 'coldstart@example.com',
            displayName: 'Cold Start Dev',
        });
        await authService.updateUserTags(user.id, ['local-llm', 'rag']);
        const { token } = await authService.createSessionForUser(user.id);

        // 2. Gia lap Worker Isolate bi destroy sau 30 phut khong hoat dong (AppDb moi hoan toan)
        const freshAppDb = new InMemoryAppDbRepository();
        const freshAuthService = new AuthService({
            appDb: freshAppDb,
            adminEmails: ['admin@ideal.ai'],
        });

        // 3. Request tiep theo mang token cu toi isolate moi -> phai tu dong phuc hoi thanh cong khong bi logout
        const recoveredAuth = await freshAuthService.validateSession(token);
        expect(recoveredAuth).not.toBeNull();
        expect(recoveredAuth?.user.id).toBe(user.id);
        expect(recoveredAuth?.user.email).toBe('coldstart@example.com');
        expect(recoveredAuth?.tags).toEqual(['local-llm', 'rag']);
    });

    it('tu dong gan role admin neu email nam trong ADMIN_EMAILS', async () => {
        const adminUser = await authService.handleOAuthUser({
            provider: 'google',
            providerUserId: 'google_admin_999',
            email: 'admin@ideal.ai',
            displayName: 'Super Admin',
        });

        expect(adminUser.role).toBe('admin');
    });

    it('co lap du lieu tag giua cac user va gioi han toi da 10 tag', async () => {
        const userA = await authService.handleOAuthUser({
            provider: 'google',
            providerUserId: 'sub_a',
            email: 'usera@example.com',
        });

        const userB = await authService.handleOAuthUser({
            provider: 'google',
            providerUserId: 'sub_b',
            email: 'userb@example.com',
        });

        // User A cap nhat tag
        await authService.updateUserTags(userA.id, ['agent', 'devtools', 'mcp']);

        // User B cap nhat tag khac
        await authService.updateUserTags(userB.id, ['rag', 'local-llm']);

        const tagsA = await authService.getUserProfile(userA.id);
        const tagsB = await authService.getUserProfile(userB.id);

        expect(tagsA.tags).toEqual(['agent', 'devtools', 'mcp']);
        expect(tagsB.tags).toEqual(['rag', 'local-llm']);

        // Chon qua 10 tag phai bi tu choi
        const elevenTags = ['tag1', 'tag2', 'tag3', 'tag4', 'tag5', 'tag6', 'tag7', 'tag8', 'tag9', 'tag10', 'tag11'];
        await expect(authService.updateUserTags(userA.id, elevenTags)).rejects.toThrow(/toi da duoc chon la 10/);
    });

    it('xoa tai khoan se cascade xoa sach session va tag ca nhan', async () => {
        const user = await authService.handleOAuthUser({
            provider: 'google',
            providerUserId: 'sub_delete',
            email: 'delete_me@example.com',
        });

        const { token } = await authService.createSessionForUser(user.id);
        await authService.updateUserTags(user.id, ['agent', 'mcp']);

        // Xac nhan session hoat dong truoc khi xoa
        const before = await authService.validateSession(token);
        expect(before).not.toBeNull();

        // Thuc hien xoa tai khoan
        await authService.deleteUserAccount(user.id);

        // Session phai lap tuc vo hieu hoa
        const after = await authService.validateSession(token);
        expect(after).toBeNull();

        // User khong con ton tai trong DB
        const fetched = await appDb.findUserById(user.id);
        expect(fetched).toBeNull();
    });

    it('kiem soat han muc chat theo user_id (0-token khi vuot quota)', async () => {
        const user = await authService.handleOAuthUser({
            provider: 'google',
            providerUserId: 'sub_quota',
            email: 'quota_user@example.com',
        });

        const mockItem: SearchIndexItem = {
            key: 'test_key',
            title: 'AI Framework',
            category: 'repo',
            url: 'https://github.com/ai/framework',
            tags: ['agent'],
            purpose: 'Nen tang AI Agent',
            highlight: 'Nhe va nhanh',
        };

        let llmCallCount = 0;
        const mockLlm: LLMProvider = {
            providerName: 'mock',
            modelName: 'test-model',
            generateText: async () => {
                llmCallCount++;
                return {
                    content: JSON.stringify({
                        answerable: true,
                        answer: 'Cau tra loi mau',
                        citations: ['test_key'],
                    }),
                    provider: 'mock',
                    model: 'test-model',
                };
            },
        };

        const today = '2026-10-13';
        const chatService = new ChatService({
            appDb,
            llmProvider: mockLlm,
            searchIndexItems: [mockItem],
            digestDate: today,
        });

        // Gia lap user da chat 10 lan (cham tran chat.user_daily_limit = 10)
        for (let i = 0; i < 10; i++) {
            await appDb.incrementUserChatQuota(user.id, today);
        }

        // Lan thu 11 phai bi chan ngay lap tuc ma khong goi LLM
        await expect(
            chatService.processQuestion({
                question: 'Lam the nao de dung AI Framework?',
                anonHash: 'anon_hash_1',
                userId: user.id,
            }),
        ).rejects.toThrow(/hết hạn mức chat trong ngày/i);

        expect(llmCallCount).toBe(0);
    });

    it('cac endpoint HTTP /api/me bao ve xac thuc dung cach', async () => {
        const testApp = new Hono();
        testApp.use('*', createAuthMiddleware(authService));
        testApp.onError(appErrorHandler);
        testApp.route('/', createAuthRouter(authService));

        // 1. Goi /api/me khi chua dang nhap -> 401
        const unauthRes = await testApp.request('/api/me');
        expect(unauthRes.status).toBe(401);

        // 2. Tao user va session
        const user = await authService.handleOAuthUser({
            provider: 'google',
            providerUserId: 'sub_http',
            email: 'http_user@example.com',
            displayName: 'HTTP User',
        });
        const { token } = await authService.createSessionForUser(user.id);

        // 3. Goi /api/me voi Authorization header -> 200
        const authRes = await testApp.request('/api/me', {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        expect(authRes.status).toBe(200);
        const body = (await authRes.json()) as any;
        expect(body.email).toBe('http_user@example.com');

        // 4. Cap nhat tags qua PUT /api/me/tags -> 200
        const updateRes = await testApp.request('/api/me/tags', {
            method: 'PUT',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ tags: ['agent', 'mcp'] }),
        });
        expect(updateRes.status).toBe(200);
        const updateBody = (await updateRes.json()) as any;
        expect(updateBody.tags).toEqual(['agent', 'mcp']);

        // 5. Dang xuat qua POST /auth/logout -> 200
        const logoutRes = await testApp.request('/auth/logout', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        expect(logoutRes.status).toBe(200);

        // Sau khi dang xuat, session bi xoa -> 401
        const afterLogout = await testApp.request('/api/me', {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        expect(afterLogout.status).toBe(401);
    });

    it('endpoint /api/chat bat buoc phai dang nhap moi cho phep truy van (HTTP 401)', async () => {
        const { createChatRouter } = await import('../src/chat/routes.js');
        const testApp = new Hono();
        testApp.use('*', createAuthMiddleware(authService));
        testApp.onError(appErrorHandler);
        testApp.route('/', createChatRouter({ appDb }));

        // 1. Chua dang nhap -> 401 Unauthorized
        const unauthRes = await testApp.request('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ question: 'Hôm nay có gì mới?' }),
        });
        expect(unauthRes.status).toBe(401);
        const unauthBody = (await unauthRes.json()) as any;
        expect(unauthBody.error.code).toBe('UNAUTHORIZED');

        // 2. Dang nhap hop le -> 200 OK
        const user = await authService.handleOAuthUser({
            provider: 'google',
            providerUserId: 'sub_chat_user',
            email: 'chat_user@example.com',
        });
        const { token } = await authService.createSessionForUser(user.id);

        const authRes = await testApp.request('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ question: 'Demo AI Project là gì?' }),
        });
        expect(authRes.status).toBe(200);
    });
});
