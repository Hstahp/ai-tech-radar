import type { SearchIndexItem } from "@radar/core";

export const DEFAULT_REJECTION_MESSAGE =
  "Mình chỉ trả lời được các câu hỏi dựa trên tin trong bản tin hiện có. Câu hỏi này nằm ngoài phạm vi đó. Bạn có thể thử hỏi về một repo, extension hoặc model đang hiển thị trên trang.";

export interface RefusalResponse {
  answerable: false;
  answer: string;
  citations: string[];
  suggestions: string[];
}

/**
 * Xây dựng câu từ chối mẫu cố định (tạo bằng code, không gọi LLM để tiết kiệm 100% token)
 */
export function buildRefusalResponse(sampleItems: SearchIndexItem[] = []): RefusalResponse {
  const suggestions: string[] = [];

  for (const item of sampleItems.slice(0, 3)) {
    if (item.category === "repo") {
      suggestions.push(`Dự án ${item.title} có điểm gì nổi bật?`);
    } else if (item.category === "extension") {
      suggestions.push(`Extension ${item.title} dùng để làm gì?`);
    } else {
      suggestions.push(`Thông tin mới nhất về ${item.title}`);
    }
  }

  if (suggestions.length === 0) {
    suggestions.push("Hôm nay có repo AI nào đang trending?");
    suggestions.push("Có extension coding AI nào mới không?");
  }

  return {
    answerable: false,
    answer: DEFAULT_REJECTION_MESSAGE,
    citations: [],
    suggestions,
  };
}
