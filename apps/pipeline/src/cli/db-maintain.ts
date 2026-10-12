import fs from "node:fs";
import path from "node:path";
import { openDatabase } from "../repositories/db.js";
import { logger } from "../lib/logger.js";

function getWorkspaceRoot(): string {
  let curr = process.cwd();
  while (curr !== path.parse(curr).root) {
    if (fs.existsSync(path.join(curr, "db/schema.sql"))) {
      return curr;
    }
    curr = path.dirname(curr);
  }
  return process.cwd();
}

function parseArgs(): { dbPath: string } {
  const args = process.argv.slice(2);
  let dbPath = path.join(getWorkspaceRoot(), "data/radar.db");
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--db" && args[i + 1]) {
      dbPath = path.isAbsolute(args[i + 1]) ? args[i + 1] : path.resolve(getWorkspaceRoot(), args[i + 1]);
      i++;
    }
  }
  return { dbPath };
}

export function maintainDatabase(dbPath: string): void {
  const db = openDatabase(dbPath);
  try {
    logger.info("Starting weekly database maintenance...");

    // 1) Clean raw_json older than 60 days
    const res1 = db.prepare(`
      UPDATE items SET raw_json = NULL
       WHERE raw_json IS NOT NULL AND last_seen_at < strftime('%Y-%m-%dT%H:%M:%SZ','now','-60 day')
    `).run();
    logger.info(`Cleared raw_json for ${res1.changes} items older than 60 days.`);

    // 2) Clean metrics for non-digest items older than 30 days
    const res2 = db.prepare(`
      DELETE FROM metrics
       WHERE date < date('now','-30 day')
         AND item_id NOT IN (SELECT item_id FROM digest_items)
    `).run();
    logger.info(`Deleted ${res2.changes} old unfeatured metrics rows.`);

    // 3) Clean chat cache older than 7 days
    const res3 = db.prepare(`
      DELETE FROM chat_cache WHERE created_at < strftime('%Y-%m-%dT%H:%M:%SZ','now','-7 day')
    `).run();
    logger.info(`Deleted ${res3.changes} old chat_cache rows.`);

    // 4) Clean operational logs older than 180 days
    const res4a = db.prepare(`DELETE FROM pipeline_runs WHERE started_at < strftime('%Y-%m-%dT%H:%M:%SZ','now','-180 day')`).run();
    const res4b = db.prepare(`DELETE FROM llm_usage WHERE usage_date < date('now','-180 day')`).run();
    logger.info(`Cleaned logs: ${res4a.changes} pipeline_runs, ${res4b.changes} llm_usage.`);

    // 5) Optimize
    logger.info("Executing PRAGMA optimize...");
    db.exec("PRAGMA optimize;");
    logger.info("Database maintenance completed.");
  } finally {
    db.close();
  }
}

if (process.argv[1]?.endsWith("db-maintain.ts") || process.argv[1]?.endsWith("db-maintain.js")) {
  const { dbPath } = parseArgs();
  maintainDatabase(dbPath);
}
