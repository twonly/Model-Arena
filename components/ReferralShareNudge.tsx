"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/components/I18nProvider";
import { fetchReferralDashboard, type ReferralDashboardClient } from "@/lib/referral-client";
import { buildReferralShareText } from "@/lib/referrals";

type NudgeReason = "post-run" | "share" | "export";

const titleByReason: Record<NudgeReason, string> = {
  "post-run": "这轮对比完成了，可以顺手邀请朋友体验",
  share: "分享链接已生成，也可以带上你的邀请文案",
  export: "长图已导出，也可以把邀请文案一起发出去",
};

const titleByReasonEn: Record<NudgeReason, string> = {
  "post-run": "This comparison finished. Invite a friend to try it.",
  share: "Your share link is ready. You can include your invite copy too.",
  export: "The long image is exported. Add your invite copy when posting it.",
};

const descByReason: Record<NudgeReason, string> = {
  "post-run": "好友通过你的链接注册并完成首次对比后，你和对方都会获得额外免费次数。",
  share: "复制下面这段话发给朋友，比单发链接更容易让对方知道能获得什么。",
  export: "配图发布时顺手附上邀请文案，可以把读者转成可追踪的新用户。",
};

const descByReasonEn: Record<NudgeReason, string> = {
  "post-run": "When a friend signs up through your link and completes their first comparison, both of you receive extra free runs.",
  share: "This copy makes the benefit clearer than sending only the link.",
  export: "When publishing the image, include the invite copy to turn readers into trackable new users.",
};

export function ReferralShareNudge({
  reason,
  models,
  onOpenAccount,
  onClose,
}: {
  reason: NudgeReason;
  models: string[];
  onOpenAccount: () => void;
  onClose: () => void;
}) {
  const { locale, href } = useI18n();
  const en = locale === "en";
  const [dashboard, setDashboard] = useState<ReferralDashboardClient | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [copied, setCopied] = useState("");

  useEffect(() => {
    let alive = true;
    fetchReferralDashboard()
      .then((d) => {
        if (alive) setDashboard(d);
      })
      .catch(() => {
        if (alive) setDashboard(null);
      })
      .finally(() => {
        if (alive) setLoaded(true);
      });
    return () => {
      alive = false;
    };
  }, [reason]);

  const text = useMemo(
    () =>
      dashboard
        ? buildReferralShareText({ inviteUrl: dashboard.inviteUrl, models, locale })
        : "",
    [dashboard, locale, models]
  );

  const copyText = async () => {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopied(en ? "Invite copy copied" : "已复制邀请文案");
    setTimeout(() => setCopied(""), 1500);
  };

  return (
    <div
      data-no-export="1"
      className="mb-4 rounded-lg border border-line bg-card px-3.5 py-3"
    >
      <div className="flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-bold">
            {en ? titleByReasonEn[reason] : titleByReason[reason]}
          </div>
          <div className="mt-1 text-[12px] leading-relaxed text-faint">
            {en ? descByReasonEn[reason] : descByReason[reason]}
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-[12px] text-faint hover:text-ink cursor-pointer"
          aria-label={en ? "Close invite nudge" : "关闭邀请提示"}
        >
          ✕
        </button>
      </div>

      {!loaded ? (
        <div className="mt-3 text-[12px] text-faint">
          {en ? "Loading your invite link..." : "正在读取你的邀请链接…"}
        </div>
      ) : dashboard ? (
        <>
          <textarea
            readOnly
            value={text}
            onFocus={(e) => e.currentTarget.select()}
            className="mt-3 min-h-[74px] w-full resize-none rounded-md border border-line bg-paper/60 px-3 py-2 text-[12.5px] leading-relaxed outline-none"
          />
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <button
              onClick={copyText}
              className="rounded-md bg-ink px-3 py-1.5 text-[12px] font-semibold text-paper cursor-pointer"
            >
              {en ? "Copy Invite Copy" : "复制邀请文案"}
            </button>
            <button
              onClick={() => {
                void navigator.clipboard.writeText(dashboard.inviteUrl);
                setCopied(en ? "Invite link copied" : "已复制邀请链接");
                setTimeout(() => setCopied(""), 1500);
              }}
              className="rounded-md border border-line px-3 py-1.5 text-[12px] text-faint hover:text-ink cursor-pointer"
            >
              {en ? "Copy Link Only" : "只复制链接"}
            </button>
            <span className="text-[11px] text-faint">{copied}</span>
          </div>
        </>
      ) : (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            onClick={onOpenAccount}
            className="rounded-md bg-ink px-3 py-1.5 text-[12px] font-semibold text-paper cursor-pointer"
          >
            {en ? "Sign In for Personal Link" : "登录生成专属链接"}
          </button>
          <Link href={href("/invite")} className="text-[12px] text-faint underline hover:text-ink">
            {en ? "View invite rules" : "查看邀请规则"}
          </Link>
        </div>
      )}
    </div>
  );
}
