import { useState, useEffect, useCallback } from "react";
import type { UserProfile } from "@radar/core";
import {
  fetchCurrentUser,
  getGoogleLoginUrl,
  logoutUser,
  deleteUserAccount,
  saveUserTags,
} from "../api/auth-client";
import { setStoredToken } from "../../../lib/api-config";

export function useAuth() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isTagModalOpen, setIsTagModalOpen] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const refreshUser = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const current = await fetchCurrentUser();
      if (current && typeof window !== 'undefined') {
        const savedTagsStr = localStorage.getItem('radar_user_tags');
        if ((!current.tags || current.tags.length === 0) && savedTagsStr) {
          try {
            const savedTags = JSON.parse(savedTagsStr);
            if (Array.isArray(savedTags) && savedTags.length > 0) {
              current.tags = savedTags;
            }
          } catch {}
        } else if (current.tags && current.tags.length > 0) {
          localStorage.setItem('radar_user_tags', JSON.stringify(current.tags));
        }
      }
      setUser(current);
    } catch (err: any) {
      setError(err.message || "Lỗi nạp thông tin người dùng.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlToken = params.get("token");
      if (urlToken) {
        setStoredToken(urlToken);
        params.delete("token");
        const newSearch = params.toString();
        const cleanUrl =
          window.location.pathname +
          (newSearch ? `?${newSearch}` : "") +
          window.location.hash;
        window.history.replaceState({}, document.title, cleanUrl);
      }
    }
    refreshUser();
  }, [refreshUser]);

  const loginWithGoogle = useCallback(() => {
    window.location.href = getGoogleLoginUrl();
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    await logoutUser();
    setUser(null);
    setIsLoading(false);
  }, []);

  const deleteAccount = useCallback(async () => {
    const confirmed = window.confirm(
      "Bạn có chắc chắn muốn xóa tài khoản và toàn bộ dữ liệu cá nhân không? Thao tác này không thể hoàn tác."
    );
    if (!confirmed) return false;

    setIsLoading(true);
    const success = await deleteUserAccount();
    if (success) {
      setUser(null);
    }
    setIsLoading(false);
    return success;
  }, []);

  const updateTags = useCallback(
    async (tags: string[]) => {
      if (!user) return;
      const updated = await saveUserTags(tags);
      setUser({ ...user, tags: updated });
    },
    [user]
  );

  return {
    user,
    isLoading,
    error,
    isTagModalOpen,
    openTagModal: () => setIsTagModalOpen(true),
    closeTagModal: () => setIsTagModalOpen(false),
    loginWithGoogle,
    logout,
    deleteAccount,
    updateTags,
    refreshUser,
  };
}
