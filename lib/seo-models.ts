import {
  bestStatForSlug,
  statSlug,
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
  reviewPath?: string;
}

export const PRELAUNCH_MODELS: PrelaunchModel[] = [
  {
    slug: "nemotron-3-5-super-vl",
    name: "Nemotron 3.5 Super VL",
    provider: "NVIDIA · OpenRouter",
    apiModelId: "nvidia/nemotron-3.5-super-vl:free",
    verifiedOn: "2026-11-04",
    sourceUrl: "https://huggingface.co/nvidia/NVIDIA-Nemotron-3.5-Super-VL-120B-A12B-BF16",
    sourceNameZh: "NVIDIA 官方 BF16 参考模型卡",
    sourceNameEn: "NVIDIA BF16 reference model card",
    reviewPath: "/guides/nemotron-3-5-super-vl-creative",
    metadataTitleZh: "NVIDIA Nemotron 3.5 Super VL 评测：3D、知识视频与 SVG",
    metadataTitleEn: "NVIDIA Nemotron 3.5 Super VL Review: 3D, Video and SVG",
    metadataDescriptionZh: "NVIDIA Nemotron 3.5 Super VL 模型介绍与 11 项创作任务结果，附真实作品、源码、官方图、逐项质量问题及交付限制。",
    metadataDescriptionEn: "NVIDIA Nemotron 3.5 Super VL profile and eleven creative-task outcomes, with actual artifacts, source files, official figures and delivery limitations.",
    blurbZh: "通过 OpenRouter 精确免费路由执行 Blender、知识视频和 SVG 创作任务，保留真实交付、质量检查及供应商中断记录。",
    blurbEn: "Blender, knowledge-video and SVG tasks through the exact OpenRouter free route, retaining actual delivery, quality checks and provider interruptions.",
    noticeZh: "BF16 参考权重与 NVFP4 量化发布分别记录；本次免费端点服务精度未明确。公开结果保留未交付和质量问题；免费路由不等于已验证整批零成本。",
    noticeEn: "BF16 reference weights and the NVFP4 release are distinct; the free endpoint's served precision is not established. Missing delivery and quality issues remain visible. A free route does not establish a complete zero-cost batch bill.",
  },
  {
    slug: "dots3-note-preview",
    name: "Dots3-Note Preview",
    provider: "Dots Studio · OpenRouter",
    apiModelId: "dots-studio/dots-3-note-preview:free",
    contextTokens: 512_000,
    verifiedOn: "2026-11-03",
    sourceUrl: "https://huggingface.co/dots-studio/dots3-note-prev",
    sourceNameZh: "Dots Studio 官方模型卡",
    sourceNameEn: "Official Dots Studio model card",
    reviewPath: "/guides/dots3-note-preview",
    metadataTitleZh: "Dots3-Note Preview 评测：免费 SVG 与动画实测",
    metadataTitleEn: "Dots3-Note Preview Review: Free SVG and Animation Tests",
    metadataDescriptionZh: "Dots3-Note Preview 开放权重模型介绍与四项 SVG 实测：钟表、图表、中文海报和骑车动画，附原始作品、官方图表与用量。",
    metadataDescriptionEn: "Dots3-Note Preview open-weight model profile and four SVG tests: clock, chart, Chinese poster and cycling animation, with source files, official figures and usage.",
    blurbZh: "通过 OpenRouter 免费路由完成三项静态 SVG 和一项骑车动画，五次请求均报告 $0 推理费用。保留图表缺少季度标签和动画关节不自然等问题。",
    blurbEn: "Three static SVGs and one cycling animation through OpenRouter's free route. Five requests reported $0 inference cost; missing chart labels and rigid animation joints remain visible.",
    noticeZh: "公开权重采用 Apache 2.0；本次 API 使用精确免费模型 ID。页面仅评价四项 SVG 作品，Blender 与知识视频尚未交付。512K 上下文为路由规格，未验证满长上下文；免费额度与路由可用性以 OpenRouter 当前规则为准。",
    noticeEn: "Weights are published under Apache 2.0. The API run used the exact free model ID and evaluates four SVG outputs; Blender and knowledge-video deliverables are incomplete. The listed 512K context was not tested at full length. Free limits and route availability follow OpenRouter's current rules.",
  },
  {
    slug: "longcat-2-5",
    name: "LongCat-2.5",
    provider: "Meituan LongCat",
    apiModelId: "LongCat-2.5",
    contextTokens: 1_048_576,
    verifiedOn: "2026-11-02",
    sourceUrl: "https://longcat.ai/blog/longcat-2.5/",
    reviewPath: "/guides/longcat-2-5-release",
    metadataTitleZh: "LongCat 2.5 正式版评测：Claude Code、3D 与 API 价格",
    metadataTitleEn: "LongCat 2.5 Release: Claude Code Review and API Pricing",
    metadataDescriptionZh: "美团 LongCat 2.5 正式版解读，附真实 API 型号、官方 benchmark 原图、思考开关与文本代码、Blender、SVG 和知识视频评测。保留失败和工程下载。",
    metadataDescriptionEn: "LongCat 2.5 release identity, official benchmarks, pricing, thinking controls and actual text, code, Blender, SVG and knowledge-video tests with source files and failures.",
    blurbZh: "2026 年 11 月 2 日正式版独立评测：已实测 LongCat-2.5 API，公开官方跑分原图与本地 Claude Code 创作结果。",
    blurbEn: "Independent November 2, 2026 release evaluation with a verified LongCat-2.5 API response, official benchmark originals and local Claude Code outputs.",
    noticeZh: "正式版和 Preview 分别记录；模型 API ID 不等于固定 checkpoint。官方最大输出文档存在 128K / 256K 差异，未验证满长上下文；API 单价及额度以官方平台结算为准。",
    noticeEn: "Release and Preview runs are separate. An API ID is not a pinned checkpoint. Official documents disagree on 128K / 256K maximum output; full long-context operation is untested. Billing and quotas follow the provider platform.",
  },
  {
    slug: "kimi-k3-1-pro",
    name: "Kimi K3.1 Pro",
    provider: "Moonshot Kimi",
    apiModelId: "k3.1-pro",
    contextTokens: 1_048_576,
    verifiedOn: "2026-10-24",
    sourceUrl: "https://www.kimi.ai/blog/kimi-k3-1-pro",
    reviewPath: "/guides/kimi-k3-1-pro",
    metadataTitleZh: "Kimi K3.1 Pro 评测：Benchmark、代码、SVG 与动画",
    metadataTitleEn: "Kimi K3.1 Pro Review: Benchmarks, Code, SVG and Animation",
    metadataDescriptionZh: "Kimi K3.1 Pro 评测：官方与 AA 跑分原图、官方示例视频、API 价格及文本代码、SVG 与动画实测。附 Pro 频限截图、额度恢复补测、三组动画对照及完整重试证据。",
    metadataDescriptionEn: "Kimi K3.1 Pro review with benchmark originals, official demos, text/code/SVG tests, three animation groups, a historical Pro quota snapshot and recovery evaluation evidence.",
    blurbZh: "Kimi K3.1 Pro 原生 Anthropic Messages 文本、代码、SVG 与动画评测，附官方与 AA 原图、官方视频、Pro 频限经历与额度恢复后的独立补测。原始输出和失败记录可查。",
    blurbEn: "Kimi K3.1 Pro native Anthropic Messages text, code, SVG and animation evidence, benchmark originals, official demos, and an independent quota-recovery batch with original failures retained.",
    noticeZh: "官方按量 API 使用 kimi-k3.1-pro，Kimi Coding 个人订阅使用 k3.1-pro，不能混用 ID 或成本口径。1M 上下文与长任务能力为官方规格，本站短任务不验证这些能力。官方计划 11 月 4 日前公开权重，当前尚未发布权重。",
    noticeEn: "The pay-as-you-go API uses kimi-k3.1-pro; personal Kimi Coding subscriptions use k3.1-pro. IDs and billing bases differ. The official 1M context and long-task capabilities are not verified by short tasks. Weights are planned by November 4 and were not yet published when checked.",
  },
  {
    slug: "minimax-m3-1-flash",
    name: "MiniMax M3.1 Flash · Space Bunny",
    metadataTitleZh: "MiniMax M3.1 Flash：Space Bunny 身份、价格与实测",
    metadataTitleEn: "MiniMax M3.1 Flash: Space Bunny, Pricing and Tests",
    metadataDescriptionZh: "MiniMax M3.1 Flash 正式版介绍：Space Bunny 身份揭晓，1M 上下文、官方 API 价格、46 次实测结果与免费复测入口。",
    metadataDescriptionEn: "MiniMax M3.1 Flash identity, Space Bunny history, 1M context, official API pricing, 46 original test attempts and a trial.",
    provider: "MiniMax",
    apiModelId: "MiniMax-M3.1-Flash",
    contextTokens: 1_000_000,
    verifiedOn: "2026-10-20",
    sourceUrl: "https://www.minimax.io/blog/minimax-m31f",
    reviewPath: "/guides/minimax-m3-1-flash",
    blurbZh: "MiniMax M3.1 Flash / Space Bunny：46 次任务测试、low / max SVG 成图与鹈鹕骑车动画、失败重试记录及官方 benchmark 原图。",
    blurbEn: "MiniMax M3.1 Flash / Space Bunny: 46 task attempts, low/max SVG outputs, cycling animations, retry evidence and official benchmark figures.",
    noticeZh: "MiniMax 于 2026-10-19 确认 Space Bunny 是 M3.1 Flash 的早期版本。10 月 20 日本站直连正式 API ID 测试；上下文 1M，默认 max 思考，不能关闭。历史匿名版、Preview 与正式版分开记录，不视为相同权重或可直接比较的速度基线。",
    noticeEn: "MiniMax confirmed on October 19 that Space Bunny was an early version of M3.1 Flash. TOKRACE tested the release API ID on October 20. Official docs list 1M context and mandatory thinking, default max. Anonymous, Preview and release evidence stays separate; identical weights or directly comparable latency are not assumed.",
  },
  {
    slug: "deepseek-flash",
    name: "DeepSeek V4.1 Flash 1017",
    provider: "DeepSeek",
    apiModelId: "deepseek-flash",
    contextTokens: 1_000_000,
    verifiedOn: "2026-10-18",
    sourceUrl: "https://api-docs.deepseek.com/updates/",
    reviewPath: "/guides/deepseek-v4-1-flash-1017",
    blurbZh: "DeepSeek V4.1 Flash 1017：36 次文本/代码测试，关闭 / 默认 / low / max SVG 与鹈鹕动画对照，保留失败重试及 2 张官方 benchmark 原图。",
    blurbEn: "DeepSeek V4.1 Flash 1017: 36 text/code attempts, off/default/low/max SVG and pelican-animation comparisons, retry evidence and two official benchmark figures.",
    noticeZh: "官方于 2026-10-17 将 deepseek-flash 升级至 1017，调用方式与价格不变。2026-10-18 本站直连测试；响应仍返回 deepseek-flash 别名，版本对应关系依据官方文档。首测为本地客户端测量，不与香港标准报告混排；10 月 20 日补充 SVG 代码绘图测试；未验证长上下文、视觉理解或 Agent 能力。",
    noticeEn: "The official October 17 update maps deepseek-flash to 1017 without changing API calls or prices. TOKRACE tested the official endpoint on October 18; responses return the alias, so checkpoint attribution relies on official docs. Local-client results remain separate from Hong Kong standard reports. SVG drawing tests were added on October 20. Long context, visual understanding and agent capabilities were not tested.",
  },
  {
    slug: "longcat-2-5-preview",
    name: "美团 LongCat 2.5 Preview",
    provider: "Meituan LongCat",
    apiModelId: "LongCat-2.5-Preview",
    contextTokens: 1_000_000,
    verifiedOn: "2026-10-10",
    sourceUrl: "https://longcat.ai/platform/docs/zh/api/chat",
    reviewPath: "/guides/longcat-2-5-preview",
    blurbZh: "LongCat 2.5 Preview：33 次文本/代码测试，思考开启 / 关闭的 SVG 成图、失败重试和鹈鹕骑车动画测试，公开原始记录。",
    blurbEn: "LongCat 2.5 Preview: 33 text/code attempts, thinking-on/off SVG outputs, retries and cycling-pelican animation tests with original evidence.",
    noticeZh: "2026-10-10 直连验证准确 API ID 可调用。10 月 21 日官方参数页列出 100 万 token 上下文、256K 输出上限和思考开关；新增 SVG 重试与动画测试；未验证长上下文、视觉理解或工具调用。官方限时单价与 TOKRACE 免费额度分开说明，实际费用以结算为准。",
    noticeEn: "The exact API ID was callable on October 10, 2026. The October 21 parameter reference lists 1M context, 256K maximum output and a thinking switch. SVG retries and animation tests were added. Long context, visual understanding and tools remain untested. Official promotional prices and TOKRACE free quotas are separate; invoices determine actual charges.",
  },
  {
    slug: "minimax-m3-1-flash-preview",
    name: "MiniMax M3.1 Flash Preview",
    provider: "MiniMax",
    apiModelId: "MiniMax-M3.1-Flash-Preview",
    contextTokens: 1_000_000,
    verifiedOn: "2026-10-03",
    sourceUrl: "https://platform.minimax.io/docs/guides/text-generation",
    reviewPath: "/guides/minimax-m3-1-flash-preview",
    blurbZh: "MiniMax M3.1 Flash Preview 已接入 TOKRACE 免费试用，附 15 道短文本任务的首测与原始回答。",
    blurbEn: "MiniMax M3.1 Flash Preview is available in TOKRACE trials, with a 15-task text review and original answers.",
    noticeZh: "官方文档标注 100 万 token 上下文、多模态输入与五档推理强度，默认 max 且不能关闭思考；这些规格不由短文本首测验证。2026-10-03 已验证指定 API ID 可调用，公开 /models 目录暂未列出。TOKRACE 试用沿用现有额度，保留默认推理强度；上游使用订阅额度，按 token 单价未知，不按零成本排名。",
    noticeEn: "Official docs list 1M context, multimodal input and five effort levels, defaulting to max with thinking always on. Our short text test does not verify these capabilities. The exact API ID was callable on October 3, 2026, despite being absent from /models. TOKRACE trials use existing quotas and default effort. Upstream access uses subscription limits; per-token pricing is unknown and is not ranked as zero cost.",
  },
  {
    slug: "space-bunny-alpha",
    name: "Space Bunny Alpha",
    metadataTitleZh: "Space Bunny 身份揭晓：MiniMax M3.1 Flash 早期版本",
    metadataTitleEn: "Space Bunny Revealed: An Early MiniMax M3.1 Flash",
    metadataDescriptionZh: "Space Bunny 是 MiniMax M3.1 Flash 的早期版本。保留 9 月 27 日原始测试，说明旧接口 404 状态，并提供正式版新评测。",
    metadataDescriptionEn: "Space Bunny was an early MiniMax M3.1 Flash. Original September results, old endpoint availability and a separate released-model review.",
    provider: "MiniMax · OpenRouter historical preview",
    apiModelId: "stealth/space-bunny-alpha",
    contextTokens: 1_000_000,
    verifiedOn: "2026-10-20",
    sourceUrl: "https://www.minimax.io/blog/minimax-m31f",
    reviewPath: "/guides/minimax-m3-1-flash",
    blurbZh: "Space Bunny 的身份已揭晓：MiniMax M3.1 Flash 的早期版本；保留匿名时期实测，另附正式版新评测。",
    blurbEn: "Space Bunny is revealed as an early MiniMax M3.1 Flash. Historical anonymous tests are retained alongside a separate release review.",
    noticeZh: "2026-10-19 官方确认 Space Bunny 的身份。2026-10-20 旧 OpenRouter ID 返回 404（No endpoints found），本站停用该体验入口，不自动改用收费或正式版路由。9 月 27 日的免费价格与测试仅代表当时。请阅读正式版评测；历史证据保持原始版本。",
    noticeEn: "MiniMax revealed Space Bunny on October 19. On October 20 its old OpenRouter ID returned 404 (No endpoints found); TOKRACE retired that trial without silently switching routes. September 27 prices and tests remain historical. Read the release review for current evidence; original records are preserved.",
  },
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
  {
    slug: "crouton-alpha",
    name: "Crouton Alpha",
    provider: "Anonymous · OpenRouter",
    apiModelId: "stealth/crouton-alpha",
    contextTokens: 1_048_576,
    verifiedOn: "2026-11-04",
    sourceUrl: "https://openrouter.ai/stealth/crouton-alpha",
    sourceNameZh: "OpenRouter 模型页（Crouton Alpha）",
    sourceNameEn: "OpenRouter model page (Crouton Alpha)",
    reviewPath: "/guides/crouton-alpha-creative",
    metadataTitleZh: "Crouton Alpha 创作评测：Blender、知识视频、SVG 与动画",
    metadataTitleEn: "Crouton Alpha creative review: Blender, knowledge videos, SVG and animation",
    metadataDescriptionZh: "Crouton Alpha 匿名模型创作评测：Blender、知识视频、SVG 与动画真实作品。底层厂商未公开，未复现官方跑分。",
    metadataDescriptionEn: "Crouton Alpha anonymous-model creative review with Blender, knowledge-video, SVG and animation artifacts. Underlying vendor undisclosed; no official benchmarks reproduced.",
    blurbZh: "Crouton Alpha 本次在 OpenCode v2.2.5 中以 openrouter/stealth/crouton-alpha 运行。OpenRouter 列出 2026 年 11 月 3 日发布与零 token 价格；未发现官方 benchmark 图。",
    blurbEn: "Crouton Alpha ran in OpenCode v2.2.5 via openrouter/stealth/crouton-alpha. OpenRouter lists a November 3, 2026 release and zero token pricing; no official benchmark images were found.",
    noticeZh: "Crouton Alpha 为匿名模型，底层厂商与固定 checkpoint 未公开，未视为与任何已知模型相同，OpenRouter 不是其开发者。2026 年 11 月 3 日发布与零价格均为 OpenRouter 列出元数据；额度与可用性以服务平台当前规则为准。",
    noticeEn: "Crouton Alpha is anonymous; underlying vendor and fixed checkpoint remain undisclosed. It is not identified with any known model and OpenRouter is not its developer. The November 3, 2026 release date and zero prices are OpenRouter-listed metadata; quotas and availability follow the service platform current rules.",
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
  slug: string,
): Promise<ModelStat[] | null> {
  let stats: ModelStat[] | null = null;
  try {
    stats = await fetchModelStats(1, 0);
  } catch {
    return null;
  }
  if (!stats) return null;
  const hit = stats.filter((s) => statSlug(s) === slug);
  return hit.length ? hit : null;
}

export async function topModelAlternatives(
  slug: string,
  limit = 4,
): Promise<{ slug: string; name: string }[]> {
  let stats: ModelStat[] | null = null;
  try {
    stats = await fetchModelStats(1, 0);
  } catch {
    return [];
  }
  if (!stats) return [];
  const seen = new Set<string>();
  const out: { slug: string; name: string }[] = [];
  for (const s of stats) {
    const sl = statSlug(s);
    if (sl === slug || seen.has(sl)) continue;
    seen.add(sl);
    out.push({ slug: sl, name: s.model });
    if (out.length >= limit) break;
  }
  return out;
}

export async function loadComparePair(
  pairParam: string,
): Promise<ComparePair | null> {
  const parts = pairParam.split("-vs-");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  let stats: ModelStat[] | null = null;
  try {
    stats = await fetchModelStats(1, 0);
  } catch {
    return null;
  }
  if (!stats) return null;
  const a = bestStatForSlug(stats, parts[0]);
  const b = bestStatForSlug(stats, parts[1]);
  if (!a || !b || statSlug(a) === statSlug(b)) return null;
  const canonical = [statSlug(a), statSlug(b)].sort().join("-vs-");
  return { a, b, canonical };
}

export function compareVerdict(
  a: ModelStat,
  b: ModelStat,
  locale: Locale = DEFAULT_LOCALE,
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
