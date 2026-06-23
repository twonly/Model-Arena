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

test("array element containing commas is split into separate rules", () => {
  // 复现线上 bug：admin 把 "bigmodel,kimi" 存成单个数组元素，逗号没拆
  const m = sanitizeCloudflareMatch(["bigmodel,kimi"]);
  assert.deepEqual(m, ["bigmodel", "kimi"]);
  assert.equal(matchesCloudflare(GLM_51, m), true); // baseUrl 含 bigmodel
  assert.equal(
    matchesCloudflare({ id: "kimi", model: "kimi-for-coding", baseUrl: "https://api.kimi.com/coding/", name: "Kimi" }, m),
    true
  );
  // 修复前那种「整段字面量」才不会命中
  assert.equal(matchesCloudflare(GLM_51, ["bigmodel,kimi"]), false);
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

test("AND rule (a & b): both sub-tokens must match, distinguishes same model on different APIs", () => {
  const m = sanitizeCloudflareMatch("bigmodel.cn & glm-5.2");
  assert.deepEqual(m, ["bigmodel.cn & glm-5.2"]);
  // bigmodel 上的 glm-5.2 → 两个子词都命中
  assert.equal(
    matchesCloudflare({ ...GLM_51, id: "glm-5-2", model: "glm-5.2" }, m),
    true
  );
  // bigmodel 上的 glm-5.1 → 缺 glm-5.2，AND 不成立（这正是 OR 做不到的区分）
  assert.equal(matchesCloudflare(GLM_51, m), false);
  // 别的 API 上的 glm-5.2 → 缺 bigmodel.cn，AND 不成立
  assert.equal(
    matchesCloudflare({ id: "x", model: "glm-5.2", baseUrl: "https://api.other.com/v1", name: "Other GLM-5.2" }, m),
    false
  );
});

test("AND + OR mix: newline/comma separate OR rules, & is AND within a rule", () => {
  const m = sanitizeCloudflareMatch("bigmodel.cn & glm-5.2\ndeepseek");
  assert.deepEqual(m, ["bigmodel.cn & glm-5.2", "deepseek"]);
  assert.equal(matchesCloudflare(DEEPSEEK, m), true); // 命中第二条 OR 规则
  assert.equal(matchesCloudflare({ ...GLM_51, model: "glm-5.2" }, m), true); // 命中第一条 AND 规则
});

test("sanitize drops rules with no real sub-tokens (pure & / blanks)", () => {
  assert.deepEqual(sanitizeCloudflareMatch("&"), []);
  assert.deepEqual(sanitizeCloudflareMatch("  &  & "), []);
  assert.deepEqual(sanitizeCloudflareMatch("glm &"), ["glm"]);
});

test("resolveEndpointTransport: rule wins over default, else falls back to default", () => {
  const plan = { default: "vercel", match: sanitizeCloudflareMatch(["glm-5"]) };
  assert.equal(resolveEndpointTransport(GLM_51, plan), "cloudflare");
  assert.equal(resolveEndpointTransport(DEEPSEEK, plan), "vercel");

  // 全局默认 cloudflare 时，未命中规则也走 CF
  const planAll = { default: "cloudflare", match: [] };
  assert.equal(resolveEndpointTransport(DEEPSEEK, planAll), "cloudflare");
});
