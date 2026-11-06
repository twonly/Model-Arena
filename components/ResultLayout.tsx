"use client";

import type { CSSProperties } from "react";

export function resultGridStyle(columns: string, compact: boolean): CSSProperties {
  const minimum = columns === "auto"
    ? `${compact ? 300 : 360}px`
    : `max(260px, calc((100% - ${Number(columns) - 1} * 16px) / ${Number(columns)}))`;
  return { gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, ${minimum}), 1fr))` };
}

export function ResultLayout({ value, onChange, en }: {
  value: string;
  onChange: (value: string) => void;
  en: boolean;
}) {
  return (
    <label className="flex min-h-11 items-center gap-2 text-xs text-faint" data-no-export="1">
      {en ? "Models per row" : "每行模型数"}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-11 rounded-md border border-line bg-card px-2 text-ink"
        title={en ? "Fewer columns on smaller screens" : "屏幕较窄时自动减少列数"}
      >
        <option value="auto">{en ? "Auto" : "自动"}</option>
        {[1, 2, 3, 4, 5, 6].map((count) => <option key={count} value={count}>{count}</option>)}
      </select>
    </label>
  );
}

export function ResultContent({ value, onChange, en }: {
  value: "answers" | "metrics" | "preview";
  onChange: (value: "answers" | "metrics" | "preview") => void;
  en: boolean;
}) {
  return (
    <div role="group" aria-label={en ? "Result content" : "结果内容"} className="flex flex-wrap gap-1">
      {([ ["answers", en ? "Answers & metrics" : "答案与指标"], ["metrics", en ? "Metrics only" : "仅指标"], ["preview", en ? "Preview only" : "仅看效果"] ] as const).map(([mode, label]) => (
        <button key={mode} aria-controls="model-outputs" aria-pressed={value === mode}
          onClick={() => onChange(mode)}
          className="min-h-11 rounded-md border border-line bg-card px-2.5 py-1.5 text-xs text-faint hover:text-ink cursor-pointer aria-pressed:bg-ink aria-pressed:text-paper aria-pressed:hover:text-paper">
          {label}
        </button>
      ))}
    </div>
  );
}
