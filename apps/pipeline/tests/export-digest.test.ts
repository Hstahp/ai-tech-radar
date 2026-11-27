import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { publishAndExportDigest } from "../src/pipeline/steps/export-digest.js";

const tempDirs: string[] = [];

function makeTempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), "radar-digest-"));
  tempDirs.push(dir);
  return dir;
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

describe("publishAndExportDigest", () => {
  it("ghi digest theo ngày vào digests/ và giữ latest.json ở root", () => {
    const exportDir = makeTempDir();
    const repo = {
      createOrUpdateDigest: () => 1,
      saveDigestItems: () => undefined,
      getFeedByDate: () => [],
    };

    publishAndExportDigest(
      repo as never,
      "2026-11-27",
      [],
      exportDir,
      "test-provider",
      "test-model"
    );

    expect(existsSync(join(exportDir, "digests", "2026-11-27.json"))).toBe(true);
    expect(existsSync(join(exportDir, "2026-11-27.json"))).toBe(false);
    expect(existsSync(join(exportDir, "latest.json"))).toBe(true);
  });
});
