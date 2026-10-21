import type { SearchIndexItem } from "@radar/core";

export const CHAT_SYSTEM_PROMPT = `Bạn là trợ lý AI thông minh của AI Tech Radar (bản tin công nghệ và hệ sinh thái AI dành cho lập trình viên).
Nhiệm vụ của bạn là giải đáp thắc mắc, tóm tắt và hướng dẫn người dùng về các công cụ, repo, extension, model và bài báo AI có trong NGỮ CẢNH dưới đây.

Quy tắc:
1. Trả lời bằng tiếng Việt, súc tích, chuyên nghiệp và hữu ích cho lập trình viên (tối đa ~150-200 từ). Giữ nguyên tên riêng và thuật ngữ kỹ thuật tiếng Anh.
2. Khi người dùng hỏi về bất kỳ công cụ hoặc chủ đề nào xuất hiện trong danh sách NGỮ CẢNH, hãy tổng hợp dựa vào tiêu đề, đường dẫn url, danh mục, mục đích, highlight và tags của mục đó để trả lời.
3. Trong mảng "citations", hãy đính kèm "key" của các mục trong ngữ cảnh mà bạn đã tham khảo (ví dụ: ["165"]).
4. Chỉ đặt "answerable": false và answer rỗng khi câu hỏi hoàn toàn không liên quan gì đến các công cụ công nghệ/AI trong ngữ cảnh (ví dụ: hỏi thời tiết, nấu ăn, chuyện phiếm cá nhân).
5. Luôn trả về ĐÚNG MỘT đối tượng JSON theo schema:
{"answerable": true, "answer": "Nội dung trả lời...", "citations": ["key_1"]}`;

/**
 * Định dạng các mục được truy xuất thành ngữ cảnh ngắn gọn gửi cho LLM
 */
export function buildContextString(items: SearchIndexItem[]): string {
  const contextItems = items.map((item) => ({
    key: item.key,
    title: item.title,
    category: item.category,
    url: item.url,
    purpose: item.purpose ?? "",
    highlight: item.highlight ?? "",
    tags: item.tags,
    stars: item.stars ?? undefined,
  }));

  return JSON.stringify(contextItems, null, 2);
}

/**
 * Xây dựng user prompt kết hợp giữa ngữ cảnh và câu hỏi người dùng
 */
export function buildChatUserPrompt(question: string, contextItems: SearchIndexItem[]): string {
  const context = buildContextString(contextItems);
  return `=== NGỮ CẢNH BẢN TIN ===\n${context}\n\n=== CÂU HỎI CỦA NGƯỜI DÙNG ===\n${question}`;
}
