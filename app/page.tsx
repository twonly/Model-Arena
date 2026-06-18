import Link from "next/link";
import { Credit, GITHUB_URL as GITHUB } from "@/components/Credit";
import { JsonLd } from "@/components/JsonLd";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { BRAND } from "@/lib/brand";
import { getMessages } from "@/lib/i18n-messages";
import { getRequestLocale } from "@/lib/i18n-server";
import { localeToLanguage, localizedPath } from "@/lib/i18n";

export const metadata = {
  title: "大模型测速工具 - 实时对比 LLM 速度与首 Token 时延",
  description:
    "TOKRACE 帮开发者和 AI 测评作者用同一个 Prompt 并发测试多个大模型，实时对比首 Token 时延、输出 TPS、峰值速度和稳定性，可免费跑样例、生成分享快照和上榜。",
  alternates: { canonical: "/" },
};

/* 赛道演示数据：纯 CSS 动画，三条赛道不同速度 */
const LANES = [
  { tps: "312 tok/s", medal: "🥇", dur: "4.2s", w: "94%" },
  { tps: "187 tok/s", medal: "🥈", dur: "5.6s", w: "78%" },
  { tps: "96 tok/s", medal: "🥉", dur: "7.0s", w: "55%" },
];

export default async function Landing() {
  const locale = await getRequestLocale();
  const messages = getMessages(locale);
  const h = (path: string) => localizedPath(path, locale);
  const lanes = LANES.map((lane, index) => ({
    ...lane,
    name: messages.home.lanes[index] ?? `Model ${index + 1}`,
  }));

  return (
    <>
      <JsonLd data={homeJsonLd(locale)} />
      <div className="min-h-screen">
      {/* 导航 */}
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="TOKRACE 百模竞速"
            width={26}
            height={26}
            className="shrink-0"
          />
          <span
            className="text-[20px] font-black"
            style={{ fontFamily: "var(--font-title)" }}
          >
            {messages.home.navBrand}
          </span>
          <span className="num text-[11px] text-faint">TOKRACE</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={h("/stats")}
            className="text-[13px] text-faint hover:text-ink"
          >
            {messages.common.stats}
          </Link>
          <Link
            href={h("/board")}
            className="text-[13px] text-faint hover:text-ink"
          >
            {messages.common.board}
          </Link>
          <Link
            href={h("/templates")}
            className="text-[13px] text-faint hover:text-ink"
          >
            {messages.common.templates}
          </Link>
          <Link
            href={h("/invite")}
            className="text-[13px] text-faint hover:text-ink"
          >
            {messages.common.invite}
          </Link>
          <LanguageSwitcher compact />
          <a
            href={GITHUB}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md border border-line bg-card px-3.5 py-1.5 text-[13px] text-faint hover:text-ink"
          >
            GitHub
          </a>
          <Link
            href={h("/arena")}
            className="rounded-md bg-ink px-4 py-1.5 text-[13px] font-bold text-paper"
          >
            {messages.common.startRace} ▶
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <header className="mx-auto max-w-6xl px-6 pt-14 pb-10 text-center">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-line bg-card px-3.5 py-1 text-[12px] text-faint">
          <span
            className="inline-block h-1.5 w-1.5 rounded-full"
            style={{ background: "var(--accent)" }}
          />
          {messages.home.badge}
        </div>
        <h1
          className="mx-auto max-w-4xl text-[40px] font-black leading-[1.15] sm:text-[54px]"
          style={{ fontFamily: "var(--font-title)" }}
        >
          {messages.home.titlePrefix}
          <span style={{ color: "var(--accent)" }}>{messages.home.titleAccent}</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-[15px] leading-relaxed text-faint">
          {messages.home.leadPrefix}
          <span className="num text-ink">{messages.home.leadMetrics}</span>
          {messages.home.leadSuffix}
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href={h("/arena?sample=1")}
            className="rounded-lg bg-ink px-7 py-3 text-[15px] font-bold text-paper shadow-sm hover:opacity-90"
          >
            {messages.common.runSample} ▶
          </Link>
          <Link
            href={h("/arena")}
            className="rounded-lg border border-line bg-card px-7 py-3 text-[15px] font-semibold text-ink hover:border-ink/40"
          >
            {messages.common.professionalMode}
          </Link>
          <Link
            href={h("/templates")}
            className="rounded-lg border border-line bg-card px-7 py-3 text-[15px] font-semibold text-ink hover:border-ink/40"
          >
            {messages.common.templates}
          </Link>
          <Link
            href={h("/invite")}
            className="rounded-lg border border-line bg-card px-7 py-3 text-[15px] font-semibold text-ink hover:border-ink/40"
          >
            {messages.common.invite}
          </Link>
          <a
            href={GITHUB}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-line bg-card px-7 py-3 text-[15px] font-semibold text-ink hover:border-ink/40"
          >
            GitHub
          </a>
        </div>
        <div className="mt-5 flex justify-center">
          <Credit />
        </div>
      </header>

      {/* 赛道演示（纯 CSS 动画） */}
      <section className="mx-auto max-w-4xl px-6 pb-16">
        <div className="overflow-hidden rounded-xl border border-line bg-card shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between border-b border-line px-5 py-3">
            <span className="text-[13px] font-bold">
              {messages.home.demoPrompt}
            </span>
            <span className="num text-[11px]" style={{ color: "var(--accent)" }}>
              {messages.home.live}
            </span>
          </div>
          <div className="space-y-4 px-5 py-6">
            {lanes.map((lane, i) => (
              <div key={lane.name}>
                <div className="mb-1.5 flex items-baseline justify-between">
                  <span className="text-[13px] font-semibold">
                    {lane.name}{" "}
                    <span
                      className="race-medal text-[13px]"
                      style={{ animationDelay: lane.dur }}
                    >
                      {lane.medal}
                    </span>
                  </span>
                  <span className="num text-[12px] text-faint">{lane.tps}</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-paper">
                  <div
                    className="race-bar h-full rounded-full"
                    style={{
                      animationDuration: lane.dur,
                      animationDelay: `${i * 0.15}s`,
                      // @ts-expect-error CSS 自定义属性
                      "--lane-w": lane.w,
                      background:
                        i === 0
                          ? "var(--accent)"
                          : i === 1
                            ? "var(--ink)"
                            : "var(--faint)",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          {/* 指标栏（仿真实卡片） */}
          <div className="grid grid-cols-4 divide-x divide-line border-t border-line bg-paper/50">
            {[
              ["0.68", "s", messages.home.metrics[0]],
              ["102", "", messages.home.metrics[1]],
              ["312", "", messages.home.metrics[2]],
              ["387", "", messages.home.metrics[3]],
            ].map(([v, unit, label]) => (
              <div key={label} className="flex flex-col items-center gap-1 py-4">
                <div className="num text-[26px] font-bold leading-none">
                  {v}
                  {unit && (
                    <span className="ml-0.5 text-[12px] font-medium text-faint">
                      {unit}
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-faint">{label}</div>
              </div>
            ))}
          </div>
        </div>
        <p className="mt-3 text-center text-[11.5px] text-faint/80">
          {locale === "zh-CN"
            ? "↑ 演示动画 · 真实数据来自你在竞速场跑出的结果"
            : "↑ Demo animation · real data comes from your arena runs"}
        </p>
      </section>

      {/* 三步上手 */}
      <section className="border-y border-line bg-card/60">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-14 sm:grid-cols-3">
          {messages.home.steps.map((s) => (
            <div key={s.n}>
              <div
                className="num text-[36px] font-bold leading-none"
                style={{ color: "var(--accent)", opacity: 0.85 }}
              >
                {s.n}
              </div>
              <div className="mt-2 text-[16px] font-bold">{s.title}</div>
              <div className="mt-1.5 text-[13px] leading-relaxed text-faint">
                {s.desc}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 功能特性 */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2
          className="text-center text-[28px] font-black"
          style={{ fontFamily: "var(--font-title)" }}
        >
          {messages.home.featuresTitle}
        </h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {messages.home.features.map((f) => (
            <div
              key={f.title}
              className="rounded-lg border border-line bg-card p-5 transition-colors hover:border-ink/30"
            >
              <div className="text-[22px]">{f.icon}</div>
              <div className="mt-2.5 text-[14px] font-bold">{f.title}</div>
              <div className="mt-1.5 text-[12.5px] leading-relaxed text-faint">
                {f.desc}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 隐私与架构 */}
      <section className="border-t border-line bg-card/60">
        <div className="mx-auto max-w-3xl px-6 py-14 text-center">
          <h2
            className="text-[24px] font-black"
            style={{ fontFamily: "var(--font-title)" }}
          >
            {locale === "zh-CN" ? "你的 Key，只属于你" : "Your keys stay yours"}
          </h2>
          <p className="mt-4 text-[13.5px] leading-relaxed text-faint">
            {locale === "zh-CN" ? (
              <>
                API Key 仅保存在
                <span className="text-ink">你浏览器的 localStorage</span>
                ，请求经页面同源的轻量代理转发到各厂商（仅为解决浏览器跨域），服务端
                <span className="text-ink">不记录、不落盘</span>任何密钥与对话内容。
                介意经过任何服务器？项目完全开源——
              </>
            ) : (
              <>
                API keys are stored only in
                <span className="text-ink"> your browser localStorage</span>. Requests
                pass through a same-origin proxy only to avoid browser CORS; the server
                <span className="text-ink"> does not log or persist</span> keys or
                conversation content. Prefer no hosted proxy at all? The project is open
                source:
              </>
            )}
            <code className="num rounded bg-paper px-1.5 py-0.5 text-[12px]">
              git clone && npm run dev
            </code>
            {locale === "zh-CN" ? "，两分钟跑在自己电脑上。" : "."}
          </p>
          <div className="mt-7 flex items-center justify-center gap-3">
            <Link
              href={h("/arena?sample=1")}
              className="rounded-lg bg-ink px-6 py-2.5 text-[14px] font-bold text-paper hover:opacity-90"
            >
              {messages.common.runSample} ▶
            </Link>
            <a
              href={GITHUB}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-line bg-card px-6 py-2.5 text-[14px] font-semibold hover:border-ink/40"
            >
              {locale === "zh-CN" ? "查看源码" : "View source"}
            </a>
          </div>
        </div>
      </section>

      <footer className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-6 py-8 text-[12px] text-faint">
        <span className="flex flex-wrap items-center gap-2">
          <span>
            {BRAND.full} ·{" "}
            <a href={BRAND.url} className="hover:text-ink">
              {BRAND.domain}
            </a>
          </span>
          <Credit />
        </span>
        <span className="num">
          {locale === "zh-CN"
            ? "首Token 含网络往返 · TPS 按阶段活跃窗口独立计算 · tokens 官方 usage 优先"
            : "TTFT includes network round trip · TPS uses per-stage active windows · official usage tokens first"}
        </span>
      </footer>
    </div>
    </>
  );
}

// 首页增强 GEO 的结构化数据：HowTo + FAQPage
function homeJsonLd(locale: Awaited<ReturnType<typeof getRequestLocale>>) {
  const isZh = locale === "zh-CN";
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "HowTo",
        "@id": `${BRAND.url}/#howto`,
        name: isZh ? "如何用 TOKRACE 做大模型测速" : "How to test LLM speed with TOKRACE",
        description: isZh
          ? "先跑免费样例，再用自己的 Prompt 并发测试多个 LLM，最后生成可复查的分享快照。"
          : "Start with a free sample, run your own prompt across multiple LLMs concurrently, then generate an inspectable share snapshot.",
        totalTime: "PT5M",
        inLanguage: localeToLanguage(locale),
        step: [
          {
            "@type": "HowToStep",
            position: 1,
            name: isZh ? "立即跑样例" : "Run a sample",
            text: isZh
              ? "打开快速体验模式，用预置模型直接跑一轮首 Token 时延和输出 TPS 测试。"
              : "Open quick sample mode and run a TTFT/output TPS test with preset models.",
            url: `${BRAND.url}${localizedPath("/arena?sample=1", locale)}`,
          },
          {
            "@type": "HowToStep",
            position: 2,
            name: isZh ? "换成真实任务" : "Use your real task",
            text: isZh
              ? "输入自己的 Prompt 或接入自己的模型 API Key，用同一任务并发测试多个 LLM。"
              : "Enter your own prompt or connect your model API keys, then test multiple LLMs on the same task.",
            url: `${BRAND.url}${localizedPath("/arena", locale)}`,
          },
          {
            "@type": "HowToStep",
            position: 3,
            name: isZh ? "分享测速结果" : "Share the result",
            text: isZh
              ? "生成只读分享快照、投票页或长图，让读者能复查模型速度和输出内容。"
              : "Generate a read-only snapshot, voting page or long image so readers can inspect speed and output.",
            url: `${BRAND.url}${localizedPath("/arena", locale)}`,
          },
        ],
      },
      {
        "@type": "FAQPage",
        "@id": `${BRAND.url}/#faq`,
        inLanguage: localeToLanguage(locale),
        mainEntity: [
          {
            "@type": "Question",
            name: isZh ? "TOKRACE 是什么？" : "What is TOKRACE?",
            acceptedAnswer: {
              "@type": "Answer",
              text: isZh
                ? "TOKRACE 是面向开发者和 AI 测评作者的大模型测速工具，可用同一个 Prompt 并发测试多个 LLM 的首 Token 时延、输出 TPS、峰值速度和稳定性。"
                : "TOKRACE is an LLM speed testing bench for developers and AI reviewers. It runs one prompt across multiple LLMs and compares TTFT, output TPS, peak speed and stability.",
            },
          },
          {
            "@type": "Question",
            name: isZh ? "使用 TOKRACE 需要付费吗？" : "Is TOKRACE free to use?",
            acceptedAnswer: {
              "@type": "Answer",
              text: isZh
                ? "可以免费跑预置模型样例；专业使用可填入自己的模型 API Key。项目开源，服务端不存储、不落盘任何密钥。"
                : "You can run preset sample models for free. Advanced users can add their own model API keys. The project is open source and the server does not persist keys.",
            },
          },
          {
            "@type": "Question",
            name: isZh ? "我的 API Key 会泄露吗？" : "Will my API key be exposed?",
            acceptedAnswer: {
              "@type": "Answer",
              text: isZh
                ? "API Key 仅保存在你浏览器的 localStorage，请求经页面同源服务转发到厂商（仅为解决浏览器跨域），服务端不记录、不落盘任何密钥与对话内容。"
                : "API keys are stored only in your browser localStorage. Requests pass through the same-origin service only to avoid browser CORS; the server does not log or persist keys or conversation content.",
            },
          },
          {
            "@type": "Question",
            name: isZh ? "速度榜的数据从哪来？" : "Where does leaderboard data come from?",
            acceptedAnswer: {
              "@type": "Answer",
              text: isZh
                ? "速度榜与人气榜的数据来自用户自愿匿名共享的指标与投票，仅含速度数字，不含任何 Prompt 内容与 API Key。"
                : "Speed and audience leaderboards use metrics and votes that users voluntarily share anonymously. They contain speed numbers only, not prompts or API keys.",
            },
          },
        ],
      },
    ],
  };
}
