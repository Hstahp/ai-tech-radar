const MS_PER_DAY = 86_400_000;

export function subtractDays(date: string, days: number): string {
  const parsed = Date.parse(`${date}T00:00:00Z`);
  if (Number.isNaN(parsed)) return date;
  return new Date(parsed - days * MS_PER_DAY).toISOString().slice(0, 10);
}
