import assert from "node:assert/strict";
import test from "node:test";
import { pipeChat } from "../lib/chat-stream.ts";
import { checkUpstreamUrl } from "../lib/upstream-guard.ts";
import { rateLimitByKey } from "../lib/ratelimit.ts";
import { POST as probe } from "../app/api/beta-probe/chat/completions/route.ts";

test("Railway retains hosted guards and beta probe requires its own secret", async (t) => {
  const saved = { ...process.env };
  t.after(() => { process.env = saved; });
  delete process.env.VERCEL;
  process.env.RAILWAY_SERVICE_ID = "test-railway";
  assert.ok(checkUpstreamUrl("http://127.0.0.1:8080"));
  assert.ok(checkUpstreamUrl("http://service.railway.internal"));
  assert.equal(checkUpstreamUrl("https://api.example.com/v1"), null);
  assert.equal(rateLimitByKey("railway-test", 1), null);
  assert.ok(rateLimitByKey("railway-test", 1));
  process.env.BETA_PROBE_TOKEN = "test-secret";
  delete process.env.TOKRACE_BETA;
  delete process.env.TOKRACE_STREAM_PROBE;
  const req = new Request("https://beta.test/api/beta-probe/chat/completions", { method: "POST" });
  assert.equal((await probe(req)).status, 404);
  process.env.TOKRACE_BETA = "1";
  assert.equal((await probe(req)).status, 401);
  delete process.env.TOKRACE_BETA;
  process.env.TOKRACE_STREAM_PROBE = "1";
  assert.equal((await probe(req)).status, 401);
  delete process.env.BETA_PROBE_TOKEN;
  assert.equal((await probe(req)).status, 404);
});

test("idle upstream gets heartbeats without fake TTFT and releases timer on finish", async (t) => {
  t.mock.timers.enable({ apis: ["setInterval"] });
  let finish;
  t.mock.method(globalThis, "fetch", () => new Promise((resolve) => { finish = resolve; }));
  const events = [];
  const signal = new AbortController().signal;
  const pending = pipeChat({ kind: "openai", baseUrl: "https://provider.test/v1", model: "probe", apiKey: "test", prompt: "test" },
    (event) => events.push(event), signal, { transport: "railway" });
  t.mock.timers.tick(30_000);
  assert.equal(events.filter((e) => e.type === "heartbeat").length, 2);
  assert.ok(events.every((e) => e.type !== "delta"));
  assert.equal(events[0].diagnostics.upstreamTtftMs, undefined);
  finish(new Response('data: {"choices":[{"delta":{"content":"ok"},"finish_reason":"stop"}]}\n\ndata: [DONE]\n\n'));
  await pending;
  assert.equal(events.at(-1).type, "done");
  const count = events.length;
  t.mock.timers.tick(30_000);
  assert.equal(events.length, count);
});
