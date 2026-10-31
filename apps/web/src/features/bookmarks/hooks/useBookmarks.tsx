import { useState, useEffect, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';
import type { DigestFeedItem, UserBookmarkItem, UserProfile } from '@radar/core';
import {
  fetchBookmarksApi,
  addBookmarkApi,
  removeBookmarkApi,
  feedItemToCreateBookmark,
  bookmarkToFeedItem,
} from '../api/bookmark-client';

export interface UseBookmarksReturn {
  bookmarks: UserBookmarkItem[];
  bookmarkFeedItems: DigestFeedItem[];
  bookmarkedKeys: Set<string>;
  isLoading: boolean;
  isBookmarked: (itemKey: string) => boolean;
  toggleBookmark: (item: DigestFeedItem) => Promise<boolean>;
  refreshBookmarks: () => Promise<void>;
}

export function useBookmarks(user: UserProfile | null | undefined): UseBookmarksReturn {
  const [bookmarks, setBookmarks] = useState<UserBookmarkItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const refreshBookmarks = useCallback(async () => {
    if (!user) {
      setBookmarks([]);
      return;
    }
    const cKey = `radar_user_bookmarks_${user.id}`;
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem(cKey);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setBookmarks(parsed);
          }
        } catch {}
      }
    }

    setIsLoading(true);
    try {
      const items = await fetchBookmarksApi();
      if (items.length > 0) {
        setBookmarks(items);
        if (typeof window !== 'undefined') {
          localStorage.setItem(cKey, JSON.stringify(items));
        }
      } else if (typeof window !== 'undefined') {
        const cached = localStorage.getItem(cKey);
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setBookmarks(parsed);
              for (const item of parsed) {
                await addBookmarkApi(item);
              }
            }
          } catch {}
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      refreshBookmarks();
    } else {
      setBookmarks([]);
    }
  }, [user, refreshBookmarks]);

  const bookmarkedKeys = useMemo(() => {
    return new Set(bookmarks.map((b) => b.itemKey));
  }, [bookmarks]);

  const bookmarkFeedItems = useMemo(() => {
    return bookmarks.map(bookmarkToFeedItem);
  }, [bookmarks]);

  const isBookmarked = useCallback(
    (itemKey: string): boolean => {
      return bookmarkedKeys.has(itemKey);
    },
    [bookmarkedKeys]
  );

  const toggleBookmark = useCallback(
    async (item: DigestFeedItem): Promise<boolean> => {
      if (!user) {
        toast.error('Vui lòng đăng nhập để lưu bài viết vào danh sách cá nhân.');
        return false;
      }

      const itemKey = item.key || `${item.category}_${item.item_id}`;
      const payload = feedItemToCreateBookmark(item);
      const currentlyBookmarked = bookmarkedKeys.has(itemKey);
      const cKey = `radar_user_bookmarks_${user.id}`;

      if (currentlyBookmarked) {
        // Optimistic removal
        const previousBookmarks = [...bookmarks];
        const nextBookmarks = bookmarks.filter((b) => b.itemKey !== itemKey);
        setBookmarks(nextBookmarks);
        if (typeof window !== 'undefined') {
          localStorage.setItem(cKey, JSON.stringify(nextBookmarks));
        }

        // Call backend API
        const success = await removeBookmarkApi(itemKey);
        if (!success) {
          // Rollback if network failed
          setBookmarks(previousBookmarks);
          if (typeof window !== 'undefined') {
            localStorage.setItem(cKey, JSON.stringify(previousBookmarks));
          }
          toast.error('Không thể bỏ lưu bài viết. Vui lòng thử lại.');
          return false;
        }

        // Accidental Unsave Solution: Hiển thị Toast Hoàn tác trong 6 giây
        toast(
          (t) => (
            <div className="flex items-center justify-between gap-3 w-full">
              <span className="text-sm text-slate-800 dark:text-slate-100">
                Đã bỏ lưu bài viết.
              </span>
              <button
                type="button"
                onClick={async () => {
                  toast.dismiss(t.id);
                  const restored = await addBookmarkApi(payload);
                  if (restored) {
                    setBookmarks((prev) => [
                      restored,
                      ...prev.filter((b) => b.itemKey !== itemKey),
                    ]);
                    if (typeof window !== 'undefined') {
                      const updated = [
                        restored,
                        ...nextBookmarks.filter((b) => b.itemKey !== itemKey),
                      ];
                      localStorage.setItem(cKey, JSON.stringify(updated));
                    }
                    toast.success('Đã hoàn tác và lưu lại bài viết!');
                  }
                }}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors shadow-xs"
              >
                Hoàn tác
              </button>
            </div>
          ),
          { duration: 6000, id: `undo-bookmark-${itemKey}` }
        );

        return true;
      } else {
        // Optimistic addition
        const tempBookmark: UserBookmarkItem = {
          ...payload,
          createdAt: new Date().toISOString(),
        };
        const nextBookmarks = [tempBookmark, ...bookmarks.filter((b) => b.itemKey !== itemKey)];
        setBookmarks(nextBookmarks);
        if (typeof window !== 'undefined') {
          localStorage.setItem(cKey, JSON.stringify(nextBookmarks));
        }

        // Call backend API
        const saved = await addBookmarkApi(payload);
        if (saved) {
          setBookmarks((prev) =>
            prev.map((b) => (b.itemKey === itemKey ? saved : b))
          );
          if (typeof window !== 'undefined') {
            const authoritative = nextBookmarks.map((b) => (b.itemKey === itemKey ? saved : b));
            localStorage.setItem(cKey, JSON.stringify(authoritative));
          }
          toast.success('Đã lưu bài viết vào danh sách!');
          return true;
        } else {
          setBookmarks((prev) => prev.filter((b) => b.itemKey !== itemKey));
          if (typeof window !== 'undefined') {
            localStorage.setItem(cKey, JSON.stringify(bookmarks));
          }
          toast.error('Không thể lưu bài viết. Vui lòng thử lại.');
          return false;
        }
      }
    },
    [user, bookmarks, bookmarkedKeys]
  );

  return {
    bookmarks,
    bookmarkFeedItems,
    bookmarkedKeys,
    isLoading,
    isBookmarked,
    toggleBookmark,
    refreshBookmarks,
  };
}
