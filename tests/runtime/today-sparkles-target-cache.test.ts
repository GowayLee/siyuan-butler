import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { TodaySparklesTargetCache } from "../../src/butler-mcp/runtime/today-sparkles-target-cache.js";

function getTodayLocalDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

test("today sparkles target cache clears stale snapshot from another day", async () => {
  const cacheRoot = mkdtempSync(join(tmpdir(), "siyuan-butler-test-"));
  const filePath = join(cacheRoot, "today-sparkles-target.json");

  writeFileSync(
    filePath,
    JSON.stringify({
      journal_date: "2000-01-01",
      page_id: "page-stale",
      section_id: "section-stale",
    }),
    "utf8",
  );

  const cache = new TodaySparklesTargetCache(filePath);
  const result = await cache.read(getTodayLocalDate());

  assert.equal(result, undefined);
  await assert.rejects(() => readFile(filePath, "utf8"));
});
