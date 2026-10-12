import fs from "node:fs";
import path from "node:path";
import {
  PROMPT_VERSION,
  parseSummaries,
  type BatchItemInput,
  type LLMProvider,
  type SummaryItem,
} from "@radar/core";
import { logger } from "../../lib/logger.js";
import type { SummariesRepository } from "../../repositories/summaries-repo.js";
import type { ScoredCandidate } from "./score-items.js";

function getWorkspaceRoot(): string {
  let curr = process.cwd();
  while (curr !== path.parse(curr).root) {
    if (fs.existsSync(path.join(curr, "prompts/summarize_prompt.md"))) {
      return curr;
    }
    curr = path.dirname(curr);
  }
  return process.cwd();
}

export function loadSystemPrompt(): string {
  const promptFile = path.resolve(getWorkspaceRoot(), "prompts/summarize_prompt.md");
  if (!fs.existsSync(promptFile)) {
    throw new Error(`summarize_prompt.md not found at ${promptFile}`);
  }

  const content = fs.readFileSync(promptFile, "utf-8");
  const match = content.match(/```text([\s\S]*?)```/);
  if (!match) {
    throw new Error("Could not extract system prompt block from summarize_prompt.md");
  }

  return match[1].trim();
}

export async function summarizeCandidates(
  candidates: ScoredCandidate[],
  summariesRepo: SummariesRepository,
  llmProvider: LLMProvider,
  skipLlm: boolean = false
): Promise<{ llmRequests: number }> {
  let llmRequests = 0;
  const itemsToSummarize: ScoredCandidate[] = [];

  // Check cache first
  for (const cand of candidates) {
    const cached = summariesRepo.getCachedSummary(cand.id, "vi", PROMPT_VERSION, cand.contentHash);
    if (cached) {
      logger.info(`Found cached summary for item id=${cand.id} (${cand.title})`);
    } else {
      itemsToSummarize.push(cand);
    }
  }

  if (itemsToSummarize.length === 0 || skipLlm) {
    if (skipLlm) {
      logger.info("SKIP_LLM is enabled. Creating fallback summaries for new candidates...");
      for (const cand of itemsToSummarize) {
        const fallbackSummary: SummaryItem = {
          id: cand.id,
          purpose: cand.description.slice(0, 150) || cand.title,
          highlight: `Cập nhật mới từ nguồn ${cand.category}`,
          action: "Xem thông tin chi tiết tại liên kết nguồn",
          verdict: "watch",
          confidence: "low",
          tags: [cand.category === "repo" ? "github" : "devtools"],
        };
        summariesRepo.saveSummary({
          itemId: cand.id,
          provider: "none",
          model: "none",
          promptVersion: PROMPT_VERSION,
          contentHash: cand.contentHash,
          summary: fallbackSummary,
        });
      }
    }
    return { llmRequests: 0 };
  }

  const systemPrompt = loadSystemPrompt();
  const batchInputs: BatchItemInput[] = itemsToSummarize.map((c) => ({
    id: c.id,
    category: c.category,
    title: c.title,
    description: c.description.slice(0, 250),
    url: c.url,
    meta: {
      stars: c.stars,
      points: c.points,
      installs: c.installs,
    },
  }));

  const userPrompt = `Hãy tóm tắt các mục sau theo đúng quy tắc.\n\n${JSON.stringify({ items: batchInputs })}`;
  const expectedIds = batchInputs.map((b) => b.id);

  logger.info(`Sending ${batchInputs.length} items in batch request to LLM (${llmProvider.providerName}/${llmProvider.modelName})...`);

  let response;
  try {
    llmRequests++;
    response = await llmProvider.generateText(userPrompt, {
      systemPrompt,
      temperature: 0.2,
      jsonMode: true,
    });
  } catch (err: any) {
    logger.error(`LLM call failed: ${err.message}`);
    return { llmRequests };
  }

  try {
    const { items: parsedItems, missing } = parseSummaries(response.content, expectedIds);

    for (const itemSummary of parsedItems) {
      const cand = itemsToSummarize.find((c) => c.id === itemSummary.id);
      if (cand) {
        summariesRepo.saveSummary({
          itemId: cand.id,
          provider: response.provider,
          model: response.model,
          promptVersion: PROMPT_VERSION,
          contentHash: cand.contentHash,
          summary: itemSummary,
          tokensIn: response.tokensIn,
          tokensOut: response.tokensOut,
          rawJson: JSON.stringify(itemSummary),
        });
      }
    }

    if (missing.length > 0) {
      logger.warn(`LLM batch missing ids: ${missing.join(", ")}`);
    }
  } catch (err: any) {
    logger.error(`Failed to parse LLM summary output: ${err.message}`);
  }

  return { llmRequests };
}
