import type { RawItemData, SourceAdapter } from "./source.js";
import { logger } from "../lib/logger.js";
import { SourceFetchError } from "../lib/errors.js";

export class GitHubSearchAdapter implements SourceAdapter {
  readonly key = "github_search";
  readonly name = "GitHub Search API";

  constructor(private apiToken?: string) {}

  async fetchItems(): Promise<RawItemData[]> {
    const today = new Date();
    const pastDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const query = `ai OR llm OR mcp OR agent created:>${pastDate}`;
    const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=30`;

    logger.info(`Fetching GitHub repos: ${url}`);
    const headers: Record<string, string> = {
      "User-Agent": "AI-Tech-Radar/1.0",
      Accept: "application/vnd.github.v3+json",
    };
    if (this.apiToken) {
      headers.Authorization = `token ${this.apiToken}`;
    }

    try {
      const res = await fetch(url, { headers });
      if (!res.ok) {
        throw new SourceFetchError(this.key, `HTTP ${res.status}: ${await res.text()}`);
      }

      const data = (await res.json()) as any;
      const items: RawItemData[] = (data.items || []).map((repo: any) => ({
        externalId: repo.full_name,
        category: "repo" as const,
        url: repo.html_url,
        title: repo.full_name,
        description: repo.description ?? "",
        author: repo.owner?.login,
        programmingLanguage: repo.language ?? undefined,
        license: repo.license?.spdx_id ?? undefined,
        publishedAt: repo.created_at,
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        rawJson: JSON.stringify(repo),
      }));

      return items;
    } catch (err: any) {
      if (err instanceof SourceFetchError) throw err;
      throw new SourceFetchError(this.key, err.message);
    }
  }
}
