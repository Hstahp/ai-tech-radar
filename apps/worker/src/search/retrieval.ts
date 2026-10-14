import { normalizeVietnamese, tokenizeQuery, type SearchIndexItem } from "@radar/core";

export interface ScoredItem {
  item: SearchIndexItem;
  score: number;
}

export interface RetrievalResult {
  items: SearchIndexItem[];
  topScore: number;
  totalCandidates: number;
}

/**
 * Tính điểm khớp giữa các từ khóa câu hỏi và một mục tin tức
 */
export function calculateMatchScore(tokens: string[], item: SearchIndexItem): number {
  if (tokens.length === 0) return 0;

  const normTitle = normalizeVietnamese(item.title);
  const normTags = item.tags.map((t) => normalizeVietnamese(t)).join(" ");
  const normPurpose = normalizeVietnamese(item.purpose ?? "");
  const normHighlight = normalizeVietnamese(item.highlight ?? "");

  let score = 0;

  for (const token of tokens) {
    if (normTitle.includes(token)) {
      score += 3.0;
    }
    if (normTags.includes(token)) {
      score += 2.5;
    }
    if (normPurpose.includes(token)) {
      score += 1.5;
    }
    if (normHighlight.includes(token)) {
      score += 1.0;
    }
  }

  // Chuẩn hóa điểm theo số lượng từ khóa
  return score / tokens.length;
}

/**
 * Truy xuất top các mục phù hợp nhất từ search index
 */
export function retrieveRelevantItems(
  items: SearchIndexItem[],
  query: string,
  maxItems: number = 8,
  minScore: number = 0.5
): RetrievalResult {
  const tokens = tokenizeQuery(query);
  if (tokens.length === 0) {
    return { items: [], topScore: 0, totalCandidates: 0 };
  }

  const scored: ScoredItem[] = [];

  for (const item of items) {
    const score = calculateMatchScore(tokens, item);
    if (score >= minScore) {
      scored.push({ item, score });
    }
  }

  // Sắp xếp giảm dần theo điểm
  scored.sort((a, b) => b.score - a.score);

  const topItems = scored.slice(0, maxItems).map((s) => s.item);
  const topScore = scored.length > 0 ? scored[0].score : 0;

  return {
    items: topItems,
    topScore,
    totalCandidates: scored.length,
  };
}
