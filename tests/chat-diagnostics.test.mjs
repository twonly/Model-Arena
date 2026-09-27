import test from "node:test";
import assert from "node:assert/strict";
import { pipeChat } from "../lib/chat-stream.ts";
import worker from "../cloudflare/chat-worker/src/index.js";

const body = { kind: "openai", baseUrl: "https://provider.test/v1", apiKey: "private-key", model: "test", prompt: "hello" };
const sse = (data) => `data: ${JSON.stringify(data)}\n\n`;

test("diagnostics distinguish headers, bytes and real tokens, preserving only safe provider fields", async (t) => {
  let clock = 0;
  t.mock.method(performance, "now", () => clock);
  const chunks = [
    [40, sse({ id: "completion-123", choices: [{ delta: { role: "assistant" } }] })],
    [120, sse({ choices: [{ delta: { reasoning_content: "think" } }] })],
    [150, sse({ choices: [{ delta: { content: "answer" }, finish_reason: "stop" }], usage: {
      completion_tokens: 2, pd: { recv_ms: 70, compute_wait_ms: 0.02, slot_in_use_at_alloc: 0, inject_ms: -1, secret: body.apiKey },
    } }) + "data: [DONE]\n\n"],
  ];
  t.mock.method(globalThis, "fetch", async () => {
    clock = 25;
    return new Response(new ReadableStream({ pull(controller) {
      const [ms, text] = chunks.shift(); clock = ms;
      controller.enqueue(new TextEncoder().encode(text));
      if (!chunks.length) controller.close();
    } }, { highWaterMark: 0 }), { headers: { "x-request-id": "trace-123" } });
  });
  const events = [];
  await pipeChat(body, (event) => events.push(event), new AbortController().signal);
  const d = events.filter((e) => e.type === "diagnostics").at(-1).diagnostics;
  assert.equal(d.upstreamHeadersMs, 25);
  assert.equal(d.upstreamFirstByteMs, 40);
  assert.equal(d.upstreamTtftMs, 120);
  assert.equal(d.requestId, "trace-123");
  assert.equal(d.completionId, "completion-123");
  assert.equal(d.attempts, 1);
  assert.deepEqual(d.providerTiming, { recv_ms: 70, compute_wait_ms: 0.02, slot_in_use_at_alloc: 0 });
  assert.ok(!JSON.stringify(events).includes(body.apiKey));
  assert.equal(events.at(-1).type, "done", "diagnostics arrive before finalization");
});

test("only an explicit usage-option rejection is retried, and attempts remain visible", async (t) => {
  for (const [message, expectedAttempts] of [["Invalid temperature", 1], ["Unsupported stream_options.include_usage", 2]]) {
    const payloads = [];
    t.mock.method(globalThis, "fetch", async (_url, init) => {
      payloads.push(JSON.parse(init.body));
      if (payloads.length === 1) return Response.json({ error: { message } }, { status: 422 });
      return new Response(sse({ choices: [{ delta: { content: "ok" }, finish_reason: "stop" }] }));
    });
    const events = [];
    await pipeChat(body, (event) => events.push(event), new AbortController().signal);
    assert.equal(payloads.length, expectedAttempts);
    assert.equal(events.filter((e) => e.type === "diagnostics").at(-1).diagnostics.attempts, expectedAttempts);
    assert.equal(events.at(-1).type, expectedAttempts === 1 ? "error" : "done");
    if (expectedAttempts === 2) assert.equal(payloads[1].stream_options, undefined);
    t.mock.restoreAll();
  }
});

test("Cloudflare uses the shared stream, preserves CORS/UA and reports ticket preparation separately", async (t) => {
  let clock = 0;
  t.mock.method(performance, "now", () => clock);
  t.mock.method(globalThis, "fetch", async (url, init) => {
    if (String(url).endsWith("/worker-ticket")) {
      clock = 50;
      return Response.json({ body, quotaRemaining: 4 });
    }
    assert.match(init.headers["user-agent"], /Mozilla/);
    clock = 75;
    return new Response(sse({ id: body.apiKey, choices: [{ delta: { content: "<think>reason</think>answer" }, finish_reason: "stop" }] }), {
      headers: { "x-request-id": body.apiKey },
    });
  });
  const res = await worker.fetch(new Request("https://chat.test/chat", {
    method: "POST", body: JSON.stringify({ ticket: "test-ticket", body: {} }),
  }), { TOKRACE_APP_ORIGIN: "https://app.test", TOKRACE_WORKER_TOKEN: "worker-secret", TOKRACE_ALLOWED_ORIGIN: "https://app.test" });
  assert.equal(res.headers.get("access-control-allow-origin"), "https://app.test");
  assert.equal(res.headers.get("x-quota-remaining"), "4");
  const raw = await res.text();
  const events = raw.trim().split("\n\n").map((line) => JSON.parse(line.slice(5)));
  assert.equal(events[0].diagnostics.transport, "cloudflare");
  assert.equal(events[0].diagnostics.proxyPrepareMs, 50);
  assert.equal(events[0].diagnostics.attempts, 0, "SSE is open before upstream starts");
  const delta = events.find((e) => e.type === "delta");
  assert.equal(delta.reasoning, "reason");
  assert.equal(delta.text, "answer");
  assert.equal(delta.ts, 25, "upstream clock excludes ticket exchange");
  assert.ok(!raw.includes(body.apiKey));
});

test("Anthropic timing metadata does not change thinking, usage or authentication", async (t) => {
  t.mock.method(globalThis, "fetch", async (url, init) => {
    assert.equal(url, "https://provider.test/v1/messages");
    assert.equal(init.headers["x-api-key"], body.apiKey);
    assert.equal(JSON.parse(init.body).max_tokens, 32000);
    return new Response([
      { type: "message_start", message: { id: "msg_test", usage: { input_tokens: 5 } } },
      { type: "content_block_delta", delta: { type: "thinking_delta", thinking: "reason" } },
      { type: "content_block_delta", delta: { type: "text_delta", text: "answer" } },
      { type: "message_delta", usage: { output_tokens: 8 }, delta: { stop_reason: "end_turn" } },
      { type: "message_stop" },
    ].map(sse).join(""), { headers: { "request-id": "req_test" } });
  });
  const events = [];
  await pipeChat({ ...body, kind: "anthropic" }, (e) => events.push(e), new AbortController().signal);
  assert.deepEqual(events.filter((e) => e.type === "delta").map(({ ts, ...e }) => e), [
    { type: "delta", reasoning: "reason" }, { type: "delta", text: "answer" },
  ]);
  assert.equal(events.filter((e) => e.type === "usage").at(-1).outputTokens, 8);
  const timing = events.filter((e) => e.type === "diagnostics").at(-1).diagnostics;
  assert.equal(timing.requestId, "req_test");
  assert.equal(timing.completionId, "msg_test");
  assert.equal(events.at(-1).finishReason, "end_turn");
});
