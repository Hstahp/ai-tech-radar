/**
 * Chuẩn hóa chuỗi tiếng Việt:
 * 1. Chuyển thành chữ thường
 * 2. Thay thế ký tự đ / Đ thành d
 * 3. Chuẩn hóa NFD và loại bỏ các dấu thanh diacritics
 * 4. Loại bỏ ký tự đặc biệt, chuẩn hóa khoảng trắng
 */
export function normalizeVietnamese(text: string): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .replace(/[đĐ]/g, "d")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Tách từ khóa tìm kiếm (tokens) từ câu truy vấn đã chuẩn hóa
 */
export function tokenizeQuery(query: string): string[] {
  const normalized = normalizeVietnamese(query);
  return normalized
    .split(/\s+/)
    .filter((token) => token.length >= 2);
}
