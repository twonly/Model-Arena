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
function verdict(a: ModelStat, b: ModelStat): string {
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
  params: Promise<{ pair: string }>;
}) {
  const { pair } = await params;
  const p = await load(pair).catch(() => null);
  if (!p) return { title: "大模型速度对比", alternates: { canonical: `/compare/${pair}` } };
  const title = `${p.a.model} vs ${p.b.model} 速度对比：谁更快？`;
  const description = `${p.a.model} 与 ${p.b.model} 实测速度横评：${verdict(p.a, p.b)}基于全网用户匿名实测数据。`;
  return {
    title,
    description,
    alternates: { canonical: `/compare/${p.canonical}` },
    openGraph: { type: "article", title, description, url: `/compare/${p.canonical}` },
  };
}

export default async function ComparePage({
  params,
}: {
  params: Promise<{ pair: string }>;
}) {
  const { pair } = await params;
  const p = await load(pair);
  if (!p) notFound();
  const { a, b } = p;
  const url = `${BRAND.url}/compare/${p.canonical}`;
  const v = verdict(a, b);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "TechArticle",
        "@id": `${url}#article`,
        headline: `${a.model} vs ${b.model} 速度对比`,
        description: v,
        url,
        inLanguage: "zh-CN",
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
            name: `${a.model} 和 ${b.model} 哪个更快？`,
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
      { "@type": "ListItem", position: 1, name: BRAND.zh, item: BRAND.url },
      { "@type": "ListItem", position: 2, name: "速度榜", item: `${BRAND.url}/stats` },
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
          <Link href="/stats" className="text-[13px] text-faint hover:text-ink">
            ← 速度排行榜
          </Link>
        </div>
        <Link
          href="/arena"
          className="rounded-md bg-ink px-3.5 py-1.5 text-[13px] font-bold text-paper"
        >
          自己跑一轮 ▶
        </Link>
      </nav>

      <header className="mb-5">
        <h1
          className="text-[26px] font-black leading-tight"
          style={{ fontFamily: "var(--font-title)" }}
        >
          {a.model} <span className="text-faint">vs</span> {b.model}
          <span className="text-faint"> 速度对比</span>
        </h1>
        <p className="mt-2 text-[13.5px] text-faint">
          基于全网用户{" "}
          <span className="num text-ink">{fmt(a.samples + b.samples)}</span>{" "}
          次匿名实测的横向对比。
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
        <span className="font-semibold">结论：</span>
        {v}
      </div>

      {/* 对照表 */}
      <div className="overflow-hidden rounded-lg border border-line bg-card">
        <div className="grid grid-cols-[1fr_auto_auto] gap-3 border-b border-line bg-paper/50 px-4 py-2.5 text-[11px] font-semibold">
          <span className="text-faint">指标</span>
          <Link href={`/model/${modelSlug(a.model)}`} className="num w-24 truncate text-right hover:text-accent">
            {a.model}
          </Link>
          <Link href={`/model/${modelSlug(b.model)}`} className="num w-24 truncate text-right hover:text-accent">
            {b.model}
          </Link>
        </div>
        <Row
          label="中位输出 tok/s"
          av={fmt(a.medianContentTps)}
          bv={fmt(b.medianContentTps)}
          aWin={a.medianContentTps > b.medianContentTps}
          bWin={b.medianContentTps > a.medianContentTps}
        />
        <Row
          label="平均输出 tok/s"
          av={fmt(a.avgContentTps)}
          bv={fmt(b.avgContentTps)}
          aWin={a.avgContentTps > b.avgContentTps}
          bWin={b.avgContentTps > a.avgContentTps}
        />
        <Row
          label="首 Token 时延"
          av={secs(a.avgTtftMs)}
          bv={secs(b.avgTtftMs)}
          aWin={a.avgTtftMs > 0 && (b.avgTtftMs <= 0 || a.avgTtftMs < b.avgTtftMs)}
          bWin={b.avgTtftMs > 0 && (a.avgTtftMs <= 0 || b.avgTtftMs < a.avgTtftMs)}
        />
        <Row
          label="峰值 tok/s"
          av={fmt(a.maxPeakTps)}
          bv={fmt(b.maxPeakTps)}
          aWin={a.maxPeakTps > b.maxPeakTps}
          bWin={b.maxPeakTps > a.maxPeakTps}
        />
        <Row
          label="样本数"
          av={fmt(a.samples)}
          bv={fmt(b.samples)}
          aWin={false}
          bWin={false}
        />
      </div>

      <div className="mt-4 space-y-1 text-[11px] text-faint/80">
        <p>· 数据来自用户自愿匿名共享，中位数降低抖动 · 每 5 分钟更新</p>
        <p>
          · 速度受网络、时段、厂商负载影响，仅供参考 ·{" "}
          <Link href="/method" className="underline hover:text-ink">
            测速方法论
          </Link>
        </p>
      </div>

      <div className="mt-7 flex flex-wrap gap-2">
        <Link
          href="/arena"
          className="rounded-md bg-ink px-4 py-2 text-[13px] font-bold text-paper"
        >
          用最新数据自己跑一轮 ▶
        </Link>
        <Link
          href="/stats"
          className="rounded-md border border-line px-4 py-2 text-[13px] text-faint hover:text-ink"
        >
          看完整排行榜 →
        </Link>
      </div>

      <footer className="mt-8 flex justify-center">
        <Credit compact />
      </footer>
    </main>
  );
}
