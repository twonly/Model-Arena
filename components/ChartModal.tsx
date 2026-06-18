"use client";

import { useMemo, useRef, useState } from "react";
import { useI18n } from "@/components/I18nProvider";
import { fmtTps } from "@/lib/format";
import type { SpeedSample } from "@/lib/types";

const W = 760;
const H = 340;
const PAD = { l: 58, r: 20, t: 18, b: 36 };
const PLOT_W = W - PAD.l - PAD.r;
const PLOT_H = H - PAD.t - PAD.b;

function niceTicks(max: number, count = 4): number[] {
  if (max <= 0) return [0];
  const rough = max / count;
  const mag = Math.pow(10, Math.floor(Math.log10(rough)));
  const step =
    [1, 2, 2.5, 5, 10].map((m) => m * mag).find((v) => v >= rough) ?? rough;
  const out: number[] = [];
  for (let v = 0; v <= max * 1.0001; v += step) out.push(v);
  return out;
}

export function ChartModal({
  open,
  onClose,
  title,
  subtitle,
  samples,
  avgTps,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  samples: SpeedSample[];
  /** 整体平均（含首响等待），来自最终指标 */
  avgTps?: number;
}) {
  const { locale } = useI18n();
  const en = locale === "en";
  const svgRef = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<number | null>(null);

  const stats = useMemo(() => {
    if (samples.length < 2) return null;
    const maxT = samples[samples.length - 1].t;
    let peak = samples[0];
    let sum = 0;
    for (const s of samples) {
      if (s.tps > peak.tps) peak = s;
      sum += s.tps;
    }
    const mean = sum / samples.length;
    const domainMax = Math.max(peak.tps, 1) * 1.1;
    return { maxT, peak, mean, domainMax };
  }, [samples]);

  if (!open || !stats) return null;

  const X = (t: number) => PAD.l + (t / stats.maxT) * PLOT_W;
  const Y = (tps: number) => PAD.t + PLOT_H - (tps / stats.domainMax) * PLOT_H;
  const secs = (ms: number) => `${(ms / 1000).toFixed(ms < 10000 ? 1 : 0)}s`;

  const pts = samples
    .map((s) => `${X(s.t).toFixed(1)},${Y(s.tps).toFixed(1)}`)
    .join(" ");
  const area = `${PAD.l},${PAD.t + PLOT_H} ${pts} ${X(stats.maxT).toFixed(1)},${PAD.t + PLOT_H}`;
  const yTicks = niceTicks(stats.domainMax / 1.1);
  const xTicks = niceTicks(stats.maxT / 1000, 6);

  const onMove = (e: React.MouseEvent) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width) * W;
    const t = ((x - PAD.l) / PLOT_W) * stats.maxT;
    let best = 0;
    let bd = Infinity;
    samples.forEach((s, i) => {
      const d = Math.abs(s.t - t);
      if (d < bd) {
        bd = d;
        best = i;
      }
    });
    setHover(best);
  };

  const hs = hover != null ? samples[hover] : null;
  const tipFlip = hs ? X(hs.t) > W - 170 : false;

  /** 用 Canvas 原生重绘并下载 PNG（2x 清晰度，避免 SVG 转图的字体问题） */
  const downloadPng = () => {
    const scale = 2;
    const titleH = 56;
    const canvas = document.createElement("canvas");
    canvas.width = W * scale;
    canvas.height = (H + titleH) * scale;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(scale, scale);
    const font = (px: number, bold = false) =>
      `${bold ? "bold " : ""}${px}px -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif`;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, W, H + titleH);
    ctx.fillStyle = "#1d1c18";
    ctx.font = font(17, true);
    ctx.fillText(`${title} · ${en ? "Token Output Speed Curve" : "Token 输出速度曲线"}`, PAD.l, 26);
    ctx.fillStyle = "#8d8a82";
    ctx.font = font(11);
    ctx.fillText(
      `${subtitle ?? ""}   ${en ? "Peak" : "峰值"} ${fmtTps(stats.peak.tps)} tok/s @ ${secs(stats.peak.t)} · ${en ? "Curve avg" : "曲线平均"} ${fmtTps(stats.mean)} tok/s${avgTps != null ? ` · ${en ? "Overall avg" : "整体平均"} ${fmtTps(avgTps)} tok/s` : ""} · ${en ? "Duration" : "时长"} ${secs(stats.maxT)}`,
      PAD.l,
      44
    );

    const oy = titleH;
    // 网格 + Y 轴
    ctx.strokeStyle = "#e6e4dd";
    ctx.fillStyle = "#8d8a82";
    ctx.font = font(10);
    ctx.textAlign = "right";
    for (const v of yTicks) {
      const y = Y(v) + oy;
      ctx.beginPath();
      ctx.moveTo(PAD.l, y);
      ctx.lineTo(W - PAD.r, y);
      ctx.stroke();
      ctx.fillText(String(Math.round(v)), PAD.l - 6, y + 3);
    }
    ctx.textAlign = "center";
    for (const v of xTicks) {
      const x = X(v * 1000);
      ctx.fillText(`${v}s`, x, PAD.t + PLOT_H + oy + 16);
    }
    // 面积 + 折线
    ctx.beginPath();
    ctx.moveTo(PAD.l, PAD.t + PLOT_H + oy);
    for (const s of samples) ctx.lineTo(X(s.t), Y(s.tps) + oy);
    ctx.lineTo(X(stats.maxT), PAD.t + PLOT_H + oy);
    ctx.closePath();
    ctx.fillStyle = "rgba(217,38,28,0.08)";
    ctx.fill();
    ctx.beginPath();
    samples.forEach((s, i) => {
      const x = X(s.t);
      const y = Y(s.tps) + oy;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = "#d9261c";
    ctx.lineWidth = 1.6;
    ctx.stroke();
    // 峰值 / 平均虚线
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1;
    ctx.strokeStyle = "#d9261c";
    ctx.beginPath();
    ctx.moveTo(PAD.l, Y(stats.peak.tps) + oy);
    ctx.lineTo(W - PAD.r, Y(stats.peak.tps) + oy);
    ctx.stroke();
    ctx.strokeStyle = "#8d8a82";
    ctx.beginPath();
    ctx.moveTo(PAD.l, Y(stats.mean) + oy);
    ctx.lineTo(W - PAD.r, Y(stats.mean) + oy);
    ctx.stroke();
    ctx.setLineDash([]);

    const link = document.createElement("a");
    link.download = `${title}-${en ? "speed-curve" : "速度曲线"}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[820px] rounded-xl border border-line bg-card shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between px-5 pt-4 pb-2">
          <div>
            <div className="font-bold text-[15px]">
              {title} · {en ? "Token Output Speed Curve" : "Token 输出速度曲线"}
            </div>
            {subtitle && (
              <div className="num text-[11px] text-faint">{subtitle}</div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={downloadPng}
              className="rounded-md border border-line px-2.5 py-1 text-[11.5px] text-faint hover:text-ink cursor-pointer"
            >
              ⤓ {en ? "Download PNG" : "下载 PNG"}
            </button>
            <button
              onClick={onClose}
              className="text-faint hover:text-ink text-[18px] leading-none cursor-pointer px-1"
            >
              ✕
            </button>
          </div>
        </div>

        {/* 统计行 */}
        <div className="flex flex-wrap gap-x-6 gap-y-1 px-5 pb-2">
          <span className="text-[11.5px] text-faint">
            {en ? "Peak" : "峰值"}{" "}
            <span className="num font-bold text-accent">
              {fmtTps(stats.peak.tps)}
            </span>{" "}
            tok/s <span className="num">@ {secs(stats.peak.t)}</span>
          </span>
          <span className="text-[11.5px] text-faint">
            {en ? "Curve Avg" : "曲线平均"}{" "}
            <span className="num font-bold text-ink">
              {fmtTps(stats.mean)}
            </span>{" "}
            tok/s
          </span>
          {avgTps != null && (
            <span className="text-[11.5px] text-faint">
              {en ? "Overall Avg (incl. TTFT)" : "整体平均（含首响）"}{" "}
              <span className="num font-bold text-ink">{fmtTps(avgTps)}</span>{" "}
              tok/s
            </span>
          )}
          <span className="text-[11.5px] text-faint">
            {en ? "Duration" : "时长"} <span className="num font-bold text-ink">{secs(stats.maxT)}</span>
          </span>
          <span className="text-[11.5px] text-faint">
            {en ? "Samples" : "采样"} <span className="num">{samples.length}</span> {en ? "points / 250ms" : "点 / 250ms"}
          </span>
        </div>

        {/* 图表 */}
        <div className="px-3 pb-4">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${W} ${H}`}
            className="w-full cursor-crosshair select-none"
            onMouseMove={onMove}
            onMouseLeave={() => setHover(null)}
          >
            {/* 网格 + 刻度 */}
            {yTicks.map((v) => (
              <g key={`y${v}`}>
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
                  {Math.round(v)}
                </text>
              </g>
            ))}
            {xTicks.map((v) => (
              <text
                key={`x${v}`}
                x={X(v * 1000)}
                y={PAD.t + PLOT_H + 16}
                textAnchor="middle"
                fontSize={10}
                fill="var(--faint)"
                className="num"
              >
                {v}s
              </text>
            ))}
            <text
              x={12}
              y={PAD.t + 8}
              fontSize={10}
              fill="var(--faint)"
            >
              tok/s
            </text>

            {/* 峰值 / 平均参考线 */}
            <line
              x1={PAD.l}
              y1={Y(stats.peak.tps)}
              x2={W - PAD.r}
              y2={Y(stats.peak.tps)}
              stroke="var(--accent)"
              strokeWidth={1}
              strokeDasharray="4 4"
              opacity={0.6}
            />
            <line
              x1={PAD.l}
              y1={Y(stats.mean)}
              x2={W - PAD.r}
              y2={Y(stats.mean)}
              stroke="var(--faint)"
              strokeWidth={1}
              strokeDasharray="4 4"
              opacity={0.7}
            />

            {/* 面积 + 折线 */}
            <polygon points={area} fill="var(--accent)" opacity={0.08} />
            <polyline
              points={pts}
              fill="none"
              stroke="var(--accent)"
              strokeWidth={1.8}
              strokeLinejoin="round"
              strokeLinecap="round"
            />

            {/* 悬停十字线 + 提示 */}
            {hs && (
              <g>
                <line
                  x1={X(hs.t)}
                  y1={PAD.t}
                  x2={X(hs.t)}
                  y2={PAD.t + PLOT_H}
                  stroke="var(--ink)"
                  strokeWidth={1}
                  opacity={0.35}
                />
                <circle
                  cx={X(hs.t)}
                  cy={Y(hs.tps)}
                  r={3.5}
                  fill="var(--accent)"
                  stroke="#fff"
                  strokeWidth={1.5}
                />
                <g
                  transform={`translate(${tipFlip ? X(hs.t) - 150 : X(hs.t) + 10}, ${PAD.t + 6})`}
                >
                  <rect
                    width={140}
                    height={38}
                    rx={5}
                    fill="var(--ink)"
                    opacity={0.92}
                  />
                  <text x={10} y={16} fontSize={11} fill="#fff" className="num">
                    t = {secs(hs.t)}
                  </text>
                  <text
                    x={10}
                    y={30}
                    fontSize={11}
                    fill="#ffb3ad"
                    className="num"
                  >
                    {fmtTps(hs.tps)} tok/s
                  </text>
                </g>
              </g>
            )}
          </svg>
        </div>
      </div>
    </div>
  );
}
