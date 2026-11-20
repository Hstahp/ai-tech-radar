import { afterEach, describe, expect, it, vi } from 'vitest';
import { searchItems } from '../src/features/search/api/search-items.js';

const validPayload = {
    query: 'agent',
    count: 1,
    topScore: 5.5,
    totalCandidates: 1,
    items: [
        {
            key: 'agent-forge',
            title: 'AgentForge',
            url: 'https://github.com/test/agent-forge',
            category: 'repo',
            tags: ['agent', 'devtools'],
            purpose: null,
            stars: 1200,
        },
    ],
};

function jsonResponse(payload: unknown, status = 200): Response {
    return new Response(JSON.stringify(payload), {
        status,
        headers: { 'Content-Type': 'application/json' },
    });
}

afterEach(() => {
    vi.unstubAllGlobals();
});

describe('searchItems', () => {
    it('gọi endpoint tìm kiếm và parse kết quả hợp lệ', async () => {
        const fetchMock = vi.fn(async () => jsonResponse(validPayload));
        vi.stubGlobal('fetch', fetchMock);

        const result = await searchItems('agent');

        expect(result.items).toHaveLength(1);
        expect(result.items[0]?.key).toBe('agent-forge');
        expect(result.items[0]?.stars).toBe(1200);
        expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/api/search?q=agent&limit=10'));
    });

    it('ném lỗi kèm thông báo từ body khi phản hồi không ok', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn(async () => jsonResponse({ error: { message: 'Máy chủ đang bận.' } }, 500)),
        );

        await expect(searchItems('agent')).rejects.toThrow('Máy chủ đang bận.');
    });

    it('ném lỗi schema khi payload không hợp lệ', async () => {
        vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({ query: 'agent' })));

        await expect(searchItems('agent')).rejects.toThrow();
    });
});
