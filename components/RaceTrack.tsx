import type { Locale } from "@/lib/i18n";
import { raceProgressPct, speedBarPct } from "@/lib/race-track";

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
 * 实时赛道：每个模型一条跑道。两条并列的条形分别编码两个维度——
 * 粗条「进度 = 已生成 token」（跑了多远 / 数量），细条「速度 = 实时 tps」（跑得多快 /
 * 速率，相对全场最快归一化）。这样「token 多但慢」与「token 少但快」一眼可辨，
 * 而不只是看谁的 token 多。最快者标 ⚡，token 最多者（领跑）粗条用强调色。
 * 静态截图/录屏友好。
 */
export function RaceTrack({ runners, locale }: { runners: Runner[]; locale: Locale }) {
  const isZh = locale === "zh-CN";
  if (runners.length < 2) return null;
  const max = Math.max(1, ...runners.map((r) => r.tokens));
  const maxTps = Math.max(1, ...runners.map((r) => r.tps));
  // 按 token 降序：领跑者在最上
  const ordered = [...runners].sort((a, b) => b.tokens - a.tokens);
  const leaderId = ordered[0]?.tokens > 0 ? ordered[0].id : null;
  // 全场最快（速率维度，与「token 最多」分开标记）
  const fastest = ordered.reduce(
    (best, r) => (r.tps > (best?.tps ?? 0) ? r : best),
    null as Runner | null
  );
  const fastestId = fastest && fastest.tps > 0 ? fastest.id : null;

  return (
    <div className="rounded-xl border border-line bg-card px-3.5 py-3">
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <span className="text-[12px] font-semibold">🏁 {isZh ? "实时竞速" : "Live race"}</span>
        <span className="flex items-center gap-2.5 text-[10.5px] text-faint">
          <span className="flex items-center gap-1">
            <span
              className="inline-block h-2 w-3.5 rounded-full"
              style={{ background: "var(--ink)", opacity: 0.6 }}
              aria-hidden="true"
            />
            {isZh ? "已生成 token" : "tokens"}
          </span>
          <span className="flex items-center gap-1">
            <span
              className="inline-block h-1 w-3.5 rounded-full"
              style={{ background: "var(--go)" }}
              aria-hidden="true"
            />
            {isZh ? "速度 t/s" : "speed t/s"}
          </span>
        </span>
      </div>
      <div className="flex flex-col gap-2.5">
        {ordered.map((r) => {
          const pct = raceProgressPct(r.tokens, max);
          const markerPct = r.tokens > 0 ? Math.max(1.5, pct) : 0;
          const leader = r.id === leaderId;
          const isFastest = r.id === fastestId;
          const color = leader ? "var(--accent)" : "var(--ink)";
          const spd = speedBarPct(r.tps, maxTps);
          return (
            <div
              key={r.id}
              className="grid grid-cols-[5.5rem_minmax(0,1fr)_4.75rem] items-center gap-2.5 sm:grid-cols-[7rem_minmax(0,1fr)_5.5rem]"
            >
              <div className="truncate text-[12px] font-medium" title={r.name}>
                {r.name}
              </div>
              {/* 两条并列：粗条=token 进度，细条=相对速度 */}
              <div className="flex flex-col gap-1">
                <div className="relative h-5 overflow-hidden rounded-full bg-paper">
                  <div className="absolute inset-y-0 right-2 w-px bg-line/80" aria-hidden="true" />
                  <div
                    className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-300 ease-out"
                    style={{ width: `${pct}%`, background: color, opacity: leader ? 0.95 : 0.55 }}
                  />
                  <div
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 text-[12px] transition-[left] duration-300 ease-out"
                    style={{ left: `${markerPct}%` }}
                  >
                    {r.done ? "🏁" : r.running ? "🏎️" : "•"}
                  </div>
                </div>
                <div className="relative h-1.5 overflow-hidden rounded-full bg-paper">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-500 ease-out"
                    style={{ width: `${spd}%`, background: "var(--go)", opacity: isFastest ? 1 : 0.5 }}
                  />
                </div>
              </div>
              {/* 数值：token 数（大）+ 实时 t/s（最快标 ⚡ 强调） */}
              <div className="num shrink-0 text-right leading-tight tabular-nums">
                <div className="text-[12px] font-semibold text-ink">{Math.round(r.tokens)}</div>
                <div
                  className="text-[10.5px]"
                  style={{ color: isFastest ? "var(--go)" : "var(--faint)" }}
                >
                  {r.tps > 0 ? (
                    <>
                      {isFastest && "⚡"}
                      {Math.round(r.tps)} <span className="text-faint">t/s</span>
                    </>
                  ) : (
                    <span className="text-faint">—</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
