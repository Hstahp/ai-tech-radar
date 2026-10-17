import { Hono } from 'hono';
import { hashIp } from '../lib/hash.js';
import { ChatService } from './service.js';
import type { AppDbRepository } from '../repositories/app-db.js';
import type { LLMProvider, SearchIndexItem } from '@radar/core';

import { WorkerGeminiProvider } from '../lib/gemini.js';

export interface ChatRoutesOptions {
    appDb: AppDbRepository;
    searchIndexItems?: SearchIndexItem[];
    llmProvider?: LLMProvider;
    getSearchIndex?: (env?: unknown) => Promise<SearchIndexItem[]>;
}

export function createChatRouter(options: ChatRoutesOptions) {
    const router = new Hono();

    // LLM Provider mặc định hoặc mock
    const defaultLlmProvider: LLMProvider = options.llmProvider ?? {
        providerName: 'worker-llm',
        modelName: 'mock-model',
        generateText: async () => ({
            content: JSON.stringify({
                answerable: true,
                answer: 'Đây là câu trả lời mẫu dựa trên tin tức trong ngày.',
                citations: ['demo_key'],
            }),
            provider: 'worker-llm',
            model: 'mock-model',
        }),
    };

    const defaultItems: SearchIndexItem[] = options.searchIndexItems ?? [
        {
            key: 'demo_key',
            title: 'Demo AI Project',
            category: 'repo',
            url: 'https://github.com/demo/project',
            tags: ['agent', 'devtools'],
            purpose: 'Dự án thử nghiệm AI',
            highlight: 'Tính năng nổi bật',
        },
    ];

    router.post('/api/chat', async (c) => {
        try {
            const body = await c.req.json<{ question?: string }>();
            if (!body || !body.question) {
                return c.json({ error: { code: 'BAD_REQUEST', message: "Thiếu trường 'question'." } }, 400);
            }

            const clientIp = c.req.header('cf-connecting-ip') ?? c.req.header('x-forwarded-for') ?? '127.0.0.1';
            const anonHash = await hashIp(clientIp);
            const user = c.get('user');

            const dynamicItems = options.getSearchIndex
                ? await options.getSearchIndex(c.env)
                : (options.searchIndexItems ?? defaultItems);
            const activeItems = dynamicItems.length > 0 ? dynamicItems : defaultItems;

            const env = c.env as { GEMINI_API_KEY?: string } | undefined;
            const activeLlm = options.llmProvider ?? (
                env?.GEMINI_API_KEY
                    ? new WorkerGeminiProvider('gemini-2.5-flash', env.GEMINI_API_KEY)
                    : defaultLlmProvider
            );

            const chatService = new ChatService({
                appDb: options.appDb,
                llmProvider: activeLlm,
                searchIndexItems: activeItems,
                digestDate: new Date().toISOString().split('T')[0],
            });

            const result = await chatService.processQuestion({
                question: body.question,
                anonHash,
                userId: user?.id ?? null,
            });

            return c.json(result);
        } catch (err: any) {
            console.error('[CHAT_ERROR]', err);
            if (err.statusCode) {
                return c.json({ error: { code: err.code, message: err.message } }, err.statusCode);
            }
            return c.json({ error: { code: 'INTERNAL_ERROR', message: err?.message ?? 'Đã xảy ra lỗi hệ thống.' } }, 500);
        }
    });

    return router;
}
