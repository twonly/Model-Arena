import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

// 守卫：Cloudflare Worker 与 Vercel 路由必须共用 lib/ 的同一份 anthropic / SSRF 逻辑。
// 以前两边各抄一份导致 max_tokens 默认值漂移（32000 vs 4096）、thinking 归一化逻辑分叉。
// 本测试在 `npm test` 里盯住「不准再抄回去」。
const workerUrl = new URL("../cloudflare/chat-worker/src/index.js", import.meta.url);
const workerSrc = await readFile(workerUrl, "utf8");

test("worker imports shared modules from lib/", () => {
  assert.match(workerSrc, /from "\.\.\/\.\.\/\.\.\/lib\/private-host\.ts"/);
  assert.match(workerSrc, /from "\.\.\/\.\.\/\.\.\/lib\/anthropic\.ts"/);
});

test("worker does not re-define forked copies", () => {
  assert.doesNotMatch(workerSrc, /const PRIVATE_HOST_RE\s*=/);
  assert.doesNotMatch(workerSrc, /function normalizeAnthropicThinkingPayload/);
  assert.doesNotMatch(workerSrc, /function anthropicThinkingMaxTokenErrorMessage/);
  // 旧分叉里 anthropic 默认 max_tokens 硬编码 4096——不准再出现裸字面量。
  assert.doesNotMatch(workerSrc, /\?\?\s*4096/);
});

test("worker's relative import paths resolve to real files", () => {
  for (const rel of ["../../../lib/private-host.ts", "../../../lib/anthropic.ts"]) {
    const target = fileURLToPath(new URL(`../cloudflare/chat-worker/src/${rel}`, import.meta.url));
    assert.ok(existsSync(target), `worker import target missing: ${rel}`);
  }
});

test("shared lib modules export the symbols the worker imports", async () => {
  const anthropic = await import("../lib/anthropic.ts");
  assert.equal(typeof anthropic.DEFAULT_ANTHROPIC_MAX_TOKENS, "number");
  assert.equal(typeof anthropic.normalizeAnthropicThinkingPayload, "function");
  assert.equal(typeof anthropic.anthropicThinkingMaxTokenErrorMessage, "function");
  const { PRIVATE_HOST_RE } = await import("../lib/private-host.ts");
  assert.ok(PRIVATE_HOST_RE instanceof RegExp);
  // 两条通路从此共享同一个默认值——锁住它，漂移就会让测试变红。
  assert.equal(anthropic.DEFAULT_ANTHROPIC_MAX_TOKENS, 32000);
});
