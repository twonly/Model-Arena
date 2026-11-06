import Image from "next/image";
import { AnimatedEvaluation } from "./AnimatedEvaluation";

type Sample = {request?: { max_tokens?: number; thinking_budget?: number }; id: string; mode: string; status: string; prompt: string; pngPath?: string; svgPath?: string; width?: number; height?: number; totalMs?: number | null; outputTokens?: number | null; firstContentMs?: number | null; attemptNumber?: number; startedAt: string; assessmentZh?: string; assessmentEn?: string; history: {interruptionReason?: string; status: string; totalMs?: number | null; error?: string | null; renderError?: string; startedAt: string}[]; sourceEvidence: string; animationRender?: {path: string};};
export type VisualSupplementData = {columns?: 1 | 2 | 3; introZh?: string; introEn?: string; showAttemptCount?: boolean; budgetNoteZh?: string; budgetNoteEn?: string; pendingAnimation: boolean; pendingReasonZh?: string; pendingReasonEn?: string; failureCounts: {quota?:number;overload:number;connection:number;timeout:number;interrupted:number;truncated:number;invalidSvg:number}; date: string; updatedAt: string; evidencePath: string; requestCount: number; descriptionZh: string; descriptionEn: string; sourceUrl: string; modes: Record<string,{zh:string;en:string}>; groups: {id:string;titleZh:string;titleEn:string;samples:Sample[]}[]};
import { reviewExcerpt } from "@/lib/review-excerpt";

export function VisualSupplement({ data, en }: { data: VisualSupplementData; en: boolean }) {
  return <section id="visual-supplement" className="scroll-mt-6">
    <h2>{en ? "SVG drawings and animation" : "SVG 绘图与动画"}</h2>
    <p>{en ? (data.introEn ?? "Four static drawing tasks and a four-second cycling animation, grouped by the requested thinking setting.") : (data.introZh ?? "四类静态绘图和一段 4 秒骑车动画，按请求的思考档位并排展示。")}</p>
    {data.groups.map(group => <article id={`supplement-${group.id}`} key={group.id} className="mt-7 scroll-mt-6">
      <h3 className="mb-3 text-base font-bold text-ink">{en ? group.titleEn : group.titleZh}</h3>
      <div className={`grid gap-5 ${data.columns === 1 ? "grid-cols-1" : `grid-cols-1 sm:grid-cols-2 ${data.columns === 3 ? "lg:grid-cols-3" : ""}`}`}>
        {group.samples.map(sample => <figure key={sample.mode} className="min-w-0 overflow-hidden rounded-xl border border-line bg-card">
          <figcaption className="p-3 text-xs font-bold text-ink">{en ? (data.modes[sample.mode]?.en ?? sample.mode).replace(/^Requested(?: parameter)?:\s*/i, "").replace(/\s*\(effort omitted\)/i, "") : (data.modes[sample.mode]?.zh ?? sample.mode).replace(/^请求参数[：:]\s*/, "").replace("（省略 effort）", "").replace("关闭 thinking", "关闭思考")}{data.showAttemptCount !== false && <> · {sample.attemptNumber ?? 1} {en ? "request(s)" : "次请求"}</>}</figcaption>
          {sample.animationRender && sample.pngPath ? <AnimatedEvaluation poster={sample.pngPath} animation={sample.animationRender.path} alt={(en ? group.titleEn : group.titleZh) + " · " + sample.mode} en={en} /> : sample.pngPath ? <a href={sample.pngPath} target="_blank" rel="noopener noreferrer"><Image src={sample.pngPath} width={sample.width ?? 1200} height={sample.height ?? 900} alt={(en ? group.titleEn : group.titleZh) + " · " + sample.mode} unoptimized className="aspect-[4/3] h-auto w-full bg-white object-contain" /></a> : <p className="p-4">{en ? "No render was produced in this sequence." : "这组请求没有生成可展示的图片。"}</p>}
          <p className="p-3 text-sm">{reviewExcerpt((en ? sample.assessmentEn : sample.assessmentZh) ?? "", en)}</p>
        </figure>)}
      </div>
      <details className="mt-3 rounded-lg border border-line p-4 text-xs">
        <summary className="cursor-pointer font-bold text-ink">{en ? "Prompts, parameters and attempt records" : "题目、参数与重试记录"}</summary>
        {group.samples.map(sample => <div key={sample.mode} className="mt-4 border-t border-line pt-3">
          <h4 className="font-bold text-ink">{en ? data.modes[sample.mode]?.en : data.modes[sample.mode]?.zh}</h4>
          <p>{en ? sample.assessmentEn : sample.assessmentZh}</p>
          <p>{sample.startedAt.slice(0, 10)} · {en ? "Recorded request time:" : "已记录请求耗时:"} {sample.totalMs == null || sample.history.some(h => h.totalMs == null) ? "≥ " : ""}{((sample.history.reduce((n, h) => n + (h.totalMs ?? 0), 0) + (sample.totalMs ?? 0)) / 1000).toFixed(2)}s · {en ? "This output" : "本次输出"} {sample.outputTokens ?? "—"} token · {en ? "Token limit" : "输出预算"} {sample.request?.max_tokens ?? "—"}</p>
          <p><a href={sample.sourceEvidence}>{en ? "Full request record" : "完整请求记录"}</a>{sample.svgPath && <> · <a href={sample.svgPath}>SVG</a></>}{sample.animationRender && <> · <a href={sample.animationRender.path}>WebP</a></>}</p>
          {sample.history.length > 0 && <ol className="my-3">{sample.history.map((h, i) => <li key={i} className="break-words">#{i + 1} · {h.startedAt} · {h.status} · {h.totalMs == null ? "—" : (h.totalMs / 1000).toFixed(1) + "s"} · {h.interruptionReason ?? h.renderError ?? h.error ?? ""}</li>)}</ol>}
          <details className="mt-2"><summary className="cursor-pointer">{en ? "Exact prompt" : "完整提示词"}</summary><pre className="whitespace-pre-wrap break-words">{sample.prompt}</pre></details>
        </div>)}
      </details>
    </article>)}
    <details className="mt-5 rounded-lg border border-line p-4 text-xs"><summary className="cursor-pointer font-bold text-ink">{en ? "Test settings and data" : "测试设置与数据下载"}</summary>
      <p className="mt-3">{en ? data.descriptionEn : data.descriptionZh}</p>
      <p>{en ? (data.budgetNoteEn ?? "New requests use a 600-second timeout and 12,288 output tokens; up to 65,536 for repeated DeepSeek truncation.") : (data.budgetNoteZh ?? "首轮输出预算 12,288 token、超时 600 秒；重试的具体预算见请求记录。")}</p>
      <p>{en ? "Animations are captured without source edits at 10 fps for four seconds. Click to play; click again to pause." : "动画由模型生成的 SVG 以每秒 10 帧采样 4 秒。点击播放，再次点击暂停。"}</p>
      <p>{data.requestCount} {en ? "request records" : "条请求记录"} · {en ? "Timeouts / interruptions / truncations" : "超时 / 中断 / 截断"}: {data.failureCounts.timeout} / {data.failureCounts.interrupted} / {data.failureCounts.truncated}</p>
      <p><a href={data.evidencePath}>{en ? "Complete data" : "完整数据"}</a> · <a href={data.sourceUrl}>{en ? "Official API documentation" : "官方 API 文档"}</a></p>
      {data.pendingAnimation && <p>{en ? (data.pendingReasonEn ?? "This batch has no completed animation.") : (data.pendingReasonZh ?? "这批记录没有完整动画。")}</p>}
    </details>
  </section>;
}
