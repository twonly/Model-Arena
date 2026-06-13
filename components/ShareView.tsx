"use client";

import { useState } from "react";
import { ModelCard } from "./ModelCard";
import { Credit } from "./Credit";
import { extractWordTarget } from "@/lib/format";
import type { ShareSnapshot } from "@/lib/share";
import { emptyRun, type ModelEndpoint, type RunState } from "@/lib/types";

/** 只读分享视图：复用 ModelCard 渲染快照，禁用一切交互 */
export function ShareView({ snapshot }: { snapshot: ShareSnapshot }) {
  const [markdown, setMarkdown] = useState(true);

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
      status: r.status === "error" ? "error" : "done",
      text: r.text,
      reasoning: r.reasoning,
      metrics: r.metrics,
      rank: r.rank,
      error: r.error,
      samples: r.samples ?? [],
    };
  });

  const wordTarget = extractWordTarget(snapshot.prompt);
  const cols =
    endpoints.length <= 1
      ? "grid-cols-1 max-w-3xl"
      : endpoints.length === 2
        ? "md:grid-cols-2"
        : "md:grid-cols-2 xl:grid-cols-3";

  return (
    <main className="mx-auto max-w-7xl px-5 py-8">
      <nav className="mb-5 flex items-center justify-between">
        <a href="/" className="text-[13px] text-faint hover:text-ink">
          ← 百模竞速 Model Arena
        </a>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMarkdown((v) => !v)}
            className="rounded-md border border-line bg-card px-2.5 py-1.5 text-[12px] text-faint hover:text-ink cursor-pointer"
          >
            {markdown ? "MD 渲染：开" : "MD 渲染：关"}
          </button>
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

      <div className={`grid gap-4 ${cols}`}>
        {endpoints.map((ep) => (
          <ModelCard
            key={ep.id}
            endpoint={ep}
            run={runs[ep.id] ?? emptyRun()}
            markdown={markdown}
            screenshotMode
            thinkingStats={snapshot.thinkingStats}
            nowTick={0}
            onRerun={() => {}}
            wordTarget={wordTarget}
          />
        ))}
      </div>

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
