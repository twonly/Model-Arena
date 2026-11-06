import { reviewPresentation, reviewText, REVIEW_PRESENTATION_UPDATED_AT } from "@/lib/model-review-presentation";

export function reviewStructuredData(data: object) {
  const node = data as Record<string, unknown>;
  if (node["@type"] !== "TechArticle" && node["@type"] !== "NewsArticle") return data;
  const url = node.url ?? node.mainEntityOfPage;
  if (typeof url !== "string") return data;
  const presentation = reviewPresentation(new URL(url, "https://www.tokrace.com").pathname.replace(/^\/(?:zh-CN|en)/, ""));
  if (!presentation) return data;
  const locale = node.inLanguage === "en" ? "en" : "zh-CN";
  return { ...node, headline: reviewText(presentation.title, locale), description: reviewText(presentation.description, locale), dateModified: REVIEW_PRESENTATION_UPDATED_AT };
}

/**
 * 注入 JSON-LD 结构化数据（schema.org）。
 * 供搜索引擎与生成式引擎（GEO）理解站点 / 榜单内容并引用。
 */
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      // 数据由本站构造，非用户输入；JSON.stringify 已转义
      dangerouslySetInnerHTML={{ __html: JSON.stringify(reviewStructuredData(data)).replace(/</g, "\\u003c") }}
    />
  );
}
