import Link from "next/link";
import { Credit } from "@/components/Credit";
import { Logo } from "@/components/Logo";
import { JsonLd } from "@/components/JsonLd";
import { BRAND } from "@/lib/brand";
import { getMessages } from "@/lib/i18n-messages";
import { getRequestLocale } from "@/lib/i18n-server";
import { localeToLanguage, localizedPath, type Locale } from "@/lib/i18n";

export const metadata = {
  title: "测速方法论：指标定义与测量方式",
  description:
    "百模竞速如何测量大模型速度：首 Token 时延（TTFT）、思考 / 输出 tokens per second、峰值速度的精确定义，以及计时方式、token 口径与公平性保证。开源可复现。",
  alternates: { canonical: "/method" },
};

function articleJsonLd(locale: Locale) {
  const messages = getMessages(locale);
  const url = `${BRAND.url}${localizedPath("/method", locale)}`;
  return {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: locale === "en" ? "LLM speed testing methodology" : "大模型测速方法论",
    description: messages.metadata.method.description,
    url,
    inLanguage: localeToLanguage(locale),
    isAccessibleForFree: true,
    author: { "@type": "Organization", name: BRAND.publisher },
    publisher: { "@type": "Organization", name: BRAND.publisher, url: BRAND.url },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
  };
}

function faqJsonLd(locale: Locale) {
  const isZh = locale === "zh-CN";
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    inLanguage: localeToLanguage(locale),
    mainEntity: [
      {
        "@type": "Question",
        name: isZh ? "首 Token 时延（TTFT）是怎么测的？" : "How is TTFT measured?",
        acceptedAnswer: {
          "@type": "Answer",
          text: isZh
            ? "从请求发出到收到第一个 token（思考或正文均可）的时间。计时基准取服务端在收到每个 delta 时盖的时间戳，避免浏览器渲染卡顿污染测量。"
            : "TTFT is the time from sending the request to receiving the first token, whether thinking or final content. TOKRACE uses server-side timestamps on each delta to avoid browser rendering jitter.",
        },
      },
      {
        "@type": "Question",
        name: isZh ? "输出速度（tokens/s）用什么口径？" : "Which token/s definition is used?",
        acceptedAnswer: {
          "@type": "Answer",
          text: isZh
            ? "优先采用厂商官方 usage 返回的 token 总数；缺失时用统一估算并按官方总量校准。速度按「首 token 到末 token」的活跃窗口计算，不含收尾等待时间。"
            : "TOKRACE prefers official usage token counts. When missing, it estimates consistently and calibrates to official totals when available. Speed is measured over the active first-to-last-token window.",
        },
      },
      {
        "@type": "Question",
        name: isZh ? "这个测速公平吗？" : "Is the test fair?",
        acceptedAnswer: {
          "@type": "Answer",
          text: isZh
            ? "所有模型用同一个 Prompt、同一时刻并发发起，使用完全相同的计时与 token 口径。项目开源、可自行复现。速度受网络、时段、厂商负载影响，仅供参考。"
            : "All enabled models receive the same prompt at the same time with the same timing and token accounting. The project is open source and reproducible; network and provider load still affect results.",
        },
      },
    ],
  };
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-7">
      <h2 className="text-[17px] font-bold">{title}</h2>
      <div className="mt-2 space-y-2 text-[13.5px] leading-relaxed text-faint">
        {children}
      </div>
    </section>
  );
}

export default async function MethodPage() {
  const locale = await getRequestLocale();
  const messages = getMessages(locale);
  const h = (path: string) => localizedPath(path, locale);
  const isZh = locale === "zh-CN";
  return (
    <main className="mx-auto max-w-3xl px-5 py-8">
      <JsonLd data={articleJsonLd(locale)} />
      <JsonLd data={faqJsonLd(locale)} />

      <nav className="mb-6 flex items-center justify-between">
        <Logo withText />
        <Link
          href={h("/arena")}
          className="rounded-md bg-ink px-3.5 py-1.5 text-[13px] font-bold text-paper"
        >
          {messages.common.testNow} ▶
        </Link>
      </nav>

      <header>
        <h1
          className="text-[30px] font-black"
          style={{ fontFamily: "var(--font-title)" }}
        >
          {isZh ? "测速方法论" : "Speed Testing Methodology"}
        </h1>
        <p className="mt-2 text-[13.5px] text-faint">
          {isZh
            ? "我们如何定义和测量大模型速度，以及为什么这套方法是公平、可复现的。"
            : "How TOKRACE defines and measures LLM speed, and why the method is fair and reproducible."}
        </p>
      </header>

      <Section title={isZh ? "为什么并发同测" : "Why concurrent testing"}>
        <p>
          {isZh ? (
            <>
              所有启用的模型用<strong className="text-ink">同一个 Prompt</strong>、在
              <strong className="text-ink">同一时刻并发发起</strong>，而不是一个接一个跑。
              这样每个模型面对的网络环境、时段、提示词完全一致，排除了先后顺序带来的系统性偏差。
            </>
          ) : (
            <>
              All enabled models receive <strong className="text-ink">the same prompt</strong>{" "}
              and are started <strong className="text-ink">at the same time</strong>,
              instead of one after another. This keeps network conditions, time of day and
              prompt content aligned.
            </>
          )}
        </p>
      </Section>

      <Section title={isZh ? "首 Token 时延 TTFT" : "Time to first token (TTFT)"}>
        <p>
          {isZh ? (
            <>
              从请求发出到收到<strong className="text-ink">第一个 token</strong>（思考或正文均算）的毫秒数。
              计时基准取<strong className="text-ink">服务端</strong>在收到每个增量（delta）时盖的时间戳，
              而非浏览器本地时钟——这样浏览器渲染或解析卡顿不会污染测量结果。
            </>
          ) : (
            <>
              TTFT is the milliseconds from sending the request to receiving the
              <strong className="text-ink"> first token</strong>, including thinking or
              final content. Timing uses <strong className="text-ink">server</strong>
              timestamps for each delta, not browser-local rendering time.
            </>
          )}
        </p>
      </Section>

      <Section title={isZh ? "思考 / 输出速度（tokens per second）" : "Thinking and output speed"}>
        <p>
          {isZh
            ? "对会思考的模型，思考阶段与正文阶段分别独立计时：各取该阶段首末增量的活跃窗口，思考时长不含「思考结束→正文开始」的空隙，输出时长不含最后一个 token 之后等待 usage 收尾的时间。"
            : "For models with thinking output, thinking and final content are timed separately using each stage's active first-to-last-delta window. Gaps between stages and post-output usage waits are excluded."}
        </p>
        <p>
          {isZh
            ? "token 口径优先采用厂商官方 usage 返回的总数；厂商未返回时用统一字符估算，并在结束后按官方总量整体校准，使峰值与曲线读数与官方口径一致。"
            : "Token counts prefer the provider's official usage values. When missing, TOKRACE uses a consistent character estimate and calibrates to official totals when available."}
        </p>
      </Section>

      <Section title={isZh ? "峰值速度" : "Peak speed"}>
        <p>
          {isZh
            ? "以 2 秒滑动窗口计算瞬时 tokens/s 的最大值，并按官方 token 总量校准后取峰值。反映模型在解码阶段的吞吐上限。"
            : "Peak speed is the maximum instant tokens/s over a 2-second sliding window, calibrated to official token totals when available."}
        </p>
      </Section>

      <Section title={isZh ? "数据来源与隐私" : "Data source and privacy"}>
        <p>
          {isZh
            ? "排行榜数据来自用户在竞速场跑完后自愿匿名共享，仅上报速度指标，不含任何 Prompt 内容与 API Key。同一模型的不同接入点（厂商域名）分开统计，互不混淆。数据每 5 分钟更新。"
            : "Leaderboard data comes from voluntary anonymous sharing after arena runs. Only speed metrics are reported, never prompts or API keys. Different endpoints for the same model are tracked separately."}
        </p>
      </Section>

      <Section title={isZh ? "局限与公平性" : "Limits and fairness"}>
        <p>
          {isZh
            ? "速度受网络、时段、厂商负载影响，单次结果有波动，排行榜以中位数降低偶发抖动的影响，但仍仅供参考、不构成绝对结论。项目开源、可自行复现，我们不接受任何以排名位置为对价的合作。"
            : "Speed varies with network conditions, time of day and provider load. Leaderboards use medians to reduce one-off jitter, but results are still reference data, not absolute truth. The project is open source and reproducible."}
        </p>
      </Section>

      <div className="mt-8 flex flex-wrap gap-2">
        <Link
          href={h("/stats")}
          className="rounded-md border border-line px-4 py-2 text-[13px] text-faint hover:text-ink"
        >
          {isZh ? "查看速度排行榜" : "View speed leaderboard"} →
        </Link>
        <Link
          href={h("/arena")}
          className="rounded-md bg-ink px-4 py-2 text-[13px] font-bold text-paper"
        >
          {isZh ? "去竞速场实测" : "Run a live test"} ▶
        </Link>
      </div>

      <footer className="mt-8 flex justify-center">
        <Credit compact />
      </footer>
    </main>
  );
}
