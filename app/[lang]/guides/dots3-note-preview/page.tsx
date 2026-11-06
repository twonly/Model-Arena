import Image from "next/image";
import Link from "next/link";
import { ArticleNavigation } from "@/components/ArticleNavigation";
import { InfoPage, infoMetadata } from "@/components/InfoPage";
import { JsonLd } from "@/components/JsonLd";
import { VisualEvaluation, type VisualEvaluationData } from "@/components/VisualEvaluation";
import type { VisualSupplementData } from "@/components/VisualSupplement";
import { BRAND } from "@/lib/brand";
import { DEFAULT_LOCALE, localizedPath, normalizeLocale } from "@/lib/i18n";
import { DATASET_LICENSE_URL } from "@/lib/structured-data";
import visualRecord from "@/public/evaluations/dots3-note-preview-visual.json";
import supplementRecord from "@/public/evaluations/dots3-note-preview-supplement.json";

const pathname = "/guides/dots3-note-preview";
const evidencePath = "/evaluations/dots3-note-preview-evidence.json";
const logo = "/evaluations/dots3-note-preview/assets/dots-logo.png";
const modelSource = "https://huggingface.co/dots-studio/dots3-note-prev";
const repositorySource = "https://github.com/studio-dots-ai/dots3-note-prev";
const routeSource = "https://openrouter.ai/dots-studio/dots-3-note-preview:free";
const visuals = visualRecord as VisualEvaluationData;
const supplement = supplementRecord as VisualSupplementData;
type Props = { params: Promise<{ lang: string }> };

function copy(en: boolean) {
  return {
    title: en ? "Dots3-Note Preview review: free SVG drawings and animation" : "Dots3-Note Preview 评测：免费 SVG 绘图与骑车动画",
    description: en
      ? "Four Dots3-Note Preview SVG tasks through OpenRouter's free route: inspect the clock, chart, Chinese poster and cycling animation, with source files, official figures and recorded usage."
      : "通过 OpenRouter 免费路由测试 Dots3-Note Preview：查看钟表、数据图表、中文海报与骑车动画，附原始 SVG、官方图表及实测用量。",
  };
}

export async function generateMetadata({ params }: Props) {
  const locale = normalizeLocale((await params).lang) ?? DEFAULT_LOCALE;
  const { title, description } = copy(locale === "en");
  const metadata = infoMetadata(locale, pathname, title, description);
  return {
    ...metadata,
    keywords: ["Dots3-Note Preview", "Dots Studio", "OpenRouter", "SVG", "open weights", "免费模型评测"],
    openGraph: { ...metadata.openGraph, type: "article", publishedTime: supplement.updatedAt, modifiedTime: supplement.updatedAt, images: [{ url: logo, width: 2123, height: 1031, alt: "Dots Studio" }] },
    twitter: { ...metadata.twitter, images: [logo] },
  };
}

export default async function Dots3Review({ params }: Props) {
  const locale = normalizeLocale((await params).lang) ?? DEFAULT_LOCALE;
  const en = locale === "en";
  const { title, description } = copy(en);
  const url = BRAND.url + localizedPath(pathname, locale);
  const updatedDate = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(supplement.updatedAt));
  const sections = [
    { id: "model-introduction", label: en ? "Meet the model" : "模型介绍" },
    { id: "review-overview", label: en ? "Our evaluation" : "评测概览" },
    { id: "visual-supplement", label: en ? "SVG and animation" : "SVG 与动画" },
    { id: "official-benchmarks", label: en ? "Official benchmarks" : "官方跑分" },
    { id: "review-details", label: en ? "Test details and sources" : "测试详情与来源" },
  ];
  const images = [...new Set([logo, ...supplement.groups.flatMap(group => group.samples.flatMap(sample => sample.pngPath ? [sample.pngPath] : [])), ...visuals.official.map(figure => figure.path)])];
  return <InfoPage locale={locale} pathname={pathname} title={title} intro={description} updatedAt={updatedDate} sidebar={<ArticleNavigation sections={sections} en={en} />}>
    <JsonLd data={{
      "@context": "https://schema.org", "@type": "TechArticle", "@id": url + "#article",
      headline: title, description, inLanguage: locale, url, mainEntityOfPage: url,
      datePublished: supplement.updatedAt, dateModified: supplement.updatedAt,
      author: { "@type": "Organization", name: BRAND.publisher, url: BRAND.url },
      publisher: { "@type": "Organization", name: BRAND.publisher, url: BRAND.url },
      about: { "@type": "SoftwareApplication", name: "Dots3-Note Preview", applicationCategory: "AI model" },
      image: images.map(path => BRAND.url + path),
      citation: [...new Set([modelSource, repositorySource, routeSource, ...visuals.official.map(figure => figure.sourcePage)])],
    }} />
    <JsonLd data={{
      "@context": "https://schema.org", "@type": "Dataset", "@id": url + "#dataset",
      name: "Dots3-Note Preview: three static SVG tasks and one cycling animation",
      description: en ? "Five free-route API requests for four SVG tasks, including a truncated animation response. Includes original prompts, returned model identities and recorded usage." : "四项 SVG 任务的五次免费路由请求，包含一次动画截断记录；附原始提示词、返回模型身份与实际用量。",
      license: DATASET_LICENSE_URL, url: url + "#review-details", dateModified: supplement.updatedAt,
      creator: { "@type": "Organization", name: BRAND.publisher },
      variableMeasured: ["SVG task constraints", "API request duration", "API token usage", "Reported inference cost"],
      distribution: { "@type": "DataDownload", encodingFormat: "application/json", contentUrl: BRAND.url + evidencePath },
    }} />
    <JsonLd data={{
      "@context": "https://schema.org", "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: BRAND.publisher, item: BRAND.url + localizedPath("/", locale) },
        { "@type": "ListItem", position: 2, name: en ? "Reports" : "实测报告", item: BRAND.url + localizedPath("/reports", locale) },
        { "@type": "ListItem", position: 3, name: title, item: url },
      ],
    }} />

    <section id="model-introduction" className="scroll-mt-6">
      <h2>{en ? "Meet Dots3-Note Preview" : "认识 Dots3-Note Preview"}</h2>
      <div className="my-4 rounded-xl border border-line bg-white p-5">
        <Image src={logo} width={2123} height={1031} alt={en ? "Official Dots Studio logo" : "Dots Studio 官方标识"} unoptimized className="h-20 w-auto max-w-full object-contain" />
      </div>
      <p>{en ? "Dots3-Note Preview is Dots Studio's open-weight mixture-of-experts model, with 280 billion total parameters and 16 billion active parameters. Its model card is published under Apache 2.0." : "Dots3-Note Preview 是 Dots Studio 的开放权重混合专家模型，总参数量 280B、激活参数量 16B，模型卡标注 Apache 2.0 许可证。"}</p>
      <p>{en ? "The OpenRouter route used here lists a 512K-token context window, accepts text and image inputs, and returns text. In this review, the model writes SVG source code, which is then rendered into images and a WebP animation." : "本次使用的 OpenRouter 路由列出 512K token 上下文，接受文本和图片输入、输出文本。这里由模型编写 SVG 源码，再渲染为图片与 WebP 动画。"}</p>
      <p className="text-xs"><a href={modelSource}>{en ? "Official model card and weights" : "官方模型卡与权重"}</a> · <a href={repositorySource}>GitHub</a> · <a href={routeSource}>{en ? "OpenRouter route" : "OpenRouter 路由"}</a></p>
    </section>

    <section id="review-overview" className="scroll-mt-6 rounded-xl border border-line bg-card p-5">
      <h2>{en ? "What the four outputs show" : "四项作品表现怎样"}</h2>
      <p>{en ? "The clock has correct hand angles, and the Chinese poster preserves all six required strings. The chart uses correct bar proportions but omits the quarter labels. The animation moves, while its rigid rotating legs do not form a natural pedaling motion." : "钟表指针角度正确，中文海报保留了全部六段指定文字。图表柱高比例正确，但缺少季度标签。骑车动画能够运动，腿部却是绕身体旋转的直杆，踩踏动作不自然。"}</p>
      <p>{en ? "This page covers three static SVG tasks and one animation, with five actual API requests reporting $0 inference cost. Blender projects and knowledge videos are outside this result set; it does not establish completion of the eleven-task creative suite." : "本页覆盖三项静态 SVG 与一项动画，五次实际 API 请求报告的推理费用均为 $0。Blender 工程与知识视频尚未交付，因此这里仅评价这四项作品。"}</p>
    </section>

    <VisualEvaluation data={visuals} supplement={supplement} locale={locale} />

    <details id="review-details" className="scroll-mt-6 rounded-xl border border-line bg-card p-5">
      <summary className="cursor-pointer font-bold text-ink">{en ? "Test conditions, usage and sources" : "测试条件、用量与来源"}</summary>
      <div className="mt-4 space-y-4">
        <p>{en ? "The November 3, 2026 run used the exact model ID dots-studio/dots-3-note-preview:free through OpenRouter's OpenAI-compatible Chat endpoint, with a zero-price provider filter. Returned identities matched that ID." : "2026 年 11 月 3 日通过 OpenRouter 的 OpenAI 兼容 Chat 接口调用 dots-studio/dots-3-note-preview:free，提供商价格过滤设为 0。响应返回的模型 ID 与请求一致。"}</p>
        <p>{en ? "The fixed SVG prompts used temperature 0 and a 600-second request timeout. Static tasks used a 12,288-token output limit; the completed animation used 32,768 after the original 12,288-token request was truncated. Original responses and all five request records are retained." : "使用固定 SVG 提示词、温度 0、600 秒单次请求超时。静态题输出上限为 12,288 token；动画在一次 12,288 token 截断后，以 32,768 token 容量得到完整输出。原始回答及五次请求记录均保留。"}</p>
        <p>{en ? "Reported usage totals 804 input tokens and 48,946 completion tokens, including 38,212 reasoning tokens. Cumulative API request time is 587.52 seconds; this excludes preparation and inspection. The reported $0 cost applies to these requests." : "提供商报告累计输入 804 token，输出 48,946 token，其中已包含 38,212 reasoning token。累计 API 请求耗时 587.52 秒，不包含环境准备与检查。$0 为这些请求报告的推理费用。"}</p>
        <p>{en ? "All rendered images and representative animation frames were inspected. Source measurements check the clock angles, bar heights and exact poster strings. The animation was exported as 40 frames over four seconds and viewed playing in Chrome. These are automated checks and AI visual observations; no independent human scoring is claimed." : "已查看全部成图与动画代表帧，结合源码核对钟表角度、柱高和海报精确文字。动画以 4 秒、40 帧导出，并在 Chrome 中查看实际播放。这里记录自动检查与 AI 视觉观察。"}</p>
        <p><a href={evidencePath}>{en ? "Download prompts, responses and usage" : "下载提示词、回答与用量记录"}</a> · <a href="/evaluations/dots3-note-preview-visual.json">{en ? "Visual results JSON" : "成图数据 JSON"}</a> · <a href="/evaluations/dots3-note-preview-supplement.json">{en ? "Animation and request history JSON" : "动画与请求历史 JSON"}</a></p>
        <p><Link href={localizedPath("/model/dots3-note-preview", locale)}>{en ? "Dots3 model profile" : "Dots3 模型资料页"}</Link> · <Link href={localizedPath("/reports", locale)}>{en ? "More model reports" : "更多模型报告"}</Link></p>
      </div>
    </details>
  </InfoPage>;
}
