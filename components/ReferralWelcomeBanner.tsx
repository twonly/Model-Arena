"use client";

import Link from "next/link";
import { useI18n } from "@/components/I18nProvider";
import { REFERRAL_INVITEE_REWARD, REFERRAL_INVITER_REWARD } from "@/lib/referrals";

export function ReferralWelcomeBanner({
  code,
  claimed,
  onLogin,
}: {
  code: string;
  claimed: boolean;
  onLogin: () => void;
}) {
  const { locale, href } = useI18n();
  const en = locale === "en";
  return (
    <div
      data-no-export="1"
      className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-card px-3.5 py-3 text-[12.5px]"
    >
      <div className="min-w-0">
        <div className="font-semibold text-ink">
          {claimed
            ? en
              ? "Invite relationship recorded"
              : "邀请关系已记录"
            : en
              ? "You are trying TOKRACE through a friend's invite"
              : "你正在通过好友邀请体验百模竞速"}
        </div>
        <div className="mt-0.5 text-faint">
          {claimed
            ? en
              ? `Complete your first comparison to get ${REFERRAL_INVITEE_REWARD} free runs; your friend gets ${REFERRAL_INVITER_REWARD}.`
              : `完成首次对比后，你得 ${REFERRAL_INVITEE_REWARD} 次，好友得 ${REFERRAL_INVITER_REWARD} 次。`
            : en
              ? `Sign in and complete your first comparison to get ${REFERRAL_INVITEE_REWARD} extra free runs. Invite code ${code}`
              : `登录后完成首次对比，你可额外获得 ${REFERRAL_INVITEE_REWARD} 次免费体验。邀请码 ${code}`}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {!claimed && (
          <button
            onClick={onLogin}
            className="rounded-md bg-ink px-3 py-1.5 text-[12px] font-semibold text-paper cursor-pointer"
          >
            {en ? "Sign In to Claim" : "登录领取"}
          </button>
        )}
        <Link
          href={href("/invite")}
          className="rounded-md border border-line px-3 py-1.5 text-[12px] font-semibold text-faint hover:text-ink"
        >
          {en ? "View Rules" : "查看规则"}
        </Link>
      </div>
    </div>
  );
}
