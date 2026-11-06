import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { runInNewContext } from "node:vm";
import { BENCHMARK_CASES, BENCHMARK_PARAMS, checkCase } from "../lib/benchmark-suite.ts";
import { median } from "../lib/benchmark-report.ts";
import { prelaunchBySlug } from "../lib/seo-models.ts";

const raw = readFileSync(new URL("../public/evaluations/longcat-2-5-preview.json", import.meta.url), "utf8");
const review = JSON.parse(raw);

test("LongCat published paired text evidence retains exact tasks, timing and both modes", () => {
  assert.doesNotMatch(raw, /\bak_[A-Za-z0-9_-]{16,}|Bearer\s+[A-Za-z0-9._-]{16,}/);
  assert.deepEqual(review.params, BENCHMARK_PARAMS);
  assert.deepEqual(review.modes, { default: {}, disabled: { thinking: { type: "disabled" } } });
  assert.equal(review.attempts.length, 30);
  for (const [i, c] of BENCHMARK_CASES.entries()) {
    const pair = review.attempts.slice(i * 2, i * 2 + 2);
    assert.deepEqual(pair.map((a) => a.mode), i % 2 ? ["disabled", "default"] : ["default", "disabled"]);
    for (const a of pair) {
      assert.equal(a.id, c.id);
      assert.equal(a.prompt, c.prompt);
      assert.equal(a.status, "done");
      assert.equal(a.finishReason, "stop");
      assert.equal(a.pass, checkCase(c, a.text));
      assert.equal(a.pass, true);
      assert.ok(a.totalMs >= a.firstContentMs);
      assert.equal(a.diagnostics.attempts, 1, "no hidden retry");
      assert.equal(a.diagnostics.upstreamStatus, 200);
      if (a.mode === "disabled") assert.equal(a.firstReasoningMs, null);
    }
  }
  for (const [mode, formatted] of [["default", "4.510"], ["disabled", "1.221"]]) {
    assert.equal((median(review.attempts.filter((a) => a.mode === mode).map((a) => a.firstContentMs)) / 1000).toFixed(3), formatted);
  }
});

test("LongCat coding evidence preserves the truncated attempt and only counts executed checks", () => {
  assert.equal(review.coding.length, 3);
  assert.equal(review.coding.reduce((n, a) => n + a.checkCount, 0), 26);
  assert.equal(review.coding.filter((a) => a.pass).reduce((n, a) => n + a.checkCount, 0), 8);
  const failed = review.coding.find((a) => a.id === "code-money");
  assert.equal(failed.status, "truncated");
  assert.equal(failed.finishReason, "length");
  assert.equal(failed.text, "");
  assert.equal(failed.pass, false);
  assert.equal(failed.outputTokens, 4096);
  assert.equal(failed.reasoningTokens, 4095);
  assert.equal(failed.params.maxTokens, "4096");
  for (const a of review.coding.filter((a) => a.pass)) {
    assert.equal(a.status, "done");
    assert.equal(a.finishReason, "stop");
    assert.doesNotThrow(() => runInNewContext(a.executable + "\n" + a.checks, {}, {
      timeout: 1000, contextCodeGeneration: { strings: false, wasm: false },
    }));
  }
});

test("LongCat review is discoverable and its bilingual article exposes failure and limitations", () => {
  const profile = prelaunchBySlug("longcat-2-5-preview");
  assert.equal(profile.reviewPath, "/guides/longcat-2-5-preview");
  assert.equal(profile.apiModelId, review.model);
  for (const locale of ["zh-CN", "en"]) {
    const article = review.editorial[locale];
    assert.equal(article.sections.length, 8);
    assert.equal(new Set(article.sections.map((s) => s.id)).size, 8);
    const body = article.sections.map((s) => s.body).join("\n");
    assert.match(body, /4095/);
    assert.match(body, /finish_reason=length/);
    assert.match(body, /37\.621/);
    assert.match(body, /#evidence-code-money/);
    assert.ok(body.includes(`/${locale}/arena`));
    assert.ok(body.includes(`/${locale}/method`));
    assert.ok(body.includes(`/${locale}/reports`));
  }
});
