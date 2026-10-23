import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchActiveTags } from '../src/lib/active-tags.js';
import { TAGS } from '@radar/core';

describe('Phase 2 - Step E: Pipeline fetchActiveTags Client', () => {
    const originalFetch = globalThis.fetch;

    beforeEach(() => {
        vi.restoreAllMocks();
    });

    afterEach(() => {
        globalThis.fetch = originalFetch;
    });

    it('fallback về danh sách tag hệ thống khi không có cấu hình workerUrl hoặc pipelineToken', async () => {
        const result = await fetchActiveTags({
            workerUrl: undefined,
            pipelineToken: undefined,
        });

        expect(result.source).toBe('fallback');
        expect(result.tags.length).toBe(TAGS.length);
        expect(result.tags.every((t) => t.maxItems === 10)).toBe(true);
        expect(result.hiddenKeys.size).toBe(0);
    });

    it('gọi thành công worker API và parse đúng danh sách tag khi token và response hợp lệ', async () => {
        const mockResponse = {
            tags: [
                { slug: 'mcp', maxItems: 15 },
                { slug: 'agent', maxItems: 12 },
            ],
            hiddenKeys: ['hidden_hash_1', 'hidden_hash_2'],
            generatedAt: '2026-10-23T00:00:00Z',
        };

        globalThis.fetch = vi.fn().mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => mockResponse,
        } as unknown as Response);

        const result = await fetchActiveTags({
            workerUrl: 'https://ai-tech-radar.phatle219.workers.dev',
            pipelineToken: 'secret_token_123',
        });

        expect(result.source).toBe('worker');
        expect(result.tags).toEqual(mockResponse.tags);
        expect(result.hiddenKeys.has('hidden_hash_1')).toBe(true);
        expect(result.hiddenKeys.has('hidden_hash_2')).toBe(true);
        expect(result.hiddenKeys.has('unknown')).toBe(false);

        expect(globalThis.fetch).toHaveBeenCalledWith(
            'https://ai-tech-radar.phatle219.workers.dev/internal/active-tags',
            expect.objectContaining({
                headers: expect.objectContaining({
                    Authorization: 'Bearer secret_token_123',
                }),
            }),
        );
    });

    it('fallback an toàn về tag hệ thống khi worker API trả lỗi 500 hoặc 401', async () => {
        globalThis.fetch = vi.fn().mockResolvedValue({
            ok: false,
            status: 500,
            text: async () => 'Internal Server Error',
        } as unknown as Response);

        const result = await fetchActiveTags({
            workerUrl: 'https://ai-tech-radar.phatle219.workers.dev',
            pipelineToken: 'secret_token_123',
        });

        expect(result.source).toBe('fallback');
        expect(result.tags.length).toBe(TAGS.length);
    });

    it('fallback an toàn khi mạng bị ngắt kết nối hoặc timeout (không bao giờ crash pipeline)', async () => {
        globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network timeout after 10000ms'));

        const result = await fetchActiveTags({
            workerUrl: 'https://ai-tech-radar.phatle219.workers.dev',
            pipelineToken: 'secret_token_123',
            timeoutMs: 100,
        });

        expect(result.source).toBe('fallback');
        expect(result.tags.length).toBe(TAGS.length);
    });

    it('fallback an toàn khi payload JSON từ worker bị sai schema', async () => {
        globalThis.fetch = vi.fn().mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({ invalidPayload: true }),
        } as unknown as Response);

        const result = await fetchActiveTags({
            workerUrl: 'https://ai-tech-radar.phatle219.workers.dev',
            pipelineToken: 'secret_token_123',
        });

        expect(result.source).toBe('fallback');
        expect(result.tags.length).toBe(TAGS.length);
    });
});
