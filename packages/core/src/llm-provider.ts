export interface LLMRequestOptions {
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
  systemPrompt?: string;
}

export interface LLMResponse {
  content: string;
  provider: string;
  model: string;
  tokensIn?: number;
  tokensOut?: number;
}

export interface LLMUsageRecord {
  usageDate: string;
  provider: string;
  model: string;
  requests: number;
  tokensIn: number;
  tokensOut: number;
  errors: number;
}

export interface LLMProvider {
  readonly providerName: string;
  readonly modelName: string;
  generateText(prompt: string, options?: LLMRequestOptions): Promise<LLMResponse>;
}
