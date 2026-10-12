import type { Category } from "@radar/core";
import type { DBAdapter } from "./db.js";

export interface ItemRow {
  id: number;
  sourceId: number;
  externalId: string;
  category: Category;
  url: string;
  urlHash: string;
  title: string;
  description?: string;
  author?: string;
  programmingLanguage?: string;
  license?: string;
  publishedAt?: string;
  firstSeenAt: string;
  lastSeenAt: string;
  contentHash: string;
  status: string;
}

export interface MetricInput {
  itemId: number;
  date: string;
  stars?: number;
  forks?: number;
  openIssues?: number;
  points?: number;
  comments?: number;
  installs?: number;
  rating?: number;
  ratingCount?: number;
}

export interface NewItemInput {
  sourceKey: string;
  externalId: string;
  category: Category;
  url: string;
  urlHash: string;
  title: string;
  description?: string;
  author?: string;
  programmingLanguage?: string;
  license?: string;
  publishedAt?: string;
  contentHash: string;
  rawJson?: string;
}

export class ItemsRepository {
  constructor(private db: DBAdapter) {}

  getSourceIdByKey(sourceKey: string): number | null {
    const row = this.db.prepare("SELECT id FROM sources WHERE key = ?").get(sourceKey) as { id: number } | undefined;
    return row?.id ?? null;
  }

  upsertItem(input: NewItemInput): { id: number; isNew: boolean } {
    const sourceId = this.getSourceIdByKey(input.sourceKey);
    if (!sourceId) {
      throw new Error(`Source key not found in database: ${input.sourceKey}`);
    }

    const existing = this.db
      .prepare("SELECT id FROM items WHERE url_hash = ?")
      .get(input.urlHash) as { id: number } | undefined;

    if (existing) {
      this.db
        .prepare(
          `UPDATE items
              SET title = ?,
                  description = COALESCE(?, description),
                  last_seen_at = strftime('%Y-%m-%dT%H:%M:%SZ','now'),
                  content_hash = ?
            WHERE id = ?`
        )
        .run(input.title, input.description ?? null, input.contentHash, existing.id);

      return { id: Number(existing.id), isNew: false };
    }

    const result = this.db
      .prepare(
        `INSERT INTO items (
          source_id, external_id, category, url, url_hash, title,
          description, author, programming_language, license,
          published_at, content_hash, raw_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        sourceId,
        input.externalId,
        input.category,
        input.url,
        input.urlHash,
        input.title,
        input.description ?? null,
        input.author ?? null,
        input.programmingLanguage ?? null,
        input.license ?? null,
        input.publishedAt ?? null,
        input.contentHash,
        input.rawJson ?? null
      );

    return { id: Number(result.lastInsertRowid), isNew: true };
  }

  recordMetrics(metric: MetricInput): void {
    this.db
      .prepare(
        `INSERT INTO metrics (item_id, date, stars, forks, open_issues, points, comments, installs, rating, rating_count)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(item_id, date) DO UPDATE SET
           stars = COALESCE(excluded.stars, stars),
           forks = COALESCE(excluded.forks, forks),
           open_issues = COALESCE(excluded.open_issues, open_issues),
           points = COALESCE(excluded.points, points),
           comments = COALESCE(excluded.comments, comments),
           installs = COALESCE(excluded.installs, installs),
           rating = COALESCE(excluded.rating, rating),
           rating_count = COALESCE(excluded.rating_count, rating_count)`
      )
      .run(
        metric.itemId,
        metric.date,
        metric.stars ?? null,
        metric.forks ?? null,
        metric.openIssues ?? null,
        metric.points ?? null,
        metric.comments ?? null,
        metric.installs ?? null,
        metric.rating ?? null,
        metric.ratingCount ?? null
      );
  }

  getItemById(id: number): ItemRow | null {
    const row = this.db.prepare("SELECT * FROM items WHERE id = ?").get(id) as Record<string, unknown> | undefined;
    if (!row) return null;
    return this.mapRowToDomain(row);
  }

  private mapRowToDomain(row: Record<string, unknown>): ItemRow {
    return {
      id: row.id as number,
      sourceId: row.source_id as number,
      externalId: row.external_id as string,
      category: row.category as Category,
      url: row.url as string,
      urlHash: row.url_hash as string,
      title: row.title as string,
      description: (row.description as string) ?? undefined,
      author: (row.author as string) ?? undefined,
      programmingLanguage: (row.programming_language as string) ?? undefined,
      license: (row.license as string) ?? undefined,
      publishedAt: (row.published_at as string) ?? undefined,
      firstSeenAt: row.first_seen_at as string,
      lastSeenAt: row.last_seen_at as string,
      contentHash: row.content_hash as string,
      status: row.status as string,
    };
  }
}
