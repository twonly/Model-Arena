/**
 * 程序化榜单页 /best/[metric] 的数据聚合：最快 / 最便宜 / 性价比。
 * 速度来自 run_metrics 聚合（lib/stats），成本来自定价表（lib/pricing）。
 */
import { fetchModelStats, modelSlug, type ModelStat } from "./stats.ts";
import { MODEL_PRICES, findPrice, toUsdPer1M } from "./pricing.ts";
import { type Locale } from "./i18n.ts";

export type BestMetric = "fastest" | "cheapest" | "value";
export const BEST_METRICS: BestMetric[] = ["fastest", "cheapest", "value"];

export interface BestRow {
  slug: string;
  model: string;
  provider?: string;
  /** 主指标，已格式化 */
  primary: string;
  secondary?: string;
}

export interface BestPage {
  metric: BestMetric;
  title: string;
  description: string;
  intro: string;
  rows: BestRow[];
  /** 数据不足时为 true（速度类依赖榜单数据） */
  empty: boolean;
  asOf: string;
}

const META: Record<BestMetric, { zh: [string, string]; en: [string, string] }> = {
  fastest: {
    zh: ["最快的大模型 API（实测速度排行）", "按真实输出速度（tokens/s）排序的大模型排行，数据来自全网用户匿名实测，持续更新。"],
    en: ["Fastest LLM APIs (real-world speed ranking)", "LLMs ranked by real output speed (tokens/s), from anonymous community benchmarks, continuously updated."],
  },
  cheapest: {
    zh: ["最便宜的大模型 API（输出价排行）", "按输出价（每百万 token）从低到高排序的大模型，含缓存命中价，标注官方来源。"],
    en: ["Cheapest LLM APIs (output price ranking)", "LLMs ranked by output price per million tokens, including cache-hit rates, with official sources."],
  },
  value: {
    zh: ["性价比最高的大模型 API（速度 × 成本）", "用实测速度除以输出价得到的性价比排行，找又快又便宜的大模型。"],
    en: ["Best-value LLM APIs (speed per dollar)", "LLMs ranked by real speed divided by output price — fast and cheap at once."],
  },
};

export function isBestMetric(v: string): v is BestMetric {
  return (BEST_METRICS as string[]).includes(v);
}

/** 仅取标题/描述（不拉数据），供 generateMetadata 用 */
export function bestMeta(metric: BestMetric, locale: Locale): { title: string; description: string } {
  const [title, description] = locale === "en" ? META[metric].en : META[metric].zh;
  return { title, description };
}

const fmtUsd = (n: number) => (n < 0.1 ? `$${n.toFixed(3)}` : n < 1 ? `$${n.toFixed(2)}` : `$${n.toFixed(n < 10 ? 1 : 0)}`);
const fmtTps = (n: number) => `${Math.round(n)}`;

/** 定价表按模型去重，取该模型 USD 输出价（同模型多区域取较低） */
function pricedModels(): { model: string; provider: string; outUsd: number; hitUsd?: number }[] {
  const map = new Map<string, { model: string; provider: string; outUsd: number; hitUsd?: number }>();
  for (const p of MODEL_PRICES) {
    const out = toUsdPer1M(p.output, p.currency);
    const hit = p.inputHit != null ? toUsdPer1M(p.inputHit, p.currency) : undefined;
    const cur = map.get(p.model);
    if (!cur || out < cur.outUsd) map.set(p.model, { model: p.model, provider: p.provider, outUsd: out, hitUsd: hit });
  }
  return [...map.values()];
}

export async function getBestPage(metric: BestMetric, locale: Locale): Promise<BestPage> {
  const isZh = locale === "zh-CN";
  const asOf = new Date().toISOString().slice(0, 10);
  let stats: ModelStat[] | null = null;
  if (metric !== "cheapest") {
    try {
      stats = await fetchModelStats();
    } catch {
      stats = null;
    }
  }

  let rows: BestRow[] = [];
  let empty = false;

  if (metric === "fastest") {
    const list = (stats ?? []).filter((s) => s.medianContentTps > 0);
    list.sort((a, b) => b.medianContentTps - a.medianContentTps);
    rows = list.slice(0, 15).map((s) => ({
      slug: modelSlug(s.model),
      model: s.model,
      provider: s.provider,
      primary: `${fmtTps(s.medianContentTps)} tok/s`,
      secondary: isZh
        ? `首响 ${(s.avgTtftMs / 1000).toFixed(2)}s · 峰值 ${fmtTps(s.maxPeakTps)} · ${s.samples} 次实测`
        : `TTFT ${(s.avgTtftMs / 1000).toFixed(2)}s · peak ${fmtTps(s.maxPeakTps)} · ${s.samples} runs`,
    }));
    empty = rows.length === 0;
  } else if (metric === "cheapest") {
    const list = pricedModels();
    list.sort((a, b) => a.outUsd - b.outUsd);
    rows = list.slice(0, 15).map((m) => ({
      slug: modelSlug(m.model),
      model: m.model,
      provider: m.provider,
      primary: `${fmtUsd(m.outUsd)}/1M ${isZh ? "输出" : "output"}`,
      secondary: m.hitUsd != null ? (isZh ? `缓存命中 ${fmtUsd(m.hitUsd)}/1M` : `cache hit ${fmtUsd(m.hitUsd)}/1M`) : undefined,
    }));
    empty = rows.length === 0;
  } else {
    // value = 速度 / 成本（tok/s 每美元/1M），需速度 + 价格
    const scored: { s: ModelStat; outUsd: number; score: number }[] = [];
    for (const s of stats ?? []) {
      if (s.medianContentTps <= 0) continue;
      const p = findPrice(s.model);
      if (!p) continue;
      const outUsd = toUsdPer1M(p.output, p.currency);
      if (outUsd <= 0) continue;
      scored.push({ s, outUsd, score: s.medianContentTps / outUsd });
    }
    scored.sort((a, b) => b.score - a.score);
    rows = scored.slice(0, 15).map(({ s, outUsd }) => ({
      slug: modelSlug(s.model),
      model: s.model,
      provider: s.provider,
      primary: `${fmtTps(s.medianContentTps)} tok/s @ ${fmtUsd(outUsd)}/1M`,
      secondary: isZh ? `速度/成本性价比靠前` : `top speed-per-dollar`,
    }));
    empty = rows.length === 0;
  }

  const [title, description] = isZh ? META[metric].zh : META[metric].en;

  const top = rows[0];
  const intro = top
    ? isZh
      ? `截至 ${asOf}，${title.split("（")[0]}中排名第一的是 ${top.model}（${top.primary}）。下表为完整排行，点击模型名查看详情，或在竞速场自行实测。`
      : `As of ${asOf}, the top model is ${top.model} (${top.primary}). See the full ranking below — click a model for details or run your own test.`
    : isZh
      ? "暂无足够的实测数据生成该排行，去竞速场跑一轮并选择匿名共享即可贡献数据。"
      : "Not enough benchmark data yet — run a comparison in the arena and opt in to anonymous sharing to contribute.";

  return { metric, title, description, intro, rows, empty, asOf };
}
