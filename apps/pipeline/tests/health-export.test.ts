import { afterEach, describe, expect, it } from "vitest";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { openDatabase, type DBAdapter } from "../src/repositories/db.js";
import { exportHealth } from "../src/pipeline/steps/export-health.js";

const SCHEMA_PATH = fileURLToPath(new URL("../../../db/schema.sql", import.meta.url));

let db: DBAdapter | null = null;
let tempDir: string | null = null;

function createTestDb(): DBAdapter {
  db = openDatabase(":memory:");
  db.exec(readFileSync(SCHEMA_PATH, "utf-8"));
  return db;
}

afterEach(() => {
  db?.close();
  db = null;
  if (tempDir) {
    rmSync(tempDir, { recursive: true, force: true });
    tempDir = null;
  }
});

describe("exportHealth", () => {
  it("xuất lần chạy gần nhất, thống kê nguồn và llm_usage", () => {
    const database = createTestDb();
    database
      .prepare(
        `INSERT INTO pipeline_runs
          (id, trigger, status, started_at, finished_at, items_fetched, items_new, llm_requests, stats_json, error)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        1,
        "local",
        "success",
        "2026-11-25T00:00:00Z",
        "2026-11-25T00:00:10Z",
        40,
        12,
        1,
        JSON.stringify({
          sources: [
            { key: "github_search", fetched: 30 },
            { key: "openalex", fetched: 20 },
          ],
        }),
        null
      );
    database
      .prepare(
        `INSERT INTO llm_usage (usage_date, provider, model, requests, tokens_in, tokens_out, errors)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run("2026-11-25", "gemini", "gemini-2.5-flash", 2, 1000, 500, 0);

    tempDir = mkdtempSync(join(tmpdir(), "radar-health-"));
    const payload = exportHealth(database, tempDir, 14);

    expect(payload.latest_run?.id).toBe(1);
    expect(payload.latest_run?.sources).toHaveLength(2);
    expect(payload.latest_run?.sources[1].key).toBe("openalex");
    expect(payload.runs).toHaveLength(1);
    expect(payload.llm_usage[0].requests).toBe(2);

    const filePath = join(tempDir, "health.json");
    expect(existsSync(filePath)).toBe(true);
    expect(JSON.parse(readFileSync(filePath, "utf-8")).latest_run.id).toBe(1);
  });

  it("trả về latest_run null khi chưa có lần chạy", () => {
    const database = createTestDb();
    tempDir = mkdtempSync(join(tmpdir(), "radar-health-"));

    const payload = exportHealth(database, tempDir);

    expect(payload.latest_run).toBeNull();
    expect(payload.runs).toEqual([]);
  });
});
