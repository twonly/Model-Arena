import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { runInNewContext } from "node:vm";
import { BENCHMARK_CASES, BENCHMARK_PARAMS, checkCase } from "../lib/benchmark-suite.ts";
import { median } from "../lib/benchmark-report.ts";

test("published MiniMax evidence reproduces its 15 text passes and 26 coding checks", () => {
  const raw = readFileSync(new URL("../public/evaluations/minimax-m3-1-flash-preview.json", import.meta.url), "utf8");
  assert.doesNotMatch(raw, /\bsk-[A-Za-z0-9_-]{16,}|Bearer\s+[A-Za-z0-9._-]{16,}/);
  const review = JSON.parse(raw);
  assert.deepEqual(review.params, BENCHMARK_PARAMS);
  assert.equal(review.attempts.length, 15);
  assert.equal(new Set(review.attempts.map((a) => a.id)).size, 15);
  for (const a of review.attempts) {
    const c = BENCHMARK_CASES.find((c) => c.id === a.id);
    assert.equal(a.prompt, c.prompt);
    assert.equal(a.status, "done");
    assert.equal(a.finishReason, "stop");
    assert.equal(a.pass, checkCase(c, a.text));
    assert.equal(a.pass, true);
    assert.ok(a.totalMs >= a.firstContentMs);
  }
  assert.equal((median(review.attempts.map((a) => a.firstContentMs)) / 1000).toFixed(3), "1.127");
  assert.equal(review.coding.length, 3);
  assert.equal(review.coding.reduce((sum, a) => sum + a.checkCount, 0), 26);
  for (const a of review.coding) {
    assert.equal(a.pass, true);
    assert.equal(a.finishReason, "stop");
    assert.doesNotThrow(() => runInNewContext(a.text + "\n" + a.checks, {}, {
      timeout: 1000, contextCodeGeneration: { strings: false, wasm: false },
    }));
  }
});
