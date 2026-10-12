import {
  DeepExplainSchema,
  EXPLAIN_PROMPT_VERSION,
  type DeepExplain,
  type LLMProvider,
  type SearchIndexItem,
} from "@radar/core";
import type { AppDbRepository } from "../repositories/app-db.js";
import { AppError } from "../lib/errors.js";
import { fetchSafeContent } from "./fetcher.js";

export const EXPLAIN_SYSTEM_PROMPT = `Bạn là chuyên gia phân tích công nghệ AI của AI Tech Radar. Nhiệm vụ của bạn là giải thích chuyên sâu một dự án/công cụ AI dựa trên thông tin được cung cấp.

Quy tắc bắt buộc:
1. Chỉ sử dụng thông tin có trong ngữ cảnh đầu vào. Không suy đoán, không bịa đặt tính năng hoặc lệnh cài đặt không có thật.
2. Trả lời bằng tiếng Việt chuyên nghiệp, súc tích, giữ nguyên các thuật ngữ kỹ thuật tiếng Anh.
3. Chỉ trả về MỘT đối tượng JSON hợp lệ theo schema sau:
{
  "what_it_is": "Tóm tắt bản chất cốt lõi của công nghệ trong 1-2 đoạn ngắn",
  "how_it_works": "Kiến trúc và cơ chế hoạt động bên dưới (under the hood)",
  "use_cases": ["Trường hợp sử dụng phù hợp 1", "Trường hợp sử dụng phù hợp 2"],
  "limitations": ["Điểm hạn chế / khi nào không nên dùng 1", "Điểm hạn chế 2"],
  "getting_started": "Hướng dẫn bắt đầu nhanh hoặc code snippet ngắn (chỉ khi có trong tài liệu)",
  "confidence": "high" | "medium" | "low"
}`;

export interface ExplainServiceOptions {
  appDb: AppDbRepository;
  llmProvider: LLMProvider;
  searchIndexItems: SearchIndexItem[];
  customFetch?: typeof fetch;
}

export type ExplainResult =
  | { status: "ready"; data: DeepExplain }
  | { status: "pending"; message: string };

export class ExplainService {
  constructor(private readonly options: ExplainServiceOptions) {}

  async explainItem(itemKey: string): Promise<ExplainResult> {
    // 1. Tìm mục trong search index
    const item = this.options.searchIndexItems.find((i) => i.key === itemKey);
    if (!item) {
      throw new AppError("ITEM_NOT_FOUND", `Không tìm thấy mục với khóa: ${itemKey}`, 404);
    }

    // 2. Tra cứu trong Cache/DB
    const existing = await this.options.appDb.getExplanation(itemKey);
    if (existing) {
      if (existing.status === "ready" && existing.bodyJson) {
        try {
          const parsed = JSON.parse(existing.bodyJson);
          return { status: "ready", data: parsed };
        } catch {
          // JSON hỏng thì bỏ qua, tạo lại
        }
      }
      if (existing.status === "pending" && existing.lockedUntil) {
        if (new Date() < new Date(existing.lockedUntil)) {
          return {
            status: "pending",
            message: "Hệ thống đang phân tích chi tiết, vui lòng thử lại sau vài giây.",
          };
        }
      }
    }

    // 3. Đặt khóa mềm (Soft Lock) chống 2 request đồng thời
    const contentHash = item.key;
    const lockAcquired = await this.options.appDb.createPendingExplanation(
      itemKey,
      contentHash,
      EXPLAIN_PROMPT_VERSION,
      "vi",
      60
    );

    if (!lockAcquired) {
      return {
        status: "pending",
        message: "Hệ thống đang phân tích chi tiết, vui lòng thử lại sau vài giây.",
      };
    }

    // 4. Lấy nội dung đầu vào an toàn (chống SSRF)
    let fetchedContent = "";
    if (item.url && item.url.includes("github.com")) {
      // Chuyển URL repo thành raw README nếu có thể
      const rawReadmeUrl = item.url
        .replace("github.com", "raw.githubusercontent.com")
        .concat("/main/README.md");
      fetchedContent = await fetchSafeContent(rawReadmeUrl, this.options.customFetch);
    }

    const inputContext = `
DỰ ÁN: ${item.title}
DANH MỤC: ${item.category}
MỤC ĐÍCH: ${item.purpose ?? ""}
ĐIỂM NỔI BẬT: ${item.highlight ?? ""}
THẺ TAGS: ${item.tags.join(", ")}
LIÊN KẾT: ${item.url}

NỘI DUNG TÀI LIỆU CHI TIẾT (TỐI ĐA 6000 KÝ TỰ):
${fetchedContent || "Không có thêm README, hãy phân tích dựa trên thông tin trên."}
`.trim();

    // 5. Gọi LLM Provider
    try {
      const response = await this.options.llmProvider.generateText(inputContext, {
        systemPrompt: EXPLAIN_SYSTEM_PROMPT,
        jsonMode: true,
      });

      const cleaned = response.content
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();

      const parsedJson = JSON.parse(cleaned);
      const validated = DeepExplainSchema.parse(parsedJson);

      // Lưu kết quả thành công
      await this.options.appDb.updateExplanationReady(
        itemKey,
        JSON.stringify(validated),
        this.options.llmProvider.providerName,
        this.options.llmProvider.modelName
      );

      return { status: "ready", data: validated };
    } catch (err) {
      await this.options.appDb.updateExplanationFailed(itemKey);
      throw new AppError("EXPLAIN_FAILED", "Không thể tạo bản giải thích chi tiết lúc này.", 500);
    }
  }
}
