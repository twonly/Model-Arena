/**
 * 「结算卡」计算：从一轮各模型结果里选出 最快 / 最省 / 答对 / 综合推荐。
 * 纯函数，无副作用，便于测试与复用（arena 与分享页共用）。
 */
import { findPrice, estimateRunCost } from "./pricing.ts";
import type { RunMetrics } from "./types.ts";
import type { GradeResult } from "./grade.ts";

export interface VerdictEntry {
  id: string;
  name: string;
  model: string;
  status: string;
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
  /** 是否有可自动判定的客观/视觉题 */
  graded: boolean;
  /** 答对（或视觉渲染成功）的模型名 */
  correct: string[];
  /** 综合推荐 */
  overall?: { id: string; name: string };
}

const FINISHED = new Set(["done", "stopped", "truncated"]);

function speedOf(m: RunMetrics | null): number {
  if (!m) return 0;
  return m.contentTps ?? m.avgTps ?? 0;
}

function costUsdOf(e: VerdictEntry): number | undefined {
  const m = e.metrics;
  if (!m || m.outputTokens == null) return undefined;
  const price = findPrice(e.model);
  if (!price) return undefined;
  return estimateRunCost(price, m.promptTokens ?? 0, m.outputTokens ?? 0).totalUsd;
}

const fmtCost = (n: number) => (n < 0.01 ? `$${n.toPrecision(2)}` : `$${n.toFixed(n < 1 ? 3 : 2)}`);

/** 该条「质量分」：答对/渲染成功=1，答错/失败=0，无判定=0.5（中性） */
function accScore(e: VerdictEntry): number {
  if (e.graded) return e.graded.pass ? 1 : 0;
  if (e.rendered === true) return 1;
  if (e.rendered === false) return 0;
  return 0.5;
}

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
  const graded = entries.some((e) => e.graded != null || e.rendered != null);
  const correct = entries
    .filter((e) => e.graded?.pass || e.rendered === true)
    .map((e) => e.name);

  // 综合：速度 / 成本 / 质量 归一化加权
  let overall: { id: string; name: string } | undefined;
  let bestScore = -1;
  for (const e of finished) {
    const speedN = maxSpeed > 0 ? speedOf(e.metrics) / maxSpeed : 0;
    const c = costUsdOf(e);
    const costN = c != null && minCost < Infinity ? minCost / c : 0.5;
    const score = 0.34 * speedN + 0.33 * costN + 0.33 * accScore(e);
    if (score > bestScore) {
      bestScore = score;
      overall = { id: e.id, name: e.name };
    }
  }

  return { fastest, cheapest, graded, correct, overall };
}
