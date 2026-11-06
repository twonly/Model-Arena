import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArticleNavigation, type ArticleSection } from "@/components/ArticleNavigation";
import { CreativeEvaluation, type CreativeEvaluationData } from "@/components/CreativeEvaluation";
import { InfoPage, infoMetadata } from "@/components/InfoPage";
import { JsonLd } from "@/components/JsonLd";
import { BRAND } from "@/lib/brand";
import { DEFAULT_LOCALE, localizedPath, normalizeLocale } from "@/lib/i18n";
import rawData from "@/public/evaluations/gemini-4-argon-creative.json";

const pathname = "/guides/gemini-4-argon-creative";
const modelId = "gemini-4-argon";
const modelName = "Gemini 4 Argon";
type Props = { params: Promise<{ lang: string }> };
type GoogleReview = CreativeEvaluationData & {
  publicationStatus: string;
  modelId: string;
  publicationGate: { allElevenAccepted: boolean };
  modelMetadataVerifiedAt: string;
  modelMetadata: { descriptionZh: string; descriptionEn: string; cloudModelUrl: string; officialModelCard: string; inputTokenLimit?: number; unifiedInputPlusOutputTokenLimit?: number };
  officialBenchmarks: { path: string; width: number; height: number; altZh: string; altEn: string; sourcePage: string; imageUrl: string; retrievedAt: string; copyrightHolder: string; licenseStatus: string; sha256: string }[];
  officialContext?: { methodology?: string };
};
const data = rawData as unknown as GoogleReview;
const expectedCases = ["bookshelf", "planetary-reducer", "two-bedroom-interior", "knowledge-1", "knowledge-2", "knowledge-3", "knowledge-4", "svg-clock", "svg-dashboard", "svg-poster", "svg-pelican-animation"];
const ready = data.publicationStatus === "ready" && data.modelId === modelId && data.publicationGate?.allElevenAccepted === true && data.cases.length === 11 && expectedCases.every((id, i) => data.cases[i]?.id === id);
const absolute = (path: string) => new URL(path, BRAND.url).href;

function copy(en: boolean) {
  return {
    title: en ? `${modelName} review: Blender, knowledge videos, SVG and animation` : `${modelName} 评测：Blender、知识视频、SVG 与动画`,
    description: en ? `Eleven creative tasks by ${modelName}, with inspected final artifacts, editable project downloads, concise observations and attributed Google benchmark figures.` : `${modelName} 的 11 项创作评测：查看经过检查的最终作品、可编辑工程下载、具体简评与注明来源的 Google 官方基准图。`,
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = normalizeLocale((await params).lang) ?? DEFAULT_LOCALE;
  const en = locale === "en";
  const { title, description } = copy(en);
  if (!ready) return { title, robots: { index: false, follow: false } };
  const metadata = infoMetadata(locale, pathname, title, description);
  const first = data.cases.flatMap(item => item.media).find(media => media.type === "image");
  const image = first ? { url: first.path, width: first.width, height: first.height, alt: en ? first.captionEn : first.captionZh } : undefined;
  return {
    ...metadata,
    title: { absolute: `${title} | TOKRACE` },
    keywords: [modelName, modelId, "Google Gemini", "Blender", "SVG", en ? "AI knowledge video" : "AI 知识视频", en ? "creative evaluation" : "创作评测"],
    openGraph: { ...metadata.openGraph, type: "article", publishedTime: data.publishedAt, modifiedTime: data.updatedAt, ...(image ? { images: [image] } : {}) },
    twitter: { ...metadata.twitter, ...(image ? { images: [image.url] } : {}) },
  };
}

export default async function GeminiArgonCreativeReview({ params }: Props) {
  if (!ready) notFound();
  const locale = normalizeLocale((await params).lang) ?? DEFAULT_LOCALE;
  const en = locale === "en";
  const { title, description } = copy(en);
  const url = absolute(localizedPath(pathname, locale));
  const navigation: ArticleSection[] = [
    { id: "model-introduction", label: en ? "Model and source" : "模型与来源" },
    { id: "review-overview", label: en ? "Scope and findings" : "范围与结论" },
    ...(["blender", "knowledge-video", "svg"] as const).flatMap(category => [
      { id: `creative-${category}`, label: category === "blender" ? (en ? "3D modelling" : "3D 建模") : category === "knowledge-video" ? (en ? "Knowledge videos" : "知识视频") : (en ? "SVG and animation" : "SVG 与动画") },
      ...data.cases.filter(item => item.category === category || (category === "svg" && item.category === "svg-animation")).map(item => ({ id: `creative-case-${item.id}`, label: en ? item.titleEn : item.titleZh, nested: true })),
    ]),
    { id: "creative-evidence", label: en ? "Evidence and limits" : "证据与局限" },
    { id: "official-benchmarks", label: en ? "Google benchmark figures" : "Google 官方基准图" },
  ];
  const images = data.cases.flatMap(item => item.media.flatMap(media => media.type === "image" ? [absolute(media.path)] : media.posterPath ? [absolute(media.posterPath)] : []).slice(0, 1));
  return <InfoPage locale={locale} pathname={pathname} title={title} intro={description} updatedAt={data.updatedAt.slice(0, 10)} sidebar={<ArticleNavigation sections={navigation} en={en} />}>
    <JsonLd data={{ "@context": "https://schema.org", "@type": "TechArticle", "@id": url + "#article", headline: title, description, datePublished: data.publishedAt, dateModified: data.updatedAt, inLanguage: locale, mainEntityOfPage: url, url, author: { "@type": "Organization", name: BRAND.publisher, url: BRAND.url }, publisher: { "@type": "Organization", name: BRAND.publisher, url: BRAND.url }, image: images, citation: [data.modelMetadata.officialModelCard, data.modelMetadata.cloudModelUrl, ...data.officialBenchmarks.map(item => item.sourcePage)], about: { "@type": "SoftwareApplication", name: modelName, applicationCategory: "AI model" } }} />
    <JsonLd data={{ "@context": "https://schema.org", "@type": "Dataset", "@id": url + "#dataset", name: title, description: en ? data.methodEn : data.methodZh, datePublished: data.publishedAt, dateModified: data.updatedAt, inLanguage: ["zh-CN", "en"], url, creator: { "@type": "Organization", name: BRAND.publisher, url: BRAND.url }, distribution: { "@type": "DataDownload", encodingFormat: "application/json", contentUrl: absolute(data.evidencePath) }, isAccessibleForFree: true }} />
    <JsonLd data={{ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "TOKRACE", item: BRAND.url + localizedPath("/", locale) }, { "@type": "ListItem", position: 2, name: title, item: url }] }} />
    {data.cases.flatMap(item => item.media.filter(media => media.type === "video" && media.posterPath).map(media => <JsonLd key={media.path} data={{ "@context": "https://schema.org", "@type": "VideoObject", name: en ? item.titleEn : item.titleZh, description: en ? media.captionEn : media.captionZh, thumbnailUrl: absolute(media.posterPath!), uploadDate: data.publishedAt, duration: media.durationSeconds ? `PT${media.durationSeconds}S` : undefined, contentUrl: absolute(media.path), isPartOf: { "@id": url + "#article" } }} />))}
    <section id="model-introduction" className="scroll-mt-6">
      <div className="mb-3 flex items-center gap-3"><Image src="/provider-icons/gemini-color.svg" width={36} height={36} alt="Google Gemini" unoptimized /><h2 className="!mb-0">{en ? "Model and source" : "模型与来源"}</h2></div>
      <p>{en ? data.modelMetadata.descriptionEn : data.modelMetadata.descriptionZh}</p>
      <p>{en ? "Exact requested and returned model alias: " : "精确请求与返回的模型别名："}<code>{modelId}</code>{en ? ". A verifiable immutable checkpoint was not published." : "。未公布可验证的不可变 checkpoint。"}</p>
      <p><a href={data.modelMetadata.officialModelCard}>{en ? "Google model card" : "Google 模型卡"}</a> · <a href={data.modelMetadata.cloudModelUrl}>{en ? "Google model documentation" : "Google 模型文档"}</a> · {en ? "Metadata checked: " : "资料核对："}{data.modelMetadataVerifiedAt}</p>
    </section>
    <section id="review-overview" className="scroll-mt-6"><h2>{en ? "Scope and findings" : "范围与结论"}</h2><p>{en ? data.summaryEn : data.summaryZh}</p><p>{en ? "All eleven final deliveries were inspected. Accepted means delivered and checked, not a perfect quality score. The work is presented first, with run conditions and raw usage in the expandable evidence section." : "11 项最终交付均已检查。accepted 表示交付和检查完成，不代表质量满分。先看作品；运行条件与原生用量放在可展开的证据说明中。"}</p></section>
    <p><a href={localizedPath("/guides/gemini-3-8-flash-creative", locale)}>{en ? "View Gemini 3.8 Flash on the same frozen task suite" : "查看同一冻结题集下的 Gemini 3.8 Flash 评测"}</a></p>
    <details className="my-4 rounded-xl border border-line p-4"><summary className="cursor-pointer">{en ? "Budgets and cumulative SVG elapsed time" : "预算与 SVG 累计经过时间"}</summary><p>{en ? "No controller caps on turns, cumulative output, retries or creation time. Each response allows up to 65,536 output tokens; individual network requests have a 600-second deadline and outage backoff is at least 60 seconds." : "控制器不设轮数、累计输出、重试次数或创作总时限。单次响应最多 65,536 输出 token；单次网络请求期限为 600 秒，服务故障后至少退避 60 秒。"}</p><p>{en ? "SVG elapsed spans, from first session creation to final completion: clock 586 s, dashboard 298 s, poster 501 s, cycling pelican 962 s. These include rendering, interruptions and waiting, with overlapping sessions; they are not isolated inference-speed measurements." : "SVG 从首建会话到最终完成的累计经过时间：钟表 586 秒、图表 298 秒、海报 501 秒、骑车鹈鹕 962 秒。包含渲染、中断与等待，且会话可能重叠，不作为独立推理速度测量。"}</p></details>
    <CreativeEvaluation data={data} locale={locale} />
    <section id="official-benchmarks" className="scroll-mt-6"><h2>{en ? "Original Google benchmark figures" : "Google 官方基准原图"}</h2>
      <p>{en ? "Two original Google figures show a multi-benchmark overview and DeepSWE V1.1. The GIF files contain one frame each. TOKRACE did not independently reproduce these results. Original image bytes, dimensions, axes, footnotes and attribution are retained." : "以下两张 Google 原图分别为多项基准总表与 DeepSWE V1.1；GIF 文件各只有一帧，未经 TOKRACE 独立复现。原图字节、实际尺寸、坐标轴、脚注与署名保留。"}</p>
      <p>{en ? "Google uses the highest thinking setting unless noted, with mostly pass@1 results. Harnesses and source leaderboards differ. OSWorld is a partial score on an offline subset, taking the maximum of three runs." : "官方除特别注明外使用最高 thinking，多数指标为 pass@1；各行的框架与来源榜单不同。OSWorld 是离线子集三次运行最高值的部分成绩，不能把整张表看作同条件单次评测。"}</p>
      {data.officialContext?.methodology && <p><a href={data.officialContext.methodology}>{en ? "Google evaluation methodology" : "Google 评测方法"}</a></p>}
      <div className="mt-4 grid min-w-0 gap-6">{data.officialBenchmarks.map(item => <figure key={item.path} className="min-w-0 overflow-hidden rounded-xl border border-line bg-card"><a href={item.path} target="_blank" rel="noopener noreferrer"><Image src={item.path} width={item.width} height={item.height} alt={en ? item.altEn : item.altZh} unoptimized className="block h-auto w-full" /></a><figcaption className="space-y-2 p-4 text-xs"><p>{en ? item.altEn : item.altZh}</p><p><a href={item.sourcePage}>{en ? "Google source page" : "Google 来源页"}</a> · <a href={item.imageUrl}>{en ? "Original image" : "原始图片"}</a> · {item.retrievedAt.slice(0, 10)}</p><p>© {item.copyrightHolder}</p></figcaption></figure>)}</div>
    </section>
  </InfoPage>;
}
