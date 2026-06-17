"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { fetchReferralDashboard, type ReferralDashboardClient } from "@/lib/referral-client";
import { buildReferralShareText } from "@/lib/referrals";

export function ReferralInviteCopyCard({
  models = ["DeepSeek", "Kimi"],
}: {
  models?: string[];
}) {
  const [dashboard, setDashboard] = useState<ReferralDashboardClient | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [msg, setMsg] = useState("");

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
  }, []);

  const text = useMemo(
    () =>
      buildReferralShareText({
        inviteUrl: dashboard?.inviteUrl ?? "你的专属邀请链接",
        models,
      }),
    [dashboard?.inviteUrl, models]
  );

  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setMsg("已复制分享文案");
    setTimeout(() => setMsg(""), 1500);
  };

  return (
    <section className="rounded-lg border border-line bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-bold">可直接发送的邀请文案</h2>
          <p className="mt-1 text-[12.5px] leading-relaxed text-faint">
            {loaded && dashboard
              ? "已替换为你的专属邀请链接。"
              : "登录后这里会自动换成你的专属邀请链接。"}
          </p>
        </div>
        {!dashboard && (
          <Link
            href="/arena"
            className="rounded-md bg-ink px-3 py-1.5 text-[12px] font-semibold text-paper"
          >
            去登录
          </Link>
        )}
      </div>
      <textarea
        readOnly
        value={text}
        onFocus={(e) => e.currentTarget.select()}
        className="mt-3 min-h-[88px] w-full resize-none rounded-md border border-line bg-paper px-3 py-2 text-[12.5px] leading-relaxed outline-none"
      />
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button
          onClick={copy}
          className="rounded-md bg-ink px-3 py-1.5 text-[12px] font-semibold text-paper cursor-pointer"
        >
          复制文案
        </button>
        {dashboard && (
          <button
            onClick={() => {
              void navigator.clipboard.writeText(dashboard.inviteUrl);
              setMsg("已复制邀请链接");
              setTimeout(() => setMsg(""), 1500);
            }}
            className="rounded-md border border-line px-3 py-1.5 text-[12px] text-faint hover:text-ink cursor-pointer"
          >
            只复制链接
          </button>
        )}
        <span className="text-[11px] text-faint">{msg}</span>
      </div>
    </section>
  );
}
