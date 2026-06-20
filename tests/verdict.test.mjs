import assert from "node:assert/strict";
import test from "node:test";

import { grade, isGradable } from "../lib/grade.ts";
import { computeVerdict } from "../lib/verdict.ts";

test("grade: strawberry r-count", () => {
  const p = "单词 strawberry 里有几个字母 r？请逐个字母列出来数。";
  assert.equal(grade(p, "逐个数：s-t-r-a-w-b-e-r-r-y，一共有 3 个 r。")?.pass, true);
  assert.equal(grade(p, "我数了一下，strawberry 里有 2 个 r。")?.pass, false);
  assert.equal(isGradable(p), true);
});

test("grade: 9.11 vs 9.9", () => {
  const p = "9.11 和 9.9 哪个更大？请解释原因。";
  assert.equal(grade(p, "9.9 更大，因为 9.90 > 9.11。")?.pass, true);
  assert.equal(grade(p, "9.11 更大，因为 11 > 9。")?.pass, false);
});

test("grade: strict JSON extraction", () => {
  const p = "提取信息，只输出 JSON（字段：name, age, city）：「张伟今年 28 岁，住在杭州。」";
  assert.equal(grade(p, '```json\n{"name":"张伟","age":28,"city":"杭州"}\n```')?.pass, true);
  assert.equal(grade(p, '{"name":"张伟","age":28,"city":"上海"}')?.pass, false);
  assert.equal(grade(p, "name 是张伟，age 是 28")?.pass, false);
});

test("grade: chickens and rabbits", () => {
  const p = "笼子里有鸡和兔共 35 只，脚共 94 只，各几只？";
  assert.equal(grade(p, "设鸡 x 兔 y… 鸡 23 只，兔 12 只。")?.pass, true);
  assert.equal(grade(p, "鸡 20 只，兔 15 只。")?.pass, false);
});

test("grade: non-objective returns null", () => {
  assert.equal(grade("以深夜便利店的灯为题写一首现代诗", "灯下…"), null);
});

test("computeVerdict picks fastest / cheapest / overall", () => {
  const mk = (tps, model, outTok, status = "done") => ({
    metrics: { contentTps: tps, outputTokens: outTok, promptTokens: 500, official: true },
    status,
    model,
  });
  const entries = [
    { id: "a", name: "DeepSeek", ...mk(180, "deepseek-chat", 800), graded: { pass: true, label: "x" } },
    { id: "b", name: "Opus", ...mk(120, "claude-opus-4-8", 800), graded: { pass: false, label: "x" } },
    { id: "c", name: "GLM", ...mk(160, "glm-5.2", 800), graded: { pass: true, label: "x" } },
  ];
  const v = computeVerdict(entries);
  assert.ok(v);
  assert.equal(v.fastest?.name, "DeepSeek"); // 180 tok/s
  assert.equal(v.cheapest?.name, "DeepSeek"); // $0.28/1M output, far cheaper than Opus $25
  assert.deepEqual(v.correct.sort(), ["DeepSeek", "GLM"]);
  // 综合：DeepSeek 又快又便宜又答对 → 必为它
  assert.equal(v.overall?.name, "DeepSeek");
});

test("computeVerdict returns null when nothing finished", () => {
  assert.equal(computeVerdict([{ id: "a", name: "x", model: "y", status: "error", metrics: null }]), null);
});
