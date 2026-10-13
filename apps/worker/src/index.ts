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
}

const app = new Hono<{ Bindings: Env }>();

// 1. Khoi tao kho luu tru va dich vu dung chung
const appDb = new InMemoryAppDbRepository();
const authService = new AuthService({ appDb });

// 2. Dang ky Middleware toan cuc
app.use('*', cors());
app.use('*', createAuthMiddleware(authService));
app.onError(appErrorHandler);

// 3. Health check endpoint
app.get('/health', (c) => {
    return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 4. Gan cac Router theo tung tinh nang
app.route('/', createAuthRouter(authService));
app.route('/', createChatRouter({ appDb }));
app.route('/', createExplainRouter({ appDb }));
app.route('/api/admin', createAdminRouter({ appDb }));

export default app;
