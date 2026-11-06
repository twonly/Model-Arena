import Image from "next/image";
import Link from "next/link";
import { ArticleNavigation, type ArticleSection } from "@/components/ArticleNavigation";
import { CreativeEvaluation, type CreativeEvaluationData } from "@/components/CreativeEvaluation";
import { InfoPage, infoMetadata } from "@/components/InfoPage";
import { JsonLd } from "@/components/JsonLd";
import { BRAND } from "@/lib/brand";
import { DEFAULT_LOCALE, localizedPath, normalizeLocale } from "@/lib/i18n";
import rawData from "@/public/evaluations/nemotron-3-5-super-vl-creative.json";

type ModelInformation = {
  officialLogo: { path: string; width: number; height: number; sourceUrl: string };
  officialFigures: { path: string; width: number; height: number; sourcePage: string; captionZh: string; captionEn: string }[];
  sources: { url: string; labelZh: string; labelEn: string }[];
};
type Props = { params: Promise<{ lang: string }> };
const data = rawData as CreativeEvaluationData & { modelInformation: ModelInformation };
const information = data.modelInformation;
const pathname = "/guides/nemotron-3-5-super-vl-creative";
const blog = "https://developer.nvidia.com/blog/nvidia-nemotron-3-5-super-vl-powers-specialized-agents-with-multimodal-reasoning/";
const bf16 = "https://huggingface.co/nvidia/NVIDIA-Nemotron-3.5-Super-VL-120B-A12B-BF16";
const nvfp4 = "https://huggingface.co/nvidia/NVIDIA-Nemotron-3.5-Super-VL-120B-A12B-NVFP4";
const buildModel = "https://build.nvidia.com/nvidia/nemotron-3.5-super-vl-120b-a12b/modelcard";
const route = "https://openrouter.ai/nvidia/nemotron-3.5-super-vl:free";
const titleZh = "NVIDIA Nemotron 3.5 Super VL 评测：3D、知识视频与 SVG";
const titleEn = "NVIDIA Nemotron 3.5 Super VL Review: 3D, Video and SVG";

export async function generateMetadata({ params }: Props) {
  const locale = normalizeLocale((await params).lang) ?? DEFAULT_LOCALE;
  const en = locale === "en";
  const metadata = infoMetadata(locale, pathname, en ? titleEn : titleZh, en ? data.summaryEn : data.summaryZh);
  return {
    ...metadata,
    keywords: en
      ? ["NVIDIA Nemotron 3.5 Super VL review", "OpenRouter free model", "Blender AI", "AI knowledge video", "SVG evaluation"]
      : ["NVIDIA Nemotron 3.5 Super VL 评测", "OpenRouter 免费模型", "Blender AI 建模", "AI 知识视频", "SVG 评测"],
    openGraph: { ...metadata.openGraph, type: "article", publishedTime: data.publishedAt, modifiedTime: data.updatedAt },
  };
}

export default async function NemotronCreativePage({ params }: Props) {
  const locale = normalizeLocale((await params).lang) ?? DEFAULT_LOCALE;
  const en = locale === "en";
  const title = en ? titleEn : titleZh;
  const description = en ? data.summaryEn : data.summaryZh;
  const url = BRAND.url + localizedPath(pathname, locale);
  const navigation: ArticleSection[] = [
    { id: "model-introduction", label: en ? "Meet Nemotron" : "模型介绍" },
    { id: "review-overview", label: en ? "Results overview" : "结果概览" },
    { id: "creative-blender", label: en ? "3D modelling" : "3D 建模" },
    { id: "creative-knowledge-video", label: en ? "Knowledge videos" : "知识视频" },
    { id: "creative-svg", label: en ? "SVG and animation" : "SVG 与动画" },
    { id: "creative-evidence", label: en ? "Conditions and evidence" : "条件与证据" },
    { id: "official-benchmarks", label: en ? "Official figures and sources" : "官方图与来源" },
  ];
  const images = [...new Set([
    information.officialLogo.path,
    ...data.cases.flatMap(item => item.media.flatMap(media => media.type === "image" ? [media.path] : media.posterPath ? [media.posterPath] : [])),
    ...information.officialFigures.map(figure => figure.path),
  ])];

  return <InfoPage locale={locale} pathname={pathname} title={title} intro={en ? "Meet NVIDIA's vision-language model, then inspect its actual creative outputs and the limitations of this free-route run." : "先了解 NVIDIA 的视觉语言模型，再看免费路由下的真实创作作品、逐项结果与限制。"} updatedAt={data.updatedAt.slice(0, 10)} sidebar={<ArticleNavigation sections={navigation} en={en} />}>
    <JsonLd data={{
      "@context": "https://schema.org", "@type": "TechArticle", "@id": url + "#article",
      headline: title, description, datePublished: data.publishedAt, dateModified: data.updatedAt,
      inLanguage: locale, mainEntityOfPage: url, url,
      author: { "@type": "Organization", name: BRAND.publisher, url: BRAND.url },
      publisher: { "@type": "Organization", name: BRAND.publisher, url: BRAND.url },
      image: images.map(path => BRAND.url + path),
      citation: [...new Set([...information.sources.map(source => source.url), ...data.cases.map(item => item.source.url)])],
      about: { "@type": "SoftwareApplication", name: "NVIDIA Nemotron 3.5 Super VL", applicationCategory: "AI model" },
    }} />
    <JsonLd data={{
      "@context": "https://schema.org", "@type": "Dataset", "@id": url + "#dataset",
      name: title, description: en ? data.methodEn : data.methodZh,
      datePublished: data.publishedAt, dateModified: data.updatedAt, inLanguage: ["zh-CN", "en"], url,
      creator: { "@type": "Organization", name: BRAND.publisher, url: BRAND.url },
      distribution: { "@type": "DataDownload", encodingFormat: "application/json", contentUrl: BRAND.url + data.evidencePath },
      isAccessibleForFree: true,
    }} />
    {data.cases.flatMap(item => item.media.filter(media => media.type === "video" && media.posterPath).map(media => <JsonLd key={media.path} data={{
      "@context": "https://schema.org", "@type": "VideoObject",
      name: en ? item.titleEn : item.titleZh, description: en ? media.captionEn : media.captionZh,
      thumbnailUrl: BRAND.url + media.posterPath, uploadDate: data.publishedAt,
      duration: media.durationSeconds ? `PT${media.durationSeconds}S` : undefined,
      contentUrl: BRAND.url + media.path, isPartOf: { "@id": url + "#article" },
    }} />))}

    <section id="model-introduction" className="scroll-mt-6">
      <h2>{en ? "What is Nemotron 3.5 Super VL?" : "Nemotron 3.5 Super VL 是什么？"}</h2>
      <p>{en ? "NVIDIA released this vision-language model on October 15, 2026, with 120B total parameters and approximately 12B active parameters per token. Its intended uses include reasoning, coding, tool use, document understanding and video understanding." : "NVIDIA 于 2026 年 10 月 15 日发布这款视觉语言模型，总参数 120B、每 token 约激活 12B，面向推理、编程、工具使用、文档和视频理解等任务。"} <a href={blog}>{en ? "NVIDIA announcement" : "NVIDIA 发布介绍"}</a> · <a href={bf16}>{en ? "Official model card" : "官方模型卡"}</a></p>
      <figure className="mt-5 max-w-sm rounded-xl border border-line bg-[#111827] p-6">
        <a href={information.officialLogo.sourceUrl}><Image src={information.officialLogo.path} width={information.officialLogo.width} height={information.officialLogo.height} alt={en ? "Official NVIDIA company logo" : "NVIDIA 官方公司标识"} unoptimized loading="eager" className="h-auto w-64 max-w-full" /></a>
        <figcaption className="mt-3 text-xs text-slate-300">{en ? "NVIDIA company mark; not a separate Nemotron model logo." : "NVIDIA 公司标识，并非另造的 Nemotron 专属图标。"}</figcaption>
      </figure>
      <p>{en ? "The BF16 reference weights and NVFP4 quantized release are distinct. NVFP4 uses quantization-aware distillation, and NVIDIA Build explicitly describes NVFP4. This run requests nvidia/nemotron-3.5-super-vl:free through OpenRouter; its archived endpoint metadata does not establish the served precision. Neither official checkpoint can be assumed to identify the free deployment." : "BF16 参考权重与 NVFP4 量化发布需要区分。NVFP4 采用量化感知蒸馏，NVIDIA Build 对应模型卡明确描述 NVFP4。本次请求 OpenRouter 的 nvidia/nemotron-3.5-super-vl:free，归档端点元数据未明确服务精度，不能用任一权重链接直接证明免费部署的精度。"} <a href={bf16}>BF16</a> · <a href={nvfp4}>NVFP4</a> · <a href={buildModel}>NVIDIA Build</a> · <a href={route}>OpenRouter</a></p>
      <p>{en ? "The weights are released under OpenMDW-1.1. That weights license does not automatically license NVIDIA trademarks or blog figures." : "模型权重按 OpenMDW-1.1 发布，该权重许可证不自动授予 NVIDIA 商标或博客插图的使用权。"} <a href="https://openmdw.ai/license/1-1/">OpenMDW-1.1</a></p>
    </section>

    <section id="review-overview" className="scroll-mt-6">
      <h2>{en ? "What did this run deliver?" : "这次创作交付了什么？"}</h2>
      <p>{description}</p>
      <p>{en ? "The scope retains eleven creative-suite-v4 tasks: three Blender projects, four knowledge videos locked to the same Shanghai date, three static SVGs and one cycling animation. A listed task is not a claim of completed delivery or a passed quality check." : "范围保留 creative-suite-v4 的 11 项任务：三项 Blender、四项按同一上海日期锁定的知识视频、三项静态 SVG 和一项骑车动画。列入范围不等于该项已交付或质量通过。"}</p>
    </section>

    <CreativeEvaluation data={data} locale={locale} />

    <section id="official-benchmarks" className="scroll-mt-6">
      <h2>{en ? "Official figures and their scope" : "官方图与适用范围"}</h2>
      <p>{en ? "These NVIDIA figures are separate from our creative results and have not been independently reproduced by TOKRACE. The first concerns Baseten throughput at 100K input tokens; the second concerns additional domain post-training. Neither is a benchmark of this unchanged OpenRouter free endpoint. “Base” in the second figure means before the additional domain training, not an instruction-untuned pretrained model." : "以下 NVIDIA 官方图与本站作品分开，本站未独立复现。第一张对应 Baseten 端点的 100K 输入吞吐测试，第二张对应额外领域后训练；都不是本次未改动 OpenRouter 免费端点的实测成绩。第二张图的 Base 指额外领域后训练之前，并非未经指令调优的预训练模型。"}</p>
      <div className="mt-5 space-y-6">{information.officialFigures.map(figure => <figure key={figure.path} className="overflow-hidden rounded-xl border border-line bg-card">
        <a href={figure.path}><Image src={figure.path} width={figure.width} height={figure.height} alt={en ? figure.captionEn : figure.captionZh} unoptimized className="h-auto w-full bg-white" /></a>
        <figcaption className="p-4 text-xs">{en ? figure.captionEn : figure.captionZh} <a href={figure.sourcePage}>{en ? "Source: NVIDIA" : "来源：NVIDIA"}</a></figcaption>
      </figure>)}</div>
      <p className="mt-4 text-xs">{en ? "Original axes, legends and credits are retained. Rights remain with NVIDIA and the parties credited in the figures." : "保留原始坐标、图例和署名；版权归 NVIDIA 及图内注明的相关方。"}</p>
      <ul>{information.sources.map(source => <li key={source.url}><a href={source.url}>{en ? source.labelEn : source.labelZh}</a></li>)}</ul>
      <p><Link href={localizedPath("/model/nemotron-3-5-super-vl", locale)}>{en ? "Model identity and review links" : "模型身份与评测入口"}</Link> · <Link href={localizedPath("/guides/dots3-note-preview", locale)}>{en ? "Dots3-Note Preview SVG review" : "Dots3-Note Preview SVG 评测"}</Link></p>
    </section>
  </InfoPage>;
}
