import { afterEach, describe, expect, it } from "vitest";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  calculateDailyVelocity,
  calculateMetricDelta,
  daysBetween,
  weightedMetricValue,
} from "../src/domain/metrics.js";
import { exportTrending } from "../src/pipeline/steps/export-trending.js";
import { openDatabase } from "../src/repositories/db.js";
import { MetricsRepository } from "../src/repositories/metrics-repo.js";

// Chạy trên schema SQLite thật: stub không bắt được lỗi SQL như correlated subquery hay NOT NULL.
const SCHEMA_PATH = fileURLToPath(new URL("../../../db/schema.sql", import.meta.url));

let db: ReturnType<typeof openDatabase> | undefined;
let tempDir: string | undefined;

afterEach(() => {
  db?.close();
  db = undefined;
  if (tempDir) {
    rmSync(tempDir, { recursive: true, force: true });
    tempDir = undefined;
  }
});

function createTestDb(): ReturnType<typeof openDatabase> {
  const testDb = openDatabase(":memory:");
  testDb.exec(readFileSync(SCHEMA_PATH, "utf-8"));
  testDb.exec(`
    INSERT INTO sources (key, name, kind) VALUES ('test', 'Test', 'api');
    INSERT INTO items (source_id, external_id, category, url, url_hash, title, description, content_hash)
    VALUES (1, 'ext-1', 'repo', 'https://example.com/cool-agent', 'hash-1', 'cool-agent', 'An agent framework', 'content-1');
    INSERT INTO metrics (item_id, date, stars) VALUES (1, '2026-11-13', 100), (1, '2026-11-20', 250);
  `);
  return testDb;
}

describe("weightedMetricValue", () => {
  it("cộng trọng số stars, points và installs", () => {
    expect(weightedMetricValue({ stars: 100, points: 10, installs: 5 })).toBe(125);
  });

  it("coi giá trị thiếu hoặc null là 0", () => {
    expect(weightedMetricValue({})).toBe(0);
    expect(weightedMetricValue({ stars: null, points: 3, installs: null })).toBe(6);
  });
});

describe("calculateMetricDelta", () => {
  it("trả về chênh lệch có trọng số giữa hai snapshot", () => {
    expect(calculateMetricDelta({ stars: 100 }, { stars: 250 })).toBe(150);
  });
});

describe("calculateDailyVelocity", () => {
  it("trả về 0 khi chưa có snapshot trước đó", () => {
    expect(calculateDailyVelocity(undefined, { stars: 250 }, 7)).toBe(0);
    expect(calculateDailyVelocity(null, { stars: 250 }, 7)).toBe(0);
  });

  it("tính tốc độ tăng dương theo số ngày", () => {
    const velocity = calculateDailyVelocity({ stars: 100 }, { stars: 250 }, 7);
    expect(velocity).toBeCloseTo(0.2143, 3);
  });

  it("trả về 0 khi delta âm hoặc số ngày không hợp lệ", () => {
    expect(calculateDailyVelocity({ stars: 250 }, { stars: 100 }, 7)).toBe(0);
    expect(calculateDailyVelocity({ stars: 100 }, { stars: 250 }, 0)).toBe(0);
  });

  it("giới hạn velocity tối đa là 1", () => {
    expect(calculateDailyVelocity({ stars: 0 }, { stars: 100_000 }, 1)).toBe(1);
  });
});

describe("daysBetween", () => {
  it("đếm đúng số ngày giữa hai mốc UTC", () => {
    expect(daysBetween("2026-11-13", "2026-11-20")).toBe(7);
  });

  it("trả về tối thiểu 1 ngày khi dữ liệu không hợp lệ hoặc ngược thứ tự", () => {
    expect(daysBetween("không-phải-ngày", "2026-11-20")).toBe(1);
    expect(daysBetween("2026-11-20", "2026-11-13")).toBe(1);
    expect(daysBetween("2026-11-20", "2026-11-20")).toBe(1);
  });
});

describe("MetricsRepository", () => {
  it("getDeltasForDate trả về snapshot trước đó và số ngày", () => {
    db = createTestDb();

    const rows = new MetricsRepository(db).getDeltasForDate("2026-11-20");

    expect(rows).toHaveLength(1);
    expect(rows[0].itemId).toBe(1);
    expect(rows[0].days).toBe(7);
    expect(rows[0].previous.stars).toBe(100);
    expect(rows[0].current.stars).toBe(250);
  });

  it("listWindowGainers chỉ lấy item có snapshot trong cửa sổ", () => {
    db = createTestDb();

    const rows = new MetricsRepository(db).listWindowGainers("2026-11-13", "2026-11-20");

    expect(rows).toHaveLength(1);
    expect(rows[0].title).toBe("cool-agent");
    expect(rows[0].days).toBe(7);
  });

  it("listWindowGainers vẫn nhận snapshot trước nằm trong cửa sổ ngày", () => {
    db = createTestDb();

    const rows = new MetricsRepository(db).listWindowGainers("2026-11-14", "2026-11-20");

    expect(rows).toHaveLength(1);
  });

  it("listWindowGainers trả rỗng khi không có snapshot trước mốc fromDate", () => {
    db = createTestDb();

    const rows = new MetricsRepository(db).listWindowGainers("2026-11-12", "2026-11-20");

    expect(rows).toEqual([]);
  });
});

describe("exportTrending", () => {
  it("ghi trending.json với item tăng trưởng trong cửa sổ", () => {
    db = createTestDb();
    tempDir = mkdtempSync(join(tmpdir(), "radar-trending-"));

    const payload = exportTrending(new MetricsRepository(db), tempDir, "2026-11-20");

    expect(payload.window_days).toBe(7);
    expect(payload.from_date).toBe("2026-11-13");
    expect(payload.digest_date).toBe("2026-11-20");
    expect(payload.items_count).toBe(1);
    expect(payload.items).toEqual([
      {
        item_id: 1,
        title: "cool-agent",
        url: "https://example.com/cool-agent",
        category: "repo",
        delta: 150,
        stars: 250,
      },
    ]);

    const filePath = join(tempDir, "trending.json");
    expect(existsSync(filePath)).toBe(true);
    const written: unknown = JSON.parse(readFileSync(filePath, "utf-8"));
    expect(written).toEqual(payload);
  });
});
