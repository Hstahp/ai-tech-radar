import { Hono } from 'hono';
import { describe, expect, it } from 'vitest';
import type { SearchIndexItem } from '@radar/core';
import { createSearchRouter } from '../src/search/routes.js';

const mockItems: SearchIndexItem[] = [
    {
        key: 'agent-forge',
        title: 'AgentForge',
        category: 'repo',
        url: 'https://github.com/test/agent-forge',
        tags: ['agent', 'devtools'],
        purpose: 'Framework xây dựng multi-agent bằng TypeScript',
        stars: 1200,
    },
    {
        key: 'cooking-blog',
        title: 'Cooking Blog',
        category: 'news',
        url: 'https://example.com/cooking',
        tags: ['food'],
        purpose: 'recipe',
    },
];

function createApp() {
    const app = new Hono();
    app.route('/', createSearchRouter({ getSearchIndex: async () => mockItems }));
    return app;
}

describe('GET /api/search', () => {
    it('trả về 200 và mục khớp đầu tiên cho truy vấn hợp lệ', async () => {
        const res = await createApp().request('/api/search?q=agent');

        expect(res.status).toBe(200);
        const body = (await res.json()) as { count: number; items: Array<{ key: string }> };
        expect(body.count).toBeGreaterThanOrEqual(1);
        expect(body.items[0]?.key).toBe('agent-forge');
    });

    it('trả về 400 INVALID_QUERY khi truy vấn quá ngắn', async () => {
        const res = await createApp().request('/api/search?q=a');

        expect(res.status).toBe(400);
        const body = (await res.json()) as { error: { code: string } };
        expect(body.error.code).toBe('INVALID_QUERY');
    });

    it('giới hạn limit tối đa 20 và không vượt quá số mục có sẵn', async () => {
        const res = await createApp().request('/api/search?q=agent&limit=999');

        expect(res.status).toBe(200);
        const body = (await res.json()) as { items: unknown[] };
        expect(body.items.length).toBeLessThanOrEqual(20);
        expect(body.items.length).toBeLessThanOrEqual(mockItems.length);
    });

    it('trả về 400 QUERY_TOO_LONG khi truy vấn vượt 120 ký tự', async () => {
        const res = await createApp().request(`/api/search?q=${'x'.repeat(121)}`);

        expect(res.status).toBe(400);
        const body = (await res.json()) as { error: { code: string } };
        expect(body.error.code).toBe('QUERY_TOO_LONG');
    });
});
