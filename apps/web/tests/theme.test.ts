import { describe, it, expect, vi, beforeEach } from 'vitest';
import { resolveTheme, applyTheme, THEME_STORAGE_KEY, StorageLike, ElementLike } from '../src/lib/theme';

describe('theme utilities', () => {
    let mockStorage: StorageLike;
    let store: Record<string, string>;

    beforeEach(() => {
        store = {};
        mockStorage = {
            getItem: (key: string) => store[key] ?? null,
            setItem: (key: string, value: string) => {
                store[key] = value;
            },
        };
    });

    describe('resolveTheme', () => {
        it('ưu tiên giá trị lưu trữ trong localStorage nếu hợp lệ', () => {
            store[THEME_STORAGE_KEY] = 'light';
            expect(resolveTheme(mockStorage, false, 'dark')).toBe('light');

            store[THEME_STORAGE_KEY] = 'dark';
            expect(resolveTheme(mockStorage, true, 'light')).toBe('dark');
        });

        it('chọn theme theo tùy chọn hệ thống nếu chưa có lưu trữ', () => {
            expect(resolveTheme(mockStorage, true, 'dark')).toBe('light');
            expect(resolveTheme(mockStorage, false, 'dark')).toBe('dark');
        });

        it('sử dụng defaultTheme nếu không có hệ thống preferences', () => {
            expect(resolveTheme(mockStorage, undefined, 'dark')).toBe('dark');
            expect(resolveTheme(mockStorage, undefined, 'light')).toBe('light');
        });

        it('bỏ qua giá trị lưu trữ không hợp lệ', () => {
            store[THEME_STORAGE_KEY] = 'invalid-value';
            expect(resolveTheme(mockStorage, false, 'dark')).toBe('dark');
        });
    });

    describe('applyTheme', () => {
        it('thêm/xóa class tương ứng trên phần tử và lưu vào storage', () => {
            const added: string[] = [];
            const removed: string[] = [];
            const mockElement: ElementLike = {
                classList: {
                    add: (token: string) => added.push(token),
                    remove: (token: string) => removed.push(token),
                },
            };

            applyTheme('dark', mockElement, mockStorage);
            expect(added).toContain('dark');
            expect(removed).toContain('light');
            expect(store[THEME_STORAGE_KEY]).toBe('dark');

            applyTheme('light', mockElement, mockStorage);
            expect(added).toContain('light');
            expect(removed).toContain('dark');
            expect(store[THEME_STORAGE_KEY]).toBe('light');
        });
    });
});
