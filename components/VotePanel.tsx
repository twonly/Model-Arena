"use client";

import { useEffect, useState } from "react";
import { rankBadge } from "@/lib/format";
import type { ShareResult, VotingConfigLite } from "@/lib/share";
import {
  COMMENT_MAX,
  fetchVotes,
  sceneById,
  submitVote,
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
          className={readOnly ? "cursor-default" : "cursor-pointer"}
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
  revealed,
  onVoted,
}: {
  shareId: string;
  results: ShareResult[];
  config: VotingConfigLite;
  /** 盲评：是否已揭晓名字（投票后或本就打榜模式） */
  revealed: boolean;
  onVoted: (agg: VoteAggregate) => void;
}) {
  const scene = sceneById(config.scene);
  const blind = config.mode === "blind";

  const [agg, setAgg] = useState<VoteAggregate | null>(null);
  const [pick, setPick] = useState<number | null>(null);
  const [scores, setScores] = useState<Record<number, Record<string, number>>>(
    {}
  );
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [showResults, setShowResults] = useState(false);

  const voted = !!agg?.mine;

  useEffect(() => {
    fetchVotes(shareId)
      .then((a) => {
        setAgg(a);
        if (a.mine) {
          setPick(a.mine.pick);
          setComment(a.mine.comment ?? "");
          if (a.mine.scores) setScores({ [a.mine.pick]: a.mine.scores });
          setShowResults(true);
          onVoted(a); // 已投过 → 揭晓
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shareId]);

  const label = (i: number) =>
    blind && !revealed ? `模型 ${String.fromCharCode(65 + i)}` : results[i].name;

  const submit = async () => {
    setErr("");
    if (pick == null) {
      setErr("请先选出你心中的最佳");
      return;
    }
    setBusy(true);
    try {
      const a = await submitVote({
        shareId,
        pick,
        scores: scene.dims.length ? scores[pick] : undefined,
        comment: comment.trim() || undefined,
      });
      setAgg(a);
      setShowResults(true);
      onVoted(a);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "投票失败");
    } finally {
      setBusy(false);
    }
  };

  const maxVotes = agg?.tallies.length
    ? Math.max(...agg.tallies.map((t) => t.votes), 1)
    : 1;
  const tallyOf = (i: number) => agg?.tallies.find((t) => t.index === i);

  return (
    <section className="mt-8 rounded-xl border border-line bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-[16px] font-bold">
            {blind ? "🙈 盲评投票" : "🏆 打榜投票"}
          </div>
          <div className="text-[11.5px] text-faint">
            {blind
              ? "投票前隐藏模型名，凭结果质量投票，投完揭晓——更公正"
              : "为你心中最棒的模型投上一票"}
            {agg ? ` · 已有 ${agg.total} 票（含 ${agg.loginTotal} 登录票）` : ""}
          </div>
        </div>
        {voted && (
          <button
            onClick={() => setShowResults((v) => !v)}
            className="rounded-md border border-line px-2.5 py-1.5 text-[12px] text-faint hover:text-ink cursor-pointer"
          >
            {showResults ? "改我的投票" : "看结果"}
          </button>
        )}
      </div>

      {/* 投票表单 / 结果 */}
      {!showResults ? (
        <div className="mt-4 space-y-2">
          {results.map((r, i) => (
            <div
              key={i}
              className={`rounded-lg border p-3 ${pick === i ? "border-accent bg-accent/5" : "border-line"}`}
            >
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  checked={pick === i}
                  onChange={() => setPick(i)}
                  className="accent-[var(--accent)]"
                />
                <span className="text-[13.5px] font-semibold">{label(i)}</span>
                {r.status === "error" && (
                  <span className="text-[11px] text-accent">（失败）</span>
                )}
                {r.status === "truncated" && (
                  <span className="text-[11px]" style={{ color: "var(--think)" }}>
                    （中断）
                  </span>
                )}
              </label>
              {/* 维度星级（选了该模型时展开） */}
              {scene.dims.length > 0 && pick === i && (
                <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1.5 pl-6">
                  {scene.dims.map((d) => (
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
              )}
            </div>
          ))}
          <div>
            <textarea
              className="w-full rounded-md border border-line bg-paper/40 px-2.5 py-1.5 text-[12.5px] outline-none focus:border-ink/40"
              rows={2}
              maxLength={COMMENT_MAX}
              placeholder="留句评论（可选，≤500 字）"
              value={comment}
              onChange={(e) => setComment(e.target.value.slice(0, COMMENT_MAX))}
            />
            <div className="num mt-0.5 text-right text-[10.5px] text-faint/70">
              {comment.length}/{COMMENT_MAX}
            </div>
          </div>
          {err && <div className="text-[12px] text-accent">✗ {err}</div>}
          <button
            onClick={submit}
            disabled={busy || pick == null}
            className="rounded-md bg-ink px-5 py-2 text-[13px] font-bold text-paper disabled:opacity-40 cursor-pointer"
          >
            {busy ? "提交中…" : voted ? "更新我的投票" : "投票"}
          </button>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {/* 票数排行 */}
          {results.map((r, i) => {
            const t = tallyOf(i);
            const v = t?.votes ?? 0;
            return (
              <div key={i}>
                <div className="mb-1 flex items-center justify-between text-[12.5px]">
                  <span className="font-semibold">
                    {results[i].name}
                    {agg?.mine?.pick === i && (
                      <span className="ml-1.5 text-[10.5px] text-accent">
                        我投的
                      </span>
                    )}
                  </span>
                  <span className="num text-faint">
                    {v} 票
                    {t && t.loginVotes > 0 ? `（${t.loginVotes} 登录）` : ""}
                    {agg && agg.total > 0
                      ? ` · ${Math.round((v / agg.total) * 100)}%`
                      : ""}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-paper">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(v / maxVotes) * 100}%`,
                      background:
                        i === leaderIndex(agg) ? "var(--accent)" : "var(--ink)",
                    }}
                  />
                </div>
                {/* 维度均分 */}
                {t && Object.keys(t.dimAvg).length > 0 && (
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
            );
          })}

          {/* 评论 */}
          {agg && agg.comments.length > 0 && (
            <div className="mt-2 border-t border-line pt-3">
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
                      投「{results[c.pick]?.name ?? "?"}」
                      {c.byLogin && (
                        <span className="ml-1 text-[10px]" style={{ color: "var(--go)" }}>
                          登录用户
                        </span>
                      )}
                      ：
                    </span>
                    <span className="break-words">{c.comment}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function leaderIndex(agg: VoteAggregate | null): number {
  if (!agg?.tallies.length) return -1;
  return agg.tallies.reduce((a, b) => (b.votes > a.votes ? b : a)).index;
}
