import assert from "node:assert/strict";
import test from "node:test";

import {
  DEEPSEEK_V41_MODEL_ID,
  graduateShared,
  reconcilePromotedShared,
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

test("promoted preview reaches existing users once and is removed after expiry", () => {
  const during = new Date("2026-09-09T12:00:00+08:00");
  const after = new Date("2026-09-10T00:00:00+08:00");
  const existing = [trial()];
  const promoted = reconcilePromotedShared(existing, true, during);

  assert.ok(promoted.some((e) => e.id === "deepseek-v4-1-flash"));
  assert.strictEqual(reconcilePromotedShared(existing, false, during), existing);
  assert.ok(!reconcilePromotedShared(promoted, false, after).some((e) => e.id === "deepseek-v4-1-flash"));
});
