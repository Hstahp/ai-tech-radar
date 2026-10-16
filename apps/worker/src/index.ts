import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { InMemoryAppDbRepository } from './repositories/app-db.js';
import { AuthService } from './auth/service.js';
import { createAuthMiddleware } from './auth/middleware.js';
import { createAuthRouter } from './auth/routes.js';
import { createChatRouter } from './chat/routes.js';
import { createExplainRouter } from './explain/routes.js';
import { createAdminRouter } from './admin/routes.js';
import { appErrorHandler } from './lib/errors.js';
import type { SearchIndexItem } from '@radar/core';

export interface Env {
    GEMINI_API_KEY?: string;
    GROQ_API_KEY?: string;
    ALLOWED_ORIGIN?: string;
    SEARCH_INDEX_URL?: string;
    GITHUB_CLIENT_ID?: string;
    GITHUB_CLIENT_SECRET?: string;
    GOOGLE_CLIENT_ID?: string;
    GOOGLE_CLIENT_SECRET?: string;
    GOOGLE_REDIRECT_URI?: string;
    FRONTEND_URL?: string;
    ADMIN_EMAILS?: string;
    GH_TRIGGER_TOKEN?: string;
}

const app = new Hono<{ Bindings: Env }>();

// 1. Khoi tao kho luu tru va dich vu dung chung
const appDb = new InMemoryAppDbRepository();
const authService = new AuthService({ appDb });

// 2. Dang ky Middleware toan cuc
app.use(
    '*',
    cors({
        origin: (origin) => {
            if (!origin) return 'https://ai-tech-radar-fe.phatle219.workers.dev';
            if (
                origin.includes('localhost') ||
                origin.includes('127.0.0.1') ||
                origin.endsWith('.workers.dev') ||
                origin.endsWith('.pages.dev')
            ) {
                return origin;
            }
            return 'https://ai-tech-radar-fe.phatle219.workers.dev';
        },
        credentials: true,
        allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowHeaders: ['Content-Type', 'Authorization'],
    }),
);
app.use('*', async (c, next) => {
    if (c.env?.ADMIN_EMAILS) {
        const emails = c.env.ADMIN_EMAILS.split(',').map((e) => e.trim()).filter(Boolean);
        authService.setAdminEmails(emails);
    }
    await next();
});
app.use('*', createAuthMiddleware(authService));
app.onError(appErrorHandler);

// 3. Health check endpoint
app.get('/health', (c) => {
    return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const RAW_SEARCH_INDEX_URL =
    'https://raw.githubusercontent.com/Hstahp/ai-tech-radar/data/search-index.json';

let cachedIndexItems: SearchIndexItem[] | null = null;
let lastIndexFetchTime = 0;
const INDEX_CACHE_TTL_MS = 5 * 60 * 1000; // 5 phút cache trong memory

export async function getSearchIndexItems(env?: unknown): Promise<SearchIndexItem[]> {
    const now = Date.now();
    if (cachedIndexItems && now - lastIndexFetchTime < INDEX_CACHE_TTL_MS) {
        return cachedIndexItems;
    }

    const typedEnv = env as Env | undefined;
    const url = typedEnv?.SEARCH_INDEX_URL || RAW_SEARCH_INDEX_URL;
    try {
        const res = await fetch(url);
        if (res.ok) {
            const data = (await res.json()) as { items?: SearchIndexItem[] };
            if (Array.isArray(data.items) && data.items.length > 0) {
                cachedIndexItems = data.items;
                lastIndexFetchTime = now;
                return cachedIndexItems;
            }
        }
    } catch (err: unknown) {
        console.warn('[SEARCH_INDEX] Khong the tai search index tu:', url, err);
    }

    return cachedIndexItems ?? [];
}

// 4. Gan cac Router theo tung tinh nang
app.route('/', createAuthRouter(authService));
app.route('/', createChatRouter({ appDb, getSearchIndex: getSearchIndexItems }));
app.route('/', createExplainRouter({ appDb, getSearchIndex: getSearchIndexItems }));
app.route('/api/admin', createAdminRouter({ appDb }));

export { app };

export default {
    fetch: app.fetch,

    async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
        if (!env.GH_TRIGGER_TOKEN) {
            console.error('[CRON] GH_TRIGGER_TOKEN chua duoc cau hinh tren Cloudflare Worker.');
            return;
        }

        console.log(
            `[CRON] Dang kich hoat daily-pipeline.yml tren GitHub Actions (thoi gian: ${new Date(event.scheduledTime).toISOString()})...`,
        );

        try {
            const response = await fetch(
                'https://api.github.com/repos/Hstahp/ai-tech-radar/actions/workflows/daily-pipeline.yml/dispatches',
                {
                    method: 'POST',
                    headers: {
                        Accept: 'application/vnd.github+json',
                        Authorization: `Bearer ${env.GH_TRIGGER_TOKEN}`,
                        'User-Agent': 'ai-tech-radar-worker-cron',
                        'X-GitHub-Api-Version': '2022-11-28',
                    },
                    body: JSON.stringify({ ref: 'main' }),
                },
            );

            if (response.ok) {
                console.log('[CRON] Kich hoat daily-pipeline.yml thanh cong (HTTP 204).');
            } else {
                const errorBody = await response.text();
                console.error(
                    `[CRON] Kich hoat daily-pipeline.yml that bai! Status: ${response.status} ${response.statusText}. Chi tiet: ${errorBody}`,
                );
            }
        } catch (error: unknown) {
            console.error('[CRON] Loi bat ngo khi goi GitHub API dispatch:', error);
        }
    },
};
