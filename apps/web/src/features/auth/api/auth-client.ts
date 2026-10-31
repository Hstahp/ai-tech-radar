import { UserProfileSchema, type UserProfile } from '@radar/core';
import { API_BASE, getAuthHeaders, setStoredToken } from '../../../lib/api-config';

export async function fetchCurrentUser(): Promise<UserProfile | null> {
    try {
        const res = await fetch(`${API_BASE}/api/me`, {
            headers: {
                ...getAuthHeaders(),
            },
            credentials: 'include',
        });
        if (res.status === 401 || res.status === 403) {
            return null;
        }
        if (!res.ok) {
            return null;
        }
        const data = await res.json();
        const parsed = UserProfileSchema.safeParse(data);
        return parsed.success ? parsed.data : null;
    } catch {
        return null;
    }
}

export function getGoogleLoginUrl(): string {
    return `${API_BASE}/auth/login/google`;
}

export async function logoutUser(): Promise<boolean> {
    try {
        const res = await fetch(`${API_BASE}/auth/logout`, {
            method: 'POST',
            headers: {
                ...getAuthHeaders(),
            },
            credentials: 'include',
        });
        setStoredToken(null);
        return res.ok;
    } catch {
        setStoredToken(null);
        return false;
    }
}

export async function deleteUserAccount(): Promise<boolean> {
    try {
        const res = await fetch(`${API_BASE}/api/me`, {
            method: 'DELETE',
            headers: {
                ...getAuthHeaders(),
            },
            credentials: 'include',
        });
        setStoredToken(null);
        return res.ok;
    } catch {
        setStoredToken(null);
        return false;
    }
}

export async function saveUserTags(tags: string[]): Promise<string[]> {
    const res = await fetch(`${API_BASE}/api/me/tags`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
        },
        credentials: 'include',
        body: JSON.stringify({ tags }),
    });
    if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData?.error?.message || 'Không thể cập nhật danh sách thẻ.');
    }
    const data = (await res.json()) as { tags: string[]; token?: string };
    if (data.token) {
        setStoredToken(data.token);
    }
    if (typeof window !== 'undefined') {
        localStorage.setItem('radar_user_tags', JSON.stringify(data.tags ?? []));
    }
    return data.tags ?? [];
}
