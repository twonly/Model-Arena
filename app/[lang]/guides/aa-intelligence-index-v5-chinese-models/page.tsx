import { Fragment, type ReactNode } from "react";
import Link from "next/link";
import { InfoPage, infoMetadata } from "@/components/InfoPage";
import { ArticleNavigation, type ArticleSection } from "@/components/ArticleNavigation";
import { JsonLd } from "@/components/JsonLd";
import { BRAND } from "@/lib/brand";
import { DEFAULT_LOCALE, localizedPath, normalizeLocale } from "@/lib/i18n";
import { AA_V5_URL, enBlocks, FIGURE_FILES, zhBlocks, type Block } from "./content";
import { SVG_EN, SVG_ZH } from "./figures";

const pathname = "/guides/aa-intelligence-index-v5-chinese-models";
const assetBase = "/guides/aa-intelligence-index-v5-chinese-models";
const published = "2026-11-01";
const modified = "2026-11-01";
type Props = { params: Promise<{ lang: string }> };

const copy = {
  "zh-CN": {
    title: "换了张考卷，国产模型掉了 13 分：AA v5 的 17 个事实",
    description:
      "Artificial Analysis Intelligence Index v5 删掉 25%、新增 30% 题目，60% 改为私有题。77 个模型里只有 8 个涨分，国产平均 -12.4、其他 -6.8。17 个事实拆解：Terminal-Bench-Science、HLE-Diamond、被删的 GDPval/AA-LCR/SciCode、Gemini 4 Carbon 无公开 API、单题成本与推理档位。",
    keywords: [
      "Artificial Analysis Intelligence Index v5",
      "AA v5",
      "国产大模型排名",
      "Terminal-Bench-Science",
      "HLE-Diamond",
      "Gemini 4 Carbon",
      "DeepSeek V4.1 Flash",
      "Kimi K3.1 Pro",
      "开源模型差距",
    ],
    intro: "Tokrace 小数据 · 17 个事实 · 11 张图 · 数据来自 Artificial Analysis",
    sourceTitle: "资料来源",
    relatedTitle: "站内相关阅读",
    shotAlt: "X 帖子截图",
  },
  en: {
    title: "New exam, 13 points lost: 17 facts about AA Intelligence Index v5",
    description:
      "Artificial Analysis Intelligence Index v5 removed 25% of the old tests, added 30% new ones and put 60% of the weight on private questions. Only 8 of 77 entries gained; Chinese models averaged -12.4 vs -6.8 for the rest. 17 facts on Terminal-Bench-Science, HLE-Diamond, the removed GDPval/AA-LCR/SciCode, Gemini 4 Carbon's missing API, cost per task and reasoning effort.",
    keywords: [
      "Artificial Analysis Intelligence Index v5",
      "AA v5",
      "Chinese AI models ranking",
      "Terminal-Bench-Science",
      "HLE-Diamond",
      "Gemini 4 Carbon",
      "DeepSeek V4.1 Flash",
      "Kimi K3.1 Pro",
      "open weights gap",
    ],
    intro: "Tokrace Data · 17 facts · 11 charts · data from Artificial Analysis",
    sourceTitle: "Sources",
    relatedTitle: "Related reading on Tokrace",
    shotAlt: "Screenshot of an X post",
  },
} as const;

/** Inline markdown subset used by the article: **bold**, `code`, [text](url). */
function inline(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /\*\*(.+?)\*\*|`([^`]+)`|\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[1]) out.push(<strong key={k++} className="font-bold text-ink">{m[1]}</strong>);
    else if (m[2]) out.push(<code key={k++} className="rounded bg-[#EFE7D8] px-1 py-0.5 text-[13px] text-ink">{m[2]}</code>);
    else out.push(<a key={k++} href={m[4]} target="_blank" rel="noopener noreferrer">{m[3]}</a>);
    last = re.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

/** Chart SVGs are inlined (no id/class/style/script), so SMIL animation plays without an extra request. */
function Chart({ svg, alt }: { svg: string; alt: string }) {
  return (
    <figure
      role="img"
      aria-label={alt}
      className="mx-auto my-5 max-w-[677px] overflow-hidden rounded-md border border-[#D9D0BC] bg-[#F6F3E8] leading-[0] [&_svg]:block [&_svg]:h-auto [&_svg]:w-full"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

function Shot({ src, w, h, cap, alt }: { src: string; w: number; h: number; cap: string; alt: string }) {
  return (
    <figure className="mx-auto my-5 max-w-[480px]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`${assetBase}/x/${src}`}
        width={w}
        height={h}
        alt={alt}
        loading="lazy"
        className="block h-auto w-full rounded-md border border-[#D9D0BC] bg-white"
      />
      <figcaption className="mt-2 text-center text-[13px] text-faint">{inline(cap)}</figcaption>
    </figure>
  );
}

function renderBlock(b: Block, i: number, en: boolean, shotAlt: string): ReactNode {
  switch (b.t) {
    case "h2":
      return <h2 key={i} id={b.id} className="scroll-mt-6">{b.text}</h2>;
    case "p":
      return <p key={i}>{inline(b.text)}</p>;
    case "end":
      return <p key={i} className="!mt-8 border-t border-line pt-6 text-[18px] font-bold text-ink">{inline(b.text)}</p>;
    case "note":
      return <p key={i} className="!mt-6 text-sm text-faint">{inline(b.text)}</p>;
    case "fig":
      return <Chart key={i} svg={(en ? SVG_EN : SVG_ZH)[b.src]} alt={b.alt} />;
    case "shot":
      return <Shot key={i} src={b.src} w={b.w} h={b.h} cap={b.cap} alt={`${shotAlt}: ${b.cap.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")}`} />;
  }
}

/** Group blocks into <section>s at each h2 so the article reads as chapters. */
function sections(blocks: Block[], en: boolean, shotAlt: string) {
  const groups: { id: string; nodes: ReactNode[] }[] = [{ id: "hook", nodes: [] }];
  blocks.forEach((b, i) => {
    if (b.t === "h2") groups.push({ id: `${b.id}-section`, nodes: [] });
    groups[groups.length - 1].nodes.push(renderBlock(b, i, en, shotAlt));
  });
  return groups.map(g => (
    <section key={g.id} id={g.id === "hook" ? "hook" : undefined} className="scroll-mt-6 [&_p+p]:mt-3">
      {g.nodes.map((n, j) => <Fragment key={j}>{n}</Fragment>)}
    </section>
  ));
}

export async function generateMetadata({ params }: Props) {
  const locale = normalizeLocale((await params).lang) ?? DEFAULT_LOCALE;
  const en = locale === "en";
  const c = copy[en ? "en" : "zh-CN"];
  const base = infoMetadata(locale, pathname, c.title, c.description);
  const image = { url: `${assetBase}/f02_slope${en ? ".en" : ""}.png`, width: 1080, height: 1620, alt: c.title };
  return {
    ...base,
    keywords: [...c.keywords],
    openGraph: { ...base.openGraph, type: "article", images: [image] },
    twitter: { ...base.twitter, images: [image.url] },
  };
}

export default async function AaIntelligenceIndexV5Page({ params }: Props) {
  const locale = normalizeLocale((await params).lang) ?? DEFAULT_LOCALE;
  const en = locale === "en";
  const c = copy[en ? "en" : "zh-CN"];
  const blocks = en ? enBlocks : zhBlocks;
  const url = BRAND.url + localizedPath(pathname, locale);
  const images = FIGURE_FILES.map(f => `${BRAND.url}${assetBase}/${en ? f.replace(/\.png$/, ".en.png") : f}`);
  const nav: ArticleSection[] = [
    { id: "hook", label: en ? "Opening" : "开篇" },
    ...blocks.flatMap(b => (b.t === "h2" ? [{ id: b.id, label: b.text }] : [])),
    { id: "source", label: c.sourceTitle },
    { id: "related", label: c.relatedTitle },
  ];

  return (
    <InfoPage
      locale={locale}
      pathname={pathname}
      title={c.title}
      intro={c.intro}
      updatedAt={modified}
      sidebar={<ArticleNavigation sections={nav} en={en} />}
    >
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "TechArticle",
          "@id": url + "#article",
          headline: c.title,
          description: c.description,
          datePublished: published,
          dateModified: modified,
          inLanguage: locale,
          mainEntityOfPage: url,
          url,
          keywords: c.keywords.join(", "),
          author: { "@type": "Organization", name: BRAND.publisher, url: BRAND.url },
          publisher: { "@type": "Organization", name: BRAND.publisher, url: BRAND.url },
          image: images,
          citation: {
            "@type": "Article",
            headline: "Artificial Analysis Intelligence Index v5",
            url: AA_V5_URL,
            publisher: { "@type": "Organization", name: "Artificial Analysis", url: "https://artificialanalysis.ai" },
          },
          about: { "@type": "Thing", name: "Artificial Analysis Intelligence Index v5" },
        }}
      />

      {sections(blocks, en, c.shotAlt)}

      <section id="source" className="scroll-mt-6">
        <h2>{c.sourceTitle}</h2>
        <ul className="mt-3">
          <li><a href={AA_V5_URL} target="_blank" rel="noopener noreferrer">{en ? "Artificial Analysis: Intelligence Index v5 launch article" : "Artificial Analysis：Intelligence Index v5 发布文章"}</a></li>
          <li><a href="https://artificialanalysis.ai/methodology/intelligence-benchmarking" target="_blank" rel="noopener noreferrer">{en ? "Artificial Analysis: Intelligence Index methodology" : "Artificial Analysis：Intelligence Index 方法论"}</a></li>
          <li><a href="https://artificialanalysis.ai/leaderboards/models" target="_blank" rel="noopener noreferrer">{en ? "Artificial Analysis: model leaderboard (v5)" : "Artificial Analysis：模型排行榜（v5）"}</a></li>
          <li><a href="https://web.archive.org/web/20261026010237/https://artificialanalysis.ai/leaderboards/models" target="_blank" rel="noopener noreferrer">{en ? "Wayback Machine: leaderboard on v4.3.2, 2026-10-26" : "Wayback 存档：v4.3.2 排行榜（2026-10-26）"}</a></li>
          <li><a href="https://artificialanalysis.ai/articles/gemini-4-carbon-new-number-1" target="_blank" rel="noopener noreferrer">{en ? "Artificial Analysis: Gemini 4 Carbon is the new #1" : "Artificial Analysis：Gemini 4 Carbon 登顶"}</a></li>
          <li><a href="https://x.com/ArtificialAnlys/status/2116319506318635503" target="_blank" rel="noopener noreferrer">{en ? "Artificial Analysis on X: AA-Omniscience v1.1" : "Artificial Analysis X 帖：AA-Omniscience v1.1"}</a></li>
          <li><a href="https://www.interconnects.ai/p/artificial-analysis-v5-and-the-benchmarkers" target="_blank" rel="noopener noreferrer">{en ? "Nathan Lambert, Interconnects: Artificial Analysis v5 and the benchmarker's dilemma" : "Nathan Lambert（Interconnects）：Artificial Analysis v5 and the benchmarker's dilemma"}</a></li>
        </ul>
      </section>

      <section id="related" className="scroll-mt-6">
        <h2>{c.relatedTitle}</h2>
        <p>
          <Link href={localizedPath("/guides/deepseek-v4-1-flash-1017", locale)}>
            {en ? "DeepSeek V4.1 Flash 1017 review" : "DeepSeek V4.1 Flash 1017 实测"}
          </Link>
          {" · "}
          <Link href={localizedPath("/guides/kimi-k3-1-pro", locale)}>{en ? "Kimi K3.1 Pro review" : "Kimi K3.1 Pro 实测"}</Link>
          {" · "}
          <Link href={localizedPath("/guides/minimax-m3-1-flash", locale)}>{en ? "MiniMax-M3.1-Flash review" : "MiniMax-M3.1-Flash 实测"}</Link>
          {" · "}
          <Link href={localizedPath("/arena", locale)}>{en ? "Arena" : "Arena 实测"}</Link>
        </p>
      </section>
    </InfoPage>
  );
}
