import assert from "node:assert/strict";
import test from "node:test";

import { runEndpoint } from "../lib/runner.ts";
import { buildSnapshot } from "../lib/share.ts";

test("shared model chat requests include the current auth header", async () => {
  const originalFetch = globalThis.fetch;
  let capturedHeaders = {};

  globalThis.fetch = async (_url, init = {}) => {
    capturedHeaders = Object.fromEntries(new Headers(init.headers).entries());
    return new Response(
      'data: {"type":"delta","text":"hello"}\n\ndata: {"type":"usage","promptTokens":-1,"outputTokens":"invalid"}\n\ndata: {"type":"done"}\n\n',
      {
        status: 200,
        headers: {
          "Content-Type": "text/event-stream",
          "X-Quota-Remaining": "14",
        },
      },
    );
  };

  try {
    let state = {
      status: "idle",
      text: "",
      reasoning: "",
      metrics: null,
      samples: [],
    };
    await runEndpoint({
      endpoint: {
        id: "deepseek-flash",
        name: "DeepSeek V4 Flash",
        kind: "openai",
        baseUrl: "",
        apiKey: "",
        model: "deepseek-v4-flash",
        enabled: true,
        shared: true,
      },
      prompt: "hello",
      params: { systemPrompt: "", temperature: "", maxTokens: "" },
      signal: new AbortController().signal,
      update(fn) {
        state = fn(state);
      },
      onSettled() {},
      runId: "run-auth-test",
      onQuota() {},
      authHeaders: async () => ({ Authorization: "Bearer user-token" }),
    });

    assert.equal(capturedHeaders.authorization, "Bearer user-token");
    assert.equal(state.metrics.promptTokens, undefined);
    assert.equal(state.metrics.official, false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("client waiting stays separate from proxy speed and survives snapshots and errors", async (t) => {
  let clock = 0;
  t.mock.method(performance, "now", () => clock);
  const frames = [
    [200, [{ type: "diagnostics", diagnostics: { proxyPrepareMs: 10 } }]],
    [300, [{ type: "delta", reasoning: "R", ts: 100 }]],
    [330, [{ type: "delta", text: "A", ts: 120 }]],
    [360, [{ type: "delta", text: "B", ts: 180 },
      { type: "diagnostics", diagnostics: { upstreamTtftMs: 100, requestId: "trace-id", attempts: 1 } },
      { type: "usage", outputTokens: 3, reasoningTokens: 1 }, { type: "done" }]],
  ];
  t.mock.method(globalThis, "fetch", async (url) => {
    if (url === "/api/chat/session") return Response.json({ default: "vercel", match: [] });
    clock = 80;
    return new Response(new ReadableStream({ pull(controller) {
      const [ms, events] = frames.shift(); clock = ms;
      controller.enqueue(new TextEncoder().encode(events.map((e) => `data: ${JSON.stringify(e)}\n\n`).join("")));
      if (!frames.length) controller.close();
    } }, { highWaterMark: 0 }));
  });
  let state = { status: "idle", reasoning: "", text: "", metrics: null, samples: [] };
  const options = {
    endpoint: { id: "m", model: "m", name: "m", baseUrl: "https://test.test", apiKey: "key", kind: "openai" },
    prompt: "hello", params: {}, signal: new AbortController().signal,
    authHeaders: async () => { clock = 50; return {}; },
    update: (fn) => { state = fn(state); }, onSettled() {},
  };
  await runEndpoint(options);
  assert.equal(state.metrics.ttftMs, 100);
  assert.equal(state.metrics.contentMs, 60);
  assert.equal(state.metrics.contentTps, 2 / 0.06);
  assert.deepEqual(state.metrics.diagnostics, {
    clientPrepareMs: 50, clientHeadersMs: 80, proxyPrepareMs: 10, clientTtftMs: 300,
    ttftSource: "proxy", clientFirstContentMs: 330, upstreamTtftMs: 100, requestId: "trace-id", attempts: 1,
  });
  const snap = buildSnapshot({ title: "test", notes: "", prompt: "hello", watermark: "", thinkingStats: true, rows: [{ name: "m", model: "m", run: state }] });
  assert.deepEqual(snap.results[0].metrics.diagnostics, state.metrics.diagnostics);

  clock = 0;
  frames.push([100, [{ type: "diagnostics", diagnostics: { requestId: "failed-id", attempts: 1 } }, { type: "error", message: "provider failed" }]]);
  await runEndpoint(options);
  assert.equal(state.status, "error");
  assert.equal(state.metrics.diagnostics.requestId, "failed-id");
  assert.equal(state.metrics.ttftMs, undefined, "failure must not invent a token");
});
