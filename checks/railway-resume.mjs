// BETA_PROBE_TOKEN=<secret> node checks/railway-resume.mjs https://www.tokrace.com
// Real Chromium + the production client parser. No paid model or shared quota.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";
import { chromium } from "playwright";

const origin = new URL(process.argv[2]).origin;
const token = process.env.BETA_PROBE_TOKEN;
assert.ok(token);
const code = ts.transpileModule(await readFile(new URL("../lib/chat-events.ts", import.meta.url), "utf8"), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
}).outputText.replace("export async function*", "async function*");
const browser = await chromium.launch({ headless: true });
try {
  const receipts = await Promise.all([true, false].map(async (active) => {
    const page = await browser.newPage();
    page.on("console", (message) => { if (message.text().startsWith("probe-progress ")) console.log(message.text()); });
    await page.goto(`${origin}/zh-CN/arena`, { waitUntil: "domcontentloaded", timeout: 60_000 });
    return page.evaluate(async ({ code, token, active }) => {
      const started = Date.now(), nativeFetch = window.fetch.bind(window);
      let cut = false, postCount = 0, resumeCount = 0, nextProgress = 60;
      // Cut a real downstream response once at 160s; server must keep the upstream alive.
      window.fetch = async (...args) => {
        if (args[1]?.method === "POST") postCount++;
        const response = await nativeFetch(...args);
        if (!active || cut || !response.body || args[1]?.method === "DELETE") return response;
        const reader = response.body.getReader();
        let timer;
        return new Response(new ReadableStream({
          start(controller) {
            timer = setTimeout(() => {
              cut = true;
              controller.error(new TypeError("network error (injected at 160s)"));
              void reader.cancel();
            }, Math.max(1, 160_000 - (Date.now() - started)));
          },
          async pull(controller) {
            try {
              const chunk = await reader.read();
              if (chunk.done) { clearTimeout(timer); controller.close(); }
              else controller.enqueue(chunk.value);
            } catch { clearTimeout(timer); }
          },
          async cancel() { clearTimeout(timer); await reader.cancel(); },
        }), { headers: response.headers, status: response.status });
      };
      const events = new Function(`${code}; return chatEvents;`)();
      const response = await fetch("/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json", "X-Chat-Resume": "1" },
        body: JSON.stringify({ kind: "openai", baseUrl: `${location.origin}/api/beta-probe`, apiKey: token,
          model: active ? "synthetic-stream-330s" : "synthetic-330s", prompt: "probe" }),
      });
      if (response.status !== 200 || !response.headers.get("x-chat-stream")) throw new Error(`Resumable endpoint not ready: ${response.status}`);
      let reasoning = "", text = "", transport, done = false, heartbeats = 0, attempts;
      for await (const event of events(response, AbortSignal.timeout(420_000))) {
        const elapsed = (Date.now() - started) / 1000;
        if (elapsed >= nextProgress) { console.log("probe-progress " + JSON.stringify({ active, seconds: Math.round(elapsed), resumeCount, cut })); nextProgress += 60; }
        if (event.type === "error") throw new Error(event.message);
        if (event.type === "diagnostics") {
          transport = event.diagnostics.transport ?? transport;
          resumeCount = event.diagnostics.streamResumes ?? resumeCount;
          attempts = event.diagnostics.attempts ?? attempts;
        }
        if (event.type === "delta") { reasoning += event.reasoning ?? ""; text += event.text ?? ""; }
        if (event.type === "heartbeat") heartbeats++;
        if (event.type === "done") { if (event.truncated) throw new Error("truncated"); done = true; }
      }
      const expected = active ? Array.from({ length: 330 }, (_, i) => `[${i}]${"x".repeat(1000)}\n`).join("") : "";
      return { active, elapsedMs: Date.now() - started, cut, postCount, resumeCount, transport, attempts, done, heartbeats,
        exactReplay: reasoning === expected, reasoningChars: reasoning.length, text };
    }, { code, token, active });
  }));
  for (const receipt of receipts) {
    assert.equal(receipt.transport, "railway");
    assert.equal(receipt.done, true);
    assert.equal(receipt.postCount, 1);
    assert.equal(receipt.attempts, 1);
    assert.equal(receipt.exactReplay, true);
    assert.equal(receipt.cut, receipt.active);
    assert.ok(receipt.elapsedMs >= 330_000);
    assert.ok(receipt.resumeCount >= 7);
    assert.ok(receipt.heartbeats >= 20);
  }
  console.log(JSON.stringify({ ok: true, synthetic: true, origin, receipts }, null, 2));
} finally {
  await browser.close();
}
