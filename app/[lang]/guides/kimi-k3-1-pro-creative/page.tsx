import { REVIEW_PRESENTATION_UPDATED_AT } from "@/lib/model-review-presentation";
import Link from "next/link";
import { InfoPage, infoMetadata } from "@/components/InfoPage";
import { ArticleNavigation, type ArticleSection } from "@/components/ArticleNavigation";
import { CreativeEvaluation, type CreativeEvaluationData } from "@/components/CreativeEvaluation";
import { JsonLd } from "@/components/JsonLd";
import { BRAND } from "@/lib/brand";
import { DEFAULT_LOCALE, localizedPath, normalizeLocale } from "@/lib/i18n";
import rawData from "@/public/evaluations/kimi-k3-1-pro-creative.json";

const pathname = "/guides/kimi-k3-1-pro-creative";
const data = rawData as CreativeEvaluationData;
type Props = { params: Promise<{ lang: string }> };
const titleZh = "Kimi K3.1 Pro 创作评测：Blender 建模与知识视频";
const titleEn = "Kimi K3.1 Pro creative review: Blender modeling and knowledge videos";
const descriptionZh = "Kimi K3.1 Pro 实际制作 Blender 工程和知识视频：内嵌播放、默认配乐音效、可选历史旁白、各机位大图及源码下载，附来源、失败重试、耗时和订阅用量证据。";
const descriptionEn = "Kimi K3.1 Pro creates editable Blender scenes and knowledge videos, with inline playback, music by default, optional narration, source downloads, failures and usage evidence.";

export async function generateMetadata({ params }: Props) {
  const locale = normalizeLocale((await params).lang) ?? DEFAULT_LOCALE;
  const en = locale === "en";
  return {
    ...infoMetadata(locale, pathname, en ? titleEn : titleZh, en ? descriptionEn : descriptionZh),
    keywords: en ? ["Kimi K3.1 Pro review", "Blender AI modeling", "AI knowledge video", "creative agent evaluation"] : ["Kimi K3.1 Pro 评测", "Blender AI 建模", "AI 知识视频", "创作 Agent 评测"],
  };
}

export default async function KimiCreativePage({ params }: Props) {
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
    { id: "creative-resources", label: en ? "Production and audio" : "制作技巧与音频" },
  ];
  const images = data.cases.flatMap(item => item.media.flatMap(media => media.type === "image" ? [BRAND.url + media.path] : media.posterPath ? [BRAND.url + media.posterPath] : []).slice(0, 1));
  const hasPublicNarration = data.cases.some(item => item.media.some(media => media.type === "video" && media.narrationPath));
  return <InfoPage locale={locale} pathname={pathname} title={title} intro={description} updatedAt={data.updatedAt.slice(0, 10)} sidebar={<ArticleNavigation sections={navigation} en={en} />}>
{data.cases.flatMap(item => item.media.filter(media => media.type === "video" && media.posterPath).map(media => <JsonLd key={media.path} data={{
      "@context": "https://schema.org", "@type": "VideoObject",
      name: en ? item.titleEn : item.titleZh,
      description: en ? media.captionEn : media.captionZh,
      thumbnailUrl: BRAND.url + media.posterPath,
      uploadDate: data.publishedAt,
      contentUrl: BRAND.url + media.path,
      isPartOf: { "@id": url + "#article" },
    }} />))}
<JsonLd data={{
      "@context": "https://schema.org", "@type": "TechArticle", "@id": url + "#article",
      headline: title, description, datePublished: data.publishedAt, dateModified: data.updatedAt,
      inLanguage: locale, mainEntityOfPage: url, url,
      author: { "@type": "Organization", name: BRAND.publisher, url: BRAND.url },
      publisher: { "@type": "Organization", name: BRAND.publisher, url: BRAND.url },
      image: images, citation: [...new Set(data.cases.map(item => item.source.url))],
      about: { "@type": "SoftwareApplication", name: "Kimi K3.1 Pro", applicationCategory: "AI model" },
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
        { "@type": "ListItem", position: 2, name: en ? "Kimi K3.1 Pro review" : "Kimi K3.1 Pro 评测", item: BRAND.url + localizedPath("/guides/kimi-k3-1-pro", locale) },
        { "@type": "ListItem", position: 3, name: title, item: url },
      ],
    }} />
<CreativeEvaluation data={data} locale={locale} />
<details id="review-details" className="scroll-mt-6 rounded-xl border border-line bg-card p-5">
<summary className="cursor-pointer font-bold text-ink">{en ? "Test details, original answers and sources" : "测试详情、原始回答与来源"}</summary>
<div className="mt-5 space-y-7">
<p><Link href={localizedPath("/guides/kimi-k3-1-pro", locale)}>{en ? "Read the model review: access, pricing, text, code and SVG tests" : "查看模型完整评测：入口、价格、文本、代码与 SVG"}</Link></p>
<section id="creative-resources" className="scroll-mt-6 border-t border-line pt-8">
      <h2>{en ? "Production techniques and audio" : "制作技巧与音频"}</h2>
      <p>{en ? "The useful ideas are a storyboard tied to a shared time axis, deliberate framing and motion, deterministic rendering, and checks across every scene and transition. Narration is optional. These resources can inform that workflow. Re-rendering a ready-made template is a separate pipeline check, not an independently generated model result." : "值得借鉴的是分镜共用时间轴、明确的取景与运动、可重复渲染，以及覆盖每个镜头和转场的检查；旁白是可选项。以下资源可以帮助搭建制作流程；把现成模板重新渲染，只能证明管线可运行，不能冒充模型独立创作成绩。"}</p>
      <h3 className="mt-5 font-bold text-ink">{en ? "What limited these videos?" : "这一版视频受什么限制？"}</h3>
      <p>{en ? "This was a short adaptation: the circulation source was 288 seconds and the derivative source 457 seconds; our outputs are 90 and about 89 seconds. The added tasks required Pillow/NumPy/FFmpeg, excluded Manim and Remotion, and allowed at most two effective visual-revision rounds. The model still finished within its budget and inspected its own frames, but missed direction errors, label collisions and motion discontinuities. The production constraints and the model's implementation both matter; no controlled A/B test has isolated their contributions." : "这是短片改编：环流原案例约 288 秒、导数原案例 457 秒，本次分别为 90 秒和约 89 秒。追加题限定 Pillow／NumPy／FFmpeg，排除 Manim、Remotion，且最多进行两轮有效视觉修正。模型在预算内主动结束，也实际看过自己的帧图，但仍漏掉方向错误、标签碰撞和运动跳变。制作约束和模型实现都有影响，目前没有同条件 A/B 能拆出各自贡献。"}</p>
      <p>{en ? "Popular Opus examples do not establish a universal Claude Code plus skill recipe. " : "热门 Opus 案例不能概括成统一的“Claude Code 加 skill”。"}<a href="https://x.com/kimmonismus/status/2102844654169575547">{en ? "The AI-history creator" : "AI 简史作者"}</a>{en ? " explicitly used Claude Code and Remotion; " : "明确使用 Claude Code 与 Remotion；"}<a href="https://x.com/deedydas/status/2103142971646652607">Deedy</a>{en ? " disclosed Manim, Kokoro and FFmpeg without naming a skill; " : "披露了 Manim、Kokoro、FFmpeg，但没有指明 skill；"}<a href="https://github.com/bilaldemirerr/opus-video-recipes">opus-video-recipes</a>{en ? " includes both Cursor and Claude Code workflows. A main prompt can initiate many model calls, tool runs and revisions." : "则同时包含 Cursor 与 Claude Code 工作流。一条主提示词仍可能触发大量模型调用、工具执行和迭代。"}</p>
      <ul className="mt-4">
        <li><a href="https://github.com/remotion-dev/skills">Remotion official skills</a> — {en ? "Official workflow guidance. A separate license for the skills repository was not established in this check; the framework has its own " : "官方工作流指导。本次未确认 skills 仓库的独立许可证；框架另有 "}<a href="https://github.com/remotion-dev/remotion/blob/main/LICENSE.md">Remotion License</a>{en ? " with free-eligibility and Company License terms. Do not label both as unrestricted MIT software." : "，区分免费资格和 Company License，不能将二者统称为无限制 MIT。"}</li>
        <li><a href="https://github.com/heygen-com/hyperframes">HyperFrames</a> — {en ? "HTML-based video production and rendering; its official repository declares Apache-2.0." : "基于 HTML 的视频制作与渲染，官方仓库声明 Apache-2.0。"}</li>
        <li><a href="https://github.com/bilaldemirerr/opus-video-recipes">opus-video-recipes</a> — {en ? "Recipes for prompts, timelines and rendering. Code and prompts are MIT; the Lovely app screens and demo photographs are explicitly excluded." : "提供提示、时间轴与渲染配方。代码和提示词采用 MIT；Lovely 应用界面和示例照片明确不在该许可内。"}</li>
        <li><a href="https://github.com/tuzhechen2005/opus-video-skills">opus-video-skills</a> — {en ? "Creator-published skills emphasizing scene intent, a shared cue timeline, contact sheets and motion strips. Referenced here for process design; these skills were not loaded in the historical Kimi runs." : "作者公开的制作 skills，强调镜头目的、共用时序、联系表与连续运动帧。这里用作流程设计参考，历史 Kimi 评测没有加载这些 skills。"}</li>
        <li><a href="https://github.com/ManimCommunity/manim">Manim Community</a> — {en ? "A code-driven framework for mathematical and explanatory animation, distributed under MIT." : "用代码制作数学与解释动画的框架，采用 MIT。"}</li>
        <li><a href="https://huggingface.co/hexgrad/Kokoro-82M">Kokoro-82M</a> — {en ? "The official model card declares Apache-2.0 weights, and the " : "官方模型卡声明权重采用 Apache-2.0，"}<a href="https://github.com/hexgrad/kokoro">{en ? "code repository" : "代码仓库"}</a>{en ? " also uses Apache-2.0. Record the exact model, voice source, version and audio hash." : "同样采用 Apache-2.0。具体模型、voice 来源、版本与音频哈希仍应逐项记录。"}</li>
      </ul>
      <p className="mt-4">{en ? "Knowledge videos now default to nonverbal, code-generated music and sound effects. On-screen labels and captions remain. " : "知识视频现默认使用代码生成的非语言配乐与音效，关闭口播旁白；画面文字和字幕保留。"}{hasPublicNarration && (en ? "The player offers the historical Kokoro narration as an explicit option; some sentences in that version were accelerated to fit fixed time windows. " : "播放器保留历史 Kokoro 旁白作为明确可选项；该版本曾将部分语句加速来适配固定时窗。")}{en ? "Original macOS voice tracks remain in the local archive. Changing the audio preserves the model's picture and its scientific errors; this is a playback revision, not a new model result. Future runs generate narration only when requested, measure its duration before freezing the timeline, and record the voice source and cost separately." : "原始 macOS 音色音轨仍保留在本地归档。此次换音保留模型原画面及科学错误，属于播放版本调整，不是模型重新得分。后续只有明确要求时才生成旁白，先测量语音时长再冻结时间轴，并单独记录音色来源与成本。"}</p>
      <p><a href="/evaluations/kimi-k3-1-pro-creative/audio-policy-v3/workflow-audit.md" download>{en ? "Workflow audit and original case sources" : "制作链路复核与原案例来源"}</a>{" · "}<a href="/evaluations/kimi-k3-1-pro-creative/audio-policy-v3/audio-revision-source.zip" download>{en ? "Nonverbal audio revision source and integrity audit" : "无口播版制作源码与一致性检查"}</a></p>
      <p><a href="/evaluations/kimi-k3-1-pro-creative/publication-audio-source.zip" download>{en ? "Historical narration pipeline source and pinned environment (weights excluded)" : "历史旁白管线源码与固定环境记录（不含权重）"}</a></p>
    </section>
</div>
</details>
</InfoPage>;
}
