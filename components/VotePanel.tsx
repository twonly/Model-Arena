"use client";

import { useEffect, useState } from "react";
import type { ShareResult, VotingConfigLite } from "@/lib/share";
import {
  COMMENT_MAX,
  sceneById,
  submitVote,
  type Sentiment,
  type VoteAggregate,
} from "@/lib/voting";

function Stars({
  value,
  onChange,
  readOnly,
}: {
  value: number;
  onChange?: (v: number) => void;
  readOnly?: boolean;
}) {
  return (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          disabled={readOnly}
          onClick={() => onChange?.(n)}
          className={`text-[15px] leading-none ${readOnly ? "cursor-default" : "cursor-pointer"}`}
          style={{ color: n <= Math.round(value) ? "var(--accent)" : "var(--line)" }}
        >
          ★
        </button>
      ))}
    </span>
  );
}

export function VotePanel({
  shareId,
  results,
  config,
  agg,
  onAgg,
  onVoted,
  label,
}: {
  shareId: string;
  results: ShareResult[];
  config: VotingConfigLite;
  agg: VoteAggregate | null;
  onAgg: (a: VoteAggregate) => void;
  onVoted: () => void;
  label: (i: number) => string;
}) {
  const scene = sceneById(config.scene);
  const blind = config.mode === "blind";
  const method = config.method;

  // 投票输入
  const [pick, setPick] = useState<number | null>(null); // single
  const [ranks, setRanks] = useState<number[]>([]); // rank: 有序
  const [scores, setScores] = useState<Record<number, Record<string, number>>>(
    {}
  ); // score
  // 评论
  const [cTarget, setCTarget] = useState<number>(-1);
  const [cSent, setCSent] = useState<Sentiment>(null);
  const [comment, setComment] = useState("");

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const voted = !!agg?.mine;

  useEffect(() => {
    const mine = agg?.mine;
    if (!mine) return;
    if (mine.pick != null) setPick(mine.pick);
    if (mine.ranks) setRanks(mine.ranks);
    if (mine.scores) setScores(mine.scores);
    if (mine.comment) {
      setCTarget(mine.comment.target);
      setCSent(mine.comment.sentiment);
      setComment(mine.comment.text);
    }
  }, [agg?.mine]);

  const toggleRank = (i: number) => {
    setRanks((cur) => {
      if (cur.includes(i)) return cur.filter((x) => x !== i);
      if (cur.length >= 3) return cur; // 最多前 3
      return [...cur, i];
    });
  };

  const winnerModel = (): string | undefined => {
    if (method === "single" && pick != null) return results[pick]?.model;
    if (method === "rank" && ranks.length) return results[ranks[0]]?.model;
    if (method === "score") {
      let best = -1,
        bestAvg = -1;
      for (const [idxS, dims] of Object.entries(scores)) {
        const vals = Object.values(dims).filter((v) => v > 0);
        if (!vals.length) continue;
        const a = vals.reduce((x, y) => x + y, 0) / vals.length;
        if (a > bestAvg) {
          bestAvg = a;
          best = Number(idxS);
        }
      }
      return best >= 0 ? results[best]?.model : undefined;
    }
    return undefined;
  };

  const submit = async () => {
    setErr("");
    if (method === "single" && pick == null) return setErr("请先选出最佳");
    if (method === "rank" && !ranks.length) return setErr("请排出至少第 1 名");
    if (
      method === "score" &&
      !Object.values(scores).some((d) => Object.values(d).some((v) => v > 0))
    )
      return setErr("请至少给一个模型打分");
    setBusy(true);
    try {
      const a = await submitVote({
        shareId,
        winnerModel: winnerModel(),
        pick: method === "single" ? pick! : undefined,
        ranks: method === "rank" ? ranks : undefined,
        scores: method === "score" ? scores : undefined,
        comment:
          comment.trim() || cSent
            ? { target: cTarget, sentiment: cSent, text: comment.trim() }
            : undefined,
      });
      onAgg(a);
      onVoted();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "投票失败");
    } finally {
      setBusy(false);
    }
  };

  const sorted = [...(agg?.tallies ?? [])].sort((a, b) => b.metric - a.metric);
  const maxM = sorted.length ? Math.max(sorted[0].metric, 0.0001) : 1;
  const total = agg?.total ?? 0;
  const leader = sorted[0]?.index;
  const metricUnit =
    method === "single" ? "票" : method === "rank" ? "分" : "均分";

  const title =
    method === "score"
      ? blind
        ? "🙈 盲评打分"
        : "⭐ 逐项评分"
      : method === "rank"
        ? "📊 排序打榜"
        : blind
          ? "🙈 盲评投票"
          : "🏆 实时打榜";

  return (
    <section
      id="vote-panel"
      className="mt-8 scroll-mt-4 rounded-xl border border-line bg-card p-5"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[16px] font-bold">{title}</span>
        <span className="text-[11.5px] text-faint">
          {total > 0
            ? `${total} 人参与（含 ${agg!.loginTotal} 登录）`
            : "还没有人参与，来抢首票"}
        </span>
      </div>

      {/* 榜单（始终可见，先看分再投） */}
      {total > 0 && (
        <div className="mt-4 space-y-2.5">
          {sorted.map((t, rank) => (
            <div key={t.index}>
              <div className="mb-1 flex items-center justify-between text-[12.5px]">
                <span className="font-semibold">
                  <span className="num mr-1.5 text-faint">
                    {["🥇", "🥈", "🥉"][rank] ?? `#${rank + 1}`}
                  </span>
                  {label(t.index)}
                  {(t.up > 0 || t.down > 0) && (
                    <span className="num ml-2 text-[11px] text-faint">
                      👍{t.up} 👎{t.down}
                    </span>
                  )}
                </span>
                <span className="num text-faint">
                  {method === "score"
                    ? `${t.metric.toFixed(2)} ${metricUnit}`
                    : `${t.metric} ${metricUnit}`}
                  {method === "rank" && t.rankFirsts
                    ? `（${t.rankFirsts} 个第1）`
                    : ""}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-paper">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${(t.metric / maxM) * 100}%`,
                    background: t.index === leader ? "var(--accent)" : "var(--ink)",
                  }}
                />
              </div>
              {Object.keys(t.dimAvg).length > 0 && (
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 pl-1 text-[11px] text-faint">
                  {Object.entries(t.dimAvg).map(([d, avg]) => (
                    <span key={d} className="flex items-center gap-1">
                      {d}
                      <Stars value={avg} readOnly />
                      <span className="num">{avg.toFixed(1)}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 投票输入（按方式） */}
      <div className="mt-5 border-t border-line pt-4">
        <div className="mb-2 text-[13px] font-semibold">
          {method === "single"
            ? voted
              ? "更新我的投票"
              : "👇 投出我的一票"
            : method === "rank"
              ? "👇 按顺序点选你的前 3 名"
              : "👇 给每个模型打分"}
        </div>

        {method === "single" && (
          <div className="space-y-2">
            {results.map((r, i) => (
              <label
                key={i}
                className={`flex cursor-pointer items-center gap-2 rounded-lg border p-2.5 ${pick === i ? "border-accent bg-accent/5" : "border-line"}`}
              >
                <input
                  type="radio"
                  checked={pick === i}
                  onChange={() => setPick(i)}
                  className="accent-[var(--accent)]"
                />
                <span className="text-[13px] font-semibold">{label(i)}</span>
                <StatusTag status={r.status} />
              </label>
            ))}
          </div>
        )}

        {method === "rank" && (
          <div className="space-y-2">
            {results.map((r, i) => {
              const pos = ranks.indexOf(i);
              return (
                <button
                  key={i}
                  onClick={() => toggleRank(i)}
                  className={`flex w-full items-center gap-2 rounded-lg border p-2.5 text-left cursor-pointer ${pos >= 0 ? "border-accent bg-accent/5" : "border-line"}`}
                >
                  <span
                    className="num flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[12px] font-bold"
                    style={{
                      background: pos >= 0 ? "var(--accent)" : "var(--paper)",
                      color: pos >= 0 ? "#fff" : "var(--faint)",
                    }}
                  >
                    {pos >= 0 ? pos + 1 : ""}
                  </span>
                  <span className="text-[13px] font-semibold">{label(i)}</span>
                  <StatusTag status={r.status} />
                </button>
              );
            })}
            <div className="text-[10.5px] text-faint/80">
              点选顺序即名次（最多 3 名），再点一次取消
            </div>
          </div>
        )}

        {method === "score" && (
          <div className="space-y-2.5">
            {results.map((r, i) => (
              <div key={i} className="rounded-lg border border-line p-2.5">
                <div className="flex items-center gap-2 text-[13px] font-semibold">
                  {label(i)}
                  <StatusTag status={r.status} />
                </div>
                <div className="mt-1.5 flex flex-wrap gap-x-5 gap-y-1.5">
                  {(scene.dims.length ? scene.dims : ["综合体验"]).map((d) => (
                    <span
                      key={d}
                      className="flex items-center gap-1.5 text-[12px] text-faint"
                    >
                      {d}
                      <Stars
                        value={scores[i]?.[d] ?? 0}
                        onChange={(v) =>
                          setScores((s) => ({
                            ...s,
                            [i]: { ...(s[i] ?? {}), [d]: v },
                          }))
                        }
                      />
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 评论（针对任意模型 + 👍/👎） */}
        <div className="mt-3 rounded-lg border border-line bg-paper/30 p-2.5">
          <div className="mb-1.5 flex flex-wrap items-center gap-2 text-[12px]">
            <span className="text-faint">点评</span>
            <select
              value={cTarget}
              onChange={(e) => setCTarget(Number(e.target.value))}
              className="rounded border border-line bg-card px-1.5 py-1 text-[11.5px] outline-none cursor-pointer"
            >
              <option value={-1}>综合</option>
              {results.map((_, i) => (
                <option key={i} value={i}>
                  {label(i)}
                </option>
              ))}
            </select>
            <button
              onClick={() => setCSent((s) => (s === "up" ? null : "up"))}
              className={`rounded px-2 py-1 text-[12px] cursor-pointer ${cSent === "up" ? "bg-go/15 text-go" : "text-faint hover:text-ink"}`}
              style={cSent === "up" ? { color: "var(--go)" } : undefined}
            >
              👍 好评
            </button>
            <button
              onClick={() => setCSent((s) => (s === "down" ? null : "down"))}
              className={`rounded px-2 py-1 text-[12px] cursor-pointer ${cSent === "down" ? "text-accent" : "text-faint hover:text-ink"}`}
            >
              👎 差评
            </button>
          </div>
          <textarea
            className="w-full rounded-md border border-line bg-card px-2.5 py-1.5 text-[12.5px] outline-none focus:border-ink/40"
            rows={2}
            maxLength={COMMENT_MAX}
            placeholder="理性讨论，说说你的看法（可选，≤500 字）"
            value={comment}
            onChange={(e) => setComment(e.target.value.slice(0, COMMENT_MAX))}
          />
          <div className="num text-right text-[10.5px] text-faint/70">
            {comment.length}/{COMMENT_MAX}
          </div>
        </div>

        {err && <div className="mt-2 text-[12px] text-accent">✗ {err}</div>}
        <button
          onClick={submit}
          disabled={busy}
          className="mt-3 rounded-md bg-ink px-6 py-2 text-[13.5px] font-bold text-paper disabled:opacity-40 cursor-pointer"
        >
          {busy
            ? "提交中…"
            : voted
              ? "更新我的评价"
              : method === "score"
                ? "提交评分"
                : "投出我的一票"}
        </button>
      </div>

      {/* 评论列表 */}
      {agg && agg.comments.length > 0 && (
        <div className="mt-4 border-t border-line pt-3">
          <div className="mb-1.5 text-[12px] font-semibold text-faint">
            评论（{agg.comments.length}）
          </div>
          <div className="thin-scroll max-h-60 space-y-1.5 overflow-y-auto">
            {agg.comments.map((c, i) => (
              <div
                key={i}
                className="rounded-md border border-line bg-paper/40 px-2.5 py-1.5 text-[12px]"
              >
                <span className="text-faint">
                  {c.sentiment === "up" && "👍 "}
                  {c.sentiment === "down" && "👎 "}
                  {c.target >= 0 ? `「${label(c.target)}」` : "综合"}
                  {c.byLogin && (
                    <span className="ml-1 text-[10px]" style={{ color: "var(--go)" }}>
                      登录
                    </span>
                  )}
                  ：
                </span>
                <span className="break-words">{c.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function StatusTag({ status }: { status: ShareResult["status"] }) {
  if (status === "error")
    return <span className="text-[11px] text-accent">（失败）</span>;
  if (status === "truncated")
    return (
      <span className="text-[11px]" style={{ color: "var(--think)" }}>
        （中断）
      </span>
    );
  return null;
}
