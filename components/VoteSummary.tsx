"use client";

import type { VoteAggregate } from "@/lib/voting";

/** 顶部实时打榜摘要条：第一眼看到当前得分 + 一键去投票 */
export function VoteSummary({
  agg,
  label,
  voted,
  onGoVote,
}: {
  agg: VoteAggregate | null;
  label: (i: number) => string;
  voted: boolean;
  onGoVote: () => void;
}) {
  const total = agg?.total ?? 0;
  const unit =
    agg?.method === "single" ? "票" : agg?.method === "rank" ? "分" : "均分";
  const sorted = [...(agg?.tallies ?? [])].sort((a, b) => b.metric - a.metric);
  const maxV = sorted.length ? Math.max(sorted[0].metric, 0.0001) : 1;

  return (
    <div className="mb-5 rounded-xl border border-line bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[14px] font-bold">🏆 实时打榜</span>
          <span className="num text-[11.5px] text-faint">
            {total > 0
              ? `${total} 票${agg && agg.loginTotal > 0 ? `（${agg.loginTotal} 登录）` : ""}`
              : "还没有人投票，来抢首票"}
          </span>
        </div>
        <button
          onClick={onGoVote}
          className="rounded-md bg-ink px-4 py-1.5 text-[13px] font-bold text-paper hover:opacity-90 cursor-pointer"
        >
          {voted ? "看完整榜单 / 改票 →" : "投出我的一票 →"}
        </button>
      </div>

      {total > 0 && (
        <div className="mt-3 space-y-1.5">
          {sorted.slice(0, 3).map((t, rank) => (
            <div key={t.index} className="flex items-center gap-2">
              <span className="num w-5 shrink-0 text-[12px] text-faint">
                {["🥇", "🥈", "🥉"][rank] ?? rank + 1}
              </span>
              <span className="w-28 shrink-0 truncate text-[12.5px] font-semibold">
                {label(t.index)}
              </span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-paper">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${(t.metric / maxV) * 100}%`,
                    background: rank === 0 ? "var(--accent)" : "var(--ink)",
                  }}
                />
              </div>
              <span className="num w-20 shrink-0 text-right text-[11.5px] text-faint">
                {agg?.method === "score" ? t.metric.toFixed(2) : t.metric} {unit}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
