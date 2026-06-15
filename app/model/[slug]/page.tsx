import Link from "next/link";
import { notFound } from "next/navigation";
import { Credit } from "@/components/Credit";
import { JsonLd } from "@/components/JsonLd";
import { BRAND } from "@/lib/brand";
import { fetchModelStats, modelSlug, type ModelStat } from "@/lib/stats";

// 排行榜每 5 分钟更新，模型页同步
export const revalidate = 300;

function fmt(n: number, digits = 0): string {
  if (!isFinite(n) || n <= 0) return "—";
  return n.toLocaleString("en-US", { maximumFractionDigits: digits });
}

/** 取出某个 slug 对应的全部接入点统计（同模型不同厂商分行） */
async function load(slug: string): Promise<ModelStat[] | null> {
  let stats: ModelStat[] | null = null;
  try {
    stats = await fetchModelStats();
  } catch {
    return null;
  }
  if (!stats) return null;
  const hit = stats.filter((s) => modelSlug(s.model) === slug);
  return hit.length ? hit : null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const hit = await load(slug).catch(() => null);
  if (!hit) {
    return { title: "模型速度实测", alternates: { canonical: `/model/${slug}` } };
  }
  const top = hit[0];
  const tps = Math.round(top.medianContentTps);
  const ttft = top.avgTtftMs > 0 ? (top.avgTtftMs / 1000).toFixed(2) : null;
  const total = hit.reduce((a, s) => a + s.samples, 0);
  const title = `${top.model} 速度实测：输出 ${tps} tok/s${
    ttft ? ` · 首Token ${ttft}s` : ""
  }`;
  const description = `${top.model} 大模型实测速度：中位输出 ${fmt(
    top.medianContentTps
  )} tok/s、峰值 ${fmt(top.maxPeakTps)} tok/s${
    ttft ? `、首 Token ${ttft}s` : ""
  }，基于全网用户 ${total} 次真实测试匿名汇总。`;
  return {
    title,
    description,
    alternates: { canonical: `/model/${slug}` },
    openGraph: { type: "article", title, description, url: `/model/${slug}` },
  };
}

export default async function ModelPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const hit = await load(slug);
  if (!hit) notFound();

  const top = hit[0];
  const totalSamples = hit.reduce((a, s) => a + s.samples, 0);
  const url = `${BRAND.url}/model/${slug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Dataset",
        "@id": `${url}#dataset`,
        name: `${top.model} 实测速度数据`,
        description: `${top.model} 在「${BRAND.zh}」上的真实速度实测：首 Token 时延、输出 tokens/s、峰值速度，全网用户匿名汇总。`,
        url,
        isAccessibleForFree: true,
        creator: {
          "@type": "Organization",
          name: BRAND.publisher,
          url: BRAND.url,
        },
        variableMeasured: [
          "首Token时延 (TTFT, ms)",
          "中位输出速度 (tokens/s)",
          "峰值输出速度 (tokens/s)",
          "输出 token 数",
        ],
        measurementTechnique:
          "浏览器端流式逐 token 计时，服务端时间戳校准；token 口径以厂商官方 usage 为准",
      },
      {
        "@type": "TechArticle",
        headline: `${top.model} 速度实测`,
        url,
        inLanguage: "zh-CN",
        isAccessibleForFree: true,
        author: { "@type": "Organization", name: BRAND.publisher },
        publisher: {
          "@type": "Organization",
          name: BRAND.publisher,
          url: BRAND.url,
        },
      },
    ],
  };
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: BRAND.zh, item: BRAND.url },
      { "@type": "ListItem", position: 2, name: "速度榜", item: `${BRAND.url}/stats` },
      { "@type": "ListItem", position: 3, name: top.model, item: url },
    ],
  };

  return (
    <main className="mx-auto max-w-3xl px-5 py-8">
      <JsonLd data={jsonLd} />
      <JsonLd data={breadcrumbJsonLd} />

      <nav className="mb-6 flex items-center justify-between">
        <Link href="/stats" className="text-[13px] text-faint hover:text-ink">
          ← 速度排行榜
        </Link>
        <Link
          href="/arena"
          className="rounded-md bg-ink px-3.5 py-1.5 text-[13px] font-bold text-paper"
        >
          测一下 {top.model} ▶
        </Link>
      </nav>

      <header className="mb-6">
        <h1
          className="text-[28px] font-black leading-tight"
          style={{ fontFamily: "var(--font-title)" }}
        >
          {top.model} 速度实测
        </h1>
        <p className="mt-2 text-[13.5px] text-faint">
          {top.model} 在「{BRAND.zh}」上的真实输出速度与首 Token 时延，基于全网用户{" "}
          <span className="num text-ink">{fmt(totalSamples)}</span> 次匿名实测汇总。
        </p>
      </header>

      {/* 概要数字（首个接入点） */}
      <div className="grid grid-cols-3 gap-3">
        <Stat label="中位输出" value={fmt(top.medianContentTps)} unit="tok/s" accent />
        <Stat
          label="首 Token"
          value={top.avgTtftMs > 0 ? (top.avgTtftMs / 1000).toFixed(2) : "—"}
          unit="s"
        />
        <Stat label="峰值" value={fmt(top.maxPeakTps)} unit="tok/s" />
      </div>

      {/* 各接入点明细 */}
      {hit.length > 1 && (
        <p className="mt-5 text-[12px] text-faint">
          该模型有 {hit.length} 个接入点（厂商域名），分开统计：
        </p>
      )}
      <div className="mt-3 overflow-hidden rounded-lg border border-line bg-card">
        <div className="grid grid-cols-[1fr_auto_auto_auto] gap-3 border-b border-line bg-paper/50 px-4 py-2.5 text-[11px] font-semibold text-faint">
          <span>接入点</span>
          <span className="w-24 text-right">中位 tok/s</span>
          <span className="w-16 text-right">首响</span>
          <span className="w-16 text-right">峰值</span>
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

      <div className="mt-4 space-y-1 text-[11px] text-faint/80">
        <p>
          · 数据来自用户自愿匿名共享，仅含速度指标 · 中位数降低偶发抖动 · 每 5 分钟更新
        </p>
        <p>
          · 速度受网络、时段、厂商负载影响，仅供参考 ·{" "}
          <Link href="/method" className="underline hover:text-ink">
            测速方法论
          </Link>
        </p>
      </div>

      <div className="mt-7 flex flex-wrap gap-2">
        <Link
          href="/stats"
          className="rounded-md border border-line px-4 py-2 text-[13px] text-faint hover:text-ink"
        >
          看完整排行榜 →
        </Link>
        <Link
          href="/arena"
          className="rounded-md bg-ink px-4 py-2 text-[13px] font-bold text-paper"
        >
          自己跑一轮 ▶
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
