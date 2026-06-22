import assert from "node:assert/strict";
import test from "node:test";

import { BRAND, SEO_KEYWORDS } from "../lib/brand.ts";
import { enMessages, zhMessages } from "../lib/i18n-messages.ts";

test("SEO metadata covers free and open-source search intent", () => {
  assert.match(BRAND.descZh, /免费开源/);
  assert.match(BRAND.descZh, /免费模型试用/);
  assert.match(BRAND.descEn, /free, open-source/i);
  assert.match(BRAND.descEn, /free model trials/i);

  assert.match(zhMessages.metadata.home.description, /免费模型试用/);
  assert.match(enMessages.metadata.home.description, /free model trials/i);
});

test("SEO keyword list includes free trial and open-source variants", () => {
  for (const keyword of [
    "免费大模型评测",
    "免费模型试用",
    "开源大模型测速",
    "free LLM benchmark",
    "free model trial",
    "open source LLM benchmark",
  ]) {
    assert.ok(SEO_KEYWORDS.includes(keyword), `missing SEO keyword: ${keyword}`);
  }
});

