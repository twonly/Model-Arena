import assert from "node:assert/strict";
import test from "node:test";

import { graduateShared } from "../lib/shared-models.ts";

const trial = (over = {}) => ({
  id: "deepseek-pro",
  name: "DeepSeek V4 Pro",
  kind: "openai",
  baseUrl: "https://api.deepseek.com/v1",
  apiKey: "",
  model: "deepseek-v4-pro",
  enabled: true,
  shared: true,
  ...over,
});

const own = (over = {}) => ({
  id: "mine",
  name: "My Claude",
  kind: "anthropic",
  baseUrl: "https://api.anthropic.com",
  apiKey: "sk-real",
  model: "claude-opus-4-8",
  enabled: true,
  ...over,
});

test("a usable own model graduates ALL trials off, including non-overlapping providers", () => {
  const eps = [
    own(), // Anthropic — overlaps no trial provider
    trial({ id: "a" }),
    trial({ id: "b", baseUrl: "https://api.kimi.com/coding/" }),
  ];
  const next = graduateShared(eps);
  assert.notStrictEqual(next, eps); // changed → new ref
  assert.equal(
    next.filter((e) => e.shared).every((e) => e.enabled === false),
    true
  );
  assert.equal(next.find((e) => !e.shared).enabled, true); // own untouched
});

test("no own model → returns the same reference unchanged", () => {
  const eps = [trial()];
  assert.strictEqual(graduateShared(eps), eps);
});

test("own model without a Key is not yet usable → trials stay checked", () => {
  const eps = [own({ apiKey: "  " }), trial()];
  assert.strictEqual(graduateShared(eps), eps);
});

test("trials already all unchecked → no change, same reference", () => {
  const eps = [own(), trial({ enabled: false })];
  assert.strictEqual(graduateShared(eps), eps);
});

test("does not touch the user's own enabled flag", () => {
  const eps = [own({ enabled: false }), trial()];
  const next = graduateShared(eps);
  assert.equal(next.find((e) => !e.shared).enabled, false);
});
