import Link from "next/link";
import { Credit } from "@/components/Credit";
import { fetchModelStats, type ModelStat } from "@/lib/stats";

export const metadata = {
  title: "实测速度排行榜 · 百模竞速",
  description:
    "全网用户匿名贡献的大模型真实速度排行：输出 TPS、首 Token 时延、峰值速度。数据持续更新。",
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

  return (
    <main className="mx-auto max-w-4xl px-5 py-8">
      <nav className="mb-6 flex items-center justify-between">
        <Link href="/" className="text-[13px] text-faint hover:text-ink">
          ← 百模竞速
        </Link>
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
                  <span className="truncate text-[13.5px] font-semibold">
                    {s.model}
                  </span>
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
