import { describe, it, expect, beforeEach } from 'vitest';
import { Hono } from 'hono';
import { InMemoryAppDbRepository } from '../src/repositories/app-db.js';
import { createInternalRouter } from '../src/internal/routes.js';
import { appErrorHandler } from '../src/lib/errors.js';
import { ActiveTagsResponseSchema } from '@radar/core';

describe('Phase 2 - Step E: Internal Active Tags Endpoint (/internal/active-tags)', () => {
    let appDb: InMemoryAppDbRepository;
    let app: Hono<{ Bindings: { PIPELINE_TOKEN?: string } }>;
    const VALID_PIPELINE_TOKEN = 'secret_pipeline_token_123';

    beforeEach(async () => {
        appDb = new InMemoryAppDbRepository();

        app = new Hono<{ Bindings: { PIPELINE_TOKEN?: string } }>();
        app.onError(appErrorHandler);

        // Mount internal router
        app.route('/internal', createInternalRouter({ appDb }));
    });

    it('chặn 401 UNAUTHORIZED khi thiếu header Authorization', async () => {
        const res = await app.request('/internal/active-tags', {
            method: 'GET',
        }, {
            PIPELINE_TOKEN: VALID_PIPELINE_TOKEN,
        });

        expect(res.status).toBe(401);
        const body = (await res.json()) as any;
        expect(body.error?.code).toBe('UNAUTHORIZED');
    });

    it('chặn 401 UNAUTHORIZED khi PIPELINE_TOKEN không khớp', async () => {
        const res = await app.request('/internal/active-tags', {
            method: 'GET',
            headers: {
                Authorization: 'Bearer wrong_token_xyz',
            },
        }, {
            PIPELINE_TOKEN: VALID_PIPELINE_TOKEN,
        });

        expect(res.status).toBe(401);
        const body = (await res.json()) as any;
        expect(body.error?.code).toBe('UNAUTHORIZED');
    });

    it('chặn 500 SERVER_MISCONFIGURED khi server chưa cấu hình PIPELINE_TOKEN', async () => {
        const res = await app.request('/internal/active-tags', {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${VALID_PIPELINE_TOKEN}`,
            },
        }, {
            // Không truyền PIPELINE_TOKEN
        });

        expect(res.status).toBe(500);
        const body = (await res.json()) as any;
        expect(body.error?.code).toBe('SERVER_MISCONFIGURED');
    });

    it('trả về 200 OK với danh sách active tags và cấu trúc hợp lệ theo ActiveTagsResponseSchema', async () => {
        const res = await app.request('/internal/active-tags', {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${VALID_PIPELINE_TOKEN}`,
            },
        }, {
            PIPELINE_TOKEN: VALID_PIPELINE_TOKEN,
        });

        expect(res.status).toBe(200);
        const body = await res.json();
        const parsed = ActiveTagsResponseSchema.safeParse(body);
        expect(parsed.success).toBe(true);

        if (parsed.success) {
            expect(parsed.data.tags.length).toBeGreaterThan(0);
            expect(parsed.data.tags.some((t) => t.slug === 'github')).toBe(true);
            expect(typeof parsed.data.generatedAt).toBe('string');
        }
    });

    it('sắp xếp ưu tiên các tag có follower cao hơn, sau đó là tag hệ thống', async () => {
        // Tạo 1 user theo dõi tag 'mcp'
        const user = await appDb.createUser({
            id: 'u1',
            email: 'user1@example.com',
        });
        await appDb.setUserTags(user.id, ['mcp']);

        const res = await app.request('/internal/active-tags', {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${VALID_PIPELINE_TOKEN}`,
            },
        }, {
            PIPELINE_TOKEN: VALID_PIPELINE_TOKEN,
        });

        expect(res.status).toBe(200);
        const data = (await res.json()) as any;
        expect(data.tags[0].slug).toBe('mcp'); // Tag có follower cao nhất được xếp đầu
    });

    it('giới hạn số lượng tag theo tags.max_active và maxItems theo cấu hình', async () => {
        // Cấu hình tags.max_active = 3
        await appDb.updateSetting('tags.max_active', '3');
        await appDb.updateTagSetting('mcp', { maxItems: 15 });

        const res = await app.request('/internal/active-tags', {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${VALID_PIPELINE_TOKEN}`,
            },
        }, {
            PIPELINE_TOKEN: VALID_PIPELINE_TOKEN,
        });

        expect(res.status).toBe(200);
        const data = (await res.json()) as any;
        expect(data.tags.length).toBeLessThanOrEqual(3);

        const mcpTag = data.tags.find((t: any) => t.slug === 'mcp');
        if (mcpTag) {
            expect(mcpTag.maxItems).toBe(15);
        }
    });
});
