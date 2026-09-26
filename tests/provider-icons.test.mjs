import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

import {
  PROVIDER_BRANDS,
  providerBrandFor,
  modelBrandFor,
  providerInitials,
} from "../lib/provider-icons.ts";

test("provider icon mapping covers pricing providers", () => {
  const cases = {
    Anthropic: "anthropic",
    DeepSeek: "deepseek",
    Google: "google",
    MiniMax: "minimax",
    "Moonshot Kimi": "moonshot-kimi",
    OpenAI: "openai",
    xAI: "xai",
    "字节 豆包": "bytedance-doubao",
    "小米 MiMo": "xiaomi-mimo",
    "智谱 Zhipu": "zhipu",
    "通义千问 Qwen": "qwen",
    "阶跃 StepFun": "stepfun",
    "腾讯混元 HY": "hunyuan",
  };
  for (const [provider, key] of Object.entries(cases)) {
    assert.equal(providerBrandFor(provider)?.key, key, provider);
  }
});

test("provider brands point at local static icons", () => {
  for (const brand of PROVIDER_BRANDS) {
    assert.match(brand.icon, /^\/provider-icons\/[a-z0-9-]+\.svg$/);
    assert.ok(brand.sourceDomain);
    const svg = readFileSync(new URL(`../public${brand.icon}`, import.meta.url), "utf8");
    assert.match(svg, /<svg[^>]+viewBox=/);
    assert.doesNotMatch(svg, /<script|<foreignObject|\bon\w+\s*=|(?:href|src)\s*=\s*["'](?:https?:|data:|javascript:)/i);
  }
});

test("model identity wins over renamed labels, protocols and routing providers", () => {
  const cases = {
    "deepseek-ai/DeepSeek-R1-Distill-Qwen-32B": "deepseek",
    "z-ai/glm-5.3-flash-free": "zhipu",
    "xiaomi/mimo-v2-pro": "xiaomi-mimo",
    "moonshotai/kimi-k2.5": "moonshot-kimi",
    "tencent/hy3-free": "hunyuan",
    "HY3": "hunyuan",
    "hunyuan-turbos-latest": "hunyuan",
    "step-3.5-flash": "stepfun",
    "MiniMax-M2.5": "minimax",
    "Qwen/Qwen3-32B": "qwen",
    "qwen3:8b": "qwen",
    "qwq-32b": "qwen",
    "doubao-seed-1-6-250615": "bytedance-doubao",
    "bytedance/seed-oss-36b": "bytedance-doubao",
    "anthropic/claude-sonnet-4.6": "claude",
    "google/gemini-2.5-pro": "gemini",
    "google/gemma-3-27b-it": "gemma",
    "x-ai/grok-4": "grok",
    "openai/gpt-4o": "openai",
    "o3-mini": "openai",
    "o4-mini": "openai",
    "meta-llama/llama-3.3-70b-instruct": "meta",
    "mistralai/codestral-latest": "mistral",
    "cohere/command-a-03-2025": "cohere",
    "baidu/ernie-4.5": "wenxin",
    "Spark-X1": "spark",
    "Baichuan4": "baichuan",
    "01-ai/yi-large": "yi",
    "internlm3-8b-instruct": "internlm",
    "microsoft/phi-4": "microsoft",
    "nvidia/nemotron-3-super": "nvidia",
    "perplexity/sonar-pro": "perplexity",
  };
  for (const [model, key] of Object.entries(cases)) {
    assert.equal(modelBrandFor({ model, name: "GPT test alias", provider: "OpenRouter", baseUrl: "https://api.orcarouter.ai/v1" })?.key, key, model);
  }
  assert.equal(modelBrandFor({ model: "private-id", name: "小米 MiMo" })?.key, "xiaomi-mimo");
  assert.equal(modelBrandFor({ model: "ep-123", baseUrl: "https://ark.cn-beijing.volces.com/api/v3" })?.key, "bytedance-doubao");
  assert.equal(modelBrandFor({ model: "private-id", baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai" })?.key, "google");
  assert.equal(modelBrandFor({ model: "private-id", baseUrl: "https://api.minimaxi.com/anthropic" })?.key, "minimax");
  for (const model of ["", "custom-model", "stepwise", "my-gptish-model", "physics-v1"]) {
    assert.equal(modelBrandFor({ model, baseUrl: "https://example.com/openai/v1" }), null, model);
  }
});

test("unknown provider initials stay readable", () => {
  assert.equal(providerInitials("Custom Provider"), "CP");
  assert.equal(providerInitials("未知厂商"), "未知");
});
