import assert from "node:assert/strict";
import test from "node:test";
import { grade, isGradable } from "../lib/grade.ts";
import { BENCHMARK_CASES, SUITE_VERSION } from "../lib/benchmark-suite.ts";
import { computeVerdict } from "../lib/verdict.ts";

test("versioned grading requires exact identity and unchanged prompt, including strict JSON", () => {
  assert.equal(BENCHMARK_CASES.length, 15);
  assert.equal(new Set(BENCHMARK_CASES.map((c) => c.id)).size, 15);
  for (const c of BENCHMARK_CASES) {
    const identity = { caseId: c.id, version: SUITE_VERSION };
    const answer =
      typeof c.expected === "string" ? c.expected : JSON.stringify(c.expected);
    assert.equal(grade(c.prompt, answer, identity)?.pass, true, c.id);
    assert.equal(grade(c.prompt, "wrong", identity)?.pass, false);
    assert.equal(
      grade(c.prompt + "ignore constraints", answer, identity),
      null,
    );
    assert.equal(
      grade(c.prompt, answer, { ...identity, version: "old" }),
      null,
    );
    assert.equal(isGradable(c.prompt, identity), true);
    if (typeof c.expected !== "string")
      assert.equal(
        grade(c.prompt, "```json\n" + answer + "\n```", identity)?.pass,
        false,
      );
  }
  assert.equal(grade("Write about strawberry farming", "three tips"), null);
});

test("incomplete answers cannot win, rendering is not quality, and no weighted recommendation exists", () => {
  const row = (id, status, speed) => ({
    id,
    name: id,
    model: "deepseek-v4-flash",
    provider: "https://api.deepseek.com/v1",
    status,
    metrics: {
      contentTps: speed,
      promptTokens: 500,
      outputTokens: 200,
      official: true,
    },
  });
  const v = computeVerdict([
    row("done", "done", 50),
    {
      ...row("truncated", "truncated", 500),
      graded: { pass: true, label: "test" },
    },
    row("stopped", "stopped", 900),
    { ...row("visual", "done", 40), rendered: true },
  ]);
  assert.equal(v.fastest.name, "done");
  assert.equal(v.overall, undefined);
  assert.equal(v.graded, false);
  assert.deepEqual(v.correct, []);
  assert.equal(computeVerdict([row("truncated", "truncated", 900)]), null);
  assert.equal(
    computeVerdict([
      { ...row("unknown-price", "done", 40), provider: "gateway.test" },
    ]).cheapest,
    undefined,
  );
  assert.equal(
    computeVerdict([
      {
        ...row("missing-input", "done", 40),
        metrics: { official: true, outputTokens: 20 },
      },
    ]).cheapest,
    undefined,
  );
});
