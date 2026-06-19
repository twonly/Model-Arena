import assert from "node:assert/strict";
import test from "node:test";

import { buildSnapshot } from "../lib/share.ts";

function run(overrides = {}) {
  return {
    status: "done",
    text: "",
    reasoning: "",
    metrics: { official: false, outputTokens: 1 },
    samples: [],
    liveTokens: 0,
    liveTps: 0,
    ...overrides,
  };
}

test("snapshot keeps long reasoning when the model returned no final text", () => {
  const html =
    "```html\n<!doctype html><html><body>" +
    "x".repeat(9000) +
    "</body></html>\n```";
  const snapshot = buildSnapshot({
    title: "",
    notes: "",
    prompt: "generate html",
    watermark: "",
    thinkingStats: true,
    rows: [{ name: "Kimi", model: "kimi-for-coding", run: run({ reasoning: html }) }],
  });
  assert.equal(snapshot.results[0].text, "");
  assert.ok(snapshot.results[0].reasoning.length > 8000);
  assert.match(snapshot.results[0].reasoning, /<\/html>/);
});

test("snapshot caps ordinary reasoning when final text exists", () => {
  const snapshot = buildSnapshot({
    title: "",
    notes: "",
    prompt: "answer",
    watermark: "",
    thinkingStats: true,
    rows: [
      {
        name: "Model",
        model: "model",
        run: run({ text: "final", reasoning: "r".repeat(12000) }),
      },
    ],
  });
  assert.equal(snapshot.results[0].text, "final");
  assert.equal(snapshot.results[0].reasoning.length, 8000);
});
