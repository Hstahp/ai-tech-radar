import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

interface ManifestIcon {
    src: string;
    sizes: string;
    type: string;
    purpose?: string;
}

interface WebManifest {
    name: string;
    short_name: string;
    description?: string;
    lang?: string;
    start_url: string;
    scope?: string;
    display: string;
    background_color?: string;
    theme_color: string;
    icons: ManifestIcon[];
}

const readRelative = (relativePath: string) =>
    readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), 'utf-8');

const manifest = JSON.parse(readRelative('../public/manifest.webmanifest')) as WebManifest;
const swSource = readRelative('../public/sw.js');
const indexHtml = readRelative('../index.html');
const mainSource = readRelative('../src/main.tsx');

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

describe('web app manifest', () => {
    it('có tên, tên ngắn và cấu hình standalone', () => {
        expect(manifest.name.trim().length).toBeGreaterThan(0);
        expect(manifest.short_name.trim().length).toBeGreaterThan(0);
        expect(manifest.start_url).toBe('/');
        expect(manifest.display).toBe('standalone');
        expect(manifest.theme_color).toBe('#4f46e5');
    });

    it('khai báo icon 192, 512 và một icon maskable', () => {
        const sizes = manifest.icons.map((icon) => icon.sizes);
        expect(sizes).toContain('192x192');
        expect(sizes).toContain('512x512');
        expect(manifest.icons.some((icon) => icon.purpose === 'maskable')).toBe(true);
    });

    it('mọi icon trỏ tới file PNG có chữ ký hợp lệ', () => {
        for (const icon of manifest.icons) {
            const file = new URL(`../public/${icon.src.replace(/^\//, '')}`, import.meta.url);
            expect(existsSync(fileURLToPath(file))).toBe(true);
            const bytes = Array.from(readFileSync(file).subarray(0, 8));
            expect(bytes).toEqual(PNG_SIGNATURE);
        }
    });
});

describe('service worker', () => {
    it('phiên bản cache và app shell được khai báo', () => {
        expect(swSource).toContain('CACHE_VERSION');
        expect(swSource).toContain('skipWaiting');
    });

    it('cache dữ liệu digest và điều hướng mạng trước', () => {
        expect(swSource).toContain('/data/export/latest.json');
        expect(swSource).toContain('request.mode === "navigate"');
        expect(swSource).toContain('staleWhileRevalidate');
    });

    it('bỏ qua request /api/ và không cache chúng', () => {
        expect(swSource).toContain('url.pathname.startsWith("/api/")');
        expect(swSource).not.toMatch(/cache\.(?:put|add|addAll)\([^\n]*\/api\//);
    });
});

describe('index.html', () => {
    it('liên kết manifest và theme color', () => {
        expect(indexHtml).toContain('rel="manifest"');
        expect(indexHtml).toContain('/manifest.webmanifest');
        expect(indexHtml).toContain('theme-color');
    });
});

describe('đăng ký service worker', () => {
    it('chỉ đăng ký ở môi trường production', () => {
        expect(mainSource).toContain('serviceWorker');
        expect(mainSource).toContain('import.meta.env.PROD');
        expect(mainSource).toContain('"/sw.js"');
    });
});
