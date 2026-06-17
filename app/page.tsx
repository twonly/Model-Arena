import Link from "next/link";
import { Credit, GITHUB_URL as GITHUB } from "@/components/Credit";
import { JsonLd } from "@/components/JsonLd";
import { BRAND } from "@/lib/brand";

export const metadata = {
  title: "大模型测速工具 - 实时对比 LLM 速度与首 Token 时延",
  description:
    "TOKRACE 帮开发者和 AI 测评作者用同一个 Prompt 并发测试多个大模型，实时对比首 Token 时延、输出 TPS、峰值速度和稳定性，可免费跑样例、生成分享快照和上榜。",
  alternates: { canonical: "/" },
};

/* 赛道演示数据：纯 CSS 动画，三条赛道不同速度 */
const LANES = [
  { name: "模型 A", tps: "312 tok/s", medal: "🥇", dur: "4.2s", w: "94%" },
  { name: "模型 B", tps: "187 tok/s", medal: "🥈", dur: "5.6s", w: "78%" },
  { name: "模型 C", tps: "96 tok/s", medal: "🥉", dur: "7.0s", w: "55%" },
];

const FEATURES: { icon: string; title: string; desc: string }[] = [
  {
    icon: "🏁",
    title: "同 Prompt 并发测速",
    desc: "同一个 Prompt 同时打向多个模型，减少先后顺序带来的网络与时段偏差。",
  },
  {
    icon: "⏱",
    title: "TTFT / TPS 实时对比",
    desc: "首 Token 时延、思考 TPS、输出 TPS、峰值速度和 token 数同步呈现。",
  },
  {
    icon: "📈",
    title: "速度曲线 · 可放大下载",
    desc: "2 秒滑动窗口的实时 tok/s 曲线，点击放大看峰值与任意时刻速度，一键导出 PNG。",
  },
  {
    icon: "🔌",
    title: "免费样例 + 自带 Key",
    desc: "新用户可直接跑预置模型；专业用户可接入自己的 OpenAI 兼容接口或原生 Anthropic 接口。",
  },
  {
    icon: "🔐",
    title: "Key 只存本地，绝不留存",
    desc: "API Key 只存在你本机 localStorage（加密）。每次请求经同源服务器中转一次，用完即弃，不记录、不落库。",
  },
  {
    icon: "📷",
    title: "为发文而生",
    desc: "可编辑标题备注、截图模式、自定义水印、指标表一键复制成 Markdown，截图即配图。",
  },
  {
    icon: "🧪",
    title: "接入即验证",
    desc: "一键拉取厂商模型列表、测试连通性；think / no-think 等私有参数每个模型单独配置。",
  },
  {
    icon: "🖼",
    title: "SVG 自动渲染",
    desc: "「画一只鹈鹕骑自行车」？输出里的 SVG 代码自动渲染成图，沙箱隔离脚本不执行。",
  },
];

const STEPS = [
  {
    n: "01",
    title: "先跑样例",
    desc: "不用配置 Key，直接用预置模型体验一次真实并发测速。",
  },
  {
    n: "02",
    title: "换成你的 Prompt",
    desc: "用自己的任务、长文、代码或视觉输入，比较模型在真实场景里的速度。",
  },
  {
    n: "03",
    title: "分享证据",
    desc: "生成快照、投票页和长图，让读者能复查你的测速结果。",
  },
];

export default function Landing() {
  return (
    <>
      <JsonLd data={homeJsonLd} />
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
            百模竞速
          </span>
          <span className="num text-[11px] text-faint">TOKRACE</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/stats"
            className="text-[13px] text-faint hover:text-ink"
          >
            速度榜
          </Link>
          <Link
            href="/board"
            className="text-[13px] text-faint hover:text-ink"
          >
            人气榜
          </Link>
          <Link
            href="/invite"
            className="text-[13px] text-faint hover:text-ink"
          >
            邀请奖励
          </Link>
          <a
            href={GITHUB}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md border border-line bg-card px-3.5 py-1.5 text-[13px] text-faint hover:text-ink"
          >
            GitHub
          </a>
          <Link
            href="/arena"
            className="rounded-md bg-ink px-4 py-1.5 text-[13px] font-bold text-paper"
          >
            进入竞速场 ▶
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
          免费跑样例 · 实时测速 · 分享可复查结果
        </div>
        <h1
          className="mx-auto max-w-4xl text-[40px] font-black leading-[1.15] sm:text-[54px]"
          style={{ fontFamily: "var(--font-title)" }}
        >
          开发者与 AI 测评作者的
          <span style={{ color: "var(--accent)" }}>实时模型测速台</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-[15px] leading-relaxed text-faint">
          用同一个 Prompt 并发测试多个 LLM，实时比较
          <span className="num text-ink"> 首 Token 时延 · 输出 TPS · 峰值速度 · 稳定性</span>
          。先跑免费样例，再换成你的真实任务和模型配置。
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/arena?sample=1"
            className="rounded-lg bg-ink px-7 py-3 text-[15px] font-bold text-paper shadow-sm hover:opacity-90"
          >
            立即跑样例 ▶
          </Link>
          <Link
            href="/arena"
            className="rounded-lg border border-line bg-card px-7 py-3 text-[15px] font-semibold text-ink hover:border-ink/40"
          >
            进入专业模式
          </Link>
          <Link
            href="/invite"
            className="rounded-lg border border-line bg-card px-7 py-3 text-[15px] font-semibold text-ink hover:border-ink/40"
          >
            邀请规则
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
              写一篇 5000 字短文，主题是「为什么速度本身就是一种能力」
            </span>
            <span className="num text-[11px]" style={{ color: "var(--accent)" }}>
              ● LIVE
            </span>
          </div>
          <div className="space-y-4 px-5 py-6">
            {LANES.map((lane, i) => (
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
              ["0.68", "s", "首Token"],
              ["102", "", "思考TPS"],
              ["312", "", "输出TPS"],
              ["387", "", "峰值 tok/s"],
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
          ↑ 演示动画 · 真实数据来自你在竞速场跑出的结果
        </p>
      </section>

      {/* 三步上手 */}
      <section className="border-y border-line bg-card/60">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-14 sm:grid-cols-3">
          {STEPS.map((s) => (
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
          从测速到分享证据，围绕一个闭环打磨
        </h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
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
            你的 Key，只属于你
          </h2>
          <p className="mt-4 text-[13.5px] leading-relaxed text-faint">
            API Key 仅保存在<span className="text-ink">你浏览器的 localStorage</span>
            ，请求经页面同源的轻量代理转发到各厂商（仅为解决浏览器跨域），
            服务端<span className="text-ink">不记录、不落盘</span>任何密钥与对话内容。
            介意经过任何服务器？项目完全开源——
            <code className="num rounded bg-paper px-1.5 py-0.5 text-[12px]">
              git clone && npm run dev
            </code>
            ，两分钟跑在自己电脑上。
          </p>
          <div className="mt-7 flex items-center justify-center gap-3">
            <Link
              href="/arena?sample=1"
              className="rounded-lg bg-ink px-6 py-2.5 text-[14px] font-bold text-paper hover:opacity-90"
            >
              立即跑样例 ▶
            </Link>
            <a
              href={GITHUB}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-line bg-card px-6 py-2.5 text-[14px] font-semibold hover:border-ink/40"
            >
              查看源码
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
          首Token 含网络往返 · TPS 按阶段活跃窗口独立计算 · tokens 官方 usage 优先
        </span>
      </footer>
    </div>
    </>
  );
}

// 首页增强 GEO 的结构化数据：HowTo + FAQPage
const homeJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "HowTo",
      "@id": `${BRAND.url}/#howto`,
      name: "如何用 TOKRACE 做大模型测速",
      description: "先跑免费样例，再用自己的 Prompt 并发测试多个 LLM，最后生成可复查的分享快照。",
      totalTime: "PT5M",
      step: [
        {
          "@type": "HowToStep",
          position: 1,
          name: "立即跑样例",
          text: "打开快速体验模式，用预置模型直接跑一轮首 Token 时延和输出 TPS 测试。",
          url: `${BRAND.url}/arena?sample=1`,
        },
        {
          "@type": "HowToStep",
          position: 2,
          name: "换成真实任务",
          text: "输入自己的 Prompt 或接入自己的模型 API Key，用同一任务并发测试多个 LLM。",
          url: `${BRAND.url}/arena`,
        },
        {
          "@type": "HowToStep",
          position: 3,
          name: "分享测速结果",
          text: "生成只读分享快照、投票页或长图，让读者能复查模型速度和输出内容。",
          url: `${BRAND.url}/arena`,
        },
      ],
    },
    {
      "@type": "FAQPage",
      "@id": `${BRAND.url}/#faq`,
      mainEntity: [
        {
          "@type": "Question",
          name: "TOKRACE 是什么？",
          acceptedAnswer: {
            "@type": "Answer",
            text: "TOKRACE 是面向开发者和 AI 测评作者的大模型测速工具，可用同一个 Prompt 并发测试多个 LLM 的首 Token 时延、输出 TPS、峰值速度和稳定性。",
          },
        },
        {
          "@type": "Question",
          name: "使用 TOKRACE 需要付费吗？",
          acceptedAnswer: {
            "@type": "Answer",
            text: "可以免费跑预置模型样例；专业使用可填入自己的模型 API Key。项目开源，服务端不存储、不落盘任何密钥。",
          },
        },
        {
          "@type": "Question",
          name: "我的 API Key 会泄露吗？",
          acceptedAnswer: {
            "@type": "Answer",
            text: "API Key 仅保存在你浏览器的 localStorage，请求经页面同源服务转发到厂商（仅为解决浏览器跨域），服务端不记录、不落盘任何密钥与对话内容。",
          },
        },
        {
          "@type": "Question",
          name: "速度榜的数据从哪来？",
          acceptedAnswer: {
            "@type": "Answer",
            text: "速度榜与人气榜的数据来自用户自愿匿名共享的指标与投票，仅含速度数字，不含任何 Prompt 内容与 API Key。",
          },
        },
      ],
    },
  ],
};
