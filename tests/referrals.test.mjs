import assert from "node:assert/strict";
import test from "node:test";

import {
  REFERRAL_INVITEE_REWARD,
  REFERRAL_INVITER_REWARD,
  REFERRAL_REWARD_TTL_DAYS,
  buildInviteUrl,
  buildReferralShareText,
  normalizeReferralCode,
  quotaSnapshot,
  referralModelPhrase,
} from "../lib/referrals.ts";

test("normalizes referral codes for storage and URLs", () => {
  assert.equal(normalizeReferralCode("  ab12cd  "), "AB12CD");
  assert.equal(normalizeReferralCode("tok_race"), "TOKRACE");
  assert.equal(normalizeReferralCode("short"), null);
  assert.equal(normalizeReferralCode("contains space"), null);
  assert.equal(normalizeReferralCode("a".repeat(25)), null);
});

test("builds invite URLs on the arena entry surface", () => {
  assert.equal(
    buildInviteUrl("https://www.tokrace.com", "ab12cd").toString(),
    "https://www.tokrace.com/arena?ref=AB12CD"
  );
});

test("builds referral share copy with model context and invitee reward", () => {
  assert.equal(referralModelPhrase([" DeepSeek V4 ", "Kimi K2", "GPT"]), "DeepSeek V4 与 Kimi K2");
  assert.equal(referralModelPhrase([]), "多个 AI");
  assert.equal(referralModelPhrase([" DeepSeek V4 ", "Kimi K2"], "en"), "DeepSeek V4 and Kimi K2");
  assert.equal(referralModelPhrase([], "en"), "multiple AI");
  assert.equal(
    buildReferralShareText({
      inviteUrl: "https://www.tokrace.com/arena?ref=AB12CD",
      models: ["DeepSeek V4", "Kimi K2"],
    }),
    "我在用 TOKRACE 评测 DeepSeek V4 与 Kimi K2 模型，你通过我的链接注册并完成首次对比，可以获得 5 次免费体验：https://www.tokrace.com/arena?ref=AB12CD"
  );
  assert.equal(
    buildReferralShareText({
      inviteUrl: "https://www.tokrace.com/en/arena?ref=AB12CD",
      models: ["DeepSeek V4", "Kimi K2"],
      locale: "en",
    }),
    "I am benchmarking DeepSeek V4 and Kimi K2 models on TOKRACE. Use my link, sign up, and finish your first comparison to get 5 free trial runs: https://www.tokrace.com/en/arena?ref=AB12CD"
  );
});

test("combines base quota and referral bonus without hiding the base limit", () => {
  assert.deepEqual(quotaSnapshot({ baseLimit: 15, baseUsed: 3, bonusRemaining: 8 }), {
    baseLimit: 15,
    baseUsed: 3,
    baseRemaining: 12,
    bonusRemaining: 8,
    totalRemaining: 20,
    totalLimit: 23,
  });

  assert.deepEqual(quotaSnapshot({ baseLimit: 15, baseUsed: 20, bonusRemaining: 4 }), {
    baseLimit: 15,
    baseUsed: 20,
    baseRemaining: 0,
    bonusRemaining: 4,
    totalRemaining: 4,
    totalLimit: 19,
  });
});

test("documents the initial reward policy in code constants", () => {
  assert.equal(REFERRAL_INVITER_REWARD, 10);
  assert.equal(REFERRAL_INVITEE_REWARD, 5);
  assert.equal(REFERRAL_REWARD_TTL_DAYS, 60);
});
