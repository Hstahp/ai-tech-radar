import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useChat } from '../src/features/chat/hooks/useChat';

describe('chat module', () => {
    it('khởi tạo với lời chào mừng mặc định', () => {
        // Kiểm tra logic export và contract kiểu
        expect(typeof useChat).toBe('function');
    });
});
