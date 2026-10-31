import { describe, it, expect, beforeEach } from 'vitest';
import { Hono } from 'hono';
import { InMemoryAppDbRepository } from '../src/repositories/app-db.js';
import { AuthService } from '../src/auth/service.js';
import { createAuthMiddleware } from '../src/auth/middleware.js';
import { createBookmarkRouter } from '../src/bookmarks/routes.js';
import { appErrorHandler } from '../src/lib/errors.js';

describe('Bookmarks API (/api/me/bookmarks)', () => {
    let appDb: InMemoryAppDbRepository;
    let authService: AuthService;
    let app: Hono;
    let userTokenA: string;
    let userIdA: string;
    let userTokenB: string;
    let userIdB: string;

    beforeEach(async () => {
        appDb = new InMemoryAppDbRepository();
        authService = new AuthService({ appDb });

        app = new Hono();
        app.use('*', createAuthMiddleware(authService));
        app.onError(appErrorHandler);
        app.route('/api/me/bookmarks', createBookmarkRouter({ appDb }));

        // Tạo User A
        const userA = await authService.handleOAuthUser({
            provider: 'google',
            providerUserId: 'google_user_a',
            email: 'userA@example.com',
            displayName: 'User A',
        });
        userIdA = userA.id;
        const sessionA = await authService.createSessionForUser(userA.id);
        userTokenA = sessionA.token;

        // Tạo User B
        const userB = await authService.handleOAuthUser({
            provider: 'google',
            providerUserId: 'google_user_b',
            email: 'userB@example.com',
            displayName: 'User B',
        });
        userIdB = userB.id;
        const sessionB = await authService.createSessionForUser(userB.id);
        userTokenB = sessionB.token;
    });

    it('chặn 401 UNAUTHORIZED khi chưa đăng nhập gọi API bookmarks', async () => {
        const res = await app.request('/api/me/bookmarks', {
            method: 'GET',
        });
        expect(res.status).toBe(401);
    });

    it('cho phép lưu bookmark khi đã đăng nhập và trả về dữ liệu chuẩn', async () => {
        const payload = {
            itemKey: 'paper_2610_12345',
            title: 'DeepSeek-V3 Technical Report',
            url: 'https://arxiv.org/abs/2610.12345',
            category: 'paper',
            author: 'DeepSeek-AI',
            tags: 'paper,llm',
            summary: 'Tóm tắt bài báo...',
        };

        const res = await app.request('/api/me/bookmarks', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${userTokenA}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        expect(res.status).toBe(201);
        const body = (await res.json()) as any;
        expect(body.bookmark?.itemKey).toBe('paper_2610_12345');
        expect(body.bookmark?.title).toBe('DeepSeek-V3 Technical Report');
    });

    it('cô lập dữ liệu: User A không thấy bookmark của User B', async () => {
        // User A bookmark bài 1
        await app.request('/api/me/bookmarks', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${userTokenA}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                itemKey: 'item_a',
                title: 'Item of A',
                url: 'https://example.com/a',
                category: 'repo',
            }),
        });

        // User B bookmark bài 2
        await app.request('/api/me/bookmarks', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${userTokenB}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                itemKey: 'item_b',
                title: 'Item of B',
                url: 'https://example.com/b',
                category: 'paper',
            }),
        });

        // User A lấy danh sách
        const resA = await app.request('/api/me/bookmarks', {
            method: 'GET',
            headers: { Authorization: `Bearer ${userTokenA}` },
        });
        const dataA = (await resA.json()) as any;
        expect(dataA.bookmarks.length).toBe(1);
        expect(dataA.bookmarks[0].itemKey).toBe('item_a');

        // User B lấy danh sách
        const resB = await app.request('/api/me/bookmarks', {
            method: 'GET',
            headers: { Authorization: `Bearer ${userTokenB}` },
        });
        const dataB = (await resB.json()) as any;
        expect(dataB.bookmarks.length).toBe(1);
        expect(dataB.bookmarks[0].itemKey).toBe('item_b');
    });

    it('cho phép xóa bookmark thành công', async () => {
        // User A lưu bài
        await app.request('/api/me/bookmarks', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${userTokenA}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                itemKey: 'item_to_delete',
                title: 'Item To Delete',
                url: 'https://example.com/delete',
                category: 'news',
            }),
        });

        // Xóa
        const delRes = await app.request('/api/me/bookmarks/item_to_delete', {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${userTokenA}` },
        });
        expect(delRes.status).toBe(200);

        // Kiểm tra danh sách rỗng
        const listRes = await app.request('/api/me/bookmarks', {
            method: 'GET',
            headers: { Authorization: `Bearer ${userTokenA}` },
        });
        const listData = (await listRes.json()) as any;
        expect(listData.bookmarks.length).toBe(0);
    });
});

