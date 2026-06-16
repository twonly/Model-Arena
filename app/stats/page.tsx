import Link from "next/link";
import { Credit } from "@/components/Credit";
import { Logo } from "@/components/Logo";
import { JsonLd } from "@/components/JsonLd";
import { BRAND } from "@/lib/brand";
import { fetchModelStats, modelSlug, type ModelStat } from "@/lib/stats";

export const metadata = {
  title: "大模型实测速度排行榜",
  description:
    "全网用户匿名贡献的大模型真实速度排行：输出 TPS、首 Token 时延、峰值速度。数据持续更新。",
  alternates: { canonical: "/stats" },
};

// 每 5 分钟重新生成
export const revalidate = 300;

function fmt(n: number, digits = 0): string {
  if (!isFinite(n) || n <= 0) return "—";
  return n.toLocaleString("en-US", { maximumFractionDigits: digits });
}

const MEDALS = ["🥇", "🥈", "🥉"];

export default async function StatsPage() {
  let stats: ModelStat[] | null = null;
  let error = false;
  try {
    stats = await fetchModelStats();
  } catch {
    error = true;
  }

  const maxTps = stats?.length
    ? Math.max(...stats.map((s) => s.medianContentTps))
    : 1;
  const totalSamples = stats?.reduce((a, s) => a + s.samples, 0) ?? 0;

  const listJsonLd = stats?.length
    ? {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: "大模型实测速度排行榜",
        description:
          "全网用户匿名贡献的大模型真实速度：中位输出 tok/s、首 Token 时延、峰值速度。",
        url: `${BRAND.url}/stats`,
        numberOfItems: stats.length,
        itemListElement: stats.map((s, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: s.model,
          description: `中位输出 ${fmt(s.medianContentTps)} tok/s · 峰值 ${fmt(
            s.maxPeakTps
          )} tok/s · ${s.samples} 次实测`,
        })),
      }
    : null;

  // GEO：Dataset 结构化数据，便于生成式引擎理解并引用「哪个模型最快」类问答
  const datasetJsonLd = stats?.length
    ? {
        "@context": "https://schema.org",
        "@type": "Dataset",
        name: "大模型实测速度数据集",
        description:
          "全网用户匿名贡献的大模型真实速度：首 Token 时延（TTFT）、思考 / 输出 tokens per second、峰值速度与 token 数。",
        url: `${BRAND.url}/stats`,
        isAccessibleForFree: true,
        creator: { "@type": "Organization", name: BRAND.publisher, url: BRAND.url },
        license: "https://github.com",
        variableMeasured: [
          "首Token时延 (TTFT, ms)",
          "中位输出速度 (tokens/s)",
          "峰值输出速度 (tokens/s)",
          "输出 token 数",
        ],
        measurementTechnique:
          "浏览器端流式逐 token 计时，服务端时间戳校准；token 口径以厂商官方 usage 为准",
        dateModified: new Date().toISOString(),
      }
    : null;

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: BRAND.zh, item: BRAND.url },
      { "@type": "ListItem", position: 2, name: "速度榜", item: `${BRAND.url}/stats` },
    ],
  };

  return (
    <main className="mx-auto max-w-4xl px-5 py-8">
      {listJsonLd && <JsonLd data={listJsonLd} />}
      {datasetJsonLd && <JsonLd data={datasetJsonLd} />}
      <JsonLd data={breadcrumbJsonLd} />
      <nav className="mb-6 flex items-center justify-between">
        <Logo withText />
        <div className="flex items-center gap-2">
          <Link
            href="/board"
            className="rounded-md border border-line px-3 py-1.5 text-[13px] text-faint hover:text-ink"
          >
            🏆 人气榜
          </Link>
          <Link
            href="/arena"
            className="rounded-md bg-ink px-3.5 py-1.5 text-[13px] font-bold text-paper"
          >
            我也来测 ▶
          </Link>
        </div>
      </nav>

      <header className="mb-6">
        <h1
          className="text-[30px] font-black"
          style={{ fontFamily: "var(--font-title)" }}
        >
          大模型实测速度排行榜
        </h1>
        <p className="mt-2 text-[13px] text-faint">
          全网用户在「百模竞速」里跑出的真实速度，匿名汇总。
          {stats?.length ? (
            <>
              {" "}
              当前 <span className="num text-ink">{stats.length}</span> 个模型 ·{" "}
              <span className="num text-ink">{fmt(totalSamples)}</span> 次实测
            </>
          ) : null}
        </p>
      </header>

      {stats === null ? (
        <div className="rounded-lg border border-dashed border-line bg-card/60 px-6 py-12 text-center text-[13px] text-faint">
          {error
            ? "排行榜数据暂时不可用，请稍后再试。"
            : "排行榜尚未启用（数据后端未配置）。"}
        </div>
      ) : stats.length === 0 ? (
        <div className="rounded-lg border border-dashed border-line bg-card/60 px-6 py-12 text-center">
          <div className="text-[15px] font-semibold mb-1.5">还没有数据</div>
          <div className="text-[12.5px] text-faint mb-4">
            成为第一个贡献者——在竞速场跑一轮并选择「同意共享」即可上榜
          </div>
          <Link
            href="/arena"
            className="rounded-md bg-ink px-5 py-2 text-[13px] font-bold text-paper"
          >
            去跑一轮 ▶
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-line bg-card">
          {/* 表头 */}
          <div className="grid grid-cols-[1fr_auto_auto_auto] gap-3 border-b border-line bg-paper/50 px-4 py-2.5 text-[11px] font-semibold text-faint">
            <span>模型</span>
            <span className="w-28 text-right">中位输出 tok/s</span>
            <span className="w-16 text-right">首响</span>
            <span className="w-16 text-right">峰值</span>
          </div>
          {stats.map((s, i) => (
            <div
              key={`${s.model}-${s.provider}`}
              className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-3 border-b border-line px-4 py-3 last:border-0"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="num w-6 shrink-0 text-[13px] text-faint">
                    {MEDALS[i] ?? `${i + 1}`}
                  </span>
                  <Link
                    href={`/model/${modelSlug(s.model)}`}
                    className="truncate text-[13.5px] font-semibold hover:text-accent"
                  >
                    {s.model}
                  </Link>
                </div>
                <div className="num ml-[30px] mt-1 flex items-center gap-2 text-[10.5px] text-faint">
                  <span className="truncate">{s.provider}</span>
                  <span>· {s.samples} 次</span>
                </div>
                {/* 速度条 */}
                <div className="ml-[30px] mt-1.5 h-1.5 w-full max-w-[200px] overflow-hidden rounded-full bg-paper">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(s.medianContentTps / maxTps) * 100}%`,
                      background: i === 0 ? "var(--accent)" : "var(--ink)",
                    }}
                  />
                </div>
              </div>
              <div className="num w-28 text-right">
                <span className="text-[16px] font-bold">
                  {fmt(s.medianContentTps)}
                </span>
                <div className="text-[10px] text-faint">
                  均 {fmt(s.avgContentTps)}
                </div>
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
      )}

      <div className="mt-5 space-y-1 text-[11px] text-faint/80">
        <p>
          · 数据来自用户自愿匿名共享，仅含速度指标，不含任何 Prompt 内容与 API
          Key · 每 5 分钟更新
        </p>
        <p>
          · 速度受网络、时段、厂商负载影响，仅供参考；同一模型不同接入点（域名）分开统计
        </p>
      </div>

      <footer className="mt-8 flex justify-center">
        <Credit compact />
      </footer>
    </main>
  );
}
