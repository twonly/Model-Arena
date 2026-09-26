import Link from "next/link";
import { InfoPage, infoMetadata } from "@/components/InfoPage";
import { publishedReports } from "@/lib/benchmark-server";
import { isStale } from "@/lib/benchmark-report";
import { normalizeLocale, DEFAULT_LOCALE, localizedPath } from "@/lib/i18n";
export const dynamic = "force-dynamic";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const locale = normalizeLocale((await params).lang) ?? DEFAULT_LOCALE,
    en = locale === "en";
  return infoMetadata(
    locale,
    "/reports",
    en ? "Model test reports · TOKRACE" : "模型实测报告 · TOKRACE",
    en
      ? "Versioned tasks, raw evidence and reproducible comparisons."
      : "版本化任务、原始证据和可以自己复跑的模型对比。",
  );
}
export default async function Reports({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const locale = normalizeLocale((await params).lang) ?? DEFAULT_LOCALE,
    en = locale === "en";
  let unavailable = false;
  const reports = await publishedReports().catch(() => {
    unavailable = true;
    return [];
  });
  return (
    <InfoPage
      locale={locale}
      pathname="/reports"
      title={en ? "Standard test reports" : "标准实测报告"}
      intro={
        en
          ? "Original tests from the Hong Kong endpoint. Community submissions are shown separately on the community leaderboard."
          : "来自香港测量节点的原创测试。社区自报数据单独展示，不作为标准报告的证据。"
      }
      updatedAt={reports[0]?.publishedAt.slice(0, 10) ?? "2026-09-26"}
    >
      {!reports.length && (
        <p role="status">
          {unavailable
            ? en
              ? "Report storage is temporarily unavailable."
              : "报告服务暂时不可用。"
            : en
              ? "No report has passed the evidence gate yet. You can try the same tasks in the arena."
              : "暂时没有通过证据检查的标准报告。你可以先在竞速场体验同一套任务。"}{" "}
          <Link href={localizedPath("/arena", locale)}>
            {en ? "Start a comparison" : "开始一次对比"}
          </Link>
        </p>
      )}
      {reports.map((r) => (
        <article
          key={r.id}
          className="rounded-lg border border-line bg-card p-5"
        >
          <h2>
            <Link href={localizedPath(`/reports/${r.id}`, locale)}>
              {r.models.map((m) => m.name).join(" · ")}
            </Link>
          </h2>
          <p>
            {r.testedAt.slice(0, 10)} · {r.attemptCount}{" "}
            {en ? "attempts" : "次尝试"} · hkg1 ·{" "}
            {isStale(r.testedAt)
              ? en
                ? "Stale · retest pending"
                : "数据陈旧 · 待复测"
              : en
                ? "Recent"
                : "近期实测"}
          </p>
          <p>
            {en
              ? "JSON extraction · instruction following · grounded QA"
              : "JSON 抽取 · 指令约束 · 材料问答"}
          </p>
        </article>
      ))}
      <Link href={localizedPath("/method", locale)}>
        {en ? "Read the method and limitations" : "查看方法与限制"}
      </Link>
    </InfoPage>
  );
}
