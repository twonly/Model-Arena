import assert from "node:assert/strict";
import test from "node:test";

import {
  DEEPSEEK_V41_MODEL_ID,
  graduateShared,
  reconcileSharedPool,
  sharedAsEndpoints,
  sharedById,
} from "../lib/shared-models.ts";

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

test("DeepSeek V4.1 Flash is available only during its verified preview window", () => {
  const during = new Date("2026-09-09T12:00:00+08:00");
  const after = new Date("2026-09-10T00:00:00+08:00");

  assert.equal(sharedById("deepseek-v4-1-flash", during)?.model, DEEPSEEK_V41_MODEL_ID);
  assert.equal(sharedById("deepseek-v4-1-flash", after), undefined);
  assert.ok(sharedAsEndpoints(during).some((e) => e.id === "deepseek-v4-1-flash"));
  assert.ok(!sharedAsEndpoints(after).some((e) => e.id === "deepseek-v4-1-flash"));
});

test("current shared pool keeps DeepSeek and GLM and adds four OrcaRouter free entries", () => {
  const current = new Date("2026-09-11T12:00:00+08:00");
  assert.deepEqual(
    sharedAsEndpoints(current).map((endpoint) => endpoint.id),
    [
      "deepseek-flash",
      "deepseek-pro",
      "glm-5-3",
      "glm-5-3-flash",
      "orcarouter-free",
      "orcarouter-hy3-free",
      "orcarouter-glm-5-3-flash-free",
      "orcarouter-deepseek-v4-flash-free",
    ]
  );
});

test("pool migration removes retired trials and adds new free models once", () => {
  const current = new Date("2026-09-11T12:00:00+08:00");
  const existing = [
    own(),
    trial({ id: "kimi", name: "Kimi", model: "kimi-for-coding" }),
    trial({ id: "glm-5-2", name: "Old GLM", model: "glm-5.2" }),
    trial({ id: "glm-5-3-flash", name: "Old GLM label", enabled: false }),
  ];
  const migrated = reconcileSharedPool(existing, true, current);

  assert.ok(migrated.some((endpoint) => endpoint.id === "mine"));
  assert.ok(!migrated.some((endpoint) => endpoint.id === "kimi"));
  assert.ok(!migrated.some((endpoint) => endpoint.id === "glm-5-2"));
  assert.equal(migrated.find((endpoint) => endpoint.id === "glm-5-3-flash")?.enabled, false);
  assert.ok(migrated.some((endpoint) => endpoint.id === "orcarouter-free"));
  assert.ok(migrated.some((endpoint) => endpoint.id === "orcarouter-hy3-free"));

  const withoutAdding = reconcileSharedPool(existing, false, current);
  assert.ok(!withoutAdding.some((endpoint) => endpoint.id === "kimi"));
  assert.ok(!withoutAdding.some((endpoint) => endpoint.id === "orcarouter-free"));
});
