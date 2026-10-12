import { useState, useEffect, useMemo } from "react";
import { loadLatestDigest } from "../api/load-digest";
import type { CategoryFilter, DigestFeedItem, DigestFeedPayload, VerdictFilter } from "../../../types";

export function useDigest() {
  const [data, setData] = useState<DigestFeedPayload | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>("all");
  const [selectedVerdict, setSelectedVerdict] = useState<VerdictFilter>("all");

  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      try {
        setIsLoading(true);
        setError(null);
        const payload = await loadLatestDigest();
        if (isMounted) {
          setData(payload);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || "Không thể tải dữ liệu bản tin.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredItems = useMemo<DigestFeedItem[]>(() => {
    if (!data?.items) return [];

    return data.items.filter((item) => {
      // 1. Category filter
      if (selectedCategory !== "all" && item.category !== selectedCategory) {
        return false;
      }

      // 2. Verdict filter
      if (selectedVerdict !== "all" && item.verdict !== selectedVerdict) {
        return false;
      }

      // 3. Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesTitle = item.title.toLowerCase().includes(query);
        const matchesPurpose = item.purpose?.toLowerCase().includes(query) ?? false;
        const matchesHighlight = item.highlight?.toLowerCase().includes(query) ?? false;
        const matchesAction = item.action?.toLowerCase().includes(query) ?? false;
        const matchesTags = item.tags?.toLowerCase().includes(query) ?? false;

        return matchesTitle || matchesPurpose || matchesHighlight || matchesAction || matchesTags;
      }

      return true;
    });
  }, [data, selectedCategory, selectedVerdict, searchQuery]);

  return {
    data,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    selectedVerdict,
    setSelectedVerdict,
    filteredItems,
    totalCount: data?.items?.length ?? 0,
    filteredCount: filteredItems.length,
  };
}
