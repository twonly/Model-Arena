import assert from "node:assert/strict";
import test from "node:test";
import { sharedById } from "../lib/shared-models.ts";
import { findEndpointPrice } from "../lib/pricing.ts";
import { PROVIDER_PRESETS } from "../lib/providers.ts";
import { prelaunchBySlug } from "../lib/seo-models.ts";
import { pipeChat } from "../lib/chat-stream.ts";

test("Kimi keeps personal Coding identity separate from pay-as-you-go API access", () => {
  assert.equal(sharedById("kimi-k3-1-pro"), undefined, "personal subscriptions are not public shared access");
  assert.equal(PROVIDER_PRESETS.find((p) => p.id === "kimi-coding").exampleModels[0], "k3.1-pro");
  assert.equal(PROVIDER_PRESETS.find((p) => p.id === "kimi-coding").kind, "anthropic");
  assert.equal(PROVIDER_PRESETS.find((p) => p.id === "kimi-coding").baseUrl, "https://api.kimi.com/coding/");
  assert.equal(PROVIDER_PRESETS.find((p) => p.id === "moonshot").exampleModels[0], "kimi-k3.1-pro");
  assert.equal(prelaunchBySlug("kimi-k3-1-pro").reviewPath, "/guides/kimi-k3-1-pro");
});

test("Kimi regional API rates never become subscription or Highspeed test prices", () => {
  const global = findEndpointPrice("kimi-k3.1-pro", "https://api.moonshot.ai/v1");
  const cn = findEndpointPrice("kimi-k3.1-pro", "https://api.moonshot.cn/v1");
  assert.deepEqual([global.currency, global.inputMiss, global.inputHit, global.output], ["USD", 2, 0.2, 10]);
  assert.deepEqual([cn.currency, cn.inputMiss, cn.inputHit, cn.output], ["CNY", 13, 1.3, 68]);
  assert.equal(findEndpointPrice("kimi-k3.1-pro-highspeed", "https://api.moonshot.ai/v1").output, 20);
  assert.equal(findEndpointPrice("kimi-k3.1-pro", "https://api.kimi.com/coding/v1"), undefined);
  assert.equal(findEndpointPrice("k3.1-pro", "https://api.moonshot.ai/v1"), undefined);
});

test("Kimi Coding preset sends native Messages authentication and effort without OpenAI fields", async (t) => {
  const preset = PROVIDER_PRESETS.find((p) => p.id === "kimi-coding");
  const apiKey = "test-kimi-native-key";
  t.mock.method(globalThis, "fetch", async (url, init) => {
    assert.equal(url, "https://api.kimi.com/coding/v1/messages");
    assert.equal(init.headers["x-api-key"], apiKey);
    assert.equal(init.headers["anthropic-version"], "2023-06-01");
    const request = JSON.parse(init.body);
    assert.equal(request.model, "k3.1-pro");
    assert.equal(request.max_tokens, 12288);
    assert.deepEqual(request.output_config, { effort: "low" });
    for (const field of ["temperature", "reasoning_effort", "stream_options", "thinking"]) assert.ok(!(field in request));
    return new Response([
      { type: "message_start", message: { model: "k3.1-pro", usage: { input_tokens: 7 } } },
      { type: "content_block_delta", delta: { type: "text_delta", text: "OK" } },
      { type: "message_delta", delta: { stop_reason: "end_turn" }, usage: { output_tokens: 12 } },
      { type: "message_stop" },
    ].map((event) => `data: ${JSON.stringify(event)}\n\n`).join(""));
  });
  const events = [];
  await pipeChat({ kind: preset.kind, baseUrl: preset.baseUrl, apiKey, model: preset.exampleModels[0], prompt: "Reply OK", maxTokens: "12288", extraBody: '{"output_config":{"effort":"low"}}' }, (event) => events.push(event), new AbortController().signal);
  assert.equal(events.find((event) => event.type === "delta").text, "OK");
  assert.equal(events.at(-1).finishReason, "end_turn");
  assert.ok(!JSON.stringify(events).includes(apiKey));
});
