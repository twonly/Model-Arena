"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  REVIEW_DRAFT_SYSTEM_PROMPT,
  buildReviewDraftPrompt,
  reviewDraftGeneratorCandidates,
  reviewDraftRows,
  type ReviewDraftRow,
  type ReviewDraftStyle,
} from "@/lib/review-draft";
import { runEndpoint } from "@/lib/runner";
import { emptyRun, type ModelEndpoint, type RunState } from "@/lib/types";

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
}) {
  const [style, setStyle] = useState<ReviewDraftStyle>("article");
  const [selectedId, setSelectedId] = useState("");
  const [draftRun, setDraftRun] = useState<RunState>(() => emptyRun());
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  const candidates = useMemo(
    () => reviewDraftGeneratorCandidates(endpoints),
    [endpoints]
  );
  const evidenceRows = useMemo(() => reviewDraftRows(rows), [rows]);
  const selected = candidates.find((ep) => ep.id === selectedId) ?? candidates[0];
  const running = isDraftRunning(draftRun);

  useEffect(() => {
    if (!open) return;
    setError("");
    setCopied("");
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

  const generate = async () => {
    if (!selected) {
      setError("请先在模型配置里添加一个带 API Key 的生成模型。");
      return;
    }
    if (!evidenceRows.length) {
      setError("还没有可写入评测稿的结果，请先跑完至少一个模型。");
      return;
    }
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setDraftRun({ ...emptyRun(), startedAt: Date.now() });
    setError("");
    setCopied("");

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
      }),
      params: {
        systemPrompt: REVIEW_DRAFT_SYSTEM_PROMPT,
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
    const text = draftRun.text.trim();
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopied("已复制评测稿");
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
            <div className="text-[15px] font-bold">生成评测稿</div>
            <div className="mt-0.5 text-[11.5px] text-faint">
              使用你本地已配置 Key 的模型生成，不消耗免费样例额度；输入包含本次指标、Prompt 与输出摘录。
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
                生成模型
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
                    {ep.enabled ? "" : "（未参与对比）"}
                  </option>
                ))}
              </select>
            </label>

            {!candidates.length && (
              <div className="mt-3 rounded-lg border border-dashed border-line bg-card px-3 py-3 text-[12px] leading-relaxed text-faint">
                当前没有可用于写稿的自配 Key 模型。共享样例模型不会出现在这里，避免误消耗免费额度。
                <button
                  onClick={onConfigure}
                  className="mt-2 block rounded-md bg-ink px-3 py-1.5 text-[12px] font-semibold text-paper cursor-pointer"
                >
                  去配置模型
                </button>
              </div>
            )}

            <div className="mt-4">
              <div className="mb-1 text-[11px] font-semibold text-faint">
                稿件风格
              </div>
              <div className="grid gap-1.5">
                {STYLE_LABELS.map((item) => (
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
              <div className="font-semibold text-ink">将写入证据</div>
              <div>模型结果：{evidenceRows.length} 个</div>
              <div>分享链接：{shareUrl ? "已包含" : "暂无"}</div>
              <div>token 口径：官方 usage 优先，缺失时标估算</div>
            </div>

            {error && (
              <div className="mt-3 rounded-lg border border-accent/30 bg-accent/5 px-3 py-2 text-[12px] text-accent">
                {error}
              </div>
            )}
          </aside>

          <section className="flex min-h-0 flex-col">
            <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-3">
              {running ? (
                <button
                  onClick={() => abortRef.current?.abort()}
                  className="rounded-md bg-accent px-4 py-2 text-[12.5px] font-bold text-white cursor-pointer"
                >
                  停止生成
                </button>
              ) : (
                <button
                  onClick={() => void generate()}
                  disabled={!selected || !evidenceRows.length}
                  className="rounded-md bg-ink px-4 py-2 text-[12.5px] font-bold text-paper disabled:opacity-40 cursor-pointer"
                >
                  生成评测稿
                </button>
              )}
              <button
                onClick={copyDraft}
                disabled={!draftRun.text.trim()}
                className="rounded-md border border-line px-3 py-2 text-[12.5px] text-faint hover:text-ink disabled:opacity-40 cursor-pointer"
              >
                复制全文
              </button>
              <span className="ml-auto text-[11.5px] text-faint">
                {copied || statusText(draftRun)}
              </span>
            </div>

            <div className="thin-scroll min-h-[360px] flex-1 overflow-y-auto bg-card/40 p-4">
              {draftRun.text || draftRun.reasoning ? (
                <div className="space-y-3">
                  {draftRun.reasoning && (
                    <details className="rounded-lg border border-line bg-paper px-3 py-2 text-[11.5px] text-faint">
                      <summary className="cursor-pointer select-none font-semibold text-ink">
                        查看生成模型思考摘录
                      </summary>
                      <pre className="mt-2 whitespace-pre-wrap leading-relaxed">
                        {draftRun.reasoning}
                      </pre>
                    </details>
                  )}
                  <pre className="whitespace-pre-wrap rounded-lg border border-line bg-paper px-4 py-3 text-[13px] leading-relaxed text-ink">
                    {draftRun.text}
                  </pre>
                </div>
              ) : (
                <div className="flex h-full min-h-[320px] items-center justify-center rounded-lg border border-dashed border-line bg-paper/60 px-8 text-center">
                  <div>
                    <div className="text-[14px] font-semibold text-ink">
                      跑完对比后，一键生成可发布草稿
                    </div>
                    <div className="mt-1.5 max-w-md text-[12px] leading-relaxed text-faint">
                      草稿会基于本次速度、token、输出内容和 Prompt 生成；适合再人工补充观点后发布。
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

function statusText(run: RunState): string {
  if (run.status === "connecting") return "连接生成模型…";
  if (run.status === "thinking") return "生成模型思考中…";
  if (run.status === "streaming") return "正在生成…";
  if (run.status === "done") return "生成完成";
  if (run.status === "truncated") return "生成中断，已保留收到的内容";
  if (run.status === "stopped") return "已停止";
  if (run.status === "error") return run.error || "生成失败";
  return "准备就绪";
}
