import Image from "next/image";
import Link from "next/link";
import { InfoPage, infoMetadata } from "@/components/InfoPage";
import { ArticleNavigation, type ArticleSection } from "@/components/ArticleNavigation";
import type { CreativeEvaluationData } from "@/components/CreativeEvaluation";
import type { VisualEvaluationData } from "@/components/VisualEvaluation";
import type { VisualSupplementData } from "@/components/VisualSupplement";
import { JsonLd } from "@/components/JsonLd";
import { BRAND } from "@/lib/brand";
import { DEFAULT_LOCALE, localizedPath, normalizeLocale } from "@/lib/i18n";
import { BaselineResults, CreativeCases, ThinkingComparison, type BaselineAttempt } from "./ReviewResults";
import rawCreative from "@/public/evaluations/longcat-2-5-release.json";
import rawBaseline from "@/public/evaluations/longcat-2-5-release-baseline.json";
import rawVisual from "@/public/evaluations/longcat-2-5-release-visual.json";
import rawAnimation from "@/public/evaluations/longcat-2-5-release-animation.json";

const pathname = "/guides/longcat-2-5-release";
const creative = rawCreative as CreativeEvaluationData;
const visual = rawVisual as VisualEvaluationData;
const comparison = rawAnimation as VisualSupplementData;
const baseline = rawBaseline as unknown as { evidencePath: string; attempts: BaselineAttempt[] };
const docs = "https://longcat.ai/platform/docs";
const article = "https://longcat.ai/blog/longcat-2.5/";
const updatedAt = creative.updatedAt;
const titleZh = "LongCat 2.5 评测：3D、SVG 与知识视频";
const titleEn = "LongCat 2.5 Review: Blender, SVG and Video";
const descriptionZh = "美团 LongCat 2.5 正式版介绍与评测：了解原生多模态、智能体编程和长任务能力，并查看 15 项 Claude Code 创作实测、官方跑分、API 价格与工程下载。";
const descriptionEn = "Meet Meituan's LongCat 2.5: release details, multimodal understanding and agentic coding, followed by 15 Claude Code creative tests, official benchmarks, API prices and source files.";
type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props) {
  const locale = normalizeLocale((await params).lang) ?? DEFAULT_LOCALE;
  const en = locale === "en";
  const metadata = infoMetadata(locale, pathname, en ? titleEn : titleZh, en ? descriptionEn : descriptionZh);
  const image = BRAND.url + visual.official[0].path;
  return {
    ...metadata,
    keywords: en ? ["LongCat 2.5 review", "LongCat benchmark", "Claude Code", "Blender AI", "LongCat API pricing"] : ["LongCat 2.5 评测", "美团龙猫", "Claude Code", "Blender AI 建模", "LongCat API 价格"],
    openGraph: { ...metadata.openGraph, type: "article", publishedTime: creative.publishedAt, modifiedTime: updatedAt, images: [{ url: image, width: visual.official[0].width, height: visual.official[0].height, alt: en ? "Official LongCat 2.5 benchmark overview" : "LongCat 2.5 官方跑分" }] },
    twitter: { ...metadata.twitter, images: [image] },
  };
}

export default async function LongCatReleasePage({ params }: Props) {
  const locale = normalizeLocale((await params).lang) ?? DEFAULT_LOCALE;
  const en = locale === "en";
  const title = en ? titleEn : titleZh;
  const description = en ? descriptionEn : descriptionZh;
  const url = BRAND.url + localizedPath(pathname, locale);
  const navigation: ArticleSection[] = [
    { id: "release-specs", label: en ? "Meet LongCat 2.5" : "认识 LongCat 2.5" },
    { id: "release-overview", label: en ? "Our evaluation" : "评测概览" },
    { id: "creative-3d", label: en ? "3D modelling" : "3D 建模" },
    { id: "creative-video", label: en ? "Knowledge videos" : "知识视频" },
    { id: "creative-svg", label: en ? "SVG and animation" : "SVG 与动画" },
    { id: "official-benchmarks", label: en ? "Official benchmarks" : "官方跑分" },
    { id: "release-method", label: en ? "Test details and downloads" : "测试说明与下载" },
  ];
  const specs = en ? [
    ["Parameters", "1.6T total, about 48B active per token."],
    ["Context", "1,048,576 tokens. The docs list either 128K or 256K maximum output."],
    ["Promotional API price / 1M tokens", "¥2 uncached input · ¥0.04 cached input · ¥8 output. The separate USD table lists $0.30 / $0.006 / $1.20."],
    ["Weights", "The GitHub and Hugging Face links were marked coming soon on November 2."],
  ] : [
    ["参数", "总计 1.6 万亿，每 token 激活约 480 亿。"],
    ["上下文", "1,048,576 token；最大输出在两处文档中分别为 128K 和 256K。"],
    ["限时 API 单价 / 百万 token", "非缓存输入 ¥2 · 缓存输入 ¥0.04 · 输出 ¥8。另有美元价表：$0.30 / $0.006 / $1.20。"],
    ["权重", "11 月 2 日查看时，GitHub 与 Hugging Face 入口仍显示“敬请期待”。"],
  ];
  const officialNotes = en ? [
    "Meituan's benchmark overview. In the full table, starred scores are cited results; the rest are Meituan's measurements. Terminal Bench uses Claude Code 2.1.280 with 512K context; BrowseComp uses Meituan's harness.",
    "How images at different resolutions are encoded into discrete tokens and reconstructed.",
    "Visual and text embeddings. The experiment on the right uses a smaller MoE with roughly 3B active parameters.",
  ] : [
    "美团公布的成绩。完整表格中，星号为引用分数，其余为美团自测；Terminal Bench 使用 Claude Code 2.1.280、512K 上下文，BrowseComp 使用自研框架。",
    "不同分辨率的图像如何编码成离散 token，再重建为图像。",
    "视觉与文本的 embedding 分布；右侧实验使用约 3B 激活参数的小规模 MoE。",
  ];
  return <InfoPage locale={locale} pathname={pathname} title={title} intro={en ? "Meituan's LongCat 2.5 combines visual understanding, coding and tool use for tasks that take multiple steps to complete." : "美团的 LongCat 2.5 将视觉理解、编程和工具调用结合起来，面向需要多步完成的智能体任务。"} updatedAt={updatedAt.slice(0, 10)} sidebar={<ArticleNavigation sections={navigation} en={en} />}>
    <JsonLd data={{ "@context": "https://schema.org", "@type": "TechArticle", "@id": url + "#article", headline: title, description, datePublished: creative.publishedAt, dateModified: updatedAt, inLanguage: locale, mainEntityOfPage: url, url, author: { "@type": "Organization", name: BRAND.publisher, url: BRAND.url }, publisher: { "@type": "Organization", name: BRAND.publisher, url: BRAND.url }, image: [BRAND.url + "/articles/longcat-2-5-release/longcat-logo.svg", ...visual.official.map(item => BRAND.url + item.path)], citation: [article, docs + "/ChangeLog.html", docs + "/api/model-params", docs + "/pricing/longcat-2.5"], about: { "@type": "SoftwareApplication", name: "LongCat-2.5", applicationCategory: "AI model" } }} />
    <JsonLd data={{ "@context": "https://schema.org", "@type": "Dataset", "@id": url + "#dataset", name: en ? "LongCat 2.5 creative evaluation" : "LongCat 2.5 创作评测", description: en ? "Fifteen Claude Code creative tasks, with source files, measurements and request records." : "15 项 Claude Code 创作任务，附工程、检查结果和请求记录。", datePublished: creative.publishedAt, dateModified: creative.updatedAt, inLanguage: ["zh-CN", "en"], url, creator: { "@type": "Organization", name: BRAND.publisher, url: BRAND.url }, distribution: [creative.evidencePath, baseline.evidencePath, visual.evidencePath].map(path => ({ "@type": "DataDownload", encodingFormat: "application/json", contentUrl: BRAND.url + path })), isAccessibleForFree: true }} />
    <JsonLd data={{ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "TOKRACE", item: BRAND.url + localizedPath("/", locale) }, { "@type": "ListItem", position: 2, name: title, item: url }] }} />
    {creative.cases.flatMap(item => item.media.filter(media => media.type === "video" && media.posterPath).map(media => <JsonLd key={media.path} data={{ "@context": "https://schema.org", "@type": "VideoObject", name: en ? item.titleEn : item.titleZh, description: en ? media.captionEn : media.captionZh, thumbnailUrl: BRAND.url + media.posterPath!, uploadDate: "uploadDate" in media && typeof media.uploadDate === "string" ? media.uploadDate : creative.publishedAt, duration: media.durationSeconds ? `PT${media.durationSeconds}S` : undefined, contentUrl: BRAND.url + media.path, isPartOf: { "@id": url + "#article" } }} />))}

    <section id="release-specs" className="scroll-mt-6">
      <h2>{en ? "What is LongCat 2.5?" : "LongCat 2.5 是什么？"}</h2>
      <p>{en ? "Meituan introduced LongCat 2.5 on November 1, 2026, with API access following on November 2. It is a native multimodal model with 1.6 trillion parameters, about 48 billion of which are activated per token." : "美团在 2026 年 11 月 1 日发布了 LongCat 2.5，11 月 2 日上线 API。这是一款原生多模态大模型，总参数为 1.6 万亿，每个 token 激活约 480 亿参数。"}</p>
      <p>{en ? "The official release focuses on combining image understanding with coding, and on using tools across longer projects. Its examples span visual coding, creative design and 3D tasks, with support for tools such as Claude Code and Codex." : "这次升级主要加强图像理解与编程的结合，以及调用工具、连续完成复杂项目的能力。官方列举了视觉编程、创意设计和 3D 等应用，并支持接入 Claude Code、Codex 等工具。"} <a href={article}>{en ? "Official release" : "官方发布文章"}</a> · <a href={docs + "/ChangeLog.html"}>{en ? "API release log" : "API 更新日志"}</a></p>
      <figure className="mt-5 max-w-sm rounded-xl border border-line bg-white p-6">
        <a href={article}><Image src="/articles/longcat-2-5-release/longcat-logo.svg" width={378} height={100} alt={en ? "Official LongCat logo" : "LongCat 官方 logo"} unoptimized loading="eager" className="h-auto w-56 max-w-full" /></a>
        <figcaption className="mt-3 text-xs">{en ? "LongCat · Meituan" : "LongCat · 美团"}</figcaption>
      </figure>
      <details className="mt-4 rounded-xl border border-line bg-card p-4"><summary className="cursor-pointer font-bold text-ink">{en ? "Model specifications and API pricing" : "模型参数与 API 价格"}</summary>
        <dl className="mt-3 divide-y divide-line">{specs.map(([label, value]) => <div key={label} className="py-3 sm:grid sm:grid-cols-[9rem_1fr] sm:gap-4"><dt className="font-bold text-ink">{label}</dt><dd>{value}</dd></div>)}</dl>
        <p className="text-xs"><a href={docs + "/api/model-params"}>{en ? "Parameters" : "官方参数"}</a> · <a href={docs + "/pricing/longcat-2.5"}>{en ? "Pricing" : "价格表"}</a> · <a href={docs + "/claude-code"}>{en ? "Claude Code setup" : "Claude Code 接入"}</a></p>
      </details>
    </section>

    <section id="release-overview" className="scroll-mt-6">
      <h2>{en ? "What did we test, and how did it perform?" : "我们测了什么，整体表现如何？"}</h2>
      <p>{en ? "We connected LongCat 2.5 to Claude Code for 15 creative tasks across SVG drawing, 3D modelling and knowledge videos. The works, source projects and observations follow below." : "我们把 LongCat 2.5 接入 Claude Code，安排了 15 项创作任务，覆盖 SVG 绘图、3D 建模和知识视频制作。下面直接看作品、工程和具体表现。"}</p>
      <p>{en ? creative.summaryEn : creative.summaryZh}</p>
    </section>

    <section id="creative-3d" className="scroll-mt-6">
      <h2>{en ? "3D modelling" : "3D 建模"}</h2>
      <CreativeCases items={creative.cases.filter(item => item.category === "blender")} en={en} />
    </section>

    <section id="creative-video" className="scroll-mt-6">
      <h2>{en ? "Knowledge videos" : "知识视频"}</h2>
      <p className="text-xs">{en ? "Music and sound effects, no narration." : "以下视频均配有音乐与音效，无旁白。"}</p>
      <CreativeCases items={creative.cases.filter(item => item.category === "knowledge-video" && item.media.length)} en={en} />
      <div className="mt-4"><CreativeCases items={creative.cases.filter(item => item.category === "knowledge-video" && !item.media.length)} en={en} /></div>
    </section>

    <section id="creative-svg" className="scroll-mt-6">
      <h2>{en ? "SVG and animation" : "SVG 与动画"}</h2>
      <CreativeCases items={creative.cases.filter(item => item.category === "svg")} en={en} />
      <div className="mt-5"><CreativeCases items={creative.cases.filter(item => item.category === "svg-animation")} en={en} /></div>
    </section>

    <section id="official-benchmarks" className="scroll-mt-6">
      <h2>{en ? "Official benchmarks" : "官方跑分"}</h2>
      <figure className="overflow-hidden rounded-xl border border-line bg-card"><a href={visual.official[0].path}><Image src={visual.official[0].path} width={visual.official[0].width} height={visual.official[0].height} alt={en ? "LongCat 2.5 official benchmark overview" : "LongCat 2.5 官方 benchmark 看板"} unoptimized className="h-auto w-full bg-white" /></a><figcaption className="p-4 text-xs">{officialNotes[0]} <a href={article}>{en ? "Source: Meituan, November 1" : "来源：美团，11 月 1 日"}</a></figcaption></figure>
      <details className="mt-4 rounded-xl border border-line bg-card p-4"><summary className="cursor-pointer font-bold text-ink">{en ? "Two figures explaining the visual architecture" : "视觉架构的两张说明图"}</summary><div className="mt-4 space-y-5">{visual.official.slice(1).map((figure, index) => <figure key={figure.id}><a href={figure.path}><Image src={figure.path} width={figure.width} height={figure.height} alt={en ? figure.titleEn : figure.titleZh} unoptimized className="h-auto w-full" /></a><figcaption className="mt-2 text-xs">{officialNotes[index + 1]} <a href={figure.sourcePage}>{en ? "Source" : "原文"}</a></figcaption></figure>)}</div></details>
    </section>

    <section id="release-method" className="scroll-mt-6 border-t border-line pt-6">
      <h2>{en ? "Test details and downloads" : "测试说明与下载"}</h2>
      <p>{en ? "Testing began on November 2, 2026. Claude Code called LongCat-2.5 to write code; Blender and browser tools rendered the results. The 15 creative tasks cover six 3D scenes, four videos, four static SVGs and one animation." : "本组测试始于 2026 年 11 月 2 日。Claude Code 调用 LongCat-2.5 写代码，由 Blender 和浏览器等工具渲染。共 15 项创作任务：6 项 3D、4 项视频、4 张静态 SVG 和 1 段动画。"}</p>
      <div className="mt-4 space-y-3">
        <ThinkingComparison data={comparison} en={en} />
        <BaselineResults attempts={baseline.attempts} en={en} />
        <details className="rounded-xl border border-line bg-card p-4"><summary className="cursor-pointer font-bold text-ink">{en ? "Workflow and usage" : "制作方式与用量"}</summary>
          <p className="mt-3">{en ? "LongCat writes and edits the creative source through Claude Code. The review checks the editable projects, rendered pictures and complete video files." : "LongCat 通过 Claude Code 编写和修改作品源码。评测结合可编辑工程、实际渲染画面和完整成片，检查作品的结构、内容与完成度。"}</p>
          <p>{en ? "Known usage for the listed creative sessions: " : "所列创作会话已知用量：输入 "}{creative.totals.promptTokens?.toLocaleString() ?? "—"}{en ? " input tokens and " : " token，输出 "}{creative.totals.outputTokens?.toLocaleString() ?? "—"}{en ? " output tokens, including cache and thinking." : " token（含缓存与思考）。"}</p>
          <p><a href={docs + "/api/chat"}>{en ? "API documentation" : "API 文档"}</a> · <a href="/evaluations/longcat-2-5-release/qa/direct-svg-checks.json">{en ? "SVG checks" : "SVG 检查"}</a> · <a href="/evaluations/longcat-2-5-release/qa/direct-animation-on-joints.json">{en ? "Animation measurements" : "动画测量"}</a></p>
        </details>
      </div>
      <p className="mt-5 text-xs"><a href={creative.evidencePath} download>{en ? "Creative data" : "创作数据"}</a> · <a href={baseline.evidencePath} download>{en ? "Text/code data" : "文本代码数据"}</a> · <a href={visual.evidencePath} download>{en ? "Visual request records" : "视觉请求记录"}</a> · <a href="/evaluations/longcat-2-5-release/official/sources.json">{en ? "Official image sources" : "官方图片来源"}</a></p>
      <p className="text-xs"><Link href={localizedPath("/guides/longcat-2-5", locale)}>{en ? "October Preview review" : "10 月 Preview 评测"}</Link> · <Link href={localizedPath("/guides/longcat-2-5-claude-code", locale)}>{en ? "Preview creative tests" : "Preview 创作实测"}</Link> · <Link href={localizedPath("/guides/kimi-k3-1-pro-creative", locale)}>{en ? "Kimi creative tests" : "Kimi 创作实测"}</Link></p>
    </section>
  </InfoPage>;
}
