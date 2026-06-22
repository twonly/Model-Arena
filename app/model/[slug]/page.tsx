import Link from "next/link";
import { notFound } from "next/navigation";
import { Credit } from "@/components/Credit";
import { Logo } from "@/components/Logo";
import { JsonLd } from "@/components/JsonLd";
import { SocialSharePanel } from "@/components/SocialSharePanel";
import { htmlBadge, markdownBadge } from "@/lib/badge";
import { BRAND, OG_IMAGE } from "@/lib/brand";
import { modelSlug } from "@/lib/stats";
import { DATASET_LICENSE_URL } from "@/lib/structured-data";
import {
  fmtMetric as fmt,
  loadModelStatsForSlug as load,
  topModelAlternatives as topOthers,
} from "@/lib/seo-models";
import {
  DEFAULT_LOCALE,
  localeToLanguage,
  localeToOg,
  localizedPath,
  normalizeLocale,
} from "@/lib/i18n";
import { getMessages } from "@/lib/i18n-messages";

// 排行榜每 5 分钟更新，模型页同步
export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; lang?: string }>;
}) {
  const { slug, lang } = await params;
  const locale = normalizeLocale(lang) ?? DEFAULT_LOCALE;
  const messages = getMessages(locale);
  const hit = await load(slug).catch(() => null);
  if (!hit) {
    return {
      title: messages.metadata.model.fallbackTitle,
      alternates: { canonical: localizedPath(`/model/${slug}`, locale) },
    };
  }
  const top = hit[0];
  const tps = Math.round(top.medianContentTps);
  const ttft = top.avgTtftMs > 0 ? (top.avgTtftMs / 1000).toFixed(2) : null;
  const total = hit.reduce((a, s) => a + s.samples, 0);
  const title =
    locale === "en"
      ? `${top.model} speed results: output ${tps} tok/s${
          ttft ? ` · TTFT ${ttft}s` : ""
        }`
      : `${top.model} 速度实测：输出 ${tps} tok/s${ttft ? ` · 首Token ${ttft}s` : ""}`;
  const description =
    locale === "en"
      ? `${top.model} real-world speed on TOKRACE: median output ${fmt(
          top.medianContentTps
        )} tok/s, peak ${fmt(top.maxPeakTps)} tok/s${
          ttft ? `, TTFT ${ttft}s` : ""
        }, based on ${total} anonymous user runs.`
      : `${top.model} 大模型实测速度：中位输出 ${fmt(
          top.medianContentTps
        )} tok/s、峰值 ${fmt(top.maxPeakTps)} tok/s${
          ttft ? `、首 Token ${ttft}s` : ""
        }，基于全网用户 ${total} 次真实测试匿名汇总。`;
  const canonical = localizedPath(`/model/${slug}`, locale);
  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        "zh-CN": localizedPath(`/model/${slug}`, "zh-CN"),
        en: localizedPath(`/model/${slug}`, "en"),
        "x-default": localizedPath(`/model/${slug}`, "zh-CN"),
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

export default async function ModelPage({
  params,
}: {
  params: Promise<{ slug: string; lang?: string }>;
}) {
  const { slug, lang } = await params;
  const locale = normalizeLocale(lang) ?? DEFAULT_LOCALE;
  const messages = getMessages(locale);
  const isZh = locale === "zh-CN";
  const h = (path: string) => localizedPath(path, locale);
  const hit = await load(slug);
  if (!hit) notFound();

  const top = hit[0];
  const totalSamples = hit.reduce((a, s) => a + s.samples, 0);
  const url = `${BRAND.url}${h(`/model/${slug}`)}`;
  const badgeUrl = `${BRAND.url}/api/badge/model/${slug}?locale=${locale}`;
  const badgeAlt = isZh
    ? `${top.model} 在 TOKRACE 上的速度结果`
    : `${top.model} speed result on TOKRACE`;
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
  const others = await topOthers(slug);
  const faq = [
    {
      q: isZh ? `${top.model} 的输出速度是多少？` : `How fast is ${top.model}?`,
      a: isZh
        ? `${top.model} 当前中位输出速度约 ${fmt(top.medianContentTps)} tok/s，首 Token 时延约 ${
            top.avgTtftMs > 0 ? (top.avgTtftMs / 1000).toFixed(2) : "—"
          }s，基于 ${fmt(totalSamples)} 次匿名实测。`
        : `${top.model} currently shows about ${fmt(
            top.medianContentTps
          )} tok/s median output speed and ${
            top.avgTtftMs > 0 ? (top.avgTtftMs / 1000).toFixed(2) : "—"
          }s TTFT, based on ${fmt(totalSamples)} anonymous runs.`,
    },
    {
      q: isZh ? "这些速度数据可以直接当榜单结论吗？" : "Should I treat this as a final benchmark?",
      a: isZh
        ? "不建议只看单一数字。不同 Prompt、网络、时段和厂商负载都会影响结果，中位数更适合看长期体感，复测更适合做选型。"
        : "Use it as directional evidence, not a single final benchmark. Prompt shape, network, time of day and provider load can all change the result.",
    },
    {
      q: isZh ? "可以把这个结果嵌入到文章或 README 吗？" : "Can I embed this result in an article or README?",
      a: isZh
        ? `可以。页面提供 Markdown 和 HTML Badge，图片地址为 ${badgeUrl}。`
        : `Yes. This page provides Markdown and HTML badges. The badge image URL is ${badgeUrl}.`,
    },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Dataset",
        "@id": `${url}#dataset`,
        name: isZh ? `${top.model} 实测速度数据` : `${top.model} speed dataset`,
        description: isZh
          ? `${top.model} 在「${BRAND.zh}」上的真实速度实测：首 Token 时延、输出 tokens/s、峰值速度，全网用户匿名汇总。`
          : `${top.model} real-world speed results on TOKRACE: TTFT, output tokens/s and peak speed aggregated anonymously.`,
        url,
        isAccessibleForFree: true,
        license: DATASET_LICENSE_URL,
        creator: {
          "@type": "Organization",
          name: BRAND.publisher,
          url: BRAND.url,
        },
        variableMeasured: isZh
          ? [
              "首Token时延 (TTFT, ms)",
              "中位输出速度 (tokens/s)",
              "峰值输出速度 (tokens/s)",
              "输出 token 数",
            ]
          : [
              "Time to first token (TTFT, ms)",
              "Median output speed (tokens/s)",
              "Peak output speed (tokens/s)",
              "Output token count",
            ],
        measurementTechnique:
          isZh
            ? "浏览器端流式逐 token 计时，服务端时间戳校准；token 口径以厂商官方 usage 为准"
            : "Browser-side streaming token timing calibrated with server timestamps; token accounting prefers official provider usage.",
      },
      {
        "@type": "TechArticle",
        headline: isZh ? `${top.model} 速度实测` : `${top.model} speed results`,
        url,
        inLanguage: localeToLanguage(locale),
        isAccessibleForFree: true,
        author: { "@type": "Organization", name: BRAND.publisher },
        publisher: {
          "@type": "Organization",
          name: BRAND.publisher,
          url: BRAND.url,
        },
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
      { "@type": "ListItem", position: 3, name: top.model, item: url },
    ],
  };

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
          {isZh ? "测一下" : "Test"} {top.model} ▶
        </Link>
      </nav>

      <header className="mb-6">
        <h1
          className="text-[28px] font-black leading-tight"
          style={{ fontFamily: "var(--font-title)" }}
        >
          {top.model} {isZh ? "速度实测" : "speed results"}
        </h1>
        <p className="mt-2 text-[13.5px] text-faint">
          {isZh ? `${top.model} 在「${BRAND.zh}」上的真实输出速度与首 Token 时延，基于全网用户 ` : `${top.model} real-world output speed and TTFT on TOKRACE, based on `}
          <span className="num text-ink">{fmt(totalSamples)}</span>
          {isZh ? " 次匿名实测汇总。" : " anonymous runs."}
        </p>
      </header>

      {/* 概要数字（首个接入点） */}
      <div className="grid grid-cols-3 gap-3">
        <Stat
          label={isZh ? "中位输出" : "Median output"}
          value={fmt(top.medianContentTps)}
          unit="tok/s"
          accent
        />
        <Stat
          label={isZh ? "首 Token" : "TTFT"}
          value={top.avgTtftMs > 0 ? (top.avgTtftMs / 1000).toFixed(2) : "—"}
          unit="s"
        />
        <Stat label={isZh ? "峰值" : "Peak"} value={fmt(top.maxPeakTps)} unit="tok/s" />
      </div>

      <SocialSharePanel
        className="mt-4"
        url={url}
        title={isZh ? `${top.model} 速度实测` : `${top.model} speed results`}
        text={
          isZh
            ? `${top.model} 中位输出 ${fmt(top.medianContentTps)} tok/s · TOKRACE`
            : `${top.model} median output ${fmt(top.medianContentTps)} tok/s · TOKRACE`
        }
        badgeMarkdown={badgeMarkdown}
        badgeHtml={badgeHtml}
      />

      {/* 各接入点明细 */}
      {hit.length > 1 && (
        <p className="mt-5 text-[12px] text-faint">
          {isZh
            ? `该模型有 ${hit.length} 个接入点（厂商域名），分开统计：`
            : `This model has ${hit.length} provider endpoint(s), reported separately:`}
        </p>
      )}
      <div className="mt-3 overflow-hidden rounded-lg border border-line bg-card">
        <div className="grid grid-cols-[1fr_auto_auto_auto] gap-3 border-b border-line bg-paper/50 px-4 py-2.5 text-[11px] font-semibold text-faint">
          <span>{isZh ? "接入点" : "Endpoint"}</span>
          <span className="w-24 text-right">{isZh ? "中位 tok/s" : "Median tok/s"}</span>
          <span className="w-16 text-right">{isZh ? "首响" : "TTFT"}</span>
          <span className="w-16 text-right">{isZh ? "峰值" : "Peak"}</span>
        </div>
        {hit.map((s) => (
          <div
            key={`${s.model}-${s.provider}`}
            className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-3 border-b border-line px-4 py-3 last:border-0"
          >
            <div className="num min-w-0 truncate text-[12.5px]">{s.provider}</div>
            <div className="num w-24 text-right text-[15px] font-bold">
              {fmt(s.medianContentTps)}
            </div>
            <div className="num w-16 text-right text-[13px]">
              {s.avgTtftMs > 0 ? `${(s.avgTtftMs / 1000).toFixed(2)}s` : "—"}
            </div>
            <div
              className="num w-16 text-right text-[13px] font-semibold"
              style={{ color: "var(--accent)" }}
            >
              {fmt(s.maxPeakTps)}
            </div>
          </div>
        ))}
      </div>

      <section className="mt-6 rounded-lg border border-line bg-card px-4 py-4">
        <h2 className="text-[15px] font-bold">
          {isZh ? "如何解读这组数据" : "How to read these metrics"}
        </h2>
        <div className="mt-3 grid gap-3 text-[12.5px] leading-relaxed text-faint sm:grid-cols-3">
          <p>
            <span className="font-semibold text-ink">
              {isZh ? "输出 tok/s：" : "Output tok/s: "}
            </span>
            {isZh
              ? "更接近长文本生成时的体感速度。"
              : "The clearest signal for long-form generation speed."}
          </p>
          <p>
            <span className="font-semibold text-ink">
              {isZh ? "TTFT：" : "TTFT: "}
            </span>
            {isZh
              ? "影响聊天、工具调用等短请求的第一响应速度。"
              : "Matters most for chatty or tool-heavy short requests."}
          </p>
          <p>
            <span className="font-semibold text-ink">
              {isZh ? "样本数：" : "Samples: "}
            </span>
            {isZh
              ? "样本越多，越能抵消偶发网络和厂商抖动。"
              : "More samples reduce one-off network and provider jitter."}
          </p>
        </div>
      </section>

      <div className="mt-4 space-y-1 text-[11px] text-faint/80">
        <p>
          {isZh
            ? "· 数据来自用户自愿匿名共享，仅含速度指标 · 中位数降低偶发抖动 · 每 5 分钟更新"
            : "· Data comes from voluntary anonymous sharing and contains speed metrics only · Medians reduce one-off jitter · Updates every 5 minutes"}
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

      {others.length > 0 && (
        <div className="mt-6">
          <div className="mb-2 text-[12px] font-semibold text-faint">
            {isZh ? "热门对比" : "Popular comparisons"}
          </div>
          <div className="flex flex-wrap gap-2">
            {others.map((o) => (
              <Link
                key={o.slug}
                href={h(`/compare/${[slug, o.slug].sort().join("-vs-")}`)}
                className="rounded-md border border-line bg-card px-3 py-1.5 text-[12.5px] text-faint hover:border-ink/30 hover:text-ink"
              >
                {top.model} vs {o.name}
              </Link>
            ))}
          </div>
        </div>
      )}

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

      <div className="mt-7 flex flex-wrap gap-2">
        <Link
          href={h("/stats")}
          className="rounded-md border border-line px-4 py-2 text-[13px] text-faint hover:text-ink"
        >
          {isZh ? "看完整排行榜" : "View full leaderboard"} →
        </Link>
        <Link
          href={h("/arena")}
          className="rounded-md bg-ink px-4 py-2 text-[13px] font-bold text-paper"
        >
          {isZh ? "自己跑一轮" : "Run your own test"} ▶
        </Link>
      </div>

      <footer className="mt-8 flex justify-center">
        <Credit compact />
      </footer>
    </main>
  );
}

function Stat({
  label,
  value,
  unit,
  accent,
}: {
  label: string;
  value: string;
  unit: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-lg border border-line bg-card px-4 py-3">
      <div className="text-[11px] text-faint">{label}</div>
      <div className="num mt-1 flex items-baseline gap-1">
        <span
          className="text-[24px] font-black"
          style={accent ? { color: "var(--accent)" } : undefined}
        >
          {value}
        </span>
        <span className="text-[11px] text-faint">{unit}</span>
      </div>
    </div>
  );
}
