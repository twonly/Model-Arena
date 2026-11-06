import { REVIEW_PRESENTATION_UPDATED_AT } from "@/lib/model-review-presentation";
import Link from "next/link";
import { Fragment } from "react";
import { VisualEvaluation } from "@/components/VisualEvaluation";
import supplement from "@/public/evaluations/minimax-m3-1-flash-supplement.json";
import visuals from "@/public/evaluations/minimax-m3-1-flash-visual.json";
import { InfoPage, infoMetadata } from "@/components/InfoPage";
import { JsonLd } from "@/components/JsonLd";
import { Markdown } from "@/components/Markdown";
import { RerunButton } from "@/components/RerunButton";
import { BRAND } from "@/lib/brand";
import { DEFAULT_LOCALE, localizedPath, normalizeLocale } from "@/lib/i18n";
import { DATASET_LICENSE_URL } from "@/lib/structured-data";
import review from "@/public/evaluations/minimax-m3-1-flash.json";

const pathname = "/guides/minimax-m3-1-flash";
const evidencePath = "/evaluations/minimax-m3-1-flash.json";
const updatedAt = "2026-10-24";
type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props) {
  const locale = normalizeLocale((await params).lang) ?? DEFAULT_LOCALE;
  const article = review.editorial[locale];
  const title = locale === "en" ? supplement.publication.titleEn : supplement.publication.titleZh;
  const summary = locale === "en" ? supplement.publication.summaryEn : supplement.publication.summaryZh;
  const metadata = infoMetadata(locale, pathname, title, summary);
  return {
    ...metadata,
    openGraph: { ...metadata.openGraph, type: "article", publishedTime: review.publishedAt, modifiedTime: REVIEW_PRESENTATION_UPDATED_AT},
  };
}

export default async function Review({ params }: Props) {
  const locale = normalizeLocale((await params).lang) ?? DEFAULT_LOCALE;
  const en = locale === "en", article = review.editorial[locale];
  const url = BRAND.url + localizedPath(pathname, locale);
  const title = en ? supplement.publication.titleEn : supplement.publication.titleZh;
  const summary = en ? supplement.publication.summaryEn : supplement.publication.summaryZh;
  return (
    <InfoPage locale={locale} pathname={pathname} title={title} intro={summary} updatedAt={updatedAt}>
<JsonLd data={{
        "@context": "https://schema.org", "@type": "TechArticle", "@id": url + "#article",
        headline: title, description: summary, inLanguage: locale,
        datePublished: review.publishedAt, dateModified: updatedAt,
        author: { "@type": "Organization", name: BRAND.publisher, url: BRAND.url },
        publisher: { "@type": "Organization", name: BRAND.publisher, url: BRAND.url },
        mainEntityOfPage: url, url,
        citation: [...review.sources.map((source) => source.url), "https://simonwillison.net/2024/Oct/25/pelicans-on-a-bicycle/"],
        image: [...new Set([...visuals.attempts.filter(a => a.pngPath).map(a => BRAND.url + a.pngPath), ...supplement.groups.flatMap(g => g.samples.flatMap(a => "pngPath" in a && typeof a.pngPath === "string" ? [BRAND.url + a.pngPath] : []))])],
        about: { "@type": "SoftwareApplication", name: review.version, applicationCategory: "AI model" },
      }} />
<JsonLd data={{
        "@context": "https://schema.org", "@type": "Dataset", "@id": url + "#dataset",
        name: "MiniMax M3.1 Flash: 40 paired text attempts and 6 coding attempts",
        description: article.summary, license: DATASET_LICENSE_URL, url: url + "#evidence",
        creator: { "@type": "Organization", name: BRAND.publisher },
        dateModified: review.publishedAt,
        variableMeasured: ["Predetermined task pass", "Time to first content (ms)", "API token usage", "Predetermined code checks"],
        distribution: { "@type": "DataDownload", encodingFormat: "application/json", contentUrl: BRAND.url + evidencePath },
      }} />
<JsonLd data={{
        "@context": "https://schema.org", "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "TOKRACE", item: BRAND.url + localizedPath("/", locale) },
          { "@type": "ListItem", position: 2, name: en ? "Reports" : "实测报告", item: BRAND.url + localizedPath("/reports", locale) },
          { "@type": "ListItem", position: 3, name: title, item: url },
        ],
      }} />
<VisualEvaluation data={visuals} locale={locale} supplement={supplement} />
<details id="review-details" className="scroll-mt-6 rounded-xl border border-line bg-card p-5">
<summary className="cursor-pointer font-bold text-ink">{en ? "Test details, original answers and sources" : "测试详情、原始回答与来源"}</summary>
<div className="mt-5 space-y-7">
<p>{en ? "Original testing and analysis by TOKRACE · First tests: October 20; supplemental tests: October 21, 2026." : "TOKRACE 原创测试与分析 · 首轮实测：2026 年 10 月 20 日；补测：10 月 21 日。"}</p>
<aside className="rounded-lg border border-line bg-card p-5">
        <h2>{en ? "October 24 update: public weights have a separate release page" : "10 月 24 日更新：公开权重另设资料页"}</h2>
        <p>{en ? "MiniMax's downloadable M3.1 Flash weights are now public. This page retains the October 20–21 hosted-API tests and the specifications checked at that time. The historical statement that weights were pending is superseded by the release note below. No local-weight test or API/checkpoint equivalence is established by this update." : "MiniMax M3.1 Flash 权重现已公开。本页保留 10 月 20–21 日托管 API 的实测与当时核验的规格；正文“权重后续提供”的历史记录，请结合下方的新发布资料阅读。本次更新未新增本地权重测试，也未确认它与当时 API checkpoint 完全相同。"}</p>
        <p><Link href={localizedPath("/guides/minimax-m3-1-flash-open-weights", locale)}>{en ? "Read the open-weight release, downloads and version differences →" : "查看权重公开、下载入口与版本区别 →"}</Link></p>
      </aside>

<RerunButton locale={locale} label={en ? "Free trial: rerun the first task with default thinking" : "免费复测第一题（默认 max 档）"} seed={{
        mode: "report", prompt: review.attempts[0].prompt, params: review.params,
        task: { caseId: review.attempts[0].id, version: review.suiteVersion },
        endpointRefs: [{ model: review.model, provider: review.endpoint, name: "MiniMax M3.1 Flash", extraBody: JSON.stringify({ reasoning_split: true }) }],
      }} />
<section id="evidence" aria-label={en ? "Original evidence" : "原始证据"}>
        <h2>{en ? "Original prompts, answers and checks" : "原题、原始回答与代码检查"}</h2>
        <p><Link href={evidencePath}>{en ? "Download all 46 attempts (JSON)" : "下载全部 46 次请求记录（JSON）"}</Link></p>
        {review.attempts.map((a) => (
          <details id={`evidence-${a.id}-${a.mode}`} key={`${a.id}-${a.mode}`} className="mb-3 rounded border border-line p-4">
            <summary className="cursor-pointer">{en ? a.titleEn : a.title} · {a.mode === "default" ? (en ? "Default max effort" : "默认 max 档") : (en ? "Low effort" : "低思考档")} · {a.pass ? (en ? "Passed" : "通过") : (en ? "Not passed" : "未通过")}</summary>
            <p>{a.startedAt} · {en ? "Total time" : "总耗时"}：{(a.totalMs / 1000).toFixed(3)}s · {en ? "First content" : "正文首响"}：{a.firstContentMs == null ? "—" : `${(a.firstContentMs / 1000).toFixed(3)}s`} · {en ? "Input / total completion / reasoning tokens" : "输入 / 总输出 / 思考 token"}：{a.promptTokens ?? "—"} / {a.outputTokens ?? "—"} / {a.reasoningTokens ?? "—"} · {en ? "Finish reason" : "结束原因"}：{a.finishReason ?? a.status}</p>
            <h3>{en ? "Prompt" : "题目"}</h3>
            <pre className="overflow-auto whitespace-pre-wrap break-words">{a.prompt}</pre>
            <h3>{en ? "Original answer" : "原始回答"}</h3>
            <pre className="overflow-auto whitespace-pre-wrap break-words">{a.text}</pre>
            {a.error && <p>{a.error}</p>}
          </details>
        ))}
        {review.coding.map((a) => (
          <details id={`evidence-${a.id}-${a.mode}`} key={`${a.id}-${a.mode}`} className="mb-3 rounded border border-line p-4">
            <summary className="cursor-pointer">{en ? a.titleEn : a.title} · {a.mode === "default" ? (en ? "Default max effort" : "默认 max 档") : (en ? "Low effort" : "低思考档")} · {a.status === "truncated" ? (en ? "Truncated; checks not run" : "输出截断，未执行检查") : a.pass ? (en ? "Passed" : "通过") : (en ? "Not passed" : "未通过")} · {a.checkCount} {en ? "planned checks" : "项预定检查"}</summary>
            <p>{a.startedAt} · {en ? "Total time" : "总耗时"}：{(a.totalMs / 1000).toFixed(3)}s · {en ? "First content" : "正文首响"}：{a.firstContentMs == null ? "—" : `${(a.firstContentMs / 1000).toFixed(3)}s`} · {en ? "Finish reason" : "结束原因"}：{a.finishReason ?? a.status}</p>
            <p>{en ? "Input / total completion / reasoning tokens" : "输入 / 总输出 / 思考 token"}：{a.promptTokens ?? "—"} / {a.outputTokens ?? "—"} / {a.reasoningTokens ?? "—"}</p>
            <h3>{en ? "Prompt" : "题目"}</h3>
            <pre className="overflow-auto whitespace-pre-wrap break-words">{a.prompt}</pre>
            <h3>{en ? "Original code" : "原始代码"}</h3>
            <pre className="overflow-auto whitespace-pre-wrap break-words">{a.text}</pre>
            <h3>{en ? "Executable checks" : "可执行检查"}</h3>
            <pre className="overflow-auto whitespace-pre-wrap break-words">{a.checks}</pre>
            {a.checkError && <p>{a.checkError}</p>}
          </details>
        ))}
      </section>
</div>
</details>
</InfoPage>
  );
}
