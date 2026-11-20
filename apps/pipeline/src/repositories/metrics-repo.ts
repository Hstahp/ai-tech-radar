import type { DBAdapter } from "./db.js";

export interface MetricValues {
  stars: number | null;
  points: number | null;
  installs: number | null;
}

export interface MetricDeltaRow {
  itemId: number;
  date: string;
  previousDate: string;
  days: number;
  current: MetricValues;
  previous: MetricValues;
}

export interface TrendingRow extends MetricDeltaRow {
  title: string;
  url: string;
  category: string;
}

interface MetricDeltaQueryRow {
  item_id: number;
  metric_date: string;
  previous_date: string;
  day_gap: number;
  cur_stars: number | null;
  cur_points: number | null;
  cur_installs: number | null;
  prev_stars: number | null;
  prev_points: number | null;
  prev_installs: number | null;
}

function mapDeltaRow(row: MetricDeltaQueryRow): MetricDeltaRow {
  return {
    itemId: row.item_id,
    date: row.metric_date,
    previousDate: row.previous_date,
    days: Math.max(1, row.day_gap ?? 1),
    current: { stars: row.cur_stars, points: row.cur_points, installs: row.cur_installs },
    previous: { stars: row.prev_stars, points: row.prev_points, installs: row.prev_installs },
  };
}

export class MetricsRepository {
  constructor(private db: DBAdapter) {}

  getDeltasForDate(date: string): MetricDeltaRow[] {
    const rows = this.db
      .prepare(
        `SELECT m.item_id,
                m.date AS metric_date,
                p.date AS previous_date,
                CAST(julianday(m.date) - julianday(p.date) AS INTEGER) AS day_gap,
                m.stars AS cur_stars, m.points AS cur_points, m.installs AS cur_installs,
                p.stars AS prev_stars, p.points AS prev_points, p.installs AS prev_installs
           FROM metrics m
           JOIN metrics p
             ON p.item_id = m.item_id
            AND p.date = (SELECT MAX(prev.date) FROM metrics prev
                           WHERE prev.item_id = m.item_id AND prev.date < m.date)
          WHERE m.date = ?`
      )
      .all(date) as MetricDeltaQueryRow[];

    return rows.map(mapDeltaRow);
  }

  listWindowGainers(fromDate: string, toDate: string): TrendingRow[] {
    const rows = this.db
      .prepare(
        `SELECT i.id AS item_id, i.title, i.url, i.category,
                m.date AS metric_date,
                p.date AS previous_date,
                CAST(julianday(m.date) - julianday(p.date) AS INTEGER) AS day_gap,
                m.stars AS cur_stars, m.points AS cur_points, m.installs AS cur_installs,
                p.stars AS prev_stars, p.points AS prev_points, p.installs AS prev_installs
           FROM metrics m
           JOIN items i ON i.id = m.item_id
           JOIN metrics p
             ON p.item_id = m.item_id
            AND p.date = (SELECT MAX(prev.date) FROM metrics prev
                           WHERE prev.item_id = m.item_id
                             AND prev.date <= ?
                             AND prev.date < m.date)
          WHERE m.date = ? AND i.status = 'active'`
      )
      .all(fromDate, toDate) as Array<MetricDeltaQueryRow & { title: string; url: string; category: string }>;

    return rows.map((row) => ({
      ...mapDeltaRow(row),
      title: row.title,
      url: row.url,
      category: row.category,
    }));
  }
}
