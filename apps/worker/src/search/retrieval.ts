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

export const VIETNAMESE_STOP_WORDS = new Set([
  "la", "gi", "va", "co", "diem", "noi", "bat", "cua", "cho", "minh",
  "hoi", "ve", "nay", "dung", "de", "lam", "nhu", "the", "nao", "sao",
  "tom", "tat", "biet", "them", "thong", "tin", "duoc", "khong", "hay",
  "chi", "tiet", "cac", "nhung", "trong", "mot", "so", "cai", "con",
  "ban", "nhe", "nua", "voi"
]);

const OVERVIEW_PATTERNS = [
  /ban tin/i,
  /tong hop/i,
  /co gi moi/i,
  /tin moi/i,
  /noi bat hom nay/i,
  /top repo/i,
  /top extension/i,
  /trending/i,
  /danh sach.*(repo|tool|ai|extension)/i,
  /hom nay co (gi|nhung|cac)/i,
  /tin tuc.*hom nay/i,
  /tin.*ai/i,
];

/**
 * Tách các từ khóa có ý nghĩa (bỏ qua các hư từ/từ nối phổ biến trong tiếng Việt)
 */
export function extractMeaningfulTokens(tokens: string[]): string[] {
  const filtered = tokens.filter((t) => !VIETNAMESE_STOP_WORDS.has(t));
  return filtered.length > 0 ? filtered : tokens;
}

/**
 * Kiểm tra xem câu hỏi có phải dạng câu hỏi tổng quan / tổng hợp bản tin hôm nay không
 */
export function isOverviewQuery(query: string): boolean {
  const norm = normalizeVietnamese(query);
  return OVERVIEW_PATTERNS.some((pattern) => pattern.test(norm));
}

/**
 * Tính điểm khớp giữa các từ khóa câu hỏi và một mục tin tức
 */
export function calculateMatchScore(tokens: string[], item: SearchIndexItem): number {
  if (tokens.length === 0) return 0;

  const effectiveTokens = extractMeaningfulTokens(tokens);

  const normTitle = normalizeVietnamese(item.title);
  const titleWords = normTitle.split(/\s+/);
  const normTags = item.tags.map((t) => normalizeVietnamese(t));
  const normPurpose = normalizeVietnamese(item.purpose ?? "");
  const normHighlight = normalizeVietnamese(item.highlight ?? "");

  let rawScore = 0;
  let hasStrongTitleMatch = false;

  for (const token of effectiveTokens) {
    // 1. Khớp tiêu đề
    if (normTitle === token) {
      rawScore += 5.0;
      hasStrongTitleMatch = true;
    } else if (titleWords.includes(token)) {
      rawScore += 4.0;
      hasStrongTitleMatch = true;
    } else if (normTitle.includes(token)) {
      rawScore += 2.5;
    }

    // 2. Khớp tags
    if (normTags.includes(token)) {
      rawScore += 3.0;
    } else if (normTags.some((t) => t.includes(token))) {
      rawScore += 1.5;
    }

    // 3. Khớp purpose & highlight
    if (normPurpose.includes(token)) {
      rawScore += 1.5;
    }
    if (normHighlight.includes(token)) {
      rawScore += 1.0;
    }
  }

  const normalized = rawScore / effectiveTokens.length;

  // Nếu có title match rõ ràng hoặc raw score cao, bảo đảm điểm không bị pha loãng bởi câu hỏi tự nhiên dài
  if (hasStrongTitleMatch || rawScore >= 3.0) {
    return Math.max(1.0, normalized);
  }

  return normalized;
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

  // Nếu không tìm thấy mục cụ thể nào nhưng câu hỏi là dạng tổng hợp tổng quan về hôm nay/bản tin
  if (scored.length === 0 && isOverviewQuery(query)) {
    const fallbackItems = items.slice(0, maxItems);
    return {
      items: fallbackItems,
      topScore: 1.0,
      totalCandidates: fallbackItems.length,
    };
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
