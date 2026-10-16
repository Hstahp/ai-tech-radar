import { Hono } from 'hono';
import { ExplainService } from './service.js';
import type { AppDbRepository } from '../repositories/app-db.js';
import type { LLMProvider, SearchIndexItem } from '@radar/core';

export interface ExplainRoutesOptions {
    appDb: AppDbRepository;
    searchIndexItems?: SearchIndexItem[];
    llmProvider?: LLMProvider;
    getSearchIndex?: (env?: unknown) => Promise<SearchIndexItem[]>;
}

export function createExplainRouter(options: ExplainRoutesOptions) {
    const router = new Hono();

    const defaultLlmProvider: LLMProvider = options.llmProvider ?? {
        providerName: 'worker-llm',
        modelName: 'mock-model',
        generateText: async () => ({
            content: JSON.stringify({
                what_it_is: 'Bản chất dự án mẫu',
                how_it_works: 'Cơ chế hoạt động chi tiết',
                use_cases: ['Trường hợp 1', 'Trường hợp 2'],
                limitations: ['Hạn chế 1'],
                getting_started: 'npm install demo',
                confidence: 'high',
            }),
            provider: 'worker-llm',
            model: 'mock-model',
        }),
    };

    router.post('/api/items/:key/explain', async (c) => {
        try {
            const key = c.req.param('key');
            const user = c.get('user');

            const defaultFallbackItems: SearchIndexItem[] = options.searchIndexItems ?? [
                {
                    key,
                    title: 'Demo AI Project',
                    category: 'repo',
                    url: 'https://github.com/demo/project',
                    tags: ['agent', 'devtools'],
                    purpose: 'Dự án thử nghiệm AI',
                    highlight: 'Tính năng nổi bật',
                },
            ];

            const dynamicItems = options.getSearchIndex
                ? await options.getSearchIndex(c.env)
                : defaultFallbackItems;
            const items = dynamicItems.length > 0 ? dynamicItems : defaultFallbackItems;

            const explainService = new ExplainService({
                appDb: options.appDb,
                llmProvider: defaultLlmProvider,
                searchIndexItems: items,
            });

            const result = await explainService.explainItem(key, user?.id ?? null);
            if (result.status === 'pending') {
                return c.json(result, 202);
            }
            return c.json(result);
        } catch (err: any) {
            if (err.statusCode) {
                return c.json({ error: { code: err.code, message: err.message } }, err.statusCode);
            }
            return c.json({ error: { code: 'INTERNAL_ERROR', message: 'Đã xảy ra lỗi hệ thống.' } }, 500);
        }
    });

    return router;
}
