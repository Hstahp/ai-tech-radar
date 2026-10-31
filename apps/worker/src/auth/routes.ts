import { Hono } from 'hono';
import type { AuthService } from './service.js';
import { getGitHubAuthorizeUrl, exchangeGitHubCode, fetchGitHubUserProfile } from './github.js';
import { getGoogleAuthorizeUrl, exchangeGoogleCode, fetchGoogleUserProfile } from './google.js';
import { requireAuth } from './middleware.js';
import { UpdateUserTagsSchema, TagRequestCreateSchema } from '@radar/core';
import { AppError } from '../lib/errors.js';

export interface AuthEnv {
    GITHUB_CLIENT_ID?: string;
    GITHUB_CLIENT_SECRET?: string;
    GOOGLE_CLIENT_ID?: string;
    GOOGLE_CLIENT_SECRET?: string;
    GOOGLE_REDIRECT_URI?: string;
    FRONTEND_URL?: string;
}

export function createAuthRouter(authService: AuthService) {
    const router = new Hono<{ Bindings: AuthEnv }>();

    // 1. Khoi tao dang nhap Google
    router.get('/auth/login/google', (c) => {
        const googleClientId = c.env?.GOOGLE_CLIENT_ID;
        if (!googleClientId) {
            throw new AppError('OAUTH_NOT_CONFIGURED', 'Google OAuth chua duoc cau hinh tren he thong.', 500);
        }
        const reqUrl = new URL(c.req.url);
        const redirectUri = c.env?.GOOGLE_REDIRECT_URI || `${reqUrl.protocol}//${reqUrl.host}/auth/callback/google`;
        const authorizeUrl = getGoogleAuthorizeUrl(googleClientId, redirectUri);
        return c.redirect(authorizeUrl);
    });

    // 2. Callback OAuth tu Google
    router.get('/auth/callback/google', async (c) => {
        const code = c.req.query('code');
        if (!code) {
            return c.json({ error: { code: 'BAD_REQUEST', message: "Thieu tham so 'code' tu Google." } }, 400);
        }
        const googleClientId = c.env?.GOOGLE_CLIENT_ID;
        const googleClientSecret = c.env?.GOOGLE_CLIENT_SECRET;
        if (!googleClientId || !googleClientSecret) {
            throw new AppError('OAUTH_NOT_CONFIGURED', 'Google OAuth chua duoc cau hinh tren he thong.', 500);
        }

        try {
            const reqUrl = new URL(c.req.url);
            const redirectUri = c.env?.GOOGLE_REDIRECT_URI || `${reqUrl.protocol}//${reqUrl.host}/auth/callback/google`;

            const accessToken = await exchangeGoogleCode({
                clientId: googleClientId,
                clientSecret: googleClientSecret,
                code,
                redirectUri,
            });

            const profile = await fetchGoogleUserProfile(accessToken);

            const user = await authService.handleOAuthUser({
                provider: 'google',
                providerUserId: profile.id,
                email: profile.email,
                displayName: profile.name,
                avatarUrl: profile.avatarUrl,
            });

            const userAgent = c.req.header('user-agent') ?? null;
            const userTags = await authService.getUserTags(user.id);
            const { token } = await authService.createSessionForUser(user.id, userAgent, undefined, {
                email: user.email,
                role: user.role,
                displayName: user.displayName,
                avatarUrl: user.avatarUrl,
                tags: userTags,
            });

            const isSecure = c.req.url.startsWith('https://');
            const sameSite = isSecure ? 'None' : 'Lax';
            const cookieVal = `radar_session=${token}; Path=/; HttpOnly; SameSite=${sameSite}; Max-Age=2592000${isSecure ? '; Secure' : ''}`;

            const acceptHeader = c.req.header('Accept') || '';
            if (acceptHeader.includes('application/json')) {
                c.header('Set-Cookie', cookieVal);
                return c.json({ token, user });
            }

            const redirectTarget = c.env?.FRONTEND_URL || 'https://ai-tech-radar-fe.phatle219.workers.dev';
            let targetUrlString = redirectTarget;
            try {
                const targetUrl = new URL(redirectTarget, c.req.url);
                targetUrl.searchParams.set('token', token);
                targetUrlString = targetUrl.toString();
            } catch {
                targetUrlString = `${redirectTarget}${redirectTarget.includes('?') ? '&' : '?'}token=${token}`;
            }

            c.header('Set-Cookie', cookieVal);
            return c.redirect(targetUrlString);
        } catch (err: any) {
            return c.json(
                { error: { code: 'OAUTH_FAILED', message: err.message || 'Dang nhap Google that bai.' } },
                400,
            );
        }
    });

    // 3. Khoi tao dang nhap GitHub (giu san khi can)
    router.get('/auth/login/github', (c) => {
        const githubClientId = c.env?.GITHUB_CLIENT_ID;
        if (!githubClientId) {
            throw new AppError('OAUTH_NOT_CONFIGURED', 'GitHub OAuth chua duoc cau hinh tren he thong.', 500);
        }
        const redirectParam = c.req.query('redirect_uri');
        const authorizeUrl = getGitHubAuthorizeUrl(githubClientId, redirectParam);
        return c.redirect(authorizeUrl);
    });

    // 2. Callback OAuth tu GitHub
    router.get('/auth/callback/github', async (c) => {
        const code = c.req.query('code');
        if (!code) {
            return c.json({ error: { code: 'BAD_REQUEST', message: "Thieu tham so 'code' tu GitHub." } }, 400);
        }
        const githubClientId = c.env?.GITHUB_CLIENT_ID;
        const githubClientSecret = c.env?.GITHUB_CLIENT_SECRET;
        if (!githubClientId || !githubClientSecret) {
            throw new AppError('OAUTH_NOT_CONFIGURED', 'GitHub OAuth chua duoc cau hinh tren he thong.', 500);
        }

        try {
            const accessToken = await exchangeGitHubCode({
                clientId: githubClientId,
                clientSecret: githubClientSecret,
                code,
            });

            const profile = await fetchGitHubUserProfile(accessToken);

            const user = await authService.handleOAuthUser({
                provider: 'github',
                providerUserId: profile.id,
                email: profile.email,
                displayName: profile.name,
                avatarUrl: profile.avatarUrl,
            });

            const userAgent = c.req.header('user-agent') ?? null;
            const userTags = await authService.getUserTags(user.id);
            const { token } = await authService.createSessionForUser(user.id, userAgent, undefined, {
                email: user.email,
                role: user.role,
                displayName: user.displayName,
                avatarUrl: user.avatarUrl,
                tags: userTags,
            });

            const isSecure = c.req.url.startsWith('https://');
            const sameSite = isSecure ? 'None' : 'Lax';
            const cookieVal = `radar_session=${token}; Path=/; HttpOnly; SameSite=${sameSite}; Max-Age=2592000${isSecure ? '; Secure' : ''}`;

            const acceptHeader = c.req.header('Accept') || '';
            if (acceptHeader.includes('application/json')) {
                c.header('Set-Cookie', cookieVal);
                return c.json({ token, user });
            }

            const redirectTarget = c.env?.FRONTEND_URL || 'https://ai-tech-radar-fe.phatle219.workers.dev';
            let targetUrlString = redirectTarget;
            try {
                const targetUrl = new URL(redirectTarget, c.req.url);
                targetUrl.searchParams.set('token', token);
                targetUrlString = targetUrl.toString();
            } catch {
                targetUrlString = `${redirectTarget}${redirectTarget.includes('?') ? '&' : '?'}token=${token}`;
            }

            c.header('Set-Cookie', cookieVal);
            return c.redirect(targetUrlString);
        } catch (err: any) {
            return c.json({ error: { code: 'OAUTH_FAILED', message: err.message || 'Dang nhap that bai.' } }, 400);
        }
    });

    // 3. Dang xuat
    router.post('/auth/logout', async (c) => {
        const token = c.get('sessionToken');
        if (token) {
            await authService.logout(token);
        }
        c.header('Set-Cookie', 'radar_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');
        return c.json({ success: true });
    });

    // 4. Lay thong tin user hien tai
    router.get('/api/me', requireAuth, async (c) => {
        const user = c.get('user')!;
        const profile = await authService.getUserProfile(user.id);
        return c.json(profile);
    });

    // 5. Xoa tai khoan nguoi dung
    router.delete('/api/me', requireAuth, async (c) => {
        const user = c.get('user')!;
        await authService.deleteUserAccount(user.id);
        c.header('Set-Cookie', 'radar_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');
        return c.json({ success: true, message: 'Tai khoan va toan bo du lieu da duoc xoa.' });
    });

    // 6. Lay danh sach tag ca nhan
    router.get('/api/me/tags', requireAuth, async (c) => {
        const user = c.get('user')!;
        const tags = await authService.getUserProfile(user.id);
        return c.json({ tags: tags.tags });
    });

    // 7. Cap nhat danh sach tag ca nhan (toi da 10 tag)
    router.put('/api/me/tags', requireAuth, async (c) => {
        const user = c.get('user')!;
        const body = await c.req.json();
        const parsed = UpdateUserTagsSchema.safeParse(body);
        if (!parsed.success) {
            return c.json(
                {
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Danh sach tag khong hop le (toi da 10 tag).',
                        issues: parsed.error.issues,
                    },
                },
                400,
            );
        }

        await authService.updateUserTags(user.id, parsed.data.tags);
        const updatedTags = await authService.getUserTags(user.id);
        const { token } = await authService.createSessionForUser(user.id, undefined, undefined, {
            email: user.email,
            role: user.role,
            displayName: user.displayName,
            avatarUrl: user.avatarUrl,
            tags: updatedTags,
        });
        return c.json({ tags: updatedTags, token });
    });

    // 8. De xuat tag moi (yeu cau dang nhap)
    router.post('/api/tag-requests', requireAuth, async (c) => {
        const user = c.get('user')!;
        const body = await c.req.json();
        const parsed = TagRequestCreateSchema.safeParse(body);
        if (!parsed.success) {
            return c.json(
                {
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Thông tin đề xuất thẻ không hợp lệ.',
                        issues: parsed.error.issues,
                    },
                },
                400,
            );
        }

        const request = await authService.requestTag(
            user.id,
            parsed.data.slugProposed,
            parsed.data.label,
            parsed.data.reason,
        );
        return c.json({ success: true, request }, 201);
    });

    return router;
}
