import assert from "node:assert/strict";
import test from "node:test";

import {
  PROVIDER_BRANDS,
  providerBrandFor,
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
  };
  for (const [provider, key] of Object.entries(cases)) {
    assert.equal(providerBrandFor(provider)?.key, key, provider);
  }
});

test("provider brands point at local static icons", () => {
  for (const brand of PROVIDER_BRANDS) {
    assert.match(brand.icon, /^\/provider-icons\/[a-z0-9-]+\.png$/);
    assert.ok(brand.sourceDomain);
  }
});

test("unknown provider initials stay readable", () => {
  assert.equal(providerInitials("Custom Provider"), "CP");
  assert.equal(providerInitials("未知厂商"), "未知");
});
