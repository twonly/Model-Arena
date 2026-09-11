import assert from "node:assert/strict";
import test from "node:test";

import {
  arenaSeedUsesTemporaryEndpoints,
  QUICK_SAMPLE,
  quickSample,
  quickSampleEndpoints,
  sampleConfidence,
  sharedEndpointsForModels,
  voteConfidence,
} from "../lib/quickstart.ts";

test("quick sample uses three shared endpoints", () => {
  const endpoints = quickSampleEndpoints();
  assert.equal(endpoints.length, 3);
  assert.deepEqual(
    endpoints.map((e) => e.id),
    ["deepseek-flash", "glm-5-2", "orcarouter-hy3-free"]
  );
  assert.ok(endpoints.every((e) => e.shared));
});

test("arena seeds use temporary endpoints instead of overwriting saved configs", () => {
  assert.equal(arenaSeedUsesTemporaryEndpoints("sample"), true);
  assert.equal(arenaSeedUsesTemporaryEndpoints("share-full"), true);
  assert.equal(arenaSeedUsesTemporaryEndpoints("share-prompt"), true);
});

test("quick sample copy makes editable fields explicit", () => {
  assert.match(QUICK_SAMPLE.title, /可自己编辑/);
  assert.match(QUICK_SAMPLE.notes, /可自己编辑/);
  assert.match(quickSample("en").title, /editable/);
  assert.match(quickSample("en").prompt, /English/);
});

test("share snapshots can restore matching shared models", () => {
  const endpoints = sharedEndpointsForModels([
    "deepseek-v4-flash",
    "unknown-model",
    "z-ai/glm-5.3-flash-free",
  ]);
  assert.deepEqual(
    endpoints.map((e) => e.id),
    ["deepseek-flash", "orcarouter-glm-5-3-flash-free"]
  );
});

test("speed leaderboard confidence thresholds are explicit", () => {
  assert.equal(sampleConfidence(3).tone, "low");
  assert.equal(sampleConfidence(10).tone, "medium");
  assert.equal(sampleConfidence(50).tone, "high");
  assert.equal(sampleConfidence(50, "en").label, "Stable sample");
});

test("vote leaderboard confidence thresholds are explicit", () => {
  assert.equal(voteConfidence(7).tone, "low");
  assert.equal(voteConfidence(8).tone, "medium");
  assert.equal(voteConfidence(30).tone, "high");
  assert.equal(voteConfidence(30, "en").label, "Stable vote");
});
