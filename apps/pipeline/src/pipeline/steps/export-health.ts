import fs from "node:fs";
import path from "node:path";
import { logger } from "../../lib/logger.js";
import type { DBAdapter } from "../../repositories/db.js";

export interface HealthSourceStat {
  key: string;
  fetched: number;
  error?: string;
}

export interface HealthRun {
  id: number;
  trigger: string;
  status: string;
  started_at: string;
  finished_at: string | null;
  items_fetched: number;
  items_new: number;
  llm_requests: number;
  error: string | null;
  sources: HealthSourceStat[];
}

export interface HealthLlmUsage {
  usage_date: string;
  provider: string;
  model: string;
  requests: number;
  tokens_in: number;
  tokens_out: number;
  errors: number;
}

export interface PipelineHealthPayload {
  generated_at: string;
  history_days: number;
  latest_run: HealthRun | null;
  runs: HealthRun[];
  llm_usage: HealthLlmUsage[];
}

const HISTORY_DAYS = 14;
const RUN_LIMIT = 50;
const LLM_USAGE_LIMIT = 100;

interface PipelineRunRow {
  id: number;
  trigger: string;
  status: string;
  started_at: string;
  finished_at: string | null;
  items_fetched: number;
  items_new: number;
  llm_requests: number;
  stats_json: string | null;
  error: string | null;
}

function parseSourceStats(statsJson: string | null): HealthSourceStat[] {
  if (!statsJson) return [];
  try {
    const parsed = JSON.parse(statsJson) as { sources?: HealthSourceStat[] };
    return Array.isArray(parsed.sources) ? parsed.sources : [];
  } catch {
    // Dữ liệu stats cũ có thể không phải JSON hợp lệ; bỏ qua thay vì làm hỏng trang trạng thái.
    return [];
  }
}

export function exportHealth(
  db: DBAdapter,
  exportDir: string,
  historyDays = HISTORY_DAYS
): PipelineHealthPayload {
  const runRows = db
    .prepare(
      `SELECT id, trigger, status, started_at, finished_at, items_fetched, items_new,
              llm_requests, stats_json, error
         FROM pipeline_runs
        ORDER BY started_at DESC
        LIMIT ?`
    )
    .all(RUN_LIMIT) as PipelineRunRow[];

  const runs: HealthRun[] = runRows.slice(0, historyDays).map((row) => ({
    id: row.id,
    trigger: row.trigger,
    status: row.status,
    started_at: row.started_at,
    finished_at: row.finished_at,
    items_fetched: row.items_fetched,
    items_new: row.items_new,
    llm_requests: row.llm_requests,
    error: row.error,
    sources: parseSourceStats(row.stats_json),
  }));

  const llmUsage = db
    .prepare(
      `SELECT usage_date, provider, model, requests, tokens_in, tokens_out, errors
         FROM llm_usage
        ORDER BY usage_date DESC
        LIMIT ?`
    )
    .all(LLM_USAGE_LIMIT) as HealthLlmUsage[];

  const payload: PipelineHealthPayload = {
    generated_at: new Date().toISOString(),
    history_days: historyDays,
    latest_run: runs[0] ?? null,
    runs,
    llm_usage: llmUsage,
  };

  fs.mkdirSync(exportDir, { recursive: true });
  const filePath = path.join(exportDir, "health.json");
  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), "utf-8");
  logger.info(`Exported pipeline health snapshot to ${filePath}.`);

  return payload;
}
