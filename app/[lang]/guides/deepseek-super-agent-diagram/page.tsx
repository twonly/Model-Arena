import { Fragment, type ReactNode } from "react";
import Link from "next/link";
import { InfoPage, infoMetadata } from "@/components/InfoPage";
import { ArticleNavigation, type ArticleSection } from "@/components/ArticleNavigation";
import { JsonLd } from "@/components/JsonLd";
import { BRAND } from "@/lib/brand";
import { DEFAULT_LOCALE, localizedPath, normalizeLocale } from "@/lib/i18n";
import { enBlocks, FIGURE_FILES, ORIGINAL_URL, PROTOTYPE_URL, zhBlocks, type Block } from "./content";

const pathname = "/guides/deepseek-super-agent-diagram";
const assetBase = "/guides/deepseek-super-agent-diagram";
const published = "2026-10-31";
const modified = "2026-10-31";
type Props = { params: Promise<{ lang: string }> };

const copy = {
  "zh-CN": {
    title: "动态图解：DeepSeek 的 Super-agent 架构",
    description:
      "31 张动图讲清 DeepSeek Harness 团队长文《Super-agent 设计探索》：Router/Worker 双层、Trigger 两级过滤与订阅直通、Inline/Spill 与链式召回、全双工交互、存算分离、Watchdog 和实验数字。人话转写，非速度榜实测。",
    keywords: [
      "DeepSeek Super-agent",
      "DeepSeek Harness",
      "Super-agent 设计探索",
      "Router Worker 双层架构",
      "Trigger 事件驱动",
      "链式召回",
      "动态图解",
    ],
    intro: "Tokrace 动态图解 · DeepSeek Harness 团队长文的人话转写 · 31 张动图 · 非速度实测榜",
    sourceTitle: "原文与出处",
    relatedTitle: "站内相关阅读",
    figFallback: "若动画未播放，请用浏览器直接打开 SVG。",
  },
  en: {
    title: "Animated explainer: DeepSeek's Super-agent architecture",
    description:
      "31 animated diagrams walking through the DeepSeek Harness team's essay “Exploring Super-agent Design”: Router/Worker layers, two-stage trigger filtering and subscription bypass, Inline/Spill and chain of recall, full-duplex interaction, compute-state-environment separation, Watchdog, and the experiment numbers. Plain-language rewrite, not a Tokrace speed benchmark.",
    keywords: [
      "DeepSeek Super-agent",
      "DeepSeek Harness",
      "Exploring Super-agent Design",
      "Router Worker architecture",
      "event-driven agent",
      "chain of recall",
      "animated diagram",
    ],
    intro:
      "Tokrace animated explainer · plain-language rewrite of the DeepSeek Harness team's essay · 31 diagrams · not a speed benchmark",
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
    case "table":
      return (
        <div key={i} className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-[13px]">
            <thead><tr>{b.head.map((h, j) => <th key={j} className="border-b border-line px-2 py-2 text-left font-bold text-ink">{h}</th>)}</tr></thead>
            <tbody>{b.rows.map((r, j) => <tr key={j}>{r.map((c, l) => <td key={l} className="border-b border-line px-2 py-2">{c}</td>)}</tr>)}</tbody>
          </table>
        </div>
      );
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

export default async function DeepSeekSuperAgentDiagramPage({ params }: Props) {
  const locale = normalizeLocale((await params).lang) ?? DEFAULT_LOCALE;
  const en = locale === "en";
  const c = copy[en ? "en" : "zh-CN"];
  const blocks = en ? enBlocks : zhBlocks;
  const url = BRAND.url + localizedPath(pathname, locale);
  const images = FIGURE_FILES.map(f => `${BRAND.url}${assetBase}/${f}`);
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
            "@type": "Article",
            headline: en
              ? "Exploring Super-agent Design: Towards a More Autonomous Agent System"
              : "Super-agent 设计探索：迈向更自主的 Agent 系统",
            url: ORIGINAL_URL,
            author: { "@type": "Organization", name: "DeepSeek Harness 团队" },
          },
          about: {
            "@type": "Thing",
            name: "DeepSeek Super-agent",
            description: en
              ? "Continuous, efficient, proactive, durable agent system architecture from the DeepSeek Harness team"
              : "DeepSeek Harness 团队提出的连续、高效、主动、持久的 Agent 系统架构",
          },
        }}
      />

      {sections(blocks, c.figFallback)}

      <section id="source" className="scroll-mt-6">
        <h2>{c.sourceTitle}</h2>
        <p>
          {en ? "Original: DeepSeek Harness team, " : "原文：DeepSeek Harness 团队，"}
          <a href={ORIGINAL_URL} target="_blank" rel="noopener noreferrer">
            {en
              ? "Exploring Super-agent Design: Towards a More Autonomous Agent System"
              : "《Super-agent 设计探索：迈向更自主的 Agent 系统》"}
          </a>
          {en ? " (published on the team's official WeChat account, in Chinese)." : "（DeepSeek Harness 团队微信公众号）。"}
        </p>
        <p>
          {en ? "Prototype repository: " : "原型仓库："}
          <a href={PROTOTYPE_URL} target="_blank" rel="noopener noreferrer">deepseek-ai/dsh-superagent-prototype</a>
          {en
            ? " — a research prototype for validation, not an official DeepSeek product."
            : "——验证技术路线用的研究原型，不是 DeepSeek 正式产品。"}
        </p>
        <p className="text-sm text-faint">
          {en
            ? "This page is Tokrace's plain-language rewrite with our own animated diagrams. Numbers come from the original essay; the diagrams are illustrations, not new measurements."
            : "本页是 Tokrace 的人话转写，动图为本站自绘；数字均来自原文，图只做示意，不是新的实测。"}
        </p>
      </section>

      <section id="related" className="scroll-mt-6">
        <h2>{c.relatedTitle}</h2>
        <p>
          <Link href={localizedPath("/guides/deepseek-v4-1-flash-1017", locale)}>
            {en ? "DeepSeek V4.1 Flash 1017 review" : "DeepSeek V4.1 Flash 1017 评测"}
          </Link>
          {" · "}
          <Link href={localizedPath("/model/deepseek-flash", locale)}>
            {en ? "deepseek-flash model page" : "deepseek-flash 模型页"}
          </Link>
          {" · "}
          <Link href={localizedPath("/arena", locale)}>{en ? "Arena" : "Arena 实测"}</Link>
          {" · "}
          <Link href={localizedPath("/method", locale)}>{en ? "Method" : "测试方法"}</Link>
        </p>
        <p className="text-sm text-faint">
          {en
            ? "This page explains architecture ideas from a published essay. It does not replace timed model races or claim Super-agent is a released product."
            : "本页只讲公开长文里的架构思路，不替代计时赛跑，也不宣称 Super-agent 已成正式产品。"}
        </p>
      </section>
    </InfoPage>
  );
}
