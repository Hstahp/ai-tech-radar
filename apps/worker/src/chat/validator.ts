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

  // 2. Lấy danh sách trích dẫn hoặc tự động gán mục liên quan nhất nếu LLM quên đính kèm
  const citationsToValidate =
    answer.citations.length > 0
      ? answer.citations
      : retrievedItems.length > 0
      ? [retrievedItems[0].key]
      : [];

  if (citationsToValidate.length === 0) {
    return {
      isValid: false,
      data: buildRefusalResponse(retrievedItems),
      failureReason: "empty_citations",
    };
  }

  // 3. Kiểm tra xem citation key có thuộc tập đã retrieved hay không (chống bịa đặt)
  const itemMap = new Map<string, SearchIndexItem>();
  for (const item of retrievedItems) {
    itemMap.set(item.key, item);
  }

  const validCitationDetails: CitationDetail[] = [];
  for (const citationKey of citationsToValidate) {
    let matched = itemMap.get(citationKey);
    if (!matched) {
      // Hỗ trợ nếu LLM trích dẫn theo tên tiêu đề thay vì numeric key
      matched = retrievedItems.find(
        (it) =>
          it.key === citationKey ||
          it.title.toLowerCase().includes(citationKey.toLowerCase()) ||
          citationKey.toLowerCase().includes(it.title.toLowerCase())
      );
    }

    if (matched && !validCitationDetails.some((c) => c.key === matched.key)) {
      validCitationDetails.push({
        key: matched.key,
        title: matched.title,
        url: matched.url,
        category: matched.category,
      });
    }
  }

  if (validCitationDetails.length === 0) {
    return {
      isValid: false,
      data: buildRefusalResponse(retrievedItems),
      failureReason: "fabricated_citations",
    };
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
