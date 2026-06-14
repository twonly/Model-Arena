"use client";

import { useEffect, useState } from "react";
import type { ShareResult, VotingConfigLite } from "@/lib/share";
import {
  COMMENT_MAX,
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
  revealed,
  agg,
  onAgg,
  onVoted,
  label,
}: {
  shareId: string;
  results: ShareResult[];
  config: VotingConfigLite;
  revealed: boolean;
  agg: VoteAggregate | null;
  onAgg: (a: VoteAggregate) => void;
  onVoted: () => void;
  /** 盲评前用「模型 A」掩码，揭晓后真名 */
  label: (i: number) => string;
}) {
  const scene = sceneById(config.scene);
  const blind = config.mode === "blind";

  const [pick, setPick] = useState<number | null>(null);
  const [scores, setScores] = useState<Record<number, Record<string, number>>>(
    {}
  );
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const voted = !!agg?.mine;

  // 回显已投内容
  useEffect(() => {
    if (agg?.mine) {
      setPick(agg.mine.pick);
      setComment(agg.mine.comment ?? "");
      if (agg.mine.scores) setScores({ [agg.mine.pick]: agg.mine.scores });
    }
  }, [agg?.mine]);

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
      onAgg(a);
      onVoted();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "投票失败");
    } finally {
      setBusy(false);
    }
  };

  const sorted = [...(agg?.tallies ?? [])].sort((a, b) => b.votes - a.votes);
  const maxV = sorted.length ? Math.max(sorted[0].votes, 1) : 1;
  const total = agg?.total ?? 0;
  const leader = sorted[0]?.index;

  return (
    <section
      id="vote-panel"
      className="mt-8 scroll-mt-4 rounded-xl border border-line bg-card p-5"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[16px] font-bold">
          {blind ? "🙈 盲评打榜" : "🏆 实时打榜"}
        </span>
        <span className="text-[11.5px] text-faint">
          {blind
            ? voted || revealed
              ? "已揭晓模型名"
              : "凭结果质量投票，投完揭晓真名——更公正"
            : "为你心中最棒的模型投上一票"}
          {total > 0 ? ` · ${total} 票（含 ${agg!.loginTotal} 登录票）` : ""}
        </span>
      </div>

      {/* 当前榜单（始终可见，先看分再投） */}
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
                  {agg?.mine?.pick === t.index && (
                    <span className="ml-1.5 text-[10.5px] text-accent">
                      我投的
                    </span>
                  )}
                </span>
                <span className="num text-faint">
                  {t.votes} 票
                  {t.loginVotes > 0 ? `（${t.loginVotes} 登录）` : ""} ·{" "}
                  {Math.round((t.votes / total) * 100)}%
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-paper">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${(t.votes / maxV) * 100}%`,
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

      {/* 我的投票 */}
      <div className="mt-5 border-t border-line pt-4">
        <div className="mb-2 text-[13px] font-semibold">
          {voted ? "更新我的投票" : "👇 投出我的一票"}
        </div>
        <div className="space-y-2">
          {results.map((r, i) => (
            <div
              key={i}
              className={`rounded-lg border p-2.5 ${pick === i ? "border-accent bg-accent/5" : "border-line"}`}
            >
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  checked={pick === i}
                  onChange={() => setPick(i)}
                  className="accent-[var(--accent)]"
                />
                <span className="text-[13px] font-semibold">{label(i)}</span>
                {r.status === "error" && (
                  <span className="text-[11px] text-accent">（失败）</span>
                )}
                {r.status === "truncated" && (
                  <span className="text-[11px]" style={{ color: "var(--think)" }}>
                    （中断）
                  </span>
                )}
              </label>
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
            className="rounded-md bg-ink px-6 py-2 text-[13.5px] font-bold text-paper disabled:opacity-40 cursor-pointer"
          >
            {busy ? "提交中…" : voted ? "更新我的一票" : "投出我的一票"}
          </button>
        </div>
      </div>

      {/* 评论 */}
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
                  投「{label(c.pick)}」
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
    </section>
  );
}
