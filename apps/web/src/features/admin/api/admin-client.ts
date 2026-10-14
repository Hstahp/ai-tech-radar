import type { AdminTagUpdate, AdminTagCreate, AdminUserUpdate } from '@radar/core';
import { API_BASE, getAuthHeaders } from '../../../lib/api-config';

export interface AdminOverviewMetrics {
    today: string;
    totalChatRequests: number;
    totalExplainRequests: number;
    totalTokens: number;
    refusedChatRequests: number;
    activeUsersCount: number;
    chatLimit: number;
    explainLimit: number;
}

export interface AdminTagItem {
    slug: string;
    label: string;
    enabled: number;
    isSystem: number;
    maxItems: number | null;
    followers?: number;
}

export interface AdminTagRequestItem {
    id: number;
    userId: string;
    userEmail?: string;
    slugProposed: string;
    label: string;
    reason?: string | null;
    status: 'pending' | 'approved' | 'rejected';
    reviewedBy?: string | null;
    reviewedAt?: string | null;
    createdAt: string;
}

export interface AdminUserItem {
    id: string;
    email: string;
    displayName?: string | null;
    avatarUrl?: string | null;
    role: 'user' | 'admin';
    status: 'active' | 'suspended';
    createdAt: string;
    lastLoginAt?: string | null;
    dailyChatRequests: number;
    dailyExplainRequests: number;
}

export interface AdminAuditLogItem {
    id: number;
    actorUserId?: string | null;
    actorEmail?: string | null;
    action: string;
    targetType?: string | null;
    targetId?: string | null;
    metadataJson?: string | null;
    createdAt: string;
}

export async function fetchAdminOverview(): Promise<AdminOverviewMetrics> {
    const res = await fetch(`${API_BASE}/api/admin/overview`, {
        headers: { ...getAuthHeaders() },
        credentials: 'include',
    });
    if (!res.ok) throw new Error('Không thể tải dữ liệu tổng quan quản trị.');
    const data = await res.json();
    return data.overview;
}

export async function fetchAdminSettings(): Promise<Record<string, string>> {
    const res = await fetch(`${API_BASE}/api/admin/settings`, {
        headers: { ...getAuthHeaders() },
        credentials: 'include',
    });
    if (!res.ok) throw new Error('Không thể tải danh sách cấu hình hệ thống.');
    const data = await res.json();
    return data.settings;
}

export async function updateAdminSettings(settings: Record<string, string>): Promise<Record<string, string>> {
    const res = await fetch(`${API_BASE}/api/admin/settings`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
        },
        credentials: 'include',
        body: JSON.stringify({ settings }),
    });
    if (!res.ok) throw new Error('Cập nhật cấu hình thất bại.');
    const data = await res.json();
    return data.settings;
}

export async function fetchAdminTags(): Promise<AdminTagItem[]> {
    const res = await fetch(`${API_BASE}/api/admin/tags`, {
        headers: { ...getAuthHeaders() },
        credentials: 'include',
    });
    if (!res.ok) throw new Error('Không thể tải danh sách thẻ hệ thống.');
    const data = await res.json();
    return data.tags;
}

export async function updateAdminTag(slug: string, updates: AdminTagUpdate): Promise<void> {
    const res = await fetch(`${API_BASE}/api/admin/tags/${slug}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
        },
        credentials: 'include',
        body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error(`Không thể cập nhật thẻ ${slug}.`);
}

export async function createAdminTag(tag: AdminTagCreate): Promise<void> {
    const res = await fetch(`${API_BASE}/api/admin/tags`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
        },
        credentials: 'include',
        body: JSON.stringify(tag),
    });
    if (!res.ok) throw new Error('Không thể tạo thẻ mới.');
}

export async function fetchAdminTagRequests(status?: string): Promise<AdminTagRequestItem[]> {
    const url = status
        ? `${API_BASE}/api/admin/tag-requests?status=${encodeURIComponent(status)}`
        : `${API_BASE}/api/admin/tag-requests`;
    const res = await fetch(url, {
        headers: { ...getAuthHeaders() },
        credentials: 'include',
    });
    if (!res.ok) throw new Error('Không thể tải danh sách đề xuất thẻ.');
    const data = await res.json();
    return data.requests;
}

export async function reviewTagRequest(id: number, status: 'approved' | 'rejected'): Promise<void> {
    const res = await fetch(`${API_BASE}/api/admin/tag-requests/${id}/review`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
        },
        credentials: 'include',
        body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error('Xử lý xét duyệt thẻ thất bại.');
}

export async function fetchAdminUsers(search?: string): Promise<AdminUserItem[]> {
    const url = search
        ? `${API_BASE}/api/admin/users?search=${encodeURIComponent(search)}`
        : `${API_BASE}/api/admin/users`;
    const res = await fetch(url, {
        headers: { ...getAuthHeaders() },
        credentials: 'include',
    });
    if (!res.ok) throw new Error('Không thể tải danh sách người dùng.');
    const data = await res.json();
    return data.users;
}

export async function updateAdminUser(id: string, updates: AdminUserUpdate): Promise<void> {
    const res = await fetch(`${API_BASE}/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
        },
        credentials: 'include',
        body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Không thể cập nhật thông tin người dùng.');
}

export async function fetchAdminAuditLogs(limit: number = 50, offset: number = 0): Promise<AdminAuditLogItem[]> {
    const res = await fetch(`${API_BASE}/api/admin/audit?limit=${limit}&offset=${offset}`, {
        headers: { ...getAuthHeaders() },
        credentials: 'include',
    });
    if (!res.ok) throw new Error('Không thể tải nhật ký kiểm toán.');
    const data = await res.json();
    return data.logs;
}

export async function submitTagRequest(slugProposed: string, label: string, reason?: string): Promise<void> {
    const res = await fetch(`${API_BASE}/api/tag-requests`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
        },
        credentials: 'include',
        body: JSON.stringify({ slugProposed, label, reason }),
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error?.message || 'Gửi đề xuất thẻ thất bại.');
    }
}
