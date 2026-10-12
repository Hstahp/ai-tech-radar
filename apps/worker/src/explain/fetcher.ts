import { AppError } from "../lib/errors.js";

export const ALLOWED_HOSTS = [
  "api.github.com",
  "raw.githubusercontent.com",
  "github.com",
  "open-vsx.org",
];

export const MAX_CONTENT_CHARS = 6000; // ~1500 tokens

/**
 * Kiểm tra hostname có nằm trong allowlist không (chống SSRF)
 */
export function isAllowedHost(urlStr: string): boolean {
  try {
    const parsed = new URL(urlStr);
    return ALLOWED_HOSTS.some(
      (allowed) => parsed.hostname === allowed || parsed.hostname.endsWith(`.${allowed}`)
    );
  } catch {
    return false;
  }
}

/**
 * Tải nội dung README/mô tả từ nguồn an toàn và cắt ngắn để tiết kiệm token
 */
export async function fetchSafeContent(
  urlStr: string,
  customFetch: typeof fetch = fetch
): Promise<string> {
  if (!isAllowedHost(urlStr)) {
    throw new AppError("SSRF_BLOCKED", `Host không nằm trong danh sách cho phép: ${urlStr}`, 403);
  }

  try {
    const res = await customFetch(urlStr, {
      headers: {
        "User-Agent": "AITechRadar-DeepExplain/1.0",
        Accept: "text/plain, text/markdown, application/json",
      },
    });

    if (!res.ok) {
      return "";
    }

    const text = await res.text();
    return text.slice(0, MAX_CONTENT_CHARS);
  } catch (err: any) {
    if (err instanceof AppError) throw err;
    return "";
  }
}
