import { z } from "zod";
import { SourceFetchError } from "../lib/errors.js";
import { logger } from "../lib/logger.js";
import type { RawItemData, SourceAdapter } from "./source.js";

const RESULTS_LIMIT = 20;
const RECENT_YEARS = 2;
const SEARCH_QUERY = "large language model";
const OPENALEX_BASE_URL = "https://api.openalex.org/works";

const WorkSchema = z.object({
  id: z.string(),
  title: z.string().nullable().optional(),
  publication_date: z.string().nullable().optional(),
  cited_by_count: z.number().optional().default(0),
  doi: z.string().nullable().optional(),
  primary_location: z
    .object({ landing_page_url: z.string().nullable().optional() })
    .nullable()
    .optional(),
  abstract_inverted_index: z.record(z.array(z.number())).nullable().optional(),
  authorships: z
    .array(z.object({ author: z.object({ display_name: z.string().optional() }).optional() }))
    .optional()
    .default([]),
});

const ResponseSchema = z.object({
  results: z.array(WorkSchema).optional().default([]),
});

export function reconstructAbstract(
  index: Record<string, number[]> | null | undefined
): string {
  if (!index) return "";

  const positions = Object.values(index);
  if (positions.length === 0) return "";

  const maxPosition = Math.max(...positions.flat());
  const words = new Array<string>(maxPosition + 1).fill("");

  for (const [word, wordPositions] of Object.entries(index)) {
    for (const position of wordPositions) {
      words[position] = word;
    }
  }

  return words.join(" ").trim();
}

export class OpenAlexAdapter implements SourceAdapter {
  readonly key = "openalex";
  readonly name = "OpenAlex";

  async fetchItems(): Promise<RawItemData[]> {
    const fromDate = `${new Date().getFullYear() - RECENT_YEARS}-01-01`;
    const params = new URLSearchParams({
      search: SEARCH_QUERY,
      filter: `from_publication_date:${fromDate}`,
      sort: "cited_by_count:desc",
      "per-page": String(RESULTS_LIMIT),
    });
    const url = `${OPENALEX_BASE_URL}?${params.toString()}`;

    logger.info(`Fetching papers from OpenAlex: ${url}`);

    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "AI-Tech-Radar/1.0",
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new SourceFetchError(this.key, `HTTP ${response.status}: ${await response.text()}`);
      }

      const parsed = ResponseSchema.safeParse(await response.json());
      if (!parsed.success) {
        throw new SourceFetchError(this.key, "Invalid response schema from OpenAlex");
      }

      const items = parsed.data.results.map((work) => {
        const authors = work.authorships
          .map((authorship) => authorship.author?.display_name)
          .filter((name): name is string => Boolean(name))
          .join(", ");
        const abstract = reconstructAbstract(work.abstract_inverted_index);

        return {
          externalId: work.id.replace("https://openalex.org/", ""),
          category: "paper" as const,
          url: work.primary_location?.landing_page_url ?? work.doi ?? work.id,
          title: work.title ?? "Untitled work",
          description: abstract.slice(0, 500),
          author: authors || undefined,
          publishedAt: work.publication_date ?? undefined,
          points: work.cited_by_count,
          rawJson: JSON.stringify(work),
        };
      });

      logger.info(`Fetched ${items.length} papers from OpenAlex.`);
      return items;
    } catch (err: unknown) {
      if (err instanceof SourceFetchError) throw err;
      const message = err instanceof Error ? err.message : String(err);
      throw new SourceFetchError(this.key, message);
    }
  }
}
