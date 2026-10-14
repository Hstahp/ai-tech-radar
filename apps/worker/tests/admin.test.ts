import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryAppDbRepository } from '../src/repositories/app-db.js';
import { AuthService } from '../src/auth/service.js';
import { createAuthMiddleware } from '../src/auth/middleware.js';
import { createAuthRouter } from '../src/auth/routes.js';
import { createAdminRouter } from '../src/admin/routes.js';
import { appErrorHandler } from '../src/lib/errors.js';
import { Hono } from 'hono';

describe('Phase 2 - Step D: Admin Dashboard & Audit Log', () => {
    let appDb: InMemoryAppDbRepository;
    let authService: AuthService;
    let app: Hono;
    let adminToken: string;
    let userToken: string;
    let adminUserId: string;
    let regularUserId: string;

    beforeEach(async () => {
        appDb = new InMemoryAppDbRepository();
        authService = new AuthService({
            appDb,
            adminEmails: ['admin@ideal.ai'],
        });

        app = new Hono();
        app.use('*', createAuthMiddleware(authService));
        app.onError(appErrorHandler);
        app.route('/', createAuthRouter(authService));
        app.route('/api/admin', createAdminRouter({ appDb }));

        // Tạo 1 tài khoản admin
        const adminUser = await authService.handleOAuthUser({
            provider: 'google',
            providerUserId: 'google_admin_1',
            email: 'admin@ideal.ai',
            displayName: 'Admin User',
        });
        adminUserId = adminUser.id;
        const adminSession = await authService.createSessionForUser(adminUser.id);
        adminToken = adminSession.token;

        // Tạo 1 tài khoản thường (role: user)
        const regularUser = await authService.handleOAuthUser({
            provider: 'google',
            providerUserId: 'google_user_1',
            email: 'user@example.com',
            displayName: 'Regular User',
        });
        regularUserId = regularUser.id;
        const userSession = await authService.createSessionForUser(regularUser.id);
        userToken = userSession.token;
    });

    it('chặn 401 UNAUTHORIZED khi người dùng chưa đăng nhập gọi API admin', async () => {
        const res = await app.request('/api/admin/overview', {
            method: 'GET',
        });

        expect(res.status).toBe(401);
        const data = await res.json<{ error: { code: string; message: string } }>();
        expect(data.error.code).toBe('UNAUTHORIZED');
    });

    it('chặn 403 FORBIDDEN khi tài khoản user thường cố truy cập API admin', async () => {
        const res = await app.request('/api/admin/overview', {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${userToken}`,
            },
        });

        expect(res.status).toBe(403);
        const data = await res.json<{ error: { code: string; message: string } }>();
        expect(data.error.code).toBe('FORBIDDEN');
    });

    it('cho phép admin truy cập /overview và trả về đúng số liệu KPI', async () => {
        // Tăng giả lập hạn mức dùng
        await appDb.incrementUserChatQuota(regularUserId, new Date().toISOString().split('T')[0], 120, 80);

        const res = await app.request('/api/admin/overview', {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${adminToken}`,
            },
        });

        expect(res.status).toBe(200);
        const data = await res.json<{ overview: { totalChatRequests: number; totalTokens: number } }>();
        expect(data.overview.totalChatRequests).toBe(1);
        expect(data.overview.totalTokens).toBe(200);
    });

    it('admin cập nhật cấu hình hệ thống và ghi vết audit_log', async () => {
        const res = await app.request('/api/admin/settings', {
            method: 'PATCH',
            headers: {
                Authorization: `Bearer ${adminToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                settings: {
                    'chat.user_daily_limit': '25',
                    'explain.user_daily_limit': '10',
                },
            }),
        });

        expect(res.status).toBe(200);
        const data = await res.json<{ success: boolean; settings: Record<string, string> }>();
        expect(data.success).toBe(true);
        expect(data.settings['chat.user_daily_limit']).toBe('25');
        expect(data.settings['explain.user_daily_limit']).toBe('10');

        // Kiểm tra audit log
        const auditLogs = await appDb.getAuditLogs();
        expect(auditLogs.length).toBeGreaterThan(0);
        expect(auditLogs[0].action).toBe('settings.update');
        expect(auditLogs[0].actorUserId).toBe(adminUserId);
    });

    it('user gửi đề xuất tag mới và admin phê duyệt thành công vào hệ thống', async () => {
        // 1. User gửi đề xuất
        const requestRes = await app.request('/api/tag-requests', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${userToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                slugProposed: 'deepseek-r1',
                label: 'DeepSeek R1 Reasoning',
                reason: 'Cần theo dõi mô hình suy luận mã nguồn mở mới',
            }),
        });

        expect(requestRes.status).toBe(201);
        const requestData = await requestRes.json<{ success: boolean; request: { id: number; status: string } }>();
        expect(requestData.success).toBe(true);
        expect(requestData.request.status).toBe('pending');
        const requestId = requestData.request.id;

        // 2. Admin xem danh sách đề xuất
        const listRes = await app.request('/api/admin/tag-requests?status=pending', {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${adminToken}`,
            },
        });
        expect(listRes.status).toBe(200);
        const listData = await listRes.json<{ requests: Array<{ id: number; slugProposed: string }> }>();
        expect(listData.requests.some((r) => r.id === requestId)).toBe(true);

        // 3. Admin phê duyệt đề xuất
        const reviewRes = await app.request(`/api/admin/tag-requests/${requestId}/review`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${adminToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                status: 'approved',
            }),
        });

        expect(reviewRes.status).toBe(200);
        const reviewData = await reviewRes.json<{ success: boolean; request: { status: string } }>();
        expect(reviewData.request.status).toBe('approved');

        // Kiểm tra tag mới đã xuất hiện trong tag_settings
        const tagsRes = await app.request('/api/admin/tags', {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${adminToken}`,
            },
        });
        const tagsData = await tagsRes.json<{ tags: Array<{ slug: string }> }>();
        expect(tagsData.tags.some((t) => t.slug === 'deepseek-r1')).toBe(true);

        // Kiểm tra audit log
        const auditLogs = await appDb.getAuditLogs();
        expect(auditLogs[0].action).toBe('tag_request.approved');
    });

    it('admin thay đổi vai trò hoặc khóa/mở khóa tài khoản người dùng', async () => {
        const updateRes = await app.request(`/api/admin/users/${regularUserId}`, {
            method: 'PATCH',
            headers: {
                Authorization: `Bearer ${adminToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                role: 'admin',
                status: 'active',
            }),
        });

        expect(updateRes.status).toBe(200);
        const updateData = await updateRes.json<{ success: boolean; user: { role: string } }>();
        expect(updateData.user.role).toBe('admin');

        // Kiểm tra audit log
        const auditLogs = await appDb.getAuditLogs();
        expect(auditLogs[0].action).toBe('user.update');
        expect(auditLogs[0].targetId).toBe(regularUserId);
    });

    it('admin tạo tag mới và kiểm tra danh sách nhật ký kiểm toán phân trang', async () => {
        const createRes = await app.request('/api/admin/tags', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${adminToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                slug: 'quantum-computing',
                label: 'Quantum AI',
                enabled: 1,
                isSystem: 1,
                maxItems: 15,
            }),
        });

        expect(createRes.status).toBe(200);

        const auditRes = await app.request('/api/admin/audit?limit=10&offset=0', {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${adminToken}`,
            },
        });

        expect(auditRes.status).toBe(200);
        const auditData = await auditRes.json<{ logs: Array<{ action: string; targetId: string }> }>();
        expect(auditData.logs.some((l) => l.action === 'tag.create' && l.targetId === 'quantum-computing')).toBe(true);
    });
});
