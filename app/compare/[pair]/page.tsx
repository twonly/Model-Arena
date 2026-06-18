import Link from "next/link";
import { notFound } from "next/navigation";
import { Credit } from "@/components/Credit";
import { Logo } from "@/components/Logo";
import { JsonLd } from "@/components/JsonLd";
import { BRAND } from "@/lib/brand";
import {
  fetchModelStats,
  bestStatForSlug,
  modelSlug,
  type ModelStat,
} from "@/lib/stats";
import {
  DEFAULT_LOCALE,
  localeToLanguage,
  localeToOg,
  localizedPath,
  normalizeLocale,
  type Locale,
} from "@/lib/i18n";
import { getMessages } from "@/lib/i18n-messages";

export const revalidate = 300;

function fmt(n: number, digits = 0): string {
  if (!isFinite(n) || n <= 0) return "—";
  return n.toLocaleString("en-US", { maximumFractionDigits: digits });
}
const secs = (ms: number) => (ms > 0 ? `${(ms / 1000).toFixed(2)}s` : "—");

interface Pair {
  a: ModelStat;
  b: ModelStat;
  canonical: string;
}

/** 解析 "a-vs-b"，返回两条最可信 stat；顺序与 URL 一致，canonical 取字母序 */
async function load(pairParam: string): Promise<Pair | null> {
  const parts = pairParam.split("-vs-");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  let stats: ModelStat[] | null = null;
  try {
    stats = await fetchModelStats();
  } catch {
    return null;
  }
  if (!stats) return null;
  const a = bestStatForSlug(stats, parts[0]);
  const b = bestStatForSlug(stats, parts[1]);
  if (!a || !b || modelSlug(a.model) === modelSlug(b.model)) return null;
  const canonical = [modelSlug(a.model), modelSlug(b.model)].sort().join("-vs-");
  return { a, b, canonical };
}

/** 一句话裁决：谁输出快、谁首响快 */
function verdict(a: ModelStat, b: ModelStat, locale: Locale = DEFAULT_LOCALE): string {
  if (locale === "en") {
    const out =
      a.medianContentTps === b.medianContentTps
        ? `Both models have similar output speed (about ${fmt(a.medianContentTps)} tok/s)`
        : a.medianContentTps > b.medianContentTps
          ? `${a.model} has faster output (median ${fmt(a.medianContentTps)} vs ${fmt(b.medianContentTps)} tok/s)`
          : `${b.model} has faster output (median ${fmt(b.medianContentTps)} vs ${fmt(a.medianContentTps)} tok/s)`;
    let ttft = "";
    if (a.avgTtftMs > 0 && b.avgTtftMs > 0) {
      ttft =
        a.avgTtftMs < b.avgTtftMs
          ? `; ${a.model} has faster TTFT (${secs(a.avgTtftMs)} vs ${secs(b.avgTtftMs)})`
          : a.avgTtftMs > b.avgTtftMs
            ? `; ${b.model} has faster TTFT (${secs(b.avgTtftMs)} vs ${secs(a.avgTtftMs)})`
            : "";
    }
    return out + ttft + ".";
  }
  const out =
    a.medianContentTps === b.medianContentTps
      ? `两者输出速度接近（约 ${fmt(a.medianContentTps)} tok/s）`
      : a.medianContentTps > b.medianContentTps
        ? `${a.model} 输出更快（中位 ${fmt(a.medianContentTps)} vs ${fmt(b.medianContentTps)} tok/s）`
        : `${b.model} 输出更快（中位 ${fmt(b.medianContentTps)} vs ${fmt(a.medianContentTps)} tok/s）`;
  let ttft = "";
  if (a.avgTtftMs > 0 && b.avgTtftMs > 0) {
    ttft =
      a.avgTtftMs < b.avgTtftMs
        ? `；${a.model} 首响更快（${secs(a.avgTtftMs)} vs ${secs(b.avgTtftMs)}）`
        : a.avgTtftMs > b.avgTtftMs
          ? `；${b.model} 首响更快（${secs(b.avgTtftMs)} vs ${secs(a.avgTtftMs)}）`
          : "";
  }
  return out + ttft + "。";
}

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
      },
    },
    openGraph: { type: "article", title, description, url: canonical, locale: localeToOg(locale) },
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
        mainEntity: [
          {
            "@type": "Question",
            name: isZh
              ? `${a.model} 和 ${b.model} 哪个更快？`
              : `Which is faster, ${a.model} or ${b.model}?`,
            acceptedAnswer: { "@type": "Answer", text: v },
          },
        ],
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

      <footer className="mt-8 flex justify-center">
        <Credit compact />
      </footer>
    </main>
  );
}
