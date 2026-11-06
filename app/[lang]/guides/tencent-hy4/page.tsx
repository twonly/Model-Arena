import Link from "next/link";
import { InfoPage, infoMetadata } from "@/components/InfoPage";
import { JsonLd } from "@/components/JsonLd";
import { Markdown } from "@/components/Markdown";
import { BRAND } from "@/lib/brand";
import { DEFAULT_LOCALE, localizedPath, normalizeLocale } from "@/lib/i18n";
import report from "@/public/articles/tencent-hy4-release/article.json";
import assets from "@/public/articles/tencent-hy4-release/manifest.json";
import historical from "@/public/articles/tencent-hy4/source-manifest.json";

const pathname = "/guides/tencent-hy4";
const socialImage = "/articles/tencent-hy4-release/social-card.png";
type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props) {
  const locale = normalizeLocale((await params).lang) ?? DEFAULT_LOCALE;
  const en = locale === "en";
  const title = en ? report.titleEn : report.titleZh;
  const description = en ? report.summaryEn : report.summaryZh;
  const metadata = infoMetadata(locale, pathname, title, description);
  const images = [{ url: socialImage, width: 1200, height: 630, alt: en ? "Tencent Hy4 launch: vision, computer use and official benchmarks" : "腾讯 Hy4 正式发布：视觉、电脑操作与官方 Benchmark" }];
  return {
    ...metadata,
    title: { absolute: `${title} | TOKRACE` },
    keywords: ["腾讯混元 Hy4", "Tencent Hy4", "Hy4 Benchmark", "Hy4 API 价格", "Computer Use", "视觉理解", "Hy4 正式版", "Hy4 Preview"],
    openGraph: { ...metadata.openGraph, type: "article", publishedTime: report.publishedAt, modifiedTime: report.updatedAt, images },
    twitter: { ...metadata.twitter, images: [socialImage] },
  };
}

export default async function Hy4Launch({ params }: Props) {
  const locale = normalizeLocale((await params).lang) ?? DEFAULT_LOCALE;
  const en = locale === "en";
  const title = en ? report.titleEn : report.titleZh;
  const description = en ? report.summaryEn : report.summaryZh;
  const url = BRAND.url + localizedPath(pathname, locale);
  return (
    <InfoPage locale={locale} pathname={pathname} title={title} intro={description} updatedAt={report.date}>
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "NewsArticle", "@id": url + "#article",
        headline: title, description, inLanguage: locale, url, mainEntityOfPage: url,
        datePublished: report.publishedAt, dateModified: report.updatedAt,
        image: report.images.map(path => BRAND.url + path),
        author: { "@type": "Organization", name: BRAND.publisher, url: BRAND.url },
        publisher: { "@type": "Organization", name: BRAND.publisher, url: BRAND.url },
        citation: report.sources.map(source => source.url),
        about: { "@type": "Thing", name: "Tencent Hy4" },
        video: {
          "@type": "VideoObject", name: report.video.titleEn,
          description: en ? report.video.descriptionEn : report.video.descriptionZh,
          thumbnailUrl: BRAND.url + report.video.posterPath,
          uploadDate: report.video.uploadDate, duration: report.video.duration,
          contentUrl: BRAND.url + report.video.path,
          creditText: "Tencent Hy / 腾讯混元", isAccessibleForFree: true,
        },
      }} />
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "TOKRACE", item: BRAND.url + localizedPath("/", locale) },
          { "@type": "ListItem", position: 2, name: en ? "Model news and reports" : "模型动态与报告", item: BRAND.url + localizedPath("/reports", locale) },
          { "@type": "ListItem", position: 3, name: title, item: url },
        ],
      }} />
      <p className="text-xs">{en ? "TOKRACE launch analysis · November 4, 2026 · Updated from our November 3 preview." : "TOKRACE 发布解读 · 2026 年 11 月 4 日 · 由 11 月 3 日预告稿更新。"}</p>
      <nav aria-label={en ? "Article sections" : "文章目录"} className="flex flex-wrap gap-x-5 gap-y-2 rounded-xl border border-line bg-card p-4 text-xs">
        <a href="#vision">{en ? "What changed" : "发布变化"}</a><a href="#launch-film">{en ? "Launch film" : "新宣传片"}</a><a href="#benchmarks">Benchmark</a><a href="#limits">{en ? "Remaining gaps" : "能力差距"}</a><a href="#access">{en ? "Access and pricing" : "入口与价格"}</a><a href="#appendix">{en ? "Full results" : "完整成绩"}</a>
      </nav>
      {report.editorial[locale].map((section, index) => {
        const figure = "figureId" in section ? assets.images.find(image => image.id === section.figureId) : undefined;
        return (
          <section key={section.id} id={section.id} className="scroll-mt-6">
            <h2>{section.title}</h2>
            <div className="overflow-x-auto [&_th]:whitespace-nowrap"><Markdown text={section.body} /></div>
            {figure && <figure className="mt-5">
              <a href={figure.path} target="_blank" rel="noreferrer"><img src={figure.webPreviewPath} width={figure.width} height={figure.height} alt={en ? figure.altEn : figure.altZh} loading="lazy" className="h-auto w-full rounded-lg border border-line bg-white" /></a>
              <figcaption className="mt-2 text-xs">{en ? figure.titleEn : figure.titleZh}{" · "}{figure.credit}{" · "}<a href={figure.path} target="_blank" rel="noreferrer">{en ? "Open the complete original" : "查看完整原图"}</a>{" · "}<a href={figure.sourcePage} target="_blank" rel="noreferrer">{en ? "Official source" : "官方来源"}</a>{en ? ". WebP preview; original chart, legend and notes are preserved." : "。页面使用 WebP 预览，原图保留完整图表、图例与脚注。"}</figcaption>
            </figure>}
            {index === 0 && <div id="launch-film" className="mt-8 scroll-mt-6">
              <h2>{en ? "Watch the new official launch film" : "新宣传片：从看见，到操作与交付"}</h2>
              <video controls playsInline preload="metadata" poster={report.video.posterPath} width={report.video.width} height={report.video.height} className="aspect-video w-full rounded-xl bg-black" aria-label={en ? "New official Tencent Hy4 launch film" : "腾讯 Hy4 正式发布新宣传片"}>
                <source src={report.video.path} type="video/mp4" /><a href={report.video.path}>{en ? "Open MP4" : "打开 MP4"}</a>
              </video>
              <p className="mt-2 text-xs">{en ? "Tencent AI / Tencent Hy · Official 720p version · approximately 70 seconds. " : "Tencent AI / 腾讯混元 · 官方 720p 版本 · 约 70 秒。"}<a href={report.video.path} download>{en ? "Download MP4" : "下载 MP4"}</a>{" · "}<a href={assets.video.sourcePost} target="_blank" rel="noreferrer">{en ? "Official post ↗" : "官方原帖 ↗"}</a></p>
              <p className="mt-3">{en ? "The new film moves through visual tasks, game imagery, Blender modeling, office context and research demonstrations. These are official selected examples, distinct from the benchmarks and from TOKRACE's own model evaluations." : "新片依次展示视觉任务、游戏画面、Blender 建模、办公上下文与科研演示。这些是官方选取的展示案例，和下方 benchmark、本站自主任务评测分别对应不同证据。"}</p>
            </div>}
          </section>
        );
      })}
      <section className="border-t border-line pt-6 text-xs">
        <h2>{en ? "Sources and original files" : "来源与原始素材"}</h2>
        <ol className="list-decimal space-y-2 pl-5">{report.sources.map(source => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{en ? source.titleEn : source.titleZh}</a></li>)}</ol>
        <p className="mt-4"><a href="/articles/tencent-hy4-release/manifest.json">{en ? "Official asset sources, dimensions and SHA-256 hashes" : "官方素材来源、尺寸与 SHA-256 哈希"}</a>{" · "}<Link href={localizedPath("/reports", locale)}>{en ? "More model reports" : "更多模型报告"}</Link></p>
        <details className="mt-5 rounded-lg border border-line p-4"><summary className="cursor-pointer">{en ? "November 3: the earlier 40-second teaser" : "11 月 3 日：此前的 40 秒预热片"}</summary><p className="mt-3">{en ? "The previous teaser is retained as historical material. This page now covers the November 4 general release." : "此前预热片作为历史素材保留；本文已更新为 11 月 4 日正式发布信息。"}</p><a href={historical.teaser.videoPath}>{en ? "Open the earlier teaser MP4" : "打开此前预热片 MP4"}</a>{" · "}<a href={historical.teaser.postUrl}>{en ? "Original post" : "原帖"}</a></details>
      </section>
    </InfoPage>
  );
}
