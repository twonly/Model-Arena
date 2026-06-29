"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "@/components/I18nProvider";
import { Markdown } from "@/components/Markdown";
import {
  buildFixedReviewDraft,
  buildReviewDraftPrompt,
  reviewDraftSystemPrompt,
  reviewDraftGeneratorCandidates,
  reviewDraftRows,
  type ReviewDraftRow,
  type ReviewDraftStyle,
} from "@/lib/review-draft";
import { runEndpoint } from "@/lib/runner";
import { emptyRun, type ModelEndpoint, type RunState } from "@/lib/types";
import type { Verdict } from "@/lib/verdict";

const STYLE_LABELS: { value: ReviewDraftStyle; label: string; hint: string }[] = [
  {
    value: "article",
    label: "公众号 / 博客",
    hint: "结构完整，适合长文发布",
  },
  {
    value: "xiaohongshu",
    label: "小红书",
    hint: "短句分点，适合配图",
  },
  {
    value: "technical",
    label: "技术评测",
    hint: "强调指标、方法和局限",
  },
  {
    value: "brief",
    label: "简报",
    hint: "只要结论和关键数字",
  },
];

const STYLE_LABELS_EN: { value: ReviewDraftStyle; label: string; hint: string }[] = [
  {
    value: "article",
    label: "Blog / Article",
    hint: "Full structure for long-form publishing",
  },
  {
    value: "xiaohongshu",
    label: "Short Social Post",
    hint: "Short bullets, good for image-first posts",
  },
  {
    value: "technical",
    label: "Technical Review",
    hint: "Emphasizes metrics, method, and limits",
  },
  {
    value: "brief",
    label: "Brief",
    hint: "Only conclusions and key numbers",
  },
];

const isDraftRunning = (run: RunState) =>
  run.status === "connecting" || run.status === "thinking" || run.status === "streaming";

export function ReviewDraftDialog({
  open,
  onClose,
  onConfigure,
  endpoints,
  rows,
  title,
  notes,
  prompt,
  thinkingStats,
  shareUrl,
  verdict,
}: {
  open: boolean;
  onClose: () => void;
  onConfigure: () => void;
  endpoints: ModelEndpoint[];
  rows: ReviewDraftRow[];
  title: string;
  notes: string;
  prompt: string;
  thinkingStats: boolean;
  shareUrl?: string;
  verdict?: Verdict | null;
}) {
  const { locale } = useI18n();
  const en = locale === "en";
  const styleLabels = en ? STYLE_LABELS_EN : STYLE_LABELS;
  const [style, setStyle] = useState<ReviewDraftStyle>("article");
  const [selectedId, setSelectedId] = useState("");
  const [viewMode, setViewMode] = useState<"fixed" | "llm">("fixed");
  const [rawView, setRawView] = useState(false);
  const [draftRun, setDraftRun] = useState<RunState>(() => emptyRun());
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  const candidates = useMemo(
    () => reviewDraftGeneratorCandidates(endpoints),
    [endpoints]
  );
  const evidenceRows = useMemo(() => reviewDraftRows(rows), [rows]);
  const fixedDraft = useMemo(
    () =>
      buildFixedReviewDraft({
        title,
        notes,
        prompt,
        rows: evidenceRows,
        style,
        thinkingStats,
        shareUrl,
        locale,
        verdict,
      }),
    [title, notes, prompt, evidenceRows, style, thinkingStats, shareUrl, locale, verdict]
  );
  const selected = candidates.find((ep) => ep.id === selectedId) ?? candidates[0];
  const running = isDraftRunning(draftRun);
  const currentText =
    viewMode === "llm" && draftRun.text.trim()
      ? draftRun.text.trim()
      : fixedDraft.trim();

  useEffect(() => {
    if (!open) return;
    setError("");
    setCopied("");
    setViewMode("fixed");
    setSelectedId((prev) =>
      candidates.some((ep) => ep.id === prev) ? prev : candidates[0]?.id ?? ""
    );
  }, [open, candidates]);

  if (!open) return null;

  const close = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    onClose();
  };

  const polishWithModel = async () => {
    if (!selected) {
      setError(en ? "Add a generator model with an API Key in model settings first." : "请先在模型配置里添加一个带 API Key 的生成模型。");
      return;
    }
    if (!evidenceRows.length) {
      setError(en ? "No results can be written into a review draft yet. Run at least one model first." : "还没有可写入评测稿的结果，请先跑完至少一个模型。");
      return;
    }
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setDraftRun({ ...emptyRun(), startedAt: Date.now() });
    setError("");
    setCopied("");
    setViewMode("llm");

    await runEndpoint({
      endpoint: selected,
      prompt: buildReviewDraftPrompt({
        title,
        notes,
        prompt,
        rows: evidenceRows,
        style,
        thinkingStats,
        shareUrl,
        locale,
        verdict,
      }),
      params: {
        systemPrompt: reviewDraftSystemPrompt(locale),
        temperature: "0.4",
        maxTokens: "3200",
      },
      signal: ctrl.signal,
      update: (fn) => setDraftRun((prev) => fn(prev)),
      runId: crypto.randomUUID(),
      onSettled: () => {},
    });
  };

  const copyDraft = async () => {
    const text = currentText;
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopied(
      viewMode === "llm" && draftRun.text.trim()
        ? en
          ? "Polished draft copied"
          : "已复制润色稿"
        : en
          ? "Base draft copied"
          : "已复制基础稿"
    );
    setTimeout(() => setCopied(""), 1600);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-ink/30 p-4 pt-[5vh]"
      onClick={close}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-line bg-paper shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-3">
          <div>
            <div className="text-[15px] font-bold">
              {en ? "Generate Review Draft" : "生成评测稿"}
            </div>
            <div className="mt-0.5 text-[11.5px] text-faint">
              {en
                ? "Get a ready-to-publish draft from this run — winner, speed, and cost included. Want it to read more like an article? Polish it with one of your local-Key models."
                : "一键生成带结论的评测稿（含冠军、速度、成本，可直接发）；想更像文章时，再用你本地 Key 的模型润色。"}
            </div>
          </div>
          <button
            onClick={close}
            className="rounded-md border border-line px-2.5 py-1.5 text-[16px] leading-none text-faint hover:text-ink cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="grid min-h-0 flex-1 gap-0 md:grid-cols-[270px_1fr]">
          <aside className="border-b border-line p-4 md:border-r md:border-b-0">
            <label className="block">
              <div className="mb-1 text-[11px] font-semibold text-faint">
                {en ? "Optional polishing model" : "可选润色模型"}
              </div>
              <select
                className="w-full rounded-md border border-line bg-card px-2.5 py-2 text-[12.5px] outline-none focus:border-ink/40"
                value={selected?.id ?? ""}
                onChange={(e) => setSelectedId(e.target.value)}
                disabled={!candidates.length || running}
              >
                {candidates.map((ep) => (
                  <option key={ep.id} value={ep.id}>
                    {ep.name || ep.model}
                    {ep.enabled ? "" : en ? " (not in this comparison)" : "（未参与对比）"}
                  </option>
                ))}
              </select>
            </label>

            {!candidates.length && (
              <div className="mt-3 rounded-lg border border-dashed border-line bg-card px-3 py-3 text-[12px] leading-relaxed text-faint">
                {en
                  ? "The base draft can be copied directly. No local-Key model is available for summarizing and polishing. Shared sample models are hidden here to avoid consuming trial quota by mistake."
                  : "基础稿已可直接复制。当前没有可用于总结润色的自配 Key 模型，共享样例模型不会出现在这里，避免误消耗免费额度。"}
                <button
                  onClick={onConfigure}
                  className="mt-2 block rounded-md bg-ink px-3 py-1.5 text-[12px] font-semibold text-paper cursor-pointer"
                >
                  {en ? "Configure Models" : "去配置模型"}
                </button>
              </div>
            )}

            <div className="mt-4">
              <div className="mb-1 text-[11px] font-semibold text-faint">
                {en ? "Draft Style" : "稿件风格"}
              </div>
              <div className="grid gap-1.5">
                {styleLabels.map((item) => (
                  <button
                    key={item.value}
                    onClick={() => setStyle(item.value)}
                    disabled={running}
                    className={`rounded-md border px-3 py-2 text-left cursor-pointer ${
                      style === item.value
                        ? "border-ink bg-ink text-paper"
                        : "border-line bg-card text-ink hover:border-ink/40"
                    }`}
                  >
                    <div className="text-[12.5px] font-semibold">{item.label}</div>
                    <div
                      className={`mt-0.5 text-[10.5px] ${
                        style === item.value ? "text-paper/70" : "text-faint"
                      }`}
                    >
                      {item.hint}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-line bg-card px-3 py-2.5 text-[11.5px] leading-relaxed text-faint">
              <div className="font-semibold text-ink">
                {en ? "Evidence included" : "将写入证据"}
              </div>
              <div>{en ? "Model results" : "模型结果"}：{evidenceRows.length} {en ? "" : "个"}</div>
              <div>{en ? "Share link" : "分享链接"}：{shareUrl ? (en ? "included" : "已包含") : en ? "none" : "暂无"}</div>
              <div>{en ? "Token basis: official usage first; estimated when missing" : "token 口径：官方 usage 优先，缺失时标估算"}</div>
              <div>{en ? "Base draft: no model call needed" : "基础稿：无需调用模型"}</div>
            </div>

            {error && (
              <div className="mt-3 rounded-lg border border-accent/30 bg-accent/5 px-3 py-2 text-[12px] text-accent">
                {error}
              </div>
            )}
          </aside>

          <section className="flex min-h-0 flex-col">
            <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-3">
              <div className="mr-1 flex rounded-md border border-line bg-paper p-0.5">
                <button
                  onClick={() => setViewMode("fixed")}
                  className={`rounded-[5px] px-2.5 py-1.5 text-[12px] font-semibold cursor-pointer ${
                    viewMode === "fixed"
                      ? "bg-ink text-paper"
                      : "text-faint hover:text-ink"
                  }`}
                >
                  {en ? "Base Draft" : "基础稿"}
                </button>
                <button
                  onClick={() => setViewMode("llm")}
                  disabled={!draftRun.text.trim() && !running}
                  className={`rounded-[5px] px-2.5 py-1.5 text-[12px] font-semibold disabled:opacity-40 cursor-pointer ${
                    viewMode === "llm"
                      ? "bg-ink text-paper"
                      : "text-faint hover:text-ink"
                  }`}
                >
                  {en ? "Polished Draft" : "润色稿"}
                </button>
              </div>
              {running ? (
                <button
                  onClick={() => abortRef.current?.abort()}
                  className="rounded-md bg-accent px-4 py-2 text-[12.5px] font-bold text-white cursor-pointer"
                >
                  {en ? "Stop" : "停止生成"}
                </button>
              ) : (
                <button
                  onClick={() => void polishWithModel()}
                  disabled={!selected || !evidenceRows.length}
                  className="rounded-md bg-ink px-4 py-2 text-[12.5px] font-bold text-paper disabled:opacity-40 cursor-pointer"
                >
                  {en ? "Generate Summary" : "用模型生成总结"}
                </button>
              )}
              <button
                onClick={copyDraft}
                disabled={!currentText}
                className="rounded-md border border-line px-3 py-2 text-[12.5px] text-faint hover:text-ink disabled:opacity-40 cursor-pointer"
              >
                {en ? "Copy Current Draft" : "复制当前稿"}
              </button>
              <button
                onClick={() => setRawView((v) => !v)}
                title={en ? "Toggle rendered preview / raw Markdown" : "切换渲染预览 / Markdown 原文"}
                className="rounded-md border border-line px-3 py-2 text-[12.5px] text-faint hover:text-ink cursor-pointer"
              >
                {rawView ? (en ? "Preview" : "预览") : (en ? "Raw" : "原文")}
              </button>
              <span className="ml-auto text-[11.5px] text-faint">
                {copied || (viewMode === "fixed" ? (en ? "Base draft ready" : "基础稿已生成") : statusText(draftRun, locale))}
              </span>
            </div>

            <div className="thin-scroll min-h-[360px] flex-1 overflow-y-auto bg-card/40 p-4">
              {viewMode === "fixed" ? (
                rawView ? (
                  <pre className="whitespace-pre-wrap rounded-lg border border-line bg-paper px-4 py-3 text-[13px] leading-relaxed text-ink">
                    {fixedDraft}
                  </pre>
                ) : (
                  <div className="thin-scroll overflow-x-auto rounded-lg border border-line bg-paper px-4 py-3 text-[13px] leading-relaxed text-ink">
                    <Markdown text={fixedDraft} />
                  </div>
                )
              ) : draftRun.text || draftRun.reasoning ? (
                <div className="space-y-3">
                  {draftRun.reasoning && (
                    <details className="rounded-lg border border-line bg-paper px-3 py-2 text-[11.5px] text-faint">
                      <summary className="cursor-pointer select-none font-semibold text-ink">
                        {en ? "View generator reasoning excerpt" : "查看生成模型思考摘录"}
                      </summary>
                      <pre className="mt-2 whitespace-pre-wrap leading-relaxed">
                        {draftRun.reasoning}
                      </pre>
                    </details>
                  )}
                  {rawView || running ? (
                    <pre className="whitespace-pre-wrap rounded-lg border border-line bg-paper px-4 py-3 text-[13px] leading-relaxed text-ink">
                      {draftRun.text}
                    </pre>
                  ) : (
                    <div className="thin-scroll overflow-x-auto rounded-lg border border-line bg-paper px-4 py-3 text-[13px] leading-relaxed text-ink">
                      <Markdown text={draftRun.text} />
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex h-full min-h-[320px] items-center justify-center rounded-lg border border-dashed border-line bg-paper/60 px-8 text-center">
                  <div>
                    <div className="text-[14px] font-semibold text-ink">
                      {en ? "The base draft is available in the left tab" : "基础稿已在左侧标签生成"}
                    </div>
                    <div className="mt-1.5 max-w-md text-[12px] leading-relaxed text-faint">
                      {en
                        ? "Select a local-Key model to rewrite the base draft into a more publishable summary."
                        : "选择一个自配 Key 模型后，可把基础稿改写成更适合发布的总结稿。"}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function statusText(run: RunState, locale: "zh-CN" | "en"): string {
  const en = locale === "en";
  if (run.status === "connecting") return en ? "Connecting to generator..." : "连接生成模型…";
  if (run.status === "thinking") return en ? "Generator is thinking..." : "生成模型思考中…";
  if (run.status === "streaming") return en ? "Generating..." : "正在生成…";
  if (run.status === "done") return en ? "Generation complete" : "生成完成";
  if (run.status === "truncated") return en ? "Interrupted. Partial content kept." : "生成中断，已保留收到的内容";
  if (run.status === "stopped") return en ? "Stopped" : "已停止";
  if (run.status === "error") return run.error || (en ? "Generation failed" : "生成失败");
  return en ? "Ready" : "准备就绪";
}
