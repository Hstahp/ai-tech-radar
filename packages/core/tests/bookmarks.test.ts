import { describe, it, expect } from 'vitest';
import { CreateBookmarkSchema, UserBookmarkItemSchema } from '../src/schemas.js';

describe('Bookmark Schemas', () => {
    it('validate thành công dữ liệu tạo bookmark hợp lệ', () => {
        const valid = {
            itemKey: 'deepseek-v3',
            title: 'DeepSeek-V3 Technical Report',
            url: 'https://arxiv.org/abs/2610.12345',
            category: 'paper',
            author: 'DeepSeek-AI',
            tags: 'paper,llm,open-source',
            summary: 'Tóm tắt bài báo nghiên cứu...',
        };

        const result = CreateBookmarkSchema.safeParse(valid);
        expect(result.success).toBe(true);
    });

    it('từ chối khi thiếu itemKey hoặc title', () => {
        const invalid = {
            itemKey: '',
            title: '',
            url: 'https://example.com',
            category: 'news',
        };

        const result = CreateBookmarkSchema.safeParse(invalid);
        expect(result.success).toBe(false);
    });

    it('validate cấu trúc danh sách bookmark trả về từ API', () => {
        const bookmark = {
            itemKey: '169',
            title: 'Facebook Pages require paid subscription...',
            url: 'https://mastodon.gamedev.place/@AshleyGullen/117473851565913919',
            category: 'news',
            author: '@AshleyGullen',
            tags: 'news',
            summary: null,
            createdAt: '2026-10-31T20:00:00Z',
        };

        const result = UserBookmarkItemSchema.safeParse(bookmark);
        expect(result.success).toBe(true);
    });
});
