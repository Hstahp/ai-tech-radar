import type { RawItemData, SourceAdapter } from "./source.js";
import { logger } from "../lib/logger.js";
import { SourceFetchError } from "../lib/errors.js";

interface HuggingFaceAuthor {
  name: string;
}

interface HuggingFacePaper {
  id: string;
  title: string;
  summary?: string;
  authors?: HuggingFaceAuthor[];
  publishedAt?: string;
  upvotes?: number;
}

interface HuggingFacePaperEntry {
  paper?: HuggingFacePaper;
}

/**
 * Adapter thu thập các bài báo nghiên cứu AI nổi bật từ Hugging Face Daily Papers (liên kết arXiv).
 * Nguồn uy tín được cộng đồng nhà nghiên cứu quốc tế bình chọn hàng ngày.
 */
export class HuggingFacePapersAdapter implements SourceAdapter {
  readonly key = "huggingface_papers";
  readonly name = "Hugging Face Daily Papers";

  private readonly apiUrl = "https://huggingface.co/api/daily_papers";

  async fetchItems(): Promise<RawItemData[]> {
    logger.info(`Fetching top daily research papers from: ${this.apiUrl}`);

    try {
      const response = await fetch(this.apiUrl, {
        headers: {
          "User-Agent": "AI-Tech-Radar/1.0",
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new SourceFetchError(
          this.key,
          `HTTP ${response.status}: ${await response.text()}`
        );
      }

      const entries = (await response.json()) as HuggingFacePaperEntry[];
      const items: RawItemData[] = [];

      for (const entry of entries) {
        const paper = entry.paper;
        if (!paper || !paper.id || !paper.title) continue;

        // Xây dựng link bài báo: ưu tiên link bài viết chính thức trên arXiv
        const targetUrl = `https://arxiv.org/abs/${paper.id}`;

        // Trích xuất danh sách tác giả
        const authorsList = Array.isArray(paper.authors)
          ? paper.authors.map((a) => a.name).filter(Boolean)
          : [];
        const authorDisplay = authorsList.length > 0 ? authorsList.join(", ") : undefined;

        items.push({
          externalId: paper.id,
          category: "paper" as const,
          url: targetUrl,
          title: paper.title,
          description: paper.summary ?? "",
          author: authorDisplay,
          publishedAt: paper.publishedAt,
          points: paper.upvotes ?? 0,
          rawJson: JSON.stringify(entry),
        });
      }

      logger.info(`Successfully fetched ${items.length} AI research papers.`);
      return items;
    } catch (err: unknown) {
      if (err instanceof SourceFetchError) throw err;
      const message = err instanceof Error ? err.message : String(err);
      throw new SourceFetchError(this.key, message);
    }
  }
}

