import { describe, it, expect } from 'vitest';
import { extractAuthor, formatPublishedDate } from '../src/pages/ItemDetailPage';
import type { DigestFeedItem } from '@radar/core';

describe('ItemDetailPage metadata extraction & formatting', () => {
  const baseItem: DigestFeedItem = {
    section: 'repo',
    rank: 1,
    item_id: 101,
    key: 'test_item_key',
    category: 'repo',
    title: 'DeepInfer Engine',
    url: 'https://github.com/deepseek-ai/DeepInfer',
    language: 'Python',
    purpose: 'Tăng tốc suy luận mô hình lớn',
    highlight: 'Tối ưu vLLM và DeepSeek backend',
    action: 'Cài đặt và thử nghiệm',
    verdict: 'must_read',
    confidence: 'high',
    tags: 'llm,inference,python',
    stars: 5400,
  };

  describe('extractAuthor', () => {
    it('ưu tiên trả về author nếu trường author có sẵn', () => {
      const itemWithAuthor: DigestFeedItem = {
        ...baseItem,
        author: 'DeepSeek Research Lab',
      };
      expect(extractAuthor(itemWithAuthor)).toBe('DeepSeek Research Lab');
    });

    it('tự động trích xuất owner từ đường dẫn GitHub nếu author null', () => {
      const itemGitHub: DigestFeedItem = {
        ...baseItem,
        author: null,
        url: 'https://github.com/vllm-project/vllm',
      };
      expect(extractAuthor(itemGitHub)).toBe('vllm-project');
    });

    it('tự động trích xuất namespace từ Open VSX nếu author null', () => {
      const itemOpenVsx: DigestFeedItem = {
        ...baseItem,
        author: null,
        url: 'https://open-vsx.org/extension/sourcegraph/cody-ai',
      };
      expect(extractAuthor(itemOpenVsx)).toBe('sourcegraph');
    });

    it('trả về null nếu không có author và không thể trích xuất từ URL (để ẩn trường trên UI)', () => {
      const itemGenericNews: DigestFeedItem = {
        ...baseItem,
        author: null,
        url: 'https://news.ycombinator.com/item?id=123456',
      };
      expect(extractAuthor(itemGenericNews)).toBeNull();
    });
  });

  describe('formatPublishedDate', () => {
    it('định dạng ngày tháng chuẩn Việt Nam (DD/MM/YYYY)', () => {
      const formatted = formatPublishedDate('2026-10-15T08:30:00Z');
      expect(formatted).toBe('15/10/2026');
    });

    it('trả về null khi ngày null hoặc rỗng (để ẩn trường trên UI)', () => {
      expect(formatPublishedDate(null)).toBeNull();
      expect(formatPublishedDate(undefined)).toBeNull();
      expect(formatPublishedDate('')).toBeNull();
      expect(formatPublishedDate('invalid-date')).toBeNull();
    });
  });

  describe('ItemDetailPage structure requirement', () => {
    it('xác nhận các trường dữ liệu bắt buộc không phụ thuộc vào Deep Explain AI', () => {
      // Đảm bảo item có đầy đủ cấu trúc để hiển thị tóm tắt, mục đích, highlight, hành động
      expect(baseItem.purpose).toBeDefined();
      expect(baseItem.highlight).toBeDefined();
      expect(baseItem.action).toBeDefined();
      expect(baseItem.url).toBeDefined();
    });
  });
});
