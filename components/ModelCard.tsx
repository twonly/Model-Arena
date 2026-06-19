"use client";

import { memo, useEffect, useMemo, useRef, useState } from "react";
import { ChartModal } from "./ChartModal";
import { Markdown } from "./Markdown";
import { Sparkline } from "./Sparkline";
import { useI18n } from "@/components/I18nProvider";
import {
  countChars,
  fmtInt,
  fmtSeconds,
  fmtTps,
  rankBadge,
} from "@/lib/format";
import { extractHtmlDoc, extractSvgs, svgDataUrl } from "@/lib/svg";
import { findPrice, estimateRunCost } from "@/lib/pricing";
import type { ModelEndpoint, RunState } from "@/lib/types";

export const STATUS_TEXT: Record<RunState["status"], string> = {
  idle: "待命",
  connecting: "连接中",
  thinking: "思考中",
  streaming: "输出中",
  done: "完成",
  error: "失败",
  stopped: "已停止",
  truncated: "中断",
};

const STATUS_TEXT_EN: Record<RunState["status"], string> = {
  idle: "Idle",
  connecting: "Connecting",
  thinking: "Thinking",
  streaming: "Streaming",
  done: "Done",
  error: "Failed",
  stopped: "Stopped",
  truncated: "Interrupted",
};

export const STATUS_COLOR: Record<RunState["status"], string> = {
  idle: "var(--faint)",
  connecting: "var(--faint)",
  thinking: "var(--think)",
  streaming: "var(--accent)",
  done: "var(--go)",
  error: "var(--accent)",
  stopped: "var(--faint)",
  truncated: "var(--think)",
};

/**
 * 流式期间限频取值（默认 400ms）：长文 Markdown 若每 80ms 重解析一次，
 * 多卡并发时会明显拖卡页面；结束后立即同步到最终值。
 */
function useThrottledWhileActive(value: string, active: boolean, ms = 400) {
  const [v, setV] = useState(value);
  const lastRef = useRef(0);
  useEffect(() => {
    if (!active) {
      setV(value);
      return;
    }
    const wait = Math.max(0, ms - (Date.now() - lastRef.current));
    const t = setTimeout(() => {
      lastRef.current = Date.now();
      setV(value);
    }, wait);
    return () => clearTimeout(t);
  }, [value, active, ms]);
  return v;
}

function Metric({
  value,
  unit,
  label,
  sub,
  highlight,
}: {
  value: string;
  unit?: string;
  label: string;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5 py-2.5">
      <div
        className="num text-[22px] leading-none font-bold"
        style={{ color: highlight ? "var(--accent)" : "var(--ink)" }}
      >
        {value}
        {unit && value !== "—" && (
          <span className="text-[11px] font-medium text-faint ml-0.5">
            {unit}
          </span>
        )}
      </div>
      <div className="text-[11px] text-faint">{label}</div>
      <div className="num text-[10px] text-faint/80 h-3.5">{sub ?? ""}</div>
    </div>
  );
}

/**
 * memo：流式期间每个模型每秒十几次状态更新，不 memo 会让所有卡片
 * 跟着每一次更新整体重渲染。memo 后只有自己的 run 变化才重渲染
 * （page 侧对未运行的卡片传 nowTick=0，避免计时器打穿 memo）。
 */
export const ModelCard = memo(function ModelCard({
  endpoint,
  run,
  markdown,
  screenshotMode,
  thinkingStats,
  nowTick,
  onRerun,
  expanded = false,
  onToggleFocus,
  wordTarget,
  compact = false,
  readOnly = false,
}: {
  endpoint: ModelEndpoint;
  run: RunState;
  markdown: boolean;
  screenshotMode: boolean;
  /** 关闭时不做思考/输出拆分：首Token 按首个正文 token 计，速度只按正文算 */
  thinkingStats: boolean;
  nowTick: number;
  onRerun: () => void;
  /** 放大查看模式：输出区更高，适合细读单模型 */
  expanded?: boolean;
  /** 打开/关闭单模型放大视图 */
  onToggleFocus?: () => void;
  /** Prompt 里检测到的「N 字」目标，用于显示字数达成率 */
  wordTarget?: number | null;
  /** 紧凑模式：隐藏输出区与预览，只看头部+指标（多模型纯竞速） */
  compact?: boolean;
  /** 只读（分享页）：隐藏「重跑」，但保留放大/紧凑 */
  readOnly?: boolean;
}) {
  const { locale } = useI18n();
  const en = locale === "en";
  const statusText = en ? STATUS_TEXT_EN : STATUS_TEXT;
  const outRef = useRef<HTMLDivElement>(null);
  const reasonRef = useRef<HTMLDivElement>(null);
  const stickBottom = useRef(true);
  const stickReasonBottom = useRef(true);
  const [showReasoning, setShowReasoning] = useState(true);
  const [showSvg, setShowSvg] = useState(true);
  const [showHtml, setShowHtml] = useState(true);
  const [htmlBig, setHtmlBig] = useState(false);
  const [chartOpen, setChartOpen] = useState(false);
  const previewRef = useRef<HTMLIFrameElement>(null);
  const previewWrapRef = useRef<HTMLDivElement>(null);
  // bump 这个 key 会强制 iframe 重挂载（重新加载 / 重跑动画）
  const [reloadKey, setReloadKey] = useState(0);
  // 离屏的跨源沙箱 iframe 会被浏览器暂停/限频渲染（rAF 几乎停转），
  // 表现为「不滚动到这里就一直空白、点一下才出现」。改成进入视口附近才挂载：
  // 加载即可见、不被限频，也避免多张卡同时抢 CDN。截图/分享态直接预挂载。
  const [previewSeen, setPreviewSeen] = useState(screenshotMode);

  // 预览高度偏好持久化：放大一次后后续运行保持放大，省去每次手动点
  // （用 effect 而非 useState 初值，避免 SSR/CSR 水合不一致）
  useEffect(() => {
    try {
      setHtmlBig(localStorage.getItem("tokrace:preview-big") === "1");
    } catch {}
  }, []);
  const togglePreviewBig = () =>
    setHtmlBig((v) => {
      const next = !v;
      try {
        localStorage.setItem("tokrace:preview-big", next ? "1" : "0");
      } catch {}
      return next;
    });
  // 真·全屏：把 iframe 元素本身请求进 Fullscreen，模型内部的 resize
  // 回调会按整屏分辨率重排（3D/Canvas 场景才能真正铺满看清）
  const openPreviewFullscreen = () => {
    previewRef.current?.requestFullscreen?.().catch(() => {});
  };

  // 模型输出中包含 <svg> 时自动提取预览（img 渲染，脚本不会执行）
  const svgs = useMemo(() => extractSvgs(run.text), [run.text]);

  // 完整 HTML / Canvas / 3D 片段：跑完后在沙箱 iframe 里可交互运行
  const finished =
    run.status === "done" ||
    run.status === "stopped" ||
    run.status === "truncated";
  const htmlDoc = useMemo(
    () => (finished ? extractHtmlDoc(run.text) : null),
    [run.text, finished]
  );

  // 预览进入视口附近（300px 提前量）才挂载 iframe，避免离屏被浏览器限频
  useEffect(() => {
    if (previewSeen || !htmlDoc) return;
    const el = previewWrapRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setPreviewSeen(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setPreviewSeen(true);
          io.disconnect();
        }
      },
      { rootMargin: "300px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [previewSeen, htmlDoc]);

  // 正文字数与「N 字」达成率（仅 Prompt 含字数要求时显示）
  const wordCount = useMemo(
    () => (wordTarget ? countChars(run.text) : 0),
    [run.text, wordTarget]
  );
  const wordPct = wordTarget ? Math.round((wordCount / wordTarget) * 100) : 0;

  const streamingMd =
    markdown &&
    (run.status === "connecting" ||
      run.status === "thinking" ||
      run.status === "streaming");
  // Markdown 渲染用限频文本；纯文本模式渲染很便宜，直接用实时值
  const mdText = useThrottledWhileActive(run.text, streamingMd);

  const running =
    run.status === "connecting" ||
    run.status === "thinking" ||
    run.status === "streaming";

  // 正文输出自动滚动（用户向上翻则停住）
  useEffect(() => {
    const el = outRef.current;
    if (el && running && stickBottom.current) {
      el.scrollTop = el.scrollHeight;
    }
  }, [run.text, running]);

  // 思考区独立自动滚动
  useEffect(() => {
    const el = reasonRef.current;
    if (el && running && stickReasonBottom.current) {
      el.scrollTop = el.scrollHeight;
    }
  }, [run.reasoning, running, showReasoning]);

  // 新一轮运行开始时恢复两个区域的粘底状态
  useEffect(() => {
    if (run.status === "connecting") {
      stickBottom.current = true;
      stickReasonBottom.current = true;
    }
  }, [run.status]);

  // 完成后自动折叠思考过程
  useEffect(() => {
    if (run.status === "done") setShowReasoning(false);
    if (run.status === "thinking") setShowReasoning(true);
  }, [run.status]);

  const m = run.metrics;
  // 仅运行中才用实时计时器；出错/结束无指标时显示「—」而非用 nowTick=0 算出巨大负数
  const elapsedMs =
    m?.totalMs ??
    (running && run.startedAt && nowTick > 0
      ? nowTick - run.startedAt
      : undefined);
  // 首Token 口径不随思考统计开关变化：始终 = 首个 token（思考开始即响应）
  const ttft = m?.ttftMs ?? run.liveTtftMs;
  const thinkingTps =
    m?.thinkingTps ?? (run.status === "thinking" ? run.liveTps : undefined);
  const contentTps =
    m?.contentTps ?? (run.status === "streaming" ? run.liveTps : undefined);
  const tokens = m?.outputTokens ?? (running ? run.liveTokens : undefined);
  const official = m?.official ?? false;
  const hasReasoning = run.reasoning.length > 0;

  // 单次成本估算：按 model 命中定价表 × token 数（输入暂全按未命中=成本上界）
  const cost = useMemo(() => {
    if (!m || m.outputTokens == null) return null;
    const price = findPrice(endpoint.model);
    if (!price) return null;
    return estimateRunCost(price, m.promptTokens ?? 0, m.outputTokens ?? 0);
  }, [m, endpoint.model]);
  const fmtCost = (n: number) =>
    n < 0.01 ? n.toPrecision(2) : n.toFixed(n < 1 ? 3 : 2);

  return (
    <div className="flex flex-col rounded-lg border border-line bg-card overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      {/* 卡片头 */}
      <div className="flex items-center gap-2 px-4 pt-3 pb-2">
        <span
          className={`inline-block w-2 h-2 rounded-full shrink-0 ${running ? "pulsing" : ""}`}
          style={{ background: STATUS_COLOR[run.status] }}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-1.5 min-w-0">
            <span className="font-bold text-[15px] truncate">
              {endpoint.name}
            </span>
            {run.rank != null && (
              <span className="text-[14px]">{rankBadge(run.rank)}</span>
            )}
          </div>
          <div className="num text-[10.5px] text-faint truncate">
            {endpoint.model}
          </div>
        </div>
        <span
          className="text-[11px] shrink-0"
          style={{ color: STATUS_COLOR[run.status] }}
        >
          {statusText[run.status]}
        </span>
        {!screenshotMode && !readOnly && !running && (
          <button
            onClick={onRerun}
            title={en ? "Rerun this model" : "重跑此模型"}
            className="text-[11px] text-faint hover:text-ink border border-line rounded px-1.5 py-0.5 shrink-0 cursor-pointer"
          >
            ↻ {en ? "Rerun" : "重跑"}
          </button>
        )}
        {!screenshotMode && onToggleFocus && (
          <button
            onClick={onToggleFocus}
            title={
              expanded
                ? en
                  ? "Exit expanded view (Esc)"
                  : "退出放大（Esc）"
                : en
                  ? "Expand this model. Other models keep running in the background."
                  : "放大查看此模型（其余模型后台继续跑）"
            }
            className="text-[11px] text-faint hover:text-ink border border-line rounded px-1.5 py-0.5 shrink-0 cursor-pointer"
          >
            {expanded ? `✕ ${en ? "Close" : "关闭"}` : "⛶"}
          </button>
        )}
      </div>

      {/* 思考过程 */}
      {hasReasoning && !compact && (
        <div className="mx-4 mb-2 rounded-md border border-line bg-paper/70">
          <button
            onClick={() => setShowReasoning((v) => !v)}
            className="w-full flex items-center justify-between px-3 py-1.5 text-[11px] cursor-pointer"
            style={{ color: "var(--think)" }}
          >
            <span>
              {showReasoning ? "▾" : "▸"} {en ? "Reasoning" : "思考过程"}
              {m?.thinkingMs != null && ` · ${fmtSeconds(m.thinkingMs)}s`}
              {thinkingStats &&
                m?.reasoningTokens != null &&
                ` · ${m.phaseSplitEstimated ? "≈" : ""}${fmtInt(m.reasoningTokens)} tok`}
            </span>
          </button>
          {showReasoning && (
            <div
              ref={reasonRef}
              onScroll={() => {
                const el = reasonRef.current;
                if (!el) return;
                stickReasonBottom.current =
                  el.scrollHeight - el.scrollTop - el.clientHeight < 60;
              }}
              className={`thin-scroll ${expanded ? "max-h-64" : "max-h-36"} overflow-y-auto px-3 pb-2 text-[12px] leading-relaxed text-faint whitespace-pre-wrap`}
            >
              {run.reasoning}
            </div>
          )}
        </div>
      )}

      {/* 中断提示：流被意外掐断（函数超时/连接断），结果可能不完整 */}
      {run.status === "truncated" && (
        <div
          className="mx-4 mb-2 rounded-md border px-3 py-1.5 text-[11.5px]"
          style={{ borderColor: "var(--think)", color: "var(--think)" }}
        >
          {en
            ? "⚠ Output was interrupted before a normal finish signal. The content below may be incomplete. Click Rerun to try again."
            : "⚠ 输出中断：未收到正常结束信号（多为生成耗时过长被服务端超时切断，或网络中断），下方内容可能不完整。点「重跑」重试。"}
        </div>
      )}

      {/* 输出区（紧凑模式隐藏，只在出错时显示一行错误） */}
      {compact ? (
        run.status === "error" && (
          <div className="mx-4 mb-2 rounded-md border border-accent/30 bg-accent/5 px-3 py-1.5 text-[11.5px] text-accent break-all">
            {run.error}
          </div>
        )
      ) : (
        <div
          ref={outRef}
          onScroll={() => {
            const el = outRef.current;
            if (!el) return;
            stickBottom.current =
              el.scrollHeight - el.scrollTop - el.clientHeight < 80;
          }}
          className={`thin-scroll flex-1 overflow-y-auto px-4 pb-3 text-[13.5px] ${
            expanded
              ? "min-h-[300px] max-h-[58vh] text-[14px]"
              : "min-h-[160px] max-h-[340px]"
          }`}
        >
          {run.status === "error" ? (
            <div className="mt-1 rounded-md border border-accent/30 bg-accent/5 px-3 py-2 text-[12.5px] text-accent break-all">
              {run.error}
            </div>
          ) : run.text ? (
            markdown ? (
              <Markdown text={running ? mdText : run.text} />
            ) : (
              <div className={`whitespace-pre-wrap leading-7 ${running ? "caret" : ""}`}>
                {run.text}
              </div>
            )
          ) : (
            <div className="mt-1 text-[12.5px] text-faint/70">
              {run.status === "idle"
                ? en
                  ? "Waiting to start"
                  : "等待开始"
                : run.status === "connecting"
                  ? en
                    ? "Connecting..."
                    : "正在建立连接…"
                  : run.status === "thinking"
                    ? en
                      ? "Model is thinking..."
                      : "模型思考中…"
                    : ""}
            </div>
          )}
        </div>
      )}

      {/* SVG 预览：模型画图场景（如「鹈鹕骑自行车」）自动渲染 */}
      {!compact && svgs.length > 0 && (
        <div className="mx-4 mb-3 rounded-md border border-line overflow-hidden">
          <button
            onClick={() => setShowSvg((v) => !v)}
            className="w-full flex items-center justify-between bg-paper/70 px-3 py-1.5 text-[11px] text-faint cursor-pointer"
          >
            <span>
              {showSvg ? "▾" : "▸"} 🖼 {en ? "SVG Preview" : "SVG 预览"}（{svgs.length}）
            </span>
            <span>{en ? "Rendered as sandboxed img · scripts do not run" : "img 沙箱渲染 · 脚本不执行"}</span>
          </button>
          {showSvg && (
            <div className="flex flex-wrap items-center justify-center gap-3 bg-white p-3">
              {svgs.map((s, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={svgDataUrl(s)}
                  alt={en ? `SVG from model output ${i + 1}` : `模型输出的 SVG ${i + 1}`}
                  className="max-h-60 max-w-full rounded border border-line/60"
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* HTML/Canvas/3D 沙箱预览：单文件网页/游戏类输出可直接交互运行 */}
      {htmlDoc && !compact && (
        <div
          ref={previewWrapRef}
          className="mx-4 mb-3 rounded-md border border-line overflow-hidden"
        >
          <div className="flex items-center justify-between bg-paper/70 px-3 py-1.5 text-[11px] text-faint">
            <button
              onClick={() => setShowHtml((v) => !v)}
              className="cursor-pointer"
            >
              {showHtml ? "▾" : "▸"} 🕹 {en ? "HTML / Canvas / 3D Preview (sandboxed)" : "HTML / Canvas / 3D 预览（沙箱运行）"}
            </button>
            {showHtml && previewSeen && (
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => {
                    setPreviewSeen(true);
                    setReloadKey((k) => k + 1);
                  }}
                  title={en ? "Reload / restart the preview" : "重新加载预览（CDN 慢或没出来时点这里）"}
                  className="cursor-pointer hover:text-ink"
                >
                  {en ? "↻ Reload" : "↻ 重新加载"}
                </button>
                <button
                  onClick={togglePreviewBig}
                  className="cursor-pointer hover:text-ink"
                >
                  {htmlBig ? (en ? "⊼ Shrink" : "⊼ 收小") : en ? "⛶ Taller" : "⛶ 加高"}
                </button>
                <button
                  onClick={openPreviewFullscreen}
                  title={en ? "Open in real fullscreen (Esc to exit)" : "真·全屏查看（Esc 退出）"}
                  className="cursor-pointer hover:text-ink"
                >
                  {en ? "⤢ Fullscreen" : "⤢ 全屏"}
                </button>
              </div>
            )}
          </div>
          {showHtml &&
            (previewSeen ? (
              <iframe
                key={reloadKey}
                ref={previewRef}
                sandbox="allow-scripts"
                allow="fullscreen"
                srcDoc={htmlDoc}
                title={en ? `${endpoint.name} HTML preview` : `${endpoint.name} HTML 预览`}
                className={`w-full border-0 bg-white ${
                  htmlBig ? "h-[78vh]" : expanded ? "h-[58vh]" : "h-80"
                }`}
              />
            ) : (
              <button
                onClick={() => setPreviewSeen(true)}
                className="flex h-80 w-full items-center justify-center gap-2 bg-white/95 text-[12.5px] text-faint hover:text-ink cursor-pointer"
              >
                ▶ {en ? "Click to load the interactive preview" : "点击加载交互预览（滚动到此也会自动加载）"}
              </button>
            ))}
        </div>
      )}

      {/* 指标栏 */}
      <div className="border-t border-line bg-paper/50">
        <div
          className={`grid ${thinkingStats ? "grid-cols-4" : "grid-cols-3"} divide-x divide-line`}
        >
          <Metric
            value={ttft != null ? fmtSeconds(ttft) : running ? "…" : "—"}
            unit="s"
            label={en ? "TTFT" : "首Token"}
            highlight={run.status === "connecting"}
          />
          {thinkingStats && (
            <Metric
              value={fmtTps(thinkingTps)}
              label={en ? "Reasoning TPS" : "思考TPS"}
              sub={
                m?.thinkingMs != null
                  ? `${fmtSeconds(m.thinkingMs)}s · ${m.phaseSplitEstimated ? "≈" : ""}${fmtInt(m.reasoningTokens)} tok`
                  : run.status === "thinking"
                    ? en
                      ? "Thinking..."
                      : "思考中…"
                    : undefined
              }
              highlight={run.status === "thinking"}
            />
          )}
          <Metric
            value={fmtTps(contentTps)}
            label={en ? "Output TPS" : "输出TPS"}
            sub={
              m?.contentTokens != null && m.contentTokens > 0
                ? `${m.contentMs != null ? `${fmtSeconds(m.contentMs)}s · ` : ""}${m.phaseSplitEstimated ? "≈" : ""}${fmtInt(m.contentTokens)} tok`
                : undefined
            }
            highlight={run.status === "streaming"}
          />
          <Metric
            value={tokens != null ? fmtInt(tokens) : "—"}
            label={`${en ? "Total Tokens" : "总Tokens"}${m ? (official ? (en ? " (official)" : "（官方）") : en ? " (estimated)" : "（估算）") : ""}`}
            sub={
              m?.promptTokens != null
                ? `${en ? "Input" : "输入"} ${fmtInt(m.promptTokens)}`
                : undefined
            }
          />
        </div>
        <div className="flex items-center justify-between border-t border-line px-4 py-1.5">
          <div className="num text-[11px] text-faint">
            {elapsedMs != null && (
              <>
                {en ? "Elapsed" : "总用时"}{" "}
                <span className="text-ink font-semibold">
                  {fmtSeconds(elapsedMs)}s
                </span>
              </>
            )}
            {thinkingStats && m?.avgTps != null && (
              <>
                {" "}
                · {en ? "Average" : "平均"}{" "}
                <span className="text-ink font-semibold">
                  {fmtTps(m.avgTps)}
                </span>{" "}
                tok/s
              </>
            )}
            {m?.peakTps != null && m.peakTps > 0 && (
              <>
                {" "}
                · {en ? "Peak" : "峰值"}{" "}
                <span
                  className="font-semibold"
                  style={{ color: "var(--accent)" }}
                >
                  {fmtTps(m.peakTps)}
                </span>{" "}
                tok/s
              </>
            )}
            {running && run.liveTps > 0 && (
              <>
                {" "}
                · {en ? "Live" : "实时"}{" "}
                <span className="font-semibold" style={{ color: "var(--accent)" }}>
                  {fmtTps(run.liveTps)}
                </span>{" "}
                tok/s
              </>
            )}
            {cost && (
              <>
                {" "}
                · {en ? "Cost" : "成本"}{" "}
                <span
                  className="font-semibold"
                  style={{ color: "var(--accent)" }}
                  title={
                    (en
                      ? `Input ${cost.price.currency === "CNY" ? "¥" : "$"}${cost.price.inputMiss}/1M · Output ${cost.price.currency === "CNY" ? "¥" : "$"}${cost.price.output}/1M · ${cost.price.model}`
                      : `输入 ${cost.price.currency === "CNY" ? "¥" : "$"}${cost.price.inputMiss}/1M · 输出 ${cost.price.currency === "CNY" ? "¥" : "$"}${cost.price.output}/1M · ${cost.price.model}`) +
                    (cost.price.currency === "CNY" ? ` ≈ $${fmtCost(cost.totalUsd)}` : "") +
                    (cost.price.needsConfirm ? (en ? " (price unverified)" : "（价格待核实）") : "")
                  }
                >
                  ≈{cost.price.currency === "CNY" ? "¥" : "$"}
                  {fmtCost(cost.totalNative)}
                </span>
              </>
            )}
          </div>
          <button
            onClick={() => run.samples.length > 1 && setChartOpen(true)}
            title={en ? "Click to expand the speed curve" : "点击放大查看速度曲线"}
            className={run.samples.length > 1 ? "cursor-zoom-in" : "cursor-default"}
          >
            <Sparkline samples={run.samples} />
          </button>
        </div>
        {/* 字数达成率：Prompt 含「N 字」要求时显示，揭穿字数谎报 */}
        {wordTarget && (run.text || finished) && (
          <div className="flex items-center gap-2 border-t border-line px-4 py-1.5">
            <span className="num text-[11px] text-faint">
              {en ? "Chars" : "字数"}{" "}
              <span className="text-ink font-semibold">
                {fmtInt(wordCount)}
              </span>{" "}
              / {fmtInt(wordTarget)}
            </span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-paper">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(wordPct, 100)}%`,
                  background:
                    wordPct >= 90
                      ? "var(--go)"
                      : wordPct >= 60
                        ? "var(--think)"
                        : "var(--accent)",
                }}
              />
            </div>
            <span
              className="num text-[11px] font-semibold shrink-0"
              style={{
                color:
                  wordPct >= 90
                    ? "var(--go)"
                    : wordPct >= 60
                      ? "var(--think)"
                      : "var(--accent)",
              }}
            >
              {wordPct}%
            </span>
          </div>
        )}
      </div>

      <ChartModal
        open={chartOpen}
        onClose={() => setChartOpen(false)}
        title={endpoint.name}
        subtitle={endpoint.model}
        samples={run.samples}
        avgTps={m?.avgTps}
      />
    </div>
  );
},
// 函数 props（onRerun/onToggleFocus）不参与比较：它们每次父渲染都是新引用，
// 但内部通过 refs 读取最新状态，旧闭包无害
(prev, next) =>
  prev.endpoint === next.endpoint &&
  prev.run === next.run &&
  prev.markdown === next.markdown &&
  prev.screenshotMode === next.screenshotMode &&
  prev.thinkingStats === next.thinkingStats &&
  prev.nowTick === next.nowTick &&
  prev.expanded === next.expanded &&
  prev.wordTarget === next.wordTarget &&
  prev.compact === next.compact &&
  prev.readOnly === next.readOnly
);
