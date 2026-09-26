/**
 * 「结算卡」计算：从一轮各模型结果里选出 速度 / 成本 / 任务校验。
 * 纯函数，无副作用，便于测试与复用（arena 与分享页共用）。
 */
import { findEndpointPrice, estimateRunCost } from "./pricing.ts";
import type { RunMetrics } from "./types.ts";
import type { GradeResult } from "./grade.ts";

export interface VerdictEntry {
  id: string;
  name: string;
  model: string;
  status: string;
  provider?: string;
  metrics: RunMetrics | null;
  /** 客观题判定（grade()），无则 null */
  graded?: GradeResult | null;
  /** 视觉题 T0 探针：true=渲染成功 false=报错/空白 null=非视觉/未知 */
  rendered?: boolean | null;
}

export interface Award {
  id: string;
  name: string;
  value: string;
}

export interface Verdict {
  fastest?: Award;
  cheapest?: Award;
  /** 是否有明确版本的客观题 */
  graded: boolean;
  /** 通过客观题校验的模型名 */
  correct: string[];
}

const FINISHED = new Set(["done"]);

function speedOf(m: RunMetrics | null): number {
  if (!m) return 0;
  return m.contentTps ?? m.avgTps ?? 0;
}

function costUsdOf(e: VerdictEntry): number | undefined {
  const m = e.metrics;
  if (!m || m.outputTokens == null || m.promptTokens == null) return undefined;
  const price = findEndpointPrice(e.model, e.provider);
  if (!price || price.rateType === "upper-bound") return undefined;
  return estimateRunCost(price, m.promptTokens ?? 0, m.outputTokens ?? 0)
    .totalUsd;
}

const fmtCost = (n: number) =>
  n < 0.01 ? `$${n.toPrecision(2)}` : `$${n.toFixed(n < 1 ? 3 : 2)}`;

export function computeVerdict(entries: VerdictEntry[]): Verdict | null {
  const finished = entries.filter((e) => FINISHED.has(e.status) && e.metrics);
  if (finished.length < 1) return null;

  // 最快
  let fastest: Award | undefined;
  let maxSpeed = 0;
  for (const e of finished) {
    const s = speedOf(e.metrics);
    if (s > maxSpeed) {
      maxSpeed = s;
      fastest = { id: e.id, name: e.name, value: `${Math.round(s)} tok/s` };
    }
  }

  // 最省
  let cheapest: Award | undefined;
  let minCost = Infinity;
  for (const e of finished) {
    const c = costUsdOf(e);
    if (c != null && c < minCost) {
      minCost = c;
      cheapest = { id: e.id, name: e.name, value: `≈${fmtCost(c)}` };
    }
  }

  // 判定
  const graded = finished.some((e) => e.graded != null);
  const correct = finished.filter((e) => e.graded?.pass).map((e) => e.name);

  return { fastest, cheapest, graded, correct };
}
