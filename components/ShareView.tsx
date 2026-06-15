"use client";

import { useEffect, useState } from "react";
import { ModelCard, STATUS_COLOR } from "./ModelCard";
import { Credit } from "./Credit";
import { CardVoteBar } from "./CardVoteBar";
import { Leaderboard } from "./Leaderboard";
import { extractWordTarget, rankBadge } from "@/lib/format";
import type { ShareSnapshot } from "@/lib/share";
import {
  fetchVotes,
  reactModel,
  type Sentiment,
  type VoteAggregate,
} from "@/lib/voting";
import { emptyRun, type ModelEndpoint, type RunState } from "@/lib/types";

/** 只读分享视图：卡片内 👍/👎 + 评论，右侧实时榜单 */
export function ShareView({
  snapshot,
  shareId,
}: {
  snapshot: ShareSnapshot;
  shareId: string;
}) {
  const [markdown, setMarkdown] = useState(true);
  const [compact, setCompact] = useState(false);
  const [hidden, setHidden] = useState<string[]>([]);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [agg, setAgg] = useState<VoteAggregate | null>(null);

  const voting = snapshot.voting?.enabled;

  useEffect(() => {
    if (!voting) return;
    fetchVotes(shareId)
      .then(setAgg)
      .catch(() => {});
  }, [voting, shareId]);

  const react = async (
    modelIndex: number,
    modelId: string,
    sentiment: Sentiment,
    comment?: string
  ) => {
    const a = await reactModel({ shareId, modelIndex, modelId, sentiment, comment });
    setAgg(a);
  };

  const idxOf = (epId: string) => Number(epId.replace("s-", ""));
  const voteLabel = (i: number) => snapshot.results[i]?.name ?? `模型${i + 1}`;

  const endpoints: ModelEndpoint[] = snapshot.results.map((r, i) => ({
    id: `s-${i}`,
    name: r.name,
    model: r.model,
    kind: "openai",
    baseUrl: "",
    apiKey: "",
    enabled: true,
  }));

  const runs: Record<string, RunState> = {};
  snapshot.results.forEach((r, i) => {
    runs[`s-${i}`] = {
      ...emptyRun(),
      status:
        r.status === "error" || r.status === "truncated" ? r.status : "done",
      text: r.text,
      reasoning: r.reasoning,
      metrics: r.metrics,
      rank: r.rank,
      error: r.error,
      samples: r.samples ?? [],
    };
  });

  useEffect(() => {
    if (!focusId) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setFocusId(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [focusId]);

  const wordTarget = extractWordTarget(snapshot.prompt);
  const visible = endpoints.filter((e) => !hidden.includes(e.id));
  const focusEp = focusId ? endpoints.find((e) => e.id === focusId) : null;

  const cols = compact
    ? visible.length <= 2
      ? "sm:grid-cols-2"
      : "sm:grid-cols-2 xl:grid-cols-3"
    : visible.length <= 1
      ? "grid-cols-1"
      : "md:grid-cols-2";

  const btn =
    "rounded-md border border-line bg-card px-2.5 py-1.5 text-[12px] text-faint hover:text-ink cursor-pointer";

  return (
    <main className="mx-auto max-w-7xl px-5 py-8">
      <nav className="mb-5 flex items-center justify-between">
        <a href="/" className="text-[13px] text-faint hover:text-ink">
          ← 百模竞速 Model Arena
        </a>
        <div className="flex items-center gap-2">
          <button className={btn} onClick={() => setMarkdown((v) => !v)}>
            {markdown ? "MD 渲染：开" : "MD 渲染：关"}
          </button>
          <button className={btn} onClick={() => setCompact((v) => !v)}>
            {compact ? "📊 紧凑：开" : "📊 紧凑：关"}
          </button>
          <a className={btn} href="/me">
            🗂 我的
          </a>
          <a
            href="/arena"
            className="rounded-md bg-ink px-3.5 py-1.5 text-[13px] font-bold text-paper"
          >
            我也来测 ▶
          </a>
        </div>
      </nav>

      <header className="mb-5">
        <h1
          className="text-[30px] font-black leading-tight"
          style={{ fontFamily: "var(--font-title)" }}
        >
          {snapshot.title || "模型速度对比"}
        </h1>
        {snapshot.notes && (
          <p className="mt-1 whitespace-pre-wrap text-[13.5px] leading-relaxed text-faint">
            {snapshot.notes}
          </p>
        )}
        <div className="num mt-1 text-[11px] text-faint/70">
          {snapshot.results.length} 个模型 ·{" "}
          {snapshot.watermark.trim() || "百模竞速 Model Arena"} · 分享快照
        </div>
      </header>

      {snapshot.prompt.trim() && (
        <div className="mb-5 rounded-lg border border-line bg-card px-4 py-3 text-[13.5px] leading-relaxed whitespace-pre-wrap">
          {snapshot.prompt}
        </div>
      )}

      {/* 模型显示切换 */}
      {endpoints.length >= 2 && (
        <div className="mb-3 flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] text-faint shrink-0">显示</span>
          {endpoints.map((ep) => {
            const run = runs[ep.id] ?? emptyRun();
            const isHidden = hidden.includes(ep.id);
            return (
              <button
                key={ep.id}
                onClick={() =>
                  setHidden((p) =>
                    p.includes(ep.id)
                      ? p.filter((x) => x !== ep.id)
                      : [...p, ep.id]
                  )
                }
                className={`flex items-center gap-1.5 rounded-md border border-line px-1.5 py-1 text-[11.5px] cursor-pointer ${
                  isHidden ? "bg-paper/40 opacity-50" : "bg-card"
                }`}
              >
                <span
                  className="inline-block h-1.5 w-1.5 rounded-full"
                  style={{ background: STATUS_COLOR[run.status] }}
                />
                <span className={isHidden ? "line-through" : ""}>{ep.name}</span>
                {run.rank != null && <span>{rankBadge(run.rank)}</span>}
              </button>
            );
          })}
          {hidden.length > 0 && (
            <button
              onClick={() => setHidden([])}
              className="text-[11px] text-faint underline hover:text-ink cursor-pointer"
            >
              全部显示
            </button>
          )}
        </div>
      )}

      {/* 主区 + 右侧榜单 */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="order-2 min-w-0 lg:order-1 lg:flex-1">
          <div className={`grid gap-4 ${cols}`}>
            {visible.map((ep) => (
              <div key={ep.id}>
                <ModelCard
                  endpoint={ep}
                  run={runs[ep.id] ?? emptyRun()}
                  markdown={markdown}
                  screenshotMode={false}
                  readOnly
                  thinkingStats={snapshot.thinkingStats}
                  nowTick={0}
                  onRerun={() => {}}
                  onToggleFocus={() => setFocusId(ep.id)}
                  wordTarget={wordTarget}
                  compact={compact}
                />
                {voting && (
                  <CardVoteBar
                    modelIndex={idxOf(ep.id)}
                    modelId={ep.model}
                    agg={agg}
                    onReact={react}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {voting && (
          <aside className="order-1 lg:order-2 lg:w-64 lg:shrink-0 lg:sticky lg:top-4">
            <Leaderboard
              agg={agg}
              count={snapshot.results.length}
              label={voteLabel}
            />
          </aside>
        )}
      </div>

      {/* 单模型放大 */}
      {focusEp && (
        <div
          className="fixed inset-0 z-40 overflow-y-auto bg-ink/45 p-4 pt-[4vh]"
          onClick={() => setFocusId(null)}
        >
          <div
            className="mx-auto w-full max-w-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <ModelCard
              endpoint={focusEp}
              run={runs[focusEp.id] ?? emptyRun()}
              markdown={markdown}
              screenshotMode={false}
              readOnly
              thinkingStats={snapshot.thinkingStats}
              nowTick={0}
              onRerun={() => {}}
              expanded
              onToggleFocus={() => setFocusId(null)}
              wordTarget={wordTarget}
            />
            {voting && (
              <CardVoteBar
                modelIndex={idxOf(focusEp.id)}
                modelId={focusEp.model}
                agg={agg}
                onReact={react}
              />
            )}
          </div>
        </div>
      )}

      <footer className="mt-10 flex flex-col items-center gap-2 text-center text-[11px] text-faint/70">
        <Credit compact />
        <span>
          这是一次对比的只读快照 ·{" "}
          <a href="/arena" className="hover:text-ink">
            自己也接入模型跑一轮 →
          </a>
        </span>
      </footer>
    </main>
  );
}
