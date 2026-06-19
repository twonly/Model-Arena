import Link from "next/link";
import { Credit } from "@/components/Credit";
import { Logo } from "@/components/Logo";
import { JsonLd } from "@/components/JsonLd";
import { BRAND } from "@/lib/brand";
import { getMessages } from "@/lib/i18n-messages";
import { getRequestLocale } from "@/lib/i18n-server";
import { localeToLanguage, localizedPath, type Locale } from "@/lib/i18n";
import {
  MODEL_PRICES,
  USD_PER_CNY,
  type ModelPrice,
  type PriceRegion,
} from "@/lib/pricing";

export const metadata = {
  title: "大模型 API 价格对比表 - 输入/缓存/输出价格汇总",
  description:
    "主流大模型 API 价格一览：DeepSeek、智谱 GLM、Kimi、小米 MiMo、阶跃、通义千问、豆包、Claude、GPT、Gemini、Grok 等，含输入（缓存命中/未命中）与输出单价，区分海外与中国大陆价格，标注官方来源。",
  alternates: { canonical: "/pricing" },
};

function sym(currency: ModelPrice["currency"]) {
  return currency === "CNY" ? "¥" : "$";
}

function fmt(n: number | null, currency: ModelPrice["currency"]): string {
  if (n == null) return "—";
  // 命中缓存价常到 0.0028 量级，保留有效位
  const digits = n !== 0 && Math.abs(n) < 0.1 ? 4 : n < 1 ? 3 : 2;
  return `${sym(currency)}${n.toLocaleString("en-US", { maximumFractionDigits: digits })}`;
}

function pageJsonLd(locale: Locale) {
  const messages = getMessages(locale);
  const url = `${BRAND.url}${localizedPath("/pricing", locale)}`;
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: messages.metadata.pricing.title,
    description: messages.metadata.pricing.description,
    url,
    inLanguage: localeToLanguage(locale),
    isAccessibleForFree: true,
    publisher: { "@type": "Organization", name: BRAND.publisher, url: BRAND.url },
  };
}

function PriceTable({
  rows,
  locale,
}: {
  rows: ModelPrice[];
  locale: Locale;
}) {
  const isZh = locale === "zh-CN";
  return (
    <div className="mt-3 overflow-x-auto rounded-lg border border-line">
      <table className="w-full border-collapse text-[13px]">
        <thead>
          <tr className="bg-paper/70 text-faint">
            <th className="px-3 py-2 text-left font-semibold">{isZh ? "模型" : "Model"}</th>
            <th className="px-3 py-2 text-right font-semibold">
              {isZh ? "输入·未命中" : "Input · miss"}
            </th>
            <th className="px-3 py-2 text-right font-semibold">
              {isZh ? "输入·命中缓存" : "Input · cache hit"}
            </th>
            <th className="px-3 py-2 text-right font-semibold">{isZh ? "输出" : "Output"}</th>
            <th className="px-3 py-2 text-left font-semibold">{isZh ? "来源" : "Source"}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p, i) => (
            <tr key={`${p.model}-${p.region}-${i}`} className="border-t border-line">
              <td className="px-3 py-2">
                <div className="font-semibold text-ink">
                  {p.model}
                  {p.needsConfirm && (
                    <span
                      className="ml-1.5 rounded bg-think/15 px-1 py-0.5 text-[10px] font-medium align-middle"
                      style={{ color: "var(--think)" }}
                      title={isZh ? "未经权威来源确认" : "Not yet confirmed against an authoritative source"}
                    >
                      {isZh ? "待核实" : "unverified"}
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-faint">{p.provider}</div>
                {p.note && <div className="mt-0.5 text-[10.5px] text-faint/80">{p.note}</div>}
              </td>
              <td className="num px-3 py-2 text-right text-ink">{fmt(p.inputMiss, p.currency)}</td>
              <td className="num px-3 py-2 text-right text-faint">{fmt(p.inputHit, p.currency)}</td>
              <td className="num px-3 py-2 text-right font-semibold text-ink">
                {fmt(p.output, p.currency)}
              </td>
              <td className="px-3 py-2">
                <a
                  href={p.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="text-[11.5px] text-faint underline decoration-dotted hover:text-ink"
                  title={`${p.sourceName} · ${isZh ? "核实于" : "verified"} ${p.verified}`}
                >
                  {p.sourceName} ↗
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function PricingPage() {
  const locale = await getRequestLocale();
  const messages = getMessages(locale);
  const h = (path: string) => localizedPath(path, locale);
  const isZh = locale === "zh-CN";

  const byRegion = (r: PriceRegion) =>
    MODEL_PRICES.filter((p) => p.region === r).sort(
      (a, b) => a.provider.localeCompare(b.provider) || a.model.localeCompare(b.model)
    );
  const global = byRegion("global");
  const cn = byRegion("cn");
  const cny = (1 / USD_PER_CNY).toFixed(1);

  return (
    <main className="mx-auto max-w-4xl px-5 py-8">
      <JsonLd data={pageJsonLd(locale)} />

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
            ? "主流大模型 API 单价汇总，单位均为「每 100 万 token」。区分海外（USD）与中国大陆（CNY）价格，每条标注官方来源与核实日期。"
            : "Per-million-token API prices for mainstream LLMs, split into global (USD) and mainland-China (CNY), each with its official source and verification date."}
        </p>
        <p className="mt-1.5 text-[12px] text-faint/80">
          {isZh
            ? `价格随厂商调整频繁变化，以官方页面为准；跨币种比较时按 1 USD ≈ ${cny} CNY 折算。标「待核实」的为近未来型号或未查到权威来源、待确认的条目。`
            : `Prices change often — the official page prevails. Cross-currency comparisons use 1 USD ≈ ${cny} CNY. Rows marked “unverified” await confirmation.`}
        </p>
      </header>

      <section className="mt-7">
        <h2 className="text-[17px] font-bold">
          🌍 {isZh ? "海外 / 国际站（USD）" : "Global (USD)"}
        </h2>
        <PriceTable rows={global} locale={locale} />
      </section>

      <section className="mt-8">
        <h2 className="text-[17px] font-bold">
          🇨🇳 {isZh ? "中国大陆官方站（CNY）" : "Mainland China (CNY)"}
        </h2>
        <PriceTable rows={cn} locale={locale} />
      </section>

      <section className="mt-7 rounded-lg border border-line bg-paper/40 px-4 py-3 text-[12.5px] leading-relaxed text-faint">
        <p>
          {isZh ? (
            <>
              <strong className="text-ink">命中缓存价</strong>
              指复用上下文（如系统提示、长文档前缀）时的输入价，通常远低于未命中价；
              「—」表示该厂商未单列或暂未查到。部分中国模型海外/国内价不同，已分区列出。
            </>
          ) : (
            <>
              <strong className="text-ink">Cache-hit input</strong> applies when context is
              reused (system prompts, long prefixes) and is usually far cheaper than cache-miss.
              “—” means the provider does not list it or it is not yet confirmed.
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
