import Image from "next/image";
import type { Locale } from "@/lib/i18n";
import { CreativeVideo } from "@/components/CreativeVideo";
import { AnimatedEvaluation } from "@/components/AnimatedEvaluation";

export type CreativeMedia = {
  type: "image" | "video";
  path: string;
  narrationPath?: string;
  audioMode?: "music-only";
  audioNoteZh?: string;
  audioNoteEn?: string;
  posterPath?: string;
  animationPath?: string;
  width: number;
  height: number;
  durationSeconds?: number;
  captionZh: string;
  captionEn: string;
  captionsPath?: string;
  captionsLanguage?: string;
  provenance?: { originalSha256: string; sha256: string; noteZh: string; noteEn: string };
};
export type CreativeAttempt = {
  id: string;
  effort: string;
  status: string;
  requests: number | null;
  completedResponses: number | null;
  noteZh: string;
  noteEn: string;
  evidencePath?: string;
};
export type CreativeCase = {
  id: string;
  titleZh: string;
  titleEn: string;
  category: "blender" | "knowledge-video" | "svg" | "svg-animation";
  effort: string;
  summaryZh: string;
  summaryEn: string;
  source: { url: string; titleZh: string; titleEn: string; originalPrompt: string; originalPromptSha256?: string; changesZh: string; changesEn: string };
  references?: { url: string; labelZh: string; labelEn: string }[];
  prompt: string;
  promptSha256?: string;
  metrics: { requests: number | null; completedResponses: number | null; promptTokens: number | null; outputTokens: number | null; wallMs: number | null };
  media: CreativeMedia[];
  downloads: { path: string; labelZh: string; labelEn: string }[];
  assessmentZh: string[];
  assessmentEn: string[];
  checks?: { labelZh: string; labelEn: string; status: "pass" | "partial" | "fail" | "not-tested"; detailZh: string; detailEn: string }[];
  attempts: CreativeAttempt[];
};
export type CreativeEvaluationData = {
  schemaVersion: 1;
  model: string;
  providerLabel?: string;
  workflowNoteZh?: string;
  workflowNoteEn?: string;
  usageNoteZh?: string;
  usageNoteEn?: string;
  date: string;
  publishedAt: string;
  updatedAt: string;
  summaryZh: string;
  summaryEn: string;
  methodZh: string;
  methodEn: string;
  billingZh: string;
  billingEn: string;
  limitationsZh: string[];
  limitationsEn: string[];
  evidencePath: string;
  totals: { requests: number | null; completedResponses: number | null; errors: number | null; interruptedRequests: number | null; promptTokens: number | null; outputTokens: number | null };
  cases: CreativeCase[];
};

import { reviewExcerpt } from "@/lib/review-excerpt";

const kimiNotes: Record<string, [string, string]> = {
  "planetary-reducer": ["齿数、主要尺寸和解析运动关系通过抽样检查。行星架与轴的 UV 有重叠，资产整理还不完整。", "Tooth counts, key dimensions and analytical motion pass sampled checks. UVs overlap on the carrier and shafts, so asset preparation needs more work."],
  "horizontal-steam-engine": ["主要运动参数正确，但活塞越出了缸体，调速器的下连杆也没有跟住重球。贴图和 LOD 已交付，机构连接仍有问题。", "The main motion parameters are correct, but the piston leaves its cylinder and lower governor links do not follow the weights. Textures and LODs are delivered; the mechanical connections need work."],
  "two-bedroom-interior": ["静帧、视频和工程交齐了。外墙尺寸偏大，次卧比例失衡，部分家具没有贴地。", "Stills, video and project files are complete. The exterior is oversized, the second bedroom has wrong proportions, and some furniture floats above the floor."],
  "temple-courtyard": ["主要建筑和装饰齐全，环绕镜头能看清三维空间。主殿屋顶与支撑分离，部分吊杆没有接到梁上。", "The main buildings and decorations form a readable 3D space. The main roof separates from its supports, and some hanging rods do not reach the beams."],
  "jupiter-drydock": ["两次 max 尝试没有交齐，后来以 high 恢复完成工程和四机位图。结构细节丰富，但宇航员悬空，栏杆比例也不对。", "Two max attempts were incomplete; a separate high recovery delivered the project and four views. There is structural detail, but astronauts float above the deck and railing scale is wrong."],
  bookshelf: ["两版书架的尺寸、板厚和等高分格都对。修改参数后需要运行 Python 脚本重建。", "Both shelf variants have the right dimensions, panel thickness and equal compartments. Parameter changes require rerunning the Python builder."],
  circulation: ["三圈次序和主要流向基本正确，但科里奥利段把南北半球画成同一偏转方向。", "The cell order and main flows are largely right, but the Coriolis segment uses the same deflection direction in both hemispheres."],
  derivative: ["核心公式、差商和切线正确。标签碰撞、负 h 段回跳和缺字影响了观看。", "The formulas, difference quotient and tangent are correct. Label collisions, a jump in the negative-h segment and missing glyphs disrupt the film."],
  printer: ["中文手绘风格完整，喷墨与激光流程有区分。曝光光束却穿过感光鼓内部，与表面曝光的解释矛盾。", "The Chinese hand-drawn film distinguishes inkjet and laser printing. The exposure beam passes through the drum interior, contradicting surface exposure."],
  phishing: ["视频完整，域名对齐和认证能力的解释基本正确。From 字段的措辞和部分界面符号还需要修改。", "The complete video explains domain alignment and authentication reasonably well. Wording around the From field and some interface symbols need revision."],
};

function duration(ms: number | null, en: boolean) {
  if (ms == null) return en ? "Not recorded" : "未记录";
  const seconds = Math.round(ms / 1000);
  return en ? `${Math.floor(seconds / 60)}m ${seconds % 60}s` : `${Math.floor(seconds / 60)} 分 ${seconds % 60} 秒`;
}

function MediaFigure({ media, en }: { media: CreativeMedia; en: boolean }) {
  const caption = en ? media.captionEn : media.captionZh;
  return <figure className="min-w-0 overflow-hidden rounded-lg border border-line bg-card">
    {media.type === "video" ? <CreativeVideo path={media.path} narrationPath={media.narrationPath} posterPath={media.posterPath} width={media.width} height={media.height} caption={caption} captionsPath={media.captionsPath} captionsLanguage={media.captionsLanguage} audioNote={media.audioMode === "music-only" ? (en ? "Music and sound effects, no narration." : "配乐与音效，无旁白。") : undefined} en={en} /> : media.animationPath && media.posterPath ? <AnimatedEvaluation poster={media.posterPath} animation={media.animationPath} alt={caption} en={en} /> : <a href={media.path} target="_blank" rel="noopener noreferrer"><Image src={media.path} width={media.width} height={media.height} alt={caption} unoptimized className="block aspect-video h-auto w-full bg-white object-contain" /></a>}
  </figure>;
}

export function CreativeEvaluation({ data, locale }: { data: CreativeEvaluationData; locale: Locale }) {
  const en = locale === "en";
  const groups = [
    { id: "blender", title: en ? "3D modelling" : "3D 建模", cases: data.cases.filter(c => c.category === "blender") },
    { id: "knowledge-video", title: en ? "Knowledge videos" : "知识视频", cases: data.cases.filter(c => c.category === "knowledge-video") },
    { id: "svg", title: en ? "SVG and animation" : "SVG 与动画", cases: data.cases.filter(c => c.category === "svg" || c.category === "svg-animation") },
  ];
  return <>
    <span id="creative-summary" />
    {groups.filter(g => g.cases.length).map(group => <section id={`creative-${group.id}`} key={group.id} className="scroll-mt-6">
      <h2>{group.title}</h2>
      <div className="grid grid-cols-1 items-start gap-5 sm:grid-cols-2">{group.cases.map(item => {
        const [primary, ...more] = item.media;
        const title = en ? item.titleEn : item.titleZh;
        const note = /kimi|k3[.-]1/i.test(data.model) ? kimiNotes[item.id]?.[en ? 1 : 0] : undefined;
        const source = item.downloads.find(d => d.path.endsWith("project-source.zip"));
        const svg = item.downloads.find(d => d.path.endsWith("final.svg"));
        return <section id={`creative-case-${item.id}`} key={item.id} className="min-w-0 scroll-mt-6 overflow-hidden rounded-xl border border-line bg-card">
          {primary && <MediaFigure media={primary} en={en} />}
          <div className="space-y-3 p-4"><h3 className="font-bold text-ink">{title}</h3>
            <p>{note ?? reviewExcerpt(en ? item.summaryEn : item.summaryZh, en)}</p>
            <p className="flex flex-wrap gap-x-4 text-xs">{source && <a href={source.path} download>{en ? "Source project" : "下载工程"}</a>}{svg && <a href={svg.path} download>SVG</a>}</p>
            <details className="border-t border-line pt-3 text-xs"><summary className="cursor-pointer text-ink">{more.length ? (en ? "More views and test details" : "更多视角与测试详情") : (en ? "Test details" : "测试详情")}</summary>
              <div className="mt-3 space-y-3">{more.map(media => <div key={media.path}><MediaFigure media={media} en={en} /><p>{en ? media.captionEn : media.captionZh}</p></div>)}</div>
              <p className="mt-3">{duration(item.metrics.wallMs, en)} · {en ? "Requests / complete responses: " : "请求 / 完整响应："}{item.metrics.requests ?? "—"} / {item.metrics.completedResponses ?? "—"} · {item.metrics.promptTokens?.toLocaleString() ?? "—"} / {item.metrics.outputTokens?.toLocaleString() ?? "—"} {en ? "input / output tokens" : "输入 / 输出 token"}</p>
              <ul>{(en ? item.assessmentEn : item.assessmentZh).map((note, i) => <li key={i}>{note}</li>)}</ul>
              {!!item.checks?.length && <h4 className="mt-3 font-bold text-ink">{en ? "Itemized verification" : "逐项检查"}</h4>}
              <dl className="mt-3 space-y-3">{item.checks?.map((check, i) => <div key={i}><dt className="font-bold text-ink">{en ? check.labelEn : check.labelZh} · {check.status}</dt><dd>{en ? check.detailEn : check.detailZh}</dd></div>)}</dl>
              <p><a href={item.source.url}>{en ? "Task source" : "题目来源"}</a></p><p>{en ? item.source.changesEn : item.source.changesZh}</p>
              {item.references?.map(ref => <p key={ref.url}><a href={ref.url}>{en ? ref.labelEn : ref.labelZh}</a></p>)}
              <div className="my-3 flex flex-wrap gap-x-4 gap-y-2">{item.downloads.filter(d => d !== source && d !== svg).map(d => <a key={d.path} href={d.path} download>{en ? d.labelEn : d.labelZh}</a>)}</div>
              {item.attempts.map(a => <div key={a.id}><p>{a.id} · {a.effort} · {a.status} · {en ? "Requests / complete responses: " : "请求 / 完整响应："}{a.requests ?? "—"} / {a.completedResponses ?? "—"} {a.evidencePath && <a href={a.evidencePath}>{en ? "Run record" : "运行记录"}</a>}</p><p>{en ? a.noteEn : a.noteZh}</p></div>)}
              <details className="mt-3"><summary className="cursor-pointer">{en ? "Source brief and prompt" : "来源概要与提示词"}</summary><pre className="whitespace-pre-wrap break-words">{item.source.originalPrompt}</pre><pre className="mt-3 whitespace-pre-wrap break-words">{item.prompt}</pre><p className="break-all">SHA-256: {item.promptSha256 ?? "—"}</p></details>
            </details>
          </div>
        </section>;
      })}</div>
    </section>)}
    <section id="creative-evidence" className="scroll-mt-6"><p><a href={data.evidencePath} download>{en ? "Download all creative results and source index" : "下载全部创作结果与来源索引"}</a></p>
      <details id="creative-method" className="mt-3 rounded-xl border border-line bg-card p-4"><summary className="cursor-pointer font-bold text-ink">{en ? "Run settings, usage and full notes" : "运行条件、用量与完整说明"}</summary>
        <p>{data.model} · {data.date}</p><p>{en ? data.methodEn : data.methodZh}</p><p>{en ? data.billingEn : data.billingZh}</p><p>{en ? data.workflowNoteEn : data.workflowNoteZh}</p><p>{en ? data.usageNoteEn : data.usageNoteZh}</p>
        <p>{en ? "Visual commentary by AI; dimensions and media checks use scripts." : "画面点评由 AI 完成，尺寸与媒体检查使用程序。"}</p>
        <p>{en ? "Requests / complete responses: " : "请求 / 完整响应："}{data.totals.requests ?? "—"} / {data.totals.completedResponses ?? "—"} · {en ? "Errors / interruptions: " : "错误 / 中断："}{data.totals.errors ?? "—"} / {data.totals.interruptedRequests ?? "—"}</p>
        <p>{data.totals.promptTokens?.toLocaleString() ?? "—"} / {data.totals.outputTokens?.toLocaleString() ?? "—"} {en ? "input / output tokens, including cache and thinking" : "输入 / 输出 token，含缓存与思考"}</p>
        <ul>{(en ? data.limitationsEn : data.limitationsZh).map((note, i) => <li key={i}>{note}</li>)}</ul>
      </details>
    </section>
  </>;
}
