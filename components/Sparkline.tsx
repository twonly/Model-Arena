"use client";

import type { SpeedSample } from "@/lib/types";

/** 实时 token/s 速度曲线（极简 SVG，无依赖） */
export function Sparkline({
  samples,
  width = 120,
  height = 30,
}: {
  samples: SpeedSample[];
  width?: number;
  height?: number;
}) {
  if (samples.length < 2) {
    return (
      <svg width={width} height={height} aria-hidden>
        <line
          x1={0}
          y1={height - 1}
          x2={width}
          y2={height - 1}
          stroke="var(--line)"
          strokeWidth={1}
        />
      </svg>
    );
  }
  const maxT = samples[samples.length - 1].t;
  const maxTps = Math.max(...samples.map((s) => s.tps), 1);
  const pts = samples.map((s) => {
    const x = (s.t / maxT) * (width - 2) + 1;
    const y = height - 2 - (s.tps / maxTps) * (height - 6);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const area = `1,${height - 1} ${pts.join(" ")} ${width - 1},${height - 1}`;
  return (
    <svg width={width} height={height} aria-label="速度曲线">
      <polygon points={area} fill="var(--accent)" opacity={0.08} />
      <polyline
        points={pts.join(" ")}
        fill="none"
        stroke="var(--accent)"
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
