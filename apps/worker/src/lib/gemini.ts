import type { LLMProvider, LLMRequestOptions, LLMResponse } from '@radar/core';

export class WorkerGeminiProvider implements LLMProvider {
    readonly providerName = 'gemini';

    constructor(
        public readonly modelName: string,
        private apiKey?: string,
    ) {}

    async generateText(prompt: string, options?: LLMRequestOptions): Promise<LLMResponse> {
        if (!this.apiKey) {
            throw new Error('GEMINI_API_KEY is not configured on Cloudflare Worker.');
        }

        const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.modelName}:generateContent?key=${this.apiKey}`;

        const contents = [];
        if (options?.systemPrompt) {
            contents.push({
                role: 'user',
                parts: [{ text: `[SYSTEM INSTRUCTION]\n${options.systemPrompt}\n\n[USER TASK]\n${prompt}` }],
            });
        } else {
            contents.push({
                role: 'user',
                parts: [{ text: prompt }],
            });
        }

        const payload: Record<string, unknown> = {
            contents,
            generationConfig: {
                temperature: options?.temperature ?? 0.2,
            },
        };

        if (options?.jsonMode) {
            (payload.generationConfig as Record<string, unknown>).responseMimeType = 'application/json';
        }

        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!res.ok) {
            const errText = await res.text();
            throw new Error(`Gemini API error [${res.status}]: ${errText}`);
        }

        const data = (await res.json()) as any;
        const candidate = data.candidates?.[0];
        const contentText = candidate?.content?.parts?.[0]?.text;

        if (!contentText) {
            throw new Error('Gemini returned empty candidate response.');
        }

        const usage = data.usageMetadata;

        return {
            content: contentText,
            provider: this.providerName,
            model: this.modelName,
            tokensIn: usage?.promptTokenCount,
            tokensOut: usage?.candidatesTokenCount,
        };
    }
}
