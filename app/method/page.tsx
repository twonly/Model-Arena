import Link from "next/link";
import { Credit } from "@/components/Credit";
import { Logo } from "@/components/Logo";
import { JsonLd } from "@/components/JsonLd";
import { BRAND } from "@/lib/brand";

export const metadata = {
  title: "测速方法论：指标定义与测量方式",
  description:
    "百模竞速如何测量大模型速度：首 Token 时延（TTFT）、思考 / 输出 tokens per second、峰值速度的精确定义，以及计时方式、token 口径与公平性保证。开源可复现。",
  alternates: { canonical: "/method" },
};

const url = `${BRAND.url}/method`;

const articleJsonLd = {
  "@context": "https://schema.org",
  "@type": "TechArticle",
  headline: "大模型测速方法论",
  description: metadata.description,
  url,
  inLanguage: "zh-CN",
  isAccessibleForFree: true,
  author: { "@type": "Organization", name: BRAND.publisher },
  publisher: { "@type": "Organization", name: BRAND.publisher, url: BRAND.url },
  mainEntityOfPage: { "@type": "WebPage", "@id": url },
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "首 Token 时延（TTFT）是怎么测的？",
      acceptedAnswer: {
        "@type": "Answer",
        text: "从请求发出到收到第一个 token（思考或正文均可）的时间。计时基准取服务端在收到每个 delta 时盖的时间戳，避免浏览器渲染卡顿污染测量。",
      },
    },
    {
      "@type": "Question",
      name: "输出速度（tokens/s）用什么口径？",
      acceptedAnswer: {
        "@type": "Answer",
        text: "优先采用厂商官方 usage 返回的 token 总数；缺失时用统一估算并按官方总量校准。速度按「首 token 到末 token」的活跃窗口计算，不含收尾等待时间。",
      },
    },
    {
      "@type": "Question",
      name: "这个测速公平吗？",
      acceptedAnswer: {
        "@type": "Answer",
        text: "所有模型用同一个 Prompt、同一时刻并发发起，使用完全相同的计时与 token 口径。项目开源、可自行复现。速度受网络、时段、厂商负载影响，仅供参考。",
      },
    },
  ],
};

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

export default function MethodPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-8">
      <JsonLd data={articleJsonLd} />
      <JsonLd data={faqJsonLd} />

      <nav className="mb-6 flex items-center justify-between">
        <Logo withText />
        <Link
          href="/arena"
          className="rounded-md bg-ink px-3.5 py-1.5 text-[13px] font-bold text-paper"
        >
          我也来测 ▶
        </Link>
      </nav>

      <header>
        <h1
          className="text-[30px] font-black"
          style={{ fontFamily: "var(--font-title)" }}
        >
          测速方法论
        </h1>
        <p className="mt-2 text-[13.5px] text-faint">
          我们如何定义和测量大模型速度，以及为什么这套方法是公平、可复现的。
        </p>
      </header>

      <Section title="为什么并发同测">
        <p>
          所有启用的模型用<strong className="text-ink">同一个 Prompt</strong>、在
          <strong className="text-ink">同一时刻并发发起</strong>，而不是一个接一个跑。
          这样每个模型面对的网络环境、时段、提示词完全一致，排除了先后顺序带来的系统性偏差。
        </p>
      </Section>

      <Section title="首 Token 时延 TTFT">
        <p>
          从请求发出到收到<strong className="text-ink">第一个 token</strong>（思考或正文均算）的毫秒数。
          计时基准取<strong className="text-ink">服务端</strong>在收到每个增量（delta）时盖的时间戳，
          而非浏览器本地时钟——这样浏览器渲染或解析卡顿不会污染测量结果。
        </p>
      </Section>

      <Section title="思考 / 输出速度（tokens per second）">
        <p>
          对会思考的模型，思考阶段与正文阶段<strong className="text-ink">分别独立计时</strong>：
          各取该阶段首末增量的活跃窗口，思考时长不含「思考结束→正文开始」的空隙，
          输出时长不含最后一个 token 之后等待 usage 收尾的时间。
        </p>
        <p>
          token 口径<strong className="text-ink">优先采用厂商官方 usage</strong> 返回的总数；
          厂商未返回时用统一字符估算，并在结束后按官方总量整体校准，使峰值与曲线读数与官方口径一致。
        </p>
      </Section>

      <Section title="峰值速度">
        <p>
          以 2 秒滑动窗口计算瞬时 tokens/s 的最大值，并按官方 token 总量校准后取峰值。
          反映模型在解码阶段的吞吐上限。
        </p>
      </Section>

      <Section title="数据来源与隐私">
        <p>
          排行榜数据来自用户在竞速场跑完后<strong className="text-ink">自愿匿名共享</strong>，
          仅上报速度指标，<strong className="text-ink">不含任何 Prompt 内容与 API Key</strong>。
          同一模型的不同接入点（厂商域名）分开统计，互不混淆。数据每 5 分钟更新。
        </p>
      </Section>

      <Section title="局限与公平性">
        <p>
          速度受<strong className="text-ink">网络、时段、厂商负载</strong>影响，单次结果有波动，
          排行榜以中位数降低偶发抖动的影响，但仍仅供参考、不构成绝对结论。
          项目<strong className="text-ink">开源、可自行复现</strong>，
          我们不接受任何以排名位置为对价的合作。
        </p>
      </Section>

      <div className="mt-8 flex flex-wrap gap-2">
        <Link
          href="/stats"
          className="rounded-md border border-line px-4 py-2 text-[13px] text-faint hover:text-ink"
        >
          查看速度排行榜 →
        </Link>
        <Link
          href="/arena"
          className="rounded-md bg-ink px-4 py-2 text-[13px] font-bold text-paper"
        >
          去竞速场实测 ▶
        </Link>
      </div>

      <footer className="mt-8 flex justify-center">
        <Credit compact />
      </footer>
    </main>
  );
}
