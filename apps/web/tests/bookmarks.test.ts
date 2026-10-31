import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { DigestFeedItem, UserBookmarkItem } from '@radar/core';
import {
  feedItemToCreateBookmark,
  bookmarkToFeedItem,
  fetchBookmarksApi,
  addBookmarkApi,
  removeBookmarkApi,
} from '../src/features/bookmarks/api/bookmark-client';

describe('Bookmark Client & Mappers', () => {
  const sampleFeedItem: DigestFeedItem = {
    section: 'paper',
    rank: 1,
    item_id: 88,
    key: 'paper_88',
    category: 'paper',
    title: 'Attention Is All You Need',
    url: 'https://arxiv.org/abs/1706.03762',
    language: 'Python',
    purpose: 'Kiến trúc Transformer mang tính cách mạng',
    highlight: 'Multi-head self-attention',
    action: 'Đọc kỹ phần Attention mechanism',
    verdict: 'try_now',
    confidence: 'high',
    tags: 'paper,transformer,ai-research',
    stars: 1250,
    author: 'Vaswani et al.',
    published_at: '2017-06-12',
    digest_date: '2026-10-31',
  };

  const sampleBookmark: UserBookmarkItem = {
    itemKey: 'paper_88',
    title: 'Attention Is All You Need',
    url: 'https://arxiv.org/abs/1706.03762',
    category: 'paper',
    summary: 'Kiến trúc Transformer mang tính cách mạng',
    tags: 'paper,transformer,ai-research',
    author: 'Vaswani et al.',
    createdAt: '2026-10-31T20:00:00Z',
  };

  describe('feedItemToCreateBookmark', () => {
    it('chuyển đổi chuẩn xác DigestFeedItem sang CreateBookmark', () => {
      const payload = feedItemToCreateBookmark(sampleFeedItem);
      expect(payload.itemKey).toBe('paper_88');
      expect(payload.title).toBe(sampleFeedItem.title);
      expect(payload.url).toBe(sampleFeedItem.url);
      expect(payload.category).toBe('paper');
      expect(payload.summary).toBe(sampleFeedItem.purpose);
      expect(payload.author).toBe('Vaswani et al.');
    });

    it('tự sinh itemKey dự phòng nếu item.key undefined', () => {
      const itemWithoutKey: DigestFeedItem = {
        ...sampleFeedItem,
        key: undefined,
      };
      const payload = feedItemToCreateBookmark(itemWithoutKey);
      expect(payload.itemKey).toBe('paper_88');
    });
  });

  describe('bookmarkToFeedItem', () => {
    it('chuyển đổi chuẩn xác UserBookmarkItem sang DigestFeedItem', () => {
      const feedItem = bookmarkToFeedItem(sampleBookmark);
      expect(feedItem.key).toBe('paper_88');
      expect(feedItem.title).toBe(sampleBookmark.title);
      expect(feedItem.category).toBe('paper');
      expect(feedItem.purpose).toBe(sampleBookmark.summary);
      expect(feedItem.digest_date).toBe('2026-10-31');
    });
  });

  describe('API functions with fetch mocks', () => {
    const originalFetch = globalThis.fetch;

    beforeEach(() => {
      vi.restoreAllMocks();
    });

    afterEach(() => {
      globalThis.fetch = originalFetch;
    });

    it('fetchBookmarksApi: trả về danh sách bookmarks khi thành công', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ bookmarks: [sampleBookmark] }),
      } as Response);

      const result = await fetchBookmarksApi();
      expect(result).toHaveLength(1);
      expect(result[0].itemKey).toBe('paper_88');
    });

    it('fetchBookmarksApi: trả về mảng rỗng khi bị lỗi hoặc 401', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
      } as Response);

      const result = await fetchBookmarksApi();
      expect(result).toEqual([]);
    });

    it('addBookmarkApi: gọi POST và trả về bookmark đã tạo', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => ({ bookmark: sampleBookmark }),
      } as Response);

      const payload = feedItemToCreateBookmark(sampleFeedItem);
      const result = await addBookmarkApi(payload);
      expect(result).not.toBeNull();
      expect(result?.itemKey).toBe('paper_88');
    });

    it('removeBookmarkApi: gọi DELETE và trả về true khi thành công', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true, itemKey: 'paper_88' }),
      } as Response);

      const success = await removeBookmarkApi('paper_88');
      expect(success).toBe(true);
    });

    it('removeBookmarkApi: trả về false khi có lỗi', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      } as Response);

      const success = await removeBookmarkApi('paper_88');
      expect(success).toBe(false);
    });
  });
});
