/**
 * Normalizes a URL by removing trailing slashes, tracking parameters, and standardizing formatting.
 */
export function normalizeUrl(rawUrl: string): string {
  try {
    const url = new URL(rawUrl);
    url.hostname = url.hostname.toLowerCase();
    url.hash = "";

    const params = new URLSearchParams(url.search);
    const trackingPrefixes = ["utm_", "fbclid", "gclid", "ref"];
    const keysToDelete: string[] = [];
    for (const key of params.keys()) {
      if (trackingPrefixes.some((prefix) => key.toLowerCase().startsWith(prefix))) {
        keysToDelete.push(key);
      }
    }
    for (const key of keysToDelete) {
      params.delete(key);
    }
    url.search = params.toString() ? `?${params.toString()}` : "";

    let normalized = url.toString();
    if (normalized.endsWith("/") && url.pathname !== "/") {
      normalized = normalized.slice(0, -1);
    }
    return normalized;
  } catch {
    return rawUrl.trim().toLowerCase();
  }
}

/**
 * Computes SHA-256 hex string for a given text.
 * Works in Node.js 19+, Cloudflare Workers, and modern Web APIs using Web Crypto.
 */
export async function sha256Hex(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await globalThis.crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Computes content hash sha256(title + '\n' + description)
 */
export async function computeContentHash(title: string, description: string = ""): Promise<string> {
  const content = `${title.trim()}\n${description.trim()}`;
  return sha256Hex(content);
}
