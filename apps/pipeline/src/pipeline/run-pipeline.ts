import { loadConfig, type PipelineConfig } from "../config.js";
import { logger } from "../lib/logger.js";
import { GeminiProvider } from "../llm/gemini.js";
import { GroqProvider } from "../llm/groq.js";
import { OllamaProvider } from "../llm/ollama.js";
import { LLMProviderWithFallback } from "../llm/with-fallback.js";
import { runMigrations } from "../cli/db-migrate.js";
import { openDatabase } from "../repositories/db.js";
import { DigestsRepository } from "../repositories/digests-repo.js";
import { ItemsRepository } from "../repositories/items-repo.js";
import { SummariesRepository } from "../repositories/summaries-repo.js";
import { GitHubSearchAdapter } from "../sources/github-search.js";
import { HackerNewsAdapter } from "../sources/hacker-news.js";
import type { SourceAdapter } from "../sources/source.js";
import { fetchAllSources } from "./steps/fetch-items.js";
import { publishAndExportDigest } from "./steps/export-digest.js";
import { scoreAndSelectCandidates } from "./steps/score-items.js";
import { summarizeCandidates } from "./steps/summarize-items.js";

export async function runPipeline(overrides?: Partial<PipelineConfig>): Promise<void> {
  const config = loadConfig(overrides);
  logger.info("Starting AI Tech Radar pipeline execution...", {
    db: config.DB_FILE,
    dryRun: config.DRY_RUN,
    skipLlm: config.SKIP_LLM,
  });

  // Ensure DB schema is applied
  runMigrations(config.DB_FILE);

  const db = openDatabase(config.DB_FILE);
  const itemsRepo = new ItemsRepository(db);
  const summariesRepo = new SummariesRepository(db);
  const digestsRepo = new DigestsRepository(db);

  const runId = digestsRepo.startPipelineRun("schedule");
  const todayStr = new Date().toISOString().split("T")[0];

  try {
    // 1. Prepare sources
    const sources: SourceAdapter[] = [
      new GitHubSearchAdapter(config.GITHUB_API_TOKEN),
      new HackerNewsAdapter(),
    ];

    // 2. Fetch step
    logger.info("--- Step 1: Fetching items from sources ---");
    const { itemsFetched, itemsNew } = await fetchAllSources(sources, itemsRepo, todayStr);
    logger.info(`Fetch complete: ${itemsFetched} items fetched, ${itemsNew} new items saved.`);

    // 3. Score step
    logger.info("--- Step 2: Scoring and selecting top candidates ---");
    const candidates = scoreAndSelectCandidates(db, todayStr, 5);
    logger.info(`Selection complete: ${candidates.length} candidate items selected.`);

    // 4. LLM Providers setup
    const llmProviders = [];
    if (config.GEMINI_API_KEY) {
      llmProviders.push(new GeminiProvider(config.LLM_PRIMARY_MODEL, config.GEMINI_API_KEY));
    }
    if (config.GROQ_API_KEY) {
      llmProviders.push(new GroqProvider(config.LLM_FALLBACK_MODEL, config.GROQ_API_KEY));
    }
    llmProviders.push(new OllamaProvider()); // Local fallback

    const fallbackLlm = new LLMProviderWithFallback(llmProviders, summariesRepo);

    // 5. Summarize step
    logger.info("--- Step 3: Summarizing candidates with LLM ---");
    const { llmRequests } = await summarizeCandidates(candidates, summariesRepo, fallbackLlm, config.SKIP_LLM);
    logger.info(`Summarization complete: ${llmRequests} LLM API requests made.`);

    // 6. Export step
    if (!config.DRY_RUN) {
      logger.info("--- Step 4: Exporting digest feed ---");
      publishAndExportDigest(
        digestsRepo,
        todayStr,
        candidates,
        config.EXPORT_DIR,
        fallbackLlm.providerName,
        fallbackLlm.modelName
      );
    } else {
      logger.info("DRY_RUN mode active. Skipping digest publication and JSON export.");
    }

    digestsRepo.finishPipelineRun(runId, "success", {
      itemsFetched,
      itemsNew,
      llmRequests,
    });
    logger.info("Pipeline completed successfully.");
  } catch (err: any) {
    logger.error(`Pipeline failed with error: ${err.message}`);
    digestsRepo.finishPipelineRun(runId, "failed", { itemsFetched: 0, itemsNew: 0, llmRequests: 0 }, err.message);
    throw err;
  } finally {
    db.close();
  }
}
