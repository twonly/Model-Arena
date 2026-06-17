import assert from "node:assert/strict";
import test from "node:test";

import {
  buildFixedReviewDraft,
  buildReviewDraftPrompt,
  reviewDraftGeneratorCandidates,
  reviewDraftRows,
} from "../lib/review-draft.ts";

const baseEndpoint = {
  id: "gpt",
  name: "GPT Writer",
  kind: "openai",
  baseUrl: "https://api.example.com/v1",
  apiKey: "sk-local",
  model: "gpt-4.1",
  enabled: true,
};

test("review draft generation only uses user configured key models", () => {
  const candidates = reviewDraftGeneratorCandidates([
    baseEndpoint,
    { ...baseEndpoint, id: "disabled", enabled: false },
    { ...baseEndpoint, id: "shared", shared: true, apiKey: "" },
    { ...baseEndpoint, id: "no-key", apiKey: "" },
    { ...baseEndpoint, id: "no-url", baseUrl: "" },
  ]);

  assert.deepEqual(
    candidates.map((e) => e.id),
    ["gpt", "disabled"]
  );
});

test("review draft rows keep completed and failed evidence only", () => {
  const rows = reviewDraftRows([
    { name: "A", model: "a", run: { status: "idle", text: "", reasoning: "", metrics: null, samples: [], liveTokens: 0, liveTps: 0 } },
    { name: "B", model: "b", run: { status: "error", text: "", reasoning: "", metrics: null, samples: [], liveTokens: 0, liveTps: 0, error: "bad" } },
    { name: "C", model: "c", run: { status: "done", text: "ok", reasoning: "", metrics: { official: true, outputTokens: 12 }, samples: [], liveTokens: 0, liveTps: 0 } },
  ]);

  assert.deepEqual(
    rows.map((r) => r.name),
    ["B", "C"]
  );
});

test("review draft prompt carries metrics, prompt, outputs, and anti-hallucination rules", () => {
  const prompt = buildReviewDraftPrompt({
    title: "DeepSeek vs Kimi",
    notes: "同一 Prompt 并发测试",
    prompt: "请解释为什么首 Token 时延会影响体感。",
    style: "technical",
    thinkingStats: true,
    shareUrl: "https://www.tokrace.com/r/abc123",
    rows: [
      {
        name: "DeepSeek",
        model: "deepseek-chat",
        run: {
          status: "done",
          text: "首 Token 影响用户等待感，吞吐影响长文完成时间。",
          reasoning: "先区分 TTFT 和 TPS。",
          metrics: {
            official: true,
            ttftMs: 620,
            contentTps: 88,
            avgTps: 74,
            peakTps: 120,
            outputTokens: 160,
            totalMs: 4200,
            thinkingTps: 12,
            reasoningTokens: 34,
          },
          samples: [],
          liveTokens: 0,
          liveTps: 0,
          rank: 1,
        },
      },
      {
        name: "Kimi",
        model: "moonshot-v1",
        run: {
          status: "error",
          text: "",
          reasoning: "",
          metrics: null,
          samples: [],
          liveTokens: 0,
          liveTps: 0,
          error: "HTTP 500",
        },
      },
    ],
  });

  assert.match(prompt, /不要虚构任何基础稿未提供的指标/);
  assert.match(prompt, /基础评测稿/);
  assert.match(prompt, /0\.62s/);
  assert.match(prompt, /88/);
  assert.match(prompt, /160（官方）/);
  assert.match(prompt, /请解释为什么首 Token 时延会影响体感/);
  assert.match(prompt, /首 Token 影响用户等待感/);
  assert.match(prompt, /HTTP 500/);
  assert.match(prompt, /https:\/\/www\.tokrace\.com\/r\/abc123/);
});

test("fixed review draft builds a deterministic markdown draft with table and evidence", () => {
  const draft = buildFixedReviewDraft({
    title: "DeepSeek vs Kimi",
    notes: "同一 Prompt 并发测试",
    prompt: "请解释为什么首 Token 时延会影响体感。",
    style: "article",
    thinkingStats: false,
    shareUrl: "https://www.tokrace.com/r/abc123",
    rows: [
      {
        name: "DeepSeek",
        model: "deepseek-chat",
        run: {
          status: "done",
          text: "首 Token 影响用户等待感，吞吐影响长文完成时间。",
          reasoning: "",
          metrics: {
            official: true,
            ttftMs: 620,
            contentTps: 88,
            avgTps: 74,
            peakTps: 120,
            outputTokens: 160,
            totalMs: 4200,
          },
          samples: [],
          liveTokens: 0,
          liveTps: 0,
          rank: 1,
        },
      },
      {
        name: "Kimi",
        model: "moonshot-v1",
        run: {
          status: "error",
          text: "",
          reasoning: "",
          metrics: null,
          samples: [],
          liveTokens: 0,
          liveTps: 0,
          error: "HTTP 500",
        },
      },
    ],
  });

  assert.match(draft, /^# DeepSeek vs Kimi/);
  assert.match(draft, /## 关键指标表/);
  assert.match(draft, /\| 模型 \| 排名 \| 状态 \| 首 Token \| 输出 TPS/);
  assert.match(draft, /DeepSeek \(deepseek-chat\)/);
  assert.match(draft, /Kimi \(moonshot-v1\)/);
  assert.match(draft, /HTTP 500/);
  assert.match(draft, /## 原始 Prompt/);
  assert.match(draft, /https:\/\/www\.tokrace\.com\/r\/abc123/);
});

test("review draft prompt truncates long model outputs", () => {
  const prompt = buildReviewDraftPrompt({
    title: "",
    notes: "",
    prompt: "长文测试",
    style: "brief",
    thinkingStats: false,
    rows: [
      {
        name: "Long",
        model: "long-model",
        run: {
          status: "done",
          text: "字".repeat(2000),
          reasoning: "",
          metrics: { official: false, outputTokens: 900 },
          samples: [],
          liveTokens: 0,
          liveTps: 0,
        },
      },
    ],
  });

  assert.match(prompt, /摘录已截断/);
  assert.match(prompt, /部分模型未返回官方 usage/);
});
