import { tokenizeQuery } from '@radar/core';
import type { DBAdapter } from './db.js';

export interface SearchHit {
    id: number;
    title: string;
    url: string;
    category: string;
    snippet: string;
    score: number;
}

const MIN_TOKEN_LENGTH = 2;

export function toFtsQuery(query: string): string {
    const tokens = tokenizeQuery(query).filter((token) => token.length >= MIN_TOKEN_LENGTH);
    if (tokens.length === 0) return '';
    return tokens.map((token) => `"${token.replace(/"/g, '')}"`).join(' ');
}

export class SearchRepository {
    constructor(private db: DBAdapter) {}

    search(query: string, limit = 10): SearchHit[] {
        const ftsQuery = toFtsQuery(query);
        if (!ftsQuery) return [];
        const rows = this.db
            .prepare(
                `SELECT i.id, i.title, i.url, i.category,
                        snippet(items_fts, -1, '[', ']', '...', 12) AS snippet,
                        bm25(items_fts) AS score
                   FROM items_fts
                   JOIN items i ON i.id = items_fts.rowid
                  WHERE items_fts MATCH ?
                  ORDER BY score
                  LIMIT ?`,
            )
            .all(ftsQuery, limit) as Array<{
            id: number;
            title: string;
            url: string;
            category: string;
            snippet: string;
            score: number;
        }>;
        return rows.map((row) => ({ ...row, score: Number(row.score) }));
    }
}
