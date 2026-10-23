import { Hono } from 'hono';
import type { AppDbRepository } from '../repositories/app-db.js';
import { AppError } from '../lib/errors.js';
import type { ActiveTagsResponse } from '@radar/core';

export interface InternalEnv {
    PIPELINE_TOKEN?: string;
}

export interface InternalRouterOptions {
    appDb: AppDbRepository;
}

export function createInternalRouter(options: InternalRouterOptions) {
    const router = new Hono<{ Bindings: InternalEnv }>();

    router.get('/active-tags', async (c) => {
        const pipelineToken = c.env?.PIPELINE_TOKEN;
        if (!pipelineToken) {
            throw new AppError(
                'SERVER_MISCONFIGURED',
                'PIPELINE_TOKEN chua duoc cau hinh tren Worker.',
                500,
            );
        }

        const authHeader = c.req.header('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new AppError(
                'UNAUTHORIZED',
                'Thieu header Authorization Bearer PIPELINE_TOKEN.',
                401,
            );
        }

        const token = authHeader.slice(7).trim();
        if (token !== pipelineToken) {
            throw new AppError(
                'UNAUTHORIZED',
                'PIPELINE_TOKEN khong hop le.',
                401,
            );
        }

        const tags = await options.appDb.getActiveTags();

        const response: ActiveTagsResponse = {
            tags,
            hiddenKeys: [],
            generatedAt: new Date().toISOString(),
        };

        return c.json(response);
    });

    return router;
}
