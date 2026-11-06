import { InfoPage, infoMetadata } from "@/components/InfoPage";
import { ArticleNavigation, type ArticleSection } from "@/components/ArticleNavigation";
import { CreativeEvaluation, type CreativeEvaluationData } from "@/components/CreativeEvaluation";
import { JsonLd } from "@/components/JsonLd";
import { BRAND } from "@/lib/brand";
import { DEFAULT_LOCALE, localizedPath, normalizeLocale } from "@/lib/i18n";
import rawData from "@/public/evaluations/crouton-alpha-creative.json";

const pathname = "/guides/crouton-alpha-creative";
const data = rawData as CreativeEvaluationData;
type Props = { params: Promise<{ lang: string }> };
const titleZh = "Crouton Alpha 创作评测：Blender、知识视频、SVG 与动画";
const titleEn = "Crouton Alpha creative review: Blender, knowledge videos, SVG and animation";
const descriptionZh = "Crouton Alpha 创作评测：Blender、知识视频、SVG 与动画真实作品。";
const descriptionEn = "Crouton Alpha creative review with Blender, knowledge-video, SVG and animation artifacts.";

export async function generateMetadata({ params }: Props) {
  const locale = normalizeLocale((await params).lang) ?? DEFAULT_LOCALE;
  const en = locale === "en";
  return {
    ...infoMetadata(locale, pathname, en ? titleEn : titleZh, en ? descriptionEn : descriptionZh),
    keywords: en ? ["Crouton Alpha review", "Blender AI modeling", "AI knowledge video", "creative agent evaluation"] : ["Crouton Alpha 评测", "Blender AI 建模", "AI 知识视频", "创作 Agent 评测"],
  };
}

export default async function CroutonAlphaCreativePage({ params }: Props) {
  const locale = normalizeLocale((await params).lang) ?? DEFAULT_LOCALE;
  const en = locale === "en";
  const title = en ? titleEn : titleZh;
  const description = en ? descriptionEn : descriptionZh;
  const url = BRAND.url + localizedPath(pathname, locale);
  const navigation: ArticleSection[] = [
    { id: "crouton-model-introduction", label: en ? "Model and source" : "模型与来源" },
    { id: "crouton-scope-summary", label: en ? "Test scope and findings" : "范围与结论" },
    { id: "creative-blender", label: en ? "3D modelling" : "3D 建模" },
    { id: "creative-knowledge-video", label: en ? "Knowledge videos" : "知识视频" },
    { id: "creative-svg", label: en ? "SVG and animation" : "SVG 与动画" },
    ...data.cases.map(item => ({ id: `creative-case-${item.id}`, label: en ? item.titleEn : item.titleZh })),
    { id: "creative-evidence", label: en ? "Evidence and limits" : "证据与局限" },
  ];
  const images = data.cases.flatMap(item => item.media.flatMap(media => media.type === "image" ? [BRAND.url + media.path] : media.posterPath ? [BRAND.url + media.posterPath] : []).slice(0, 1));
  return <InfoPage locale={locale} pathname={pathname} title={title} intro={description} updatedAt={data.updatedAt.slice(0, 10)} sidebar={<ArticleNavigation sections={navigation} en={en} />}>
{data.cases.flatMap(item => item.media.filter(media => media.type === "video" && media.posterPath).map(media => <JsonLd key={media.path} data={{
      "@context": "https://schema.org", "@type": "VideoObject",
      name: en ? item.titleEn : item.titleZh,
      description: en ? media.captionEn : media.captionZh,
      thumbnailUrl: BRAND.url + media.posterPath,
      uploadDate: data.publishedAt,
      duration: media.durationSeconds ? `PT${media.durationSeconds}S` : undefined,
      contentUrl: BRAND.url + media.path,
      isPartOf: { "@id": url + "#article" },
    }} />))}
<JsonLd data={{
      "@context": "https://schema.org", "@type": "TechArticle", "@id": url + "#article",
      headline: title, description, datePublished: data.publishedAt, dateModified: data.updatedAt,
      inLanguage: locale, mainEntityOfPage: url, url,
      author: { "@type": "Organization", name: BRAND.publisher, url: BRAND.url },
      publisher: { "@type": "Organization", name: BRAND.publisher, url: BRAND.url },
      image: images, citation: [...new Set(["https://openrouter.ai/stealth/crouton-alpha", ...data.cases.flatMap(item => [item.source.url, ...(item.references ?? []).map(reference => reference.url)])])],
      about: { "@type": "SoftwareApplication", name: "Crouton Alpha", applicationCategory: "AI model" },
    }} />
<JsonLd data={{
      "@context": "https://schema.org", "@type": "Dataset", "@id": url + "#dataset",
      name: title, description: en ? data.methodEn : data.methodZh,
      datePublished: data.publishedAt, dateModified: data.updatedAt, inLanguage: ["zh-CN", "en"], url,
      creator: { "@type": "Organization", name: BRAND.publisher, url: BRAND.url },
      distribution: { "@type": "DataDownload", encodingFormat: "application/json", contentUrl: BRAND.url + data.evidencePath },
      isAccessibleForFree: true,
    }} />
<JsonLd data={{
      "@context": "https://schema.org", "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "TOKRACE", item: BRAND.url + localizedPath("/", locale) },
        { "@type": "ListItem", position: 2, name: title, item: url },
      ],
    }} />
<section id="crouton-model-introduction" className="scroll-mt-6">
<h2>{en ? "Model and source" : "模型与来源"}</h2>
<p>{en ? "Crouton Alpha is an anonymous model listed by OpenRouter. This review ran through OpenCode v2.2.5 using the exact route openrouter/stealth/crouton-alpha. The underlying vendor and fixed checkpoint remain undisclosed." : "Crouton Alpha 是 OpenRouter 上列出的匿名模型。本次评测在 OpenCode v2.2.5 中使用精确路由 openrouter/stealth/crouton-alpha。底层厂商与固定 checkpoint 未公开。"}</p>
<p>{en ? "OpenRouter describes it as a lightweight model for coding, agentic subtasks, tool use, document analysis and multimodal work, with a 1,048,576-token context and zero listed prompt/completion prices; these are provider-listed metadata, not tested results. OpenRouter lists a November 3, 2026 release date. Source: " : "OpenRouter将其描述为面向代码、Agent 子任务、工具使用、文档分析与多模态工作的轻量模型，列出 1,048,576 token 上下文和零输入/输出价格；这些为提供商列出元数据，并非本站实测结论。OpenRouter 列出 2026 年 11 月 3 日为发布日期。来源："}{<a href="https://openrouter.ai/stealth/crouton-alpha">{en ? "OpenRouter model page" : "OpenRouter 模型页"}</a>}</p>
<p>{en ? "No official benchmark images for this model were found, so none are reproduced here." : "未找到该模型的官方 benchmark 图片，因此本页不展示任何官方跑分图。"}</p>
</section>
<section id="crouton-scope-summary" className="scroll-mt-6">
<h2>{en ? "Test scope and findings" : "测试范围与结论"}</h2>
<p>{en ? "The suite covers three Blender tasks, four knowledge videos, three static SVG tasks and one SVG animation, using the same frozen topics for the day where the suite requires them. Details of tools and run conditions are recorded in the data." : "题集包括三项 Blender 任务、四项知识视频、三项静态 SVG 和一项 SVG 动画；同一天同题集的冻结主题按题集规则复用。具体工具与运行条件记录在数据中。"}</p>
<p>{en ? data.summaryEn : data.summaryZh}</p>
</section>
<CreativeEvaluation data={data} locale={locale} />
</InfoPage>;
}
