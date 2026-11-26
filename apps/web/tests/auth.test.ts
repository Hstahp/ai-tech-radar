import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchCurrentUser, saveUserTags, logoutUser } from '../src/features/auth/api/auth-client';
import { getStoredToken, setStoredToken } from '../src/lib/api-config';

describe('Web Auth Client & Tag Synchronization (Bug 1 & 2)', () => {
    const originalFetch = globalThis.fetch;
    let store: Record<string, string> = {};

    beforeEach(() => {
        vi.restoreAllMocks();
        store = {};
        const localStorageMock = {
            getItem: vi.fn((key: string) => store[key] ?? null),
            setItem: vi.fn((key: string, value: string) => {
                store[key] = value;
            }),
            removeItem: vi.fn((key: string) => {
                delete store[key];
            }),
            clear: vi.fn(() => {
                store = {};
            }),
        };
        vi.stubGlobal('localStorage', localStorageMock);
        vi.stubGlobal('window', { localStorage: localStorageMock });
    });

    afterEach(() => {
        globalThis.fetch = originalFetch;
        vi.unstubAllGlobals();
    });

    it('fetchCurrentUser: trả về UserProfile khi token hợp lệ', async () => {
        const mockProfile = {
            id: 'usr_123',
            email: 'dev@radar.vn',
            displayName: 'Dev Vietnam',
            role: 'user',
            tags: ['agent', 'mcp'],
            chatQuotaRemaining: 10,
        };

        globalThis.fetch = vi.fn().mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => mockProfile,
        } as Response);

        const profile = await fetchCurrentUser();
        expect(profile).not.toBeNull();
        expect(profile?.email).toBe('dev@radar.vn');
        expect(profile?.tags).toEqual(['agent', 'mcp']);
    });

    it('fetchCurrentUser: trả về null khi bị lỗi 401 hoặc token hết hạn', async () => {
        globalThis.fetch = vi.fn().mockResolvedValue({
            ok: false,
            status: 401,
        } as Response);

        const profile = await fetchCurrentUser();
        expect(profile).toBeNull();
    });

    it('saveUserTags: cập nhật tags, không ghi cache toàn cục và cập nhật token mới', async () => {
        const updatedTags = ['agent', 'rag', 'devtools'];
        const updatedToken = 'new_signed_jwt_token_sample';

        globalThis.fetch = vi.fn().mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({ tags: updatedTags, token: updatedToken }),
        } as Response);

        const resTags = await saveUserTags(updatedTags);
        expect(resTags).toEqual(updatedTags);

        // Cache tag do useAuth lưu theo từng user id, không dùng key chung.
        expect(localStorage.setItem).not.toHaveBeenCalledWith('radar_user_tags', expect.anything());
        expect(store['radar_user_tags']).toBeUndefined();

        // Kiểm tra token đã được lưu
        expect(getStoredToken()).toBe(updatedToken);
    });

    it('logoutUser: xóa token đã lưu và gọi endpoint logout', async () => {
        setStoredToken('active_token');
        expect(getStoredToken()).toBe('active_token');

        globalThis.fetch = vi.fn().mockResolvedValue({
            ok: true,
            status: 200,
        } as Response);

        const success = await logoutUser();
        expect(success).toBe(true);
        expect(getStoredToken()).toBeNull();
    });
});
