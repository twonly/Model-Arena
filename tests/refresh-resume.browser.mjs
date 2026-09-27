// node tests/refresh-resume.browser.mjs http://localhost:3114
// Real Chromium reload + real retained-job server, synthetic upstream (no model spend).
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { chromium } from "playwright";
import { startChat, resumeChat, stopChat } from "../lib/chat-resume.ts";
import { mkdir, writeFile } from "node:fs/promises";

const base = process.argv[2] || "http://localhost:3114";
let posts = 0, gets = 0, starts = 0, token, generated = 0;
const server = createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", new URL(base).origin);
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,X-Chat-Stream,X-Chat-Resume");
  res.setHeader("Access-Control-Allow-Methods", "POST,GET,DELETE,OPTIONS");
  res.setHeader("Access-Control-Expose-Headers", "X-Chat-Stream");
  if (req.method === "OPTIONS") { res.end(); return; }
  const ctrl = new AbortController();
  res.on("close", () => ctrl.abort());
  let response;
  if (req.method === "POST") {
    posts++;
    token = startChat(async (send, signal) => {
      starts++;
      for (let i = 0; i < 120 && !signal.aborted; i++) {
        generated = i + 1;
        send({ type: "delta", reasoning: `[${i}]`, ts: 100 + i * 100 });
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      send({ type: "delta", text: "Complete answer", ts: 12200 });
      send({ type: "usage", outputTokens: 130, reasoningTokens: 120 });
      send({ type: "done" });
    });
    response = resumeChat(token, 0, ctrl.signal);
  } else if (req.method === "DELETE") {
    stopChat(req.headers["x-chat-stream"]); res.statusCode = 204; res.end(); return;
  } else {
    gets++;
    response = resumeChat(req.headers["x-chat-stream"], Number(new URL(req.url, "http://localhost").searchParams.get("after")), ctrl.signal);
  }
  res.statusCode = response.status;
  for (const [key, value] of response.headers) res.setHeader(key, value);
  const reader = response.body.getReader();
  try {
    while (true) { const { value, done } = await reader.read(); if (done) break; res.write(value); }
  } finally { res.end(); }
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const backend = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(({ backend }) => {
    localStorage.setItem("ma.endpoints", JSON.stringify([{ id: "resume-test", name: "Refresh test", model: "refresh-model", kind: "openai", baseUrl: "https://example.test/v1", apiKey: "secret-test-only", enabled: true }]));
    localStorage.setItem("ma.graduatedShared", "1");
    const original = window.fetch.bind(window);
    window.fetch = (input, init) => {
      if (input === "/api/chat/session") return Promise.resolve(Response.json({ default: "vercel", match: [] }));
      if (typeof input === "string" && (input === "/api/chat" || input.startsWith("/api/chat?"))) return original(backend + input, init);
      if (typeof input === "string" && input.startsWith("/api/") && init?.method === "POST") return Promise.resolve(new Response(null, { status: 204 }));
      return original(input, init);
    };
  }, { backend });
  const saved = () => page.evaluate(() => JSON.parse(sessionStorage.getItem("ma.activeComparison.v1")));
  await page.goto(`${base}/zh-CN/arena`);
  await page.waitForFunction(() => document.querySelector('[aria-label="已选模型"]')?.textContent?.includes("Refresh test"));
  await page.getByRole("textbox", { name: "你的任务", exact: true }).fill("Refresh recovery test");
  await page.getByRole("button", { name: /开始对比/ }).first().click();
  await page.waitForFunction(() => JSON.parse(sessionStorage.getItem("ma.activeComparison.v1"))?.checkpoints?.["resume-test"]?.after >= 10);
  const first = await saved();
  assert.ok(!JSON.stringify(first).includes("secret-test-only"));
  await page.reload();
  await page.waitForFunction((old) => JSON.parse(sessionStorage.getItem("ma.activeComparison.v1"))?.checkpoints?.["resume-test"]?.after > old + 10, first.checkpoints["resume-test"].after);
  assert.equal(posts, 1);
  assert.ok(gets >= 1);
  await page.reload();
  await page.waitForFunction(() => JSON.parse(sessionStorage.getItem("ma.activeComparison.v1"))?.runs?.["resume-test"]?.status === "done");
  const final = (await saved()).runs["resume-test"];
  assert.equal(final.reasoning, Array.from({ length: 120 }, (_, i) => `[${i}]`).join(""));
  assert.equal(final.text, "Complete answer");
  assert.equal(final.metrics.reasoningTokens, 120);
  assert.equal(final.metrics.thinkingMs, 11900);
  assert.ok(final.elapsedMs >= 12000);
  assert.equal(posts, 1); assert.equal(starts, 1);
  await page.reload();
  await page.getByText("Complete answer", { exact: true }).waitFor();
  assert.equal(posts, 1, "completed test refresh is read-only");

  await page.getByRole("button", { name: /开始对比/ }).first().click();
  await page.waitForFunction(() => JSON.parse(sessionStorage.getItem("ma.activeComparison.v1"))?.checkpoints?.["resume-test"]?.after >= 10);
  const partial = (await saved()).checkpoints["resume-test"].reasoning;
  stopChat(token); // Simulate losing the server job during restart.
  await page.reload();
  await page.getByText(/原测试已不可用/).first().waitFor();
  const failed = (await saved()).runs["resume-test"];
  assert.equal(failed.status, "error");
  assert.ok(failed.reasoning.startsWith(partial));
  assert.equal(posts, 2); assert.equal(starts, 2);
  assert.deepEqual(errors, []);
  await mkdir("output/playwright", { recursive: true });
  await page.screenshot({ path: "output/playwright/refresh-resume.png", fullPage: true });
  const receipt = { ok: true, synthetic: true, base, refreshes: 4, posts, upstreamStarts: starts, gets, generated, exactReplay: true, restartPreservesContent: true, noStoredApiKey: true };
  await writeFile("output/playwright/refresh-resume.json", JSON.stringify(receipt, null, 2));
  console.log(receipt);
} finally {
  stopChat(token);
  await browser.close();
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
}
