import assert from "node:assert/strict";
import test from "node:test";
import { startChat, resumeChat, stopChat } from "../lib/chat-resume.ts";
import { chatEvents } from "../lib/chat-events.ts";

const signal = () => new AbortController().signal;
const frame = (event) => new TextEncoder().encode(`data: ${JSON.stringify(event)}\n\n`);
const parse = (bytes) => JSON.parse(new TextDecoder().decode(bytes).trim().slice(5));

test("same upstream survives disconnect, replays only unacknowledged events, and rotates connections", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  let send, upstream, finish, calls = 0;
  const token = startChat(async (emit, s) => {
    send = emit; upstream = s; calls++;
    await new Promise((resolve) => { finish = resolve; });
  });
  t.after(() => { stopChat(token); finish(); });
  send({ type: "delta", text: "A", ts: 100 });
  const first = resumeChat(token, 0, signal()).body.getReader();
  assert.equal(parse((await first.read()).value).text, "A");
  await first.cancel();
  t.mock.timers.tick(120_000); // Longer than the previous 90-second retention.
  assert.equal(upstream.aborted, false);
  send({ type: "delta", text: "B", ts: 1000 });
  assert.equal(resumeChat("wrong", 1, signal()).status, 410);
  assert.equal(resumeChat(token, 100, signal()).status, 409);
  const second = resumeChat(token, 1, signal()).body.getReader();
  assert.deepEqual(parse((await second.read()).value), { type: "delta", text: "B", ts: 1000, seq: 2 });
  t.mock.timers.tick(45_000);
  assert.equal(parse((await second.read()).value).type, "rotate");
  assert.equal((await second.read()).done, true);
  assert.equal(upstream.aborted, false);
  const last = resumeChat(token, 2, signal()).body.getReader();
  assert.equal(new TextDecoder().decode((await last.read()).value), ": connected\n\n");
  send({ type: "done" });
  assert.equal(parse((await last.read()).value).type, "done");
  assert.equal((await last.read()).done, true);
  assert.equal(calls, 1);
  t.mock.timers.tick(30 * 60_000);
  assert.equal(upstream.aborted, true);
  assert.equal(resumeChat(token, 3, signal()).status, 410);
});

test("explicit stop aborts upstream and buffer capacity fails visibly", async () => {
  let upstream;
  const token = startChat(async (_emit, s) => { upstream = s; await new Promise((r) => s.addEventListener("abort", r)); });
  assert.equal(stopChat(token), true);
  assert.equal(upstream.aborted, true);
  const full = startChat(async (emit) => { emit({ type: "delta", text: "x".repeat(8 * 1024 * 1024) }); });
  const event = parse((await resumeChat(full, 0, signal()).body.getReader().read()).value);
  assert.equal(event.type, "error");
  assert.match(event.message, /缓冲上限/);
  stopChat(full);
});

test("browser retries GET with cursor, deduplicates replay, and cancels the job on finish", async (t) => {
  const requests = [];
  t.mock.method(globalThis, "fetch", async (url, init) => {
    requests.push({ url, method: init?.method ?? "GET", token: new Headers(init?.headers).get("x-chat-stream") });
    if (init?.method === "DELETE") return new Response(null, { status: 204 });
    return new Response(new ReadableStream({ start(c) {
      c.enqueue(frame({ type: "delta", text: "A", seq: 1 }));
      c.enqueue(frame({ type: "delta", text: "B", seq: 2 }));
      c.enqueue(frame({ type: "done", seq: 3 })); c.close();
    } }));
  });
  let pulls = 0;
  const initial = new Response(new ReadableStream({ pull(c) {
    if (pulls++ === 0) c.enqueue(frame({ type: "delta", text: "A", seq: 1 }));
    else c.error(new TypeError("network error"));
  } }, { highWaterMark: 0 }), { headers: { "X-Chat-Stream": "private-token" } });
  const events = [];
  for await (const event of chatEvents(initial, signal())) events.push(event);
  assert.equal(events.filter((e) => e.type === "delta").map((e) => e.text).join(""), "AB");
  assert.equal(events.at(-1).type, "done");
  assert.deepEqual(requests.map((r) => [r.method, r.url]), [["GET", "/api/chat?after=1"], ["DELETE", "/api/chat"]]);
  assert.ok(requests.every((r) => r.token === "private-token"));
});

test("manual browser stop cancels the retained job without starting another request", async (t) => {
  const ctrl = new AbortController(), methods = [];
  t.mock.method(globalThis, "fetch", async (_url, init) => { methods.push(init.method); return new Response(null, { status: 204 }); });
  const response = new Response(new ReadableStream({ start(c) {
    c.enqueue(frame({ type: "delta", text: "A", seq: 1 }));
    ctrl.signal.addEventListener("abort", () => c.error(ctrl.signal.reason));
  } }), { headers: { "X-Chat-Stream": "stop-token" } });
  await assert.rejects(async () => {
    for await (const event of chatEvents(response, ctrl.signal)) {
      assert.equal(event.text, "A"); ctrl.abort();
    }
  }, { name: "AbortError" });
  assert.deepEqual(methods, ["DELETE"]);
});
