/**
 * Web Crypto SHA-256 hashing (chuẩn Cloudflare Worker / Browser / Node 20+)
 */
export async function sha256(message: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Băm IP kết hợp với salt bí mật để bảo mật danh tính người dùng (không lưu IP thô)
 */
export async function hashIp(ip: string, salt: string = "radar_salt"): Promise<string> {
  return sha256(`${salt}:${ip.trim()}`);
}
