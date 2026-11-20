import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { openDatabase } from '../repositories/db.js';
import { SearchRepository } from '../repositories/search-repo.js';

const DEFAULT_LIMIT = 10;

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

export interface SearchCliOptions {
    query: string;
    dbPath: string;
    limit: number;
}

export function parseArgs(args: string[]): SearchCliOptions {
    const root = getWorkspaceRoot();
    const words: string[] = [];
    let dbPath = path.join(root, 'data/radar.db');
    let limit = DEFAULT_LIMIT;

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg === '--db') {
            const value = args[i + 1];
            if (value) {
                dbPath = path.isAbsolute(value) ? value : path.resolve(root, value);
                i++;
            }
            continue;
        }
        if (arg === '--limit') {
            const value = args[i + 1];
            if (value) {
                const parsed = Number(value);
                if (Number.isFinite(parsed) && parsed > 0) {
                    limit = Math.trunc(parsed);
                }
                i++;
            }
            continue;
        }
        words.push(arg);
    }

    return { query: words.join(' ').trim(), dbPath, limit };
}

export function runSearch(query: string, dbPath: string, limit: number): void {
    const db = openDatabase(dbPath);
    try {
        const hits = new SearchRepository(db).search(query, limit);
        process.stdout.write(`Tìm thấy ${hits.length} kết quả cho "${query}":\n`);
        hits.forEach((hit, index) => {
            process.stdout.write(
                `${index + 1}. [${hit.category}] ${hit.title}\n   ${hit.url}\n   ${hit.snippet}\n`,
            );
        });
    } finally {
        db.close();
    }
}

const isMainEntry =
    process.argv[1] !== undefined && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (isMainEntry) {
    const options = parseArgs(process.argv.slice(2));
    if (!options.query) {
        process.stderr.write(
            'Cách dùng: pnpm --filter @radar/pipeline search <từ khóa> [--db <path>] [--limit <n>]\n',
        );
        process.exitCode = 1;
    } else {
        try {
            runSearch(options.query, options.dbPath, options.limit);
        } catch (error: unknown) {
            process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
            process.exitCode = 1;
        }
    }
}
