import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { openDatabase, type DBAdapter } from '../src/repositories/db.js';
import { SearchRepository, toFtsQuery } from '../src/repositories/search-repo.js';

const schemaPath = fileURLToPath(new URL('../../../db/schema.sql', import.meta.url));

let db: DBAdapter;

beforeEach(() => {
    db = openDatabase(':memory:');
    db.exec(fs.readFileSync(schemaPath, 'utf-8'));
    db.prepare('INSERT INTO sources (key, name, kind) VALUES (?, ?, ?)').run('test', 'Test Source', 'api');

    const insertItem = db.prepare(
        `INSERT INTO items (source_id, external_id, category, url, url_hash, title, description, content_hash)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    insertItem.run(
        1,
        'agent-forge',
        'repo',
        'https://github.com/test/agent-forge',
        'hash-agent-forge',
        'AgentForge — framework for agents',
        'Build multi-agent systems in TypeScript',
        'content-agent-forge',
    );
    insertItem.run(
        1,
        'cooking',
        'news',
        'https://example.com/cooking',
        'hash-cooking',
        'Cooking recipes',
        'How to cook Vietnamese food',
        'content-cooking',
    );
    insertItem.run(
        1,
        'tom-tat',
        'news',
        'https://example.com/tom-tat',
        'hash-tom-tat',
        'Tóm tắt bản tin AI hôm nay',
        'Bản tin công nghệ hằng ngày',
        'content-tom-tat',
    );
});

afterEach(() => {
    db.close();
});

describe('SearchRepository (FTS5)', () => {
    it('tìm theo từ khóa và trả về snippet có đánh dấu khớp', () => {
        const hits = new SearchRepository(db).search('agent');

        expect(hits).toHaveLength(1);
        expect(hits[0]?.title).toContain('AgentForge');
        expect(hits[0]?.snippet).toContain('[');
    });

    it('tìm được văn bản có dấu khi gõ không dấu', () => {
        const hits = new SearchRepository(db).search('tom tat');

        expect(hits).toHaveLength(1);
        expect(hits[0]?.title).toContain('Tóm tắt');
    });

    it('bỏ qua truy vấn chỉ gồm từ quá ngắn', () => {
        expect(toFtsQuery('a')).toBe('');
        expect(new SearchRepository(db).search('a')).toEqual([]);
    });
});
