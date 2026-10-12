import type { LLMProvider, LLMRequestOptions, LLMResponse } from "@radar/core";
import { logger } from "../lib/logger.js";
import { LlmValidationError } from "../lib/errors.js";

export class OllamaProvider implements LLMProvider {
  readonly providerName = "ollama";

  constructor(
    public readonly modelName: string = "llama3.2",
    private baseUrl: string = "http://localhost:11434"
  ) {}

  async generateText(prompt: string, options?: LLMRequestOptions): Promise<LLMResponse> {
    const url = `${this.baseUrl}/api/generate`;
    logger.info(`Calling Ollama API model=${this.modelName}`);

    const payload: Record<string, unknown> = {
      model: this.modelName,
      prompt,
      system: options?.systemPrompt,
      stream: false,
      options: {
        temperature: options?.temperature ?? 0.2,
      },
    };

    if (options?.jsonMode) {
      payload.format = "json";
    }

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new LlmValidationError(`Ollama API error [${res.status}]: ${errText}`);
    }

    const data = (await res.json()) as any;
    if (!data.response) {
      throw new LlmValidationError("Ollama returned empty response.");
    }

    return {
      content: data.response,
      provider: this.providerName,
      model: this.modelName,
      tokensIn: data.prompt_eval_count,
      tokensOut: data.eval_count,
    };
  }
}
