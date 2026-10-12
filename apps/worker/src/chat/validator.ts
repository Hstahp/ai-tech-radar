import { ChatAnswerSchema, type SearchIndexItem } from "@radar/core";
import { buildRefusalResponse, type RefusalResponse } from "./guard.js";

export interface CitationDetail {
  key: string;
  title: string;
  url: string;
  category: string;
}

export interface ValidatedChatSuccess {
  answerable: true;
  answer: string;
  citations: CitationDetail[];
}

export type ValidatedChatData = ValidatedChatSuccess | RefusalResponse;

export interface ValidatedChatResult {
  isValid: boolean;
  data: ValidatedChatData;
  failureReason?: "invalid_schema" | "unanswerable" | "empty_citations" | "fabricated_citations";
}

/**
 * Xác thực câu trả lời từ LLM và kiểm tra nghiêm ngặt trích dẫn (chống hallucination)
 */
export function validateAndEnrichChatAnswer(
  rawJson: unknown,
  retrievedItems: SearchIndexItem[]
): ValidatedChatResult {
  const parseResult = ChatAnswerSchema.safeParse(rawJson);
  if (!parseResult.success) {
    return {
      isValid: false,
      data: buildRefusalResponse(retrievedItems),
      failureReason: "invalid_schema",
    };
  }

  const answer = parseResult.data;

  // 1. Nếu LLM báo không trả lời được
  if (!answer.answerable) {
    return {
      isValid: false,
      data: buildRefusalResponse(retrievedItems),
      failureReason: "unanswerable",
    };
  }

  // 2. Nếu trả lời được nhưng không có trích dẫn nào
  if (answer.citations.length === 0) {
    return {
      isValid: false,
      data: buildRefusalResponse(retrievedItems),
      failureReason: "empty_citations",
    };
  }

  // 3. Kiểm tra xem mọi citation key có thuộc tập đã retrieved hay không (chống bịa đặt)
  const itemMap = new Map<string, SearchIndexItem>();
  for (const item of retrievedItems) {
    itemMap.set(item.key, item);
  }

  const validCitationDetails: CitationDetail[] = [];
  for (const citationKey of answer.citations) {
    const matched = itemMap.get(citationKey);
    if (!matched) {
      // Có trích dẫn giả mạo không tồn tại trong ngữ cảnh được cấp -> TỪ CHỐI NGAY
      return {
        isValid: false,
        data: buildRefusalResponse(retrievedItems),
        failureReason: "fabricated_citations",
      };
    }
    validCitationDetails.push({
      key: matched.key,
      title: matched.title,
      url: matched.url,
      category: matched.category,
    });
  }

  return {
    isValid: true,
    data: {
      answerable: true,
      answer: answer.answer,
      citations: validCitationDetails,
    },
  };
}
