import assert from "node:assert/strict";
import test from "node:test";

import { runEndpoint } from "../lib/runner.ts";
import { buildSnapshot } from "../lib/share.ts";
import { estimateTokens } from "../lib/tokens.ts";

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

test("network failure preserves partial text, timing, and edge request ID without claiming a cause", async (t) => {
  let pulls = 0, state = { status: "idle", text: "", reasoning: "", metrics: null, samples: [] }, settled = 0;
  t.mock.method(globalThis, "fetch", async () => new Response(new ReadableStream({ pull(c) {
    if (pulls++ === 0) c.enqueue(new TextEncoder().encode('data: {"type":"delta","reasoning":"partial thought","ts":123}\n\n'));
    else c.error(new TypeError("network error"));
  } }, { highWaterMark: 0 }), { headers: { "x-railway-request-id": "edge-id" } }));
  await runEndpoint({
    endpoint: { id: "m", model: "m", name: "m", baseUrl: "https://test.test", apiKey: "key", kind: "openai" },
    prompt: "hello", params: {}, signal: new AbortController().signal, authHeaders: async () => ({}),
    update: (fn) => { state = fn(state); }, onSettled: () => { settled++; },
  });
  assert.equal(state.status, "error");
  assert.equal(state.reasoning, "partial thought");
  assert.equal(state.metrics.ttftMs, 123);
  assert.ok(state.metrics.outputTokens > 0);
  assert.equal(state.metrics.diagnostics.proxyRequestId, "edge-id");
  assert.doesNotMatch(state.error, /与模型厂商无关/);
  assert.equal(settled, 1);
});

test("buffered catch-up uses upstream timestamps for speed samples instead of inflating peak TPS", async (t) => {
  let clock = 0;
  t.mock.method(performance, "now", () => clock);
  const delta = (ts) => ({ type: "delta", text: "A ", ts });
  const frames = [[1000, [delta(1000)]], [2000, [delta(2000)]],
    [40000, Array.from({ length: 37 }, (_, i) => delta((i + 3) * 1000))],
    [41000, [delta(40000), { type: "done" }]]];
  t.mock.method(globalThis, "fetch", async () => new Response(new ReadableStream({ pull(c) {
    const [ms, events] = frames.shift(); clock = ms;
    c.enqueue(new TextEncoder().encode(events.map((event) => `data: ${JSON.stringify(event)}\n\n`).join("")));
    if (!frames.length) c.close();
  } }, { highWaterMark: 0 })));
  let state = { status: "idle", text: "", reasoning: "", metrics: null, samples: [] };
  await runEndpoint({
    endpoint: { id: "m", model: "m", name: "m", baseUrl: "https://test.test", apiKey: "key", kind: "openai" },
    prompt: "hello", params: {}, signal: new AbortController().signal, authHeaders: async () => ({}),
    update: (fn) => { state = fn(state); }, onSettled() {},
  });
  assert.equal(state.status, "done");
  assert.equal(state.metrics.contentMs, 39000);
  assert.ok(state.metrics.peakTps <= 2, "37 seconds of replay must not become a one-second speed spike");
  assert.deepEqual(state.samples.map((sample) => sample.t), [1000, 2000, 3000, 40000]);
});

test("fragmented thinking never invents content tokens and estimates agree across phases", async (t) => {
  let clock = 0, state = { status: "idle", text: "", reasoning: "", metrics: null, samples: [] };
  t.mock.method(performance, "now", () => clock);
  const events = [...Array.from({ length: 45 }, () => ({ type: "delta", reasoning: "汉" })),
    ...Array.from({ length: 7 }, () => ({ type: "delta", text: "a" })), { type: "done" }];
  const live = [];
  t.mock.method(globalThis, "fetch", async () => new Response(new ReadableStream({ pull(c) {
    clock += 100;
    c.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ ...events.shift(), ts: clock })}\n\n`));
    if (!events.length) c.close();
  } }, { highWaterMark: 0 })));
  await runEndpoint({
    endpoint: { id: "m", model: "m", name: "m", baseUrl: "https://test.test", apiKey: "key", kind: "openai" },
    prompt: "hello", params: {}, signal: new AbortController().signal, authHeaders: async () => ({}),
    update: (fn) => { state = fn(state); if (["thinking", "streaming"].includes(state.status)) live.push(state); }, onSettled() {},
  });
  for (const sample of live) {
    assert.equal(sample.liveReasoningTokens, estimateTokens(sample.reasoning));
    assert.equal(sample.liveTokens - sample.liveReasoningTokens, estimateTokens(sample.text));
  }
  assert.equal(live.filter((s) => s.status === "thinking").at(-1).liveTokens, 32);
  assert.equal(live.find((s) => s.status === "streaming").liveTps, 0, "first content cannot inherit thinking speed");
  assert.equal(state.metrics.reasoningTokens, 32);
  assert.equal(state.metrics.contentTokens, 2);
});

test("refresh resumes from a saved checkpoint without POST, duplicate output or reset timing", async (t) => {
  const { emptyRun } = await import("../lib/types.ts");
  let state = emptyRun(), cursor;
  const requests = [];
  const before = {
    token: "a".repeat(64), after: 2, startedAt: Date.now() - 600000,
    reasoning: "earlier thought", text: "", tFirst: 100, tFirstReasoning: 100, tLastReasoning: 200,
    diagnostics: { attempts: 1, clientTtftMs: 150, ttftSource: "proxy" },
    usage: {}, samples: [], checkpoints: [{ t: 200, tok: 4 }],
  };
  t.mock.method(globalThis, "fetch", async (url, init = {}) => {
    requests.push([url, init.method ?? "GET"]);
    if (init.method === "DELETE") return new Response(null, { status: 204 });
    assert.equal(url, "/api/chat?after=2");
    assert.equal(new Headers(init.headers).get("x-chat-stream"), before.token);
    return new Response([
      { type: "delta", reasoning: "earlier thought", seq: 2, ts: 200 },
      { type: "delta", reasoning: " continued", seq: 3, ts: 600000 },
      { type: "delta", text: "answer", seq: 4, ts: 600100 },
      { type: "usage", outputTokens: 120, reasoningTokens: 100, seq: 5 },
      { type: "done", seq: 6 },
    ].map((event) => `data: ${JSON.stringify(event)}\n\n`).join(""));
  });
  await runEndpoint({
    endpoint: { id: "m", model: "m", name: "m", baseUrl: "", apiKey: "", kind: "openai" },
    prompt: "", params: {}, resume: before, signal: new AbortController().signal,
    authHeaders: () => { throw new Error("resume must not request auth or a new upstream"); },
    update: (fn) => { state = fn(state); }, onSettled() {},
    onCheckpoint: (checkpoint) => { cursor = structuredClone(checkpoint); },
  });
  assert.equal(state.status, "done");
  assert.equal(state.reasoning, "earlier thought continued");
  assert.equal(state.text, "answer");
  assert.equal(state.metrics.thinkingMs, 599900);
  assert.equal(state.metrics.outputTokens, 120);
  assert.equal(state.metrics.diagnostics.clientTtftMs, 150);
  assert.ok(state.metrics.totalMs >= 600000);
  assert.equal(cursor.after, 6);
  assert.deepEqual(requests.map((x) => x[1]), ["GET", "DELETE"]);

  t.mock.method(globalThis, "fetch", async () => new Response("service restarted", { status: 410 }));
  await runEndpoint({
    endpoint: { id: "m" }, prompt: "", params: {}, resume: before,
    signal: new AbortController().signal, update: (fn) => { state = fn(state); }, onSettled() {},
  });
  assert.equal(state.status, "error");
  assert.equal(state.reasoning, "earlier thought");
  assert.match(state.error, /service restarted/);
});
