import type { LLMProvider, LLMRequestOptions, LLMResponse } from "@radar/core";
import { logger } from "../lib/logger.js";
import type { SummariesRepository } from "../repositories/summaries-repo.js";

export class LLMProviderWithFallback implements LLMProvider {
  readonly providerName: string;
  readonly modelName: string;

  constructor(
    private providers: LLMProvider[],
    private summariesRepo?: SummariesRepository
  ) {
    if (providers.length === 0) {
      throw new Error("LLMProviderWithFallback requires at least one provider.");
    }
    this.providerName = providers[0].providerName;
    this.modelName = providers[0].modelName;
  }

  async generateText(prompt: string, options?: LLMRequestOptions): Promise<LLMResponse> {
    const todayStr = new Date().toISOString().split("T")[0];
    let lastError: Error | null = null;

    for (const provider of this.providers) {
      try {
        logger.info(`Attempting LLM request with provider=${provider.providerName}, model=${provider.modelName}`);
        const response = await provider.generateText(prompt, options);

        if (this.summariesRepo) {
          this.summariesRepo.recordLlmUsage(
            todayStr,
            response.provider,
            response.model,
            1,
            response.tokensIn ?? 0,
            response.tokensOut ?? 0,
            0
          );
        }

        return response;
      } catch (err: any) {
        lastError = err;
        logger.warn(`LLM Provider ${provider.providerName} failed: ${err.message}. Trying fallback...`);

        if (this.summariesRepo) {
          this.summariesRepo.recordLlmUsage(
            todayStr,
            provider.providerName,
            provider.modelName,
            1,
            0,
            0,
            1
          );
        }
      }
    }

    throw new Error(`All LLM providers failed. Last error: ${lastError?.message}`);
  }
}
