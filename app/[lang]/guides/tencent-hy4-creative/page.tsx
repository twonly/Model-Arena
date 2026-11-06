import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArticleNavigation, type ArticleSection } from "@/components/ArticleNavigation";
import { CreativeEvaluation, type CreativeEvaluationData } from "@/components/CreativeEvaluation";
import { InfoPage, infoMetadata } from "@/components/InfoPage";
import { JsonLd } from "@/components/JsonLd";
import { Markdown } from "@/components/Markdown";
import { BRAND } from "@/lib/brand";
import { DEFAULT_LOCALE, localizedPath, normalizeLocale } from "@/lib/i18n";
import creativeRecord from "@/public/evaluations/tencent-hy4-creative.json";
import vision from "@/public/evaluations/tencent-hy4-vision.json";
import officialAssets from "@/public/articles/tencent-hy4-release/manifest.json";

const pathname = "/guides/tencent-hy4-creative";
const creative = creativeRecord as CreativeEvaluationData;
const visionPath = "/evaluations/tencent-hy4-vision.json";
const visionAssets = "/evaluations/tencent-hy4-vision";
const logo = "/provider-icons/hunyuan-color.svg";
const source = "https://hy.tencent.ai/research/hy4";
const route = "https://openrouter.ai/tencent/hy4";
const figures = officialAssets.images.filter(figure => figure.selected);
const absolute = (path: string) => new URL(path, BRAND.url).href;
const updatedDate = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit",
}).format(new Date(creative.updatedAt));
type Props = { params: Promise<{ lang: string }> };

function copy(en: boolean) {
  return {
    title: en ? "Tencent Hy4 review: vision, Blender, SVG and knowledge videos" : "腾讯 Hy4 评测：视觉理解、Blender、SVG 与知识视频",
    description: en
      ? "Tencent Hy4 on OpenRouter: five image-input tests and the standard creative suite, with original inputs, answers, rendered works, source projects and attributed official benchmarks."
      : "通过 OpenRouter 评测腾讯 Hy4：五项图片输入实测与标准创作套件，查看原始输入、回答、真实作品、工程下载及注明出处的官方跑分。",
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = normalizeLocale((await params).lang) ?? DEFAULT_LOCALE;
  const en = locale === "en";
  const { title, description } = copy(en);
  const metadata = infoMetadata(locale, pathname, title, description);
  const image = creative.cases.flatMap(item => item.media).find(media => media.type === "image");
  const fallback = vision.cases[0].images[0];
  const socialImage = image
    ? { url: image.path, width: image.width, height: image.height, alt: en ? image.captionEn : image.captionZh }
    : { url: `${visionAssets}/${fallback.path}`, width: fallback.width, height: fallback.height, alt: en ? "Original synthetic input for the Hy4 image-understanding test" : "Hy4 视觉理解实测的原始合成输入图" };
  return {
    ...metadata,
    metadataBase: new URL(BRAND.url),
    title: { absolute: `${title} | TOKRACE` },
    keywords: en
      ? ["Tencent Hy4 review", "Hy4 vision", "OpenRouter", "Claude Code", "Blender AI", "SVG", "knowledge video"]
      : ["腾讯 Hy4 评测", "混元视觉理解", "OpenRouter", "Claude Code", "Blender AI 建模", "SVG", "知识视频"],
    openGraph: { ...metadata.openGraph, type: "article", publishedTime: creative.publishedAt || undefined, modifiedTime: creative.updatedAt, images: [socialImage] },
    twitter: { ...metadata.twitter, images: [socialImage.url] },
  };
}

export default async function Hy4CreativeReview({ params }: Props) {
  const locale = normalizeLocale((await params).lang) ?? DEFAULT_LOCALE;
  const en = locale === "en";
  const language = en ? "en" : "zh";
  const { title, description } = copy(en);
  const url = absolute(localizedPath(pathname, locale));
  const navigation: ArticleSection[] = [
    { id: "model-introduction", label: en ? "Meet Hy4" : "认识 Hy4" },
    { id: "review-overview", label: en ? "Results overview" : "结果概览" },
    { id: "vision-understanding", label: en ? "Image understanding" : "视觉理解" },
    ...vision.cases.map(item => ({ id: item.id, label: en ? item.titleEn : item.title, nested: true })),
    { id: "creative-blender", label: en ? "3D modelling" : "3D 建模" },
    ...creative.cases.filter(item => item.category === "blender").map(item => ({ id: `creative-case-${item.id}`, label: en ? item.titleEn : item.titleZh, nested: true })),
    { id: "creative-knowledge-video", label: en ? "Knowledge videos" : "知识视频" },
    ...creative.cases.filter(item => item.category === "knowledge-video").map(item => ({ id: `creative-case-${item.id}`, label: en ? item.titleEn : item.titleZh, nested: true })),
    { id: "creative-svg", label: en ? "SVG and animation" : "SVG 与动画" },
    ...creative.cases.filter(item => item.category === "svg" || item.category === "svg-animation").map(item => ({ id: `creative-case-${item.id}`, label: en ? item.titleEn : item.titleZh, nested: true })),
    { id: "official-benchmarks", label: en ? "Official benchmarks" : "官方跑分" },
    { id: "review-evidence", label: en ? "Evidence and downloads" : "证据与下载" },
  ];
  const images = [...new Set([
    logo,
    ...creative.cases.flatMap(item => item.media.flatMap(media => media.type === "image" ? [media.path] : media.posterPath ? [media.posterPath] : [])),
    ...vision.cases.flatMap(item => item.images.map(image => `${visionAssets}/${image.path}`)),
    ...figures.map(figure => figure.path),
  ])];
  const dates = { ...(creative.publishedAt ? { datePublished: creative.publishedAt } : {}), dateModified: creative.updatedAt };
  const officialNotes = en ? [
    "Tencent-reported figures, not independently reproduced by TOKRACE. Comparisons use the highest available reasoning setting; tools, harnesses and budgets vary by benchmark.",
    "ZeroBench-main is reported with tools at pass@5. BuddyVQA Atlas is an internal benchmark, with separate tool and no-tool results. OSWorld 2.1 uses Full, partial score; 78.9 is not a full-task completion percentage.",
    "Benchmark-name asterisks mark first evaluations at release; model-cell asterisks in the appendix mark Tencent testing. Preview scores may change with harness, judge and anti-hacking updates. Read the original appendix for the complete conditions.",
  ] : [
    "以下为腾讯公布的成绩，本站未独立复现。对比采用各模型可用的最高推理设置；工具、框架与预算随基准而异。",
    "ZeroBench-main 为带工具 pass@5；BuddyVQA Atlas 是内部基准，带工具与无工具结果分别列出。OSWorld 2.1 使用 Full、partial score，78.9 不是完整任务完成率。",
    "基准名称后的星号表示发布时首次评测，附表模型分数旁的星号表示腾讯测试。Preview 分数可能随框架、裁判模型和反作弊方法更新而变化；完整条件见原始附表。",
  ];

  return <InfoPage locale={locale} pathname={pathname} title={title} intro={description} updatedAt={updatedDate} sidebar={<ArticleNavigation sections={navigation} en={en} />}>
    <JsonLd data={{
      "@context": "https://schema.org", "@type": "TechArticle", "@id": url + "#article",
      headline: title, description, ...dates, inLanguage: locale, url, mainEntityOfPage: url,
      author: { "@type": "Organization", name: BRAND.publisher, url: BRAND.url },
      publisher: { "@type": "Organization", name: BRAND.publisher, url: BRAND.url },
      image: images.map(absolute),
      citation: [...new Set([source, route, ...figures.map(figure => figure.sourcePage), ...creative.cases.flatMap(item => [item.source.url, ...(item.references ?? []).map(reference => reference.url)])])],
      about: { "@type": "SoftwareApplication", name: "Tencent Hy4", applicationCategory: "AI model" },
    }} />
    <JsonLd data={{
      "@context": "https://schema.org", "@type": "Dataset", "@id": url + "#dataset",
      name: en ? "Tencent Hy4 creative and image-input evaluation" : "腾讯 Hy4 创作与图片输入评测",
      description: en ? creative.methodEn : creative.methodZh, ...dates, inLanguage: ["zh-CN", "en"], url,
      creator: { "@type": "Organization", name: BRAND.publisher, url: BRAND.url },
      variableMeasured: ["Creative task constraints", "Image-input task correctness", "API token usage", "API-reported inference cost"],
      distribution: [creative.evidencePath, visionPath].map(path => ({ "@type": "DataDownload", encodingFormat: "application/json", contentUrl: absolute(path) })),
      isAccessibleForFree: true,
    }} />
    <JsonLd data={{
      "@context": "https://schema.org", "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: BRAND.publisher, item: absolute(localizedPath("/", locale)) },
        { "@type": "ListItem", position: 2, name: en ? "Reports" : "实测报告", item: absolute(localizedPath("/reports", locale)) },
        { "@type": "ListItem", position: 3, name: title, item: url },
      ],
    }} />
    {creative.cases.flatMap(item => item.media.flatMap(media => {
      if (media.type !== "video" || !media.posterPath || !("uploadDate" in media) || typeof media.uploadDate !== "string" || !media.uploadDate) return [];
      return [<JsonLd key={media.path} data={{
        "@context": "https://schema.org", "@type": "VideoObject",
        name: en ? item.titleEn : item.titleZh, description: en ? media.captionEn : media.captionZh,
        thumbnailUrl: absolute(media.posterPath), contentUrl: absolute(media.path), uploadDate: media.uploadDate,
        duration: media.durationSeconds ? `PT${media.durationSeconds}S` : undefined,
        isPartOf: { "@id": url + "#article" },
      }} />];
    }))}

    <section id="model-introduction" className="scroll-mt-6">
      <h2>{en ? "Meet Tencent Hy4" : "认识腾讯 Hy4"}</h2>
      <div className="my-4 flex items-center gap-4 rounded-xl border border-line bg-white p-5">
        <Image src={logo} width={64} height={64} alt={en ? "Tencent Hunyuan logo" : "腾讯混元标识"} unoptimized className="h-16 w-16" />
        <p className="font-bold text-ink">Tencent Hy4 · 腾讯混元</p>
      </div>
      <p>{en ? "Tencent released the final Hy4 on November 4, 2026. The official release adds visual understanding and computer use, with an emphasis on fine image details, complex charts and longer tool-based tasks." : "腾讯于 2026 年 11 月 4 日发布 Hy4 正式版。官方介绍新增视觉理解与电脑操作，重点包括图像细节、复杂图表，以及需要连续调用工具完成的长任务。"} <a href={source}>{en ? "Official release" : "官方发布文章"}</a></p>
      <p>{en ? "The OpenRouter route used here is tencent/hy4. Its November 4 catalog accepts text and images, returns text, and lists a 1,048,576-token context and a 65,536-token maximum output. The official post lists weights and a system card as planned releases." : "本次使用 OpenRouter 的 tencent/hy4 路由。11 月 4 日目录列明文字与图片输入、文字输出，上下文为 1,048,576 token，最大输出为 65,536 token。官方发布文将权重与系统卡列为计划发布事项。"} <a href={route}>OpenRouter</a></p>
      <p>{en ? "The OpenRouter quote captured on November 4 was $0.417 per million input tokens, $1.2505 for output and $0.021 for cached input, with a 50% discount whose end date was not disclosed. Measured usage and API-reported costs are recorded separately below." : "11 月 4 日采集的 OpenRouter 报价为每百万 token 输入 $0.417、输出 $1.2505、缓存输入 $0.021，当时标注五折，未公布结束日期。实际用量与 API 报告费用在下方单列。"}</p>
      <p className="text-xs"><Link href={localizedPath("/guides/tencent-hy4", locale)}>{en ? "Read the Hy4 launch analysis" : "阅读 Hy4 发布解读"}</Link></p>
    </section>

    <section id="review-overview" className="scroll-mt-6 rounded-xl border border-line bg-card p-5">
      <h2>{en ? "Results overview" : "结果概览"}</h2>
      <p>{en ? creative.summaryEn : creative.summaryZh}</p>
      <p>{en ? `This page contains ${creative.cases.length} creative task records and ${vision.totals.cases} separate image-input tests. The creative works were made through Claude Code; the image-input tests used independent OpenRouter requests without tools.` : `本页包含 ${creative.cases.length} 项创作记录与另外 ${vision.totals.cases} 项图片输入实测。创作部分通过 Claude Code 制作，图片输入部分使用彼此独立、没有工具的 OpenRouter 请求。`}</p>
    </section>

    <section id="vision-understanding" className="scroll-mt-6">
      <h2>{en ? "Image understanding: original inputs and answers" : "视觉理解：看原始输入与回答"}</h2>
      <p className="font-bold text-ink">{vision.totals.score}/{vision.totals.maxPoints} · {en ? `${vision.totals.cases} tasks, ${vision.totals.inputImages} synthetic PNGs` : `${vision.totals.cases} 道题，${vision.totals.inputImages} 张合成 PNG`}</p>
      <p>{en ? "These are first responses with no tools or external OCR, scored by a coordinating AI against frozen checks. The occlusion task explicitly says the covered information is unrecoverable; its result establishes compliance with that boundary under this instruction." : "保留无工具、无外部 OCR 的首轮回答，由协调 AI 按预先冻结的检查项评分。遮挡题明确提示被覆盖信息无法恢复，因此该题结果只说明模型在此提示条件下遵守了信息边界。"}</p>
      <div className="mt-5 space-y-6">{vision.cases.map(item => <article key={item.id} id={item.id} className="min-w-0 scroll-mt-6 rounded-xl border border-line bg-card p-4 sm:p-5">
        <h3 className="text-base font-bold text-ink">{en ? item.titleEn : item.title} <span className="text-sm font-normal text-faint">{item.score}/{item.maxPoints}</span></h3>
        <div className={`mt-4 grid min-w-0 gap-4 ${item.images.length > 1 ? "sm:grid-cols-2" : "grid-cols-1"}`}>{item.images.map((image, index) => <figure key={image.path} className="min-w-0">
          <a href={`${visionAssets}/${image.path}`} target="_blank" rel="noreferrer"><Image src={`${visionAssets}/${image.path}`} width={image.width} height={image.height} alt={en ? `${item.titleEn}: original input ${index + 1}` : `${item.title}：原始输入 ${index + 1}`} unoptimized className="h-auto w-full rounded-lg border border-line bg-white" /></a>
          <figcaption className="mt-2 text-xs"><a href={`${visionAssets}/${image.path}`} target="_blank" rel="noreferrer">{en ? `Open original input ${index + 1}` : `查看输入 ${index + 1} 原图`}</a></figcaption>
        </figure>)}</div>
        <p className="mt-4">{item.observation[language]}</p>
        <details className="mt-4 border-t border-line pt-3 text-xs">
          <summary className="cursor-pointer font-bold text-ink">{en ? "Original task, answer and request details" : "原题、原回答与请求详情"}</summary>
          <p className="mt-4 font-bold text-ink">{en ? "Original prompt (Chinese)" : "原始提示词"}</p>
          <p lang="zh-CN" className="whitespace-pre-wrap break-words">{item.prompt}</p>
          <p className="mt-4 font-bold text-ink">{en ? "Original model answer (Chinese)" : "模型原回答"}</p>
          <div lang="zh-CN" className="mt-3 min-w-0 overflow-x-auto break-words"><Markdown text={item.answer} /></div>
          <p className="mt-4"><a href={`${visionAssets}/answers/${item.id}.txt`} download>{en ? "Download the original answer" : "下载原回答"}</a></p>
          <p className="break-words">{en ? "Requested / returned model: " : "请求 / 返回模型："}{item.requestedModel} / {item.returnedModel} · {item.provider}</p>
          <p>{item.usage.prompt_tokens.toLocaleString()} / {item.usage.completion_tokens.toLocaleString()} {en ? "input / output tokens, including reasoning" : "输入 / 输出 token，输出已含思考"} · {(item.totalMs / 1000).toFixed(2)} {en ? "seconds" : "秒"}</p>
          <dl className="mt-3 space-y-2">{item.images.map(image => <div key={image.path}><dt>{image.path}</dt><dd className="break-all">SHA-256: {image.sha256}</dd></div>)}</dl>
        </details>
      </article>)}</div>
    </section>

    <CreativeEvaluation data={creative} locale={locale} />

    <section id="official-benchmarks" className="scroll-mt-6">
      <h2>{en ? "Official benchmarks and conditions" : "官方跑分与测试条件"}</h2>
      {officialNotes.map(note => <p key={note}>{note}</p>)}
      <div className="mt-5 space-y-6">{figures.map(figure => <figure key={figure.id} className="min-w-0 rounded-xl border border-line bg-white p-3 sm:p-4">
        <a href={figure.path} target="_blank" rel="noreferrer"><Image src={figure.webPreviewPath ?? figure.path} width={figure.webPreview?.width ?? figure.width} height={figure.webPreview?.height ?? figure.height} alt={en ? figure.altEn : figure.altZh} unoptimized className="h-auto w-full" /></a>
        <figcaption className="mt-3 text-xs">{en ? figure.titleEn : figure.titleZh} · {figure.credit} · <a href={figure.sourcePage} target="_blank" rel="noreferrer">{en ? "Official source" : "官方原文"}</a> · <a href={figure.path} target="_blank" rel="noreferrer">{en ? "Full original with axes, legends and footnotes" : "完整原图，含坐标、图例与脚注"}</a></figcaption>
      </figure>)}</div>
    </section>

    <section id="review-evidence" className="scroll-mt-6 border-t border-line pt-6">
      <h2>{en ? "Evidence and downloads" : "证据与下载"}</h2>
      <p>{vision.method[language]}</p>
      <p>{vision.limits[language]}</p>
      <p>{en ? `The five image-input requests report ${vision.totals.promptTokens.toLocaleString()} input tokens and ${vision.totals.completionTokensIncludingReasoning.toLocaleString()} completion tokens, including ${vision.totals.reasoningTokens.toLocaleString()} reasoning tokens. OpenRouter reports $${vision.totals.reportedCostUsd.toFixed(6)} in usage.cost; this has not been reconciled against an invoice.` : `五次图片输入请求报告输入 ${vision.totals.promptTokens.toLocaleString()} token、输出 ${vision.totals.completionTokensIncludingReasoning.toLocaleString()} token，输出已包含 ${vision.totals.reasoningTokens.toLocaleString()} 个思考 token。OpenRouter 的 usage.cost 合计 $${vision.totals.reportedCostUsd.toFixed(6)}，未与账单核销。`}</p>
      <p className="flex flex-wrap gap-x-5 gap-y-2 text-xs"><a href={creative.evidencePath} download>{en ? "Creative results and sources" : "创作结果与来源索引"}</a><a href={visionPath} download>{en ? "Image-input prompts, answers and usage" : "图片输入题目、回答与用量"}</a><a href="/articles/tencent-hy4-release/manifest.json">{en ? "Official image sources and hashes" : "官方图片出处与哈希"}</a></p>
      <p className="text-xs"><Link href={localizedPath("/guides/tencent-hy4", locale)}>{en ? "Hy4 launch analysis" : "Hy4 发布解读"}</Link> · <Link href={localizedPath("/reports", locale)}>{en ? "More model reports" : "更多模型报告"}</Link></p>
    </section>
  </InfoPage>;
}
