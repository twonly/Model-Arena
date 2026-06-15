"use client";

import type { ModelStat, VoteAggregate } from "@/lib/voting";

/** 右侧紧凑总榜：按 Wilson 好评置信下界排名；没人点的归「待评价」 */
export function Leaderboard({
  agg,
  count,
  label,
}: {
  agg: VoteAggregate | null;
  count: number; // 总模型数（含没人投票的）
  label: (i: number) => string;
}) {
  // 用完整模型清单兜底：没有投票行的模型也要出现在「待评价」
  const byIndex = new Map<number, ModelStat>();
  for (const m of agg?.models ?? []) byIndex.set(m.index, m);
  const all: ModelStat[] = Array.from({ length: count }, (_, i) => {
    return (
      byIndex.get(i) ?? {
        index: i,
        up: 0,
        down: 0,
        loginUp: 0,
        comments: 0,
        ratio: 0,
        wilson: 0,
      }
    );
  });

  const rated = all
    .filter((m) => m.up + m.down > 0)
    .sort((a, b) => b.wilson - a.wilson);
  const pending = all.filter((m) => m.up + m.down === 0);
  const maxW = rated.length ? Math.max(rated[0].wilson, 0.0001) : 1;

  return (
    <div className="rounded-xl border border-line bg-card p-3.5">
      <div className="flex items-baseline justify-between">
        <span className="text-[13px] font-bold">🏆 实时榜单</span>
        <span className="num text-[10.5px] text-faint">
          {agg ? `${agg.totalVoters} 人参与` : ""}
        </span>
      </div>

      <div className="mt-3 space-y-2">
        {rated.map((m, rank) => (
          <div key={m.index}>
            <div className="flex items-center justify-between text-[11.5px]">
              <span className="min-w-0 truncate font-semibold">
                <span className="num mr-1 text-faint">
                  {["🥇", "🥈", "🥉"][rank] ?? `${rank + 1}.`}
                </span>
                {label(m.index)}
              </span>
              <span className="num shrink-0 text-faint">
                {Math.round(m.ratio * 100)}%
              </span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-paper">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${(m.wilson / maxW) * 100}%`,
                  background: rank === 0 ? "var(--accent)" : "var(--ink)",
                }}
              />
            </div>
            <div className="num mt-0.5 text-[10px] text-faint/80">
              👍{m.up} 👎{m.down}
              {m.loginUp > 0 ? ` · ${m.loginUp} 登录赞` : ""}
            </div>
          </div>
        ))}

        {rated.length === 0 && (
          <div className="text-[11.5px] text-faint">
            还没有人投票，给下面的模型点个 👍 / 👎 吧
          </div>
        )}

        {pending.length > 0 && (
          <div className="border-t border-line pt-2">
            <div className="mb-1 text-[10.5px] text-faint">
              待评价 · {pending.length}
            </div>
            {pending.map((m) => (
              <div key={m.index} className="text-[11px] text-faint/80 truncate">
                · {label(m.index)}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-3 border-t border-line pt-2 text-[9.5px] leading-relaxed text-faint/70">
        排名按 Wilson 好评置信下界：票越多越可信，票少自动打折，故并非单纯比好评率
      </div>
    </div>
  );
}
