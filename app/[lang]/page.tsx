import Link from "next/link";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Credit } from "@/components/Credit";
import { infoMetadata } from "@/components/InfoPage";
import { publishedReports } from "@/lib/benchmark-server";
import { isStale } from "@/lib/benchmark-report";
import { normalizeLocale, DEFAULT_LOCALE, localizedPath } from "@/lib/i18n";
export const dynamic = "force-dynamic";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const l = normalizeLocale((await params).lang) ?? DEFAULT_LOCALE;
  return infoMetadata(
    l,
    "/",
    l === "en"
      ? "Choose a model with your own tasks · TOKRACE"
      : "用你的任务，选出更合适的大模型 · TOKRACE",
    l === "en"
      ? "Compare task quality, latency and cost with reproducible evidence."
      : "用真实任务比较大模型的效果、速度和成本，每个结论都有证据，可以自己复跑。",
  );
}
export default async function Landing({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const locale = normalizeLocale((await params).lang) ?? DEFAULT_LOCALE,
    en = locale === "en",
    h = (p: string) => localizedPath(p, locale);
  const reports = await publishedReports().catch(() => []);
  const latest = reports.find(
    (r) =>
      !r.models.some(
        (m) => m.availableUntil && Date.parse(m.availableUntil) <= Date.now(),
      ),
  );
  return (
    <main className="mx-auto max-w-6xl px-5 pb-14 sm:px-8">
      <nav className="flex flex-wrap items-center justify-between gap-4 border-b border-line py-5">
        <Link className="text-xl font-black tracking-tight" href={h("/")}>
          TOKRACE
          <span className="ml-2 text-xs font-medium text-faint">百模竞速</span>
        </Link>
        <div className="flex flex-wrap items-center gap-5 text-sm">
          {[
            ["/arena", en ? "Compare" : "对比"],
            ["/models", en ? "Models" : "模型"],
            ["/reports", en ? "Reports" : "报告"],
            ["/pricing", en ? "Pricing" : "价格"],
          ].map(([path, label]) => (
            <Link key={path} href={h(path)}>
              {label}
            </Link>
          ))}
          <LanguageSwitcher />
        </div>
      </nav>
      <section className="grid gap-10 py-14 sm:py-24 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <p className="mb-5 text-xs font-bold uppercase tracking-[.18em] text-accent">
            Real tasks. Measured evidence.
          </p>
          <h1
            className="max-w-3xl text-4xl font-black leading-tight tracking-tight sm:text-6xl"
            style={{ fontFamily: "var(--font-title)" }}
          >
            {en
              ? "Choose a model with your own tasks."
              : "用你的任务，选出更合适的大模型"}
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-faint">
            {en
              ? "Compare quality, speed and cost. Inspect the evidence, then rerun the same task yourself."
              : "用真实任务，比较大模型的效果、速度和成本。查看每个结论的证据，再亲自复跑。"}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={h("/arena?sample=1")}
              className="rounded-md bg-accent px-5 py-3.5 font-bold text-white"
            >
              {en ? "Start a comparison" : "开始一次对比"} →
            </Link>
            <Link
              href={h("/reports")}
              className="rounded-md border border-ink px-5 py-3.5 font-bold"
            >
              {en ? "View test reports" : "查看最新实测"}
            </Link>
          </div>
          <p className="mt-4 text-xs text-faint">
            {en
              ? "Prepare a three-model comparison without signing up. Use trial quota or your own API keys."
              : "无需注册即可准备三模型对比；使用体验额度或自己的 API Key。"}
          </p>
        </div>
        <div className="self-center rounded-xl border border-line bg-card p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-faint">
            {en ? "How a comparison works · demo" : "对比流程演示 · 非实测数据"}
          </p>
          {[
            en ? "Complete the task" : "任务是否完成",
            en ? "Wait for the answer" : "等待答案多久",
            en ? "Inspect the cost" : "实际费用多少",
          ].map((label, i) => (
            <div key={label} className="mt-6">
              <div className="mb-2 flex justify-between text-sm">
                <span>{`0${i + 1} · ${label}`}</span>
                <span className="text-faint">{["✓", "→", "¥"][i]}</span>
              </div>
              <div className="h-2 rounded bg-paper">
                <div
                  className="h-2 rounded bg-ink"
                  style={{ width: `${90 - i * 20}%` }}
                />
              </div>
            </div>
          ))}
          <p className="mt-6 border-t border-line pt-4 text-sm text-faint">
            {en
              ? "Quality is marked unassessed until an explicit task check passes."
              : "未经明确任务校验，效果显示为「尚未评估」。"}
          </p>
        </div>
      </section>
      <section className="border-t border-line py-10">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">
            {en ? "Latest published evidence" : "最新已发布实测"}
          </h2>
          <Link className="text-sm underline" href={h("/reports")}>
            {en ? "All reports" : "全部报告"} →
          </Link>
        </div>
        {latest ? (
          <article className="rounded-lg border border-line bg-card p-6">
            <p className="text-sm text-faint">
              {latest.testedAt.slice(0, 10)} · {latest.attemptCount}{" "}
              {en ? "attempts" : "次尝试"} · hkg1 ·{" "}
              {isStale(latest.testedAt)
                ? en
                  ? "Retest pending"
                  : "待复测"
                : en
                  ? "Recent"
                  : "近期数据"}
            </p>
            <h3 className="my-3 text-xl font-bold">
              {latest.models.map((m) => m.name).join(" · ")}
            </h3>
            <p>
              {en
                ? "JSON extraction, instruction constraints and grounded QA — pass counts, failure cases and original outputs."
                : "JSON 抽取、指令约束与材料问答：查看通过数、失败案例和原始回答。"}
            </p>
            <Link
              className="mt-4 inline-block font-bold underline"
              href={h(`/reports/${latest.id}`)}
            >
              {en ? "Inspect results" : "阅读结果与适用条件"} →
            </Link>
          </article>
        ) : (
          <div className="rounded-lg border border-dashed border-line p-6">
            <p>
              {en
                ? "The standard test pipeline is preparing its first evidence-backed report. Try the versioned tasks yourself now."
                : "标准实测正在准备首份证据完整的报告。你可以先体验版本化任务，自行对比。"}
            </p>
            <Link className="mt-3 inline-block underline" href={h("/arena")}>
              {en ? "Try the tasks" : "体验标准任务"} →
            </Link>
          </div>
        )}
      </section>
      <section className="grid gap-6 border-t border-line py-10 sm:grid-cols-3">
        {[
          [
            "01",
            en ? "Define success" : "先定义任务通过",
            en
              ? "Use a versioned check or inspect the original output."
              : "使用版本化校验，或直接检查原始输出。",
          ],
          [
            "02",
            en ? "Compare equal conditions" : "再比较相同条件",
            en
              ? "Keep provider, region, settings and measurement window explicit."
              : "明确接入点、地区、参数与测量时段。",
          ],
          [
            "03",
            en ? "Keep the evidence" : "保留完整证据",
            en
              ? "Export results and return to the same report version."
              : "导出结果，随时回到同一份报告版本。",
          ],
        ].map(([n, title, body]) => (
          <article key={n}>
            <span className="num text-accent">{n}</span>
            <h2 className="my-3 text-lg font-bold">{title}</h2>
            <p className="text-sm leading-7 text-faint">{body}</p>
          </article>
        ))}
      </section>
      <nav
        aria-label={en ? "More tools" : "更多工具"}
        className="border-t border-line py-6"
      >
        <h2 className="mb-3 font-bold">{en ? "More tools" : "更多工具"}</h2>
        <div className="flex flex-wrap gap-2">
          {[
            ["/templates", en ? "Test templates" : "评测模板"],
            ["/stats", en ? "Community speed leaderboard" : "社区速度榜"],
            ["/best/cheapest", en ? "Lowest API prices" : "省钱榜"],
            ["/board", en ? "Voting board" : "人气投票榜"],
            ["/gallery", en ? "Showcase" : "作品集"],
            [
              "/providers/orcarouter",
              en ? "Connect OrcaRouter" : "OrcaRouter 接入",
            ],
            ["/invite", en ? "Invite rewards" : "邀请奖励"],
          ].map(([path, label]) => (
            <Link
              key={path}
              href={h(path)}
              className="rounded-md border border-line bg-card px-3 py-3 text-sm hover:border-ink"
            >
              {label}
            </Link>
          ))}
        </div>
      </nav>
      <footer className="flex flex-wrap justify-between gap-4 border-t border-line pt-6 text-sm">
        <Credit />
        <div className="flex flex-wrap gap-4">
          <Link href={h("/method")}>{en ? "Methodology" : "测试方法"}</Link>
          <Link href={h("/guides/json-extraction")}>
            {en ? "JSON selection guide" : "JSON 抽取选型指南"}
          </Link>
          <Link href={h("/privacy")}>{en ? "Privacy" : "隐私"}</Link>
        </div>
      </footer>
    </main>
  );
}
