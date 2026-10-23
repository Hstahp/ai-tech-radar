import { TAGS, ActiveTagsResponseSchema, type ActiveTagItem } from '@radar/core';
import { logger } from './logger.js';

export interface FetchActiveTagsOptions {
    workerUrl?: string;
    pipelineToken?: string;
    timeoutMs?: number;
}

export interface ActiveTagsResult {
    tags: ActiveTagItem[];
    hiddenKeys: Set<string>;
    source: 'worker' | 'fallback';
}

const DEFAULT_TIMEOUT_MS = 10_000;

function createDefaultFallback(): ActiveTagsResult {
    return {
        tags: TAGS.map((slug) => ({ slug, maxItems: 10 })),
        hiddenKeys: new Set<string>(),
        source: 'fallback',
    };
}

/**
 * Lấy danh sách tag đang hoạt động từ Cloudflare Worker API.
 * Tuân thủ nguyên tắc fail-safe: KHÔNG BAO GIỜ throw error làm dừng pipeline,
 * tự động fallback về danh sách tag mặc định nếu lỗi hoặc timeout.
 */
export async function fetchActiveTags(options: FetchActiveTagsOptions): Promise<ActiveTagsResult> {
    const { workerUrl, pipelineToken, timeoutMs = DEFAULT_TIMEOUT_MS } = options;

    if (!workerUrl || !pipelineToken) {
        logger.info(
            '[ACTIVE_TAGS] Chưa cấu hình WORKER_API_URL hoặc PIPELINE_TOKEN, sử dụng danh sách tag hệ thống mặc định.',
        );
        return createDefaultFallback();
    }

    const endpoint = `${workerUrl.replace(/\/+$/, '')}/internal/active-tags`;

    try {
        logger.info(`[ACTIVE_TAGS] Đang đồng bộ tag hoạt động từ Worker: ${endpoint}`);

        const response = await fetch(endpoint, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${pipelineToken}`,
                Accept: 'application/json',
            },
            signal: AbortSignal.timeout(timeoutMs),
        });

        if (!response.ok) {
            logger.warn(
                `[ACTIVE_TAGS] Worker endpoint trả mã lỗi HTTP ${response.status}, tự động fallback về tag mặc định.`,
            );
            return createDefaultFallback();
        }

        const data = await response.json();
        const parsed = ActiveTagsResponseSchema.safeParse(data);

        if (!parsed.success) {
            logger.warn(
                '[ACTIVE_TAGS] Phản hồi từ Worker không đúng schema ActiveTagsResponseSchema, tự động fallback.',
                { errors: parsed.error.issues },
            );
            return createDefaultFallback();
        }

        logger.info(
            `[ACTIVE_TAGS] Đồng bộ thành công ${parsed.data.tags.length} tag hoạt động từ Worker.`,
        );

        return {
            tags: parsed.data.tags,
            hiddenKeys: new Set(parsed.data.hiddenKeys ?? []),
            source: 'worker',
        };
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        logger.warn(
            `[ACTIVE_TAGS] Lỗi mạng hoặc quá thời gian (${timeoutMs}ms) khi gọi Worker: ${message}. Tự động fallback về tag mặc định.`,
        );
        return createDefaultFallback();
    }
}
