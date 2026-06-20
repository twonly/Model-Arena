import assert from "node:assert/strict";
import test from "node:test";

import {
  normalizeAnthropicThinkingPayload,
  THINK_DEFAULT_BUDGET_TOKENS,
  THINK_DEFAULT_MAX_TOKENS,
} from "../lib/anthropic.ts";
import { sharedById } from "../lib/shared-models.ts";

test("anthropic thinking defaults provide max_tokens and a smaller budget", () => {
  const payload = { thinking: { type: "enabled" } };
  const on = normalizeAnthropicThinkingPayload(payload, {
    extra: {},
  });
  assert.equal(on, true);
  assert.equal(payload.max_tokens, THINK_DEFAULT_MAX_TOKENS);
  assert.deepEqual(payload.thinking, {
    type: "enabled",
    budget_tokens: THINK_DEFAULT_BUDGET_TOKENS,
  });
});

test("anthropic thinking normalizes explicit equal max and budget", () => {
  const payload = {
    max_tokens: 256000,
    thinking: { type: "enabled", budget_tokens: 256000 },
  };
  normalizeAnthropicThinkingPayload(payload, {
    extra: { max_tokens: 256000 },
  });
  assert.equal(payload.max_tokens, 256000);
  assert.equal(payload.thinking.budget_tokens, 224000);
  assert.ok(payload.thinking.budget_tokens < payload.max_tokens);
});

test("anthropic thinking derives max_tokens from a standalone budget", () => {
  const payload = { thinking: { type: "enabled", budget_tokens: 64000 } };
  normalizeAnthropicThinkingPayload(payload, {
    extra: { thinking: payload.thinking },
  });
  assert.equal(payload.max_tokens, 96000);
});

test("shared Kimi config keeps thinking budget below max_tokens", () => {
  const kimi = sharedById("kimi");
  assert.ok(kimi?.extraBody);
  const extra = JSON.parse(kimi.extraBody);
  assert.equal(extra.thinking.type, "enabled");
  assert.ok(extra.thinking.budget_tokens < extra.max_tokens);
});
