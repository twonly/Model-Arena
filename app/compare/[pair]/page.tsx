import Link from "next/link";
import { notFound } from "next/navigation";
import { Credit } from "@/components/Credit";
import { Logo } from "@/components/Logo";
import { JsonLd } from "@/components/JsonLd";
import { SocialSharePanel } from "@/components/SocialSharePanel";
import { compareBadgeAlt, htmlBadge, markdownBadge } from "@/lib/badge";
import { BRAND, OG_IMAGE } from "@/lib/brand";
import { modelSlug } from "@/lib/stats";
import {
  compareVerdict as verdict,
  fmtMetric as fmt,
  fmtSeconds as secs,
  loadComparePair as load,
} from "@/lib/seo-models";
import {
  DEFAULT_LOCALE,
  localeToLanguage,
  localeToOg,
  localizedPath,
  normalizeLocale,
} from "@/lib/i18n";
import { getMessages } from "@/lib/i18n-messages";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ pair: string; lang?: string }>;
}) {
  const { pair, lang } = await params;
  const locale = normalizeLocale(lang) ?? DEFAULT_LOCALE;
  const messages = getMessages(locale);
  const p = await load(pair).catch(() => null);
  if (!p)
    return {
      title: messages.metadata.compare.fallbackTitle,
      alternates: { canonical: localizedPath(`/compare/${pair}`, locale) },
    };
  const title =
    locale === "en"
      ? `${p.a.model} vs ${p.b.model} speed comparison: which is faster?`
      : `${p.a.model} vs ${p.b.model} 速度对比：谁更快？`;
  const description =
    locale === "en"
      ? `${p.a.model} vs ${p.b.model} real-world speed comparison: ${verdict(
          p.a,
          p.b,
          locale
        )} Based on anonymous user runs.`
      : `${p.a.model} 与 ${p.b.model} 实测速度横评：${verdict(
          p.a,
          p.b,
          locale
        )}基于全网用户匿名实测数据。`;
  const canonical = localizedPath(`/compare/${p.canonical}`, locale);
  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        "zh-CN": localizedPath(`/compare/${p.canonical}`, "zh-CN"),
        en: localizedPath(`/compare/${p.canonical}`, "en"),
        "x-default": localizedPath(`/compare/${p.canonical}`, "zh-CN"),
      },
    },
    openGraph: {
      type: "article",
      title,
      description,
      url: canonical,
      locale: localeToOg(locale),
      images: [OG_IMAGE],
    },
    twitter: { card: "summary_large_image", title, description, images: [OG_IMAGE.url] },
  };
}

export default async function ComparePage({
  params,
}: {
  params: Promise<{ pair: string; lang?: string }>;
}) {
  const { pair, lang } = await params;
  const locale = normalizeLocale(lang) ?? DEFAULT_LOCALE;
  const messages = getMessages(locale);
  const isZh = locale === "zh-CN";
  const h = (path: string) => localizedPath(path, locale);
  const p = await load(pair);
  if (!p) notFound();
  const { a, b } = p;
  const url = `${BRAND.url}${h(`/compare/${p.canonical}`)}`;
  const v = verdict(a, b, locale);
  const badgeUrl = `${BRAND.url}/api/badge/compare/${p.canonical}?locale=${locale}`;
  const badgeAlt = compareBadgeAlt(a, b, locale);
  const badgeMarkdown = markdownBadge({
    alt: badgeAlt,
    badgeUrl,
    targetUrl: url,
  });
  const badgeHtml = htmlBadge({
    alt: badgeAlt,
    badgeUrl,
    targetUrl: url,
  });
  const faq = [
    {
      q: isZh
        ? `${a.model} 和 ${b.model} 哪个输出更快？`
        : `Which model outputs faster, ${a.model} or ${b.model}?`,
      a: v,
    },
    {
      q: isZh ? "为什么输出速度和首 Token 可能不是同一个赢家？" : "Why can output speed and TTFT have different winners?",
      a: isZh
        ? "输出 tok/s 衡量持续生成速度，TTFT 衡量请求发出到第一个 token 返回的等待时间。一个模型可能长文生成快，但排队或首响更慢。"
        : "Output tok/s measures sustained generation speed, while TTFT measures the wait until the first token. A model can generate long text faster while still taking longer to start.",
    },
    {
      q: isZh ? "我应该如何复测这个对比？" : "How should I rerun this comparison?",
      a: isZh
        ? "建议在竞速场使用同一个 Prompt、相同温度和相同网络条件重复跑几次，再结合质量结果做模型选型。"
        : "Use the arena with the same Prompt, temperature and network conditions, then repeat a few times and combine the speed data with output quality.",
    },
    {
      q: isZh ? "可以把这个对比嵌入到 GitHub 或文章里吗？" : "Can I embed this comparison in GitHub or an article?",
      a: isZh
        ? `可以。页面提供 Markdown 和 HTML Badge，图片地址为 ${badgeUrl}。`
        : `Yes. This page provides Markdown and HTML badges. The badge image URL is ${badgeUrl}.`,
    },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "TechArticle",
        "@id": `${url}#article`,
        headline: isZh
          ? `${a.model} vs ${b.model} 速度对比`
          : `${a.model} vs ${b.model} speed comparison`,
        description: v,
        url,
        inLanguage: localeToLanguage(locale),
        isAccessibleForFree: true,
        author: { "@type": "Organization", name: BRAND.publisher },
        publisher: { "@type": "Organization", name: BRAND.publisher, url: BRAND.url },
        mainEntityOfPage: { "@type": "WebPage", "@id": url },
      },
      {
        "@type": "FAQPage",
        mainEntity: faq.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: { "@type": "Answer", text: item.a },
        })),
      },
    ],
  };
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: BRAND.en, item: BRAND.url },
      { "@type": "ListItem", position: 2, name: messages.common.stats, item: `${BRAND.url}${h("/stats")}` },
      { "@type": "ListItem", position: 3, name: `${a.model} vs ${b.model}`, item: url },
    ],
  };

  const Row = ({
    label,
    av,
    bv,
    aWin,
    bWin,
  }: {
    label: string;
    av: string;
    bv: string;
    aWin: boolean;
    bWin: boolean;
  }) => (
    <div className="grid grid-cols-[1fr_auto_auto] items-center gap-3 border-b border-line px-4 py-2.5 last:border-0">
      <span className="text-[12px] text-faint">{label}</span>
      <span
        className={`num w-24 text-right text-[14px] ${aWin ? "font-bold text-ink" : "text-faint"}`}
      >
        {av}
        {aWin && <span style={{ color: "var(--go)" }}> ✓</span>}
      </span>
      <span
        className={`num w-24 text-right text-[14px] ${bWin ? "font-bold text-ink" : "text-faint"}`}
      >
        {bv}
        {bWin && <span style={{ color: "var(--go)" }}> ✓</span>}
      </span>
    </div>
  );

  return (
    <main className="mx-auto max-w-3xl px-5 py-8">
      <JsonLd data={jsonLd} />
      <JsonLd data={breadcrumbJsonLd} />

      <nav className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo />
          <Link href={h("/stats")} className="text-[13px] text-faint hover:text-ink">
            ← {isZh ? "速度排行榜" : "Speed leaderboard"}
          </Link>
        </div>
        <Link
          href={h("/arena")}
          className="rounded-md bg-ink px-3.5 py-1.5 text-[13px] font-bold text-paper"
        >
          {isZh ? "自己跑一轮" : "Run your own test"} ▶
        </Link>
      </nav>

      <header className="mb-5">
        <h1
          className="text-[26px] font-black leading-tight"
          style={{ fontFamily: "var(--font-title)" }}
        >
          {a.model} <span className="text-faint">vs</span> {b.model}
          <span className="text-faint"> {isZh ? "速度对比" : "speed comparison"}</span>
        </h1>
        <p className="mt-2 text-[13.5px] text-faint">
          {isZh ? "基于全网用户 " : "Based on "}
          <span className="num text-ink">{fmt(a.samples + b.samples)}</span>{" "}
          {isZh ? "次匿名实测的横向对比。" : "anonymous user runs."}
        </p>
      </header>

      {/* 结论 */}
      <div
        className="mb-5 rounded-lg border px-4 py-3 text-[13.5px]"
        style={{
          borderColor: "color-mix(in srgb, var(--go) 35%, transparent)",
          background: "color-mix(in srgb, var(--go) 6%, transparent)",
        }}
      >
        <span className="font-semibold">{isZh ? "结论：" : "Verdict: "}</span>
        {v}
      </div>

      <SocialSharePanel
        className="mb-5"
        url={url}
        title={
          isZh
            ? `${a.model} vs ${b.model} 速度对比`
            : `${a.model} vs ${b.model} speed comparison`
        }
        text={
          isZh
            ? `${a.model} vs ${b.model}：${v}`
            : `${a.model} vs ${b.model}: ${v}`
        }
        badgeMarkdown={badgeMarkdown}
        badgeHtml={badgeHtml}
      />

      {/* 对照表 */}
      <div className="overflow-hidden rounded-lg border border-line bg-card">
        <div className="grid grid-cols-[1fr_auto_auto] gap-3 border-b border-line bg-paper/50 px-4 py-2.5 text-[11px] font-semibold">
          <span className="text-faint">{isZh ? "指标" : "Metric"}</span>
          <Link href={h(`/model/${modelSlug(a.model)}`)} className="num w-24 truncate text-right hover:text-accent">
            {a.model}
          </Link>
          <Link href={h(`/model/${modelSlug(b.model)}`)} className="num w-24 truncate text-right hover:text-accent">
            {b.model}
          </Link>
        </div>
        <Row
          label={isZh ? "中位输出 tok/s" : "Median output tok/s"}
          av={fmt(a.medianContentTps)}
          bv={fmt(b.medianContentTps)}
          aWin={a.medianContentTps > b.medianContentTps}
          bWin={b.medianContentTps > a.medianContentTps}
        />
        <Row
          label={isZh ? "平均输出 tok/s" : "Average output tok/s"}
          av={fmt(a.avgContentTps)}
          bv={fmt(b.avgContentTps)}
          aWin={a.avgContentTps > b.avgContentTps}
          bWin={b.avgContentTps > a.avgContentTps}
        />
        <Row
          label={isZh ? "首 Token 时延" : "TTFT"}
          av={secs(a.avgTtftMs)}
          bv={secs(b.avgTtftMs)}
          aWin={a.avgTtftMs > 0 && (b.avgTtftMs <= 0 || a.avgTtftMs < b.avgTtftMs)}
          bWin={b.avgTtftMs > 0 && (a.avgTtftMs <= 0 || b.avgTtftMs < a.avgTtftMs)}
        />
        <Row
          label={isZh ? "峰值 tok/s" : "Peak tok/s"}
          av={fmt(a.maxPeakTps)}
          bv={fmt(b.maxPeakTps)}
          aWin={a.maxPeakTps > b.maxPeakTps}
          bWin={b.maxPeakTps > a.maxPeakTps}
        />
        <Row
          label={isZh ? "样本数" : "Samples"}
          av={fmt(a.samples)}
          bv={fmt(b.samples)}
          aWin={false}
          bWin={false}
        />
      </div>

      <div className="mt-4 space-y-1 text-[11px] text-faint/80">
        <p>
          {isZh
            ? "· 数据来自用户自愿匿名共享，中位数降低抖动 · 每 5 分钟更新"
            : "· Data comes from voluntary anonymous sharing; medians reduce jitter · Updates every 5 minutes"}
        </p>
        <p>
          {isZh
            ? "· 速度受网络、时段、厂商负载影响，仅供参考 · "
            : "· Speed is affected by network, time of day and provider load · "}
          <Link href={h("/method")} className="underline hover:text-ink">
            {isZh ? "测速方法论" : "Methodology"}
          </Link>
        </p>
      </div>

      <section className="mt-6 rounded-lg border border-line bg-card px-4 py-4">
        <h2 className="text-[15px] font-bold">
          {isZh ? "如何使用这个对比" : "How to use this comparison"}
        </h2>
        <div className="mt-3 grid gap-3 text-[12.5px] leading-relaxed text-faint sm:grid-cols-3">
          <p>
            <span className="font-semibold text-ink">
              {isZh ? "写作/长输出：" : "Writing/long output: "}
            </span>
            {isZh
              ? "优先看中位输出 tok/s 和峰值。"
              : "Prioritize median output tok/s and peak speed."}
          </p>
          <p>
            <span className="font-semibold text-ink">
              {isZh ? "聊天/Agent：" : "Chat/agents: "}
            </span>
            {isZh ? "首 Token 时延通常更影响体感。" : "TTFT usually has a bigger UX impact."}
          </p>
          <p>
            <span className="font-semibold text-ink">
              {isZh ? "模型选型：" : "Model selection: "}
            </span>
            {isZh
              ? "复测你的真实 Prompt，并同时检查输出质量。"
              : "Rerun your real Prompt and inspect output quality too."}
          </p>
        </div>
      </section>

      <div className="mt-7 flex flex-wrap gap-2">
        <Link
          href={h("/arena")}
          className="rounded-md bg-ink px-4 py-2 text-[13px] font-bold text-paper"
        >
          {isZh ? "用最新数据自己跑一轮" : "Run with current data"} ▶
        </Link>
        <Link
          href={h("/stats")}
          className="rounded-md border border-line px-4 py-2 text-[13px] text-faint hover:text-ink"
        >
          {isZh ? "看完整排行榜" : "View full leaderboard"} →
        </Link>
      </div>

      <section className="mt-7">
        <h2 className="mb-2 text-[14px] font-bold">FAQ</h2>
        <div className="space-y-2">
          {faq.map((item) => (
            <details key={item.q} className="rounded-lg border border-line bg-card px-4 py-3">
              <summary className="cursor-pointer text-[13px] font-semibold">
                {item.q}
              </summary>
              <p className="mt-2 text-[12.5px] leading-relaxed text-faint">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </section>

      <footer className="mt-8 flex justify-center">
        <Credit compact />
      </footer>
    </main>
  );
}
