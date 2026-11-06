import { REVIEW_PRESENTATION_UPDATED_AT } from "@/lib/model-review-presentation";
import Image from "next/image";
import Link from "next/link";
import { ArticleNavigation, type ArticleSection } from "@/components/ArticleNavigation";
import { InfoPage, infoMetadata } from "@/components/InfoPage";
import { JsonLd } from "@/components/JsonLd";
import { VisualEvaluation, type VisualEvaluationData } from "@/components/VisualEvaluation";
import type { VisualSupplementData } from "@/components/VisualSupplement";
import { BRAND } from "@/lib/brand";
import { DEFAULT_LOCALE, localizedPath, normalizeLocale } from "@/lib/i18n";
import { DATASET_LICENSE_URL } from "@/lib/structured-data";
import rawReview from "@/public/evaluations/longcat-2-5-20261026.json";
import rawVisuals from "@/public/evaluations/longcat-2-5-20261026-visual.json";
import rawSupplement from "@/public/evaluations/longcat-2-5-20261026-supplement.json";
import rawFrontend from "@/public/evaluations/longcat-2-5-20261026-frontend.json";
import rawResponses from "@/public/evaluations/longcat-2-5-20261026-responses.json";
import accounting from "@/public/evaluations/longcat-2-5-20261026-accounting.json";
import longcatClaudeCode from "@/public/evaluations/longcat-2-5-claude-code.json";
import rawSources from "@/public/evaluations/longcat-2-5/sources.json";

const pathname = "/guides/longcat-2-5";
const evidencePath = "/evaluations/longcat-2-5-20261026.json";
const frontendPath = "/evaluations/longcat-2-5-20261026-frontend.json";
const responsesPath = "/evaluations/longcat-2-5-20261026-responses.json";
const accountingPath = "/evaluations/longcat-2-5-20261026-accounting.json";
const sourcesPath = "/evaluations/longcat-2-5/sources.json";
const publishedAt = "2026-10-26T16:00:41Z";
const docs = "https://longcat.ai/platform/docs";
const titleZh = "LongCat 2.5 Preview 历史评测：文本、前端与 SVG 实测";
const titleEn = "LongCat 2.5 Preview Archive: Text, Frontend and SVG Tests";
const descriptionZh = "解读美团 LongCat 2.5：核查公开版本，实测 Preview 的文本、代码、前端页面、SVG、骑车动画与单图读数。附原始回答、思考开关及独立 Responses low 诊断、官方历史 benchmark 图、API 价格及限制。";
const descriptionEn = "LongCat 2.5 analysis with Preview text/code, responsive frontend, SVG, animation and chart-reading tests, separate Responses low diagnostics, API prices and historical benchmarks.";
type Props = { params: Promise<{ lang: string }> };
type Attempt = {
  id: string; mode: string; title?: string; titleEn?: string; prompt: string; text: string;
  status: string; startedAt: string; totalMs: number | null; firstContentMs: number | null;
  promptTokens: number | null; outputTokens: number | null; reasoningTokens: number | null;
  finishReason: string | null; pass?: boolean; checks?: string; checkError?: string | null;
  checkCount?: number; error?: string | null; request?: { max_tokens?: number };
};
type ReviewData = { model: string; endpoint: string; updatedAt?: string; publishedAt?: string; attempts: Attempt[]; coding: Attempt[] };
type FrontendAttempt = Omit<Attempt, "checks"> & {
  htmlPath?: string; assessmentZh?: string; assessmentEn?: string;
  screenshots?: { desktop?: { path: string; width: number; height: number }; mobile?: { path: string; width: number; height: number } };
  checks?: { name: string; pass: boolean }[];
};
type SourceImage = {
  id: string; path: string; width: number; height: number; sourceUrl: string; originalUrl: string;
  titleZh: string; titleEn: string; altZh: string; altEn: string; captionZh: string; captionEn: string;
  credit: string; modelScope?: string; kind: string; originalBytes: boolean;
};
type ResponsesData = {
  updatedAt: string; endpoint: string; model: string; methodZh: string; methodEn: string;
  attempts: { id: string; category: string; prompt: string; text: string; totalMs: number; outputTokens: number; status: string; pass: boolean; httpStatus: number; image?: { path: string; width: number; height: number }; checks?: { name: string; pass: boolean; expected?: number; actual?: number }[] }[];
};
const review = rawReview as ReviewData;
const visuals = rawVisuals as VisualEvaluationData;
const supplement = rawSupplement as VisualSupplementData;
const frontend = rawFrontend as { attempts: FrontendAttempt[]; updatedAt?: string; methodZh?: string; methodEn?: string };
const responses = rawResponses as ResponsesData;
const sources = rawSources as { images: SourceImage[]; capturedAt?: string; checkedAt?: string; updatedAt?: string };
const articleModifiedAt = new Date(Math.max(...["2026-11-02T03:00:00Z", publishedAt, longcatClaudeCode.updatedAt, review.updatedAt, review.publishedAt, supplement.updatedAt, frontend.updatedAt, responses.updatedAt, accounting.updatedAt, sources.updatedAt, sources.capturedAt, sources.checkedAt].filter((value): value is string => !!value && Number.isFinite(Date.parse(value))).map(Date.parse))).toISOString();
const modeName = (mode: string, en: boolean) => mode === "disabled" ? (en ? "Thinking off" : "关闭思考") : (en ? "Thinking on" : "开启思考");
const seconds = (ms: number | null) => ms == null ? "—" : `${(ms / 1000).toFixed(2)}s`;

function SourceFigure({ image, en }: { image: SourceImage; en: boolean }) {
  return <figure id={image.id} className="overflow-hidden rounded-xl border border-line bg-card">
    <h3 className="p-4 font-bold text-ink">{en ? image.titleEn : image.titleZh}</h3>
    <a href={image.path} target="_blank" rel="noopener noreferrer" aria-label={(en ? "Open full figure: " : "打开完整图片：") + (en ? image.titleEn : image.titleZh)}><Image src={image.path} width={image.width} height={image.height} alt={en ? image.altEn : image.altZh} unoptimized loading="lazy" className="h-auto w-full cursor-zoom-in bg-white" /></a>
    <figcaption className="space-y-2 p-4">
      <p>{en ? image.captionEn : image.captionZh}</p>
      <p className="text-xs">{image.credit}{image.modelScope && ` · ${image.modelScope}`} · <a href={image.sourceUrl}>{en ? "Official source" : "官方原文"}</a>{image.originalBytes && <> · <a href={image.originalUrl} target="_blank" rel="noopener noreferrer">{en ? "Original image URL" : "来源图片地址"}</a></>} · <a href={image.path} download>{en ? (image.originalBytes ? "Zoom / download original" : "Zoom / download page capture") : (image.originalBytes ? "放大 / 下载原图" : "放大 / 下载网页截图")}</a></p>
    </figcaption>
  </figure>;
}

function Evidence({ attempt, en, code }: { attempt: Attempt; en: boolean; code?: boolean }) {
  return <details id={`evidence-${attempt.id}-${attempt.mode}`} className="mb-3 rounded-xl border border-line bg-card p-4">
    <summary className="cursor-pointer font-bold text-ink">{(en ? attempt.titleEn : attempt.title) ?? attempt.id} · {modeName(attempt.mode, en)} · {attempt.status !== "done" ? attempt.status : attempt.pass ? (en ? "Checks passed" : "检查通过") : (en ? "Checks not all passed" : "检查未全部通过")}</summary>
    <p className="mt-3 text-xs">{attempt.startedAt} · {en ? "First content / total" : "正文首响 / 总耗时"}：{seconds(attempt.firstContentMs)} / {seconds(attempt.totalMs)} · {en ? "Finish reason" : "结束原因"}：{attempt.finishReason ?? attempt.status}</p>
    <p className="text-xs">{en ? "Input / completion / reasoning tokens" : "输入 / 输出 / 思考 token"}：{attempt.promptTokens ?? "—"} / {attempt.outputTokens ?? "—"} / {attempt.reasoningTokens ?? "—"}{attempt.request?.max_tokens && ` · max_tokens=${attempt.request.max_tokens}`}</p>
    <h3 className="mt-4 font-bold text-ink">{en ? "Exact prompt" : "完整提示词"}</h3><pre className="overflow-auto whitespace-pre-wrap break-words text-xs">{attempt.prompt}</pre>
    <h3 className="mt-4 font-bold text-ink">{en ? (code ? "Original code answer" : "Original answer") : (code ? "原始代码回答" : "原始回答")}</h3><pre className="max-h-[32rem] overflow-auto whitespace-pre-wrap break-words text-xs">{attempt.text || (en ? "No answer content returned." : "未返回正文。")}</pre>
    {attempt.checks && <><h3 className="mt-4 font-bold text-ink">{en ? "Predetermined executable checks" : "预先确定的可执行检查"}</h3><pre className="overflow-auto whitespace-pre-wrap break-words text-xs">{attempt.checks}</pre></>}
    {(attempt.error || attempt.checkError) && <p className="break-words">{attempt.error ?? attempt.checkError}</p>}
  </details>;
}

export async function generateMetadata({ params }: Props) {
  const locale = normalizeLocale((await params).lang) ?? DEFAULT_LOCALE;
  const en = locale === "en";
  const title = en ? titleEn : titleZh;
  const description = en ? descriptionEn : descriptionZh;
  const metadata = infoMetadata(locale, pathname, title, description);
  const hero = visuals.attempts.find(attempt => attempt.id === "dashboard" && attempt.pngPath) ?? visuals.attempts.find(attempt => attempt.pngPath);
  const images = hero?.pngPath ? [{ url: hero.pngPath, width: hero.width, height: hero.height, alt: en ? hero.altEn : hero.altZh }] : undefined;
  return {
    ...metadata,
    keywords: ["LongCat 2.5", "LongCat-2.5-Preview", "美团 LongCat", "LongCat 2.5 评测", "LongCat benchmark", "LongCat API", "LongCat 价格", "LongCat frontend"],
    openGraph: { ...metadata.openGraph, type: "article", publishedTime: publishedAt, modifiedTime: REVIEW_PRESENTATION_UPDATED_AT, ...(images ? { images } : {}) },
    twitter: { ...metadata.twitter, ...(images ? { images: images.map(image => image.url) } : {}) },
  };
}

export default async function LongCatReview({ params }: Props) {
  const locale = normalizeLocale((await params).lang) ?? DEFAULT_LOCALE;
  const en = locale === "en";
  const title = en ? titleEn : titleZh;
  const description = en ? descriptionEn : descriptionZh;
  const url = BRAND.url + localizedPath(pathname, locale);
  const navigation: ArticleSection[] = [
    { id: "verdict", label: en ? "What the evidence says" : "先看结论" },
    { id: "brief-reading", label: en ? "Reading the brief" : "如何理解这份 brief" },
    { id: "model-details", label: en ? "Version, specs and prices" : "版本、参数与价格" },
    { id: "test-method", label: en ? "Test method and modes" : "实测方法与思考开关" },
    { id: "text-code-tests", label: en ? "Text and code results" : "文本与代码结果" },
    { id: "frontend-tests", label: en ? "Responsive frontend case" : "响应式前端案例" },
    { id: "responses-tests", label: en ? "Chart reading and Responses low" : "读图与 Responses low" },
    { id: "visual-findings", label: en ? "What the visual cases show" : "视觉结果说明什么" },
    { id: "visual-supplement", label: en ? "Animations and retries" : "动画与重试记录" },
    { id: "visual-tests", label: en ? "First SVG attempts" : "四类 SVG 首轮" },
    { id: "official-benchmarks", label: en ? "Benchmark source check" : "benchmark 来源核查" },
    { id: "historical-benchmarks", label: en ? "Official historical figures" : "官方历史版本原图" },
    { id: "evidence", label: en ? "Original answers and checks" : "原始回答与检查" },
    { id: "faq", label: en ? "Questions and answers" : "常见问题" },
    { id: "sources", label: en ? "Sources and related reviews" : "来源与相关评测" },
  ];
  const faqs = en ? [
    ["Which version did this October review test?", "The October 26 checks and requests on this page used LongCat-2.5-Preview. LongCat-2.5 was subsequently released in November; its new evaluation is linked above. These historical responses retain their Preview identity."],
    ["Does this review verify native multimodal or long-running agent performance?", "A separate Responses request supplies one public chart through input_image and correctly extracts its model legend and six values, passing seven checks. With no no-image control or repeat trials, this does not rule out memorization or establish a native architecture, general visual ability, million-token reliability, autonomous repository work or 3D performance."],
    ["Can LongCat be compared at low and max thinking levels?", "The main batch uses Chat Completions, whose checked documentation describes a thinking switch and thinking_budget rather than named effort tiers. Responses documents none/minimal/low/medium/high/xhigh, with no max label. Two independent low requests succeeded, but parameter acceptance does not prove actual reasoning strength or establish a cross-interface comparison."],
    ["Are the official benchmark figures LongCat 2.5 scores?", "No matching official LongCat 2.5 benchmark chart was located in the checked sources. Any historical official figures below retain their original model version and must not be read as new 2.5 scores or TOKRACE reproductions."],
    ["What does the API cost?", "The checked promotional price per million tokens is US$0.30 input, US$0.006 cached input and US$1.20 output; the China price page lists RMB2, RMB0.04 and RMB8 respectively. These are temporary vendor prices, separate from site trial quotas; the provider invoice determines the charge."],
  ] : [
    ["本页 10 月评测测的是哪个版本？", "本页 10 月 26 日核查和请求使用 LongCat-2.5-Preview。11 月已发布 LongCat-2.5 正式版，新评测见上方入口；历史响应保留 Preview 身份，不改成正式版成绩。"],
    ["这轮测到了原生多模态和长程 Agent 吗？", "另用 Responses 的 input_image 输入一张公开图，正确提取图例型号与六项数值，7 项检查通过。由于没有无图对照或重复运行，不能排除记忆，也不能证明原生架构、通用视觉能力、百万上下文可靠性、自动完成仓库工作或 3D 能力。"],
    ["为什么本轮没有 low / max 档位对比？", "主要批次使用 Chat Completions，该接口文档描述 thinking 开关和 thinking_budget，未列命名 effort 档位。Responses 另列 none/minimal/low/medium/high/xhigh，没有 max；独立两次 low 请求成功，但参数被接受不等于证明实际思考强度，不能构成跨接口的档位横评。"],
    ["页面中的官方 benchmark 图属于 LongCat 2.5 吗？", "本次核查未找到对应 LongCat 2.5 的官方 benchmark 图。下方历史原图保留原模型版本，只用于理解厂商此前的评测方向，不能当作 2.5 新成绩或本站复现。"],
    ["LongCat API 多少钱？", "核查的限时价格每百万 token 为输入 0.30 美元、缓存输入 0.006 美元、输出 1.20 美元；国内价格页分别为 2 元、0.04 元和 8 元。限时单价与本站试用额度分别计算，实际费用以厂商结算为准。"],
  ];
  const textPassed = review.attempts.filter(attempt => attempt.pass).length;
  const codePassed = review.coding.filter(attempt => attempt.pass).length;
  const frontendChecks = frontend.attempts.flatMap(attempt => attempt.checks ?? []);
  return <InfoPage locale={locale} pathname={pathname} title={title} intro={description} updatedAt="2026-11-02" sidebar={<ArticleNavigation sections={navigation} en={en} />}>
<JsonLd data={{
      "@context": "https://schema.org", "@type": "TechArticle", "@id": url + "#article", headline: title, description,
      inLanguage: locale, datePublished: publishedAt, dateModified: articleModifiedAt, mainEntityOfPage: url, url,
      author: { "@type": "Organization", name: BRAND.publisher, url: BRAND.url }, publisher: { "@type": "Organization", name: BRAND.publisher, url: BRAND.url },
      about: { "@type": "SoftwareApplication", name: "LongCat-2.5-Preview", applicationCategory: "AI model" },
      image: [...new Set([...visuals.attempts.flatMap(attempt => attempt.pngPath ? [BRAND.url + attempt.pngPath] : []), ...sources.images.map(image => BRAND.url + image.path)])],
      citation: [...new Set([docs + "/", docs + "/api/model-params", docs + "/api/chat", docs + "/api/responses", docs + "/codex", docs + "/pricing/longcat-2.5", docs + "/change-log", "https://github.com/meituan-longcat", "https://huggingface.co/meituan-longcat", ...sources.images.map(image => image.sourceUrl)])],
    }} />
<JsonLd data={{ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: BRAND.full, item: BRAND.url + localizedPath("/", locale) },
      { "@type": "ListItem", position: 2, name: en ? "Reports" : "实测报告", item: BRAND.url + localizedPath("/reports", locale) },
      { "@type": "ListItem", position: 3, name: title, item: url },
    ] }} />
<JsonLd data={{ "@context": "https://schema.org", "@type": "Dataset", "@id": url + "#dataset", name: "LongCat-2.5-Preview: October 26, 2026 independent evaluation batch", description, license: DATASET_LICENSE_URL, url: url + "#evidence", dateModified: articleModifiedAt, creator: { "@type": "Organization", name: BRAND.publisher }, variableMeasured: ["Predetermined task checks", "Time to first answer content", "API token usage", "SVG geometry", "Responsive frontend behavior", "Single-chart value extraction"], distribution: [evidencePath, frontendPath, responsesPath, accountingPath, visuals.evidencePath, supplement.evidencePath].map(path => ({ "@type": "DataDownload", encodingFormat: "application/json", contentUrl: BRAND.url + path })) }} />
<JsonLd data={{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map(([question, answer]) => ({ "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: answer } })) }} />
<VisualEvaluation data={visuals} locale={locale} supplement={supplement} />
<details id="review-details" className="scroll-mt-6 rounded-xl border border-line bg-card p-5">
<summary className="cursor-pointer font-bold text-ink">{en ? "Test details, original answers and sources" : "测试详情、原始回答与来源"}</summary>
<div className="mt-5 space-y-7">
<section className="rounded-xl border border-line bg-card p-5">
      <p className="font-bold text-ink">{en ? "LongCat-2.5 was officially released on November 2." : "LongCat-2.5 已于 11 月 2 日正式上线。"}</p>
      <p><Link href={localizedPath("/guides/longcat-2-5-release", locale)}>{en ? "Read the new release review, official benchmarks and independently generated Claude Code outputs →" : "查看正式版新评测、官方 benchmark 与独立生成的 Claude Code 作品 →"}</Link></p>
      <p className="text-xs">{en ? "The results below are the October Preview archive. Version-availability statements describe what was verifiable at that time." : "下文是 10 月 Preview 历史记录，关于版本是否可用的表述均指当时核查状态。"}</p>
    </section>
<section id="verdict" className="scroll-mt-6 rounded-xl border border-line bg-card p-5">
      <p className="text-xs font-bold uppercase tracking-wider">{en ? "TOKRACE original tests · October 26–27, 2026 (Asia/Shanghai)" : "TOKRACE 原创实测 · 2026 年 10 月 26–27 日（北京时间）"}</p>
      <h2>{en ? "The useful question is how reliably it turns a request into a usable artifact" : "重点看它能否把需求稳定地变成可用成品"}</h2>
      <p>{en ? "The October brief positions LongCat 2.5 around native multimodal agents, visual coding, creative design and 3D. At the October 26 check, public documentation and our requests identified LongCat-2.5-Preview. The evidence below belongs to that historical Preview API; the November release has its own evaluation linked above." : "10 月 brief 把 LongCat 2.5 的重点放在原生多模态 Agent、视觉编码、创意设计和 3D。10 月 26 日核查时，公开文档与本页请求使用 LongCat-2.5-Preview；以下证据属于这次历史 Preview 运行。11 月正式版的新评测已在上方单独链接。"}</p>
      <p>{en ? `This batch contains ${review.attempts.length} text attempts (${textPassed} passing the predetermined checks), ${review.coding.length} coding attempts (${codePassed} passing all scheduled checks), plus separate SVG, animation and responsive frontend evidence. Read each mode and each artifact below: a renderable image or attractive page can still contain incorrect geometry or non-working controls.` : `本批次包含 ${review.attempts.length} 次文本请求（${textPassed} 次通过预定检查）、${review.coding.length} 次代码请求（${codePassed} 次通过该题全部预定检查），另有 SVG、动画与响应式前端证据。具体判断要看下方逐档作品：图能显示、页面好看，不代表几何关系或交互都正确。`}</p>
      <p>{en ? `The clearest strength in this sample is turning constrained tasks into working output: text and short functions pass, and the frontend pages pass ${frontendChecks.filter(check => check.pass).length}/${frontendChecks.length} browser checks across desktop and phone. Both pages still contain a business inconsistency: an advanced route says three hours, but its 09:15 start and 11:30 wrap-up allow only two hours fifteen minutes. The first thinking-off pelican also renders with a disconnected front fork. These are useful prototypes that still need content and structural review.` : `本轮最清楚的优点，是能把有明确约束的需求做成可运行的输出：文本和短函数通过检查，前端页面在桌面、手机合计通过 ${frontendChecks.filter(check => check.pass).length}/${frontendChecks.length} 项浏览器检查。但两档页面都有业务内容矛盾：进阶路线标注三小时，日程从 09:15 出发到 11:30 收尾却只有两小时十五分；关闭思考的首张鹈鹕也缺少连接前轮的前叉。做原型的完成度较好，交付前仍需核对内容与结构。`}</p>
      <p>{en ? "These small tasks support a bounded assessment of instruction following and code output. They do not support a general model ranking or a claim that LongCat beats the competitors named in a marketing brief." : "这些小任务可以帮助判断指令遵循和代码输出，不能据此排出通用模型名次，也不能推出它胜过 brief 中提到的竞品。"}</p>
      <p><Link href={localizedPath("/guides/longcat-2-5-claude-code", locale)}>{en ? "LongCat in Claude Code: actual Blender, 3D, SVG and knowledge-video runs, with delivered and incomplete artifacts" : "LongCat × Claude Code 创作实跑：Blender、3D、SVG 与知识视频，保留成功和未完成结果"}</Link></p>
      <p><Link href={localizedPath("/guides/longcat-2-5-preview", locale)}>{en ? "Earlier Preview review: October 10 text/code and October 20–22 visual tests" : "历史 Preview 评测：10 月 10 日文本/代码与 10 月 20–22 日视觉测试"}</Link></p>
    </section>
<section id="brief-reading" className="scroll-mt-6">
      <h2>{en ? "How to read the brief: positioning is a testable hypothesis" : "解读 brief：它想强调什么，应该怎样验证"}</h2>
      <p>{en ? "The strongest signal is the move from answering questions to producing usable interfaces and completing multi-step work. A responsive frontend task therefore matters more than a screenshot alone: the page should preserve content on a phone, show the right data, and make its controls work." : "这份 brief 最值得关注的，是从回答问题转向做出可用界面、完成多步工作。前端案例因此不能只放一张漂亮截图，还要看手机端内容是否完整、数据是否正确、按钮是否真正起作用。"}</p>
      <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[34rem] border-collapse text-left text-sm"><thead><tr className="border-b border-line"><th className="p-3">{en ? "Brief claim" : "brief 提法"}</th><th className="p-3">{en ? "What it would require" : "需要什么证据"}</th><th className="p-3">{en ? "Scope here" : "本页边界"}</th></tr></thead><tbody>
        <tr className="border-b border-line"><td className="p-3">{en ? "Native multimodal" : "原生多模态"}</td><td className="p-3">{en ? "Saved image/video inputs and grounded answers" : "保留图片/视频输入与有依据的回答"}</td><td className="p-3">{en ? "One independent input_image chart-reading test; SVG output alone does not test seeing" : "独立做了一次 input_image 读图；SVG 输出本身不能代替看图"}</td></tr>
        <tr className="border-b border-line"><td className="p-3">{en ? "Visual coding and creative design" : "视觉编码与创意设计"}</td><td className="p-3">{en ? "Original code, desktop/mobile renders and working controls" : "原代码、桌面/手机成图、实际交互"}</td><td className="p-3">{en ? "Single-response frontend and fixed drawing tasks" : "单轮前端页面与固定绘图任务"}</td></tr>
        <tr className="border-b border-line"><td className="p-3">{en ? "Long-running agents and 3D" : "长程 Agent 与 3D"}</td><td className="p-3">{en ? "A fixed harness, tool traces, task success and repeat runs" : "固定 harness、工具轨迹、任务成功率与重复运行"}</td><td className="p-3">{en ? "Not established by these short output tasks" : "本轮短输出任务不足以验证"}</td></tr>
        <tr><td className="p-3">1.6T / ≈48B</td><td className="p-3">{en ? "A version-matched architecture report" : "对应版本的架构报告"}</td><td className="p-3">{en ? "A brief claim; matching public figures were found for 2.0, not a confirmed 2.5 architecture report" : "属于 brief 声明；相同公开数字可见于 2.0，尚未核实对应 2.5 的架构报告"}</td></tr>
      </tbody></table></div>
      <p className="mt-4">{en ? "Editorial judgment: model parameters describe scale, not the quality of a delivered website. Agent benchmarks also measure the model together with its tools and execution scaffold. Without matching those conditions, naming Claude, GPT, Kimi or DeepSeek does not make a controlled comparison." : "编辑判断：参数量描述规模，不能替代网站交付质量。Agent 跑分也同时受到工具和执行框架影响。没有统一任务与运行条件，即使列出 Claude、GPT、Kimi 或 DeepSeek 的名字，也不构成可比较的横评。"}</p>
    </section>
<section id="model-details" className="scroll-mt-6">
      <h2>{en ? "Verified public model, specifications and API prices" : "公开型号、参数与 API 价格核查"}</h2>
      <div className="overflow-x-auto"><table className="w-full min-w-[32rem] border-collapse text-left text-sm"><tbody>
        {[
          [en ? "Tested API model" : "实测 API 型号", review.model],
          [en ? "Endpoint" : "调用地址", review.endpoint],
          [en ? "Public release boundary" : "公开版本边界", en ? "Preview; the checked changelog lists September 25, 2026" : "Preview；核查的更新日志列出 2026-09-25"],
          [en ? "Context" : "上下文", "1,048,576 tokens"],
          [en ? "Output limit" : "输出上限", en ? "Parameter reference: 256K; Quick Start: 128K. The public pages disagree." : "参数页写 256K；快速开始写 128K，公开页面存在差异。"],
          [en ? "Thinking, this Chat Completions test" : "本轮 Chat Completions 思考模式", "enabled / disabled"],
          [en ? "Separate Responses API" : "另一个 Responses 接口", "reasoning.effort: none / minimal / low / medium / high / xhigh"],
          [en ? "Documented temperature for the on/off test" : "开关对照的文档规定温度", en ? "Thinking on: 1.0; off: 0.7. A request temperature of 0 is overridden." : "开启思考 1.0；关闭 0.7。请求 temperature=0 会被覆盖。"],
          [en ? "Promotional US$ / 1M tokens" : "限时美元价 / 百万 token", en ? "Input 0.30 · cached input 0.006 · output 1.20" : "输入 0.30 · 缓存输入 0.006 · 输出 1.20"],
          [en ? "Promotional RMB / 1M tokens" : "限时人民币价 / 百万 token", en ? "Input 2 · cached input 0.04 · output 8" : "输入 2 · 缓存输入 0.04 · 输出 8"],
        ].map(([label, value]) => <tr key={label} className="border-b border-line last:border-0"><th className="w-44 p-3 align-top text-ink">{label}</th><td className="break-words p-3">{value}</td></tr>)}
      </tbody></table></div>
      <p className="mt-4">{en ? "These are documented limits, not results from a million-token test. The API model name can refer to a changing service; a response returning the same alias does not prove an immutable checkpoint." : "这些是文档规格，不是百万 token 长测结果。API 名称可能对应持续更新的服务，响应返回相同别名也不能证明底层 checkpoint 固定。"}</p>
      <p><a href="/evaluations/longcat-2-5-20261026-access.json">{en ? "Live API model-list response saved for this run" : "本次保存的实时 API 型号列表响应"}</a></p>
      <p>{en ? "The official Responses reference separately documents input_image and reasoning.effort levels from none to xhigh, including low; the official Codex setup uses that interface. Two separate low requests below verify a usable response path, including one image input. They do not establish effort-tier semantics; a thinking token budget is not a substitute for those tiers." : "官方 Responses 文档另列 input_image 图片输入和 none 至 xhigh 的 reasoning.effort（含 low）；官方 Codex 配置走这个接口。下方独立两次 low 请求验证了可返回结果的路径，其中一次带图。但这仍不能证明档位的实际执行强度；thinking token 预算也不能替代 effort 档位。"} <a href={docs + "/api/responses"}>{en ? "Responses API reference" : "Responses API 文档"}</a> · <a href={docs + "/codex"}>{en ? "Official Codex setup" : "官方 Codex 配置"}</a></p>
      <p><a href={docs + "/api/model-params"}>{en ? "Parameter reference" : "参数页"}</a> · <a href={docs + "/"}>{en ? "Quick Start" : "快速开始"}</a> · <a href={docs + "/api/chat"}>{en ? "Chat API" : "对话 API"}</a> · <a href={docs + "/pricing/longcat-2.5"}>{en ? "Pricing" : "价格页"}</a> · <a href={docs + "/change-log"}>{en ? "Changelog" : "更新日志"}</a></p>
      <details className="mt-4 rounded-xl border border-line p-4"><summary className="cursor-pointer font-bold text-ink">{en ? "See the official price and parameter pages" : "查看官方价格与参数网页截图"}</summary><p className="mt-3">{en ? "Captured on October 26. These are documentation screenshots, not benchmark charts." : "10 月 26 日截取。以下是官方文档截图，不是 benchmark 图。"}</p><div className="mt-4 space-y-5">{sources.images.filter(image => image.kind === "official-page-capture" && (image.id !== (en ? "official-2-5-pricing-cn" : "official-2-5-pricing"))).map(image => <SourceFigure key={image.id} image={image} en={en} />)}</div></details>
    </section>
<section id="test-method" className="scroll-mt-6">
      <h2>{en ? "Test method: compare supported settings and retain every attempt" : "测试方法：按支持的模式比较，保留全部尝试"}</h2>
      <p>{en ? "This independent batch started on October 26 and continues across midnight into October 27, Beijing time; earlier review data stays separate. Four preselected text cases and two coding cases run in thinking-on/off modes; this is a small diagnostic subset, not the complete 15-case text suite. Four fixed SVG prompts test a cycling pelican, a 9:41 clock, a Q1–Q4 dashboard and a Chinese poster; the fifth visual task requests a four-second cycling animation. A separate prompt asks for a responsive web interface." : "本批次于北京时间 10 月 26 日启动，跨午夜延续至 27 日，与旧评测分开。预先选取四道文本题、两道代码题对比思考开关，是小样本诊断，不是完整 15 题文本套件。四类固定 SVG 题分别为鹈鹕骑车、9:41 钟表、Q1–Q4 数据面板和中文海报，第五题为四秒骑车动画；另外单独测试响应式网页。"}</p>
      <p>{en ? "New requests explicitly send thinking enabled or disabled; there is no separate omitted-switch group. They start at 12,288 output tokens with a 600-second timeout and requested temperature 0. The vendor documents fixed effective temperatures of 1.0/0.7 for on/off, so this compares documented modes rather than isolating thinking at one temperature. Failed generation/rendering attempts are retained; any budget increase is recorded per retry. Two independent queues may overlap, and local-client timings are not a speed ranking." : "新请求显式传入 thinking enabled 或 disabled，没有另设省略开关的组。起始输出预算为 12,288 token、超时 600 秒，请求温度为 0；厂商规定开/关模式实际温度为 1.0/0.7，因此这是模式比较，不能单独归因于思考。生成或渲染失败保留，重试增大预算时逐次披露。两个独立队列可能重叠，本地客户端耗时不用于速度排名。"}</p>
      <p>{en ? "SVG source is preserved without repairs. The published site embeds raster renders rather than executing model-generated SVG. Animations are sampled in an isolated browser into 40 WebP frames over four seconds, with playback disabled by default. Geometric and executable checks are distinguished from qualitative observations made by the AI assistant." : "SVG 原码不做人工修补，网站嵌入栅格成图，不执行模型生成的 SVG。动画在隔离浏览器中按四秒 40 帧采样为 WebP，默认静止。几何、可执行检查与 AI 助手作出的定性视觉观察分别说明。"}</p>
      <div className="mt-4 space-y-3 rounded-xl border border-line bg-card p-4">
        <h3 className="font-bold text-ink">{en ? "Full request accounting, including incomplete records" : "完整请求核算，包含不完整记录"}</h3>
        <p>{en ? `${accounting.total.requests} unique model calls: ${accounting.total.completed} completed, ${accounting.total.truncated} token-limit truncations and ${accounting.total.interrupted} local-storage interruption. The interrupted Chinese-poster retry encountered ENOSPC while saving. Its returned answer, final usage, upstream status and measured duration were not preserved; these are unknown, not a vendor error or an incorrect model answer. Eight static outputs and two animations ultimately render.` : `共 ${accounting.total.requests} 次独立模型调用：${accounting.total.completed} 次完成、${accounting.total.truncated} 次达到 token 上限截断、${accounting.total.interrupted} 次本地存储中断。中文海报的一次重试在保存时遇到 ENOSPC，返回正文、最终用量、上游状态和实测耗时未能保留，均为未知；这不是厂商错误，也不计作模型答错。最终八张静态图、两组动画均可渲染。`}</p>
        <p>{en ? `Elapsed wall-clock time: ${(accounting.wallClockMs / 60000).toFixed(2)} minutes with up to two overlapping queues. Recorded cumulative request time is at least ${(accounting.total.cumulativeRequestMs / 60000).toFixed(2)} minutes. Reported token totals are lower bounds: ${accounting.total.reportedPromptTokens.toLocaleString("en-US")} input and ${accounting.total.reportedOutputTokensIncludingReasoning.toLocaleString("en-US")} output, with ${accounting.total.reportedReasoningTokens.toLocaleString("en-US")} reasoning tokens already included in output. One call lacks final usage; the full billed token total and actual cost are unknown.` : `最多两个队列重叠运行，墙钟用时 ${(accounting.wallClockMs / 60000).toFixed(2)} 分钟，累计已记录请求耗时至少 ${(accounting.total.cumulativeRequestMs / 60000).toFixed(2)} 分钟。已报告 token 仅为下界：输入 ${accounting.total.reportedPromptTokens.toLocaleString("en-US")}、输出 ${accounting.total.reportedOutputTokensIncludingReasoning.toLocaleString("en-US")}，其中已包含思考 token ${accounting.total.reportedReasoningTokens.toLocaleString("en-US")}。一次调用缺少最终 usage，因此完整计费 token 和实际成本未知。`}</p>
        <p><a href={accountingPath}>{en ? "Download all request counts, budgets, timing and usage accounting" : "下载全部请求次数、预算、耗时与用量核算"}</a></p>
      </div>
      <p><Link href={localizedPath("/method", locale)}>{en ? "TOKRACE method and limitations" : "TOKRACE 方法与限制"}</Link> · <a href={evidencePath}>{en ? "Exact requests, returned IDs and budgets" : "准确请求、返回型号与预算"}</a></p>
    </section>
<section id="text-code-tests" className="scroll-mt-6">
      <h2>{en ? "Text and code: task checks, not a general intelligence score" : "文本与代码：按题检查，不汇成通用智能分"}</h2>
      <div className="grid gap-4 sm:grid-cols-2">{["disabled", "default"].map(mode => {
        const text = review.attempts.filter(attempt => attempt.mode === mode);
        const coding = review.coding.filter(attempt => attempt.mode === mode);
        return <article key={mode} className="rounded-xl border border-line bg-card p-5"><h3 className="font-bold text-ink">{modeName(mode, en)}</h3><p>{en ? "Text cases passing checks" : "文本题通过检查"}：{text.filter(attempt => attempt.pass).length} / {text.length}</p><p>{en ? "Coding cases passing every check" : "代码题全部检查通过"}：{coding.filter(attempt => attempt.pass).length} / {coding.length}</p><p className="text-xs">{en ? "Errors, incomplete responses and failed assertions remain in the original evidence below." : "请求错误、不完整回答和失败断言均保留在下方原始证据中。"}</p></article>;
      })}</div>
      <p className="mt-4">{en ? "A correct extraction or short function is evidence for that task. It does not establish performance on a large repository, tool selection or recovery from a multi-step failure. The earlier October 10 coding truncation remains in the historical review rather than being silently replaced by this batch." : "信息抽取正确、短函数能通过检查，说明的是该题表现，不能扩展成大型仓库、工具选择或多步失败恢复的结论。10 月 10 日的代码截断仍留在历史评测中，不会被本轮覆盖。"}</p>
      <h3 className="mt-5 font-bold text-ink">{en ? "A concrete case: parsing money without losing integer precision" : "一个具体例子：金额解析与安全整数"}</h3>
      <p>{en ? "This task checks 18 edge inputs rather than judging the explanation. Both modes can produce a correct small function while using different amounts of output and thinking. The following are individual observations from this concurrent local run, not average latency or a general cost ranking." : "这题用 18 个边界输入检查结果，不靠解释写得长短判断。两档都可能交出正确的小函数，但输出与思考消耗不同。下表只是本次并发本地测试的单次记录，不是平均延迟或通用成本排名。"}</p>
      <div className="mt-3 overflow-x-auto"><table className="w-full min-w-[30rem] border-collapse text-left text-sm"><thead><tr className="border-b border-line"><th className="p-3">{en ? "Mode" : "模式"}</th><th className="p-3">{en ? "First content / total" : "正文首响 / 总耗时"}</th><th className="p-3">{en ? "Completion tokens, including thinking" : "输出 token（含思考）"}</th><th className="p-3">{en ? "Checks" : "检查"}</th></tr></thead><tbody>{review.coding.filter(attempt => attempt.id === "code-money").map(attempt => <tr key={attempt.mode} className="border-b border-line"><td className="p-3"><a href={`#evidence-${attempt.id}-${attempt.mode}`}>{modeName(attempt.mode, en)}</a></td><td className="p-3">{seconds(attempt.firstContentMs)} / {seconds(attempt.totalMs)}</td><td className="p-3">{attempt.outputTokens ?? "—"}</td><td className="p-3">{attempt.pass ? `${attempt.checkCount} / ${attempt.checkCount}` : (en ? "Not all passed" : "未全部通过")}</td></tr>)}</tbody></table></div>
      <p><a href="#evidence">{en ? "Inspect every original answer and executable check" : "逐条查看原始回答与可执行检查"}</a></p>
    </section>
<section id="frontend-tests" className="scroll-mt-6">
      <h2>{en ? "Responsive frontend case: inspect desktop, phone and behavior" : "响应式前端案例：同时看桌面、手机与实际行为"}</h2>
      <p>{en ? frontend.methodEn ?? "One standalone-page prompt is shared by both modes. The saved response is rendered at 1440px and 390px, with the original output and browser checks retained. This is a single-response code-generation test, not a Claude Code or Codex agent run." : frontend.methodZh ?? "两档使用同一道独立页面题，保留原始输出，在 1440px 和 390px 检查布局与交互。这是单轮代码生成测试，不是 Claude Code 或 Codex Agent 仓库任务。"}</p>
      <p>{en ? "Both modes make a coherent cycling-club page with working route filters and local signup feedback. Each passes 24 desktop/mobile browser checks. Those functional checks do not catch a content inconsistency present in both: the advanced route is advertised as three hours, while the schedule runs from 09:15 to 11:30. A working interface still needs a business-content review." : "两档都做出了风格连贯的骑行俱乐部页面，路线筛选和本地报名反馈可用，各通过 24 项桌面/手机浏览器检查。这些功能检查没有覆盖两档都出现的内容矛盾：进阶路线写三小时，日程却从 09:15 排到 11:30。界面能用，还需要验收业务内容是否一致。"}</p>
      <div className="mt-5 space-y-8">{frontend.attempts.map(attempt => <article key={`${attempt.id}-${attempt.mode}`} className="rounded-xl border border-line bg-card p-4 sm:p-5">
        <h3 className="font-bold text-ink">{modeName(attempt.mode, en)}</h3>
        <p className="text-xs">{en ? "First content / total" : "正文首响 / 总耗时"}：{seconds(attempt.firstContentMs)} / {seconds(attempt.totalMs)} · {attempt.outputTokens ?? "—"} token · {attempt.status}</p>
        <div className="mt-4 grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.35fr)]">{(["desktop", "mobile"] as const).map(viewport => {
          const screenshot = attempt.screenshots?.[viewport];
          return screenshot ? <figure key={viewport} className="min-w-0 overflow-hidden rounded-lg border border-line"><a href={screenshot.path} target="_blank" rel="noopener noreferrer"><Image src={screenshot.path} width={screenshot.width} height={screenshot.height} unoptimized loading="lazy" alt={`${modeName(attempt.mode, en)} · ${en ? "model-generated frontend screenshot" : "模型生成前端截图"} · ${viewport === "desktop" ? "1440px" : "390px"}`} className="h-[32rem] w-full cursor-zoom-in object-cover object-top" /></a><figcaption className="p-3 text-xs">{viewport === "desktop" ? "1440px" : "390px"} · {en ? "Top preview" : "顶部预览"} · <a href={screenshot.path} target="_blank" rel="noopener noreferrer">{en ? "Open full screenshot" : "查看完整截图"}</a></figcaption></figure> : null;
        })}</div>
        <p className="mt-4">{en ? attempt.assessmentEn : attempt.assessmentZh}</p>
        {attempt.checks?.length ? <details className="mt-3"><summary className="cursor-pointer font-bold text-ink">{en ? "Browser checks" : "浏览器检查"}：{attempt.checks.filter(check => check.pass).length} / {attempt.checks.length}</summary><ul className="mt-3">{attempt.checks.map(check => <li key={check.name}>{check.pass ? "✓" : "✗"} {check.name}</li>)}</ul></details> : null}
        <p className="mt-4">{attempt.htmlPath && <><a href={attempt.htmlPath} download>{en ? "Download original HTML" : "下载原始 HTML"}</a> · </>}<a href={frontendPath}>{en ? "Original request and browser-check evidence" : "原始请求与浏览器检查证据"}</a></p>
        <details className="mt-3"><summary className="cursor-pointer">{en ? "Exact frontend prompt" : "完整前端提示词"}</summary><pre className="mt-3 overflow-auto whitespace-pre-wrap break-words text-xs">{attempt.prompt}</pre></details>
      </article>)}</div>
    </section>
<section id="responses-tests" className="scroll-mt-6">
      <h2>{en ? "A separate Responses check: low requests and reading a chart" : "独立 Responses 诊断：low 请求与图表读数"}</h2>
      <p>{en ? "The Responses API accepted reasoning.effort=low for one text extraction and one input_image request. The chart answer correctly identifies LongCat-2.0 in the green-bar legend and returns all six green-bar values: seven checks pass. This is evidence that these two requests worked, separate from the Chat Completions on/off results." : "Responses API 接受了 reasoning.effort=low 的一次文本抽取和一次 input_image 请求。读图回答正确识别绿色柱图例中的 LongCat-2.0，并给出六项绿色柱数值，7 项检查通过。这说明这两次请求的路径和输出可用，与 Chat Completions 的思考开关成绩分别记录。"}</p>
      <p>{en ? "The input is a public historical 2.0 chart, not a 2.5 benchmark result. There is no no-image control or repeated trial here, so memorization cannot be excluded. This does not establish native architecture or general visual reliability. The non-streaming calls do not measure first streaming content, and accepting low does not prove its effective reasoning strength." : "输入是一张公开的历史 2.0 图，不是 2.5 跑分结果。本轮没有无图对照，也没有重复运行，不能排除记忆因素，不能据此证明原生架构或通用视觉可靠性。两次调用为非流式，不测流式正文首响；接受 low 也不等于验证实际思考强度。"}</p>
      <div className="mt-5 space-y-4">{responses.attempts.map(attempt => <article key={attempt.id} className="rounded-xl border border-line bg-card p-4">
        <h3 className="font-bold text-ink">{attempt.category === "native-vision" ? (en ? "Chart input: legend plus six values" : "图片输入：图例与六项数值") : (en ? "Text input: exact JSON extraction" : "文本输入：严格 JSON 抽取")}</h3>
        <p className="text-xs">Responses · low · HTTP {attempt.httpStatus} · {seconds(attempt.totalMs)} · {attempt.outputTokens} {en ? "output tokens including reasoning" : "输出 token（含思考）"}</p>
        <pre className="mt-3 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-paper p-3 text-xs">{attempt.text}</pre>
        {attempt.image && <details className="mt-3"><summary className="cursor-pointer">{en ? "Inspect the exact input image" : "查看实际输入图片"}</summary><a href={attempt.image.path} target="_blank" rel="noopener noreferrer"><Image src={attempt.image.path} width={attempt.image.width} height={attempt.image.height} alt={en ? "Historical LongCat-2.0 chart used only as the image-input test" : "仅用于图片输入测试的历史 LongCat-2.0 图表"} unoptimized loading="lazy" className="mt-3 h-auto w-full cursor-zoom-in" /></a></details>}
        <details className="mt-3"><summary className="cursor-pointer">{en ? "Exact prompt and checks" : "完整提示词与检查"}</summary><pre className="mt-3 overflow-auto whitespace-pre-wrap break-words text-xs">{attempt.prompt}</pre>{attempt.checks?.length ? <ul className="mt-3">{attempt.checks.map(check => <li key={check.name}>{check.pass ? "✓" : "✗"} {check.name}{check.actual != null && `: ${check.actual}`}</li>)}</ul> : <p>{attempt.pass ? (en ? "Exact expected JSON matched." : "与预定 JSON 完全匹配。") : attempt.status}</p>}</details>
      </article>)}</div>
      <p className="mt-4"><a href={responsesPath}>{en ? "Download both Responses requests, input provenance and checks" : "下载两次 Responses 请求、输入来源与检查"}</a> · <a href={docs + "/api/responses"}>{en ? "Official Responses reference" : "官方 Responses 文档"}</a></p>
    </section>
<section id="visual-findings" className="scroll-mt-6">
      <h2>{en ? "The visual cases reveal errors that a clean render can hide" : "视觉题能看出“能显示”背后的具体错误"}</h2>
      <p>{en ? "The thinking-on clock gets the requested 9:41 hand rotations exactly right in source: 290.5° for the hour hand and 246° for the minute hand. Its thinking-off counterpart misplaces 3 and 9 outside the dial and clips part of its tick geometry. For this particular task, thinking produces a more accurate layout; the original timing and token cost remain visible below." : "钟表题里，开启思考的源码准确写出 9:41 所需的时针 290.5°、分针 246°；关闭思考的版本把 3 和 9 放到了表盘外，还截掉了部分刻度。在这道具体任务上，思考模式的排布更准确，代价是下方记录的耗时与 token 消耗。"}</p>
      <p>{en ? "The dashboard makes a different distinction. The thinking-off bars keep the right proportions but do not match their vertical-axis scale. Thinking-on fixes the geometry and totals, then adds an unrequested 2024 date and a USD-thousands unit. A numerically sound chart can still invent business context, so both geometry and the meaning of its labels need checking." : "数据面板暴露的是另一类问题：关闭思考的柱高比例正确，却与纵轴刻度对不上；开启思考修正了几何和总计，又额外加上题目没给出的 2024 年和“美元千元”单位。数字图画对了，也可能自行补出业务背景，因此坐标和标签含义都要检查。"}</p>
      <p>{en ? "Thinking also has a budget cost here: the first thinking-on pelican and Chinese-poster answers both hit the 12,288-token limit before completing an SVG. Higher-budget retries are recorded separately below. In the thinking-off animation, the wheels and crank rotate but the moving legs separate from the hip and leave the frame. Motion alone does not produce a coherent cycling action." : "思考也有预算代价：鹈鹕和中文海报的开启思考首轮都耗尽 12,288 token，未完成 SVG；下方单独保留提高预算后的重试。关闭思考的动画里，轮子和曲柄会转，腿部却在移动时脱离髋部并出画布。画面动起来，并不代表骑乘动作连贯。"}</p>
      <p>{en ? "The thinking-on animation keeps the hip fixed while the feet follow the crank, making the joints more coherent and keeping the bird and bicycle inside the frame. Its first attempt also truncated; a retry with a 32,768-token ceiling took 477.49 seconds and returned 24,972 output tokens. The legs still bend mechanically. This improvement is a higher-budget retry result, not a same-budget first-attempt win." : "开启思考的动画将髋部固定，让脚端跟随曲柄，关节连接更连贯，鸟和车都留在画布内；腿的折线仍显机械。它的首轮也截断，重试把预算提到 32,768 token，用时 477.49 秒、返回 24,972 输出 token 后才得到结果。这份改进属于更高预算的重试，不能写成同预算首轮胜出。"}</p>
    </section>
<section id="historical-benchmarks" className="scroll-mt-6">
      <p className="text-xs font-bold uppercase tracking-wider">{en ? "Official historical material · not new 2.5 scores" : "官方历史材料 · 不是 2.5 新成绩"}</p>
      <h2>{en ? "Official historical figures: benchmarks and architecture" : "官方历史原图：benchmark 与架构"}</h2>
      <p>{en ? "No matching LongCat 2.5 benchmark chart was located in the public sources checked for this review. Historical official figures below provide context for the product direction; their captions identify the original version. They are vendor-reported results, have not been reproduced by TOKRACE, and must not be attributed to the current Preview API." : "本次核查的公开来源中，未找到对应 LongCat 2.5 的 benchmark 图。下方官方历史图用于理解产品演进，图注注明原版本。它们是厂商公布的结果，本站未复现，也不能转记为当前 Preview API 的成绩。"}</p>
      <p>{en ? "For agent and coding charts, inspect the scaffold, tools, evaluation split, sampling policy and cost budget before comparing bars. A score from a different model version or harness does not establish parity in a live frontend task." : "阅读 Agent 和代码图时，需要一起看执行框架、工具、测试集划分、采样次数和成本预算。不同版本、不同 harness 的柱状图，不能直接等同于真实前端任务的效果。"}</p>
      <div className="mt-5 space-y-6">{sources.images.filter(image => image.kind.startsWith("historical-")).map(image => <SourceFigure key={image.id} image={image} en={en} />)}</div>
      <p className="mt-4"><a href={sourcesPath}>{en ? "Source archive, original image bytes, dimensions and SHA-256" : "来源存档、原图字节、尺寸与 SHA-256"}</a></p>
    </section>
<section id="evidence" className="scroll-mt-6">
      <h2>{en ? "Original prompts, answers and code checks" : "原始提示词、回答与代码检查"}</h2>
      <p><a href={evidencePath}>{en ? "Download this text/code batch" : "下载本轮文本/代码数据"}</a> · <a href={frontendPath}>{en ? "Frontend evidence" : "前端证据"}</a> · <a href={responsesPath}>{en ? "Responses diagnostics" : "Responses 诊断"}</a> · <a href={accountingPath}>{en ? "Full request accounting" : "完整请求核算"}</a> · <a href={visuals.evidencePath}>{en ? "First visual attempts" : "视觉首轮"}</a> · <a href={supplement.evidencePath}>{en ? "Animation and retry records" : "动画与重试"}</a></p>
      <p>{en ? "Only answer content and reasoning timing/token counts are published; hidden reasoning text is excluded. Successful retries do not delete failed attempts. Exact request and returned model IDs are retained in the downloadable evidence." : "公开数据只保留正文及思考耗时/token 计数，不公开隐藏思维链。重试成功也不删除失败记录；下载文件保留准确请求与返回型号。"}</p>
      <div className="mt-5">{review.attempts.map(attempt => <Evidence key={`${attempt.id}-${attempt.mode}`} attempt={attempt} en={en} />)}{review.coding.map(attempt => <Evidence key={`${attempt.id}-${attempt.mode}`} attempt={attempt} en={en} code />)}</div>
    </section>
<section id="faq" className="scroll-mt-6">
      <h2>{en ? "Frequently asked questions" : "常见问题"}</h2>
      <dl className="space-y-5">{faqs.map(([question, answer]) => <div key={question}><dt className="font-bold text-ink">{question}</dt><dd className="mt-1">{answer}</dd></div>)}</dl>
    </section>
<section id="sources" className="scroll-mt-6 border-t border-line pt-6">
      <h2>{en ? "Sources and related reviews" : "来源与相关评测"}</h2>
      <ul>
        <li><a href={docs + "/"}>{en ? "Official Quick Start" : "官方快速开始"}</a> · <a href={docs + "/api/model-params"}>{en ? "Model parameters" : "模型参数"}</a> · <a href={docs + "/api/chat"}>{en ? "Chat API" : "对话 API"}</a></li>
        <li><a href={docs + "/pricing/longcat-2.5"}>{en ? "Official LongCat 2.5 pricing" : "LongCat 2.5 官方价格"}</a> · <a href={docs + "/change-log"}>{en ? "Changelog" : "更新日志"}</a></li>
        <li><a href="https://github.com/meituan-longcat">Meituan LongCat GitHub</a> · <a href="https://huggingface.co/meituan-longcat">Hugging Face</a> · <a href={sourcesPath}>{en ? "Archived source manifest" : "来源存档清单"}</a></li>
        <li><Link href={localizedPath("/guides/longcat-2-5-preview", locale)}>{en ? "Earlier LongCat 2.5 Preview evidence" : "LongCat 2.5 Preview 历史评测"}</Link></li>
        <li><Link href={localizedPath("/guides/kimi-k3-1-pro", locale)}>{en ? "Kimi K3.1 Pro: original tests and benchmark figures" : "Kimi K3.1 Pro：原始实测与 benchmark 图"}</Link></li>
        <li><Link href={localizedPath("/reports", locale)}>{en ? "More model reviews" : "更多模型评测"}</Link> · <Link href={localizedPath("/arena", locale)}>{en ? "Try your own task" : "用自己的任务复测"}</Link></li>
      </ul>
      <p className="mt-4 text-xs">{en ? "The supplied October 23 brief is treated as a source of claims and test priorities. Public conclusions are bounded by the cited official sources and saved test evidence. Promotional preferences do not determine task outcomes or competitor rankings." : "10 月 23 日提供的 brief 作为声明与测试重点的来源；公开结论以注明来源的官方材料和已保存的实测证据为界。推广偏好不决定任务成绩，也不构成竞品排名。"}</p>
    </section>
</div>
</details>
</InfoPage>;
}
