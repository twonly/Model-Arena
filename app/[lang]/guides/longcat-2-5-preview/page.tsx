import { REVIEW_PRESENTATION_UPDATED_AT } from "@/lib/model-review-presentation";
import Link from "next/link";
import { Fragment } from "react";
import { VisualEvaluation } from "@/components/VisualEvaluation";
import supplement from "@/public/evaluations/longcat-2-5-preview-supplement.json";
import visuals from "@/public/evaluations/longcat-2-5-preview-visual.json";
import { InfoPage, infoMetadata } from "@/components/InfoPage";
import { JsonLd } from "@/components/JsonLd";
import { Markdown } from "@/components/Markdown";
import { RerunButton } from "@/components/RerunButton";
import { BRAND } from "@/lib/brand";
import { DEFAULT_LOCALE, localizedPath, normalizeLocale } from "@/lib/i18n";
import { DATASET_LICENSE_URL } from "@/lib/structured-data";
import review from "@/public/evaluations/longcat-2-5-preview.json";

const pathname = "/guides/longcat-2-5-preview";
const evidencePath = "/evaluations/longcat-2-5-preview.json";
const modifiedAt = "2026-10-26T16:00:41Z";
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
  const en = locale === "en";
  const originalArticle = review.editorial[locale];
  // Update current specifications without changing archived October 10 responses.
  const article = { ...originalArticle, sections: originalArticle.sections.map(section => ({
    ...section, body: section.body.replace(
      en ? "The [quick-start guide](https://longcat.ai/platform/docs/zh/) lists 1M context, 128K maximum output" : "[快速开始](https://longcat.ai/platform/docs/zh/)列出 1M 上下文和 128K 输出上限",
      en ? "The [parameter reference](https://longcat.ai/platform/docs/zh/api/model-params), checked October 21, lists 1M context and 256K maximum output (the archived October 10 review recorded 128K)" : "10 月 21 日核查的[官方参数页](https://longcat.ai/platform/docs/zh/api/model-params)列出 1M 上下文和 256K 输出上限（10 月 10 日存档中的 128K 为历史记录）"
    )
  })) };
  const url = BRAND.url + localizedPath(pathname, locale);
  const title = en ? supplement.publication.titleEn : supplement.publication.titleZh;
  const summary = en ? supplement.publication.summaryEn : supplement.publication.summaryZh;
  return (
    <InfoPage locale={locale} pathname={pathname} title={title} intro={summary} updatedAt="2026-10-27">
<JsonLd data={{
        "@context": "https://schema.org", "@type": "TechArticle", "@id": url + "#article",
        headline: title, description: summary, inLanguage: locale,
        datePublished: review.publishedAt, dateModified: modifiedAt,
        author: { "@type": "Organization", name: BRAND.publisher, url: BRAND.url },
        publisher: { "@type": "Organization", name: BRAND.publisher, url: BRAND.url },
        mainEntityOfPage: url, url,
        citation: [...review.sources.map((source) => source.url), ...visuals.officialSources.map(s => s.url), "https://simonwillison.net/2024/Oct/25/pelicans-on-a-bicycle/"],
        image: [...new Set([...visuals.attempts.filter(a => a.pngPath).map(a => BRAND.url + a.pngPath), ...supplement.groups.flatMap(g => g.samples.flatMap(a => "pngPath" in a && typeof a.pngPath === "string" ? [BRAND.url + a.pngPath] : []))])],
        about: { "@type": "SoftwareApplication", name: review.model, applicationCategory: "AI model" },
      }} />
<JsonLd data={{
        "@context": "https://schema.org", "@type": "Dataset", "@id": url + "#dataset",
        name: "LongCat 2.5 Preview: 30 paired text attempts and 3 coding attempts",
        description: article.summary, license: DATASET_LICENSE_URL, url: url + "#evidence",
        creator: { "@type": "Organization", name: BRAND.publisher },
        dateModified: review.publishedAt,
        variableMeasured: ["Exact task pass", "Time to first content (ms)", "API token usage", "Predetermined code checks"],
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
<p>{en ? "Original testing and analysis by TOKRACE · Text/code: October 10, 2026; first visual tasks: October 20; supplemental tests: October 21–22, 2026 (Asia/Shanghai)." : "TOKRACE 原创测试与分析 · 文本/代码实测：2026 年 10 月 10 日；首轮视觉实测：10 月 20 日；补测：10 月 21–22 日（北京时间）。"}</p>
<p className="rounded-lg border border-line bg-card p-4"><Link href={localizedPath("/guides/longcat-2-5", locale)}>{en ? "New: LongCat 2.5 analysis, October 26–27 independent Preview retest and responsive frontend cases →" : "新增：LongCat 2.5 解读、10 月 26–27 日独立 Preview 复测与响应式前端案例 →"}</Link><span className="mt-2 block text-xs">{en ? "This page preserves its historical data and test dates; the new batch is published separately." : "本页保留历史数据与实测日期，新批次单独发布。"}</span></p>

<RerunButton locale={locale} label={en ? "Free trial: rerun the first task" : "免费复测第一题"} seed={{
        mode: "report", prompt: review.attempts[0].prompt, params: review.params,
        task: { caseId: review.attempts[0].id, version: review.suiteVersion },
        endpointRefs: [{ model: review.model, provider: review.endpoint, name: "美团 LongCat 2.5 Preview" }],
      }} />
<section id="evidence" aria-label={en ? "Original evidence" : "原始证据"}>
        <h2>{en ? "Original prompts, answers and checks" : "原题、原始回答与代码检查"}</h2>
        <p><Link href={evidencePath}>{en ? "Download all 33 attempts (JSON)" : "下载全部 33 次请求记录（JSON）"}</Link></p>
        {review.attempts.map((a) => (
          <details id={`evidence-${a.id}-${a.mode}`} key={`${a.id}-${a.mode}`} className="mb-3 rounded border border-line p-4">
            <summary className="cursor-pointer">{en ? a.titleEn : a.title} · {a.mode === "default" ? (en ? "Default thinking" : "默认思考") : (en ? "Thinking disabled" : "关闭思考")} · {a.pass ? (en ? "Passed" : "通过") : (en ? "Not passed" : "未通过")}</summary>
            <p>{a.startedAt} · {en ? "First content" : "正文首响"}：{a.firstContentMs == null ? "—" : `${(a.firstContentMs / 1000).toFixed(3)}s`} · {en ? "Input / total completion / reasoning tokens" : "输入 / 总输出 / 思考 token"}：{a.promptTokens ?? "—"} / {a.outputTokens ?? "—"} / {a.reasoningTokens ?? "—"} · {en ? "Finish reason" : "结束原因"}：{a.finishReason ?? a.status}</p>
            <h3>{en ? "Prompt" : "题目"}</h3>
            <pre className="overflow-auto whitespace-pre-wrap break-words">{a.prompt}</pre>
            <h3>{en ? "Original answer" : "原始回答"}</h3>
            <pre className="overflow-auto whitespace-pre-wrap break-words">{a.text}</pre>
            {a.error && <p>{a.error}</p>}
          </details>
        ))}
        {review.coding.map((a) => (
          <details id={`evidence-${a.id}`} key={a.id} className="mb-3 rounded border border-line p-4">
            <summary className="cursor-pointer">{en ? a.titleEn : a.title} · {a.status === "truncated" ? (en ? "Truncated; checks not run" : "输出截断，未执行检查") : a.pass ? (en ? "Passed" : "通过") : (en ? "Not passed" : "未通过")} · {a.checkCount} {en ? "planned checks" : "项预定检查"}</summary>
            <p>{a.startedAt} · {en ? "First content" : "正文首响"}：{a.firstContentMs == null ? "—" : `${(a.firstContentMs / 1000).toFixed(3)}s`} · {en ? "Finish reason" : "结束原因"}：{a.finishReason ?? a.status}</p>
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
