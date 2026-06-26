import assert from "node:assert/strict";
import test from "node:test";

import { raceProgressPct, speedBarPct } from "../lib/race-track.ts";

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

test("speed bar fills fully for the fastest runner", () => {
  assert.equal(speedBarPct(339, 339), 100);
});

test("speed bar scales by speed, decoupled from token count", () => {
  // 慢但 token 多 vs 快但 token 少：速度条只看速率
  assert.equal(speedBarPct(60, 339), (60 / 339) * 100);
  assert.equal(speedBarPct(170, 340), 50);
});

test("speed bar handles zero / not-yet-started speeds", () => {
  assert.equal(speedBarPct(0, 339), 0);
  assert.equal(speedBarPct(100, 0), 0);
});
