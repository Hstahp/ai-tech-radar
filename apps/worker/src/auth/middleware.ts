import type { MiddlewareHandler } from 'hono';
import type { AuthService } from './service.js';
import { AuthError, ForbiddenError } from '../lib/errors.js';
import type { UserRecord } from '../repositories/app-db.js';

declare module 'hono' {
    interface ContextVariableMap {
        user?: UserRecord | null;
        userTags?: string[];
        sessionToken?: string | null;
    }
}

export function createAuthMiddleware(authService: AuthService): MiddlewareHandler {
    return async (c, next) => {
        // 1. Doc token tu Authorization header hoac Cookie
        let token: string | null = null;
        const authHeader = c.req.header('Authorization');
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7).trim();
        } else {
            const cookieHeader = c.req.header('Cookie');
            if (cookieHeader) {
                const match = cookieHeader.match(/radar_session=([^;]+)/);
                if (match) {
                    token = decodeURIComponent(match[1].trim());
                }
            }
        }

        if (token) {
            const authResult = await authService.validateSession(token);
            if (authResult) {
                c.set('user', authResult.user);
                c.set('userTags', authResult.tags);
                c.set('sessionToken', token);
            } else {
                c.set('user', null);
                c.set('userTags', []);
                c.set('sessionToken', null);
            }
        } else {
            c.set('user', null);
            c.set('userTags', []);
            c.set('sessionToken', null);
        }

        await next();
    };
}

export const requireAuth: MiddlewareHandler = async (c, next) => {
    const user = c.get('user');
    if (!user) {
        throw new AuthError('Ban can dang nhap de thuc hien thao tac nay.');
    }
    await next();
};

export const requireAdmin: MiddlewareHandler = async (c, next) => {
    const user = c.get('user');
    if (!user) {
        throw new AuthError('Yêu cầu đăng nhập để truy cập trang quản trị.');
    }
    if (user.role !== 'admin') {
        throw new ForbiddenError('Chỉ quản trị viên mới có quyền truy cập khu vực này.');
    }
    await next();
};
