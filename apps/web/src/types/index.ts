import type { Category, DigestFeedItem, Verdict } from "@radar/core";

export type { Category, DigestFeedItem, Verdict };

export interface DigestFeedPayload {
  digest_date: string;
  generated_at: string;
  version: string;
  items_count: number;
  items: DigestFeedItem[];
}

export type CategoryFilter = Category | "all" | "my_feed";
export type VerdictFilter = Verdict | "all";
