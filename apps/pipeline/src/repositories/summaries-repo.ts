import type { SummaryItem, Tag } from "@radar/core";
import type { DBAdapter } from "./db.js";

export interface SaveSummaryInput {
  itemId: number;
  lang?: string;
  provider: string;
  model: string;
  promptVersion: string;
  contentHash: string;
  summary: SummaryItem;
  tokensIn?: number;
  tokensOut?: number;
  rawJson?: string;
}

export class SummariesRepository {
  constructor(private db: DBAdapter) {}

  getCachedSummary(itemId: number, lang: string, promptVersion: string, contentHash: string): SummaryItem | null {
    const row = this.db
      .prepare(
        `SELECT purpose, highlight, action, verdict, confidence
           FROM summaries
          WHERE item_id = ? AND lang = ? AND prompt_version = ? AND content_hash = ?`
      )
      .get(itemId, lang, promptVersion, contentHash) as Record<string, unknown> | undefined;

    if (!row) return null;

    const tagRows = this.db
      .prepare(
        `SELECT t.slug FROM item_tags it JOIN tags t ON t.id = it.tag_id WHERE it.item_id = ?`
      )
      .all(itemId) as Array<{ slug: string }>;

    return {
      id: itemId,
      purpose: row.purpose as string,
      highlight: row.highlight as string,
      action: row.action as string,
      verdict: row.verdict as any,
      confidence: row.confidence as any,
      tags: tagRows.map((tr) => tr.slug as Tag),
    };
  }

  saveSummary(input: SaveSummaryInput): void {
    const lang = input.lang ?? "vi";

    this.db.transaction(() => {
      this.db
        .prepare(
          `INSERT INTO summaries (
            item_id, lang, provider, model, prompt_version, content_hash,
            purpose, highlight, action, verdict, confidence, raw_json, tokens_in, tokens_out
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(item_id, lang, prompt_version, content_hash) DO UPDATE SET
            purpose = excluded.purpose,
            highlight = excluded.highlight,
            action = excluded.action,
            verdict = excluded.verdict,
            confidence = excluded.confidence,
            raw_json = excluded.raw_json,
            tokens_in = excluded.tokens_in,
            tokens_out = excluded.tokens_out`
        )
        .run(
          input.itemId,
          lang,
          input.provider,
          input.model,
          input.promptVersion,
          input.contentHash,
          input.summary.purpose,
          input.summary.highlight,
          input.summary.action,
          input.summary.verdict,
          input.summary.confidence,
          input.rawJson ?? null,
          input.tokensIn ?? null,
          input.tokensOut ?? null
        );

      // Attach tags
      for (const tagSlug of input.summary.tags) {
        const tagRow = this.db.prepare("SELECT id FROM tags WHERE slug = ?").get(tagSlug) as { id: number } | undefined;
        if (tagRow) {
          this.db
            .prepare("INSERT OR IGNORE INTO item_tags (item_id, tag_id) VALUES (?, ?)")
            .run(input.itemId, tagRow.id);
        }
      }
    })();
  }

  recordLlmUsage(usageDate: string, provider: string, model: string, requests: number, tokensIn: number, tokensOut: number, errors: number): void {
    this.db
      .prepare(
        `INSERT INTO llm_usage (usage_date, provider, model, requests, tokens_in, tokens_out, errors)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(usage_date, provider, model) DO UPDATE SET
           requests = requests + excluded.requests,
           tokens_in = tokens_in + excluded.tokens_in,
           tokens_out = tokens_out + excluded.tokens_out,
           errors = errors + excluded.errors`
      )
      .run(usageDate, provider, model, requests, tokensIn, tokensOut, errors);
  }
}
