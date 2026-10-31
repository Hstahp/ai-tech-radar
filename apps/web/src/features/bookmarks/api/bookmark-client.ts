import {
  type CreateBookmark,
  type UserBookmarkItem,
  type DigestFeedItem,
  type Category,
  UserBookmarkItemSchema,
} from '@radar/core';
import { z } from 'zod';
import { API_BASE, getAuthHeaders } from '../../../lib/api-config';

export function feedItemToCreateBookmark(item: DigestFeedItem): CreateBookmark {
  return {
    itemKey: item.key || `${item.category}_${item.item_id}`,
    title: item.title,
    url: item.url,
    category: item.category,
    author: item.author ?? null,
    tags: item.tags ?? null,
    summary: item.purpose || item.highlight || item.action || item.description || null,
  };
}

export function bookmarkToFeedItem(b: UserBookmarkItem): DigestFeedItem {
  const cat = (b.category as Category) || 'repo';
  // Tạo số ID ổn định dựa trên itemKey để tránh trùng key
  const numericId = Math.abs(
    b.itemKey.split('').reduce((acc, char) => (acc << 5) - acc + char.charCodeAt(0), 0)
  );

  return {
    item_id: numericId,
    key: b.itemKey,
    title: b.title,
    url: b.url,
    category: cat,
    section: cat,
    rank: 1,
    digest_date: b.createdAt.slice(0, 10),
    language: null,
    purpose: b.summary ?? null,
    highlight: null,
    action: null,
    verdict: 'try_now',
    confidence: 'high',
    tags: b.tags ?? null,
    stars: null,
    author: b.author ?? null,
    published_at: b.createdAt,
    description: b.summary ?? null,
  };
}

const GetBookmarksResponseSchema = z.object({
  bookmarks: z.array(UserBookmarkItemSchema),
});

const PostBookmarkResponseSchema = z.object({
  bookmark: UserBookmarkItemSchema,
});

export async function fetchBookmarksApi(): Promise<UserBookmarkItem[]> {
  try {
    const res = await fetch(`${API_BASE}/api/me/bookmarks`, {
      headers: {
        ...getAuthHeaders(),
      },
      credentials: 'include',
    });

    if (!res.ok) {
      return [];
    }

    const data = await res.json();
    const parsed = GetBookmarksResponseSchema.safeParse(data);
    return parsed.success ? parsed.data.bookmarks : [];
  } catch {
    return [];
  }
}

export async function addBookmarkApi(
  payload: CreateBookmark
): Promise<UserBookmarkItem | null> {
  try {
    const res = await fetch(`${API_BASE}/api/me/bookmarks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      credentials: 'include',
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    const parsed = PostBookmarkResponseSchema.safeParse(data);
    return parsed.success ? parsed.data.bookmark : null;
  } catch {
    return null;
  }
}

export async function removeBookmarkApi(itemKey: string): Promise<boolean> {
  try {
    const res = await fetch(
      `${API_BASE}/api/me/bookmarks/${encodeURIComponent(itemKey)}`,
      {
        method: 'DELETE',
        headers: {
          ...getAuthHeaders(),
        },
        credentials: 'include',
      }
    );

    return res.ok;
  } catch {
    return false;
  }
}
