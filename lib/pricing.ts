/**
 * 模型 API 定价表（单一事实源）。
 *
 * 数据存在 ./pricing-data.json（可提交、可经 /admin/pricing 本地维护），
 * 本文件提供类型与计算 helper。
 *
 * 口径：单价均为「每 100 万 token」。
 *  - inputMiss：未命中缓存的输入价（新 prompt token）
 *  - inputHit ：命中缓存的输入价（复用上下文，厂商通常大幅折扣；null = 厂商不单列/未公开）
 *  - output   ：输出价
 * region：global = 海外/国际站（多以 USD 计），cn = 中国大陆官方站（多以 CNY 计）。
 *   同一中国模型常同时有两条（国内 RMB / 海外 USD），分别记录。
 * 跨模型比较 / 帕累托 / 单次成本统一折算到 USD（见 USD_PER_CNY）。
 *
 * 维护：价格会变。每条带 source + verified（核实日期）。needsConfirm=true 的为
 * 未查到权威来源或近未来型号、待站长手动确认的，UI 上应明确标注「待核实」。
 */
import rawPrices from "./pricing-data.json" with { type: "json" };

export type PriceRegion = "global" | "cn";
export type Currency = "USD" | "CNY";

export interface ModelPrice {
  /** 匹配运行时 model id（小写「包含」匹配，可多个别名） */
  matchIds: string[];
  provider: string;
  /** 展示名（专有名词，中英通用） */
  model: string;
  region: PriceRegion;
  currency: Currency;
  /** 每 1M token */
  inputMiss: number;
  inputHit: number | null;
  output: number;
  sourceName: string;
  sourceUrl: string;
  /** 核实日期 ISO（YYYY-MM-DD） */
  verified: string;
  /** 价格未经权威确认（近未来型号/未公开/聚合站推断） */
  needsConfirm?: boolean;
  note?: string;
}

/** 折算汇率（用于跨币种比较，非实时；展示原币种，比较用 USD） */
export const USD_PER_CNY = 1 / 7.2;

export function toUsdPer1M(amount: number, currency: Currency): number {
  return currency === "CNY" ? amount * USD_PER_CNY : amount;
}

export const MODEL_PRICES: ModelPrice[] = rawPrices as ModelPrice[];

/**
 * 标记帕累托前沿：X = 成本（越小越好），Y = 速度（越大越好）。
 * 返回与输入同序的布尔数组，true = 没有任何点同时更便宜且更快。
 */
export function paretoFrontier(
  points: { costUsd: number; speed: number }[]
): boolean[] {
  const order = points
    .map((_, i) => i)
    .sort(
      (a, b) =>
        points[a].costUsd - points[b].costUsd || points[b].speed - points[a].speed
    );
  const mask = points.map(() => false);
  let maxSpeed = -Infinity;
  for (const i of order) {
    if (points[i].speed > maxSpeed) {
      mask[i] = true;
      maxSpeed = points[i].speed;
    }
  }
  return mask;
}

/** 按 model id + 区域找定价；region 优先，找不到再退到另一区域 */
export function findPrice(
  modelId: string,
  region: PriceRegion = "global"
): ModelPrice | undefined {
  const id = modelId.toLowerCase();
  const hits = MODEL_PRICES.filter((p) =>
    p.matchIds.some((m) => id === m || id.includes(m))
  );
  if (!hits.length) return undefined;
  return hits.find((p) => p.region === region) ?? hits[0];
}

export interface CostBreakdown {
  /** 原币种（price.currency）金额 */
  totalNative: number;
  inputUsd: number;
  outputUsd: number;
  totalUsd: number;
  price: ModelPrice;
}

/**
 * 估算单次运行成本。cachedTokens 已知时拆命中/未命中，否则全按未命中（成本上界）。
 * 返回原币种金额（totalNative）+ 统一折算的 USD（用于跨模型比较 / 帕累托）。
 */
export function estimateRunCost(
  price: ModelPrice,
  promptTokens: number,
  outputTokens: number,
  cachedTokens = 0
): CostBreakdown {
  const miss = Math.max(promptTokens - cachedTokens, 0);
  const hitRate = price.inputHit ?? price.inputMiss;
  const inputNative = (miss * price.inputMiss + cachedTokens * hitRate) / 1e6;
  const outputNative = (outputTokens * price.output) / 1e6;
  return {
    totalNative: inputNative + outputNative,
    inputUsd: toUsdPer1M(inputNative, price.currency),
    outputUsd: toUsdPer1M(outputNative, price.currency),
    totalUsd: toUsdPer1M(inputNative + outputNative, price.currency),
    price,
  };
}
