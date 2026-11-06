import { REVIEW_PRESENTATION_UPDATED_AT } from "@/lib/model-review-presentation";
import Link from "next/link";
import { InfoPage, infoMetadata } from "@/components/InfoPage";
import { ArticleNavigation, type ArticleSection } from "@/components/ArticleNavigation";
import { CreativeEvaluation, type CreativeEvaluationData } from "@/components/CreativeEvaluation";
import { JsonLd } from "@/components/JsonLd";
import { BRAND } from "@/lib/brand";
import { DEFAULT_LOCALE, localizedPath, normalizeLocale } from "@/lib/i18n";
import rawData from "@/public/evaluations/longcat-2-5-claude-code.json";

const pathname = "/guides/longcat-2-5-claude-code";
const data = rawData as CreativeEvaluationData;
type Props = { params: Promise<{ lang: string }> };
const titleZh = "LongCat 2.5 Preview × Claude Code：Blender 与画图实测";
const titleEn = "LongCat 2.5 Preview in Claude Code: 3D, SVG and video tests";
const descriptionZh = "用 LongCat-2.5-Preview 驱动本地 Claude Code，实际执行 15 项 Blender、3D、SVG 与知识视频任务，公开真实作品、失败记录、API token 用量与工程下载。";
const descriptionEn = "LongCat-2.5-Preview drives local Claude Code across 15 Blender, 3D, SVG and knowledge-video tasks, with actual artifacts, failures, API token usage and editable source downloads.";

export async function generateMetadata({ params }: Props) {
  const locale = normalizeLocale((await params).lang) ?? DEFAULT_LOCALE;
  const en = locale === "en";
  return {
    ...infoMetadata(locale, pathname, en ? titleEn : titleZh, en ? descriptionEn : descriptionZh),
    keywords: en ? ["LongCat 2.5 Preview review", "Blender AI modeling", "AI knowledge video", "creative agent evaluation"] : ["LongCat 2.5 Preview 评测", "Blender AI 建模", "AI 知识视频", "创作 Agent 评测"],
  };
}

export default async function LongCatClaudeCodePage({ params }: Props) {
  const locale = normalizeLocale((await params).lang) ?? DEFAULT_LOCALE;
  const en = locale === "en";
  const title = en ? titleEn : titleZh;
  const description = en ? descriptionEn : descriptionZh;
  const url = BRAND.url + localizedPath(pathname, locale);
  const navigation: ArticleSection[] = [
    { id: "creative-summary", label: en ? "Outputs and findings" : "作品与结论" },
    { id: "creative-method", label: en ? "Model and method" : "型号与方法" },
    ...data.cases.map(item => ({ id: `creative-case-${item.id}`, label: en ? item.titleEn : item.titleZh })),
    { id: "creative-evidence", label: en ? "Evidence and limits" : "证据与局限" },
  ];
  const images = data.cases.flatMap(item => item.media.flatMap(media => media.type === "image" ? [BRAND.url + media.path] : media.posterPath ? [BRAND.url + media.posterPath] : []).slice(0, 1));
  return <InfoPage locale={locale} pathname={pathname} title={title} intro={description} updatedAt={data.date} sidebar={<ArticleNavigation sections={navigation} en={en} />}>
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
      image: images, citation: [...new Set(data.cases.flatMap(item => [item.source.url, ...(item.references ?? []).map(reference => reference.url)]))],
      about: { "@type": "SoftwareApplication", name: "LongCat 2.5 Preview", applicationCategory: "AI model" },
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
        { "@type": "ListItem", position: 2, name: en ? "LongCat 2.5 Preview review" : "LongCat 2.5 Preview 评测", item: BRAND.url + localizedPath("/guides/longcat-2-5", locale) },
        { "@type": "ListItem", position: 3, name: title, item: url },
      ],
    }} />
<CreativeEvaluation data={data} locale={locale} />
<details id="review-details" className="scroll-mt-6 rounded-xl border border-line bg-card p-5">
<summary className="cursor-pointer font-bold text-ink">{en ? "Test details, original answers and sources" : "测试详情、原始回答与来源"}</summary>
<div className="mt-5 space-y-7">
<p className="rounded-xl border border-line bg-card p-4"><Link href={localizedPath("/guides/longcat-2-5-release", locale)}>{en ? "November 2 update: LongCat-2.5 release review and a new independent creative run →" : "11 月 2 日更新：LongCat-2.5 正式版评测与新一轮独立创作实跑 →"}</Link> {en ? "This page retains the October Preview run." : "本页保留 10 月 Preview 历史运行。"}</p>
<p><Link href={localizedPath("/guides/longcat-2-5", locale)}>{en ? "Read the Preview archive: access, pricing, text, code and SVG tests" : "查看 Preview 历史评测：入口、价格、文本、代码与 SVG"}</Link></p>
</div>
</details>
</InfoPage>;
}
