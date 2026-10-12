import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { logger } from "../lib/logger.js";

const require = createRequire(import.meta.url);

export interface DBStatement {
  get(...args: any[]): any;
  all(...args: any[]): any[];
  run(...args: any[]): { changes: number | bigint; lastInsertRowid: number | bigint };
}

export interface DBAdapter {
  pragma(str: string): void;
  exec(sql: string): void;
  prepare(sql: string): DBStatement;
  transaction<T>(fn: () => T): () => T;
  close(): void;
}

export function openDatabase(dbPath: string): DBAdapter {
  const dir = path.dirname(dbPath);
  if (dir && dir !== "." && !fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  logger.info(`Opening database connection: ${dbPath}`);

  // Try loading better-sqlite3 first
  try {
    const BetterSqlite3 = require("better-sqlite3");
    const db = new BetterSqlite3(dbPath);
    db.pragma("journal_mode = WAL");
    db.pragma("synchronous = NORMAL");
    db.pragma("foreign_keys = ON");
    return db;
  } catch (err: any) {
    logger.warn(`better-sqlite3 unavailable (${err.message}). Falling back to native node:sqlite DatabaseSync.`);
  }

  // Fallback to Node.js native node:sqlite DatabaseSync (Node 22.5+)
  const { DatabaseSync } = require("node:sqlite");
  const rawDb = new DatabaseSync(dbPath);

  rawDb.exec("PRAGMA journal_mode = WAL;");
  rawDb.exec("PRAGMA synchronous = NORMAL;");
  rawDb.exec("PRAGMA foreign_keys = ON;");

  return {
    pragma(str: string): void {
      rawDb.exec(`PRAGMA ${str};`);
    },
    exec(sql: string): void {
      rawDb.exec(sql);
    },
    prepare(sql: string): DBStatement {
      const stmt = rawDb.prepare(sql);
      return {
        get(...args: any[]): any {
          return stmt.get(...args);
        },
        all(...args: any[]): any[] {
          return stmt.all(...args);
        },
        run(...args: any[]): { changes: number | bigint; lastInsertRowid: number | bigint } {
          const res = stmt.run(...args);
          return {
            changes: res.changes,
            lastInsertRowid: res.lastInsertRowid,
          };
        },
      };
    },
    transaction<T>(fn: () => T): () => T {
      return () => {
        rawDb.exec("BEGIN IMMEDIATE;");
        try {
          const result = fn();
          rawDb.exec("COMMIT;");
          return result;
        } catch (error) {
          rawDb.exec("ROLLBACK;");
          throw error;
        }
      };
    },
    close(): void {
      rawDb.close();
    },
  };
}
