import { REVIEW_PRESENTATION_UPDATED_AT } from "@/lib/model-review-presentation";
import Link from "next/link";
import { InfoPage, infoMetadata } from "@/components/InfoPage";
import { JsonLd } from "@/components/JsonLd";
import { Markdown } from "@/components/Markdown";
import { RerunButton } from "@/components/RerunButton";
import { BRAND } from "@/lib/brand";
import { DEFAULT_LOCALE, localizedPath, normalizeLocale } from "@/lib/i18n";
import { DATASET_LICENSE_URL } from "@/lib/structured-data";
import review from "@/public/evaluations/minimax-m3-1-flash-preview.json";

const pathname = "/guides/minimax-m3-1-flash-preview";
const evidencePath = "/evaluations/minimax-m3-1-flash-preview.json";
type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props) {
  const locale = normalizeLocale((await params).lang) ?? DEFAULT_LOCALE;
  const article = review.editorial[locale];
  return infoMetadata(locale, pathname, article.title, article.summary);
}

export default async function Review({ params }: Props) {
  const locale = normalizeLocale((await params).lang) ?? DEFAULT_LOCALE;
  const en = locale === "en", article = review.editorial[locale];
  return (
    <InfoPage locale={locale} pathname={pathname} title={article.title} intro={article.summary} updatedAt={review.date}>
<JsonLd data={{
        "@context": "https://schema.org", "@type": "TechArticle",
        headline: article.title, description: article.summary, inLanguage: locale,
        datePublished: review.publishedAt, dateModified: "2026-10-20T03:53:35.368Z",
        author: { "@type": "Organization", name: BRAND.publisher },
        url: BRAND.url + localizedPath(pathname, locale),
      }} />
<JsonLd data={{
        "@context": "https://schema.org", "@type": "Dataset",
        name: "MiniMax M3.1 Flash Preview: 18 original task attempts",
        description: article.summary, license: DATASET_LICENSE_URL,
        creator: { "@type": "Organization", name: BRAND.publisher },
        dateModified: review.publishedAt,
        distribution: { "@type": "DataDownload", encodingFormat: "application/json", contentUrl: BRAND.url + evidencePath },
      }} />

<details id="review-details" className="scroll-mt-6 rounded-xl border border-line bg-card p-5">
<summary className="cursor-pointer font-bold text-ink">{en ? "Test details, original answers and sources" : "测试详情、原始回答与来源"}</summary>
<div className="mt-5 space-y-7">
<aside className="rounded border border-line bg-card p-4">
        <h2>{en ? "October 20 update: the released model is available" : "10 月 20 日更新：正式版已发布"}</h2>
        <p>{en ? "MiniMax released M3.1 Flash on October 19 and identified Space Bunny as an early version. The Preview measurements below remain the October 3 results; they are not the released-model test." : "MiniMax 于 10 月 19 日发布 M3.1 Flash，并确认 Space Bunny 是早期版本。下方仍是 10 月 3 日的 Preview 原始成绩；正式版使用新请求另行测试。"}</p>
        <Link href={localizedPath("/guides/minimax-m3-1-flash", locale)}>{en ? "Read the release review, Space Bunny timeline and 46 new attempts" : "查看正式版评测、Space Bunny 沿革与 46 次新测试"}</Link>
      </aside>
<Markdown text={article.body} />
<RerunButton locale={locale} label={en ? "Free trial: rerun the first task" : "免费复测第一题"} seed={{
        mode: "report", prompt: review.attempts[0].prompt, params: review.params,
        task: { caseId: review.attempts[0].id, version: review.suiteVersion },
        endpointRefs: [{ model: review.model, provider: review.endpoint, name: "MiniMax M3.1 Flash Preview" }],
      }} />
<p><Link href={evidencePath}>{en ? "Download complete evidence (JSON)" : "下载完整证据（JSON）"}</Link></p>
<section aria-label={en ? "Text task evidence" : "文本任务证据"}>
        {review.attempts.map((a) => (
          <details id={`evidence-${a.id}`} key={a.id} className="mb-3 rounded border border-line p-4">
            <summary className="cursor-pointer">{a.id} · {a.pass ? (en ? "Passed" : "通过") : (en ? "Not passed" : "未通过")} · {(a.firstContentMs / 1000).toFixed(3)}s</summary>
            <p>{a.startedAt} · {en ? "Prompt / completion tokens" : "输入 / 输出 token"}：{a.promptTokens} / {a.outputTokens} · {en ? "Finish reason" : "结束原因"}：{a.finishReason}</p>
            <h3>{en ? "Prompt" : "题目"}</h3>
            <pre className="overflow-auto whitespace-pre-wrap break-words">{a.prompt}</pre>
            <h3>{en ? "Original answer" : "原始回答"}</h3>
            <pre className="overflow-auto whitespace-pre-wrap break-words">{a.text}</pre>
          </details>
        ))}
      </section>
<section aria-label={en ? "Coding task evidence" : "代码任务证据"}>
        {review.coding.map((a) => (
          <details id={`evidence-${a.id}`} key={a.id} className="mb-3 rounded border border-line p-4">
            <summary className="cursor-pointer">{en ? a.titleEn : a.title} · {a.pass ? (en ? "Passed" : "通过") : (en ? "Not passed" : "未通过")}</summary>
            <p>{a.startedAt} · {en ? "First content" : "正文首响"}：{(a.firstContentMs / 1000).toFixed(3)}s · {en ? "Checks" : "检查数"}：{a.checkCount}</p>
            <h3>{en ? "Prompt" : "题目"}</h3>
            <pre className="overflow-auto whitespace-pre-wrap break-words">{a.prompt}</pre>
            <h3>{en ? "Original code" : "原始代码"}</h3>
            <pre className="overflow-auto whitespace-pre-wrap break-words">{a.text}</pre>
            <h3>{en ? "Executable checks" : "可执行检查"}</h3>
            <pre className="overflow-auto whitespace-pre-wrap break-words">{a.checks}</pre>
          </details>
        ))}
      </section>
</div>
</details>
</InfoPage>
  );
}
