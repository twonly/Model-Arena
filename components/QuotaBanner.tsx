"use client";

import Link from "next/link";
import { useI18n } from "@/components/I18nProvider";

/**
 * 共享「体验额度」提示条。未登录/未配置 key 的用户用预置模型时显示：
 * 还剩多少次、用完后如何继续（登录 +10 / 配置自己的 key）。
 */
export function QuotaBanner({
  remaining,
  limit,
  loggedIn,
  bonusRemaining = 0,
  onLogin,
  onInvite,
  onConfigure,
}: {
  remaining: number;
  limit: number;
  loggedIn: boolean;
  bonusRemaining?: number;
  onLogin: () => void;
  onInvite: () => void;
  onConfigure: () => void;
}) {
  const { href, locale } = useI18n();
  const en = locale === "en";
  const out = remaining <= 0;
  const low = remaining > 0 && remaining <= 2;
  return (
    <div
      data-no-export="1"
      className="mb-4 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border px-3.5 py-2 text-[12.5px]"
      style={{
        borderColor: out ? "var(--accent)" : "var(--line)",
        background: out ? "color-mix(in srgb, var(--accent) 7%, transparent)" : "var(--card)",
      }}
    >
      {out ? (
        <>
          <span className="font-semibold text-accent">
            🚫 {en ? "Today's free trial runs are used up" : "今日免费体验额度已用完"}
          </span>
          <span className="text-faint">{en ? "Continue with:" : "—— 继续对比："}</span>
          {!loggedIn && (
            <button
              onClick={onLogin}
              className="rounded-md bg-ink px-2.5 py-0.5 text-[12px] font-semibold text-paper cursor-pointer"
            >
              {en ? "Sign in for 10 more" : "登录再得 10 次"}
            </button>
          )}
          {loggedIn && (
            <button
              onClick={onInvite}
              className="rounded-md bg-ink px-2.5 py-0.5 text-[12px] font-semibold text-paper cursor-pointer"
            >
              {en ? "Invite friends for more" : "邀请好友得次数"}
            </button>
          )}
          <button
            onClick={onConfigure}
            className="rounded-md border border-line px-2.5 py-0.5 text-[12px] font-semibold hover:border-ink/40 cursor-pointer"
          >
            {en ? "Use my own Key" : "填我自己的 Key（无限）"}
          </button>
        </>
      ) : (
        <>
          <span>🎁 {en ? "Free trial: you can still run" : "免费体验中：今日还可免费跑"}</span>
          <b className="num text-ink">
            {remaining}/{limit}
          </b>
          <span>{en ? " comparisons today with preset models." : "次对比（用预置模型）。"}</span>
          {bonusRemaining > 0 && (
            <span className="text-faint">
              {en ? `${bonusRemaining} come from invite rewards.` : `其中邀请奖励 ${bonusRemaining} 次。`}
            </span>
          )}
          <span>{low ? (en ? "Almost out:" : "次数不多了：") : en ? "After that," : "用完后"}</span>
          {!loggedIn && (
            <button onClick={onLogin} className="underline hover:text-ink cursor-pointer">
              {en ? "sign in for 10 more" : "登录再得 10 次"}
            </button>
          )}
          {loggedIn && (
            <button onClick={onInvite} className="underline hover:text-ink cursor-pointer">
              {en ? "invite friends for more runs" : "邀请好友再得次数"}
            </button>
          )}
          <span className="text-faint">{en ? "or" : "或"}</span>
          <button onClick={onConfigure} className="underline hover:text-ink cursor-pointer">
            {en ? "use your own Key without the trial limit" : "填自己的 Key 无限使用"}
          </button>
          <span className="text-faint">
            {en ? " Your Key stays local." : "。Key 只存你本地。"}
          </span>
          <Link href={href("/invite")} className="underline hover:text-ink">
            {en ? "Rules" : "规则"}
          </Link>
        </>
      )}
    </div>
  );
}
