import Image from "next/image";
import { VisualSupplement, type VisualSupplementData } from "./VisualSupplement";
import type { Locale } from "@/lib/i18n";

type VisualAttempt = {
  id: string; mode: string; prompt: string; status: string; totalMs: number | null;
  firstContentMs: number | null; outputTokens: number | null;
  pngPath?: string; svgPath?: string; width?: number; height?: number;
  assessmentZh: string; assessmentEn: string; altZh: string; altEn: string;
};
type VisualTask = { id: string; title: string; titleEn: string; source?: string; rubricZh: string[]; rubricEn: string[] };
type OfficialFigure = { id: string; path: string; url: string; sourcePage: string; width: number; height: number; titleZh: string; titleEn: string; captionZh: string; captionEn: string };
type VisualDisplay = { columns?: 2 | 3; vendor: string; officialDate: string; previousAttempts: number; modeLabels: Record<string, { zh: string; en: string }>; methodZh: string; methodEn: string; officialIntroZh: string; officialIntroEn: string; officialHeadingZh?: string; officialHeadingEn?: string };
export type VisualEvaluationData = { display: VisualDisplay; tasks: VisualTask[]; attempts: VisualAttempt[]; official: OfficialFigure[]; officialSources?: { nameZh: string; nameEn: string; url: string }[]; evidencePath: string; date: string };

import { reviewExcerpt } from "@/lib/review-excerpt";

/** Only PNG/WebP previews are embedded; original SVGs remain downloads. */
export function VisualEvaluation({ data, locale, supplement }: { data: VisualEvaluationData; locale: Locale; supplement?: VisualSupplementData }) {
  const en = locale === "en";
  return <>
    {supplement ? <VisualSupplement data={supplement} en={en} /> : <section id="visual-supplement" className="scroll-mt-6"><h2>{en ? "SVG drawing results" : "SVG 绘图结果"}</h2>{data.tasks.map(task => <article key={task.id} id={`visual-${task.id}`} className="mt-6"><h3 className="font-bold text-ink">{en ? task.titleEn : task.title}</h3><div className={`mt-3 grid grid-cols-1 gap-5 sm:grid-cols-2 ${data.display.columns === 3 ? "lg:grid-cols-3" : ""}`}>{data.attempts.filter(a => a.id === task.id).map(a => <figure key={a.mode} className="overflow-hidden rounded-xl border border-line bg-card"><figcaption className="p-3 text-xs font-bold text-ink">{en ? data.display.modeLabels[a.mode]?.en : data.display.modeLabels[a.mode]?.zh}</figcaption>{a.pngPath && <a href={a.pngPath}><Image src={a.pngPath} width={a.width ?? 1200} height={a.height ?? 900} alt={en ? a.altEn : a.altZh} unoptimized className="aspect-[4/3] h-auto w-full bg-white object-contain" /></a>}<p className="p-3">{reviewExcerpt(en ? a.assessmentEn : a.assessmentZh, en)}</p></figure>)}</div></article>)}</section>}
    <p className="text-xs"><span id="visual-tests" /><a href={data.evidencePath}>{en ? "Original first responses, prompts and parameters" : "原始首轮回答、题目与参数"}</a></p>
    <section id="official-benchmarks" className="scroll-mt-6">
      <h2>{en ? "Official benchmark figures" : "官方跑分"}</h2>
      {data.official.length > 0 && <OfficialFigure figure={data.official[0]} vendor={data.display.vendor} en={en} />}
      {data.official.length > 1 && <details className="mt-4 rounded-xl border border-line bg-card p-4"><summary className="cursor-pointer font-bold text-ink">{en ? "More official figures" : "更多官方图表"} · {data.official.length - 1}</summary><div className="mt-4 space-y-6">{data.official.slice(1).map(figure => <OfficialFigure key={figure.id} figure={figure} vendor={data.display.vendor} en={en} />)}</div></details>}
      <details className="mt-4 rounded-lg border border-line p-4 text-xs"><summary className="cursor-pointer">{en ? "Chart sources and evaluation conditions" : "图表来源与评测条件"}</summary><p>{en ? data.display.officialIntroEn : data.display.officialIntroZh}</p>{data.officialSources?.map(source => <p key={source.url}><a href={source.url}>{en ? source.nameEn : source.nameZh}</a></p>)}</details>
    </section>
  </>;
}

function OfficialFigure({ figure, vendor, en }: { figure: OfficialFigure; vendor: string; en: boolean }) {
  return <figure className="overflow-hidden rounded-xl border border-line bg-card"><h3 className="p-4 font-bold text-ink">{en ? figure.titleEn : figure.titleZh}</h3><a href={figure.path} target="_blank" rel="noopener noreferrer"><Image src={figure.path} width={figure.width} height={figure.height} alt={en ? figure.titleEn : figure.titleZh} unoptimized className="h-auto w-full bg-white" /></a><figcaption className="p-4 text-xs"><p>{reviewExcerpt(en ? figure.captionEn : figure.captionZh, en)}</p><p>{vendor} · <a href={figure.sourcePage}>{en ? "Source" : "发布原文"}</a> · <a href={figure.url}>{en ? "Original image" : "官方原图"}</a></p></figcaption></figure>;
}
