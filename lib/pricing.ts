/**
 * 模型 API 定价表（单一事实源）。
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

export const MODEL_PRICES: ModelPrice[] = [
  // ——— Anthropic Claude（海外 USD；缓存读取 = 输入价 10%）———
  {
    matchIds: ["claude-opus-4-8", "claude-opus-4.8", "opus-4-8"],
    provider: "Anthropic", model: "Claude Opus 4.8", region: "global", currency: "USD",
    inputMiss: 5, inputHit: 0.5, output: 25,
    sourceName: "Anthropic API Pricing 2026", sourceUrl: "https://www.cloudzero.com/blog/claude-api-pricing/",
    verified: "2026-06-19", note: "标准 API（不含 fast 模式）；缓存命中约 9 折",
  },
  {
    matchIds: ["claude-opus-4-6", "claude-opus-4.6", "opus-4-6"],
    provider: "Anthropic", model: "Claude Opus 4.6", region: "global", currency: "USD",
    inputMiss: 5, inputHit: 0.5, output: 25,
    sourceName: "Anthropic API Pricing 2026", sourceUrl: "https://www.cloudzero.com/blog/claude-api-pricing/",
    verified: "2026-06-19", note: "与 Opus 4.8 同价档；缓存命中约 9 折",
  },
  {
    matchIds: ["claude-sonnet-4-6", "claude-sonnet-4.6", "sonnet-4-6"],
    provider: "Anthropic", model: "Claude Sonnet 4.6", region: "global", currency: "USD",
    inputMiss: 3, inputHit: 0.3, output: 15,
    sourceName: "Anthropic API Pricing 2026", sourceUrl: "https://www.cloudzero.com/blog/claude-api-pricing/",
    verified: "2026-06-19",
  },
  {
    matchIds: ["claude-haiku-4-5", "claude-haiku-4.5", "haiku-4-5"],
    provider: "Anthropic", model: "Claude Haiku 4.5", region: "global", currency: "USD",
    inputMiss: 1, inputHit: 0.1, output: 5,
    sourceName: "Anthropic API Pricing 2026", sourceUrl: "https://www.cloudzero.com/blog/claude-api-pricing/",
    verified: "2026-06-19",
  },

  // ——— OpenAI（海外 USD；缓存读取 75% off）———
  {
    matchIds: ["gpt-5.5", "gpt-5-5", "codex"],
    provider: "OpenAI", model: "Codex / GPT-5.5 API", region: "global", currency: "USD",
    inputMiss: 5, inputHit: 0.5, output: 30,
    sourceName: "OpenAI Developer Pricing", sourceUrl: "https://platform.openai.com/docs/pricing",
    verified: "2026-06-19", note: "标准短上下文 GPT-5.5 API（非 priority）",
  },
  {
    matchIds: ["gpt-4.1", "gpt-4-1"],
    provider: "OpenAI", model: "GPT-4.1", region: "global", currency: "USD",
    inputMiss: 2, inputHit: 0.5, output: 8,
    sourceName: "OpenAI API Pricing 2026", sourceUrl: "https://pecollective.com/tools/openai-api-pricing/",
    verified: "2026-06-19",
  },
  {
    matchIds: ["gpt-4.1-mini", "gpt-4-1-mini"],
    provider: "OpenAI", model: "GPT-4.1 mini", region: "global", currency: "USD",
    inputMiss: 0.4, inputHit: 0.1, output: 1.6,
    sourceName: "Inworld / OpenAI", sourceUrl: "https://inworld.ai/models/openai-gpt-4-1-mini",
    verified: "2026-06-19",
  },
  {
    matchIds: ["gpt-4o-mini"],
    provider: "OpenAI", model: "GPT-4o mini", region: "global", currency: "USD",
    inputMiss: 0.15, inputHit: 0.075, output: 0.6,
    sourceName: "OpenAI API Pricing 2026", sourceUrl: "https://pecollective.com/tools/openai-api-pricing/",
    verified: "2026-06-19",
  },

  // ——— Google Gemini（海外 USD；缓存读取≈输入 10%）———
  {
    matchIds: ["gemini-2.5-flash", "gemini-2-5-flash"],
    provider: "Google", model: "Gemini 2.5 Flash", region: "global", currency: "USD",
    inputMiss: 0.3, inputHit: 0.03, output: 2.5,
    sourceName: "Google Gemini Pricing 2026", sourceUrl: "https://www.finout.io/blog/gemini-pricing-in-2026",
    verified: "2026-06-19",
  },
  {
    matchIds: ["gemini-2.5-pro", "gemini-2-5-pro"],
    provider: "Google", model: "Gemini 2.5 Pro", region: "global", currency: "USD",
    inputMiss: 1.25, inputHit: 0.31, output: 10,
    sourceName: "Google Gemini Pricing 2026", sourceUrl: "https://www.finout.io/blog/gemini-pricing-in-2026",
    verified: "2026-06-19", needsConfirm: true, note: "≤200K 档；>200K 约 $2.5/$15。待核实缓存价",
  },

  // ——— DeepSeek（全球统一价，USD；人民币≈÷7.2；chat/reasoner=V4 别名）———
  {
    matchIds: ["deepseek-v4-flash", "deepseek-chat"],
    provider: "DeepSeek", model: "DeepSeek V4 Flash", region: "global", currency: "USD",
    inputMiss: 0.14, inputHit: 0.0028, output: 0.28,
    sourceName: "DeepSeek API Docs", sourceUrl: "https://api-docs.deepseek.com/zh-cn/quick_start/pricing",
    verified: "2026-06-19", note: "deepseek-chat=V4 Flash 非思考别名；全球统一价（约 ¥1/¥0.02/¥2）",
  },
  {
    matchIds: ["deepseek-v4-pro", "deepseek-reasoner"],
    provider: "DeepSeek", model: "DeepSeek V4 Pro", region: "global", currency: "USD",
    inputMiss: 0.435, inputHit: 0.003625, output: 0.87,
    sourceName: "DeepSeek API Docs", sourceUrl: "https://api-docs.deepseek.com/zh-cn/quick_start/pricing",
    verified: "2026-06-19", note: "deepseek-reasoner=V4 Pro 思考别名；全球统一价（约 ¥3/¥0.025/¥6）",
  },

  // ——— 智谱 GLM（国内 bigmodel.cn RMB / 海外 z.ai USD）———
  {
    matchIds: ["glm-5.1"],
    provider: "智谱 Zhipu", model: "GLM-5.1", region: "cn", currency: "CNY",
    inputMiss: 6, inputHit: 1.3, output: 24,
    sourceName: "智谱开放平台", sourceUrl: "https://open.bigmodel.cn/pricing",
    verified: "2026-06-19", note: "输入 [0,32K) 档；[32K+) 为 ¥8/¥2/¥28；缓存存储限时免费",
  },
  {
    matchIds: ["glm-5.1"],
    provider: "智谱 Zhipu", model: "GLM-5.1", region: "global", currency: "USD",
    inputMiss: 1.4, inputHit: null, output: 4.4,
    sourceName: "Z.ai Developer Docs", sourceUrl: "https://docs.z.ai/guides/overview/pricing",
    verified: "2026-06-19", needsConfirm: true,
  },
  {
    matchIds: ["glm-5.2"],
    provider: "智谱 Zhipu", model: "GLM-5.2", region: "cn", currency: "CNY",
    inputMiss: 8, inputHit: 2, output: 28,
    sourceName: "智谱开放平台", sourceUrl: "https://open.bigmodel.cn/pricing",
    verified: "2026-06-19", note: "1M 上下文；缓存存储限时免费",
  },
  {
    matchIds: ["glm-5.2"],
    provider: "智谱 Zhipu", model: "GLM-5.2", region: "global", currency: "USD",
    inputMiss: 1.4, inputHit: 0.26, output: 4.4,
    sourceName: "Z.ai Developer Docs", sourceUrl: "https://docs.z.ai/guides/overview/pricing",
    verified: "2026-06-19",
  },

  // ——— Moonshot Kimi（K2.7 Code，海外 USD；kimi-for-coding 即此模型）———
  {
    matchIds: ["kimi-for-coding", "kimi-k2.7-code", "kimi-k2", "kimi-k2-turbo-preview", "kimi-latest"],
    provider: "Moonshot Kimi", model: "Kimi K2.7 Code", region: "global", currency: "USD",
    inputMiss: 0.95, inputHit: 0.19, output: 4,
    sourceName: "platform.moonshot.ai", sourceUrl: "https://platform.moonshot.ai/",
    verified: "2026-06-19", note: "262K 上下文；kimi-for-coding 即 K2.7 Code",
  },
  {
    matchIds: ["kimi-k2.7-code-highspeed"],
    provider: "Moonshot Kimi", model: "Kimi K2.7 Code Highspeed", region: "global", currency: "USD",
    inputMiss: 1.9, inputHit: 0.38, output: 8,
    sourceName: "platform.moonshot.ai", sourceUrl: "https://platform.moonshot.ai/",
    verified: "2026-06-19",
  },

  // ——— 小米 MiMo（国内 RMB，站长提供 / 官方）———
  {
    matchIds: ["mimo-v2.5", "mimo-v2-flash"],
    provider: "小米 MiMo", model: "MiMo V2.5", region: "cn", currency: "CNY",
    inputMiss: 1, inputHit: 0.02, output: 2,
    sourceName: "小米 MiMo 开放平台", sourceUrl: "https://platform.xiaomimimo.com/docs/zh-CN/price",
    verified: "2026-06-19",
  },
  {
    matchIds: ["mimo-v2.5-pro", "mimo-v2-pro"],
    provider: "小米 MiMo", model: "MiMo V2.5 Pro", region: "cn", currency: "CNY",
    inputMiss: 3, inputHit: 0.025, output: 6,
    sourceName: "小米 MiMo 开放平台", sourceUrl: "https://platform.xiaomimimo.com/docs/zh-CN/price",
    verified: "2026-06-19",
  },

  // ——— 阶跃星辰 Step（platform.stepfun.com，国内 RMB）———
  {
    matchIds: ["step-3.7-flash", "step-3-7-flash"],
    provider: "阶跃 StepFun", model: "Step 3.7 Flash", region: "cn", currency: "CNY",
    inputMiss: 1.35, inputHit: 0.27, output: 8.1,
    sourceName: "阶跃星辰官方定价", sourceUrl: "https://platform.stepfun.com/docs/zh/guides/pricing/details",
    verified: "2026-06-19",
  },

  // ——— 通义千问 Qwen（国际站 Model Studio 新加坡，USD；中国北京区约便宜 60-70%）———
  {
    matchIds: ["qwen-plus"],
    provider: "通义千问 Qwen", model: "Qwen-Plus", region: "global", currency: "USD",
    inputMiss: 0.4, inputHit: null, output: 2.4,
    sourceName: "Alibaba Model Studio", sourceUrl: "https://inferencehub.org/blog/alibaba-cloud-qwen-api-pricing-2026/",
    verified: "2026-06-19",
  },
  {
    matchIds: ["qwen-max", "qwen3.7-max", "qwen3-max"],
    provider: "通义千问 Qwen", model: "Qwen3.7-Max", region: "global", currency: "USD",
    inputMiss: 1.25, inputHit: 0.13, output: 3.75,
    sourceName: "Together / OpenRouter", sourceUrl: "https://openrouter.ai/qwen/qwen3-max",
    verified: "2026-06-19", note: "Together/OpenRouter USD 路线；阿里官方为 RMB/分区价",
  },
  {
    matchIds: ["qwen-turbo"],
    provider: "通义千问 Qwen", model: "Qwen-Turbo", region: "global", currency: "USD",
    inputMiss: 0.05, inputHit: null, output: 0.2,
    sourceName: "Alibaba Model Studio", sourceUrl: "https://inferencehub.org/blog/alibaba-cloud-qwen-api-pricing-2026/",
    verified: "2026-06-19", needsConfirm: true, note: "输出价待核实",
  },

  // ——— 豆包 Doubao（火山方舟，国内 RMB，按输入长度分档，取 0-32K 主档）———
  {
    matchIds: ["doubao-seed-1-6", "doubao-seed-1.6"],
    provider: "字节 豆包", model: "Doubao Seed 1.6", region: "cn", currency: "CNY",
    inputMiss: 0.8, inputHit: null, output: 8,
    sourceName: "火山方舟 模型价格", sourceUrl: "https://www.volcengine.com/docs/82379/1544106",
    verified: "2026-06-19", note: "0-32K 档；32K-128K ¥1.2/¥16；128K-256K ¥2.4/¥24。缓存价待核实",
  },

  // ——— MiniMax（国际站 USD）———
  {
    matchIds: ["minimax-m3", "minimax-m2", "minimax-text"],
    provider: "MiniMax", model: "MiniMax-M3", region: "global", currency: "USD",
    inputMiss: 0.3, inputHit: 0.06, output: 1.2,
    sourceName: "MiniMax / OpenRouter", sourceUrl: "https://openrouter.ai/minimax/minimax-m2",
    verified: "2026-06-19", note: "标准档 ≤512K 输入；>512K 为 $0.60/$0.12/$2.40",
  },

  // ——— xAI Grok（海外 USD；旧别名 grok-4/grok-3-mini 现路由到 4.3）———
  {
    matchIds: ["grok-4", "grok-4.3", "grok-3"],
    provider: "xAI", model: "Grok 4.3", region: "global", currency: "USD",
    inputMiss: 1.25, inputHit: 0.2, output: 2.5,
    sourceName: "xAI Pricing 2026", sourceUrl: "https://www.aipricing.guru/xai-pricing/",
    verified: "2026-06-19", note: "grok-4/grok-3 等旧别名现路由至 Grok 4.3",
  },
  {
    matchIds: ["grok-3-mini"],
    provider: "xAI", model: "Grok 3 mini", region: "global", currency: "USD",
    inputMiss: 0.25, inputHit: null, output: 0.5,
    sourceName: "pricepertoken", sourceUrl: "https://pricepertoken.com/pricing-page/model/xai-grok-3-mini",
    verified: "2026-06-19", needsConfirm: true, note: "旧型号，可能已并入 4.3 计价",
  },

  // ——— Groq（海外 USD）———
  {
    matchIds: ["llama-3.3-70b", "llama-3.3-70b-versatile"],
    provider: "Groq", model: "Llama 3.3 70B", region: "global", currency: "USD",
    inputMiss: 0.59, inputHit: null, output: 0.79,
    sourceName: "Groq Pricing 2026", sourceUrl: "https://www.cloudzero.com/blog/groq-pricing/",
    verified: "2026-06-19",
  },
];

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
