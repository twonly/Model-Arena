import { Fragment, type ReactNode } from "react";
import Link from "next/link";
import { InfoPage, infoMetadata } from "@/components/InfoPage";
import { ArticleNavigation, type ArticleSection } from "@/components/ArticleNavigation";
import { JsonLd } from "@/components/JsonLd";
import { BRAND } from "@/lib/brand";
import { DEFAULT_LOCALE, localizedPath, normalizeLocale } from "@/lib/i18n";
import { enBlocks, FIGURE_FILES, ORIGINAL_URL_EN, ORIGINAL_URL_ZH, zhBlocks, type Block } from "./content";

const pathname = "/guides/manus-rebuild-manus-report";
const assetBase = "/guides/manus-rebuild-manus-report";
const published = "2026-10-31";
const modified = "2026-10-31";
type Props = { params: Promise<{ lang: string }> };

const ORIGINAL_TITLE_ZH = "用 Manus 重建 Manus：什么变了，什么出了问题，以及我们现在如何工作";
const ORIGINAL_TITLE_EN = "Rebuilding Manus with Manus: What changed, what broke, and how we work now";

const copy = {
  "zh-CN": {
    title: "动态图解：用 Manus 重建 Manus",
    description:
      "26 张动图讲清 Manus 联合创始人张涛的长文《用 Manus 重建 Manus》：Mono 给 Agent 全局上下文、bug 报告到验证修复的三 Agent 闭环、合并闸门、周末 200+ 项目的自主循环教训、PM 独立上线、市场部 AI 队友，以及还没做好的地方。人话转写，非速度榜实测。",
    keywords: [
      "用 Manus 重建 Manus",
      "Manus-mono",
      "Manus 2.0",
      "AI 原生组织",
      "human on the loop",
      "AI 队友",
      "动态图解",
    ],
    intro: "Tokrace 动态图解 · Manus 张涛长文的人话转写 · 26 张动图 · 非速度实测榜",
    sourceTitle: "原文与出处",
    relatedTitle: "站内相关阅读",
    figFallback: "若动画未播放，请用浏览器直接打开 SVG。",
  },
  en: {
    title: "Animated explainer: Rebuilding Manus with Manus",
    description:
      "26 animated diagrams walking through Manus co-founder Tao Zhang's essay “Rebuilding Manus with Manus”: Mono giving agents the whole picture, a three-agent loop from bug report to verified fix, the merge gate, the 200+ item weekend loop, PMs shipping on their own, an AI teammate in marketing, and what isn't working yet. Plain-language rewrite, not a Tokrace speed benchmark.",
    keywords: [
      "Rebuilding Manus with Manus",
      "Manus-mono",
      "Manus 2.0",
      "AI-native organization",
      "human on the loop",
      "AI teammate",
      "animated diagram",
    ],
    intro:
      "Tokrace animated explainer · plain-language rewrite of Tao Zhang's essay · 26 diagrams · not a speed benchmark",
    sourceTitle: "Original article and credits",
    relatedTitle: "Related reading on Tokrace",
    figFallback: "Open the SVG in a browser if the animation does not play.",
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

function Figure({ src, title, fallback }: { src: string; title: string; fallback: string }) {
  return (
    <figure className="mx-auto my-4 max-w-[677px] overflow-hidden rounded-md border border-line bg-[#FBF8F1]">
      <object
        type="image/svg+xml"
        data={src}
        title={title}
        aria-label={title}
        className="block w-full"
        style={{ aspectRatio: "750 / 720", minHeight: 280 }}
      >
        <p className="p-4 text-sm text-faint">{fallback}</p>
      </object>
    </figure>
  );
}

function renderBlock(b: Block, i: number, fallback: string): ReactNode {
  switch (b.t) {
    case "h2":
      return <h2 key={i} id={b.id} className="scroll-mt-6">{b.text}</h2>;
    case "h3":
      return <h3 key={i} className="mt-6 mb-2 text-[16px] font-bold text-ink">{b.text}</h3>;
    case "look":
      return <p key={i} className="text-[#8F887D]">{b.text}</p>;
    case "cap":
      return <p key={i} className="!mt-1 text-center text-[14px] font-bold text-ink">{inline(b.text)}</p>;
    case "p":
      return <p key={i}>{inline(b.text)}</p>;
    case "ul":
      return <ul key={i} className="mt-3">{b.items.map((it, j) => <li key={j}>{inline(it)}</li>)}</ul>;
    case "ol":
      return <ol key={i} className="mt-3 list-decimal space-y-2 pl-5">{b.items.map((it, j) => <li key={j}>{inline(it)}</li>)}</ol>;
    case "fig":
      return <Figure key={i} src={`${assetBase}/${b.src}`} title={b.alt} fallback={fallback} />;
  }
}

/** Group blocks into <section>s at each h2 so the article reads as chapters. */
function sections(blocks: Block[], fallback: string) {
  const groups: { id: string; nodes: ReactNode[] }[] = [{ id: "hook", nodes: [] }];
  blocks.forEach((b, i) => {
    if (b.t === "h2") groups.push({ id: `${b.id}-section`, nodes: [] });
    groups[groups.length - 1].nodes.push(renderBlock(b, i, fallback));
  });
  return groups.map(g => (
    <section key={g.id} id={g.id === "hook" ? "hook" : undefined} className="scroll-mt-6 [&_p+p]:mt-3">
      {g.nodes.map((n, j) => <Fragment key={j}>{n}</Fragment>)}
    </section>
  ));
}

export async function generateMetadata({ params }: Props) {
  const locale = normalizeLocale((await params).lang) ?? DEFAULT_LOCALE;
  const c = copy[locale === "en" ? "en" : "zh-CN"];
  return {
    ...infoMetadata(locale, pathname, c.title, c.description),
    keywords: [...c.keywords],
  };
}

export default async function ManusRebuildDiagramPage({ params }: Props) {
  const locale = normalizeLocale((await params).lang) ?? DEFAULT_LOCALE;
  const en = locale === "en";
  const c = copy[en ? "en" : "zh-CN"];
  const blocks = en ? enBlocks : zhBlocks;
  const url = BRAND.url + localizedPath(pathname, locale);
  const images = FIGURE_FILES.map(f => `${BRAND.url}${assetBase}/${f}`);
  const originalUrl = en ? ORIGINAL_URL_EN : ORIGINAL_URL_ZH;
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
          isBasedOn: {
            "@type": "BlogPosting",
            headline: en ? ORIGINAL_TITLE_EN : ORIGINAL_TITLE_ZH,
            url: originalUrl,
            author: { "@type": "Person", name: en ? "Tao Zhang" : "张涛", jobTitle: en ? "Co-founder and Chief Product Officer, Manus" : "Manus 联合创始人兼首席产品官" },
            publisher: { "@type": "Organization", name: "Manus", url: "https://manus.im" },
          },
          about: {
            "@type": "Thing",
            name: "Manus",
            description: en
              ? "How Manus's engineering, product and marketing teams work alongside agents by default"
              : "Manus 工程、产品、市场团队默认与 Agent 协作之后的工作方式",
          },
        }}
      />

      {sections(blocks, c.figFallback)}

      <section id="source" className="scroll-mt-6">
        <h2>{c.sourceTitle}</h2>
        <p>
          {en ? "Original: Tao Zhang, co-founder and Chief Product Officer of Manus, " : "原文：张涛（Manus 联合创始人兼首席产品官），"}
          <a href={originalUrl} target="_blank" rel="noopener noreferrer">
            {en ? `“${ORIGINAL_TITLE_EN}”` : `《${ORIGINAL_TITLE_ZH}》`}
          </a>
          {en ? " (Manus blog)." : "（Manus 博客）。"}
        </p>
        <p>
          {en ? "Also available in Chinese: " : "英文原版："}
          <a href={en ? ORIGINAL_URL_ZH : ORIGINAL_URL_EN} target="_blank" rel="noopener noreferrer">
            {en ? ORIGINAL_TITLE_ZH : ORIGINAL_TITLE_EN}
          </a>
          {en ? "." : "。"}
        </p>
        <p className="text-sm text-faint">
          {en
            ? "This page is Tokrace's plain-language rewrite with our own animated diagrams. Numbers come from the original essay, which notes they come from internal records, partly estimates or personal experience; the diagrams are illustrations, not new measurements."
            : "本页是 Tokrace 的人话转写，动图为本站自绘；数字均来自原文（原文说明来自内部记录，部分为估算或个人经验），图只做示意，不是新的实测。"}
        </p>
      </section>

      <section id="related" className="scroll-mt-6">
        <h2>{c.relatedTitle}</h2>
        <p>
          <Link href={localizedPath("/guides/deepseek-super-agent-diagram", locale)}>
            {en ? "Animated explainer: DeepSeek's Super-agent architecture" : "动态图解：DeepSeek 的 Super-agent 架构"}
          </Link>
          {" · "}
          <Link href={localizedPath("/arena", locale)}>{en ? "Arena" : "Arena 实测"}</Link>
          {" · "}
          <Link href={localizedPath("/method", locale)}>{en ? "Method" : "测试方法"}</Link>
        </p>
        <p className="text-sm text-faint">
          {en
            ? "This page explains a published essay about how Manus works internally. It does not replace timed model races or evaluate Manus as a product."
            : "本页只转述一篇公开长文里 Manus 的内部工作方式，不替代计时赛跑，也不是对 Manus 产品的评测。"}
        </p>
      </section>
    </InfoPage>
  );
}
