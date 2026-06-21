import type { Locale } from "@/lib/i18n";

export interface Runner {
  id: string;
  name: string;
  /** 已生成 token（实时 liveTokens 或最终 outputTokens） */
  tokens: number;
  /** 当前/最终速度 tok/s */
  tps: number;
  done: boolean;
  running: boolean;
}

/**
 * 实时赛道：每个模型一条跑道，进度 = 累计 token / 当前领先者。
 * 流式期间 bar 随 token 增长而前进，越快的越早冲到右侧。截图/录屏友好。
 */
export function RaceTrack({ runners, locale }: { runners: Runner[]; locale: Locale }) {
  const isZh = locale === "zh-CN";
  if (runners.length < 2) return null;
  const max = Math.max(1, ...runners.map((r) => r.tokens));
  // 按 token 降序：领先者在最上
  const ordered = [...runners].sort((a, b) => b.tokens - a.tokens);
  const leaderId = ordered[0]?.tokens > 0 ? ordered[0].id : null;

  return (
    <div className="rounded-xl border border-line bg-card px-3.5 py-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[12px] font-semibold">🏁 {isZh ? "实时竞速" : "Live race"}</span>
        <span className="text-[10.5px] text-faint">{isZh ? "进度 = 已生成 token" : "progress = tokens generated"}</span>
      </div>
      <div className="flex flex-col gap-2">
        {ordered.map((r) => {
          const pct = Math.min(100, (r.tokens / max) * 100);
          const leader = r.id === leaderId;
          const color = leader ? "var(--accent)" : "var(--ink)";
          return (
            <div key={r.id} className="flex items-center gap-2.5">
              <div className="w-28 shrink-0 truncate text-[12px] font-medium" title={r.name}>
                {r.name}
              </div>
              <div className="relative h-5 flex-1 overflow-hidden rounded-full bg-paper">
                <div
                  className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-300 ease-out"
                  style={{ width: `${pct}%`, background: color, opacity: leader ? 0.95 : 0.55 }}
                />
                <div
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-[left] duration-300 ease-out text-[12px]"
                  style={{ left: `${pct}%` }}
                >
                  {r.done ? "🏁" : r.running ? "🏎️" : "•"}
                </div>
              </div>
              <div className="num w-24 shrink-0 text-right text-[11px] text-faint">
                <span className="font-semibold text-ink">{Math.round(r.tokens)}</span>
                {r.tps > 0 && <span className="text-faint"> · {Math.round(r.tps)} t/s</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
