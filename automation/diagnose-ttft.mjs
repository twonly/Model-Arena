// Run: node --env-file=.env.local automation/diagnose-ttft.mjs
// Offline check: node automation/diagnose-ttft.mjs --self-test
// DIAG_ROUNDS=1..5 (default 3). Sequential paid calls; no automatic retries.
import assert from "node:assert/strict";
import https from "node:https";
import { mkdir, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const prompt = "请把字符串 'robotic-lewis' 逐个字符反转输出，并说明结果。";
const models = ["mimo-v2.6-pro-ultraspeed", "mimo-v2.6-pro"];
// Allow concurrent diagnostics without silently queuing them in this test client.
const agent = new https.Agent({ keepAlive: true, maxSockets: 6 });
export const closeConnections = () => agent.destroy();

function consumeLine(line, row, ms) {
  if (!line.startsWith("data:")) return;
  const data = line.slice(5).trim();
  if (data === "[DONE]") { row.complete = true; return; }
  let event;
  try { event = JSON.parse(data); } catch { return; }
  row.firstEventMs ??= ms;
  if (event.type === "diagnostics") row.diagnostics = { ...row.diagnostics, ...event.diagnostics };
  if (event.id) row.upstreamId = String(event.id);
  const delta = event.type === "delta" ? event : event.choices?.[0]?.delta;
  const reasoning = delta?.reasoning_content || delta?.reasoning;
  const content = delta?.content || delta?.text;
  if (reasoning || content) {
    row.firstTokenMs ??= ms;
    row.lastTokenMs = ms;
    row.deltaCount = (row.deltaCount || 0) + 1;
    if (typeof event.ts === "number") row.proxyFirstTokenMs ??= event.ts;
    if (content) row.firstContentMs ??= ms;
  }
  if (event.usage) row.usage = event.usage;
  if (event.type === "usage") {
    row.usage = { prompt_tokens: event.promptTokens, completion_tokens: event.outputTokens, reasoning_tokens: event.reasoningTokens };
  }
  if (event.type === "done") row.complete = !event.truncated;
  if (event.error || event.type === "error") row.streamError = true;
  if (event.choices?.[0]?.finish_reason) row.finishReason = event.choices[0].finish_reason;
}

export async function measure(route, model, round, key, testPrompt = prompt) {
  const direct = route === "direct";
  const body = JSON.stringify(direct
    ? { model, messages: [{ role: "user", content: testPrompt }], stream: true, stream_options: { include_usage: true } }
    : { kind: "openai", baseUrl: "https://api.xiaomimimo.com/v1", apiKey: key, model, prompt: testPrompt, systemPrompt: "", temperature: "", maxTokens: "" });
  const row = { round, route, model, at: new Date().toISOString() };
  const start = performance.now();
  const now = () => Math.round((performance.now() - start) * 10) / 10;
  let timer;
  await new Promise((resolve) => {
    const req = https.request(direct ? "https://api.xiaomimimo.com/v1/chat/completions" : "https://www.tokrace.com/api/chat", {
      method: "POST", agent,
      headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body), ...(direct ? { Authorization: `Bearer ${key}` } : {}) },
    }, (res) => {
      row.headersMs = now();
      row.status = res.statusCode;
      row.reusedSocket = req.reusedSocket;
      row.headers = Object.fromEntries(Object.entries(res.headers).filter(([name]) =>
        /^(x-request-id|request-id|x-mimo-request-id|x-amzn-requestid|traceparent|server-timing|x-envoy-upstream-service-time|server|x-vercel-id|cf-ray)$/.test(name)));
      res.setEncoding("utf8");
      let buffer = "";
      res.on("data", (chunk) => {
        const ms = now();
        row.firstByteMs ??= ms;
        // Only parse successful SSE. Do not persist response bodies or credentials.
        if (res.statusCode !== 200) return;
        buffer += chunk;
        let end;
        while ((end = buffer.indexOf("\n")) >= 0) {
          consumeLine(buffer.slice(0, end).replace(/\r$/, ""), row, ms);
          buffer = buffer.slice(end + 1);
        }
      });
      res.on("end", () => {
        if (buffer.trim()) consumeLine(buffer.trim(), row, now());
        row.totalMs = now();
        resolve();
      });
      res.on("error", () => { row.error ??= "RESPONSE_INTERRUPTED"; row.totalMs = now(); resolve(); });
    });
    req.on("socket", (socket) => {
      row.socketAssignedMs = now();
      if (!socket.connecting) return;
      socket.once("lookup", () => { row.dnsMs = now(); });
      socket.once("connect", () => { row.tcpMs = now(); });
      socket.once("secureConnect", () => { row.tlsMs = now(); });
    });
    req.on("finish", () => { row.sentMs = now(); });
    req.on("error", (error) => { row.error ??= error.code || "REQUEST_FAILED"; row.totalMs = now(); resolve(); });
    timer = setTimeout(() => { row.error = "TIMEOUT_60S"; req.destroy(); }, 60_000);
    req.end(body);
  });
  clearTimeout(timer);
  return row;
}

async function main() {
  const key = process.env.SHARED_KEY_XIAOMI;
  assert.ok(key, "SHARED_KEY_XIAOMI is required; use --env-file=.env.local");
  const rounds = Number(process.env.DIAG_ROUNDS || 3);
  assert.ok(Number.isInteger(rounds) && rounds >= 1 && rounds <= 5, "DIAG_ROUNDS must be 1..5");
  const output = `output/ttft-diagnosis-${new Date().toISOString().replaceAll(":", "-")}.json`;
  await mkdir("output", { recursive: true });
  const report = { prompt, keySource: "SHARED_KEY_XIAOMI", maxConcurrency: 1, retries: 0,
    notes: "Direct timestamps use the local clock. Proxy timestamps cover only proxy-to-upstream. Different egress locations; repeated prompts may benefit from provider caching. No provider queue-duration header means queueing cannot be proven.", results: [] };
  console.log(JSON.stringify({ output, requests: rounds * 4 }));
  try {
    for (let round = 1; round <= rounds; round++) {
      for (const model of round % 2 ? models : [...models].reverse()) {
        for (const route of round % 2 ? ["direct", "proxy"] : ["proxy", "direct"]) {
          const row = await measure(route, model, round, key);
          report.results.push(row);
          await writeFile(output, JSON.stringify(report, null, 2) + "\n");
          console.log(JSON.stringify(row));
          if (row.error || row.status !== 200 || row.streamError || !row.complete) {
            process.exitCode = 1;
            return; // Do not repeat authentication failures or ambiguous paid requests.
          }
        }
      }
    }
  } finally { agent.destroy(); }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
if (process.argv.includes("--self-test")) {
  const row = {};
  consumeLine(': keepalive', row, 10);
  consumeLine('data: {"choices":[{"delta":{"role":"assistant"}}]}', row, 20);
  consumeLine('data: {"choices":[{"delta":{"reasoning_content":"思考"}}]}', row, 80);
  consumeLine('data: {"choices":[{"delta":{"content":"回答"}}]}', row, 100);
  consumeLine('data: [DONE]', row, 110);
  assert.equal(row.firstEventMs, 20);
  assert.equal(row.firstTokenMs, 80);
  assert.equal(row.firstContentMs, 100);
  assert.equal(row.lastTokenMs, 100);
  assert.equal(row.complete, true);
  const proxy = {};
  consumeLine('data: {"type":"delta","reasoning":"思考","ts":75}', proxy, 150);
  consumeLine('data: {"type":"delta","text":"回答","ts":100}', proxy, 170);
  assert.equal(proxy.proxyFirstTokenMs, 75);
  assert.equal(proxy.firstTokenMs, 150);
  consumeLine('data: {"type":"done","truncated":true}', proxy, 180);
  assert.equal(proxy.complete, false);
  console.log("TTFT parser self-check passed");
  agent.destroy();
} else { await main(); }
}
