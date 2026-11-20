import { Hono } from 'hono';
import type { SearchIndexItem } from '@radar/core';
import { retrieveRelevantItems } from './retrieval.js';

export interface SearchRouterOptions {
    getSearchIndex: (env?: unknown) => Promise<SearchIndexItem[]>;
}

const MIN_QUERY_LENGTH = 2;
const MAX_QUERY_LENGTH = 120;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 20;
const MIN_MATCH_SCORE = 0.5;

function parseLimit(raw: string | undefined): number {
    const parsed = Number(raw ?? DEFAULT_LIMIT);
    if (!Number.isFinite(parsed)) return DEFAULT_LIMIT;
    return Math.min(Math.max(Math.trunc(parsed), 1), MAX_LIMIT);
}

export function createSearchRouter(options: SearchRouterOptions) {
    const router = new Hono();

    router.get('/api/search', async (c) => {
        const query = (c.req.query('q') ?? '').trim();
        if (query.length < MIN_QUERY_LENGTH) {
            return c.json(
                {
                    error: {
                        code: 'INVALID_QUERY',
                        message: `Cần ít nhất ${MIN_QUERY_LENGTH} ký tự.`,
                    },
                },
                400,
            );
        }
        if (query.length > MAX_QUERY_LENGTH) {
            return c.json({ error: { code: 'QUERY_TOO_LONG', message: 'Câu truy vấn quá dài.' } }, 400);
        }

        const limit = parseLimit(c.req.query('limit'));
        const indexItems = await options.getSearchIndex(c.env);
        const { items, topScore, totalCandidates } = retrieveRelevantItems(
            indexItems,
            query,
            limit,
            MIN_MATCH_SCORE,
        );

        return c.json({
            query,
            count: items.length,
            topScore,
            totalCandidates,
            items: items.map((item) => ({
                key: item.key,
                title: item.title,
                url: item.url,
                category: item.category,
                tags: item.tags,
                purpose: item.purpose ?? null,
                stars: item.stars ?? null,
            })),
        });
    });

    return router;
}
