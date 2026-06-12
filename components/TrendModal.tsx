"use client";

import { useMemo, useState } from "react";
import { fmtSeconds, fmtTps } from "@/lib/format";
import type { HistoryEntry } from "@/lib/types";

const W = 760;
const H = 320;
const PAD = { l: 56, r: 20, t: 18, b: 40 };
const PLOT_W = W - PAD.l - PAD.r;
const PLOT_H = H - PAD.t - PAD.b;

interface TrendPoint {
  at: number;
  tps: number; // 输出TPS（缺失则用平均）
  ttftMs?: number;
  title: string;
}

/** 同一模型在历次对比中的速度走势——盯一家厂商是否高峰变慢/版本变快 */
export function TrendModal({
  open,
  onClose,
  entries,
}: {
  open: boolean;
  onClose: () => void;
  entries: HistoryEntry[];
}) {
  const series = useMemo(() => {
    const map = new Map<string, TrendPoint[]>();
    for (const h of entries) {
      for (const r of h.results) {
        const tps = r.metrics?.contentTps ?? r.metrics?.avgTps;
        if (tps == null) continue;
        const key = `${r.name} · ${r.model}`;
        const arr = map.get(key) ?? [];
        arr.push({ at: h.at, tps, ttftMs: r.metrics?.ttftMs, title: h.title });
        map.set(key, arr);
      }
    }
    return [...map.entries()]
      .map(([key, pts]) => ({ key, pts: pts.sort((a, b) => a.at - b.at) }))
      .sort((a, b) => b.pts.length - a.pts.length);
  }, [entries]);

  const [selected, setSelected] = useState<string | null>(null);
  const [hover, setHover] = useState<number | null>(null);

  if (!open) return null;

  const active =
    series.find((s) => s.key === selected) ?? series[0] ?? null;

  const overlay = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[820px] rounded-xl border border-line bg-card shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <div>
            <div className="font-bold text-[15px]">📊 历史速度趋势</div>
            <div className="text-[11px] text-faint">
              同一模型在历次对比中的输出 TPS 走势（数据来自本机历史记录）
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-faint hover:text-ink text-[18px] leading-none cursor-pointer px-1"
          >
            ✕
          </button>
        </div>

        {!active || active.pts.length < 2 ? (
          <div className="px-5 pb-8 pt-4 text-[12.5px] text-faint">
            还没有足够的数据——同一个模型至少要有 2
            次完成的对比记录才能画出趋势。多跑几轮（不同时段更有意思）再来看看。
          </div>
        ) : (
          <>
            {/* 模型选择 */}
            <div className="flex flex-wrap gap-1.5 px-5 pb-2">
              {series.map((s) => (
                <button
                  key={s.key}
                  onClick={() => {
                    setSelected(s.key);
                    setHover(null);
                  }}
                  className={`num rounded border px-2 py-0.5 text-[11px] cursor-pointer ${
                    s.key === active.key
                      ? "border-ink bg-ink text-paper"
                      : "border-line text-faint hover:text-ink"
                  }`}
                >
                  {s.key}（{s.pts.length}）
                </button>
              ))}
            </div>
            <TrendChart pts={active.pts} hover={hover} setHover={setHover} />
          </>
        )}
      </div>
    </div>
  );
  return overlay;
}

function TrendChart({
  pts,
  hover,
  setHover,
}: {
  pts: TrendPoint[];
  hover: number | null;
  setHover: (i: number | null) => void;
}) {
  const minAt = pts[0].at;
  const maxAt = pts[pts.length - 1].at;
  const span = Math.max(maxAt - minAt, 1);
  const maxTps = Math.max(...pts.map((p) => p.tps), 1) * 1.15;

  const X = (at: number) => PAD.l + ((at - minAt) / span) * PLOT_W;
  const Y = (tps: number) => PAD.t + PLOT_H - (tps / maxTps) * PLOT_H;
  const fmtDate = (at: number) =>
    new Date(at).toLocaleString("zh-CN", {
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((f) =>
    Math.round((maxTps / 1.15) * f)
  );
  const hp = hover != null ? pts[hover] : null;
  const tipFlip = hp ? X(hp.at) > W - 190 : false;

  return (
    <div className="px-3 pb-4">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full cursor-crosshair select-none"
        onMouseMove={(e) => {
          const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
          const x = ((e.clientX - rect.left) / rect.width) * W;
          let best = 0;
          let bd = Infinity;
          pts.forEach((p, i) => {
            const d = Math.abs(X(p.at) - x);
            if (d < bd) {
              bd = d;
              best = i;
            }
          });
          setHover(best);
        }}
        onMouseLeave={() => setHover(null)}
      >
        {yTicks.map((v) => (
          <g key={v}>
            <line
              x1={PAD.l}
              y1={Y(v)}
              x2={W - PAD.r}
              y2={Y(v)}
              stroke="var(--line)"
              strokeWidth={1}
            />
            <text
              x={PAD.l - 6}
              y={Y(v) + 3}
              textAnchor="end"
              fontSize={10}
              fill="var(--faint)"
              className="num"
            >
              {v}
            </text>
          </g>
        ))}
        <text x={12} y={PAD.t + 8} fontSize={10} fill="var(--faint)">
          tok/s
        </text>
        {/* 首末时间标签 */}
        <text
          x={PAD.l}
          y={H - 10}
          fontSize={10}
          fill="var(--faint)"
          className="num"
        >
          {fmtDate(minAt)}
        </text>
        <text
          x={W - PAD.r}
          y={H - 10}
          textAnchor="end"
          fontSize={10}
          fill="var(--faint)"
          className="num"
        >
          {fmtDate(maxAt)}
        </text>

        <polyline
          points={pts.map((p) => `${X(p.at).toFixed(1)},${Y(p.tps).toFixed(1)}`).join(" ")}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={1.8}
          strokeLinejoin="round"
        />
        {pts.map((p, i) => (
          <circle
            key={i}
            cx={X(p.at)}
            cy={Y(p.tps)}
            r={hover === i ? 5 : 3.5}
            fill={hover === i ? "var(--accent)" : "var(--card)"}
            stroke="var(--accent)"
            strokeWidth={1.5}
          />
        ))}

        {hp && (
          <g
            transform={`translate(${tipFlip ? X(hp.at) - 178 : X(hp.at) + 12}, ${PAD.t + 4})`}
          >
            <rect width={166} height={52} rx={5} fill="var(--ink)" opacity={0.93} />
            <text x={10} y={16} fontSize={10.5} fill="var(--paper)" className="num">
              {fmtDate(hp.at)}
            </text>
            <text x={10} y={31} fontSize={11} fill="#ffb3ad" className="num">
              输出 {fmtTps(hp.tps)} tok/s
            </text>
            <text x={10} y={45} fontSize={10.5} fill="var(--paper)" className="num">
              首Token {hp.ttftMs != null ? `${fmtSeconds(hp.ttftMs)}s` : "—"}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}
