import type { Category } from "@radar/core";

export interface RawItemData {
  externalId: string;
  category: Category;
  url: string;
  title: string;
  description?: string;
  author?: string;
  programmingLanguage?: string;
  license?: string;
  publishedAt?: string;
  stars?: number;
  forks?: number;
  points?: number;
  comments?: number;
  installs?: number;
  rating?: number;
  rawJson?: string;
}

export interface SourceAdapter {
  readonly key: string;
  readonly name: string;
  fetchItems(): Promise<RawItemData[]>;
}
