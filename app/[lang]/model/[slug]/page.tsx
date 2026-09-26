import Link from "next/link";
import { ProviderIcon } from "@/components/ProviderIcon";
import { notFound } from "next/navigation";
import { InfoPage, infoMetadata } from "@/components/InfoPage";
import { RerunButton } from "@/components/RerunButton";
import { SHARED_MODELS, sharedModelIsAvailable } from "@/lib/shared-models";
import { loadModelStatsForSlug, prelaunchBySlug } from "@/lib/seo-models";
import { publishedReports } from "@/lib/benchmark-server";
import { isStale } from "@/lib/benchmark-report";
import {
  BENCHMARK_CASES,
  BENCHMARK_PARAMS,
  TASK_LABELS,
} from "@/lib/benchmark-suite";
import { findEndpointPrice } from "@/lib/pricing";
import { normalizeLocale, DEFAULT_LOCALE, localizedPath } from "@/lib/i18n";
export const dynamic = "force-dynamic";
async function data(slug: string) {
  const shared = SHARED_MODELS.find((m) => m.id === slug || m.model === slug),
    pre = prelaunchBySlug(slug);
  const stats = (await loadModelStatsForSlug(slug)) ?? [];
  const reports = (await publishedReports(30, [slug]).catch(() => [])).filter(
    (r) =>
      r.models.some(
        (m) =>
          m.slug === slug ||
          m.model === shared?.model ||
          stats.some((s) => (s.rawModel ?? s.model) === m.model),
      ),
  );
  return { shared, pre, stats, reports };
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; lang: string }>;
}) {
  const { slug, lang } = await params,
    l = normalizeLocale(lang) ?? DEFAULT_LOCALE,
    en = l === "en",
    { shared, pre, stats, reports } = await data(slug),
    name =
      shared?.name ??
      pre?.name ??
      reports[0]?.models.find((m) => m.slug === slug)?.name ??
      stats[0]?.model ??
      slug;
  return {
    ...infoMetadata(
      l,
      `/model/${slug}`,
      `${name} · TOKRACE`,
      en
        ? "Model identity, availability, published test evidence and exact endpoint reruns."
        : "模型身份、可用状态、已发布实测与准确接入点复测。",
    ),
    robots: { index: reports.length > 0 || !!pre?.sourceUrl, follow: true },
  };
}
export default async function ModelPage({
  params,
}: {
  params: Promise<{ slug: string; lang: string }>;
}) {
  const { slug, lang } = await params,
    locale = normalizeLocale(lang) ?? DEFAULT_LOCALE,
    en = locale === "en",
    h = (p: string) => localizedPath(p, locale);
  const { shared, pre, stats, reports } = await data(slug);
  if (!shared && !pre && !stats.length && !reports.length) notFound();
  const reportModel = reports
    .flatMap((r) => r.models)
    .find((m) => m.slug === slug);
  const name = shared?.name ?? pre?.name ?? reportModel?.name ?? stats[0].model;
  const until =
      shared?.availableUntil ??
      pre?.availableUntil ??
      reportModel?.availableUntil,
    expired = !!until && Date.parse(until) <= Date.now();
  const available = !!shared && sharedModelIsAvailable(shared);
  const rerunEndpoint = shared
    ? {
        model: shared.model,
        provider: shared.baseUrl,
        name,
        kind: shared.kind,
        extraBody: shared.extraBody ?? "",
      }
    : reportModel;
  const price = shared
      ? findEndpointPrice(shared.model, shared.baseUrl)
      : undefined,
    c = reports[0]?.cases[0] ?? BENCHMARK_CASES[0];
  return (
    <InfoPage
      locale={locale}
      pathname={`/model/${slug}`}
      title={
        <span className="flex items-center gap-3">
          <ProviderIcon model={shared?.model ?? reportModel?.model ?? pre?.apiModelId ?? stats[0]?.rawModel} name={name} size="lg" />
          {name}
        </span>
      }
      intro={
        en
          ? "Identity and evidence for this model. Performance depends on the endpoint, task and measurement conditions."
          : "查看这个模型的身份与证据。效果和速度取决于实际接入点、任务与测量条件。"
      }
      updatedAt={
        reports[0]?.publishedAt.slice(0, 10) ?? pre?.verifiedOn ?? "2026-09-26"
      }
    >
      <section>
        <h2>{en ? "Availability & identity" : "可用状态与模型身份"}</h2>
        <p>
          {expired
            ? en
              ? "This preview expired on TOKRACE. Historical evidence remains available."
              : "该预览已超过本站有效期，历史证据仍保留。"
            : available
              ? en
                ? "Configured on TOKRACE; runtime availability is checked when called."
                : "本站已配置接入，实际可用性以调用结果为准。"
              : en
                ? "Not in the current trial pool; connect your own endpoint to test."
                : "当前体验池未接入，可配置自己的接口测试。"}
        </p>
        {until && (
          <p>
            {en ? "Preview cutoff" : "预览到期"}：{until}
          </p>
        )}
        <p>
          {shared?.baseUrl ??
            reportModel?.provider ??
            stats[0]?.provider ??
            pre?.provider}
        </p>
        <details>
          <summary>
            {en ? "Version and API identifier" : "版本与 API 标识"}
          </summary>
          <p>
            {shared?.model ??
              reportModel?.model ??
              pre?.apiModelId ??
              stats[0]?.rawModel ??
              name}
          </p>
        </details>
        {pre?.sourceUrl && (
          <p>
            <a href={pre.sourceUrl}>{en ? "Official source" : "官方来源"}</a> ·{" "}
            {en ? pre.noticeEn : pre.noticeZh}
          </p>
        )}
        {rerunEndpoint && !expired && (
          <RerunButton
            locale={locale}
            seed={{
              mode: "report",
              title: `${name} · ${en ? c.titleEn : c.title}`,
              prompt: c.prompt,
              task: { caseId: c.id, version: c.version },
              params: BENCHMARK_PARAMS,
              endpointRefs: [
                {
                  model: rerunEndpoint.model,
                  provider: rerunEndpoint.provider,
                  name,
                },
              ],
            }}
          />
        )}
      </section>
      <section>
        <h2>{en ? "Endpoint pricing" : "接入点价格"}</h2>
        {price ? (
          <p>
            {price.currency} / 1M tokens · {en ? "Input" : "输入"}{" "}
            {price.inputMiss} · {en ? "Output" : "输出"} {price.output} ·{" "}
            <a href={price.sourceUrl}>{en ? "Source" : "来源"}</a> ·{" "}
            {en ? "Verified" : "核实于"} {price.verified}。
            {en
              ? "An estimate from the recorded price, not a live invoice."
              : "按已记录价格估算，不是实时账单。"}
          </p>
        ) : (
          <p>
            {en
              ? "Unknown or not billed per token. No zero-cost assumption is used."
              : "价格未知或非按 token 计费，不按零成本参加排名。"}
          </p>
        )}
        <Link href={h("/pricing")}>
          {en ? "Full price table" : "完整价格表"}
        </Link>
      </section>
      <section>
        <h2>{en ? "Standard test evidence" : "标准实测证据"}</h2>
        {!reports.length ? (
          <p>
            {en
              ? "No published standard report yet. Task suitability has not been established."
              : "暂无已发布标准报告，任务适用性尚未评估。"}
          </p>
        ) : (
          reports.map((r) => (
            <article key={r.id} className="mb-4 rounded border border-line p-4">
              <Link href={h(`/reports/${r.id}`)}>
                {r.testedAt.slice(0, 10)} · {r.suiteVersion} ·{" "}
                {isStale(r.testedAt)
                  ? en
                    ? "Stale"
                    : "数据陈旧"
                  : en
                    ? "Recent"
                    : "近期"}
              </Link>
              {r.models
                .filter(
                  (m) =>
                    m.slug === slug ||
                    m.model === shared?.model ||
                    stats.some((s) => (s.rawModel ?? s.model) === m.model),
                )
                .map((m) => (
                  <div key={m.id}>
                    <p>{m.provider}</p>
                    {(r.summaries[m.id] ?? []).map((s) => (
                      <p key={s.category}>
                        {TASK_LABELS[s.category][locale]}：{s.passed}/
                        {s.attempts} {en ? "passed" : "通过"}
                      </p>
                    ))}
                  </div>
                ))}
            </article>
          ))
        )}
      </section>
      {stats.length > 0 && (
        <section>
          <h2>
            {en ? "Historical community submissions" : "历史社区自报数据"}
          </h2>
          <p>
            {en
              ? "These unverified submissions mix tasks, regions and settings; they cannot establish a fair model ranking. They are not standard-test evidence."
              : "未经本站验证的社区提交可能混合任务、地区与参数，不能据此判断模型优劣，也不作为标准报告证据。"}
          </p>
          <div className="overflow-x-auto">
            <table className="min-w-[550px] text-left">
              <thead>
                <tr>
                  {(en
                    ? [
                        "Endpoint",
                        "Completed / attempts",
                        "Median tok/s",
                        "Last submitted",
                      ]
                    : ["接入点", "完整完成 / 尝试", "中位 tok/s", "最近提交"]
                  ).map((t) => (
                    <th className="p-2" key={t}>
                      {t}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stats.map((s) => (
                  <tr key={`${s.rawModel ?? s.model}:${s.provider}`}>
                    <td className="p-2">{s.provider}</td>
                    <td className="p-2">
                      {s.samples}/{s.attempts ?? s.samples}
                    </td>
                    <td className="p-2">{s.medianContentTps.toFixed(1)}</td>
                    <td className="p-2">
                      {s.lastAt.slice(0, 10)}{" "}
                      {isStale(s.lastAt) && (en ? "· stale" : "· 陈旧")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
      <p>
        <Link href={h("/models")}>{en ? "All models" : "全部模型"}</Link> ·{" "}
        <Link href={h("/method")}>
          {en ? "Method and limitations" : "方法与限制"}
        </Link>
      </p>
    </InfoPage>
  );
}
