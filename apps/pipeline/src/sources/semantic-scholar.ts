import { z } from "zod";
import { SourceFetchError } from "../lib/errors.js";
import { logger } from "../lib/logger.js";
import type { RawItemData, SourceAdapter } from "./source.js";

const RESULTS_LIMIT = 20;
const SEARCH_QUERY = "large language model";
const S2_SEARCH_URL = "https://api.semanticscholar.org/graph/v1/paper/search";
const S2_FIELDS = "title,abstract,url,publicationDate,citationCount,externalIds,authors";
const RATE_LIMIT_DELAY_MS = 2000;

const PaperSchema = z.object({
  paperId: z.string(),
  title: z.string(),
  abstract: z.string().nullable().optional(),
  url: z.string().nullable().optional(),
  publicationDate: z.string().nullable().optional(),
  citationCount: z.number().nullable().optional(),
  authors: z.array(z.object({ name: z.string() })).optional().default([]),
});

const ResponseSchema = z.object({
  data: z.array(PaperSchema).optional().default([]),
});

export class SemanticScholarAdapter implements SourceAdapter {
  readonly key = "semantic_scholar";
  readonly name = "Semantic Scholar";

  constructor(private readonly apiKey?: string) {}

  async fetchItems(): Promise<RawItemData[]> {
    const params = new URLSearchParams({
      query: SEARCH_QUERY,
      limit: String(RESULTS_LIMIT),
      fields: S2_FIELDS,
    });
    const url = `${S2_SEARCH_URL}?${params.toString()}`;

    logger.info(`Fetching papers from Semantic Scholar: ${url}`);

    try {
      const headers: Record<string, string> = {
        "User-Agent": "AI-Tech-Radar/1.0",
        Accept: "application/json",
      };
      if (this.apiKey) {
        headers["x-api-key"] = this.apiKey;
      }

      let response = await fetch(url, {
        headers,
      });

      // Free tier is heavily rate-limited; one bounded retry avoids losing the daily batch.
      if (response.status === 429) {
        await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_DELAY_MS));
        response = await fetch(url, {
          headers,
        });
      }

      if (!response.ok) {
        throw new SourceFetchError(this.key, `HTTP ${response.status}: ${await response.text()}`);
      }

      const parsed = ResponseSchema.safeParse(await response.json());
      if (!parsed.success) {
        throw new SourceFetchError(this.key, "Invalid response schema from Semantic Scholar");
      }

      const items = parsed.data.data.map((paper) => {
        const authors = paper.authors.map((author) => author.name).filter(Boolean).join(", ");

        return {
          externalId: paper.paperId,
          category: "paper" as const,
          url: paper.url ?? `https://www.semanticscholar.org/paper/${paper.paperId}`,
          title: paper.title,
          description: paper.abstract ?? "",
          author: authors || undefined,
          publishedAt: paper.publicationDate ?? undefined,
          points: paper.citationCount ?? 0,
          rawJson: JSON.stringify(paper),
        };
      });

      logger.info(`Fetched ${items.length} papers from Semantic Scholar.`);
      return items;
    } catch (err: unknown) {
      if (err instanceof SourceFetchError) throw err;
      const message = err instanceof Error ? err.message : String(err);
      throw new SourceFetchError(this.key, message);
    }
  }
}
