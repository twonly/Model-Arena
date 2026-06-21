import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Credit } from "@/components/Credit";
import { Logo } from "@/components/Logo";
import { JsonLd } from "@/components/JsonLd";
import { BRAND, OG_IMAGE } from "@/lib/brand";
import { getMessages } from "@/lib/i18n-messages";
import { getRequestLocale } from "@/lib/i18n-server";
import { localeToLanguage, localizedPath, type Locale } from "@/lib/i18n";
import {
  getBestPage,
  bestMeta,
  isBestMetric,
  BEST_METRICS,
  type BestMetric,
} from "@/lib/best";

export const revalidate = 300;

const MEDALS = ["🥇", "🥈", "🥉"];

const TAB_LABEL: Record<BestMetric, { zh: string; en: string }> = {
  fastest: { zh: "⚡ 最快", en: "⚡ Fastest" },
  cheapest: { zh: "💰 最便宜", en: "💰 Cheapest" },
  value: { zh: "⭐ 性价比", en: "⭐ Best value" },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ metric: string }>;
}): Promise<Metadata> {
  const { metric } = await params;
  if (!isBestMetric(metric)) return {};
  const locale = await getRequestLocale();
  const { title, description } = bestMeta(metric, locale);
  const path = `/best/${metric}`;
  return {
    title,
    description,
    alternates: {
      canonical: localizedPath(path, locale),
      languages: {
        "zh-CN": localizedPath(path, "zh-CN"),
        en: localizedPath(path, "en"),
        "x-default": localizedPath(path, "zh-CN"),
      },
    },
    openGraph: {
      type: "article",
      title,
      description,
      url: localizedPath(path, locale),
      images: [OG_IMAGE],
    },
    twitter: { card: "summary_large_image", title, description, images: [OG_IMAGE.url] },
  };
}

export default async function BestPage({
  params,
}: {
  params: Promise<{ metric: string }>;
}) {
  const { metric } = await params;
  if (!isBestMetric(metric)) notFound();
  const locale = await getRequestLocale();
  const isZh = locale === "zh-CN";
  const messages = getMessages(locale);
  const h = (p: string) => localizedPath(p, locale);
  const page = await getBestPage(metric, locale);
  const url = `${BRAND.url}${h(`/best/${metric}`)}`;

  const itemList = page.rows.length
    ? {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: page.title,
        description: page.description,
        url,
        inLanguage: localeToLanguage(locale),
        numberOfItems: page.rows.length,
        itemListElement: page.rows.map((r, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: r.model,
          url: `${BRAND.url}${h(`/model/${r.slug}`)}`,
          description: r.primary,
        })),
      }
    : null;
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: BRAND.en, item: BRAND.url },
      { "@type": "ListItem", position: 2, name: page.title, item: url },
    ],
  };
  const faq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    inLanguage: localeToLanguage(locale),
    mainEntity: [
      {
        "@type": "Question",
        name: isZh ? "这个排行的数据怎么来的？" : "Where does this ranking come from?",
        acceptedAnswer: {
          "@type": "Answer",
          text: isZh
            ? "速度来自全网用户在竞速场的匿名实测聚合（取中位数），价格来自各厂商官方页面人工维护。"
            : "Speed comes from anonymous community benchmarks (median), and prices are maintained by hand from official provider pages.",
        },
      },
      {
        "@type": "Question",
        name: isZh ? "多久更新一次？" : "How often is it updated?",
        acceptedAnswer: {
          "@type": "Answer",
          text: isZh ? "速度数据约每 5 分钟刷新；价格随厂商调整更新。" : "Speed refreshes roughly every 5 minutes; prices update as providers change them.",
        },
      },
    ],
  };

  return (
    <main className="mx-auto max-w-3xl px-5 py-8">
      {itemList && <JsonLd data={itemList} />}
      <JsonLd data={breadcrumb} />
      <JsonLd data={faq} />

      <nav className="mb-6 flex items-center justify-between">
        <Logo withText />
        <Link href={h("/arena")} className="rounded-md bg-ink px-3.5 py-1.5 text-[13px] font-bold text-paper">
          {messages.common.testNow} ▶
        </Link>
      </nav>

      <header>
        <h1 className="text-[27px] font-black leading-tight" style={{ fontFamily: "var(--font-title)" }}>
          {page.title}
        </h1>
        <p className="mt-2 text-[13.5px] text-faint">{page.intro}</p>
      </header>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {BEST_METRICS.map((m) => (
          <Link
            key={m}
            href={h(`/best/${m}`)}
            className={`rounded-md border px-3 py-1.5 text-[13px] ${
              m === metric ? "border-ink bg-ink text-paper" : "border-line text-faint hover:text-ink"
            }`}
          >
            {isZh ? TAB_LABEL[m].zh : TAB_LABEL[m].en}
          </Link>
        ))}
      </div>

      {page.empty ? (
        <div className="mt-6 rounded-lg border border-dashed border-line bg-card/60 px-6 py-12 text-center text-[13px] text-faint">
          {page.intro}
        </div>
      ) : (
        <ol className="mt-5 overflow-hidden rounded-lg border border-line bg-card">
          {page.rows.map((r, i) => (
            <li key={r.slug + i} className="flex items-center gap-3 border-b border-line px-4 py-3 last:border-0">
              <span className="num w-7 shrink-0 text-[14px] text-faint">{MEDALS[i] ?? i + 1}</span>
              <div className="min-w-0 flex-1">
                <Link href={h(`/model/${r.slug}`)} className="text-[14px] font-semibold hover:text-accent">
                  {r.model}
                </Link>
                {r.provider && <span className="ml-2 text-[11px] text-faint">{r.provider}</span>}
                {r.secondary && <div className="num mt-0.5 text-[11px] text-faint">{r.secondary}</div>}
              </div>
              <span className="num shrink-0 text-[14px] font-bold" style={{ color: i === 0 ? "var(--accent)" : "var(--ink)" }}>
                {r.primary}
              </span>
            </li>
          ))}
        </ol>
      )}

      <div className="mt-7 flex flex-wrap gap-2 text-[13px]">
        <Link href={h("/pricing")} className="rounded-md border border-line px-4 py-2 text-faint hover:text-ink">
          {isZh ? "完整价格表" : "Full pricing"} →
        </Link>
        <Link href={h("/stats")} className="rounded-md border border-line px-4 py-2 text-faint hover:text-ink">
          {isZh ? "速度排行榜" : "Speed leaderboard"} →
        </Link>
        <Link href={h("/arena")} className="rounded-md bg-ink px-4 py-2 font-bold text-paper">
          {isZh ? "自己实测一轮" : "Run your own test"} ▶
        </Link>
      </div>

      <p className="mt-5 text-[11px] text-faint/80">
        {isZh
          ? "· 速度来自匿名实测中位数，价格以官方页面为准，跨币种按固定汇率折算 USD，仅供参考。"
          : "· Speed is the median of anonymous benchmarks; prices follow official pages and cross-currency uses a fixed USD rate. Reference only."}
      </p>

      <footer className="mt-8 flex justify-center">
        <Credit compact />
      </footer>
    </main>
  );
}
