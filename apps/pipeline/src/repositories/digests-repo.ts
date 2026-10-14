import type { Category, DigestFeedItem } from "@radar/core";
import type { DBAdapter } from "./db.js";

export interface DigestItemInput {
  itemId: number;
  section: Category;
  rank: number;
  score?: number;
}

export class DigestsRepository {
  constructor(private db: DBAdapter) {}

  createOrUpdateDigest(digestDate: string, status: "building" | "published" | "failed", provider?: string, model?: string, promptVersion?: string): number {
    const existing = this.db.prepare("SELECT id FROM digests WHERE digest_date = ?").get(digestDate) as { id: number } | undefined;

    if (existing) {
      this.db
        .prepare(
          `UPDATE digests
              SET status = ?, provider = COALESCE(?, provider), model = COALESCE(?, model), prompt_version = COALESCE(?, prompt_version)
            WHERE id = ?`
        )
        .run(status, provider ?? null, model ?? null, promptVersion ?? null, existing.id);
      return Number(existing.id);
    }

    const res = this.db
      .prepare(
        `INSERT INTO digests (digest_date, status, provider, model, prompt_version)
         VALUES (?, ?, ?, ?, ?)`
      )
      .run(digestDate, status, provider ?? null, model ?? null, promptVersion ?? null);

    return Number(res.lastInsertRowid);
  }

  saveDigestItems(digestId: number, items: DigestItemInput[]): void {
    this.db.transaction(() => {
      this.db.prepare("DELETE FROM digest_items WHERE digest_id = ?").run(digestId);
      const stmt = this.db.prepare(
        "INSERT INTO digest_items (digest_id, item_id, section, rank, score) VALUES (?, ?, ?, ?, ?)"
      );
      for (const item of items) {
        stmt.run(digestId, item.itemId, item.section, item.rank, item.score ?? null);
      }
    })();
  }

  getFeedByDate(digestDate: string): DigestFeedItem[] {
    const rows = this.db
      .prepare("SELECT * FROM v_digest_feed WHERE digest_date = ? ORDER BY section, rank")
      .all(digestDate) as Record<string, unknown>[];

    return rows.map((r) => ({
      digest_date: r.digest_date as string,
      section: r.section as Category,
      rank: r.rank as number,
      score: (r.score as number) ?? undefined,
      item_id: Number(r.item_id),
      key: (r.key as string) ?? undefined,
      category: r.category as Category,
      title: r.title as string,
      url: r.url as string,
      language: (r.language as string) ?? null,
      purpose: (r.purpose as string) ?? null,
      highlight: (r.highlight as string) ?? null,
      action: (r.action as string) ?? null,
      verdict: (r.verdict as any) ?? null,
      confidence: (r.confidence as any) ?? null,
      tags: (r.tags as string) ?? null,
      stars: (r.stars as number) ?? null,
    }));
  }

  startPipelineRun(trigger: "schedule" | "manual" | "local"): number {
    const res = this.db
      .prepare("INSERT INTO pipeline_runs (trigger, status) VALUES (?, 'running')")
      .run(trigger);
    return Number(res.lastInsertRowid);
  }

  finishPipelineRun(runId: number, status: "success" | "partial" | "failed", stats: { itemsFetched: number; itemsNew: number; llmRequests: number }, error?: string): void {
    this.db
      .prepare(
        `UPDATE pipeline_runs
            SET finished_at = strftime('%Y-%m-%dT%H:%M:%SZ','now'),
                status = ?,
                items_fetched = ?,
                items_new = ?,
                llm_requests = ?,
                error = ?
          WHERE id = ?`
      )
      .run(status, stats.itemsFetched, stats.itemsNew, stats.llmRequests, error ?? null, runId);
  }
}
