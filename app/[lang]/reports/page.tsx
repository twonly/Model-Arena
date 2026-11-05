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
              {r.editorial?.[locale].title ??
                r.models.map((m) => m.name).join(" · ")}
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
            {r.editorial?.[locale].summary ??
              (en
                ? "JSON extraction · instruction following · grounded QA"
                : "JSON 抽取 · 指令约束 · 材料问答")}
          </p>
        </article>
      ))}
      <section>
        <h2>{en ? "Model news and release previews" : "模型动态与发布前瞻"}</h2>
<article className="mb-4 rounded-lg border border-line bg-card p-5">
          <h3 className="text-lg font-bold text-ink"><Link href={localizedPath("/guides/aa-intelligence-index-v5-chinese-models", locale)}>{en ? "New exam, 13 points lost: 17 facts about AA Intelligence Index v5" : "换了张考卷，国产模型掉了 13 分：AA v5 的 17 个事实"}</Link></h3>
          <p className="mt-2">{en ? "2026-11-01 · Only 8 of 77 entries gained; Chinese models averaged -12.4 vs -6.8. Terminal-Bench-Science, HLE-Diamond, the removed tests, Gemini 4 Carbon and cost per task, in 11 charts." : "2026-11-01 · 77 个模型只有 8 个涨分，国产平均 -12.4、其他 -6.8。科学终端题、HLE-Diamond、被删的三项、Gemini 4 Carbon 与单题成本，11 张图。"}</p>
        </article>
<article className="mb-4 rounded-lg border border-line bg-card p-5">
          <h3 className="text-lg font-bold text-ink"><Link href={localizedPath("/guides/manus-rebuild-manus-report", locale)}>{en ? "Rebuilding Manus with Manus, explained in diagrams" : "动态图解：用 Manus 重建 Manus（工程·产品·市场）"}</Link></h3>
          <p className="mt-2">{en ? "2026-10-31 · 26 animated diagrams of Manus co-founder Tao Zhang's essay: Mono, the three-agent bug loop, merge gates, autonomy limits, PMs shipping, an AI teammate in marketing. Plain-language rewrite—not a Tokrace speed benchmark." : "2026-10-31 · 26 张动图转写 Manus 联合创始人张涛长文：Mono、三 Agent bug 闭环、合并闸门、自主的边界、PM 独立上线、市场部 AI 队友。公开长文人话转写，非速度榜实测。"}</p>
        </article>
<article className="mb-4 rounded-lg border border-line bg-card p-5">
          <h3 className="text-lg font-bold text-ink"><Link href={localizedPath("/guides/deepseek-super-agent-diagram", locale)}>{en ? "DeepSeek Super-agent architecture, explained in diagrams" : "动态图解：DeepSeek Super-agent 架构（连续·高效·主动·持久）"}</Link></h3>
          <p className="mt-2">{en ? "2026-10-31 · Animated diagrams of Router/Worker, trigger filtering and durable sessions. Plain-language rewrite of public discussion—not a Tokrace speed benchmark." : "2026-10-31 · 用动态图解讲清 Router/Worker、Trigger 过滤与持久会话。公开讨论人话转写，非速度榜实测。"}</p>
        </article>
      </section>
      <Link href={localizedPath("/method", locale)}>
        {en ? "Read the method and limitations" : "查看方法与限制"}
      </Link>
    </InfoPage>
  );
}
