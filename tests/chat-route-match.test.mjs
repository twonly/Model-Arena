import assert from "node:assert/strict";
import test from "node:test";

import {
  matchesCloudflare,
  resolveEndpointTransport,
  sanitizeCloudflareMatch,
} from "../lib/chat-route-match.ts";

const GLM_51 = {
  id: "glm-5-1",
  model: "glm-5.1",
  baseUrl: "https://open.bigmodel.cn/api/coding/paas/v4",
  name: "智谱 GLM-5.1",
};
const DEEPSEEK = {
  id: "deepseek-pro",
  model: "deepseek-v4-pro",
  baseUrl: "https://api.deepseek.com/v1",
  name: "DeepSeek V4 Pro",
};

test("sanitize drops empty/whitespace tokens (would match everything)", () => {
  assert.deepEqual(sanitizeCloudflareMatch(["", "  ", "glm-5"]), ["glm-5"]);
  // 空串/纯空白整体 → 空数组，绝不能产出 [""]
  assert.deepEqual(sanitizeCloudflareMatch([""]), []);
  assert.deepEqual(sanitizeCloudflareMatch("   "), []);
});

test("sanitize lowercases, dedupes, accepts comma/newline strings", () => {
  assert.deepEqual(sanitizeCloudflareMatch("GLM-5\nGLM-5, bigmodel.cn"), [
    "glm-5",
    "bigmodel.cn",
  ]);
  assert.deepEqual(sanitizeCloudflareMatch(123), []);
});

test("empty match never routes to cloudflare", () => {
  assert.equal(matchesCloudflare(GLM_51, []), false);
  assert.equal(matchesCloudflare(GLM_51, sanitizeCloudflareMatch([""])), false);
});

test("one token 'glm-5' catches both GLM models via id+model, misses others", () => {
  const m = sanitizeCloudflareMatch(["glm-5"]);
  assert.equal(matchesCloudflare(GLM_51, m), true);
  assert.equal(
    matchesCloudflare({ ...GLM_51, id: "glm-5-2", model: "glm-5.2" }, m),
    true
  );
  assert.equal(matchesCloudflare(DEEPSEEK, m), false);
});

test("baseUrl token routes a whole vendor", () => {
  const m = sanitizeCloudflareMatch(["bigmodel.cn"]);
  assert.equal(matchesCloudflare(GLM_51, m), true);
  assert.equal(matchesCloudflare(DEEPSEEK, m), false);
});

test("case-insensitive across fields (model glm-5.1 vs name GLM-5.1)", () => {
  assert.equal(matchesCloudflare(GLM_51, sanitizeCloudflareMatch(["GLM-5.1"])), true);
});

test("dot-vs-dash: 'glm-5.1' matches model not id; 'glm-5-1' matches id", () => {
  // model 是 glm-5.1（点），id 是 glm-5-1（横线）——两种写法都应能命中（各匹一个字段）
  assert.equal(matchesCloudflare(GLM_51, sanitizeCloudflareMatch(["glm-5.1"])), true);
  assert.equal(matchesCloudflare(GLM_51, sanitizeCloudflareMatch(["glm-5-1"])), true);
});

test("resolveEndpointTransport: rule wins over default, else falls back to default", () => {
  const plan = { default: "vercel", match: sanitizeCloudflareMatch(["glm-5"]) };
  assert.equal(resolveEndpointTransport(GLM_51, plan), "cloudflare");
  assert.equal(resolveEndpointTransport(DEEPSEEK, plan), "vercel");

  // 全局默认 cloudflare 时，未命中规则也走 CF
  const planAll = { default: "cloudflare", match: [] };
  assert.equal(resolveEndpointTransport(DEEPSEEK, planAll), "cloudflare");
});
