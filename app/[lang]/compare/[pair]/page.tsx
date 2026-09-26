import Link from "next/link";
import { ProviderIcon } from "@/components/ProviderIcon";
import { notFound, permanentRedirect } from "next/navigation";
import { InfoPage, infoMetadata } from "@/components/InfoPage";
import { RerunButton } from "@/components/RerunButton";
import { loadComparePair } from "@/lib/seo-models";
import { publishedReports } from "@/lib/benchmark-server";
import { reportPairs, isStale } from "@/lib/benchmark-report";
import { TASK_LABELS } from "@/lib/benchmark-suite";
import { normalizeLocale, DEFAULT_LOCALE, localizedPath } from "@/lib/i18n";
export const dynamic = "force-dynamic";
async function evidence(pair: string) {
  return (await publishedReports(30, pair.split("-vs-")).catch(() => [])).find(
    (r) => reportPairs(r).some((p) => p.join("-vs-") === pair),
  );
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ pair: string; lang: string }>;
}) {
  const { pair, lang } = await params,
    l = normalizeLocale(lang) ?? DEFAULT_LOCALE,
    en = l === "en",
    r = await evidence(pair);
  return {
    ...infoMetadata(
      l,
      `/compare/${pair}`,
      `${pair.replace("-vs-", " vs ")} · TOKRACE`,
      en
        ? "Task evidence, measurement conditions and reproducible comparisons."
        : "任务证据、测量条件与可复跑的对比。",
    ),
    robots: { index: !!r, follow: true },
  };
}
export default async function ComparePage({
  params,
}: {
  params: Promise<{ pair: string; lang: string }>;
}) {
  const { pair, lang } = await params,
    locale = normalizeLocale(lang) ?? DEFAULT_LOCALE,
    en = locale === "en",
    h = (p: string) => localizedPath(p, locale);
  const slugs = pair.split("-vs-");
  if (slugs.length !== 2 || slugs[0] === slugs[1]) notFound();
  const canonical = [...slugs].sort().join("-vs-");
  if (canonical !== pair) permanentRedirect(h(`/compare/${canonical}`));
  const r = await evidence(pair);
  if (!r) {
    const old = await loadComparePair(pair);
    if (!old) notFound();
    return (
      <InfoPage
        locale={locale}
        pathname={`/compare/${pair}`}
        title={`${old.a.model} vs ${old.b.model}`}
        intro={
          en
            ? "Historical community comparison. No matched standard-test evidence is available, so no winner is declared."
            : "历史社区对比。暂无相同条件的标准实测证据，不给出胜负结论。"
        }
        updatedAt={[old.a.lastAt, old.b.lastAt].sort().at(-1)!.slice(0, 10)}
      >
        <p>
          {en
            ? "Community tasks, providers, regions and dates differ."
            : "社区提交的任务、供应商、地区与日期存在差异。"}
        </p>
        {[old.a, old.b].map((m) => (
          <p key={m.model}>
            {m.model} · {m.provider} · {m.samples} {en ? "samples" : "条样本"} ·{" "}
            {m.lastAt.slice(0, 10)}
          </p>
        ))}
        <Link href={h("/reports")}>
          {en ? "Read standard reports" : "查看标准实测报告"}
        </Link>
      </InfoPage>
    );
  }
  const models = r.models.filter((m) => slugs.includes(m.slug)),
    c = r.cases[0];
  return (
    <InfoPage
      locale={locale}
      pathname={`/compare/${pair}`}
      title={models.map((m) => m.name).join(" vs ")}
      intro={
        en
          ? "Compare task pass counts first. A speed comparison requires at least ten complete measurements in each task category."
          : "先比较目标任务的通过数。每类任务两侧均至少 10 条完整测量后，才具备速度对比条件。"
      }
      updatedAt={r.publishedAt.slice(0, 10)}
    >
      <p>
        {r.testedAt.slice(0, 10)} · {r.region} · {r.suiteVersion} ·{" "}
        {isStale(r.testedAt)
          ? en
            ? "Stale"
            : "数据陈旧"
          : en
            ? "Recent"
            : "近期"}
      </p>
      {models.map((m) => (
        <section key={m.id}>
          <h2 className="flex items-center gap-2">
            <ProviderIcon model={m.model} name={m.name} provider={m.provider} />
            {m.name}
          </h2>
          <p>
            {m.provider} · {m.version}
          </p>
          {(r.summaries[m.id] ?? []).map((s) => (
            <p key={s.category}>
              {TASK_LABELS[s.category][locale]}：{s.passed}/{s.attempts}{" "}
              {en ? "passed" : "通过"} ·{" "}
              {en ? "median completion" : "完整耗时中位数"}{" "}
              {s.totalMs == null ? "—" : `${(s.totalMs / 1000).toFixed(2)}s`} ·{" "}
              {!s.speedComparable && (en ? "No speed ranking" : "不判速度胜负")}
            </p>
          ))}
        </section>
      ))}
      <RerunButton
        locale={locale}
        seed={{
          mode: "report",
          prompt: c.prompt,
          task: { caseId: c.id, version: c.version },
          params: r.params,
          endpointRefs: models.map((m) => ({
            model: m.model,
            provider: m.provider,
            name: m.name,
          })),
          reportId: r.id,
          reportVersion: r.version,
        }}
      />
      <p>
        <Link href={h(`/reports/${r.id}`)}>
          {en
            ? "Read all conditions, outputs and failure cases"
            : "查看全部条件、输出和失败案例"}
        </Link>
      </p>
    </InfoPage>
  );
}
