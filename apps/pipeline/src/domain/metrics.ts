export interface MetricSnapshot {
  stars?: number | null;
  points?: number | null;
  installs?: number | null;
}

const METRIC_WEIGHTS = { stars: 1, points: 2, installs: 1 } as const;
const DAILY_VELOCITY_SCALE = 100;
const MS_PER_DAY = 86_400_000;

export function weightedMetricValue(snapshot: MetricSnapshot): number {
  return (
    (snapshot.stars ?? 0) * METRIC_WEIGHTS.stars +
    (snapshot.points ?? 0) * METRIC_WEIGHTS.points +
    (snapshot.installs ?? 0) * METRIC_WEIGHTS.installs
  );
}

export function calculateMetricDelta(previous: MetricSnapshot, current: MetricSnapshot): number {
  return weightedMetricValue(current) - weightedMetricValue(previous);
}

export function calculateDailyVelocity(
  previous: MetricSnapshot | null | undefined,
  current: MetricSnapshot,
  days: number
): number {
  if (!previous || days <= 0) return 0;
  const delta = calculateMetricDelta(previous, current);
  if (delta <= 0) return 0;
  return Math.min(delta / days / DAILY_VELOCITY_SCALE, 1);
}

export function daysBetween(fromDate: string, toDate: string): number {
  const from = Date.parse(`${fromDate}T00:00:00Z`);
  const to = Date.parse(`${toDate}T00:00:00Z`);
  if (Number.isNaN(from) || Number.isNaN(to) || to <= from) return 1;
  return Math.max(1, Math.round((to - from) / MS_PER_DAY));
}
