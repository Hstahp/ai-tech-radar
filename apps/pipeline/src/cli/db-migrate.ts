import fs from 'node:fs';
import path from 'node:path';
import { openDatabase } from '../repositories/db.js';
import { logger } from '../lib/logger.js';

function getWorkspaceRoot(): string {
    let curr = process.cwd();
    while (curr !== path.parse(curr).root) {
        if (fs.existsSync(path.join(curr, 'db/schema.sql'))) {
            return curr;
        }
        curr = path.dirname(curr);
    }
    return process.cwd();
}

function parseArgs(): { dbPath: string } {
    const args = process.argv.slice(2);
    let dbPath = path.join(getWorkspaceRoot(), 'data/radar.db');
    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--db' && args[i + 1]) {
            dbPath = path.isAbsolute(args[i + 1]) ? args[i + 1] : path.resolve(getWorkspaceRoot(), args[i + 1]);
            i++;
        }
    }
    return { dbPath };
}

export function runMigrations(dbPath: string): void {
    const root = getWorkspaceRoot();
    const db = openDatabase(dbPath);
    try {
        const schemaFile = path.resolve(root, 'db/schema.sql');
        if (!fs.existsSync(schemaFile)) {
            throw new Error(`schema.sql not found at ${schemaFile}`);
        }

        logger.info(`Executing base schema.sql from ${schemaFile}...`);
        const schemaSql = fs.readFileSync(schemaFile, 'utf-8');
        db.exec(schemaSql);

        // Read pending migrations from db/migrations/
        const migrationsDir = path.resolve(root, 'db/migrations');
        if (fs.existsSync(migrationsDir)) {
            const files = fs
                .readdirSync(migrationsDir)
                .filter((f) => f.endsWith('.sql'))
                .sort();
            for (const file of files) {
                const match = file.match(/^(\d+)_(.+)\.sql$/);
                if (!match) continue;
                const version = parseInt(match[1], 10);
                const name = match[2];

                const row = db.prepare('SELECT version FROM schema_migrations WHERE version = ?').get(version);
                if (!row) {
                    logger.info(`Applying migration ${version}: ${name}`);
                    const migrationSql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
                    db.transaction(() => {
                        db.exec(migrationSql);
                        db.prepare('INSERT INTO schema_migrations (version, name) VALUES (?, ?)').run(version, name);
                    })();
                }
            }
        }
        logger.info('Migrations completed successfully.');
    } finally {
        db.close();
    }
}

if (process.argv[1]?.endsWith('db-migrate.ts') || process.argv[1]?.endsWith('db-migrate.js')) {
    const { dbPath } = parseArgs();
    runMigrations(dbPath);
}
