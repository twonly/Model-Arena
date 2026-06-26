import assert from "node:assert/strict";
import test from "node:test";

import {
  raceProgressPct,
  speedBarPct,
  SPEED_BAR_FULL,
  SPEED_BAR_REF,
} from "../lib/race-track.ts";

test("race progress keeps the leader away from the finish edge", () => {
  assert.equal(raceProgressPct(10000, 10000), 92);
});

test("race progress preserves relative positions below the leader cap", () => {
  assert.equal(raceProgressPct(5000, 10000), 46);
  assert.equal(raceProgressPct(2500, 10000), 23);
});

test("race progress handles empty or invalid token counts", () => {
  assert.equal(raceProgressPct(0, 10000), 0);
  assert.equal(raceProgressPct(100, 0), 0);
});

test("speed bar uses an absolute scale, not relative to the field", () => {
  // 同样 60 t/s，不管同场最快多少，柱长恒定（不再被最快者归一）
  assert.equal(speedBarPct(60), (60 / SPEED_BAR_FULL) * 100);
  assert.equal(speedBarPct(SPEED_BAR_FULL / 2), 50);
  assert.equal(speedBarPct(SPEED_BAR_FULL), 100);
});

test("the speed leader is no longer pegged at 100% (the static-bar bug)", () => {
  // 实测约 339 t/s 的最快者，绝对刻度下明显未满格 → 会随实时 tps 抖动
  assert.ok(speedBarPct(339) < 100);
});

test("speed above full scale clamps to 100", () => {
  assert.equal(speedBarPct(SPEED_BAR_FULL * 2), 100);
});

test("the reference line sits below full scale so fast models can cross it", () => {
  assert.ok(SPEED_BAR_REF < SPEED_BAR_FULL);
  // 持续 ~339 的高速模型应当越过基准线
  assert.ok(339 >= SPEED_BAR_REF);
});

test("speed bar handles zero / not-yet-started speeds", () => {
  assert.equal(speedBarPct(0), 0);
  assert.equal(speedBarPct(100, 0), 0);
});

test("token bar length stays proportional to tokens (different tokens => different length)", () => {
  // 复刻线上现象：阶跃 4181 / Kimi 2943 / GLM 886 → 长度应当各不相同、按 token 比例
  const max = 4181;
  const lead = raceProgressPct(4181, max);
  const mid = raceProgressPct(2943, max);
  const low = raceProgressPct(886, max);
  assert.ok(lead > mid && mid > low);
  assert.equal(mid, (2943 / 4181) * 92);
  assert.equal(low, (886 / 4181) * 92);
});
