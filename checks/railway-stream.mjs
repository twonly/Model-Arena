// BETA_PROBE_TOKEN=<secret> node checks/railway-stream.mjs https://<beta-host>
import assert from "node:assert/strict";

const origin = new URL(process.argv[2]).origin;
const token = process.env.BETA_PROBE_TOKEN;
assert.ok(token, "BETA_PROBE_TOKEN is required");
const started = Date.now();
const response = await fetch(`${origin}/api/chat`, {
  method: "POST", headers: { "Content-Type": "application/json" },
  signal: AbortSignal.timeout(390_000),
  body: JSON.stringify({ kind: "openai", baseUrl: `${origin}/api/beta-probe`, apiKey: token, model: "synthetic-330s", prompt: "probe" }),
});
assert.equal(response.status, 200);
const decoder = new TextDecoder();
let buffer = "", heartbeats = 0, firstTokenMs, finished = false, transport;
for await (const bytes of response.body) {
  buffer += decoder.decode(bytes, { stream: true });
  const frames = buffer.split("\n\n");
  buffer = frames.pop();
  for (const frame of frames) {
    if (!frame.startsWith("data:")) continue;
    const event = JSON.parse(frame.slice(5));
    if (event.type === "error") throw new Error(event.message);
    if (event.type === "diagnostics") transport = event.diagnostics.transport;
    if (event.type === "heartbeat") {
      heartbeats++;
      if (heartbeats % 4 === 0) console.log(JSON.stringify({ elapsedSeconds: (Date.now() - started) / 1000, heartbeats }));
    }
    if (event.type === "delta" && event.text) firstTokenMs ??= Date.now() - started;
    if (event.type === "done") { assert.ok(!event.truncated); finished = true; }
  }
}
assert.equal(transport, "railway");
assert.ok(heartbeats >= 20);
assert.ok(firstTokenMs >= 330_000);
assert.ok(finished, "missing final done event");
console.log(JSON.stringify({ ok: true, synthetic: true, origin, transport, elapsedMs: Date.now() - started, firstTokenMs, heartbeats }));
