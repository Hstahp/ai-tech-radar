import type { LLMProvider, LLMRequestOptions, LLMResponse } from "@radar/core";
import { logger } from "../lib/logger.js";
import { LlmValidationError } from "../lib/errors.js";

export class GroqProvider implements LLMProvider {
  readonly providerName = "groq";

  constructor(
    public readonly modelName: string,
    private apiKey?: string
  ) {}

  async generateText(prompt: string, options?: LLMRequestOptions): Promise<LLMResponse> {
    if (!this.apiKey) {
      throw new LlmValidationError("GROQ_API_KEY is not configured.");
    }

    const url = "https://api.groq.com/openai/v1/chat/completions";
    logger.info(`Calling Groq API model=${this.modelName}`);

    const messages: Array<{ role: string; content: string }> = [];
    if (options?.systemPrompt) {
      messages.push({ role: "system", content: options.systemPrompt });
    }
    messages.push({ role: "user", content: prompt });

    const payload: Record<string, unknown> = {
      model: this.modelName,
      messages,
      temperature: options?.temperature ?? 0.2,
    };

    if (options?.jsonMode) {
      payload.response_format = { type: "json_object" };
    }

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new LlmValidationError(`Groq API error [${res.status}]: ${errText}`);
    }

    const data = (await res.json()) as any;
    const choice = data.choices?.[0];
    const contentText = choice?.message?.content;

    if (!contentText) {
      throw new LlmValidationError("Groq returned empty response content.");
    }

    const usage = data.usage;

    return {
      content: contentText,
      provider: this.providerName,
      model: this.modelName,
      tokensIn: usage?.prompt_tokens,
      tokensOut: usage?.completion_tokens,
    };
  }
}
