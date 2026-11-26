import { z } from "zod";

const SourceStatSchema = z.object({
  key: z.string(),
  fetched: z.number(),
  error: z.string().optional(),
});

export const HealthRunSchema = z.object({
  id: z.number(),
  trigger: z.string(),
  status: z.string(),
  started_at: z.string(),
  finished_at: z.string().nullable(),
  items_fetched: z.number(),
  items_new: z.number(),
  llm_requests: z.number(),
  error: z.string().nullable(),
  sources: z.array(SourceStatSchema),
});

const LlmUsageSchema = z.object({
  usage_date: z.string(),
  provider: z.string(),
  model: z.string(),
  requests: z.number(),
  tokens_in: z.number(),
  tokens_out: z.number(),
  errors: z.number(),
});

export const PipelineHealthSchema = z.object({
  generated_at: z.string(),
  history_days: z.number(),
  latest_run: HealthRunSchema.nullable(),
  runs: z.array(HealthRunSchema),
  llm_usage: z.array(LlmUsageSchema),
});

export type PipelineHealth = z.infer<typeof PipelineHealthSchema>;
export type HealthRun = z.infer<typeof HealthRunSchema>;

const HEALTH_URL = "/data/export/health.json";

export async function loadPipelineHealth(): Promise<PipelineHealth | null> {
  try {
    const response = await fetch(HEALTH_URL, { cache: "no-cache" });
    if (!response.ok) return null;
    const parsed = PipelineHealthSchema.safeParse(await response.json());
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
