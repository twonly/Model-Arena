import { type Locale } from "@/lib/i18n";

export interface CostSpeedPoint {
  model: string;
  provider: string;
  /** 中位输出速度 tok/s */
  speed: number;
  /** 输出价 USD / 1M token（跨币种已折算） */
  costUsd: number;
  /** 是否在帕累托前沿（没有任何模型同时更快又更便宜） */
  frontier: boolean;
  needsConfirm: boolean;
}

/**
 * 速度-成本帕累托图（纯 SVG，截图友好）。
 * X = 输出价（对数轴，越左越便宜），Y = 中位输出速度（越上越快）。
 * 左上角最优；帕累托前沿点高亮并以虚线连出，被支配点置灰。
 */
export function SpeedCostChart({
  points,
  locale,
}: {
  points: CostSpeedPoint[];
  locale: Locale;
}) {
  const isZh = locale === "zh-CN";
  const W = 820;
  const H = 460;
  const padL = 92;
  const padR = 120;
  const padT = 24;
  const padB = 54;

  const costs = points.map((p) => p.costUsd);
  const minCost = Math.min(...costs);
  const maxCost = Math.max(...costs);
  const maxSpeed = Math.max(...points.map((p) => p.speed));

  const lg = (c: number) => Math.log10(Math.max(c, 0.001));
  const x0 = lg(minCost);
  const x1 = lg(maxCost);
  const span = x1 - x0 || 1;
  const px = (c: number) => padL + ((lg(c) - x0) / span) * (W - padL - padR);
  const py = (s: number) => H - padB - (s / (maxSpeed * 1.1)) * (H - padT - padB);

  const xTicks = [0.1, 0.3, 1, 3, 10, 30, 100].filter(
    (v) => v >= minCost * 0.85 && v <= maxCost * 1.15
  );
  const yTickCount = 4;
  const yTicks = Array.from({ length: yTickCount + 1 }, (_, i) =>
    Math.round((maxSpeed * 1.1 * i) / yTickCount)
  );

  const frontier = points
    .filter((p) => p.frontier)
    .sort((a, b) => a.costUsd - b.costUsd);
  const frontierPath = frontier
    .map((p, i) => `${i ? "L" : "M"}${px(p.costUsd).toFixed(1)},${py(p.speed).toFixed(1)}`)
    .join(" ");

  const fmtCost = (n: number) => (n < 1 ? `$${n.toFixed(2)}` : `$${n.toFixed(0)}`);

  return (
    <div className="overflow-x-auto rounded-lg border border-line bg-card">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="block w-full"
        style={{ minWidth: 560, fontFamily: "var(--font-sans)" }}
        role="img"
        aria-label={isZh ? "速度-成本帕累托图" : "Speed vs cost Pareto chart"}
      >
        {/* 网格 + Y 轴刻度 */}
        {yTicks.map((t) => (
          <g key={`y${t}`}>
            <line
              x1={padL}
              x2={W - padR}
              y1={py(t)}
              y2={py(t)}
              stroke="var(--line)"
              strokeWidth={1}
            />
            <text x={padL - 8} y={py(t) + 3} textAnchor="end" fontSize={10} fill="var(--faint)">
              {t}
            </text>
          </g>
        ))}
        {/* X 轴刻度（对数） */}
        {xTicks.map((t) => (
          <g key={`x${t}`}>
            <line
              x1={px(t)}
              x2={px(t)}
              y1={padT}
              y2={H - padB}
              stroke="var(--line)"
              strokeWidth={1}
              strokeDasharray="2 3"
            />
            <text x={px(t)} y={H - padB + 16} textAnchor="middle" fontSize={10} fill="var(--faint)">
              {fmtCost(t)}
            </text>
          </g>
        ))}

        {/* 轴标题 + 方位提示 */}
        <text x={(padL + W - padR) / 2} y={H - 6} textAnchor="middle" fontSize={11} fill="var(--faint)">
          {isZh ? "输出价 $/1M（对数轴，← 越便宜）" : "Output $/1M (log, ← cheaper)"}
        </text>
        <text
          x={16}
          y={(padT + H - padB) / 2}
          textAnchor="middle"
          fontSize={11}
          fill="var(--faint)"
          transform={`rotate(-90 16 ${(padT + H - padB) / 2})`}
        >
          {isZh ? "中位输出速度 tok/s（越快 ↑）" : "Median tok/s (faster ↑)"}
        </text>
        <text x={padL + 4} y={padT + 12} fontSize={10.5} fill="var(--go)" fontWeight={700}>
          {isZh ? "↖ 又快又便宜＝最优" : "↖ fast & cheap = best"}
        </text>

        {/* 帕累托前沿连线 */}
        {frontier.length > 1 && (
          <path
            d={frontierPath}
            fill="none"
            stroke="var(--accent)"
            strokeWidth={1.5}
            strokeDasharray="5 4"
            opacity={0.7}
          />
        )}

        {/* 数据点 */}
        {points.map((p, i) => {
          const cx = px(p.costUsd);
          const cy = py(p.speed);
          const onFront = p.frontier;
          return (
            <g key={`${p.model}-${i}`}>
              <circle
                cx={cx}
                cy={cy}
                r={onFront ? 5.5 : 3.5}
                fill={onFront ? "var(--accent)" : "var(--faint)"}
                fillOpacity={onFront ? 1 : 0.5}
                stroke={p.needsConfirm ? "var(--think)" : "transparent"}
                strokeWidth={p.needsConfirm ? 1.5 : 0}
              >
                <title>
                  {`${p.model} · ${p.provider}\n${isZh ? "速度" : "speed"} ${Math.round(
                    p.speed
                  )} tok/s · ${isZh ? "输出价" : "output"} ${fmtCost(p.costUsd)}/1M${
                    onFront ? (isZh ? " · 帕累托前沿" : " · Pareto frontier") : ""
                  }${p.needsConfirm ? (isZh ? " · 价格待核实" : " · price unverified") : ""}`}
                </title>
              </circle>
              {onFront && (
                <text
                  x={cx + 8}
                  y={cy + 3.5}
                  fontSize={10.5}
                  fill="var(--ink)"
                  fontWeight={600}
                >
                  {p.model}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
