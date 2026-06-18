"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/components/I18nProvider";
import { getSupabase, supabaseEnabled } from "@/lib/supabase-client";
import {
  consumeReferralRewardNotice,
  fetchReferralDashboard,
  type ReferralRewardNotice,
} from "@/lib/referral-client";

export function ReferralRewardNotifier({
  onOpenAccount,
}: {
  onOpenAccount: () => void;
}) {
  const { locale } = useI18n();
  const en = locale === "en";
  const [notice, setNotice] = useState<ReferralRewardNotice | null>(null);

  useEffect(() => {
    if (!supabaseEnabled()) return;
    const sb = getSupabase();
    if (!sb) return;

    let alive = true;
    const check = async () => {
      const dashboard = await fetchReferralDashboard().catch(() => null);
      if (!alive || !dashboard) return;
      const next = consumeReferralRewardNotice(dashboard);
      if (next) setNotice(next);
    };

    void sb.auth.getSession().then(({ data }) => {
      if (data.session?.user) void check();
    });
    const { data: sub } = sb.auth.onAuthStateChange((_event, session) => {
      if (session?.user) setTimeout(() => void check(), 300);
    });
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  if (!notice) return null;

  return (
    <div
      data-no-export="1"
      className="fixed bottom-5 right-5 z-50 w-[min(360px,calc(100vw-32px))] rounded-lg border border-line bg-paper px-4 py-3 shadow-xl"
    >
      <div className="flex items-start gap-3">
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-card text-[16px]">
          🎁
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-bold">
            {en ? "Invite Reward Received" : "邀请奖励到账"}
          </div>
          <div className="mt-1 text-[12px] leading-relaxed text-faint">
            {en
              ? `${notice.newRewardedInvites > 0 ? `${notice.newRewardedInvites} friend(s) completed their first comparison. ` : ""}Reward received: +${notice.gained} runs. Current reward balance: ${notice.bonusRemaining}.`
              : notice.message}
          </div>
          <div className="mt-2 flex gap-2">
            <button
              onClick={() => {
                onOpenAccount();
                setNotice(null);
              }}
              className="rounded-md bg-ink px-3 py-1.5 text-[12px] font-semibold text-paper cursor-pointer"
            >
              {en ? "View Invites" : "查看邀请"}
            </button>
            <button
              onClick={() => setNotice(null)}
              className="rounded-md border border-line px-3 py-1.5 text-[12px] text-faint hover:text-ink cursor-pointer"
            >
              {en ? "Got It" : "知道了"}
            </button>
          </div>
        </div>
        <button
          onClick={() => setNotice(null)}
          className="shrink-0 text-[12px] text-faint hover:text-ink cursor-pointer"
          aria-label={en ? "Close invite reward notice" : "关闭邀请奖励提示"}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
