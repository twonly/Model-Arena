import Link from "next/link";
import { InfoPage, infoMetadata } from "@/components/InfoPage";
import { publishedReports } from "@/lib/benchmark-server";
import { isStale } from "@/lib/benchmark-report";
import { PRELAUNCH_MODELS } from "@/lib/seo-models";
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
      updatedAt={[reports[0]?.publishedAt.slice(0, 10) ?? "", "2026-11-04"].sort().at(-1)}
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
        <h2>{en ? "Creative model reviews" : "创作模型评测"}</h2>
        <article className="rounded-lg border border-line bg-card p-5">
          <h3 className="text-lg font-bold text-ink"><Link href={localizedPath("/guides/nemotron-3-5-super-vl-creative", locale)}>{en ? "NVIDIA Nemotron 3.5 Super VL: Blender, knowledge video and SVG" : "NVIDIA Nemotron 3.5 Super VL：Blender、知识视频与 SVG"}</Link></h3>
          <p className="mt-2">{en ? "2026-11-04 · Eleven tasks through the exact OpenRouter free route, with actual artifacts, source files, individual checks and delivery limitations. Official benchmark figures are shown separately." : "2026-11-04 · 通过精确 OpenRouter 免费路由执行 11 项任务，展示真实作品、源码、逐项检查与交付限制；官方跑分原图区分展示。"}</p>
        </article>
      </section>
      <section>
        <h2>{en ? "Image understanding and creative evaluations" : "视觉读图与创作评测"}</h2>
        <article className="rounded-lg border border-line bg-card p-5">
          <h3 className="text-lg font-bold text-ink"><Link href={localizedPath("/guides/tencent-hy4-creative", locale)}>{en ? "Tencent Hy4: five image-input tests and eleven creative tasks" : "腾讯 Hy4：5 项视觉读图与 11 项创作作品"}</Link></h3>
          <p className="mt-2">{en ? "2026-11-04 · Original image inputs and answers, Blender scenes, knowledge videos, SVG drawings and a cycling animation, with source downloads and concrete observations." : "2026-11-04 · 原始读图输入与回答、Blender 场景、知识视频、SVG 绘图和骑车动画，附源码下载与具体观察。"}</p>
        </article>
      </section>
      <section>
        <h2>{en ? "Google Gemini creative evaluations" : "Google Gemini 创作评测"}</h2>
        {[
          { name: "Gemini 3.8 Flash", slug: "gemini-3-8-flash-creative" },
          { name: "Gemini 4 Argon", slug: "gemini-4-argon-creative" },
        ].map(model => <article key={model.slug} className="mb-4 rounded-lg border border-line bg-card p-5">
          <h3 className="text-lg font-bold text-ink"><Link href={localizedPath(`/guides/${model.slug}`, locale)}>{model.name}</Link></h3>
          <p className="mt-2">{en ? "2026-11-04 · Eleven delivered and inspected works: three Blender tasks, four knowledge videos, three static SVGs and a cycling animation. Original projects, source and quality findings are included." : "2026-11-04 · 11 项作品均已交付并检查：三项 Blender、四部知识视频、三张静态 SVG 与骑车动画，附原生工程、源码和质量问题。"}</p>
        </article>)}
      </section>
      <section>
        <h2>{en ? "SVG and animation reviews" : "SVG 与动画评测"}</h2>
        <article className="rounded-lg border border-line bg-card p-5">
          <h3 className="text-lg font-bold text-ink"><Link href={localizedPath("/guides/dots3-note-preview", locale)}>{en ? "Dots3-Note Preview: free SVG drawings and animation" : "Dots3-Note Preview：免费 SVG 绘图与动画"}</Link></h3>
          <p className="mt-2">{en ? "2026-11-04 · Three static SVGs and a cycling animation through OpenRouter's free route. View original source, measured constraints, official figures and recorded $0 inference cost." : "2026-11-04 · 通过 OpenRouter 免费路由完成三张静态 SVG 和一项骑车动画。附原始源码、约束核查、官方图表与 $0 推理费用记录。"}</p>
        </article>
      </section>
      <section>
        <h2>{en ? "Model news and release previews" : "模型动态与发布前瞻"}</h2>
        <article className="mb-4 rounded-lg border border-line bg-card p-5">
          <h3 className="text-lg font-bold text-ink"><Link href={localizedPath("/guides/tencent-hy4", locale)}>{en ? "Tencent Hy4 launches: vision, agents and benchmarks" : "腾讯 Hy4 正式发布：视觉、电脑操作与 Benchmark 解读"}</Link></h3>
          <p className="mt-2">{en ? "2026-11-04 · Official benchmark originals with analysis across coding, office work, research and computer use, plus API pricing and the new launch film." : "2026-11-04 · 官方 Benchmark 原图与解读：编程、办公、科研和电脑操作。附正式版规格、API 价格与新宣传片。"}</p>
        </article>
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
        <article className="mb-4 rounded-lg border border-line bg-card p-5">
          <h3 className="text-lg font-bold text-ink"><Link href={localizedPath("/guides/kimi-k3-1-pro-creative", locale)}>{en ? "Kimi K3.1 Pro creative tests: complex Blender scenes and knowledge videos" : "Kimi K3.1 Pro 创作评测：复杂 Blender 场景与知识视频"}</Link></h3>
          <p className="mt-2">{en ? "2026-10-27 · Play the actual videos, inspect multiple camera views and download editable projects. Includes source tasks, concrete quality issues, retries and production-audio provenance." : "2026-10-27 · 直接播放实际视频，查看多机位成图和可编辑工程。附题目来源、具体优缺点、失败重试及公开版配音说明。"}</p>
        </article>
        <article className="mb-4 rounded-lg border border-line bg-card p-5">
          <h3 className="text-lg font-bold text-ink"><Link href={localizedPath("/guides/longcat-2-5", locale)}>{en ? "LongCat 2.5 review: Preview tests, frontend cases and version checks" : "LongCat 2.5 解读与评测：Preview 实测、前端案例与版本核查"}</Link></h3>
          <p className="mt-2">{en ? "2026-10-27 · A fresh batch started October 26: text, code, responsive frontend, SVG and animation evidence, plus separate Responses low and chart-reading diagnostics. Historical official benchmark figures retain their version labels." : "2026-10-27 · 26 日启动的新批次：文本、代码、响应式前端、SVG 与动画，另有独立 Responses low 与读图诊断；官方历史 benchmark 图按原版本标注。"}</p>
        </article>
        <article className="mb-4 rounded-lg border border-line bg-card p-5">
          <h3 className="text-lg font-bold text-ink"><Link href={localizedPath("/guides/minimax-m3-1-flash-open-weights", locale)}>{en ? "MiniMax M3.1 Flash open weights: 428B parameters, downloads and version differences" : "MiniMax M3.1 Flash 权重公开：428B 参数、下载入口与版本区别"}</Link></h3>
          <p className="mt-2">{en ? "2026-10-24 · Release information: official specifications, scores and license. Distinguishes public weights from the API review, Preview and Space Bunny; no new TOKRACE tests." : "2026-10-24 · 权重发布资料：官方规格、成绩与许可证。区分公开权重、API 评测、Preview 和 Space Bunny；本页未新增本站实测。"}</p>
        </article>
        <article className="mb-4 rounded-lg border border-line bg-card p-5">
          <h3 className="text-lg font-bold text-ink"><Link href={localizedPath("/guides/kimi-k3-1-pro", locale)}>{en ? "Kimi K3.1 Pro review: benchmarks, code, SVG and animations" : "Kimi K3.1 Pro 评测：Benchmark 原图、代码、SVG 与动画"}</Link></h3>
          <p className="mt-2">{en ? "2026-10-24 · Native Anthropic Messages evaluation and an independent recovery batch after the quota reset. Compare three animation groups, inspect benchmark originals and official videos, and retain the historical Pro limit snapshot and every failure." : "2026-10-24 · Anthropic Messages 原生接口评测与额度恢复后的独立补测。三组动画并排对照，附跑分原图、官方视频，保留 Pro 频限历史截图与全部失败记录。"}</p>
        </article>
        <article className="rounded-lg border border-line bg-card p-5">
          <h3 className="text-lg font-bold text-ink"><Link href={localizedPath("/guides/kimi-k3-1", locale)}>{en ? "Kimi K3.1 preview: the official 24-second video and key frames" : "Kimi K3.1 发布前瞻：官方 24 秒视频亮出模型名，Three.js 演示抢先看"}</Link></h3>
          <p className="mt-2">{en ? "2026-10-23 · Official teaser, full video and screenshots. Source-based reporting with clearly labeled commentary." : "2026-10-23 · 官方预告、完整视频与关键截图。梳理已确认信息与待公布细节，附来源及解读。"}</p>
        </article>
      </section>
      <section>
        <h2>{en ? "First-look reviews" : "模型首测文章"}</h2>
        {PRELAUNCH_MODELS.filter((m, i, all) => m.reviewPath && all.findIndex((other) => other.reviewPath === m.reviewPath) === i).map((m) => (
          <p key={m.slug}><Link href={localizedPath(m.reviewPath!, locale)}>{m.name}</Link> · {en ? "Original answers and test conditions; separate from standard reports." : "附原始回答与测试条件，单独说明测量路径。"}</p>
        ))}
      </section>
      <Link href={localizedPath("/method", locale)}>
        {en ? "Read the method and limitations" : "查看方法与限制"}
      </Link>
    </InfoPage>
  );
}
