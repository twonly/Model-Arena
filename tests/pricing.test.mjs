import assert from "node:assert/strict";
import test from "node:test";

import {
  findPrice,
  estimateRunCost,
  paretoFrontier,
  toUsdPer1M,
} from "../lib/pricing.ts";

test("findPrice matches aliases and respects region", () => {
  const flash = findPrice("deepseek-flash");
  assert.equal(flash?.model, "DeepSeek V4.1 Flash 1017");
  assert.equal(flash?.currency, "USD");
  assert.equal(flash?.output, 1.2);

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
  const flash = findPrice("deepseek-flash");
  const c = estimateRunCost(flash, 1000, 1000);
  // (1000*0.3 + 1000*1.2)/1e6 = 0.0015 USD
  assert.ok(Math.abs(c.totalUsd - 0.0015) < 1e-9);
  assert.ok(Math.abs(c.totalNative - 0.0015) < 1e-9);

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

test("price matching never guesses variants, free routes, or another provider", async () => {
  const { findEndpointPrice } = await import("../lib/pricing.ts");
  assert.equal(findPrice("deepseek/deepseek-v4-flash-free")?.output, 0);
  assert.equal(findPrice("kimi-for-coding-highspeed"), undefined);
  assert.equal(findPrice("gpt-4.1-mini")?.model, "GPT-4.1 mini");
  assert.equal(
    findEndpointPrice("deepseek-v4-flash", "https://gateway.test"),
    undefined,
  );
  assert.equal(
    findEndpointPrice("deepseek-v4-flash", "api.deepseek.com")?.output,
    1.2,
  );
  assert.equal(
    findEndpointPrice("glm-5.2", "https://open.bigmodel.cn/api/coding/paas/v4"),
    undefined,
  );
  const p = {
    ...findPrice("deepseek-flash"),
    inputMiss: 0,
    output: 0,
    inputHit: 0,
  };
  assert.equal(estimateRunCost(p, 100, 100).totalUsd, 0);
  assert.throws(() => estimateRunCost(p, -1, 2));
  assert.throws(() => estimateRunCost(p, 1, NaN));
  assert.equal(
    estimateRunCost(findPrice("deepseek-flash"), 10, 0, 100).totalUsd,
    estimateRunCost(findPrice("deepseek-flash"), 10, 0, 10).totalUsd,
  );
});

test("host-only Zhipu telemetry never borrows subscription pricing", async () => {
  const { findEndpointPrice } = await import("../lib/pricing.ts");
  assert.equal(findEndpointPrice("glm-5.2", "open.bigmodel.cn"), undefined);
  assert.ok(
    findEndpointPrice("glm-5.2", "https://open.bigmodel.cn/api/paas/v4"),
  );
});

test('custom USD rates override built-in and unknown endpoints without requiring backend pricing', async () => {
  const { findEndpointPrice, validCustomPricing } = await import('../lib/pricing.ts');
  const custom = { input: 2, output: 6 };
  for (const endpoint of ['https://gateway.test/v1', 'https://api.deepseek.com']) {
    const price = findEndpointPrice('deepseek-flash', endpoint, custom);
    assert.equal(price.currency, 'USD');
    assert.equal(estimateRunCost(price, 1000, 500).totalUsd, 0.005);
  }
  const free = findEndpointPrice('unknown', '', { input: 0, output: 0 });
  assert.equal(estimateRunCost(free, 100, 500).totalUsd, 0);
  for (const invalid of [{}, { input: 1 }, { input: -1, output: 1 }, { input: Infinity, output: 1 }, { input: '2', output: 1 }]) {
    assert.equal(validCustomPricing(invalid), false);
    assert.equal(findEndpointPrice('deepseek-flash', 'https://api.deepseek.com', invalid), undefined);
  }
  assert.equal(findEndpointPrice('deepseek-flash', 'https://api.deepseek.com').inputMiss, 0.3);
});
