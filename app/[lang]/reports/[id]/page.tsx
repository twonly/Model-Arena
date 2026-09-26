import Link from "next/link";
import { Markdown } from "@/components/Markdown";
import { ProviderIcon } from "@/components/ProviderIcon";
import { notFound } from "next/navigation";
import { InfoPage, infoMetadata } from "@/components/InfoPage";
import { JsonLd } from "@/components/JsonLd";
import { RerunButton, ReportViewEvent } from "@/components/RerunButton";
import { publishedReport } from "@/lib/benchmark-server";
import { summarizeAttempts, isStale } from "@/lib/benchmark-report";
import { TASK_LABELS } from "@/lib/benchmark-suite";
import { normalizeLocale, DEFAULT_LOCALE, localizedPath } from "@/lib/i18n";
import { DATASET_LICENSE_URL } from "@/lib/structured-data";
import { SocialSharePanel } from "@/components/SocialSharePanel";
import { htmlBadge, markdownBadge } from "@/lib/badge";
import { BRAND } from "@/lib/brand";
export const dynamic = "force-dynamic";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; id: string }>;
}) {
  const { lang, id } = await params,
    locale = normalizeLocale(lang) ?? DEFAULT_LOCALE,
    en = locale === "en",
    r = await publishedReport(id).catch(() => null);
  const metadata = infoMetadata(
    locale,
    `/reports/${id}`,
    r
      ? (r.editorial?.[locale].title ??
          `${r.models.map((m) => m.name).join(" · ")} · ${r.testedAt.slice(0, 10)}`)
      : en
        ? "Report not found"
        : "报告不存在",
    r?.editorial?.[locale].summary ??
      (en
        ? "Task outcomes, latency, cost and original evidence under identical conditions."
        : "相同条件下的任务效果、等待时间、成本与原始证据。"),
  );
  // Let this route's file-based image replace the generic image from infoMetadata.
  if (metadata.openGraph) delete metadata.openGraph.images;
  if (metadata.twitter) delete metadata.twitter.images;
  return {
    ...metadata,
    ...(!r ? { robots: { index: false, follow: true } } : {}),
  };
}
export default async function ReportPage({
  params,
}: {
  params: Promise<{ lang: string; id: string }>;
}) {
  const { lang, id } = await params,
    locale = normalizeLocale(lang) ?? DEFAULT_LOCALE,
    en = locale === "en";
  const r = await publishedReport(id);
  if (!r) notFound();
  const reportUrl = `${BRAND.url}${localizedPath(`/reports/${id}`, locale)}`;
  const badge = {
    alt: `TOKRACE ${r.testedAt.slice(0, 10)}`,
    badgeUrl: `${BRAND.url}/api/badge/report/${id}`,
    targetUrl: reportUrl,
  };
  const endpointRefs = r.models.map((m) => ({
    model: m.model,
    provider: m.provider,
    name: m.name,
    kind: m.kind,
    extraBody: m.extraBody ?? "",
  }));
  const summaries = r.models.map((model) => ({
    model,
    tasks: summarizeAttempts(
      r.attempts.filter((a) => a.model.id === model.id),
      r.cases,
    ),
  }));
  const fmt = (n: number | null, unit = "") =>
    n == null ? (en ? "Unknown" : "未知") : `${n.toFixed(2)}${unit}`;
  return (
    <InfoPage
      locale={locale}
      pathname={`/reports/${id}`}
      title={
        r.editorial?.[locale].title ??
        (en ? "Task-based model report" : "真实任务模型实测报告")
      }
      intro={
        r.editorial?.[locale].summary ?? r.models.map((m) => m.name).join(" · ")
      }
      updatedAt={r.publishedAt.slice(0, 10)}
    >
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Dataset",
          name: `TOKRACE ${r.campaign}`,
          description: en
            ? "Original task attempts and measurement evidence."
            : "原始任务尝试和测量证据。",
          license: DATASET_LICENSE_URL,
          creator: { "@type": "Organization", name: "TOKRACE" },
          dateModified: r.publishedAt,
          url: `${BRAND.url}${localizedPath(`/reports/${id}`, locale)}`,
          distribution: {
            "@type": "DataDownload",
            encodingFormat: "application/json",
            contentUrl: `${BRAND.url}/api/reports/${id}`,
          },
        }}
      />
      <ReportViewEvent id={id} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "TechArticle",
          headline:
            r.editorial?.[locale].title ??
            r.models.map((m) => m.name).join(" · "),
          datePublished: r.publishedAt,
          dateModified: r.publishedAt,
          author: {
            "@type": "Organization",
            name: "TOKRACE automated benchmark",
          },
          url: `${BRAND.url}${localizedPath(`/reports/${id}`, locale)}`,
          inLanguage: locale,
        }}
      />
      {r.stage === "first-look" && (
        <p className="rounded border border-line bg-card p-4">
          {en
            ? "First look: one time window and a small task set. A cross-window retest is pending."
            : "首测：单一时间段的小样本结果，跨时间段复测待补充。"}
        </p>
      )}
      {r.editorial && (
        <section>
          <Markdown text={r.editorial[locale].body} />
        </section>
      )}
      <section>
        <h2>{en ? "What this report supports" : "如何使用这份结论"}</h2>
        <RerunButton
          locale={locale}
          label={en ? "Rerun the first task" : "先复测一个任务"}
          seed={{
            mode: "report",
            prompt: r.cases[0].prompt,
            task: { caseId: r.cases[0].id, version: r.cases[0].version },
            params: r.attempts[0].params,
            endpointRefs,
            reportId: r.id,
            reportVersion: r.version,
          }}
        />
        <p>
          {en
            ? "Choose using task pass counts first, then latency and estimated cost. No overall score is assigned. Failed, incomplete and unmeasured outputs are retained below."
            : "先看目标任务的通过数，再比较等待时间和估算费用。本报告不设综合分；失败、未完成与缺失计量均保留在证据中。"}
        </p>
        <p>
          {en ? "Last tested" : "最近实测"}：{r.testedAt} · {r.attempts.length}{" "}
          {en ? "attempts" : "次尝试"} ·{" "}
          {isStale(r.testedAt)
            ? en
              ? "Stale (>7 days)"
              : "数据陈旧（超过 7 天）"
            : en
              ? "Within 7 days"
              : "7 天内实测"}
        </p>
        <p>
          {r.reviewedAt
            ? en
              ? "Measured automatically; editorial content confirmed by the site operator before publication."
              : "测试数据由程序采集，评测内容经运营者确认后发布。"
            : en
              ? "Generated and checked by deterministic software; no human review is claimed."
              : "由程序计算并生成，经过自动一致性检查；未标注为人工复核。"}
        </p>
        <ul className="space-y-3">
          {summaries[0].tasks.map((task, index) => {
            const passed = Math.max(
              ...summaries.map((s) => s.tasks[index].passed),
            );
            const names = summaries
              .filter((s) => s.tasks[index].passed === passed)
              .map((s) => s.model.name)
              .join(" / ");
            return (
              <li key={task.category}>
                <strong>{TASK_LABELS[task.category][locale]}</strong> —{" "}
                {passed === 0
                  ? en
                    ? "No model passed the checks in this category."
                    : "本组没有模型通过校验。"
                  : `${names}: ${passed}/${task.attempts}`}
                .{" "}
                {passed === task.attempts
                  ? en
                    ? "Candidates for your own retest; this small task set does not establish general capability."
                    : "可优先用自己的材料复测；这组小样本不代表通用能力。"
                  : en
                    ? "Failures remain; inspect the evidence before choosing."
                    : "仍有失败案例，选用前请检查原始输出。"}
              </li>
            );
          })}
        </ul>
      </section>
      {r.models.map((m) => (
        <section key={m.id}>
          <h2 className="flex items-center gap-2">
            <ProviderIcon model={m.model} name={m.name} provider={m.provider} />
            {m.name}
          </h2>
          <p>
            {m.provider} · {m.version}
          </p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-left">
              <thead>
                <tr>
                  {(en
                    ? [
                        "Task",
                        "Pass / attempts",
                        "Complete",
                        "First content",
                        "Total",
                        "Chars/s",
                        "Est. CNY",
                      ]
                    : [
                        "任务",
                        "通过 / 尝试",
                        "完整完成",
                        "首个正文",
                        "完整耗时",
                        "字符/秒",
                        "估算 ¥",
                      ]
                  ).map((t) => (
                    <th key={t} className="border-b border-line p-2">
                      {t}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {summarizeAttempts(
                  r.attempts.filter((a) => a.model.id === m.id),
                  r.cases,
                ).map((s) => (
                  <tr key={s.category}>
                    <th className="p-2">{TASK_LABELS[s.category][locale]}</th>
                    <td className="p-2">
                      {s.passed}/{s.attempts}
                    </td>
                    <td className="p-2">
                      {s.completed}/{s.attempts}
                    </td>
                    <td className="p-2">
                      {fmt(
                        s.firstContentMs == null
                          ? null
                          : s.firstContentMs / 1000,
                        "s",
                      )}
                    </td>
                    <td className="p-2">
                      {fmt(s.totalMs == null ? null : s.totalMs / 1000, "s")}
                    </td>
                    <td className="p-2">
                      {fmt(s.charactersPerSecond)}
                      <br />
                      {s.speedRange &&
                        `${s.speedRange[0].toFixed(1)}–${s.speedRange[1].toFixed(1)}`}
                      <br />
                      {!s.speedComparable &&
                        (en
                          ? "Insufficient samples for ranking"
                          : "样本不足，不判速度胜负")}
                      {s.p95Ms != null &&
                        ` · P95 ${(s.p95Ms / 1000).toFixed(2)}s`}
                    </td>
                    <td className="p-2">
                      {s.costCny == null
                        ? fmt(null)
                        : s.costCny === 0
                          ? "0"
                          : s.costCny < 0.01
                            ? s.costCny.toPrecision(2)
                            : s.costCny.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
      <section>
        <h2>{en ? "Conditions and limits" : "测试条件与限制"}</h2>
        <p>
          {r.region} · {r.suiteVersion} ·{" "}
          {en
            ? "Server timing; character throughput counts Unicode code points, provider billing tokens remain separate. Median and range; P95 is shown only with 100 completed samples per task category."
            : "服务端计时；统一吞吐按 Unicode 字符计数，厂商计费 token 单独保留。展示中位数与范围；单类完整样本达到 100 后才显示 P95。"}
        </p>
        <p>
          {en
            ? "These 15 synthetic tasks test a narrow set of constraints, not general intelligence, code correctness or visual quality. Unknown billing usage remains unknown; reserved budget is not reported as actual cost."
            : "15 个合成任务只覆盖有限约束，不代表通用智能、代码正确性或视觉效果。缺少计费 usage 时成本为未知，预算预留不冒充实际费用。"}
        </p>
        <pre className="overflow-x-auto rounded bg-paper p-3 text-xs">
          {JSON.stringify(r.attempts[0]?.params, null, 2)}
        </pre>
        <Link href={localizedPath("/method", locale)}>
          {en ? "Full methodology" : "完整测试方法"}
        </Link>
      </section>
      <SocialSharePanel
        url={reportUrl}
        title={r.models.map((m) => m.name).join(" · ")}
        text={`${r.testedAt.slice(0, 10)} · ${r.attempts.length} ${en ? "attempts · reproducible evidence" : "次尝试 · 可复现证据"}`}
        badgeMarkdown={markdownBadge(badge)}
        badgeHtml={htmlBadge(badge)}
      />
      <section>
        <h2>
          {en ? "Cases, reruns and raw evidence" : "任务、复测与原始证据"}
        </h2>
        <p>
          <a href={`/api/reports/${id}`}>
            {en ? "Download immutable JSON evidence" : "下载不可变 JSON 证据"}
          </a>{" "}
          · {r.version}
        </p>
        {r.cases.map((c) => (
          <details key={c.id} className="mb-3 rounded border border-line p-3">
            <summary className="cursor-pointer font-bold">
              {en ? c.titleEn : c.title} · {c.id}
            </summary>
            <p className="my-3 whitespace-pre-wrap">{c.prompt}</p>
            <RerunButton
              locale={locale}
              seed={{
                mode: "report",
                title: en ? c.titleEn : c.title,
                prompt: c.prompt,
                task: { caseId: c.id, version: c.version },
                params: r.attempts[0].params,
                endpointRefs,
                reportId: r.id,
                reportVersion: r.version,
              }}
            />
            {r.attempts
              .filter((a) => a.caseId === c.id)
              .map((a) => (
                <details
                  id={`evidence-${a.id}`}
                  key={a.id}
                  className="mt-3 border-t border-line pt-3"
                >
                  <summary className="cursor-pointer">
                    {a.model.name} · {a.window + 1} · {a.status} ·{" "}
                    {a.pass
                      ? en
                        ? "Passed"
                        : "通过"
                      : en
                        ? "Not passed"
                        : "未通过"}
                  </summary>
                  <p>
                    {a.startedAt} · {a.error} ·{" "}
                    {en ? "Billing tokens" : "计费 token"}{" "}
                    {a.promptTokens ?? "?"}/{a.outputTokens ?? "?"} ·{" "}
                    <a href={a.price.source} rel="noreferrer" target="_blank">
                      {en ? "Price source" : "价格来源"}
                    </a>
                    （{a.price.verifiedAt} ·{" "}
                    {a.price.basis === "upper-bound"
                      ? en
                        ? "peak-rate upper bound"
                        : "高峰价上限"
                      : en
                        ? "listed rate"
                        : "目录价格"}
                    ）
                  </p>
                  <pre className="max-h-96 overflow-auto whitespace-pre-wrap break-words rounded bg-paper p-3 text-xs">
                    {a.text || "—"}
                  </pre>
                </details>
              ))}
          </details>
        ))}
      </section>
    </InfoPage>
  );
}
