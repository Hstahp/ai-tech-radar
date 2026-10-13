import { Hono } from 'hono';
import { requireAdmin } from '../auth/middleware.js';
import { recordAuditLog } from './service.js';
import type { AppDbRepository } from '../repositories/app-db.js';
import {
    AdminSettingUpdateSchema,
    AdminTagUpdateSchema,
    AdminTagCreateSchema,
    TagRequestReviewSchema,
    AdminUserUpdateSchema,
} from '@radar/core';
import { AppError } from '../lib/errors.js';

export interface AdminRoutesOptions {
    appDb: AppDbRepository;
}

export function createAdminRouter(options: AdminRoutesOptions) {
    const router = new Hono();
    const { appDb } = options;

    // Bảo vệ toàn bộ endpoint bằng middleware requireAdmin
    router.use('*', requireAdmin);

    // 1. Thống kê tổng quan KPI
    router.get('/overview', async (c) => {
        const today = new Date().toISOString().split('T')[0];
        const overview = await appDb.getAdminOverview(today);
        return c.json({ overview });
    });

    // 2. Lấy danh sách cấu hình hệ thống
    router.get('/settings', async (c) => {
        const settings = await appDb.getAllSettings();
        return c.json({ settings });
    });

    // 3. Cập nhật cấu hình hệ thống
    router.patch('/settings', async (c) => {
        const user = c.get('user')!;
        const rawBody = await c.req.json();
        const parsed = AdminSettingUpdateSchema.safeParse(rawBody);

        if (!parsed.success) {
            throw new AppError('VALIDATION_ERROR', 'Dữ liệu cấu hình không hợp lệ.', 400);
        }

        for (const [key, value] of Object.entries(parsed.data.settings)) {
            await appDb.updateSetting(key, String(value), user.id);
        }

        await recordAuditLog(appDb, {
            actorUserId: user.id,
            action: 'settings.update',
            targetType: 'settings',
            metadata: parsed.data.settings,
        });

        const updatedSettings = await appDb.getAllSettings();
        return c.json({ success: true, settings: updatedSettings });
    });

    // 4. Danh sách tag quản trị
    router.get('/tags', async (c) => {
        const tags = await appDb.getTagSettings();
        return c.json({ tags });
    });

    // 5. Cập nhật tag hệ thống
    router.patch('/tags/:slug', async (c) => {
        const user = c.get('user')!;
        const slug = c.req.param('slug');
        const rawBody = await c.req.json();
        const parsed = AdminTagUpdateSchema.safeParse(rawBody);

        if (!parsed.success) {
            throw new AppError('VALIDATION_ERROR', 'Thông số cập nhật tag không hợp lệ.', 400);
        }

        await appDb.updateTagSetting(slug, parsed.data);
        await recordAuditLog(appDb, {
            actorUserId: user.id,
            action: 'tag.update',
            targetType: 'tag',
            targetId: slug,
            metadata: parsed.data,
        });

        return c.json({ success: true });
    });

    // 6. Tạo tag mới trực tiếp từ Admin
    router.post('/tags', async (c) => {
        const user = c.get('user')!;
        const rawBody = await c.req.json();
        const parsed = AdminTagCreateSchema.safeParse(rawBody);

        if (!parsed.success) {
            throw new AppError('VALIDATION_ERROR', 'Thông tin tag mới không hợp lệ.', 400);
        }

        await appDb.createTagSetting(parsed.data);
        await recordAuditLog(appDb, {
            actorUserId: user.id,
            action: 'tag.create',
            targetType: 'tag',
            targetId: parsed.data.slug,
            metadata: parsed.data,
        });

        return c.json({ success: true });
    });

    // 7. Danh sách đề xuất tag từ người dùng
    router.get('/tag-requests', async (c) => {
        const status = c.req.query('status') as 'pending' | 'approved' | 'rejected' | undefined;
        const requests = await appDb.getTagRequests(status);
        return c.json({ requests });
    });

    // 8. Duyệt hoặc từ chối đề xuất tag
    router.post('/tag-requests/:id/review', async (c) => {
        const user = c.get('user')!;
        const id = parseInt(c.req.param('id'), 10);

        if (isNaN(id)) {
            throw new AppError('VALIDATION_ERROR', 'ID yêu cầu không hợp lệ.', 400);
        }

        const rawBody = await c.req.json();
        const parsed = TagRequestReviewSchema.safeParse(rawBody);

        if (!parsed.success) {
            throw new AppError('VALIDATION_ERROR', 'Trạng thái xét duyệt không hợp lệ.', 400);
        }

        const reviewed = await appDb.reviewTagRequest(id, parsed.data.status, user.id);
        if (!reviewed) {
            throw new AppError('NOT_FOUND', 'Không tìm thấy yêu cầu đề xuất thẻ này.', 404);
        }

        await recordAuditLog(appDb, {
            actorUserId: user.id,
            action: `tag_request.${parsed.data.status}`,
            targetType: 'tag_request',
            targetId: String(id),
            metadata: {
                status: parsed.data.status,
                slugProposed: reviewed.slugProposed,
                label: reviewed.label,
            },
        });

        return c.json({ success: true, request: reviewed });
    });

    // 9. Danh sách người dùng
    router.get('/users', async (c) => {
        const search = c.req.query('search') || undefined;
        const users = await appDb.getAdminUsers(search);
        return c.json({ users });
    });

    // 10. Đổi vai trò hoặc trạng thái người dùng
    router.patch('/users/:id', async (c) => {
        const actor = c.get('user')!;
        const id = c.req.param('id');
        const rawBody = await c.req.json();
        const parsed = AdminUserUpdateSchema.safeParse(rawBody);

        if (!parsed.success) {
            throw new AppError('VALIDATION_ERROR', 'Thông tin cập nhật người dùng không hợp lệ.', 400);
        }

        const updated = await appDb.updateUserRoleAndStatus(id, parsed.data);
        if (!updated) {
            throw new AppError('NOT_FOUND', 'Không tìm thấy người dùng.', 404);
        }

        await recordAuditLog(appDb, {
            actorUserId: actor.id,
            action: 'user.update',
            targetType: 'user',
            targetId: id,
            metadata: parsed.data,
        });

        return c.json({ success: true, user: updated });
    });

    // 11. Nhật ký kiểm toán
    router.get('/audit', async (c) => {
        const limit = parseInt(c.req.query('limit') || '50', 10);
        const offset = parseInt(c.req.query('offset') || '0', 10);
        const logs = await appDb.getAuditLogs(limit, offset);
        return c.json({ logs });
    });

    return router;
}
