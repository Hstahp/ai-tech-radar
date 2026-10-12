export function formatDigestDate(dateStr: string): string {
  try {
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      return `Ngày ${parts[2]} tháng ${parts[1]}, ${parts[0]}`;
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}
