import { REVIEW_PRESENTATION_UPDATED_AT } from "@/lib/model-review-presentation";
import Image from "next/image";
import Link from "next/link";
import { InfoPage, infoMetadata } from "@/components/InfoPage";
import { ArticleNavigation, type ArticleSection } from "@/components/ArticleNavigation";
import { JsonLd } from "@/components/JsonLd";
import { VisualEvaluation, type VisualEvaluationData } from "@/components/VisualEvaluation";
import type { VisualSupplementData } from "@/components/VisualSupplement";
import { BRAND } from "@/lib/brand";
import { BENCHMARK_CASES, checkCase } from "@/lib/benchmark-suite";
import { DEFAULT_LOCALE, localizedPath, normalizeLocale } from "@/lib/i18n";
import { DATASET_LICENSE_URL } from "@/lib/structured-data";
import rawReview from "@/public/evaluations/kimi-k3-1-pro.json";
import rawStopped from "@/public/evaluations/kimi-k3-1-pro-coding-stopped.json";
import rawVisuals from "@/public/evaluations/kimi-k3-1-pro-visual.json";
import rawSupplement from "@/public/evaluations/kimi-k3-1-pro-supplement.json";
import rawRecovery from "@/public/evaluations/kimi-k3-1-pro-resume-20261024.json";
import sources from "@/public/evaluations/kimi-k3-1-pro/sources.json";
import quotaObservation from "@/public/evaluations/kimi-k3-1-pro/official-examples/quota-observation.json";
import rawXMedia from "@/public/evaluations/kimi-k3-1-pro/official-examples/x-post.json";
import rawOfficialMedia from "@/public/evaluations/kimi-k3-1-pro/official-examples.json";
import creativeReview from "@/public/evaluations/kimi-k3-1-pro-creative.json";

const pathname = "/guides/kimi-k3-1-pro";
const evidencePath = "/evaluations/kimi-k3-1-pro.json";
const visualEvidencePath = "/evaluations/kimi-k3-1-pro-visual.json";
const supplementEvidencePath = "/evaluations/kimi-k3-1-pro-supplement.json";
const recoveryEvidencePath = "/evaluations/kimi-k3-1-pro-resume-20261024.json";
const sourceEvidencePath = "/evaluations/kimi-k3-1-pro/sources.json";
const officialUrl = "https://www.kimi.ai/blog/kimi-k3-1-pro";
const aaUrl = "https://artificialanalysis.ai/articles/kimi-k3-1-pro-launch-benchmarks";
const officialXUrl = "https://x.com/Kimi_Moonshot/status/2113681863109939271";
type Attempt = {
  id: string; mode: string; title: string; titleEn: string; prompt: string; text: string;
  status: string; pass?: boolean; httpStatus?: number | null; startedAt: string; totalMs?: number | null; firstContentMs?: number | null;
  promptTokens?: number | null; outputTokens?: number | null; reasoningTokens?: number | null;
  usageFinal?: boolean; usageComplete?: boolean;
  finishReason?: string | null; error?: string | null; request?: Record<string, unknown> & { max_tokens?: number };
};
type ReviewEvidence = {
  status?: string; publishedAt: string; endpoint: string; model: string; protocol?: string; requestUrl?: string; quotaResetAt?: string;
  plannedFirstRequests?: number; actualFirstRequests?: number; notDispatchedCount?: number;
  totalRequests?: number; additionalRetryCount?: number; diagnosticRequestCount?: number;
  cumulativeRequestMs?: number; wallClockSpanMs?: number;
  params?: { maxTokens?: number; timeoutMs?: number; effectiveTemperature?: number; samplingParametersOmitted?: boolean };
  editorial: Record<"en" | "zh-CN", { summary: string }>;
  sources: (string | { url: string })[]; attempts: Attempt[];
  coding: (Attempt & { checkCount: number; checks: string; checkError?: string | null })[];
  stoppedBatches?: { path: string; reasonZh: string; reasonEn: string; requestCount: number; completedCount: number; interruptedCount: number; source: string }[];
  probeEvidencePath?: string;
};
type CodeAttempt = ReviewEvidence["coding"][number];
type Coverage = { planned: number; completed: number; passed: number | null; remaining: number };
type RecoveryEvidence = {
  status: string; updatedAt: string; startedAt: string; date: string; requestCount: number; plannedRecoverySlots: number;
  methodZh: string; methodEn: string; requestUrl: string; model: string; cumulativeRequestMs: number;
  attempts: Attempt[]; coding: CodeAttempt[]; groups: VisualSupplementData["groups"];
  trials: (Attempt & { animationRender?: { path: string }; renderError?: string; finishedAt?: string })[];
  combinedCoverage: { text: Coverage; coding: Coverage; static: Coverage; animation: Coverage };
  failureCounts: { quota: number; truncated: number; timeout?: number; networkOrServer: number };
  counting: { previousNativeMessagesRequests: number; recoveryNativeRequests: number; combinedNativeMessagesRequests: number };
  sources: { url: string; title: string }[];
};
const review = rawReview as ReviewEvidence;
const recovery = rawRecovery as RecoveryEvidence;
const stopped = rawStopped as { endpoint: string; model: string; attempts: Attempt[] };
const hasOriginalTests = review.attempts.length + review.coding.length > 0;
const isCodingSubscription = review.endpoint.includes("/coding");
const isPartial = hasOriginalTests && Object.values(recovery.combinedCoverage).some(value => typeof value === "object" && value.remaining > 0);
const visuals = rawVisuals as VisualEvaluationData;
const supplement = rawSupplement as VisualSupplementData;
const titleZh = hasOriginalTests ? "Kimi K3.1 Pro 评测：官方与 AA 跑分、价格及原始实测" : "Kimi K3.1 Pro 发布评析：官方与 AA 跑分、价格及评测进度";
const titleEn = hasOriginalTests ? "Kimi K3.1 Pro review: benchmarks, pricing and original test evidence" : "Kimi K3.1 Pro launch analysis: benchmarks, pricing and testing status";
const descriptionZh = hasOriginalTests ? (isPartial ? "Kimi K3.1 Pro 部分实测与额度恢复补测：原生 API 文本、代码与 SVG 结果，附 11 张原始 benchmark 图及新增官方示例、视频。一个 Pro 会员未跑完评测就触发 5 小时频限，附控制台快照与预算重试记录。" : "Kimi K3.1 Pro 实测补齐：45 份完整文本回答、9 份完整代码回答、12 张静态 SVG 与 3 组骑车动画。附官方与 AA benchmark 原图、官方视频、API 价格、Pro 频限经历和额度恢复后的原始证据，保留全部失败与重试。") : "Kimi K3.1 Pro 发布解读：11 张官方与 Artificial Analysis benchmark 原图、1M 上下文及 API 价格。完整实测证据尚未齐备，单独保留 22 次已完成短文本与 1 次中断记录。";
const descriptionEn = hasOriginalTests ? (isPartial ? "Kimi K3.1 Pro partial native API tests and independent quota-recovery results, 11 original benchmark figures and official examples/videos. One Pro membership hit its five-hour limit before completion; console snapshot and budget retries included." : "Kimi K3.1 Pro review: 45 complete text answers, 9 complete code answers, 12 SVGs and 3 cycling animations, with benchmark originals, official demos and quota-recovery evidence.") : "Kimi K3.1 Pro launch analysis with 11 official and AA benchmark originals, context and prices. Complete evaluation evidence is pending; 22 completed short text requests and one interruption remain archived separately.";
const modeLabels = { default: { zh: "请求参数：默认（省略 effort）", en: "Requested: default (effort omitted)" }, low: { zh: "请求参数：low", en: "Requested: low" }, max: { zh: "请求参数：max", en: "Requested: max" } };
type Props = { params: Promise<{ lang: string }> };
type SourceImage = (typeof sources.images)[number];
type OfficialMedia = {
  id: string; type: "image" | "video" | "document" | "interactive";
  path?: string; originalUrl?: string; url?: string; sourcePage: string; credit: string;
  width?: number; height?: number; durationSeconds?: number; posterPath?: string;
  mimeType?: string; pageCount?: number; publishedAt?: string | null; sourcePublishedAt?: string | null;
  titleZh: string; titleEn: string; altZh: string; altEn: string; captionZh: string; captionEn: string;
  sources?: { path: string; mimeType: string }[]; isExistingBenchmark?: boolean;
  externalAssetAttribution?: string; originalBytes?: boolean;
};
type OfficialMediaCollection = {
  sourcePage: string; capturedAt: string; updatedAt?: string; publishedAt?: string | null;
  disclaimerZh: string; disclaimerEn: string; credit: string; items: OfficialMedia[];
  status?: string; reasonZh?: string; reasonEn?: string;
};
const xMedia = rawXMedia as OfficialMediaCollection;
const officialMedia = rawOfficialMedia as OfficialMediaCollection;
const mediaCollections = [officialMedia, xMedia];
const articleModifiedAt = new Date(Math.max(Date.parse(creativeReview.updatedAt), Date.parse(supplement.updatedAt), Date.parse(recovery.updatedAt), Date.parse(quotaObservation.addedAt), ...mediaCollections.map(collection => Date.parse(collection.updatedAt ?? collection.capturedAt)))).toISOString();

function finalSlots<T extends Attempt>(records: T[]): T[] {
  const slots = new Map<string, T>();
  for (const record of records) {
    const key = `${record.id}-${record.mode}`;
    if (slots.get(key)?.status !== "done" || record.status === "done") slots.set(key, record);
  }
  return [...slots.values()];
}

function mergeVisualFailures(original: VisualSupplementData["failureCounts"], trials: RecoveryEvidence["trials"], running: boolean) {
  const counts = { ...original, quota: 0 };
  for (const trial of trials) {
    if (trial.httpStatus === 429) counts.quota++;
    else if (trial.httpStatus != null && trial.httpStatus >= 500) counts.overload++;
    else if (trial.status === "truncated") counts.truncated++;
    else if (/timeout|timed out|ETIMEDOUT/i.test(trial.error ?? "")) counts.timeout++;
    else if (trial.status === "interrupted" && (trial.finishedAt || !running)) counts.interrupted++;
    else if (trial.status === "error") counts.connection++;
    else if (trial.renderError) counts.invalidSvg++;
  }
  return counts;
}

function medianSeconds(values: (number | null | undefined)[]) {
  const sorted = values.filter((value): value is number => typeof value === "number" && Number.isFinite(value)).sort((a, b) => a - b);
  if (!sorted.length) return "—";
  return (((sorted[Math.floor((sorted.length - 1) / 2)] + sorted[Math.floor(sorted.length / 2)]) / 2) / 1000).toFixed(2) + "s";
}

function SourceFigure({ image, en }: { image: SourceImage; en: boolean }) {
  return <figure id={image.id} className="overflow-hidden rounded-xl border border-line bg-card">
    <h3 className="p-4 font-bold text-ink">{en ? image.titleEn : image.titleZh}</h3>
    <a href={image.path} target="_blank" rel="noopener noreferrer" aria-label={(en ? "Open original figure: " : "打开完整原图：") + (en ? image.titleEn : image.titleZh)}>
      <Image src={image.path} width={image.width} height={image.height} alt={en ? (image.kind === "aa" ? image.titleEn : image.altEn) : image.altZh} unoptimized className="h-auto w-full cursor-zoom-in bg-white" />
    </a>
    <figcaption className="space-y-2 p-4">
      <p>{en ? image.captionEn : image.captionZh}</p>
      <p className="text-xs">{image.credit} · <a href={image.sourceUrl}>{en ? "Source article" : "来源原文"}</a>{" · "}<a href={image.originalUrl} target="_blank" rel="noopener noreferrer">{en ? "Original image URL" : "来源图片地址"}</a>{" · "}<a href={image.path} target="_blank" rel="noopener noreferrer">{en ? "Zoom / download" : "放大 / 下载"}</a></p>
    </figcaption>
  </figure>;
}

function OfficialMediaFigure({ item, en }: { item: OfficialMedia; en: boolean }) {
  const title = en ? item.titleEn : item.titleZh;
  const downloadPath = item.path ?? item.originalUrl ?? item.url;
  return <figure id={item.id} className="min-w-0 overflow-hidden rounded-xl border border-line bg-card">
    <h4 className="p-4 font-bold text-ink">{title}</h4>
    {item.type === "video" && item.path ? <video controls playsInline preload="none" poster={item.posterPath} width={item.width} height={item.height} aria-label={en ? item.altEn : item.altZh} className="h-auto w-full bg-black">
      {item.sources?.length ? item.sources.map(source => <source key={source.path} src={source.path} type={source.mimeType} />) : <source src={item.path} type={item.mimeType} />}
      <a href={item.path}>{en ? "Open the video file" : "打开视频文件"}</a>
    </video> : item.type === "image" && item.path && item.width && item.height ? <a href={item.path} target="_blank" rel="noopener noreferrer"><Image src={item.path} width={item.width} height={item.height} alt={en ? item.altEn : item.altZh} unoptimized loading="lazy" className="h-auto w-full cursor-zoom-in bg-white" /></a> : item.type === "document" && item.posterPath ? <a href={downloadPath} target="_blank" rel="noopener noreferrer"><img src={item.posterPath} alt={en ? item.altEn : item.altZh} loading="lazy" className="max-h-[28rem] w-full bg-white object-contain" /></a> : null}
    <figcaption className="space-y-2 p-4">
      <p>{en ? item.captionEn : item.captionZh}</p>
      {item.type === "video" && item.originalBytes === false && <p className="text-xs">{en ? "Web-optimized version; the original video is linked under Original media URL." : "网页优化版；原始视频见原始媒体地址。"}</p>}
      {item.externalAssetAttribution && <p className="break-words text-xs">{en ? "Original asset credits: " : "原页面素材署名："}{item.externalAssetAttribution}</p>}
      {item.type === "interactive" && <p><a href={item.url ?? item.originalUrl} target="_blank" rel="noopener noreferrer">{en ? "Open the official interactive example ↗" : "打开官方交互示例 ↗"}</a></p>}
      <p className="text-xs">{item.credit} · <a href={item.sourcePage}>{en ? "Source" : "来源原文"}</a>{downloadPath && <>{" · "}<a href={downloadPath} download={item.path ? true : undefined} target="_blank" rel="noopener noreferrer">{item.type === "interactive" ? (en ? "Official example URL" : "官方示例地址") : (en ? "Download media file" : "下载媒体文件")}</a></>}{item.originalUrl && item.originalUrl !== downloadPath && <>{" · "}<a href={item.originalUrl} target="_blank" rel="noopener noreferrer">{en ? "Original media URL" : "原始媒体地址"}</a></>}</p>
    </figcaption>
  </figure>;
}

function OfficialMediaGroup({ data, title, manifestPath, en }: { data: OfficialMediaCollection; title: string; manifestPath: string; en: boolean }) {
  const items = data.items.filter(item => !item.isExistingBenchmark);
  return <details className="rounded-xl border border-line bg-card p-4">
    <summary className="cursor-pointer font-bold text-ink">{title} · {en ? `${items.length} ${items.length === 1 ? "item" : "items"}` : `${items.length} 项`}</summary>
    <p className="mt-3">{en ? data.disclaimerEn : data.disclaimerZh}</p>
    {items.length ? <div className="mt-5 space-y-6">{items.map(item => <OfficialMediaFigure key={item.id} item={item} en={en} />)}</div> : <p>{en ? data.reasonEn : data.reasonZh}</p>}
    <p className="mt-4 text-xs">{data.credit} · <a href={data.sourcePage}>{en ? "Official source" : "官方来源"}</a>{" · "}<a href={manifestPath}>{en ? "Media provenance and file hashes" : "媒体来源与文件哈希"}</a></p>
  </details>;
}

export async function generateMetadata({ params }: Props) {
  const locale = normalizeLocale((await params).lang) ?? DEFAULT_LOCALE;
  const en = locale === "en";
  const title = en ? titleEn : titleZh;
  const description = en ? descriptionEn : descriptionZh;
  const metadata = infoMetadata(locale, pathname, title, description);
  const hero = sources.images.find(image => image.id === "aa-intelligence-index") ?? sources.images[0];
  const images = [{ url: hero.path, width: hero.width, height: hero.height, alt: en ? hero.altEn : hero.altZh }];
  return {
    ...metadata,
    keywords: ["Kimi K3.1 Pro", "Kimi K3.1", "Moonshot AI", "Kimi K3.1 Pro benchmark", "Kimi K3.1 Pro 评测", "Kimi K3.1 Pro API", "Artificial Analysis", "Kimi K3.1 Pro 价格"],
    openGraph: { ...metadata.openGraph, type: "article", publishedTime: review.publishedAt, modifiedTime: REVIEW_PRESENTATION_UPDATED_AT, images },
    twitter: { ...metadata.twitter, images: [hero.path] },
  };
}

export default async function KimiReview({ params }: Props) {
  const locale = normalizeLocale((await params).lang) ?? DEFAULT_LOCALE;
  const en = locale === "en";
  const title = en ? titleEn : titleZh;
  const description = en ? descriptionEn : descriptionZh;
  const url = BRAND.url + localizedPath(pathname, locale);
  const aaImages = sources.images.filter(image => image.credit.includes("Artificial Analysis"));
  const officialImages = sources.images.filter(image => !image.credit.includes("Artificial Analysis"));
  const modeName = (mode: string) => modeLabels[mode as keyof typeof modeLabels]?.[en ? "en" : "zh"] ?? mode;
  const resultLabel = (attempt: Attempt) => attempt.httpStatus === 429
    ? (en ? "Quota error (429); no model answer scored" : "额度错误（429），未取得可评分的模型回答")
    : attempt.status === "truncated" ? (en ? "Token budget reached; truncated" : "达到 token 预算，输出截断")
    : attempt.status !== "done" ? (en ? "Incomplete request; not scored" : "请求未完成，未评分")
    : attempt.pass ? (en ? "Predetermined checks passed" : "预定检查通过") : (en ? "Checks not passed" : "预定检查未通过");
  const baselineAttempts = [...review.attempts, ...review.coding];
  const currentText = finalSlots([...review.attempts, ...recovery.attempts]);
  const currentCode = finalSlots([...review.coding, ...recovery.coding]);
  const testedModes = Object.keys(modeLabels).filter(mode => [...currentText, ...currentCode].some(attempt => attempt.mode === mode));
  const currentGroups = supplement.groups.map(group => {
    const recovered = recovery.groups.find(candidate => candidate.id === group.id);
    return { ...group, samples: group.samples.map(sample => recovered?.samples.find(candidate => candidate.mode === sample.mode && candidate.pngPath && candidate.animationRender && candidate.assessmentZh && candidate.assessmentEn) ?? sample) };
  });
  const pendingAnimation = currentGroups.some(group => group.id === "pelican-animation" && group.samples.some(sample => !sample.animationRender));
  const visualFailures = mergeVisualFailures(supplement.failureCounts, recovery.trials, recovery.status === "running");
  const currentSupplement: VisualSupplementData = {
    ...supplement, columns: 3, modes: modeLabels, groups: currentGroups, pendingAnimation,
    requestCount: supplement.requestCount + recovery.trials.length,
    budgetNoteZh: "首批初轮 max_tokens 为 12,288，独立成图重试提高至 32,768。恢复批次的默认动画两次请求均使用 32,768 token、600 秒超时上限。原生 max_tokens 同时包含思考与最终正文，未另设 thinking.budget_tokens；逐次预算和失败记录均保留。",
    budgetNoteEn: "Original first attempts use max_tokens=12,288, with independent rendering retries at 32,768. Both omitted-default animation requests in the recovery batch use 32,768 tokens and a 600-second timeout. Native max_tokens includes thinking plus final output; no separate thinking.budget_tokens is set. Exact budgets and every failure are retained.",
    failureCounts: visualFailures,
    descriptionZh: "本区复用首批已完成的静态图与 low/max 动画，只用独立恢复批次补充默认动画。卡片逐次保留时间、预算、原始来源与失败历史，重复展示不算新增调用。原生 Anthropic Messages 使用 k3.1-pro，消耗 Coding 订阅额度。default 省略 effort：当前 Coding 模型配置页写 high，概览页仍写 max，实际默认强度未独立确认；low/max 同样仅表示请求参数。静态与动图直接渲染模型的原始 SVG，点评为 AI 助手定性检查；不以跨批次耗时做强度或速度排名。",
    descriptionEn: "This view reuses the first batch's successful static images and low/max animations; only omitted-default animation is filled by the independent recovery batch. Each card retains dates, budgets, provenance and failures. Repeated display is not another API call. Native Anthropic Messages uses k3.1-pro and Coding subscription quota. Default omits effort: current Coding model configuration says high while the overview says max, so effective default strength remains unverified. Low/max likewise describe requested parameters. Outputs directly render unchanged model SVG; commentary is qualitative AI-assistant inspection, not a cross-batch strength or speed ranking.",
    pendingReasonZh: recovery.status === "running" ? "额度恢复后已另起独立批次补测；默认动画的可发布结果尚待完成。原先的截断与额度限制继续保留，不计为模型答错。" : "默认动画尚未取得经过渲染与视觉检查的完整结果；具体停止原因与逐次请求见恢复批次证据。",
    pendingReasonEn: recovery.status === "running" ? "An independent recovery batch began after quota recovery. A publishable omitted-default animation is still pending. Earlier truncation and quota records remain preserved and are not scored as incorrect model answers." : "A complete omitted-default animation with rendering and visual inspection is still unavailable; see the recovery evidence for the stop reason and exact requests.",
  };
  const visualModes = Object.keys(visuals.display.modeLabels);
  const hasVisualMatrix = visuals.tasks.length > 0 && visualModes.length > 0 && visuals.tasks.every(task => visualModes.every(mode => visuals.attempts.some(attempt => attempt.id === task.id && attempt.mode === mode)));
  const outputBudgets = [...new Set(baselineAttempts.map(attempt => attempt.request?.max_tokens).filter((value): value is number => typeof value === "number"))];
  const visualData: VisualEvaluationData = {
    ...visuals,
    official: officialImages.map(image => ({ ...image, url: image.originalUrl, sourcePage: image.sourceUrl })),
    display: {
      ...visuals.display,
      columns: 3,
      modeLabels,
      vendor: "Kimi / Moonshot AI",
      officialDate: "2026-10-23",
      officialHeadingZh: "Kimi K3.1 Pro 官方 benchmark 原图",
      officialHeadingEn: "Kimi K3.1 Pro official benchmark figures",
      officialIntroZh: "以下 5 张原图来自 Kimi K3.1 Pro 发布页，版权归 Kimi / 月之暗面。它们是厂商公布的结果，TOKRACE 未独立复现。工具、执行框架和重试口径见原图脚注，不能与上面的本站小样本任务或 AA 成绩直接拼成统一排名。",
      officialIntroEn: "These five unmodified figures come from the Kimi K3.1 Pro launch page and are credited to Kimi / Moonshot AI. TOKRACE has not independently reproduced them. Tool access, harnesses and retry settings differ; consult the original footnotes before comparing them with AA or our small task sample.",
    },
  };
  const faqs = en ? [
    ["Is Kimi K3.1 Pro open weight?", "As checked on October 24, 2026, the launch announcement promises weight release by November 4. A future release commitment does not establish that weights are downloadable today."],
    ["What is the Kimi K3.1 Pro API price?", "The international platform lists $2 per million input tokens, $10 per million output tokens and $0.20 per million cache-hit input tokens for Pro. Highspeed lists $4 / $20 / $0.20. Cache writes are billed separately. These are official list prices, not a claim about our test provider's actual charges."],
    ["Can thinking be disabled?", "Official documentation describes always-on thinking with low, high and max. Coding documentation currently conflicts on the omitted default: the model configuration page says high while the overview says max. The native thinking.type=disabled probe returned HTTP 400. Low/default/max identify requested parameter groups; server-side effort semantics were not independently verified."],
    ["Are benchmark figures TOKRACE results?", "No. Artificial Analysis figures are independent third-party measurements, Kimi figures are vendor-reported, and TOKRACE original API task evidence is labeled separately with its exact endpoint, parameters and outputs."],
    ["Why did Pro hit a limit with only 7.15% monthly usage?", "The console snapshot shows different windows: 7.15% monthly usage and 100% five-hour rate-limit usage. The shorter window stopped further requests with HTTP 429. This was not monthly-quota exhaustion, and the screenshot is historical rather than a live account reading."],
  ] : [
    ["Kimi K3.1 Pro 已经开放权重了吗？", "截至 2026 年 10 月 24 日本次核对，官方承诺在 11 月 4 日前发布权重。这是未来安排，不能写成目前已经可以下载权重。"],
    ["Kimi K3.1 Pro 的 API 价格是多少？", "国际平台 Pro 每百万 token 标价为输入 2 美元、输出 10 美元、缓存命中输入 0.20 美元；Highspeed 为 4 / 20 / 0.20 美元。缓存写入另计。这是官方公开标价，不代表本站测试供应商的实际扣费。"],
    ["Kimi K3.1 Pro 可以关闭思考吗？", "官方文档说明思考始终开启，支持 low、high、max。目前 Coding 文档对省略默认值有冲突：模型配置页写 high，概览页仍写 max。原生接口 thinking.type=disabled 探针返回 HTTP 400。本站原生测试中的 low/default/max 只代表请求参数组，服务端 effort 生效语义未独立验证。"],
    ["文中的 benchmark 都是 TOKRACE 跑的吗？", "不是。Artificial Analysis 原图属于独立第三方测试，Kimi 原图属于厂商公布；TOKRACE 的原始 API 任务在单独分区展示，并保留真实接口、参数与输出。"],
    ["为什么 Pro 会员本月只用了 7.15%，评测仍被限流？", "控制台快照里的 7.15% 是本月用量，100% 是 5 小时窗口的频限，两者不是同一个计量窗口。本次先触及短窗口限制，接口返回 HTTP 429，并非月度额度耗尽；截图只代表拍摄时状态。"],
  ];
  const navigation: ArticleSection[] = [
    { id: "review-summary", label: en ? "Review findings" : "评测结论" },
    { id: "model-details", label: en ? "Model, access and pricing" : "型号、入口与价格" },
    { id: "aa-benchmarks", label: en ? "Artificial Analysis benchmarks" : "Artificial Analysis 基准" },
    { id: "tokrace-tests", label: en ? "Text, code and method" : "文本、代码与测试方法" },
    { id: "recovery-tests", label: en ? "Quota-recovery results" : "额度恢复补测" },
    { id: "pro-quota-experience", label: en ? "Pro and the five-hour limit" : "Pro 与 5 小时频限" },
    ...(hasVisualMatrix ? [
      { id: "visual-supplement", label: en ? "Visual task comparisons" : "视觉任务对比" },
      ...supplement.groups.map(group => ({ id: `supplement-${group.id}`, label: en ? group.titleEn : group.titleZh, nested: true })),
      { id: "visual-tests", label: en ? "Historical first attempts" : "历史首轮结果" },
    ] : []),
    { id: "official-benchmarks", label: en ? "Official benchmark figures" : "官方 benchmark 原图" },
    { id: "benchmark-caveats", label: en ? "Benchmark caveats" : "基准口径与局限" },
    { id: "official-examples", label: en ? "Official demos and videos" : "官方示例与视频" },
    ...(review.stoppedBatches?.length ? [{ id: "stopped-batch", label: en ? "Earlier stopped batch" : "早期停止批次" }] : []),
    { id: "evidence", label: en ? "Original answers and code" : "原始回答与代码" },
    { id: "faq", label: en ? "Questions and answers" : "常见问题" },
    { id: "sources", label: en ? "Sources and related reviews" : "来源与延伸阅读" },
  ];
  return <InfoPage locale={locale} pathname={pathname} title={title} intro={description} updatedAt="2026-10-24" sidebar={<ArticleNavigation sections={navigation} en={en} />}>
<JsonLd data={{
      "@context": "https://schema.org", "@type": "TechArticle", "@id": url + "#article",
      headline: title, description, datePublished: review.publishedAt, dateModified: articleModifiedAt,
      inLanguage: locale, mainEntityOfPage: url, url,
      author: { "@type": "Organization", name: BRAND.publisher, url: BRAND.url },
      publisher: { "@type": "Organization", name: BRAND.publisher, url: BRAND.url },
      image: [...sources.images.map(image => BRAND.url + image.path), ...supplement.groups.flatMap(group => group.samples.flatMap(sample => sample.pngPath ? [BRAND.url + sample.pngPath] : []).slice(0, 1)).slice(0, 4), BRAND.url + quotaObservation.image.path, ...mediaCollections.flatMap(collection => collection.items.filter(item => !item.isExistingBenchmark).flatMap(item => item.posterPath ? [BRAND.url + item.posterPath] : item.type === "image" && item.path ? [BRAND.url + item.path] : [])).slice(0, 4)],
      citation: [...new Set([officialUrl, officialXUrl, aaUrl, ...review.sources.map(source => typeof source === "string" ? source : source.url), ...recovery.sources.map(source => source.url)])],
      about: { "@type": "SoftwareApplication", name: "Kimi K3.1 Pro", applicationCategory: "AI model" },
    }} />
<JsonLd data={{
      "@context": "https://schema.org", "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "TOKRACE", item: BRAND.url + localizedPath("/", locale) },
        { "@type": "ListItem", position: 2, name: en ? "Reports" : "实测报告", item: BRAND.url + localizedPath("/reports", locale) },
        { "@type": "ListItem", position: 3, name: title, item: url },
      ],
    }} />
<JsonLd data={{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map(([question, answer]) => ({ "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: answer } })) }} />
{hasOriginalTests && <JsonLd data={{
      "@context": "https://schema.org", "@type": "Dataset", "@id": url + "#dataset",
      name: "Kimi K3.1 Pro: TOKRACE original text and code task evidence", description: review.editorial[locale].summary,
      license: DATASET_LICENSE_URL, url: url + "#evidence", dateModified: supplement.updatedAt,
      creator: { "@type": "Organization", name: BRAND.publisher },
      variableMeasured: ["Predetermined task checks", "Time to first content (ms)", "Total request time (ms)", "API token usage"],
      distribution: { "@type": "DataDownload", encodingFormat: "application/json", contentUrl: BRAND.url + evidencePath },
    }} />}
<JsonLd data={{
      "@context": "https://schema.org", "@type": "Dataset", "@id": url + "#recovery-dataset",
      name: "Kimi K3.1 Pro: independent quota-recovery evaluation", description: en ? recovery.methodEn : recovery.methodZh,
      license: DATASET_LICENSE_URL, url: url + "#recovery-tests", dateModified: recovery.updatedAt,
      creator: { "@type": "Organization", name: BRAND.publisher },
      distribution: { "@type": "DataDownload", encodingFormat: "application/json", contentUrl: BRAND.url + recoveryEvidencePath },
    }} />
{hasVisualMatrix ? <VisualEvaluation data={visualData} locale={locale} supplement={currentSupplement} /> : <section id="official-benchmarks" className="scroll-mt-6">
      <p className="text-xs font-bold uppercase tracking-wider">{en ? "Vendor-reported · separate from TOKRACE tests" : "厂商公布 · 与本站实测分开"}</p>
      <h2>{en ? visualData.display.officialHeadingEn : visualData.display.officialHeadingZh}</h2>
      <p>{en ? visualData.display.officialIntroEn : visualData.display.officialIntroZh}</p>
      <div className="mt-5 space-y-8">{officialImages.map(image => <SourceFigure key={image.id} image={image} en={en} />)}</div>
    </section>}
<details id="review-details" className="scroll-mt-6 rounded-xl border border-line bg-card p-5">
<summary className="cursor-pointer font-bold text-ink">{en ? "Test details, original answers and sources" : "测试详情、原始回答与来源"}</summary>
<div className="mt-5 space-y-7">
<p id="review-summary" className="scroll-mt-6">{en ? "Launch sources checked October 24, 2026 · Original testing and commentary by TOKRACE. Third-party scores, vendor scores and our task outputs are presented separately." : "发布资料核对：2026 年 10 月 24 日 · TOKRACE 原创测试与解读。第三方成绩、厂商成绩和本站任务输出分别展示。"}</p>
<aside className="rounded-xl border border-line bg-card p-5">
      <p className="font-bold text-ink"><Link href={localizedPath("/guides/kimi-k3-1-pro-creative", locale)}>{en ? "New: Blender and knowledge-video creative tests" : "新增：Blender 建模与知识视频创作评测"} →</Link></p>
      <p>{en ? "A separate creative batch includes playable videos, multiple camera views, editable projects and concrete observations. Different tasks and effort settings retain their own evidence; these results do not replace the text, code and SVG tests below." : "独立创作批次提供视频播放、多机位成图、可编辑工程与具体点评。不同任务和思考档位各自留证，与下方文本、代码和 SVG 基线分开阅读。"}</p>
    </aside>
{hasOriginalTests && <aside className="rounded-xl border border-line bg-card p-5" aria-label={en ? "TOKRACE findings" : "TOKRACE 实测结论"}>
      <p className="font-bold text-ink">{en ? "What the original task evidence shows" : "这轮原始任务证据说明了什么"}</p>
      <p>{en ? "After quota recovery, an independent sequential batch fills the missing slots while retaining earlier successes. Current combined coverage: " : "额度恢复后，另起独立串行批次续补缺项，并复用此前成功结果。目前累计覆盖："}{en ? "text " : "文本 "}{recovery.combinedCoverage.text.completed}/{recovery.combinedCoverage.text.planned} · {en ? "code " : "代码 "}{recovery.combinedCoverage.coding.completed}/{recovery.combinedCoverage.coding.planned} · {en ? "static images " : "静态图 "}{recovery.combinedCoverage.static.completed}/{recovery.combinedCoverage.static.planned} · {en ? "animations " : "动画 "}{recovery.combinedCoverage.animation.completed}/{recovery.combinedCoverage.animation.planned}{en ? ". These are unique task/parameter slots across batches, not a same-budget rerun or a capability ranking." : "。这是跨批次的任务／参数槽覆盖，并非同预算重跑或能力排名。"}</p>
      <p>{en ? "The original clock angles, chart proportions and six poster strings met their specified checks. Early visual outputs hit the 12,288-token cap and required independent 32,768-token retries. The early low/max animations show leg stretching. The recovered default keeps leg lengths steadier, with joints still using segmented cartoon interpolation. Rendering and small-task checks do not establish general reliability." : "首批钟表角度、柱高比例和海报六段文字符合预定要求；部分视觉输出先触及 12,288 token 上限，再以 32,768 token 独立重试。首批 low/max 动画的腿部伸缩明显；补测默认组的腿长较稳定，关节仍是分段插值的卡通动作。能渲染、通过小题检查，不等于普遍可靠。"}</p>
      <details><summary className="cursor-pointer">{en ? "Original batch findings before recovery" : "恢复补测前的首批结论"}</summary><p>{review.editorial[locale].summary}</p></details>
      {review.actualFirstRequests != null && <p>{en ? "Historical initial batch: " : "历史首批："}{review.actualFirstRequests} / {review.plannedFirstRequests} · {en ? "Unsent then: " : "当时未发："}{review.notDispatchedCount} · {en ? "Independent retries then: " : "当时独立重试："}{review.additionalRetryCount} · {en ? "Task requests then: " : "当时评测请求："}{review.totalRequests}{en ? ". Recovery adds " : "；恢复批次新增 "}{recovery.requestCount}{en ? " requests, listed separately below." : " 次请求，下方单独展示。"}</p>}
      <p className="font-bold text-ink">{en ? (isPartial ? "Task coverage is still partial; " : "All planned task/parameter slots have completed outputs; ") + "unfinished tasks and HTTP 429 responses are not counted as incorrect model answers." : (isPartial ? "任务覆盖仍未齐备；" : "计划任务／参数槽已取得完整输出；") + "未执行任务与 HTTP 429 不算模型答错。"}</p>
      <p>{en ? "With one Pro membership, we hit the five-hour limit before finishing this evaluation. The console snapshot shows 7.15% monthly usage and 100% rate-limit usage at capture time; it does not show monthly-quota exhaustion." : "一个 Pro 会员，评测还没跑完就 hit limit 了。控制台快照里，当时本月用量为 7.15%，频限为 100%；这是 5 小时窗口先用满，并非月度额度耗尽。"}{" "}<a href="#pro-quota-experience">{en ? "View the historical snapshot" : "查看当时的截图"}</a>{" · "}<a href="#recovery-tests">{en ? "See recovery results" : "查看恢复补测"}</a></p>
      {review.quotaResetAt && <p>{en ? "Historical server-reported estimated window reset: " : "首批记录的服务端预计窗口重置时间："}{new Date(review.quotaResetAt).toLocaleString(en ? "en-GB" : "zh-CN", { timeZone: "Asia/Shanghai", hour12: false })}{en ? " (Beijing time). This is a historical record, not a current account reading." : "（北京时间）。这是历史记录，不是当前账户读数。"}</p>}
      <p><a href="#tokrace-tests">{en ? "Scores, timing and test conditions" : "查看成绩、耗时与测试条件"}</a>{hasVisualMatrix && <>{" · "}<a href="#visual-supplement">{en ? "SVG and animation evidence" : "查看 SVG 与动画证据"}</a></>}</p>
    </aside>}
{!hasOriginalTests && <aside className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-5" aria-label={en ? "Evaluation status" : "评测状态"}>
      <p className="font-bold text-ink">{en ? "11 benchmark figures verified. Complete TOKRACE evaluation evidence is pending." : "11 张 benchmark 原图已核验；完整 TOKRACE 实测证据尚未齐备。"}</p>
      <p>{en ? "The stopped archive contains 22 completed short text requests, all passing their predetermined checks, plus one interruption with unknown upstream status. It is an incomplete subset. Code, four static SVG tasks and cycling animation have not been tested; no three-mode capability ranking is claimed." : "已停止的历史批次包含 22 次完成的短文本请求，预定检查全部通过，另有 1 次中断、上游状态未知。这只是未完成子集；代码、四项静态 SVG 与骑车动画尚未实测，不能据此做三档能力排名。"}</p>
      <p><a href="#tokrace-tests">{en ? "See the pending-task table and full disclosure" : "查看待测表与完整说明"}</a>{" · "}<a href="#stopped-batch">{en ? "Inspect all archived outputs" : "展开全部历史输出"}</a></p>
    </aside>}
<section id="model-details" className="scroll-mt-6">
      <h2>{en ? "What launched: a large-context reasoning and coding model" : "正式发布的是谁：大上下文推理与编程模型"}</h2>
      <p>{en ? "Kimi has released K3.1 Pro. For developers, the first distinction is access: the official public API, third-party providers and Kimi Coding subscriptions have different model IDs, billing and usage conditions. Our test evidence identifies the provider actually called; official specifications below describe Kimi's own platform." : "Kimi 已发布 K3.1 Pro。对准备接入的开发者，先区分入口：官方按量 API、第三方供应商和 Kimi Coding 订阅的模型 ID、计费与使用条件不同。本站请求证据注明实际调用的供应商；下表描述 Kimi 自有平台的规格。"}</p>
      <div className="mt-4 overflow-x-auto rounded-lg border border-line">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">{en ? "Kimi K3.1 Pro launch specifications" : "Kimi K3.1 Pro 发布规格"}</caption>
          <thead className="bg-card text-ink"><tr><th className="p-3">{en ? "Item" : "项目"}</th><th className="p-3">{en ? "Documented information" : "已核实信息"}</th></tr></thead>
          <tbody>
            <tr className="border-t border-line"><th scope="row" className="p-3 align-top text-ink">{en ? "Model IDs" : "公开平台型号"}</th><td className="break-all p-3">kimi-k3.1-pro / kimi-k3.1-pro-highspeed</td></tr>
            <tr className="border-t border-line"><th scope="row" className="p-3 align-top text-ink">{en ? "Context" : "上下文"}</th><td className="p-3">1,048,576 token (1M)</td></tr>
            <tr className="border-t border-line"><th scope="row" className="p-3 align-top text-ink">{en ? "Pro list price" : "Pro 公开标价"}</th><td className="p-3">$2 / $10 / $0.20 {en ? "per million tokens: input / output / cache-hit input" : "每百万 token：输入 / 输出 / 缓存命中输入"}</td></tr>
            <tr className="border-t border-line"><th scope="row" className="p-3 align-top text-ink">{en ? "Highspeed list price" : "Highspeed 公开标价"}</th><td className="p-3">$4 / $20 / $0.20 {en ? "per million tokens, same order" : "每百万 token，顺序同上"}</td></tr>
            <tr className="border-t border-line"><th scope="row" className="p-3 align-top text-ink">{en ? "China platform prices" : "国内平台价格"}</th><td className="p-3">{en ? "Pro: ¥13 / ¥68 / ¥1.30; Highspeed: ¥26 / ¥136 / ¥1.30 per million tokens, same order. Separate regional price table, not a currency conversion." : "Pro：¥13 / ¥68 / ¥1.30；Highspeed：¥26 / ¥136 / ¥1.30，每百万 token，顺序同上。分别取自国内定价表，并非美元价格的汇率换算。"}</td></tr>
            <tr className="border-t border-line"><th scope="row" className="p-3 align-top text-ink">{en ? "Cache writes" : "缓存写入"}</th><td className="p-3">{en ? "Separately billed by retention time. Pro: $2 / $4 or ¥13 / ¥26 per million tokens for 5 minutes / 1 hour; Highspeed: $4 / $8 or ¥26 / ¥52." : "按保留时间另计。Pro 的 5 分钟 / 1 小时写入价为 $2 / $4，国内 ¥13 / ¥26；Highspeed 为 $4 / $8，国内 ¥26 / ¥52，均为每百万 token。"}</td></tr>
            <tr className="border-t border-line"><th scope="row" className="p-3 align-top text-ink">{en ? "Thinking" : "思考参数"}</th><td className="p-3">{en ? "Always enabled; low / high / max; default max. Official docs require omitting temperature (fixed at 1)." : "始终开启；low / high / max，默认 max。官方要求省略 temperature（固定为 1）。"}</td></tr>
            <tr className="border-t border-line"><th scope="row" className="p-3 align-top text-ink">{en ? "Weight availability" : "权重状态"}</th><td className="p-3">{en ? "Not yet released as checked; Kimi promises release by November 4, 2026." : "本次核对时尚未发布；官方承诺于 2026 年 11 月 4 日前发布。"}</td></tr>
          </tbody>
        </table>
      </div>
      <p className="mt-3">{en ? "Source: " : "来源："}<a href={officialUrl}>{en ? "Kimi release announcement" : "Kimi 官方发布页"}</a>{" · "}<a href="https://platform.kimi.ai/docs/guide/kimi-k3-1-pro-quickstart">{en ? "Official API guide" : "官方 API 指南"}</a>{" · "}<a href="https://platform.kimi.ai/docs/pricing/chat">{en ? "International pricing" : "国际平台定价"}</a>{" · "}<a href="https://platform.kimi.com/docs/pricing/chat">{en ? "China pricing" : "国内平台定价"}</a></p>
      <p>{en ? "To try the model in TOKRACE, configure your own authorized pay-as-you-go API endpoint and key. " : "需要在 TOKRACE 复测时，可配置自己的已授权按量 API 地址与密钥。"}<Link href={localizedPath("/arena", locale)}>{en ? "Open Arena →" : "打开 Arena →"}</Link></p>
    </section>
<section id="aa-benchmarks" className="scroll-mt-6">
      <p className="text-xs font-bold uppercase tracking-wider">{en ? "Independent third party · Artificial Analysis" : "独立第三方 · Artificial Analysis"}</p>
      <h2>{en ? "Artificial Analysis benchmark originals" : "Artificial Analysis 的 benchmark 原图"}</h2>
      <p>{en ? "AA reports Intelligence Index 55 (#4 at launch), GDPval-AA 1846, Terminal-Bench 4.0 67.2%, and a 2.8T-total / 104B-active architecture. These are AA results." : "AA 给出的 Intelligence Index 为 55，发布时第 4；GDPval-AA 为 1,846 Elo，Terminal-Bench 4.0 为 67.2%，并披露总计 2.8T、激活 104B 的参数规模。以上归属于 AA。"}{" "}<a href={aaUrl}>{en ? "Read the source" : "查看原文"}</a></p>
      <p>{en ? "Its Terminal-Bench setup differs from Kimi's 65.7%; compare harnesses and tools before scores. Click the unmodified figures for axes, legends and footnotes." : "AA 与官方 65.7% 的终端成绩配置不同；比较前先看框架和工具。下列原图保留坐标轴、图例和脚注，可点击放大。"}</p>
      <div className="mt-5 space-y-8">{aaImages.map(image => <SourceFigure key={image.id} image={image} en={en} />)}</div>
    </section>
<section id="tokrace-tests" className="scroll-mt-6">
      <p className="text-xs font-bold uppercase tracking-wider">{en ? "TOKRACE original API tasks" : "TOKRACE 原创 API 任务"}</p>
      <h2>{en ? "TOKRACE evaluation: current status and evidence" : "TOKRACE 评测：当前进度与证据"}</h2>
      <p>{review.editorial[locale].summary}</p>
      <p>{hasOriginalTests ? (isCodingSubscription ? (en ? "This new batch uses Kimi Coding's native Anthropic Messages endpoint, separate from the earlier stopped OpenAI-compatible batch. It consumes Coding subscription quota; no per-token paid invoice or conversion from Kimi's public platform list prices is asserted. Requested and returned IDs are retained, without treating a mutable alias as a fixed checkpoint." : "本轮使用 Kimi Coding 原生 Anthropic Messages 接口，与此前停止的 OpenAI 兼容接口批次分别保留。消耗的是 Coding 订阅额度，没有按量实付账单，不把公开平台标价折算为本轮费用。请求与返回型号均保留，可变别名不构成固定 checkpoint 的证明。") : (en ? "The endpoint below identifies the actual provider. We preserve requested and returned IDs without treating a mutable alias as proof of a fixed checkpoint. Kimi's list prices are a reference, not our provider's billed test cost." : "下方接口是本轮实际供应商。我们保留请求和返回型号，可变别名不构成固定 checkpoint 的证明。Kimi 官方标价是参考，不代表测试供应商的实际扣费。")) : (en ? "Earlier authentication errors describe those credential and endpoint combinations, not a model-quality failure or proof that Coding access is unavailable. New native-interface results will be listed separately when complete; the earlier probe records remain downloadable." : "此前鉴权错误只描述当时的凭据与接口组合，不是模型质量失败，也不能证明 Coding 无法调用。新的原生接口完整结果将另批展示，此前探针记录继续保留下载。")}</p>
      <p className="break-all">{hasOriginalTests ? (en ? "Recorded endpoint" : "实录接口") : (en ? "Intended official endpoint" : "待测官方接口")}：{review.endpoint} · {en ? "Model ID" : "模型 ID"}：{review.model}</p>
      {hasOriginalTests && review.requestUrl && <p className="break-all">{en ? "Actual request URL" : "实际请求地址"}：{review.requestUrl}</p>}
      {!hasOriginalTests && <>
        <div className="mt-4 overflow-x-auto rounded-lg border border-line"><table className="w-full text-left text-sm">
          <caption className="p-3 text-left">{en ? "Planned baseline tasks — not completed results" : "计划中的基线任务，下列均不是已完成成绩"}</caption>
          <thead className="bg-card text-ink"><tr><th className="p-3">{en ? "Task" : "任务"}</th><th className="p-3">{en ? "Status" : "状态"}</th></tr></thead>
          <tbody>{(en ? ["Complete text comparison", "Three JavaScript tasks", "Static SVG: pelican on a bicycle", "Static SVG: 9:41 clock", "Static SVG: data dashboard", "Static SVG: Chinese poster", "Four-second cycling pelican animation"] : ["完整文本档位对照", "3 道 JavaScript 代码题", "静态 SVG：鹈鹕骑自行车", "静态 SVG：9:41 模拟钟表", "静态 SVG：数据 dashboard", "静态 SVG：中文海报", "4 秒鹈鹕骑车动画"]).map(task => <tr key={task} className="border-t border-line"><th scope="row" className="p-3 text-ink">{task}</th><td className="p-3">{en ? "Complete request and verification evidence pending" : "完整请求与验证证据待完成"}</td></tr>)}</tbody>
        </table></div>
        {review.probeEvidencePath && <p><a href={review.probeEvidencePath}>{en ? "Download API access probe records" : "下载 API 访问探针记录"}</a></p>}
      </>}
      <div className="mt-4 overflow-x-auto rounded-lg border border-line">
        <table className="w-full text-left text-sm">
          <thead className="bg-card text-ink"><tr><th className="p-3">{en ? "Setting" : "设置"}</th><th className="p-3">{en ? "Support / interpretation" : "支持情况与解释"}</th></tr></thead>
          <tbody>
            <tr className="border-t border-line"><th scope="row" className="p-3 text-ink">Off</th><td className="p-3">{en ? "Unsupported; no off result is fabricated." : "不支持，未伪造关闭思考对比。"}</td></tr>
            <tr className="border-t border-line"><th scope="row" className="p-3 text-ink">Low</th><td className="p-3">{en ? "Requests send output_config.effort=low; effective strength is not independently verified." : "发送 output_config.effort=low；实际生效强度未独立验证。"}{!hasOriginalTests && (en ? " Complete batch pending." : " 完整批次待完成。")}</td></tr>
            <tr className="border-t border-line"><th scope="row" className="p-3 text-ink">High</th><td className="p-3">{en ? "Officially supported; outside this default / low / max comparison." : "官方支持；本轮默认 / low / max 基线未测此档。"}</td></tr>
            <tr className="border-t border-line"><th scope="row" className="p-3 text-ink">Default / Max</th><td className="p-3">{en ? "The official public API documents default=max. Coding documentation conflicts: its model configuration page says high while its overview says max. Default here omits effort; effective effort is not independently verified." : "官方公开 API 文档说明默认值为 max。Coding 文档存在冲突：模型配置页写 high，概览页仍写 max。此处默认组省略 effort，实际生效强度未独立验证。"}</td></tr>
          </tbody>
        </table>
      </div>
      {hasOriginalTests && isCodingSubscription && <aside className="mt-4 rounded-lg border border-line bg-card p-4">
        <p className="font-bold text-ink">{en ? "Requested parameter groups; server-side effort semantics unverified" : "这里只比较请求参数组，服务端 effort 语义未验证"}</p>
        <p>{en ? "The native requests omit effort or send output_config.effort=low/max. A diagnostic request with an invalid effort string also returned HTTP 200, while thinking.type=disabled returned HTTP 400. These observations do not independently confirm that the known effort values took effect, and do not prove they were ignored. We therefore retain exact parameters and outputs without treating the groups as verified reasoning strengths or using timing differences as a speed ranking." : "原生请求分别省略 effort，或发送 output_config.effort=low / max。诊断中，非法 effort 字符串也返回了 HTTP 200，而 thinking.type=disabled 返回 HTTP 400。因此，我们无法独立确认已知 effort 值是否按预期生效，也没有证据证明它们被忽略。这里只保留准确参数与输出，不把三组当成已验证的思考强度，也不按耗时差异做速度排名。"}</p>
        <p><a href="https://www.kimi.com/code/docs/en/kimi-code/models.html">{en ? "Coding model configuration (high default)" : "Coding 模型配置页（默认 high）"}</a>{" · "}<a href="https://www.kimi.com/code/docs/en/">{en ? "Coding overview (max default)" : "Coding 概览页（默认 max）"}</a>{en ? ". Both describe documentation as checked for this update; the request record omits effort for the default group." : "。这里记录本次更新核查到的文档冲突；默认组实际请求省略 effort。"}</p>
      </aside>}
      {hasOriginalTests && <div className="mt-4 overflow-x-auto rounded-lg border border-line"><table className="w-full text-left text-sm">
        <caption className="p-3 text-left">{en ? "Current unique task slots across the original and recovery batches: passing / complete answers. Dates and budgets can differ; this is not a same-batch speed comparison. API failures are separate from answer quality." : "首批与恢复批次的当前任务槽：通过数 / 完整回答数。时间与预算可能不同，不是同批速度比较；接口失败与答题质量分开。"}</caption>
        <thead className="bg-card text-ink"><tr><th className="p-3">{en ? "Requested group" : "请求参数组"}</th><th className="p-3">{en ? "Text: passed / complete" : "文本：通过 / 完整回答"}</th><th className="p-3">{en ? "Code: passed / complete" : "代码：通过 / 完整回答"}</th><th className="p-3">{en ? "Completed text first content, median" : "完整文本正文首响中位数"}</th><th className="p-3">{en ? "Completed text total, median" : "完整文本总耗时中位数"}</th><th className="p-3">{en ? "Completed code total, median" : "完整代码总耗时中位数"}</th></tr></thead>
        <tbody>{testedModes.map(mode => {
          const text = currentText.filter(attempt => attempt.mode === mode);
          const code = currentCode.filter(attempt => attempt.mode === mode);
          const completedText = text.filter(attempt => attempt.status === "done");
          const completedCode = code.filter(attempt => attempt.status === "done");
          return <tr key={mode} className="border-t border-line"><th scope="row" className="p-3 text-ink">{modeName(mode)}</th><td className="p-3">{completedText.filter(attempt => attempt.pass).length} / {completedText.length}<span className="block text-xs">{en ? "Recorded slots / planned: " : "已记录槽 / 计划："}{text.length} / 15 · {en ? "Current-slot 429" : "当前槽 429"}: {text.filter(attempt => attempt.httpStatus === 429).length} · {en ? "Unsent: " : "未发："}{Math.max(0, 15 - text.length)}</span></td><td className="p-3">{completedCode.filter(attempt => attempt.pass).length} / {completedCode.length}<span className="block text-xs">{en ? "Recorded slots / planned: " : "已记录槽 / 计划："}{code.length} / 3 · {en ? "Current-slot 429" : "当前槽 429"}: {code.filter(attempt => attempt.httpStatus === 429).length} · {en ? "Unsent: " : "未发："}{Math.max(0, 3 - code.length)}</span></td><td className="p-3">{medianSeconds(completedText.map(attempt => attempt.firstContentMs))}</td><td className="p-3">{medianSeconds(completedText.map(attempt => attempt.totalMs))}</td><td className="p-3">{medianSeconds(completedCode.map(attempt => attempt.totalMs))}</td></tr>;
        })}</tbody>
      </table></div>}
      {hasOriginalTests && <p>{en ? "Original text/code batch before recovery: " : "恢复前首批文本／代码："}{baselineAttempts.length}{en ? " retained requests; recorded request time totals " : " 条保留记录；请求耗时累计 "}{(baselineAttempts.reduce((sum, attempt) => sum + (attempt.totalMs ?? 0), 0) / 1000).toFixed(2)}s{en ? ", excluding visual tasks, retry backoff and unknown interrupted durations. Output limits: " : "，不含视觉题、退避等待及中断后的未知耗时。输出预算："}{outputBudgets.map(budget => budget.toLocaleString("en-US")).join(" / ") || "—"} token{review.params?.timeoutMs != null && (en ? `; request timeout ${review.params.timeoutMs / 1000}s.` : `；单次请求超时 ${review.params.timeoutMs / 1000} 秒。`)}{en ? " See each request for exact settings. The timings describe this run; they do not establish provider-wide speed or different effective reasoning strengths." : " 逐次参数见原始记录。耗时只描述本轮请求，不用于推断供应商整体速度或不同生效思考强度。"}</p>}
      {hasOriginalTests && isCodingSubscription && <p>{en ? "For these native requests, max_tokens covers both thinking and final text; no separate thinking.budget_tokens was supplied. Input accounting follows returned usage fields, with cache read/write components retained in the JSON. Hidden reasoning content is not published." : "本轮原生请求的 max_tokens 同时限制思考与最终正文，未另设 thinking.budget_tokens。输入统计按返回的 usage 字段处理，缓存读取与写入分项保留在 JSON 中；不公开隐藏思维链内容。"}</p>}
      {hasOriginalTests && review.cumulativeRequestMs != null && <p>{en ? "Across the original task batch before recovery, recorded request time sums to " : "恢复前首批全部评测请求的记录耗时相加为 "}{(review.cumulativeRequestMs / 1000).toFixed(2)}s{review.wallClockSpanMs != null && (en ? `; the batch's wall-clock span is ${(review.wallClockSpanMs / 1000).toFixed(2)}s.` : `；批次墙钟跨度为 ${(review.wallClockSpanMs / 1000).toFixed(2)} 秒。`)}{en ? " Requests ran concurrently, so these are different measures. " : " 请求存在并发，这两个时间口径不同。"}{review.diagnosticRequestCount != null && (en ? `${review.diagnosticRequestCount} separate protocol diagnostics are excluded from task scores and the task-request count; the historical stopped batch remains separate.` : `另有 ${review.diagnosticRequestCount} 次协议诊断，不计入答题成绩与评测请求数；历史中止批次也单独保留。`)}</p>}
      <p className="mt-3">{en ? "Read individual failures before choosing a model. Deterministic checks cover only the written task requirements; visual commentary is the AI assistant's qualitative inspection. A rendered image is not automatically a correct image, and successful code checks do not establish production reliability." : "选模型前，建议展开具体失败。自动检查只覆盖题目中预先写明的要求；视觉点评来自 AI 助手的定性检查。能渲染不等于画对，代码通过小样本检查也不代表生产可靠性。"}</p>
    </section>
<section id="recovery-tests" className="scroll-mt-6">
      <p className="text-xs font-bold uppercase tracking-wider">{en ? "Independent quota-recovery batch" : "独立额度恢复批次"} · {recovery.date}</p>
      <h2>{en ? "What changed after quota recovery?" : "额度恢复后，补上了哪些结果？"}</h2>
      <p>{en ? recovery.methodEn : recovery.methodZh}</p>
      <p>{en ? "The 45 text slots use 15 fixed prompts across three requested parameter groups: extraction, strict formatting and grounded questions. The nine code slots use three JavaScript tasks across those groups: exact money-to-cents parsing, stable deduplication and interval merging. Predetermined checks cover these short tasks; large repositories, tool use, million-token context and multimodal work remain untested here." : "45 个文本槽来自 15 道固定题乘以三组请求参数，覆盖信息抽取、严格格式和材料问答；9 个代码槽来自 3 道 JavaScript 题乘以三组参数，分别是金额字符串转分、保序去重和合并区间。预定检查覆盖这些短任务，复杂代码仓库、工具调用、百万 token 上下文和多模态仍待另测。"}</p>
      <p>{en ? "Recovery status: " : "恢复批次状态："}{recovery.status} · {en ? "New requests: " : "新增请求："}{recovery.requestCount} · {en ? "Recorded request time: " : "记录请求耗时："}{(recovery.cumulativeRequestMs / 1000).toFixed(2)}s · {en ? "Updated: " : "证据更新："}{recovery.updatedAt}</p>
      <p className="break-all">{recovery.requestUrl} · {en ? "Model: " : "型号："}{recovery.model}</p>
      <div className="overflow-x-auto rounded-lg border border-line"><table className="w-full text-left text-sm">
        <caption className="p-3 text-left">{en ? "Cumulative unique task/parameter slots, reusing prior successes. Static/animation completion means a rendered result, not an overall quality pass." : "累计唯一任务／参数槽，复用此前成功结果。静态／动画完成数指取得成图，不代表综合质量通过。"}</caption>
        <thead className="bg-card text-ink"><tr><th className="p-3">{en ? "Task" : "任务"}</th><th className="p-3">{en ? "Complete / planned" : "完整结果 / 计划"}</th><th className="p-3">{en ? "Predetermined checks passed" : "预定检查通过"}</th><th className="p-3">{en ? "Remaining" : "尚缺"}</th></tr></thead>
        <tbody>{([['text', en ? 'Text' : '文本'], ['coding', en ? 'Code' : '代码'], ['static', en ? 'Static SVG' : '静态 SVG'], ['animation', en ? 'Animation' : '骑车动画']] as const).map(([key, label]) => {
          const coverage = recovery.combinedCoverage[key];
          return <tr key={key} className="border-t border-line"><th scope="row" className="p-3 text-ink">{label}</th><td className="p-3">{coverage.completed} / {coverage.planned}</td><td className="p-3">{coverage.passed ?? (en ? 'See per-image inspection' : '见逐图点评')}</td><td className="p-3">{coverage.remaining}</td></tr>;
        })}</tbody>
      </table></div>
      <p>{en ? `Native Messages requests: ${recovery.counting.previousNativeMessagesRequests} historical (53 task calls + 5 diagnostics) + ${recovery.counting.recoveryNativeRequests} new = ${recovery.counting.combinedNativeMessagesRequests}. The earlier stopped Chat Completions batch is separate. The original two HTTP 429 errors came from text/code, not the 17 visual records. Recovery errors: ${recovery.failureCounts.quota} quota, ${recovery.failureCounts.truncated} truncated, ${recovery.failureCounts.timeout ?? 0} timeouts, ${recovery.failureCounts.networkOrServer} network/server.` : `原生 Messages 请求：历史 ${recovery.counting.previousNativeMessagesRequests} 次（53 次评测 + 5 次诊断）+ 本次 ${recovery.counting.recoveryNativeRequests} 次 = ${recovery.counting.combinedNativeMessagesRequests} 次。更早停止的 Chat Completions 批次单独保留。首批两次 HTTP 429 属于文本／代码，不在 17 条视觉记录之内。恢复批次失败：额度 ${recovery.failureCounts.quota} 次、截断 ${recovery.failureCounts.truncated} 次、超时 ${recovery.failureCounts.timeout ?? 0} 次、网络／服务端 ${recovery.failureCounts.networkOrServer} 次。`}</p>
      <p><a href={recoveryEvidencePath}>{en ? "Download the independent recovery evidence (JSON)" : "下载独立恢复批次原始证据（JSON）"}</a>{" · "}<a href="#supplement-pelican-animation">{en ? "Compare all three animation cards" : "对照三组骑车动画"}</a></p>
      {[...recovery.attempts, ...recovery.coding, ...recovery.trials].map((attempt, index) => <details key={`recovery-${attempt.id}-${attempt.mode}-${index}`} className="my-3 rounded-lg border border-line p-4">
        <summary className="cursor-pointer">{en ? attempt.titleEn : attempt.title} · {modeName(attempt.mode)} · {attempt.id === 'pelican-animation' ? (en ? `Animation request: ${attempt.status}` : `动画请求：${attempt.status}`) : resultLabel(attempt)}</summary>
        <p className="break-words text-xs">{attempt.startedAt} · {en ? "Total" : "总耗时"} {attempt.totalMs == null ? '—' : (attempt.totalMs / 1000).toFixed(3) + 's'} · {en ? "First content" : "正文首响"} {attempt.firstContentMs == null ? '—' : (attempt.firstContentMs / 1000).toFixed(3) + 's'} · {(attempt.usageFinal === false || attempt.usageComplete === false) ? (en ? "Final token usage unavailable; message-start snapshots are not total consumption." : "最终用量未结算；message_start 快照不代表实际总消耗。") : <>{en ? "Input / output / thinking tokens" : "输入 / 输出 / 思考 token"} {attempt.promptTokens ?? '—'} / {attempt.outputTokens ?? '—'} / {attempt.reasoningTokens ?? '—'}</>}</p>
        <h3>{en ? "Exact prompt" : "完整题目"}</h3><pre className="overflow-auto whitespace-pre-wrap break-words text-xs">{attempt.prompt}</pre>
        <h3>{en ? "Original response" : "原始回答"}</h3><pre className="overflow-auto whitespace-pre-wrap break-words text-xs">{attempt.text || (en ? 'No final response retained; see request status.' : '未留存最终正文，见请求状态。')}</pre>
        {'checks' in attempt && <><h3>{en ? "Executable checks" : "可执行检查"}</h3><pre className="overflow-auto whitespace-pre-wrap break-words text-xs">{String(attempt.checks)}</pre></>}
        <details className="mt-3"><summary className="cursor-pointer">{en ? "Exact API request and budget" : "实际 API 请求与预算"}</summary><pre className="overflow-auto whitespace-pre-wrap break-words text-xs">{JSON.stringify(attempt.request, null, 2)}</pre></details>
        {attempt.error && <p className="break-words">{attempt.error}</p>}
      </details>)}
    </section>
<section id="pro-quota-experience" className="scroll-mt-6">
      <h2>{en ? "One Pro membership hit the limit before the evaluation finished" : "一个 Pro 会员，评测没跑完就先触发了频限"}</h2>
      <p>{en ? quotaObservation.observation.descriptionEn : quotaObservation.observation.descriptionZh}</p>
      <dl className="my-4 grid grid-cols-2 gap-3 rounded-xl border border-line bg-card p-4">
        <div><dt className="text-xs">{en ? "Plan at capture time" : "拍摄时的会员"}</dt><dd className="text-lg font-bold text-ink">{quotaObservation.observation.plan}</dd></div>
        <div><dt className="text-xs">{en ? "Monthly usage" : "当时本月用量"}</dt><dd className="text-lg font-bold text-ink">{quotaObservation.observation.monthlyUsagePercent}%</dd></div>
        <div><dt className="text-xs">{en ? "Five-hour rate-limit usage" : "当时 5 小时频限"}</dt><dd className="text-lg font-bold text-ink">{quotaObservation.observation.rateLimitPercent}%</dd></div>
        <div><dt className="text-xs">{en ? "Reset countdown in the snapshot" : "截图当时的重置倒计时"}</dt><dd className="text-lg font-bold text-ink">{quotaObservation.observation.resetCountdownText}</dd></div>
      </dl>
      <figure className="overflow-hidden rounded-xl border border-line bg-card">
        <a href={quotaObservation.image.path} target="_blank" rel="noopener noreferrer" aria-label={en ? "Open full-size Pro quota snapshot" : "打开 Pro 额度截图大图"}><Image src={quotaObservation.image.path} width={quotaObservation.image.width} height={quotaObservation.image.height} alt={en ? quotaObservation.image.altEn : quotaObservation.image.altZh} unoptimized loading="lazy" className="h-auto w-full cursor-zoom-in bg-white" /></a>
        <figcaption className="space-y-2 p-4"><p>{en ? quotaObservation.image.captionEn : quotaObservation.image.captionZh}</p><p className="text-xs"><a href={quotaObservation.image.path} download>{en ? "Download original snapshot" : "下载截图原件"}</a>{" · "}<a href="/evaluations/kimi-k3-1-pro/official-examples/quota-observation.json">{en ? "Snapshot context and file hash" : "截图背景与文件哈希"}</a></p></figcaption>
      </figure>
      <p>{en ? "This is a historical view of the evaluation account. The two percentages measure different windows; neither the 100% value nor the 3h1min countdown is a live account status. The retained 53 task requests, five diagnostics and 18 unsent tasks remain unchanged." : "这张图保留的是评测账户拍摄时的状态。两项百分比属于不同计量窗口，100% 和 3h1min 都不是当前账户状态的实时读数。原有 53 次评测请求、5 次诊断与 18 项未派发任务的记录保持不变。"}</p>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "ImageObject", "@id": url + "#pro-quota-snapshot", contentUrl: BRAND.url + quotaObservation.image.path, width: quotaObservation.image.width, height: quotaObservation.image.height, caption: en ? quotaObservation.image.captionEn : quotaObservation.image.captionZh, creditText: "Kimi console · evaluation account snapshot", isPartOf: { "@id": url + "#article" } }} />
    </section>
<section id="benchmark-caveats" className="scroll-mt-6">
      <h2>{en ? "How to read the official charts" : "官方图里，哪些口径最容易看错"}</h2>
      <p>{en ? "The launch charts cover general reasoning, coding, CAD, finance and factuality. BenchCAD's 92.7% tool-enabled result and 72.8% tool-free result represent different conditions. Finance charts show domain-specific tasks, not a guarantee that every financial workflow is safe to automate." : "发布图覆盖推理、编程、CAD、财经与事实性。BenchCAD 的有工具 92.7% 和无工具 72.8% 是两组条件；财经图里的成绩对应特定任务，不能扩写成所有财经流程都能可靠自动化。"}</p>
      <p>{en ? "The hallucination figures are errors on named benchmark sets, not a daily error rate for chat. Kimi's HLE with-tools score and a third-party HLE score can differ because tool access and evaluation rules differ. Keep the model, dataset, harness and budget attached to each number." : "幻觉图中的百分比，是指定 benchmark 集上的错误率，不能当成日常聊天出错率。官方 HLE with-tools 与第三方 HLE 也可能因工具、框架和评测规则不同而出现差距。每个数字都应带着型号、数据集、框架和预算一起看。"}</p>
    </section>
<section id="official-examples" className="scroll-mt-6">
      <p className="text-xs font-bold uppercase tracking-wider">{en ? "Official demonstrations · not reproduced by TOKRACE" : "官方展示 · 未由 TOKRACE 复现"}</p>
      <h2>{en ? "Official examples: watch the videos and inspect the source files" : "官方示例：看视频，也看源文件"}</h2>
      <p>{en ? "These materials come from Kimi's release page and official X post. They are vendor-selected demonstrations, separate from the original tests above. Expand a source group to browse. Videos start only when you press play; interactive projects open on their official sites." : "下面的素材来自 Kimi 发布页与官方 X 帖，是厂商选择展示的案例，与上面的本站原始测试分开阅读。按来源展开浏览，视频点击后播放，交互项目通过链接打开官方页面。"}</p>
      <div className="mt-5 space-y-4">
        <OfficialMediaGroup data={officialMedia} title={en ? "Official release page: games, 3D and finance examples" : "官方发布页：游戏、3D 与财经示例"} manifestPath="/evaluations/kimi-k3-1-pro/official-examples.json" en={en} />
        <OfficialMediaGroup data={xMedia} title={en ? "Official X launch post" : "官方 X 发布帖"} manifestPath="/evaluations/kimi-k3-1-pro/official-examples/x-post.json" en={en} />
      </div>
      {mediaCollections.flatMap(collection => collection.items).filter(item => !item.isExistingBenchmark).map(item => item.type === "video" && item.path && item.posterPath && item.publishedAt ? <JsonLd key={item.id} data={{ "@context": "https://schema.org", "@type": "VideoObject", "@id": url + "#" + item.id + "-video", name: en ? item.titleEn : item.titleZh, description: en ? item.captionEn : item.captionZh, contentUrl: BRAND.url + item.path, thumbnailUrl: BRAND.url + item.posterPath, uploadDate: item.publishedAt, ...(item.durationSeconds ? { duration: `PT${item.durationSeconds}S` } : {}), creditText: item.credit, citation: item.sourcePage, isPartOf: { "@id": url + "#article" } }} /> : item.type === "image" && item.path ? <JsonLd key={item.id} data={{ "@context": "https://schema.org", "@type": "ImageObject", "@id": url + "#" + item.id + "-image", contentUrl: BRAND.url + item.path, width: item.width, height: item.height, caption: en ? item.captionEn : item.captionZh, creditText: item.credit, citation: item.sourcePage, isPartOf: { "@id": url + "#article" } }} /> : null)}
    </section>
{review.stoppedBatches && review.stoppedBatches.length > 0 && <section id="stopped-batch" className="scroll-mt-6">
      <h2>{en ? "Stopped historical subset: 22 short text completions and one interruption" : "已停止的历史子集：22 次短文本完成与 1 次中断"}</h2>
      <p>{en ? "This earlier OpenAI-compatible batch remains separate from the new native Anthropic Messages batch. Its original stopping context and exact parameters remain in the immutable archive; no archived response is merged into the new comparison." : "此前的 OpenAI 兼容接口批次，与新的原生 Anthropic Messages 批次分别保留。原始停止背景与准确参数可在不可变档案中查阅；旧回答未并入新的对照。"}</p>
      {review.stoppedBatches.map(batch => <div key={batch.path}>
        <p><a href={batch.path}>{en ? "Download the entire stopped batch and its original context" : "下载完整中止批次及原始背景"}</a></p>
      </div>)}
      <p>{en ? "The 22 completed requests cover 15 extraction and seven strict-format instruction tasks. All 22 pass those narrow checks. Mode counts are unequal (default 7, low 7, max 8), so this is neither a complete comparison nor evidence for coding or visual performance. The interruption is excluded from the pass denominator because its upstream result is unknown." : "22 次已完成请求仅覆盖 15 次信息抽取和 7 次严格格式指令，这 22 次通过各自的窄范围检查。档位数量不均（默认 7、low 7、max 8），既不是完整对照，也不能证明编程或视觉表现。中断请求的上游结果未知，未纳入通过率分母。"}</p>
      <p className="break-all">{en ? "Archived endpoint / model" : "历史接口 / 型号"}：{stopped.endpoint} · {stopped.model}</p>
      <p>{en ? "Archived requests used a 12,288-token output limit and 600-second timeout with sampling parameters omitted. Recorded completed-request time totals " : "历史请求输出上限 12,288 token、超时 600 秒，省略采样参数。已完成请求的记录耗时合计 "}{(stopped.attempts.reduce((sum, attempt) => sum + (attempt.totalMs ?? 0), 0) / 1000).toFixed(2)}s{en ? "; this excludes the unknown interrupted duration and is not a speed ranking. Subscription quota has no asserted per-token invoice." : "；不含中断后的未知耗时，不能据此做速度排名。订阅额度消耗没有按量账单，不声称实付 token 费用。"}</p>
      {stopped.attempts.map((attempt, index) => {
        const task = BENCHMARK_CASES.find(candidate => candidate.id === attempt.id);
        const passed = attempt.status === "done" && task && checkCase(task, attempt.text);
        return <details key={`stopped-${index}`} className="my-3 rounded-lg border border-line p-4">
        <summary className="cursor-pointer">#{index + 1} · {en ? attempt.titleEn : attempt.title} · {modeName(attempt.mode)} · {attempt.status === "interrupted" ? (en ? "Interrupted; upstream state unknown" : "中断，上游状态未知") : passed ? (en ? "Predetermined checks passed" : "预定检查通过") : (en ? "Checks not passed" : "预定检查未通过")}</summary>
        <p className="break-words text-xs">{attempt.startedAt} · {en ? "Total" : "总耗时"} {attempt.totalMs == null ? "—" : (attempt.totalMs / 1000).toFixed(3) + "s"} · {en ? "First content" : "正文首响"} {attempt.firstContentMs == null ? "—" : (attempt.firstContentMs / 1000).toFixed(3) + "s"} · {en ? "Input / completion / reasoning tokens" : "输入 / 总输出 / 思考 token"} {attempt.promptTokens ?? "—"} / {attempt.outputTokens ?? "—"} / {attempt.reasoningTokens ?? "—"}</p>
        <h3>{en ? "Exact prompt" : "完整题目"}</h3><pre className="overflow-auto whitespace-pre-wrap break-words text-xs">{attempt.prompt}</pre>
        <h3>{en ? "Original answer" : "原始回答"}</h3><pre className="overflow-auto whitespace-pre-wrap break-words text-xs">{attempt.text || (en ? "No response retained; upstream state unknown." : "未留存到回答，上游状态未知。")}</pre>
      </details>; })}
    </section>}
<section id="evidence" className="scroll-mt-6">
      <h2>{en ? "Original prompts, answers and code checks" : "原题、原始回答与代码检查"}</h2>
      <p><a href={evidencePath}>{en ? "Text and code evidence (JSON)" : "文本与代码原始证据（JSON）"}</a>{" · "}<a href={visualEvidencePath}>{en ? "Static visual evidence" : "静态视觉证据"}</a>{" · "}<a href={supplementEvidencePath}>{en ? "Modes, retries and animation evidence" : "档位、重试与动画证据"}</a>{" · "}<a href={recoveryEvidencePath}>{en ? "Independent recovery batch" : "独立恢复批次"}</a></p>
      <p>{en ? "Each record retains its prompt, response, requested model, returned model, parameters, token usage, completion status and timing. Public evidence excludes hidden reasoning content and credentials. The exact request budget takes precedence over the general methodology text." : "逐条保留提示词、正文、请求与返回型号、参数、用量、结束状态和耗时。公开记录不含隐藏思维链或凭证。具体预算以逐次请求参数为准，不能把不同预算批次当成同预算首轮比较。"}</p>
      {review.attempts.map((attempt, index) => <details key={`text-${attempt.id}-${attempt.mode}-${index}`} className="my-3 rounded-lg border border-line p-4">
        <summary className="cursor-pointer">{en ? attempt.titleEn : attempt.title} · {modeName(attempt.mode)} · {resultLabel(attempt)}</summary>
        <p className="break-words text-xs">{attempt.startedAt} · {en ? "Total" : "总耗时"} {((attempt.totalMs ?? 0) / 1000).toFixed(3)}s · {en ? "First content" : "正文首响"} {attempt.firstContentMs == null ? "—" : (attempt.firstContentMs / 1000).toFixed(3) + "s"} · {en ? "Input / completion / reasoning tokens" : "输入 / 总输出 / 思考 token"} {attempt.promptTokens ?? "—"} / {attempt.outputTokens ?? "—"} / {attempt.reasoningTokens ?? "—"} · {attempt.finishReason ?? attempt.status}</p>
        <h3>{en ? "Exact prompt" : "完整题目"}</h3><pre className="overflow-auto whitespace-pre-wrap break-words text-xs">{attempt.prompt}</pre>
        <h3>{en ? "Original answer" : "原始回答"}</h3><pre className="overflow-auto whitespace-pre-wrap break-words text-xs">{attempt.text}</pre>
        <details className="mt-3"><summary className="cursor-pointer">{en ? "Exact API request and budget" : "实际 API 请求与预算"}</summary><pre className="overflow-auto whitespace-pre-wrap break-words text-xs">{JSON.stringify(attempt.request, null, 2)}</pre></details>
        {attempt.error && <p className="break-words">{attempt.error}</p>}
      </details>)}
      {review.coding.map((attempt, index) => <details key={`code-${attempt.id}-${attempt.mode}-${index}`} className="my-3 rounded-lg border border-line p-4">
        <summary className="cursor-pointer">{en ? attempt.titleEn : attempt.title} · {modeName(attempt.mode)} · {resultLabel(attempt)} · {attempt.checkCount} {en ? "planned checks" : "项预定检查"}</summary>
        <p className="break-words text-xs">{attempt.startedAt} · {en ? "Total" : "总耗时"} {((attempt.totalMs ?? 0) / 1000).toFixed(3)}s · {en ? "First content" : "正文首响"} {attempt.firstContentMs == null ? "—" : (attempt.firstContentMs / 1000).toFixed(3) + "s"} · {en ? "Input / completion / reasoning tokens" : "输入 / 总输出 / 思考 token"} {attempt.promptTokens ?? "—"} / {attempt.outputTokens ?? "—"} / {attempt.reasoningTokens ?? "—"} · {attempt.finishReason ?? attempt.status}</p>
        <h3>{en ? "Exact prompt" : "完整题目"}</h3><pre className="overflow-auto whitespace-pre-wrap break-words text-xs">{attempt.prompt}</pre>
        <h3>{en ? "Original code" : "原始代码"}</h3><pre className="overflow-auto whitespace-pre-wrap break-words text-xs">{attempt.text}</pre>
        <h3>{en ? "Executable checks" : "可执行检查"}</h3><pre className="overflow-auto whitespace-pre-wrap break-words text-xs">{attempt.checks}</pre>
        <details className="mt-3"><summary className="cursor-pointer">{en ? "Exact API request and budget" : "实际 API 请求与预算"}</summary><pre className="overflow-auto whitespace-pre-wrap break-words text-xs">{JSON.stringify(attempt.request, null, 2)}</pre></details>
        {attempt.checkError && <p className="break-words">{attempt.checkError}</p>}
      </details>)}
    </section>
<section id="faq" className="scroll-mt-6">
      <h2>{en ? "Frequently asked questions" : "常见问题"}</h2>
      {faqs.map(([question, answer]) => <details key={question} className="my-3 rounded-lg border border-line p-4"><summary className="cursor-pointer font-bold text-ink">{question}</summary><p>{answer}</p></details>)}
    </section>
<section id="sources" className="scroll-mt-6 border-t border-line pt-6 text-xs">
      <h2>{en ? "Sources, image attribution and related reviews" : "来源、图片归属与延伸阅读"}</h2>
      <p><a href={officialUrl}>{en ? "Kimi K3.1 Pro official launch" : "Kimi K3.1 Pro 官方发布"}</a>{" · "}<a href={aaUrl}>{en ? "Artificial Analysis launch analysis" : "Artificial Analysis 发布分析"}</a>{" · "}<a href={sourceEvidencePath}>{en ? "Image sources, dimensions and SHA-256 manifest" : "图片来源、尺寸及 SHA-256 清单"}</a></p>
      <p>{en ? "AA figures belong to Artificial Analysis; official figures belong to Kimi / Moonshot AI. Original image files are reproduced for the requested model review with attribution; they are not TOKRACE-generated charts. The dataset license covers our own evidence, not these third-party images." : "AA 图版权归 Artificial Analysis；官方图版权归 Kimi / 月之暗面。本文按评测需要附来源展示原始图片，未将其改画为本站图表。本站数据集许可不扩展至这些第三方图片。"}</p>
      <p>{en ? "Compare the same task format: " : "同类任务对照："}<Link href={localizedPath("/guides/deepseek-v4-1-flash-1017", locale)}>DeepSeek V4.1 Flash 1017</Link>{" · "}<Link href={localizedPath("/guides/minimax-m3-1-flash", locale)}>MiniMax M3.1 Flash</Link>{" · "}<Link href={localizedPath("/guides/kimi-k3-1", locale)}>{en ? "Kimi K3.1 historical teaser" : "Kimi K3.1 历史预告"}</Link></p>
      <p><Link href={localizedPath("/reports", locale)}>{en ? "← All reports" : "← 返回全部报告"}</Link></p>
    </section>
</div>
</details>
</InfoPage>;
}
