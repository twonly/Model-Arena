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
import { getMessages } from "@/lib/i18n-messages";
import { getRequestLocale } from "@/lib/i18n-server";
import { localeToLanguage, localizedPath, type Locale } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "邀请奖励规则",
  description:
    "TOKRACE 百模竞速邀请好友奖励规则：免费体验次数、邀请奖励、领取条件、有效期与风控说明。",
  alternates: { canonical: "/invite" },
};

function rules(locale: Locale) {
  return locale === "en"
    ? [
        ["Anonymous quota", `${FREE_LIMIT_ANON} runs per browser device with preset models.`],
        ["Signed-in quota", `After sign-in, the daily base quota increases to ${FREE_LIMIT_USER} runs.`],
        [
          "Inviter reward",
          `When a friend signs up through your link and completes their first shared-model comparison, you receive ${REFERRAL_INVITER_REWARD} reward runs.`,
        ],
        [
          "Invitee reward",
          `The new user receives ${REFERRAL_INVITEE_REWARD} extra reward runs after completing their first comparison.`,
        ],
        ["Reward expiry", `Referral rewards expire ${REFERRAL_REWARD_TTL_DAYS} days after issuance.`],
        ["Monthly cap", `Each inviter can earn rewards for up to ${REFERRAL_MONTHLY_REWARD_LIMIT} valid friends per month.`],
      ]
    : [
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
}

function flow(locale: Locale) {
  return locale === "en"
    ? [
        ["Copy link", "After signing in, copy your personal invite link from the account dialog."],
        ["Friend signs up", "The friend enters the arena through your link and signs in or creates an account."],
        ["Complete comparison", "They run a first comparison with preset models, which counts as a valid trial."],
        ["Rewards issued", "Reward runs are added to both accounts and used after base quota is exhausted."],
      ]
    : [
        ["复制链接", "登录后在「账号、云同步与邀请」里复制你的专属邀请链接。"],
        ["好友注册", "好友通过链接进入竞速场，登录或注册账号后邀请关系会自动记录。"],
        ["完成对比", "好友用预置模型完成首次对比，系统判定为一次有效体验。"],
        ["自动发奖", "双方的奖励次数进入账户余额，基础额度用完后自动扣奖励余额。"],
      ];
}

export default async function InviteRulesPage() {
  const locale = await getRequestLocale();
  const messages = getMessages(locale);
  const isZh = locale === "zh-CN";
  const h = (path: string) => localizedPath(path, locale);
  return (
    <>
      <JsonLd data={inviteJsonLd(locale)} />
      <main className="min-h-screen">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link href={h("/")} className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="TOKRACE 百模竞速" width={26} height={26} />
            <span
              className="text-[20px] font-black"
              style={{ fontFamily: "var(--font-title)" }}
            >
              {isZh ? "百模竞速" : "TOKRACE"}
            </span>
            <span className="num text-[11px] text-faint">TOKRACE</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href={h("/arena")} className="text-[13px] text-faint hover:text-ink">
              {messages.common.arena}
            </Link>
            <Link
              href={h("/arena")}
              className="rounded-md bg-ink px-4 py-1.5 text-[13px] font-bold text-paper"
            >
              {isZh ? "开始对比" : "Start comparing"}
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
                {isZh ? "邀请好友体验，" : "Invite friends, "}
                <span style={{ color: "var(--accent)" }}>
                  {isZh ? "双方都得免费次数" : "both sides get free runs"}
                </span>
              </h1>
              <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-faint">
                {isZh
                  ? "百模竞速的预置模型适合先试用：未登录可跑 "
                  : "Preset TOKRACE models are useful for trial runs: anonymous users get "}
                <span className="num text-ink">{FREE_LIMIT_ANON}</span>
                {isZh ? " 次，登录后 " : " runs, signed-in users get "}
                <span className="num text-ink">{FREE_LIMIT_USER}</span>
                {isZh
                  ? " 次。后续想继续用共享模型，可以邀请朋友注册并完成首次对比；也可以填自己的 API Key 无限使用。"
                  : " runs. To keep using shared models, invite friends to sign up and complete a first comparison; you can also add your own API keys for unlimited personal use."}
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link
                  href={h("/arena")}
                  className="rounded-lg bg-ink px-6 py-3 text-[14px] font-bold text-paper hover:opacity-90"
                >
                  {isZh ? "去竞速场邀请" : "Invite from arena"}
                </Link>
                <Link
                  href={h("/")}
                  className="rounded-lg border border-line bg-card px-6 py-3 text-[14px] font-semibold hover:border-ink/40"
                >
                  {messages.common.home}
                </Link>
              </div>
            </div>

            <div className="rounded-lg border border-line bg-card p-5">
              <div className="text-[13px] font-bold">
                {isZh ? "当前奖励规则" : "Current reward rules"}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {[
                  [isZh ? "邀请人" : "Inviter", `+${REFERRAL_INVITER_REWARD}`],
                  [isZh ? "新用户" : "New user", `+${REFERRAL_INVITEE_REWARD}`],
                  [isZh ? "有效期" : "Expiry", isZh ? `${REFERRAL_REWARD_TTL_DAYS} 天` : `${REFERRAL_REWARD_TTL_DAYS} days`],
                  [isZh ? "每月上限" : "Monthly cap", isZh ? `${REFERRAL_MONTHLY_REWARD_LIMIT} 人` : `${REFERRAL_MONTHLY_REWARD_LIMIT} friends`],
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
                {isZh
                  ? "奖励次数不会覆盖基础额度。系统会先扣每日基础次数，基础次数用完后再扣邀请奖励余额。"
                  : "Reward runs do not replace base quota. The system uses daily base quota first, then referral reward balance."}
              </p>
            </div>
          </div>
        </header>

        <section className="border-y border-line bg-card/60">
          <div className="mx-auto grid max-w-6xl gap-4 px-6 py-12 sm:grid-cols-4">
            {flow(locale).map(([title, desc], i) => (
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
            {isZh ? "规则细则" : "Rule details"}
          </h2>
          <div className="mt-6 overflow-hidden rounded-lg border border-line">
            {rules(locale).map(([label, desc]) => (
              <div key={label} className="grid gap-2 border-b border-line bg-card px-4 py-3 last:border-b-0 sm:grid-cols-[160px_1fr]">
                <div className="text-[13px] font-bold">{label}</div>
                <div className="text-[13px] leading-relaxed text-faint">{desc}</div>
              </div>
            ))}
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div>
              <h3 className="text-[15px] font-bold">
                {isZh ? "什么算有效邀请？" : "What counts as a valid invite?"}
              </h3>
              <p className="mt-2 text-[13px] leading-relaxed text-faint">
                {isZh
                  ? "有效邀请需要满足：好友通过你的专属链接进入，完成登录或注册，并成功完成一次预置模型对比。单纯打开链接、重复注册、使用自己的邀请链接，都不会发放奖励。"
                  : "A valid invite requires the friend to enter through your personal link, sign in or sign up, and complete one preset-model comparison. Opening the link only, duplicate signups or using your own invite link do not issue rewards."}
              </p>
            </div>
            <div>
              <h3 className="text-[15px] font-bold">
                {isZh ? "为什么不是注册即发？" : "Why not reward immediately on signup?"}
              </h3>
              <p className="mt-2 text-[13px] leading-relaxed text-faint">
                {isZh
                  ? "共享模型会消耗站点维护的服务端 Key。要求完成首次体验后发奖，可以减少批量注册刷额度，也能确保新用户真的了解产品。"
                  : "Shared models consume server-side keys maintained by the site. Requiring a first real trial reduces quota abuse and ensures new users understand the product."}
              </p>
            </div>
          </div>
        </section>

        <section className="border-t border-line bg-card/60">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-8">
            <div>
              <div className="text-[15px] font-bold">
                {isZh ? "准备好邀请了吗？" : "Ready to invite?"}
              </div>
              <div className="mt-1 text-[12.5px] text-faint">
                {isZh
                  ? "登录后打开账号弹窗，就能复制你的专属邀请链接。"
                  : "After signing in, open the account dialog to copy your personal invite link."}
              </div>
            </div>
            <Link
              href={h("/arena")}
              className="rounded-lg bg-ink px-5 py-2.5 text-[13px] font-bold text-paper hover:opacity-90"
            >
              {isZh ? "打开竞速场" : "Open arena"}
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

function inviteJsonLd(locale: Locale) {
  const isZh = locale === "zh-CN";
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${BRAND.url}${localizedPath("/invite", locale)}#faq`,
    inLanguage: localeToLanguage(locale),
    mainEntity: [
      {
        "@type": "Question",
        name: isZh
          ? "TOKRACE 邀请好友可以获得多少免费次数？"
          : "How many free runs can I earn by inviting friends to TOKRACE?",
        acceptedAnswer: {
          "@type": "Answer",
          text: isZh
            ? `好友通过邀请链接注册并完成首次对比后，邀请人获得 ${REFERRAL_INVITER_REWARD} 次，被邀请人获得 ${REFERRAL_INVITEE_REWARD} 次。`
            : `After a friend signs up through your invite link and completes their first comparison, the inviter receives ${REFERRAL_INVITER_REWARD} runs and the invitee receives ${REFERRAL_INVITEE_REWARD} runs.`,
        },
      },
      {
        "@type": "Question",
        name: isZh ? "奖励次数什么时候扣除？" : "When are reward runs used?",
        acceptedAnswer: {
          "@type": "Answer",
          text: isZh
            ? "系统会先扣每日基础免费次数，基础次数用完后再扣邀请奖励余额。"
            : "The system uses daily base quota first, then deducts from referral reward balance after base quota is exhausted.",
        },
      },
    ],
  };
}
