import { sha256 } from '../lib/hash.js';

/**
 * Tao session token ngau nhien bang Web Crypto API
 */
export function generateSessionToken(): string {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    return Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
}

/**
 * Bam token bang sha256 de luu vao DB (tuyet doi khong luu token tho)
 */
export async function hashSessionToken(token: string): Promise<string> {
    return sha256(token);
}
