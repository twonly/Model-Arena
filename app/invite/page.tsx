import Link from "next/link";
import type { Metadata } from "next";
import { Credit } from "@/components/Credit";
import { JsonLd } from "@/components/JsonLd";
import { ReferralInviteCopyCard } from "@/components/ReferralInviteCopyCard";
import { BRAND } from "@/lib/brand";
import {
  FREE_LIMIT_ANON,
  FREE_LIMIT_USER,
} from "@/lib/shared-models";
import {
  REFERRAL_INVITEE_REWARD,
  REFERRAL_INVITER_REWARD,
  REFERRAL_MONTHLY_REWARD_LIMIT,
  REFERRAL_REWARD_TTL_DAYS,
} from "@/lib/referrals";

export const metadata: Metadata = {
  title: "邀请奖励规则",
  description:
    "TOKRACE 百模竞速邀请好友奖励规则：免费体验次数、邀请奖励、领取条件、有效期与风控说明。",
  alternates: { canonical: "/invite" },
};

const rules = [
  ["未登录体验", `每个浏览器设备 ${FREE_LIMIT_ANON} 次，用预置模型即可直接开跑。`],
  ["登录后体验", `登录账号后每日基础额度提升到 ${FREE_LIMIT_USER} 次。`],
  [
    "邀请人奖励",
    `好友通过你的邀请链接注册，并完成首次共享模型对比后，你获得 ${REFERRAL_INVITER_REWARD} 次奖励。`,
  ],
  [
    "被邀请人奖励",
    `新用户通过邀请链接注册并完成首次对比后，额外获得 ${REFERRAL_INVITEE_REWARD} 次奖励。`,
  ],
  ["奖励有效期", `邀请奖励自发放起 ${REFERRAL_REWARD_TTL_DAYS} 天内有效。`],
  ["月度上限", `每个邀请人每月最多获得 ${REFERRAL_MONTHLY_REWARD_LIMIT} 个有效好友的奖励。`],
];

const flow = [
  ["复制链接", "登录后在「账号、云同步与邀请」里复制你的专属邀请链接。"],
  ["好友注册", "好友通过链接进入竞速场，登录或注册账号后邀请关系会自动记录。"],
  ["完成对比", "好友用预置模型完成首次对比，系统判定为一次有效体验。"],
  ["自动发奖", "双方的奖励次数进入账户余额，基础额度用完后自动扣奖励余额。"],
];

export default function InviteRulesPage() {
  return (
    <>
      <JsonLd data={inviteJsonLd} />
      <main className="min-h-screen">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link href="/" className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="TOKRACE 百模竞速" width={26} height={26} />
            <span
              className="text-[20px] font-black"
              style={{ fontFamily: "var(--font-title)" }}
            >
              百模竞速
            </span>
            <span className="num text-[11px] text-faint">TOKRACE</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/arena" className="text-[13px] text-faint hover:text-ink">
              竞速场
            </Link>
            <Link
              href="/arena"
              className="rounded-md bg-ink px-4 py-1.5 text-[13px] font-bold text-paper"
            >
              开始对比
            </Link>
          </div>
        </nav>

        <header className="mx-auto max-w-6xl px-6 pt-12 pb-10">
          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
            <div>
              <h1
                className="max-w-3xl text-[40px] font-black leading-[1.14] sm:text-[54px]"
                style={{ fontFamily: "var(--font-title)" }}
              >
                邀请好友体验，
                <span style={{ color: "var(--accent)" }}>双方都得免费次数</span>
              </h1>
              <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-faint">
                百模竞速的预置模型适合先试用：未登录可跑{" "}
                <span className="num text-ink">{FREE_LIMIT_ANON}</span> 次，登录后{" "}
                <span className="num text-ink">{FREE_LIMIT_USER}</span> 次。后续想继续用共享模型，
                可以邀请朋友注册并完成首次对比；也可以填自己的 API Key 无限使用。
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link
                  href="/arena"
                  className="rounded-lg bg-ink px-6 py-3 text-[14px] font-bold text-paper hover:opacity-90"
                >
                  去竞速场邀请
                </Link>
                <Link
                  href="/"
                  className="rounded-lg border border-line bg-card px-6 py-3 text-[14px] font-semibold hover:border-ink/40"
                >
                  返回首页
                </Link>
              </div>
            </div>

            <div className="rounded-lg border border-line bg-card p-5">
              <div className="text-[13px] font-bold">当前奖励规则</div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {[
                  ["邀请人", `+${REFERRAL_INVITER_REWARD}`],
                  ["新用户", `+${REFERRAL_INVITEE_REWARD}`],
                  ["有效期", `${REFERRAL_REWARD_TTL_DAYS} 天`],
                  ["每月上限", `${REFERRAL_MONTHLY_REWARD_LIMIT} 人`],
                ].map(([label, value]) => (
                  <div key={label} className="border-l border-line pl-3">
                    <div className="num text-[28px] font-bold leading-none text-ink">
                      {value}
                    </div>
                    <div className="mt-1 text-[11px] text-faint">{label}</div>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-[11.5px] leading-relaxed text-faint">
                奖励次数不会覆盖基础额度。系统会先扣每日基础次数，基础次数用完后再扣邀请奖励余额。
              </p>
            </div>
          </div>
        </header>

        <section className="border-y border-line bg-card/60">
          <div className="mx-auto grid max-w-6xl gap-4 px-6 py-12 sm:grid-cols-4">
            {flow.map(([title, desc], i) => (
              <div key={title} className="rounded-lg border border-line bg-paper p-4">
                <div className="num text-[24px] font-bold" style={{ color: "var(--accent)" }}>
                  {String(i + 1).padStart(2, "0")}
                </div>
                <div className="mt-2 text-[14px] font-bold">{title}</div>
                <p className="mt-1.5 text-[12px] leading-relaxed text-faint">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-6 pt-12">
          <ReferralInviteCopyCard />
        </section>

        <section className="mx-auto max-w-5xl px-6 py-14">
          <h2
            className="text-[26px] font-black"
            style={{ fontFamily: "var(--font-title)" }}
          >
            规则细则
          </h2>
          <div className="mt-6 overflow-hidden rounded-lg border border-line">
            {rules.map(([label, desc]) => (
              <div key={label} className="grid gap-2 border-b border-line bg-card px-4 py-3 last:border-b-0 sm:grid-cols-[160px_1fr]">
                <div className="text-[13px] font-bold">{label}</div>
                <div className="text-[13px] leading-relaxed text-faint">{desc}</div>
              </div>
            ))}
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div>
              <h3 className="text-[15px] font-bold">什么算有效邀请？</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-faint">
                有效邀请需要满足：好友通过你的专属链接进入，完成登录或注册，并成功完成一次预置模型对比。
                单纯打开链接、重复注册、使用自己的邀请链接，都不会发放奖励。
              </p>
            </div>
            <div>
              <h3 className="text-[15px] font-bold">为什么不是注册即发？</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-faint">
                共享模型会消耗站点维护的服务端 Key。要求完成首次体验后发奖，可以减少批量注册刷额度，
                也能确保新用户真的了解产品。
              </p>
            </div>
          </div>
        </section>

        <section className="border-t border-line bg-card/60">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-8">
            <div>
              <div className="text-[15px] font-bold">准备好邀请了吗？</div>
              <div className="mt-1 text-[12.5px] text-faint">
                登录后打开账号弹窗，就能复制你的专属邀请链接。
              </div>
            </div>
            <Link
              href="/arena"
              className="rounded-lg bg-ink px-5 py-2.5 text-[13px] font-bold text-paper hover:opacity-90"
            >
              打开竞速场
            </Link>
          </div>
        </section>

        <footer className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-6 py-8 text-[12px] text-faint">
          <span>{BRAND.full}</span>
          <Credit />
        </footer>
      </main>
    </>
  );
}

const inviteJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "@id": `${BRAND.url}/invite#faq`,
  mainEntity: [
    {
      "@type": "Question",
      name: "TOKRACE 邀请好友可以获得多少免费次数？",
      acceptedAnswer: {
        "@type": "Answer",
        text: `好友通过邀请链接注册并完成首次对比后，邀请人获得 ${REFERRAL_INVITER_REWARD} 次，被邀请人获得 ${REFERRAL_INVITEE_REWARD} 次。`,
      },
    },
    {
      "@type": "Question",
      name: "奖励次数什么时候扣除？",
      acceptedAnswer: {
        "@type": "Answer",
        text: "系统会先扣每日基础免费次数，基础次数用完后再扣邀请奖励余额。",
      },
    },
  ],
};
