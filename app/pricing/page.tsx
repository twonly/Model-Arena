import Link from "next/link";
import { Credit } from "@/components/Credit";
import { Logo } from "@/components/Logo";
import { JsonLd } from "@/components/JsonLd";
import { PricingTable, type PricedModel } from "@/components/PricingTable";
import { BRAND } from "@/lib/brand";
import { getMessages } from "@/lib/i18n-messages";
import { getRequestLocale } from "@/lib/i18n-server";
import { localeToLanguage, localizedPath, type Locale } from "@/lib/i18n";
import { MODEL_PRICES, USD_PER_CNY, toUsdPer1M } from "@/lib/pricing";
import { DATASET_LICENSE_URL } from "@/lib/structured-data";

export const metadata = {
  title: "大模型 API 价格对比表 - 输入/缓存/输出价格汇总",
  description:
    "主流大模型 API 价格一览：DeepSeek、智谱 GLM、Kimi、小米 MiMo、阶跃、通义千问、豆包、Claude、GPT、Gemini、Grok 等，含输入（缓存命中/未命中）与输出单价，区分海外与中国大陆价格，标注官方来源。",
  alternates: { canonical: "/pricing" },
};

const fmtUsd = (n: number) => (n < 1 ? `$${n.toFixed(2)}` : `$${n.toFixed(0)}`);

/** 把扁平定价按模型分组，同一模型合并海外/中国两条 */
function groupByModel(): PricedModel[] {
  const map = new Map<string, PricedModel>();
  for (const p of MODEL_PRICES) {
    let e = map.get(p.model);
    if (!e) {
      e = { model: p.model, provider: p.provider, global: null, cn: null };
      map.set(p.model, e);
    }
    if (p.region === "global") {
      if (!e.global) e.global = p;
    } else if (!e.cn) {
      e.cn = p;
    }
  }
  return [...map.values()];
}

const outUsd = (e: PricedModel) =>
  Math.min(
    e.global ? toUsdPer1M(e.global.output, e.global.currency) : Infinity,
    e.cn ? toUsdPer1M(e.cn.output, e.cn.currency) : Infinity
  );

interface Insights {
  cheapest: PricedModel;
  priciest: PricedModel;
  discount: { model: string; ratio: number } | null;
}

function insights(rows: PricedModel[]): Insights | null {
  const priced = rows.filter((r) => Number.isFinite(outUsd(r)));
  if (priced.length < 2) return null;
  let discount: { model: string; ratio: number } | null = null;
  for (const p of MODEL_PRICES) {
    if (p.inputHit && p.inputHit > 0 && p.inputMiss > 0) {
      const ratio = p.inputMiss / p.inputHit;
      if (!discount || ratio > discount.ratio) discount = { model: p.model, ratio };
    }
  }
  return { cheapest: priced[0], priciest: priced[priced.length - 1], discount };
}

function faqJsonLd(locale: Locale, ins: Insights | null) {
  const isZh = locale === "zh-CN";
  if (!ins) return null;
  const cheap = `${ins.cheapest.model}（≈ ${fmtUsd(outUsd(ins.cheapest))}/1M）`;
  const pricey = `${ins.priciest.model}（≈ ${fmtUsd(outUsd(ins.priciest))}/1M）`;
  const discTxt = ins.discount
    ? isZh
      ? `例如 ${ins.discount.model}，命中价约为未命中价的 1/${Math.round(ins.discount.ratio)}。`
      : `For example ${ins.discount.model}'s cache-hit input is about 1/${Math.round(ins.discount.ratio)} of its cache-miss price.`
    : "";
  const qa = isZh
    ? [
        ["哪个大模型 API 最便宜？", `以输出价计，目前最低的是 ${cheap}，最贵的是 ${pricey}。完整逐项对比见本页表格。`],
        ["什么是「缓存命中价（cache hit）」？", `当请求复用相同的上下文前缀（系统提示、长文档等）时，这部分输入按「命中价」计费，通常远低于「未命中价」。${discTxt}`],
        ["中国和海外价格有什么区别？", "部分国产模型在中国大陆官方站以人民币（CNY）计价、在海外站以美元（USD）计价，数值可能不同。本表对同一模型并排列出海外与中国两套价格。"],
        ["这些价格多久更新、准不准？", "价格由人工维护，每条标注官方来源与核实日期，并以厂商官方页面为准；标「待核实」的为尚未核对到权威来源的条目。"],
      ]
    : [
        ["Which LLM API is the cheapest?", `By output price, the lowest right now is ${cheap} and the most expensive is ${pricey}. See the full table on this page.`],
        ["What is a cache-hit input price?", `When a request reuses the same context prefix (system prompt, long document, etc.), that input is billed at the cache-hit rate, usually far below the cache-miss rate. ${discTxt}`],
        ["How do mainland-China and global prices differ?", "Some Chinese models are priced in CNY on their domestic platform and in USD internationally, so the numbers can differ. This table lists both prices side by side per model."],
        ["How often are these prices updated and are they accurate?", "Prices are maintained by hand with an official source and verification date on each row; the provider's official page prevails. Rows marked unverified are not yet confirmed against an authoritative source."],
      ];
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    inLanguage: localeToLanguage(locale),
    mainEntity: qa.map(([q, a]) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };
}

function structuredData(locale: Locale, rows: PricedModel[]) {
  const messages = getMessages(locale);
  const isZh = locale === "zh-CN";
  const url = `${BRAND.url}${localizedPath("/pricing", locale)}`;
  const webPage = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: messages.metadata.pricing.title,
    description: messages.metadata.pricing.description,
    url,
    inLanguage: localeToLanguage(locale),
    isAccessibleForFree: true,
    publisher: { "@id": `${BRAND.url}/#org` },
  };
  const dataset = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: isZh ? "大模型 API 价格数据集" : "LLM API pricing dataset",
    description: isZh
      ? "主流大模型 API 的输入（缓存命中/未命中）与输出单价，区分海外（USD）与中国大陆（CNY），含官方来源。"
      : "Input (cache hit/miss) and output prices for mainstream LLM APIs, split into global (USD) and mainland-China (CNY), with official sources.",
    url,
    inLanguage: localeToLanguage(locale),
    isAccessibleForFree: true,
    license: DATASET_LICENSE_URL,
    creator: { "@id": `${BRAND.url}/#org` },
    variableMeasured: isZh
      ? ["输入价·未命中缓存 (每百万 token)", "输入价·命中缓存 (每百万 token)", "输出价 (每百万 token)"]
      : ["Input price · cache miss (per 1M tokens)", "Input price · cache hit (per 1M tokens)", "Output price (per 1M tokens)"],
    dateModified: new Date().toISOString().slice(0, 10),
  };
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: BRAND.en, item: BRAND.url },
      { "@type": "ListItem", position: 2, name: isZh ? "价格" : "Pricing", item: url },
    ],
  };
  void rows;
  return [webPage, dataset, breadcrumb];
}

export default async function PricingPage() {
  const locale = await getRequestLocale();
  const messages = getMessages(locale);
  const h = (path: string) => localizedPath(path, locale);
  const isZh = locale === "zh-CN";

  const rows = groupByModel().sort((a, b) => outUsd(a) - outUsd(b));
  const ins = insights(rows);
  const cny = (1 / USD_PER_CNY).toFixed(1);
  const faq = faqJsonLd(locale, ins);

  return (
    <main className="mx-auto max-w-5xl px-5 py-8">
      {structuredData(locale, rows).map((d, i) => (
        <JsonLd key={i} data={d} />
      ))}
      {faq && <JsonLd data={faq} />}

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
        <h1 className="text-[30px] font-black" style={{ fontFamily: "var(--font-title)" }}>
          {isZh ? "大模型 API 价格对比" : "LLM API Pricing"}
        </h1>
        <p className="mt-2 text-[13.5px] text-faint">
          {isZh
            ? "主流大模型 API 单价汇总，单位均为「每 100 万 token」。同一模型并排列出海外（USD）与中国大陆（CNY）价格，每条标注官方来源与核实日期。"
            : "Per-million-token API prices for mainstream LLMs. Global (USD) and mainland-China (CNY) prices sit side by side per model, each with its official source and verification date."}
        </p>
      </header>

      {ins && (
        <div className="mt-4 rounded-lg border border-line bg-paper/40 px-4 py-3 text-[13px]">
          <span className="mr-1 font-semibold">💡 {isZh ? "速览" : "TL;DR"}</span>
          {isZh ? (
            <span className="text-faint">
              输出最便宜：<strong className="text-ink">{ins.cheapest.model}</strong>（≈{fmtUsd(outUsd(ins.cheapest))}/1M）；
              最贵：<strong className="text-ink">{ins.priciest.model}</strong>（≈{fmtUsd(outUsd(ins.priciest))}/1M）。
              {ins.discount && <>缓存命中折扣最狠：<strong className="text-ink">{ins.discount.model}</strong>（约省 {Math.round(ins.discount.ratio)}×）。</>}
              复用上下文（命中缓存）能把输入成本打到零头。
            </span>
          ) : (
            <span className="text-faint">
              Cheapest output: <strong className="text-ink">{ins.cheapest.model}</strong> (≈{fmtUsd(outUsd(ins.cheapest))}/1M);
              priciest: <strong className="text-ink">{ins.priciest.model}</strong> (≈{fmtUsd(outUsd(ins.priciest))}/1M).
              {ins.discount && <> Biggest cache discount: <strong className="text-ink">{ins.discount.model}</strong> (~{Math.round(ins.discount.ratio)}× off).</>}
            </span>
          )}
        </div>
      )}

      <PricingTable rows={rows} locale={locale} />

      <section className="mt-5 rounded-lg border border-line bg-paper/40 px-4 py-3 text-[12.5px] leading-relaxed text-faint">
        <p>
          {isZh ? (
            <>
              <strong className="text-ink">命中（缓存命中价）</strong>
              指复用上下文（系统提示、长文档前缀）时的输入价，通常远低于未命中价；「—」表示该厂商未单列或暂未查到。
              跨币种比较时按 1 USD ≈ {cny} CNY 折算；价格随厂商调整频繁变化，以官方页面为准，标「待核实」的为待确认条目。
            </>
          ) : (
            <>
              <strong className="text-ink">Hit (cache-hit input)</strong> applies when context is
              reused (system prompts, long prefixes) and is usually far cheaper; “—” means the
              provider does not list it. Cross-currency comparisons use 1 USD ≈ {cny} CNY. Prices
              change often — the official page prevails; “unverified” rows await confirmation.
            </>
          )}
        </p>
      </section>

      <div className="mt-8 flex flex-wrap gap-2">
        <Link
          href={h("/stats")}
          className="rounded-md border border-line px-4 py-2 text-[13px] text-faint hover:text-ink"
        >
          {isZh ? "速度 vs 成本榜" : "Speed vs cost"} →
        </Link>
        <Link
          href={h("/arena")}
          className="rounded-md bg-ink px-4 py-2 text-[13px] font-bold text-paper"
        >
          {isZh ? "去竞速场实测成本" : "Measure cost live"} ▶
        </Link>
      </div>

      <footer className="mt-8 flex justify-center">
        <Credit compact />
      </footer>
    </main>
  );
}
