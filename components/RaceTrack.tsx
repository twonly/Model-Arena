"use client";

import { useLayoutEffect, useRef } from "react";
import { ProviderIcon } from "./ProviderIcon";
import type { Locale } from "@/lib/i18n";
import { fmtInt, fmtSeconds, fmtTps } from "@/lib/format";
import {
  fastestTtftId,
  raceProgressPct,
  reasoningSharePct,
  speedBarPct,
  SPEED_BAR_REF,
  SPEED_BAR_FULL,
  TTFT_BAR_FULL_MS,
  TTFT_BAR_REF_MS,
  TTFT_REF_PCT,
  ttftBarPct,
} from "@/lib/race-track";

export interface Runner {
  id: string;
  name: string;
  model?: string;
  baseUrl?: string;
  /** 已生成 token，总量（含思考+输出；实时 liveTokens 或最终 outputTokens） */
  tokens: number;
  /** 其中思考 token（0=非思考模型）；辅助数量条的拆分用 */
  reasoningTokens: number;
  /** 与模型卡片一致的实时/最终正文输出速度 token/s */
  tps: number;
  /** 首个 token（含思考）的已结算时延 */
  ttftMs?: number;
  /** 尚未收到首 token 时的实时或已定格等待时长 */
  waitMs?: number;
  /** 首个正文 token 时延，仅用于思考模型的悬浮说明 */
  firstContentMs?: number;
  done: boolean;
  running: boolean;
  failed?: boolean;
}

/** 速度决定主条和排序；token 数量与首响等待仅作辅助。 */
export function RaceTrack({ runners, locale }: { runners: Runner[]; locale: Locale }) {
  const isZh = locale === "zh-CN";
  // 名次变化的 FLIP 动画：记下每行上一帧的 offsetTop，重排后把行瞬移回原位再过渡回 0
  const listRef = useRef<HTMLDivElement>(null);
  const prevTops = useRef<Map<string, number>>(new Map());
  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    list.querySelectorAll<HTMLElement>("[data-runner-id]").forEach((el) => {
      const id = el.dataset.runnerId;
      if (!id) return;
      const top = el.offsetTop;
      const prev = prevTops.current.get(id);
      prevTops.current.set(id, top);
      if (reduce || prev == null || prev === top) return;
      el.style.transition = "none";
      el.style.transform = `translateY(${prev - top}px)`;
      void el.offsetHeight; // 强制 reflow，提交起始位移
      el.style.transition = "transform 0.45s cubic-bezier(0.22,1,0.36,1)";
      el.style.transform = "";
    });
  });
  if (runners.length < 2) return null;
  const max = Math.max(1, ...runners.map((r) => r.tokens));
  const ordered = [...runners].sort((a, b) => b.tps - a.tps);
  const fastestId = ordered[0]?.tps > 0 ? ordered[0].id : null;
  // 常规范围保留绝对刻度；超出时扩展，避免高速模型全部顶格。
  const speedFull = Math.max(SPEED_BAR_FULL, Math.ceil(ordered[0].tps / 100) * 100);
  const tooltipClass = "pointer-events-none absolute bottom-full left-0 z-20 mb-1 hidden w-max max-w-[min(18rem,50vw)] whitespace-normal rounded-md bg-ink px-2 py-1 text-[11px] text-paper shadow-md group-hover/axis:block group-focus/axis:block";
  const fastestResponseId = fastestTtftId(ordered);

  return (
    <div className="rounded-xl border border-line bg-card px-3.5 py-3">
      <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
        <span className="text-[12px] font-semibold">🏁 {isZh ? "实时竞速" : "Live race"}</span>
        <span className="flex flex-wrap items-center justify-end gap-2.5 text-[10.5px] text-faint">
          <span className="flex items-center gap-1">
            <span className="inline-block h-2.5 w-4 rounded-full bg-go" aria-hidden="true" />
            {isZh ? "输出速度 token/s · 快的在前" : "Output token/s · fastest first"}
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-flex h-1 w-4 overflow-hidden rounded-full" aria-hidden="true">
              <span className="h-full w-1/2 bg-think" />
              <span className="h-full w-1/2 bg-ink/50" />
            </span>
            {isZh ? "思考 / 正文量 · token" : "Reasoning / content · tokens"}
          </span>
          <span
            className="flex items-center gap-1"
            title={
              isZh
                ? `${TTFT_BAR_REF_MS / 1000}s 参考线 · ${TTFT_BAR_FULL_MS / 1000}s 满格`
                : `${TTFT_BAR_REF_MS / 1000}s reference · ${TTFT_BAR_FULL_MS / 1000}s full scale`
            }
          >
            <span className="inline-block h-1.5 w-4 rounded-full bg-think" aria-hidden="true" />
            {isZh ? "首响等待 · 短更好" : "TTFT wait · shorter is better"}
          </span>
        </span>
      </div>
      <p className="mb-2 text-[10.5px] text-faint">
        {isZh
          ? "进行中显示实时估算，结束后与卡片「输出TPS」一致；不代表平均速度、峰值或回答质量。"
          : "Live estimates while streaming; final values match Output TPS, not average speed, peak speed or answer quality."}
      </p>
      <div className="mb-1 grid grid-cols-[6.5rem_minmax(0,1fr)_5.75rem] gap-2.5 text-[10px] text-faint sm:grid-cols-[9rem_minmax(0,1fr)_6.75rem]">
        <span />
        <div className="flex justify-between"><span>0</span><span>{speedFull} token/s</span></div>
      </div>
      <div ref={listRef} className="relative flex flex-col gap-2.5">
        {ordered.map((r) => {
          const pct = raceProgressPct(r.tokens, max);
          const isFastest = r.id === fastestId;
          const isFastestResponse = r.id === fastestResponseId;
          const waitingForFirst = r.running && r.ttftMs == null;
          const reasonShare = reasoningSharePct(r.reasoningTokens, r.tokens);
          const spd = speedBarPct(r.tps, speedFull);
          const speedTitle = `${isZh ? (r.running ? "实时输出速度（估算）" : "输出速度（正文阶段）") : (r.running ? "Live output speed (estimated)" : "Output speed (content phase)")}: ${fmtTps(r.tps)} token/s · ${isZh ? "参考线" : "Reference"} ${SPEED_BAR_REF} token/s`;
          const tokenTitle = `${isZh ? "总量" : "Total"}: ${fmtInt(r.tokens)} token · ${isZh ? "思考" : "Reasoning"}: ${fmtInt(r.reasoningTokens)} token · ${isZh ? "正文" : "Content"}: ${fmtInt(Math.max(0, r.tokens - r.reasoningTokens))} token`;
          const ttftDurationMs = r.ttftMs ?? r.waitMs;
          const ttftPct = ttftBarPct(ttftDurationMs);
          const ttftTitle =
            r.ttftMs != null
              ? `${isFastestResponse ? (isZh ? "首响最快 · " : "Fastest TTFT · ") : ""}${
                  isZh ? "首响应" : "TTFT"
                } ${fmtSeconds(r.ttftMs)}s${
                  r.firstContentMs != null && r.firstContentMs > r.ttftMs
                    ? ` · ${isZh ? "首正文" : "first content"} ${fmtSeconds(r.firstContentMs)}s`
                    : ""
                }`
              : waitingForFirst
                ? `${isZh ? "等待首响" : "Waiting for first token"} ${fmtSeconds(r.waitMs)}s`
                : r.waitMs != null
                  ? `${isZh ? "未收到首 token · 已等待" : "No first token · waited"} ${fmtSeconds(r.waitMs)}s`
                  : isZh ? "尚无首响数据" : "No TTFT data";
          const ttftTooltip = `${ttftTitle} · ${isZh ? "参考线" : "Reference"} ${TTFT_BAR_REF_MS / 1000}s · ${isZh ? "满格" : "Full scale"} ${TTFT_BAR_FULL_MS / 1000}s`;
          return (
            <div
              key={r.id}
              data-runner-id={r.id}
              className="grid grid-cols-[6.5rem_minmax(0,1fr)_5.75rem] items-center gap-2.5 sm:grid-cols-[9rem_minmax(0,1fr)_6.75rem]"
            >
              <div className="flex min-w-0 items-center gap-1.5 text-[12px] font-medium" title={r.name}>
                <ProviderIcon model={r.model} name={r.name} baseUrl={r.baseUrl} size="sm" />
                <span className="truncate">{r.name}</span>
              </div>
              {/* 主条为输出速度，细条分别为 token 数量和首响等待。 */}
              <div className="flex min-w-0 flex-col gap-1">
                <div className="group/axis relative" tabIndex={0} role="img" aria-label={speedTitle} data-race-axis="speed">
                  <span role="tooltip" className={tooltipClass}>{speedTitle}</span>
                  <div className="relative h-5 overflow-hidden rounded-full bg-paper">
                    <div
                      className={`absolute inset-y-0 left-0 rounded-full transition-[width] duration-300 ease-out ${r.running ? "speed-live" : ""}`}
                      style={{ width: `${spd}%`, background: "var(--go)", opacity: isFastest ? 0.95 : 0.65 }}
                    />
                    <div
                      className="absolute inset-y-0 border-l-2 border-dashed border-faint/60"
                      style={{ left: `${speedBarPct(SPEED_BAR_REF, speedFull)}%` }}
                      aria-hidden="true"
                    />
                    <div
                      className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 text-[12px] transition-[left] duration-300 ease-out"
                      style={{ left: `clamp(8px, ${spd}%, calc(100% - 8px))` }}
                      aria-hidden="true"
                    >
                      {r.done ? "🏁" : waitingForFirst ? "⏳" : r.running ? <span className="race-launch">🏎️</span> : "•"}
                    </div>
                  </div>
                </div>
                <div className="group/axis relative" tabIndex={0} role="img" aria-label={tokenTitle} data-race-axis="tokens">
                  <span role="tooltip" className={tooltipClass}>{tokenTitle}</span>
                  <div className="relative h-1.5 overflow-hidden rounded-full bg-paper">
                    <div className="absolute inset-y-0 left-0 overflow-hidden rounded-full transition-[width] duration-300 ease-out" style={{ width: `${pct}%` }}>
                      <div className="absolute inset-y-0 left-0 bg-think" style={{ width: `${reasonShare}%` }} />
                      <div className="absolute inset-y-0 right-0 bg-ink/40" style={{ left: `${reasonShare}%` }} />
                    </div>
                  </div>
                </div>
                <div className="group/axis relative" tabIndex={0} role="img" aria-label={ttftTooltip} data-race-axis="ttft">
                  <span role="tooltip" className={tooltipClass}>{ttftTooltip}</span>
                  <div
                    className="relative h-1.5 overflow-hidden rounded-full bg-paper"
                    data-ttft-bar-id={r.id}
                    data-ttft-bar-pct={ttftPct.toFixed(1)}
                  >
                    <div
                      className="absolute inset-y-0 z-10 border-l border-dashed border-faint/70"
                      style={{ left: `${TTFT_REF_PCT}%` }}
                      aria-hidden="true"
                    />
                    <div
                      className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-100 ease-linear"
                      style={{
                        width: `${ttftPct}%`,
                        minWidth: ttftPct > 0 ? "2px" : undefined,
                        background: r.failed
                          ? "var(--accent)"
                          : isFastestResponse
                            ? "var(--go)"
                            : "var(--think)",
                        opacity: waitingForFirst ? 0.8 : 0.9,
                      }}
                      aria-hidden="true"
                    />
                  </div>
                </div>
              </div>
              {/* 数值主次与条形一致。 */}
              <div className="num shrink-0 text-right leading-tight tabular-nums">
                <div
                  className="text-[12px] font-semibold"
                  style={{ color: isFastest ? "var(--go)" : "var(--ink)" }}
                >
                  {r.tps > 0 ? (
                    <>
                      {isFastest && "⚡"}
                      {fmtTps(r.tps)} <span className="text-[10px] font-normal text-faint">token/s</span>
                    </>
                  ) : (
                    <span className="text-faint">—</span>
                  )}
                </div>
                <div className="text-[10px] text-faint">{fmtInt(r.tokens)} token</div>
                <div
                  data-ttft-id={r.id}
                  data-ttft-state={
                    waitingForFirst ? "waiting" : r.ttftMs != null ? "ready" : r.failed ? "failed" : "idle"
                  }
                  className={`mt-0.5 text-[10px] ${waitingForFirst ? "ttft-waiting" : ""}`}
                  style={{
                    color: waitingForFirst
                      ? "var(--accent)"
                      : isFastestResponse
                        ? "var(--go)"
                        : "var(--faint)",
                  }}
                  title={ttftTitle}
                  aria-label={ttftTitle}
                >
                  {waitingForFirst ? (
                    <>⏱ {fmtSeconds(r.waitMs)}s…</>
                  ) : r.ttftMs != null ? (
                    <>
                      {isFastestResponse ? "🚦" : isZh ? "首响 " : "TTFT "}
                      {fmtSeconds(r.ttftMs)}s
                    </>
                  ) : r.failed ? (
                    isZh ? "首响失败" : "TTFT failed"
                  ) : (
                    isZh ? "首响 —" : "TTFT —"
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
