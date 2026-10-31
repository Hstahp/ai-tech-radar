import { sha256 } from '../lib/hash.js';

export interface SessionPayload {
    userId: string;
    email: string;
    role: 'user' | 'admin';
    displayName?: string | null;
    avatarUrl?: string | null;
    tags?: string[];
    exp: number;
    iat: number;
}

const DEFAULT_SECRET = 'ai-tech-radar-session-secret-salt-2026';

function base64UrlEncode(str: string): string {
    const bytes = new TextEncoder().encode(str);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(str: string): string {
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
        base64 += '=';
    }
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder().decode(bytes);
}

async function getSigningKey(secret: string = DEFAULT_SECRET): Promise<CryptoKey> {
    const enc = new TextEncoder();
    return crypto.subtle.importKey(
        'raw',
        enc.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign', 'verify'],
    );
}

export async function createSignedSessionToken(
    payloadData: Omit<SessionPayload, 'exp' | 'iat'>,
    maxAgeSeconds: number = 30 * 86400,
    secret?: string,
): Promise<{ token: string; expiresAt: string }> {
    const now = Math.floor(Date.now() / 1000);
    const exp = now + maxAgeSeconds;
    const expiresAt = new Date(exp * 1000).toISOString();

    const payload: SessionPayload = {
        ...payloadData,
        iat: now,
        exp,
    };

    const header = { alg: 'HS256', typ: 'JWT' };
    const encodedHeader = base64UrlEncode(JSON.stringify(header));
    const encodedPayload = base64UrlEncode(JSON.stringify(payload));
    const dataToSign = `${encodedHeader}.${encodedPayload}`;

    const key = await getSigningKey(secret);
    const signatureBuffer = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(dataToSign));
    const signatureBytes = new Uint8Array(signatureBuffer);
    let sigBinary = '';
    for (let i = 0; i < signatureBytes.byteLength; i++) {
        sigBinary += String.fromCharCode(signatureBytes[i]);
    }
    const encodedSignature = btoa(sigBinary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    const token = `${dataToSign}.${encodedSignature}`;
    return { token, expiresAt };
}

export async function verifySignedSessionToken(
    token: string,
    secret?: string,
): Promise<SessionPayload | null> {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;

        const [encodedHeader, encodedPayload, encodedSignature] = parts;
        const dataToVerify = `${encodedHeader}.${encodedPayload}`;

        let sigBase64 = encodedSignature.replace(/-/g, '+').replace(/_/g, '/');
        while (sigBase64.length % 4) {
            sigBase64 += '=';
        }
        const sigBinary = atob(sigBase64);
        const signatureBytes = new Uint8Array(sigBinary.length);
        for (let i = 0; i < sigBinary.length; i++) {
            signatureBytes[i] = sigBinary.charCodeAt(i);
        }

        const key = await getSigningKey(secret);
        const isValid = await crypto.subtle.verify(
            'HMAC',
            key,
            signatureBytes,
            new TextEncoder().encode(dataToVerify),
        );

        if (!isValid) return null;

        const payloadStr = base64UrlDecode(encodedPayload);
        const payload = JSON.parse(payloadStr) as SessionPayload;

        const now = Math.floor(Date.now() / 1000);
        if (payload.exp && payload.exp < now) {
            return null; // Token da het han
        }

        return payload;
    } catch {
        return null;
    }
}

/**
 * Tao session token ngau nhien bang Web Crypto API (fallback)
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
