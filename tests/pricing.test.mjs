import assert from "node:assert/strict";
import test from "node:test";

import {
  findPrice,
  estimateRunCost,
  paretoFrontier,
  toUsdPer1M,
} from "../lib/pricing.ts";

test("findPrice matches aliases and respects region", () => {
  const flash = findPrice("deepseek-chat");
  assert.equal(flash?.model, "DeepSeek V4 Flash");
  assert.equal(flash?.currency, "USD");
  assert.equal(flash?.output, 0.28);

  const kimi = findPrice("kimi-for-coding");
  assert.equal(kimi?.model, "Kimi K2.7 Code");
  assert.equal(kimi?.inputHit, 0.19);

  const glmCn = findPrice("glm-5.2", "cn");
  assert.equal(glmCn?.currency, "CNY");
  assert.equal(glmCn?.output, 28);
  const glmGlobal = findPrice("glm-5.2", "global");
  assert.equal(glmGlobal?.currency, "USD");
  assert.equal(glmGlobal?.output, 4.4);
});

test("findPrice falls back to the other region when requested one is absent", () => {
  // step 只有 cn 定价；请求 global 时应回退到 cn 条目而不是 undefined
  const step = findPrice("step-3.7-flash", "global");
  assert.equal(step?.currency, "CNY");
  assert.equal(step?.output, 8.1);
});

test("estimateRunCost computes USD and native totals", () => {
  const flash = findPrice("deepseek-chat");
  const c = estimateRunCost(flash, 1000, 1000);
  // (1000*0.14 + 1000*0.28)/1e6 = 0.00042 USD
  assert.ok(Math.abs(c.totalUsd - 0.00042) < 1e-9);
  assert.ok(Math.abs(c.totalNative - 0.00042) < 1e-9);

  const step = findPrice("step-3.7-flash");
  const cc = estimateRunCost(step, 1000, 1000);
  // native CNY = (1000*1.35 + 1000*8.1)/1e6 = 0.00945；USD = native ÷ 7.2
  assert.ok(Math.abs(cc.totalNative - 0.00945) < 1e-9);
  assert.ok(Math.abs(cc.totalUsd - toUsdPer1M(0.00945, "CNY")) < 1e-9);
});

test("paretoFrontier marks the cheap-and-fast skyline", () => {
  const pts = [
    { costUsd: 1, speed: 100 },
    { costUsd: 2, speed: 90 }, // dominated by {1,100}
    { costUsd: 0.5, speed: 50 },
    { costUsd: 3, speed: 120 },
  ];
  assert.deepEqual(paretoFrontier(pts), [true, false, true, true]);
});
