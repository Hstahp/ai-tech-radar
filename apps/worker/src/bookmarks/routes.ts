import { Hono } from 'hono';
import type { AppDbRepository } from '../repositories/app-db.js';
import { requireAuth } from '../auth/middleware.js';
import { CreateBookmarkSchema } from '@radar/core';
import { AppError } from '../lib/errors.js';

export interface BookmarkRouterOptions {
    appDb: AppDbRepository;
}

export function createBookmarkRouter(options: BookmarkRouterOptions) {
    const router = new Hono();

    // Tất cả các route bookmark đều bắt buộc đăng nhập
    router.use('*', requireAuth);

    // 1. Lấy danh sách bookmark của người dùng hiện tại
    router.get('/', async (c) => {
        const user = c.get('user');
        if (!user) {
            throw new AppError('UNAUTHORIZED', 'Ban can dang nhap de thuc hien thao tac nay.', 401);
        }

        const bookmarks = await options.appDb.getUserBookmarks(user.id);
        return c.json({ bookmarks });
    });

    // 2. Thêm một bài viết / bài báo vào danh sách lưu
    router.post('/', async (c) => {
        const user = c.get('user');
        if (!user) {
            throw new AppError('UNAUTHORIZED', 'Ban can dang nhap de thuc hien thao tac nay.', 401);
        }

        const body = await c.req.json().catch(() => null);
        const parseResult = CreateBookmarkSchema.safeParse(body);
        if (!parseResult.success) {
            throw new AppError(
                'BAD_REQUEST',
                'Dữ liệu bookmark không hợp lệ.',
                400,
            );
        }

        const bookmark = await options.appDb.addBookmark(user.id, parseResult.data);
        return c.json({ bookmark }, 201);
    });

    // 3. Xóa bài viết khỏi danh sách lưu
    router.delete('/:itemKey', async (c) => {
        const user = c.get('user');
        if (!user) {
            throw new AppError('UNAUTHORIZED', 'Ban can dang nhap de thuc hien thao tac nay.', 401);
        }

        const itemKey = c.req.param('itemKey');
        if (!itemKey) {
            throw new AppError('BAD_REQUEST', 'Thiếu itemKey cần xóa.', 400);
        }

        await options.appDb.removeBookmark(user.id, itemKey);
        return c.json({ success: true, itemKey });
    });

    return router;
}
