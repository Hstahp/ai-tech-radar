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

export function checkDatabaseIntegrity(dbPath: string): boolean {
  const db = openDatabase(dbPath);
  try {
    logger.info("Running PRAGMA integrity_check...");
    const integrityResult = db.prepare("PRAGMA integrity_check").get() as { integrity_check?: string };
    if (integrityResult?.integrity_check !== "ok") {
      logger.error(`Database integrity check failed: ${JSON.stringify(integrityResult)}`);
      return false;
    }

    logger.info("Running PRAGMA foreign_key_check...");
    const fkErrors = db.prepare("PRAGMA foreign_key_check").all();
    if (fkErrors.length > 0) {
      logger.error(`Foreign key violations found: ${JSON.stringify(fkErrors)}`);
      return false;
    }

    logger.info("Database integrity check passed successfully.");
    return true;
  } finally {
    db.close();
  }
}

if (process.argv[1]?.endsWith("db-check.ts") || process.argv[1]?.endsWith("db-check.js")) {
  const { dbPath } = parseArgs();
  const ok = checkDatabaseIntegrity(dbPath);
  if (!ok) {
    process.exit(1);
  }
}
