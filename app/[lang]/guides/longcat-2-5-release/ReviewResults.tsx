import Image from "next/image";
import { AnimatedEvaluation } from "@/components/AnimatedEvaluation";
import type { CreativeCase, CreativeMedia } from "@/components/CreativeEvaluation";
import type { VisualSupplementData } from "@/components/VisualSupplement";

type Copy = { zh: string; en: string; noteZh?: string; noteEn?: string };
const caseCopy: Record<string, Copy> = {
  bookshelf: { zh: "参数书架", en: "Parametric bookshelf", noteZh: "从 0.8 米宽、三格改到 1 米宽、四格，两份工程的尺寸和 18mm 板厚都对。六张视角图交齐了，是这轮最完整的 3D 作品。", noteEn: "The shelf changes from 0.8m wide with three compartments to 1m with four. Both files have the right dimensions and 18mm panels. With all six views delivered, this is the most complete 3D result in the run." },
  "planetary-reducer": { zh: "行星减速器", en: "Planetary reducer" },
  "horizontal-steam-engine": { zh: "卧式蒸汽机", en: "Horizontal steam engine" },
  "two-bedroom-interior": { zh: "两居室装修", en: "Two-bedroom apartment" },
  "temple-courtyard": { zh: "中式寺庙庭院", en: "Temple courtyard" },
  "jupiter-drydock": { zh: "木星轨道船坞", en: "Jupiter orbital drydock" },
  printer: { zh: "打印机原理 · 108 秒", en: "How a printer works · 108 seconds" },
  phishing: { zh: "识别伪造邮件 · 80 秒", en: "Spotting spoofed email · 80 seconds", noteZh: "基本概念讲得清楚，也提醒认证通过不等于邮件安全。画面上，开场信封遮住了解释文字，勾叉符号缺字；多数运动是卡片平移，因果过程演得还不够。", noteEn: "The basic concepts are clear, including why passing authentication does not guarantee a safe email. The opening envelope covers explanatory text, check and cross symbols are missing, and most motion is sliding cards rather than showing how the mechanisms work." },
  derivative: { zh: "导数：割线变切线", en: "Derivatives: secant to tangent" },
  circulation: { zh: "大气三圈环流", en: "Global atmospheric circulation" },
  "svg-pelican": { zh: "鹈鹕骑自行车", en: "A pelican on a bicycle", noteZh: "长喙、喉囊、车架和脚踏都能认出来，配色也完整。下载的 SVG 还带了动画。", noteEn: "The beak, pouch, frame and pedals are recognizable, with a coherent palette. The downloadable SVG also includes animation." },
  "svg-clock": { zh: "9:41 钟表", en: "A clock showing 9:41", noteZh: "指针角度和数字都对，但几个数字压住了粗刻度，排版还需要收拾。", noteEn: "The hand angles and numerals are right, but several numerals overlap the heavy tick marks." },
  "svg-dashboard": { zh: "季度数据图表", en: "Quarterly dashboard", noteZh: "柱高比例、总计 84 和最佳季度都对。它额外编了财年、美元单位和 Finance 来源，这些信息不在题目里。", noteEn: "The bar proportions, total of 84 and best quarter are right. It invented a fiscal year, dollar units and a Finance source that the prompt never supplied." },
  "svg-poster": { zh: "中文活动海报", en: "Chinese event poster", noteZh: "六段指定中文各出现一次，层级和留白清楚，自行车图标也没有挤住文字。这张完成得最好。", noteEn: "All six required Chinese strings appear exactly once. The hierarchy and spacing are clear, and the bicycle icon leaves room for the text. This is the strongest static drawing." },
  "svg-pelican-animation": { zh: "4 秒骑车动画", en: "Four-second cycling animation", noteZh: "轮子、脚踏和双腿能一起动，循环衔接也顺。抽查 40 个时点，脚端与脚踏的最大偏差约 0.19px；浅色鸟身的对比度偏低。", noteEn: "The wheels, pedals and legs move together, with a smooth loop. Across 40 sampled phases, the largest foot-to-pedal gap is about 0.19px. The pale bird could use more contrast." },
};

function Media({ media, label }: { media: CreativeMedia; label: string }) {
  return media.type === "video"
    ? <video controls playsInline preload="metadata" poster={media.posterPath} width={media.width} height={media.height} aria-label={label} className="block aspect-video h-auto w-full bg-black object-contain">
      <source src={media.path} type="video/mp4" />
      {media.captionsPath && <track kind="subtitles" src={media.captionsPath} srcLang={media.captionsLanguage ?? "en"} label={media.captionsLanguage === "zh" ? "中文" : "English"} />}
      <a href={media.path}>{label}</a>
    </video>
    : <a href={media.path} target="_blank" rel="noopener noreferrer" aria-label={label}>
      <Image src={media.path} width={media.width} height={media.height} alt={label} unoptimized className="block aspect-video h-auto w-full bg-white object-contain" />
    </a>;
}

export function CreativeCases({ items, en }: { items: CreativeCase[]; en: boolean }) {
  return <div className="grid min-w-0 grid-cols-1 items-start gap-5 sm:grid-cols-2">
    {items.map(item => {
      const copy = caseCopy[item.id];
      const title = en ? copy.en : copy.zh;
      const [primary, ...more] = item.media;
      const source = item.downloads.find(file => file.path.endsWith("project-source.zip"));
      const sourceParts = source && /分卷|part 1/i.test(source.labelZh + source.labelEn)
        ? item.downloads.filter(file => /分卷|part\s+\d/i.test(file.labelZh + file.labelEn)) : [];
      const svg = item.downloads.find(file => file.path.endsWith("final.svg"));
      return <section id={`creative-case-${item.id}`} key={item.id} className={`min-w-0 scroll-mt-6 overflow-hidden rounded-xl border border-line bg-card ${item.category === "svg-animation" ? "sm:col-span-2 sm:mx-auto sm:w-full sm:max-w-2xl" : ""}`}>
        {primary && <Media media={primary} label={title} />}
        <div className="space-y-3 p-4">
          <h3 className="text-base font-bold text-ink">{title}</h3>
          <p>{en ? (copy.noteEn ?? item.summaryEn) : (copy.noteZh ?? item.summaryZh)}</p>
          {primary && <p className="flex flex-wrap gap-x-4 text-xs">
            {sourceParts.length ? sourceParts.map((part, index) => <a href={part.path} download key={part.path}>{en ? `Source part ${index + 1}/${sourceParts.length}` : `工程分卷 ${index + 1}/${sourceParts.length}`}</a>) : source && <a href={source.path} download>{en ? "Source project" : "下载工程"}</a>}
            {svg && <a href={svg.path} download>{en ? "SVG source" : "下载 SVG"}</a>}
            {primary.type === "video" && <a href={primary.path} download>{en ? "Download MP4" : "下载视频"}</a>}
          </p>}
          <details className="border-t border-line pt-3 text-xs">
            <summary className="cursor-pointer text-ink">{more.length ? (en ? "More views and files" : "更多视角与工程") : (en ? "Files and references" : "工程与参考资料")}</summary>
            {more.length > 0 && <div className="my-3 grid grid-cols-1 gap-3">{more.map(media => <figure key={media.path}>
              <Media media={media} label={en ? media.captionEn : media.captionZh} />
              <figcaption className="mt-1">{en ? media.captionEn : media.captionZh}</figcaption>
            </figure>)}</div>}
            {!!item.references?.length && <p>{item.references.map(reference => <a key={reference.url} href={reference.url} className="mr-3">{en ? reference.labelEn : reference.labelZh}</a>)}</p>}
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">{item.downloads.filter(file => file !== source && file !== svg && !sourceParts.includes(file)).map(file => <a href={file.path} key={file.path} download>{(en ? file.labelEn : file.labelZh).replace(/^attempt-\d+\s*/i, '')}</a>)}</div>
            <p className="mt-3"><a href={item.source.url}>{en ? "Task source" : "题目来源"}</a>{item.attempts.map(attempt => attempt.evidencePath && <a key={attempt.id} href={attempt.evidencePath} className="ml-4">{en ? "Run record" : "运行记录"}</a>)}</p>
          </details>
        </div>
      </section>;
    })}
  </div>;
}

const pairedNotes: Record<string, { zh: string; en: string }> = {
  pelican: { zh: "开启思考的车架更完整。", en: "With thinking on, the bicycle frame is more complete." },
  clock: { zh: "两边时间都对；开启思考的数字和刻度分得更开。", en: "Both show the right time; thinking on separates numerals from ticks more clearly." },
  dashboard: { zh: "两边数值都对；关闭思考时多加了财年和单位。", en: "Both get the values right; thinking off adds an unsupported fiscal year and unit." },
  poster: { zh: "两边文字都保留了；开启思考的版面更舒展。", en: "Both retain the text; the thinking-on layout has more breathing room." },
  "pelican-animation": { zh: "关闭思考的脚明显脱离脚踏；开启思考后更接近，最大偏差仍约 2.20px。", en: "With thinking off, the feet clearly detach from the pedals. Thinking on is closer, with a maximum gap of about 2.20px." },
};

export function ThinkingComparison({ data, en }: { data: VisualSupplementData; en: boolean }) {
  return <details id="thinking-comparison" className="scroll-mt-6 rounded-xl border border-line bg-card p-4">
    <summary className="cursor-pointer font-bold text-ink">{en ? "Thinking off vs on: five visual tasks" : "开关思考对比：5 道画图题"}</summary>
    <p className="mt-3">{en ? "Thinking on generally produces tidier layouts in these examples. The pictures below show the differences in composition and motion." : "这组题里，开启思考的版面通常更整齐。下面可以直接比较构图与运动上的差别。"}</p>
    {data.groups.map(group => <article id={`supplement-${group.id}`} key={group.id} className="mt-6 scroll-mt-6">
      <h3 className="font-bold text-ink">{en ? group.titleEn : group.titleZh}</h3>
      <p>{en ? pairedNotes[group.id].en : pairedNotes[group.id].zh}</p>
      <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">{group.samples.map(sample => <figure key={sample.mode} className="min-w-0 overflow-hidden rounded-lg border border-line">
        <figcaption className="p-3 text-xs font-bold text-ink">{sample.mode === "disabled" ? (en ? "Thinking off" : "关闭思考") : (en ? "Thinking on" : "开启思考")}</figcaption>
        {sample.animationRender && sample.pngPath ? <AnimatedEvaluation poster={sample.pngPath} animation={sample.animationRender.path} alt={(en ? group.titleEn : group.titleZh) + " · " + sample.mode} en={en} /> : sample.pngPath && <a href={sample.pngPath}><Image src={sample.pngPath} width={sample.width ?? 1200} height={sample.height ?? 900} alt={(en ? group.titleEn : group.titleZh) + " · " + sample.mode} unoptimized className="aspect-[4/3] h-auto w-full bg-white object-contain" /></a>}
        <p className="p-3 text-xs"><a href={sample.sourceEvidence}>{en ? "Test data" : "测试数据"}</a>{sample.svgPath && <> · <a href={sample.svgPath}>SVG</a></>}</p>
      </figure>)}</div>
    </article>)}
  </details>;
}

export type BaselineAttempt = {
  id: string; title: string; titleEn: string; mode: string;
  prompt: string; text: string; pass: boolean;
};

export function BaselineResults({ attempts, en }: { attempts: BaselineAttempt[]; en: boolean }) {
  const tasks = [...new Map(attempts.map(item => [item.id, item])).values()];
  return <details id="baseline-tests" className="scroll-mt-6 rounded-xl border border-line bg-card p-4">
    <summary className="cursor-pointer font-bold text-ink">{en ? "Text and code: six tasks, both modes passed" : "文本与代码：6 道题，开关思考均通过"}</summary>
    <div className="mt-4 overflow-x-auto"><table className="w-full text-left text-xs"><thead><tr className="border-b border-line"><th className="py-2">{en ? "Task" : "题目"}</th><th>{en ? "Off" : "关闭思考"}</th><th>{en ? "On" : "开启思考"}</th></tr></thead><tbody>{tasks.map(task => <tr key={task.id} className="border-b border-line"><td className="py-2 pr-2">{en ? task.titleEn : task.title}</td>{["disabled", "default"].map(mode => <td key={mode}>{attempts.find(item => item.id === task.id && item.mode === mode)?.pass ? (en ? "Pass" : "通过") : (en ? "Fail" : "未通过")}</td>)}</tr>)}</tbody></table></div>
    {attempts.map(item => <details key={item.id + item.mode} className="mt-3 border-t border-line pt-3 text-xs"><summary className="cursor-pointer">{en ? item.titleEn : item.title} · {item.mode === "disabled" ? (en ? "Thinking off" : "关闭思考") : (en ? "Thinking on" : "开启思考")}</summary><h4 className="mt-3 font-bold text-ink">{en ? "Prompt" : "题目"}</h4><pre className="whitespace-pre-wrap break-words">{item.prompt}</pre><h4 className="mt-3 font-bold text-ink">{en ? "Answer" : "回答"}</h4><pre className="max-h-96 overflow-auto whitespace-pre-wrap break-words">{item.text}</pre></details>)}
  </details>;
}
