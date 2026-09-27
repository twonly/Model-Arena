import test from "node:test";
import assert from "node:assert/strict";
import {
  BENCHMARK_CASES,
  BENCHMARK_PARAMS,
  SUITE_VERSION,
} from "../lib/benchmark-suite.ts";
import {
  reportProblems,
  summarizeAttempts,
  reserveCny,
  costCny,
  validPrice,
  reportPairs,
} from "../lib/benchmark-report.ts";
import { resolveSeedEndpoints } from "../lib/quickstart.ts";
import { pipeChat } from "../lib/chat-stream.ts";

const model = {
  id: "test",
  slug: "test",
  model: "model-1",
  version: "1",
  provider: "https://provider.test/v1",
  name: "Model 1",
  source: "https://provider.test/models",
};
const price = {
  input: 2,
  output: 4,
  currency: "CNY",
  source: "https://provider.test/prices",
  verifiedAt: "2026-09-26",
  cnyPerUsd: 7.2,
};
function evidence() {
  return [0, 1].flatMap((window) =>
    BENCHMARK_CASES.map((c) => ({
      id: `${window}-${c.id}`,
      campaign: "weekly-2026-09-21",
      model,
      window,
      caseId: c.id,
      suiteVersion: SUITE_VERSION,
      region: "hkg1",
      params: BENCHMARK_PARAMS,
      startedAt: `2026-09-26T${window ? "12" : "00"}:00:00.000Z`,
      finishedAt: `2026-09-26T${window ? "12" : "00"}:00:01.000Z`,
      status: "done",
      text:
        typeof c.expected === "string"
          ? c.expected
          : JSON.stringify(c.expected),
      pass: true,
      firstContentMs: 500,
      totalMs: 1000,
      charactersPerSecond: 20,
      promptTokens: 100,
      outputTokens: 100,
      costCny: costCny(price, 100, 100),
      reservedCny: 0.01,
      price,
    })),
  );
}
const now = Date.parse("2026-09-26T13:00:00Z");
test("reports require complete versioned evidence, two time windows and consistent computed facts", () => {
  const rows = evidence();
  assert.deepEqual(reportProblems(rows, [model], now), []);
  assert.ok(reportProblems(rows.slice(1), [model], now).length);
  assert.ok(reportProblems([...rows, rows[0]], [model], now).length);
  for (const patch of [
    { pass: false },
    { region: "iad1" },
    { suiteVersion: "old" },
    { costCny: 3 },
    { status: "infrastructure_error" },
    { params: { ...BENCHMARK_PARAMS, maxTokens: "1" } },
    { text: "sk-thisisasecretkey123456789" },
  ]) {
    assert.ok(
      reportProblems([{ ...rows[0], ...patch }, ...rows.slice(1)], [model], now)
        .length,
      JSON.stringify(patch),
    );
  }
  const close = rows.map((a) =>
    a.window ? { ...a, startedAt: "2026-09-26T01:00:00Z" } : a,
  );
  assert.ok(reportProblems(close, [model], now).length);
  const negatives = rows.map((a) => ({
    ...a,
    status: "truncated",
    pass: false,
  }));
  assert.deepEqual(
    reportProblems(negatives, [model], now),
    [],
    "negative outcomes remain publishable",
  );
  assert.ok(
    reportProblems(rows, [{ ...model, availableUntil: "2026-09-25" }], now)
      .length,
  );
});
test("failure denominator, small samples, unknown cost and P95 cannot be silently discarded", () => {
  const rows = evidence();
  rows[0] = {
    ...rows[0],
    status: "provider_error",
    pass: false,
    costCny: undefined,
  };
  const summary = summarizeAttempts(rows)[0];
  assert.equal(summary.attempts, 10);
  assert.equal(summary.completed, 9);
  assert.equal(summary.passRate, 0.9);
  assert.equal(summary.speedComparable, false);
  assert.equal(summary.p95Ms, null);
  assert.equal(summary.costCny, null);
  const many = Array.from({ length: 10 }, () => evidence()).flat();
  assert.equal(summarizeAttempts(many)[0].p95Ms, 1000);
  assert.equal(
    reportPairs({
      models: Array.from({ length: 6 }, (_, i) => ({
        ...model,
        id: `m${i}`,
        slug: `m${i}`,
      })),
    }).length,
    2,
  );
});
test("budget reservations bound the request, zero is a price and unknown prices pause", () => {
  assert.equal(validPrice(price, now), true);
  assert.equal(validPrice(undefined, now), false);
  assert.equal(validPrice({ ...price, verifiedAt: "2026-01-01" }, now), false);
  assert.equal(validPrice({ ...price, output: -1 }, now), false);
  assert.ok(
    reserveCny(price, "中文 abc", BENCHMARK_PARAMS) > costCny(price, 100, 100),
  );
  assert.equal(
    reserveCny({ ...price, input: 0, output: 0 }, "abc", BENCHMARK_PARAMS),
    0,
  );
  assert.throws(() =>
    reserveCny(price, "abc", { ...BENCHMARK_PARAMS, maxTokens: "" }),
  );
  assert.throws(() => costCny(price, -1, 1));
});
test("rerun never substitutes a provider and keeps missing endpoints visible", () => {
  const ep = {
    id: "a",
    model: "same",
    name: "A",
    baseUrl: "https://a.test/v1",
    apiKey: "key",
    enabled: false,
    kind: "openai",
  };
  assert.equal(
    resolveSeedEndpoints(
      [{ model: "same", provider: "https://b.test/v1" }],
      [ep],
    ).selected.length,
    0,
  );
  assert.equal(
    resolveSeedEndpoints(
      [{ model: "same", provider: "https://b.test/v1" }],
      [ep],
    ).missing.length,
    1,
  );
  assert.equal(
    resolveSeedEndpoints(
      [{ model: "same", provider: "https://a.test/v1/" }],
      [ep],
    ).selected[0].enabled,
    true,
  );
  assert.equal(ep.enabled, false);
});
test("shared stream parser handles final lines, token limits and interrupted output", async () => {
  const original = global.fetch;
  try {
    const run = async (raw) => {
      global.fetch = async () => new Response(raw);
      const out = [];
      await pipeChat(
        {
          kind: "openai",
          baseUrl: "https://test.invalid/v1",
          model: "test",
          apiKey: "secret",
          prompt: "hello",
        },
        (e) => out.push(e),
        new AbortController().signal,
      );
      return out;
    };
    const body =
      "data: " +
      JSON.stringify({
        choices: [{ delta: { content: "Hello" }, finish_reason: "length" }],
      });
    let events = await run(body);
    assert.equal(events.find((e) => e.type === "delta").text, "Hello");
    assert.equal(events.at(-1).truncated, true);
    assert.ok(events[0].ts >= 0);
    events = await run(
      "data: " +
        JSON.stringify({ choices: [{ delta: { content: "partial" } }] }) +
        "\n",
    );
    assert.equal(events.at(-1).truncated, true);
    events = await run(
      "data: " +
        JSON.stringify({
          choices: [{ delta: { content: "okay" }, finish_reason: "stop" }],
        }) +
        "\n\ndata: [DONE]",
    );
    assert.equal(events.at(-1).truncated, false);
  } finally {
    global.fetch = original;
  }
});
