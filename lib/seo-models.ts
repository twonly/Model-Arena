import {
  bestStatForSlug,
  fetchModelStats,
  modelSlug,
  type ModelStat,
} from "./stats.ts";
import { DEFAULT_LOCALE, type Locale } from "./i18n.ts";
import {
  DEEPSEEK_V41_AVAILABLE_UNTIL,
  DEEPSEEK_V41_MODEL_ID,
} from "./shared-models.ts";

export interface ComparePair {
  a: ModelStat;
  b: ModelStat;
  canonical: string;
}

/**
 * 精选「已发布、待实测」模型：刚上线、已进试用池但还没攒够速度样本的新模型。
 * 用于让 /model/[slug] 在有真实数据前就渲染一个可索引的占位页（承接发布当天的
 * 「XXX 速度 / 评测」搜索），一旦累积到样本，页面自动切换成真实数据版。
 *
 * slug 必须等于 modelSlug(该模型将来在榜单上的展示名)，占位页与 live 页才同 URL。
 * 展示名由 /admin/models 的 canonical display_name 决定（见 lib/stats.ts resolve）。
 * contextTokens / priceHintZh 仅用于占位页正文，避免「薄内容」。
 */
export interface PrelaunchModel {
  slug: string;
  name: string;
  provider: string;
  /** 上下文窗口（token），用于占位页正文 */
  contextTokens?: number;
  blurbZh: string;
  blurbEn: string;
  /** 搜索页可展示的实际 API model id；未正式公开的预览型号尤其需要明确 */
  apiModelId?: string;
  /** 本站最近一次真实直连验证日期 */
  verifiedOn?: string;
  /** 限时试跑入口的自动截止时间；SEO 页面在截止后仍保留为历史说明页 */
  availableUntil?: string;
  statusZh?: string;
  statusEn?: string;
  noticeZh?: string;
  noticeEn?: string;
  metadataTitleZh?: string;
  metadataTitleEn?: string;
  metadataDescriptionZh?: string;
  metadataDescriptionEn?: string;
  sourceUrl?: string;
  sourceNameZh?: string;
  sourceNameEn?: string;
}

export const PRELAUNCH_MODELS: PrelaunchModel[] = [
  {
    slug: "deepseek-v4-1-flash",
    name: "DeepSeek V4.1 Flash",
    provider: "DeepSeek",
    apiModelId: DEEPSEEK_V41_MODEL_ID,
    verifiedOn: "2026-09-09",
    availableUntil: DEEPSEEK_V41_AVAILABLE_UNTIL,
    statusZh: "限时预览",
    statusEn: "Limited preview",
    metadataTitleZh: "DeepSeek V4.1 Flash 实测：限时预览与 API ID",
    metadataTitleEn: "DeepSeek V4.1 Flash API preview and speed test",
    metadataDescriptionZh:
      "DeepSeek V4.1 Flash 限时预览实测：临时 API ID、2026-09-09 可调用验证、9 月 10 日到期提示、公开目录状态与真实速度数据。",
    metadataDescriptionEn:
      "DeepSeek V4.1 Flash preview: verified temporary API ID, September 10 expiry notice, public catalog status, and real-world speed test data.",
    sourceUrl: "https://api-docs.deepseek.com/",
    sourceNameZh: "DeepSeek API 公开文档",
    sourceNameEn: "DeepSeek public API docs",
    noticeZh:
      "截至 2026-09-09，该临时 ID 尚未出现在 DeepSeek 公开 /models 目录，官方也未单独公布 V4.1 Flash 的价格与完整规格。本站只陈述已经直连验证的可调用性，不把它写成正式发布版。",
    noticeEn:
      "As of 2026-09-09, this temporary ID is not listed in DeepSeek's public /models catalog, and separate V4.1 Flash pricing and full specifications have not been published. TOKRACE reports only the connectivity it verified and does not present this preview as a general release.",
    blurbZh:
      "DeepSeek V4.1 Flash 限时预览已加入 TOKRACE 免费试跑池。本站于 2026-09-09 直连验证临时模型 ID 可调用；该 ID 标注 9 月 10 日到期，真实输出速度与首 Token 时延正在采集中。",
    blurbEn:
      "The limited DeepSeek V4.1 Flash preview is now in TOKRACE's free trial pool. TOKRACE verified the temporary model ID with a direct API call on 2026-09-09; the ID says it expires on September 10, while real-world output speed and TTFT samples are being collected.",
  },
  {
    slug: "kimi-k3",
    name: "Kimi K3",
    provider: "Moonshot Kimi",
    contextTokens: 1_048_576,
    blurbZh:
      "月之暗面新一代模型 Kimi K3，1,048,576 tokens 超长上下文，已加入本站免费试跑池。真实速度数据（输出 tok/s、首 Token 时延）正在采集中——欢迎来跑第一轮。",
    blurbEn:
      "Moonshot's next-gen Kimi K3 ships a 1,048,576-token context window and is now in this site's free trial pool. Real-world speed data (output tok/s, TTFT) is still being collected — be the first to run it.",
  },
];

export const prelaunchBySlug = (slug: string): PrelaunchModel | undefined =>
  PRELAUNCH_MODELS.find((m) => m.slug === slug);

export function fmtMetric(n: number, digits = 0): string {
  if (!Number.isFinite(n) || n <= 0) return "—";
  return n.toLocaleString("en-US", { maximumFractionDigits: digits });
}

export function fmtSeconds(ms: number): string {
  return ms > 0 ? `${(ms / 1000).toFixed(2)}s` : "—";
}

export async function loadModelStatsForSlug(
  slug: string
): Promise<ModelStat[] | null> {
  let stats: ModelStat[] | null = null;
  try {
    stats = await fetchModelStats();
  } catch {
    return null;
  }
  if (!stats) return null;
  const hit = stats.filter((s) => modelSlug(s.model) === slug);
  return hit.length ? hit : null;
}

export async function topModelAlternatives(
  slug: string,
  limit = 4
): Promise<{ slug: string; name: string }[]> {
  let stats: ModelStat[] | null = null;
  try {
    stats = await fetchModelStats();
  } catch {
    return [];
  }
  if (!stats) return [];
  const seen = new Set<string>();
  const out: { slug: string; name: string }[] = [];
  for (const s of stats) {
    const sl = modelSlug(s.model);
    if (sl === slug || seen.has(sl)) continue;
    seen.add(sl);
    out.push({ slug: sl, name: s.model });
    if (out.length >= limit) break;
  }
  return out;
}

export async function loadComparePair(pairParam: string): Promise<ComparePair | null> {
  const parts = pairParam.split("-vs-");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  let stats: ModelStat[] | null = null;
  try {
    stats = await fetchModelStats();
  } catch {
    return null;
  }
  if (!stats) return null;
  const a = bestStatForSlug(stats, parts[0]);
  const b = bestStatForSlug(stats, parts[1]);
  if (!a || !b || modelSlug(a.model) === modelSlug(b.model)) return null;
  const canonical = [modelSlug(a.model), modelSlug(b.model)].sort().join("-vs-");
  return { a, b, canonical };
}

export function compareVerdict(
  a: ModelStat,
  b: ModelStat,
  locale: Locale = DEFAULT_LOCALE
): string {
  if (locale === "en") {
    const out =
      a.medianContentTps === b.medianContentTps
        ? `Both models have similar output speed (about ${fmtMetric(a.medianContentTps)} tok/s)`
        : a.medianContentTps > b.medianContentTps
          ? `${a.model} has faster output (median ${fmtMetric(a.medianContentTps)} vs ${fmtMetric(b.medianContentTps)} tok/s)`
          : `${b.model} has faster output (median ${fmtMetric(b.medianContentTps)} vs ${fmtMetric(a.medianContentTps)} tok/s)`;
    let ttft = "";
    if (a.avgTtftMs > 0 && b.avgTtftMs > 0) {
      ttft =
        a.avgTtftMs < b.avgTtftMs
          ? `; ${a.model} has faster TTFT (${fmtSeconds(a.avgTtftMs)} vs ${fmtSeconds(b.avgTtftMs)})`
          : a.avgTtftMs > b.avgTtftMs
            ? `; ${b.model} has faster TTFT (${fmtSeconds(b.avgTtftMs)} vs ${fmtSeconds(a.avgTtftMs)})`
            : "";
    }
    return out + ttft + ".";
  }
  const out =
    a.medianContentTps === b.medianContentTps
      ? `两者输出速度接近（约 ${fmtMetric(a.medianContentTps)} tok/s）`
      : a.medianContentTps > b.medianContentTps
        ? `${a.model} 输出更快（中位 ${fmtMetric(a.medianContentTps)} vs ${fmtMetric(b.medianContentTps)} tok/s）`
        : `${b.model} 输出更快（中位 ${fmtMetric(b.medianContentTps)} vs ${fmtMetric(a.medianContentTps)} tok/s）`;
  let ttft = "";
  if (a.avgTtftMs > 0 && b.avgTtftMs > 0) {
    ttft =
      a.avgTtftMs < b.avgTtftMs
        ? `；${a.model} 首响更快（${fmtSeconds(a.avgTtftMs)} vs ${fmtSeconds(b.avgTtftMs)}）`
        : a.avgTtftMs > b.avgTtftMs
          ? `；${b.model} 首响更快（${fmtSeconds(b.avgTtftMs)} vs ${fmtSeconds(a.avgTtftMs)}）`
          : "";
  }
  return out + ttft + "。";
}
