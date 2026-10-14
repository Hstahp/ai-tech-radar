import fs from 'node:fs';
import path from 'node:path';
import { z } from 'zod';

function getWorkspaceRoot(): string {
    let curr = process.cwd();
    while (curr !== path.parse(curr).root) {
        if (fs.existsSync(path.join(curr, 'db/schema.sql')) || fs.existsSync(path.join(curr, 'pnpm-workspace.yaml'))) {
            return curr;
        }
        curr = path.dirname(curr);
    }
    return process.cwd();
}

const BooleanOrString = z
    .union([z.boolean(), z.string().transform((val) => val.toLowerCase() === 'true' || val === '1')])
    .optional();

const EnvSchema = z.object({
    DB_FILE: z.string().default('data/radar.db'),
    EXPORT_DIR: z.string().default('data/export'),
    GEMINI_API_KEY: z.string().optional(),
    GROQ_API_KEY: z.string().optional(),
    GITHUB_API_TOKEN: z.string().optional(),
    LLM_PRIMARY_MODEL: z.string().default('gemini-2.5-flash'),
    LLM_FALLBACK_MODEL: z.string().default('llama-3.3-70b-versatile'),
    LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
    DISCORD_WEBHOOK_URL: z.string().url().optional(),
    DRY_RUN: BooleanOrString,
    SKIP_LLM: BooleanOrString,
});

export type PipelineConfig = z.infer<typeof EnvSchema>;

export function loadConfig(overrides?: Partial<Record<string, unknown>>): PipelineConfig {
    const root = getWorkspaceRoot();
    const parsed = EnvSchema.parse({
        DB_FILE: process.env.DB_FILE,
        EXPORT_DIR: process.env.EXPORT_DIR,
        GEMINI_API_KEY: process.env.GEMINI_API_KEY,
        GROQ_API_KEY: process.env.GROQ_API_KEY,
        GITHUB_API_TOKEN: process.env.GITHUB_API_TOKEN,
        LLM_PRIMARY_MODEL: process.env.LLM_PRIMARY_MODEL,
        LLM_FALLBACK_MODEL: process.env.LLM_FALLBACK_MODEL,
        LOG_LEVEL: process.env.LOG_LEVEL,
        DISCORD_WEBHOOK_URL: process.env.DISCORD_WEBHOOK_URL,
        DRY_RUN: process.env.DRY_RUN,
        SKIP_LLM: process.env.SKIP_LLM,
        ...overrides,
    });

    return {
        ...parsed,
        DB_FILE: path.isAbsolute(parsed.DB_FILE) ? parsed.DB_FILE : path.resolve(root, parsed.DB_FILE),
        EXPORT_DIR: path.isAbsolute(parsed.EXPORT_DIR) ? parsed.EXPORT_DIR : path.resolve(root, parsed.EXPORT_DIR),
    };
}
