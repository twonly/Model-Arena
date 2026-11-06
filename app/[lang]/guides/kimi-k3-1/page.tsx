import { REVIEW_PRESENTATION_UPDATED_AT } from "@/lib/model-review-presentation";
import Link from "next/link";
import { InfoPage, infoMetadata } from "@/components/InfoPage";
import { JsonLd } from "@/components/JsonLd";
import { BRAND } from "@/lib/brand";
import { normalizeLocale, DEFAULT_LOCALE, localizedPath } from "@/lib/i18n";

const path = "/guides/kimi-k3-1";
const media = "/articles/kimi-k3-1-teaser";
const source = "https://x.com/Kimi_Moonshot/status/2113445757185606062";
const publishedAt = "2026-10-23T15:06:00+08:00";
const modifiedAt = "2026-10-24T09:15:36+08:00";
const titleZh = "Kimi K3.1 发布前瞻：官方 24 秒视频亮出模型名，Three.js 演示抢先看";
const titleEn = "Kimi K3.1 preview: an official 24-second teaser reveals the model name";
const descriptionZh = "Kimi 官方视频出现 Kimi K3.1、high 思考档位与 Three.js 指令。附完整 1080p 视频和关键截图，逐项梳理已展示的信息、编程线索与待公布的发布细节。";
const descriptionEn = "Watch Kimi's full 1080p teaser and key frames: the K3.1 model label, high thinking setting and Three.js prompt, with a clear boundary between official visuals and unverified capabilities.";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const locale = normalizeLocale((await params).lang) ?? DEFAULT_LOCALE;
  const en = locale === "en";
  const title = en ? titleEn : titleZh;
  const description = en ? descriptionEn : descriptionZh;
  const metadata = infoMetadata(locale, path, title, description);
  const images = [{ url: `${media}/terminal.jpg`, width: 1920, height: 1080, alt: en ? "Kimi K3.1 in the official Kimi Code teaser" : "Kimi 官方预告中的 Kimi K3.1 终端画面" }];
  return {
    ...metadata,
    keywords: ["Kimi K3.1", "Kimi Code", "Moonshot AI", "Three.js", "Kimi K3.1 发布", "Kimi K3.1 视频"],
    openGraph: { ...metadata.openGraph, type: "article", publishedTime: publishedAt, modifiedTime: REVIEW_PRESENTATION_UPDATED_AT, images },
    twitter: { ...metadata.twitter, images: [`${media}/terminal.jpg`] },
  };
}

export default async function KimiPreview({ params }: { params: Promise<{ lang: string }> }) {
  const locale = normalizeLocale((await params).lang) ?? DEFAULT_LOCALE;
  const en = locale === "en";
  const title = en ? titleEn : titleZh;
  const description = en ? descriptionEn : descriptionZh;
  const url = `${BRAND.url}${localizedPath(path, locale)}`;
  const scenes = [
    { file: "satellite.jpg", time: "~00:03", zh: "射电望远镜的曲面、支架与机械结构。", en: "A radio telescope with a curved dish, supports and mechanical detail." },
    { file: "branching-tree.jpg", time: "~00:04", zh: "从树干延伸到细枝的白色树状结构。", en: "A white branching structure extending from a trunk into fine twigs." },
    { file: "spiral.jpg", time: "~00:09", zh: "螺旋楼梯与建筑线稿叠加的画面。", en: "A spiral staircase overlaid with architectural linework." },
    { file: "particle-fish.jpg", time: "~00:10", zh: "由彩色线条和透明层次构成的鱼形视觉。", en: "A fish-shaped visual built from colored lines and translucent layers." },
  ];
  const facts = en ? [
    ["Model name", "Kimi K3.1 appears in the official video."],
    ["Product surface", "The opening shows Kimi Code and a high thinking setting."],
    ["Task on screen", "A request to build a procedural 3D scene in Three.js."],
    ["Launch date / access", "No date or public-access instructions in the teaser or the official pages checked for this article."],
    ["API / price / weights", "No K3.1-specific specification established by these sources."],
    ["Independent results", "No TOKRACE K3.1 API test or benchmark in this article."],
  ] : [
    ["模型名称", "官方视频中明确出现 Kimi K3.1。"],
    ["产品入口", "开场是 Kimi Code，状态栏显示 high 思考档位。"],
    ["画面中的任务", "使用 Three.js 构建复杂的程序化 3D 场景。"],
    ["发布日期与开放入口", "这条预告及本次核对的官方页面未给出 K3.1 的确切日期或公开使用说明。"],
    ["API、价格与权重", "上述来源尚不足以确认 K3.1 的正式规格、定价和权重开放安排。"],
    ["独立测试", "本文未调用 K3.1 API，也未产生 TOKRACE 的 K3.1 跑分。"],
  ];
  return (
    <InfoPage locale={locale} pathname={path} title={title} intro={description} updatedAt="2026-10-24">
<JsonLd data={{
        "@context": "https://schema.org",
        "@type": "NewsArticle",
        headline: title,
        description,
        image: [`${BRAND.url}${media}/terminal.jpg`, `${BRAND.url}${media}/moon.jpg`],
        datePublished: publishedAt,
        dateModified: modifiedAt,
        inLanguage: locale,
        mainEntityOfPage: url,
        author: { "@type": "Organization", name: "TOKRACE", url: BRAND.url },
        publisher: { "@type": "Organization", name: "TOKRACE", url: BRAND.url },
        citation: [source, "https://www.kimi.com/code", "https://www.kimi.com/news/"],
        video: {
          "@type": "VideoObject",
          name: en ? "Official Kimi teaser showing K3.1" : "Kimi 官方 K3.1 预告视频",
          description: en ? "Official promotional video from @Kimi_Moonshot, reproduced with source attribution." : "来自 @Kimi_Moonshot 的官方宣传视频，附原帖来源。",
          thumbnailUrl: `${BRAND.url}${media}/terminal.jpg`,
          uploadDate: "2026-10-23T01:41:49Z",
          duration: "PT24S",
          contentUrl: `${BRAND.url}${media}/kimi-k3-1-official-teaser.mp4`,
          creditText: "Kimi / Moonshot AI",
        },
      }} />
<section aria-labelledby="official-video">
        <h2 id="official-video">{en ? "Watch the complete official teaser" : "先看完整官方视频"}</h2>
        <video controls playsInline preload="metadata" poster={`${media}/terminal.jpg`} width={1920} height={1080} className="aspect-video w-full rounded-xl bg-black" aria-label={en ? "Official Kimi K3.1 teaser video" : "Kimi K3.1 官方预告视频"}>
          <source src={`${media}/kimi-k3-1-official-teaser.mp4`} type="video/mp4" />
          <a href={`${media}/kimi-k3-1-official-teaser.mp4`}>{en ? "Open the video" : "打开视频文件"}</a>
        </video>
        <p className="mt-2 text-xs">{en ? "Source: Kimi / Moonshot AI · original 1080p MP4, approximately 24 seconds · official promotional material." : "来源：Kimi / 月之暗面 · 原始 1080p MP4，约 24 秒 · 官方宣传素材。"}{" "}<a href={`${media}/kimi-k3-1-official-teaser.mp4`} download>{en ? "Download video" : "下载视频"}</a></p>
      </section>
<details id="review-details" className="scroll-mt-6 rounded-xl border border-line bg-card p-5">
<summary className="cursor-pointer font-bold text-ink">{en ? "Test details, original answers and sources" : "测试详情、原始回答与来源"}</summary>
<div className="mt-5 space-y-7">
<aside className="rounded-xl border border-line bg-card p-5" aria-label={en ? "Launch update" : "正式发布更新"}>
        <p className="font-bold text-ink">{en ? "October 24 update: Kimi K3.1 Pro has launched." : "10 月 24 日更新：Kimi K3.1 Pro 已正式发布。"}</p>
        <p>{en ? "This page preserves the October 23 prelaunch coverage and the sources available at that time. The launch analysis includes confirmed specifications, official and Artificial Analysis benchmark images, and the current TOKRACE testing status." : "本文保留 10 月 23 日的历史预告及当时来源。正式规格、官方与 Artificial Analysis 的 benchmark 原图，以及 TOKRACE 当前测试进度，请查看发布评析。"}{" "}<Link href={localizedPath("/guides/kimi-k3-1-pro", locale)}>{en ? "Kimi K3.1 Pro launch analysis →" : "Kimi K3.1 Pro 发布评析 →"}</Link></p>
      </aside>
<section>
        <p className="text-base text-ink">
          {en
            ? "Kimi K3.1 has appeared in Kimi's own promotional video. On October 23, the official @Kimi_Moonshot account posted a clip of roughly 24 seconds: a retro computer opens on Kimi Code, with K3.1 named in the terminal, before cutting through a rapid montage of 3D imagery."
            : "Kimi K3.1 已经出现在官方自己的宣传视频里。10 月 23 日，@Kimi_Moonshot 发布了一段约 24 秒的短片：复古电脑上运行着 Kimi Code，终端直接亮出 K3.1 的名字，随后切入一连串 3D 视觉画面。"}
        </p>
        <p>
          {en
            ? "This is a concrete prelaunch signal. The post contains no explanatory text, however, and gives no launch date. Reading it as a sign that a release is approaching is an editorial interpretation; public availability still needs an official announcement."
            : "这是一个很直接的发布预热信号。不过，原帖没有附说明文字，也没有给出发布日期。“新模型快来了”是我们对这次预告的判断；具体何时开放、通过什么入口使用，还要看后续正式公告。"}{" "}
          <a href={source} target="_blank" rel="noreferrer">{en ? "Original official post ↗" : "查看官方原帖 ↗"}</a>
        </p>
      </section>
<section>
        <h2>{en ? "The most useful detail is in the opening terminal" : "最关键的信息，就在开场的终端里"}</h2>
        <p>{en
          ? "The model field names Kimi K3.1, and the bottom status bar shows a high thinking setting. The command asks for a complex procedural scene in Three.js. Together, these visible details place the teaser in an AI coding workflow, rather than establishing a new native image-generation endpoint."
          : "终端的 Model 字段写着 Kimi K3.1，底部状态栏还能看到 high 思考档位。用户输入的任务，则是让它用 Three.js 构建一个复杂的程序化 3D 场景。这几个细节放在一起，指向的是 AI 编程工作流。"}</p>
        <figure className="mt-4">
          <a href={`${media}/model-detail.png`} target="_blank" rel="noreferrer"><img src={`${media}/model-detail.png`} width={720} height={280} alt={en ? "Opening-frame crop showing Kimi K3.1, Kimi Code version 2.2.0 and the Three.js prompt" : "视频开场局部：Kimi K3.1、Kimi Code 的 Version 2.2.0 与 Three.js 指令"} className="h-auto w-full rounded-lg border border-line" /></a>
          <figcaption className="mt-2 text-xs">{en ? "00:00 · Crop of the official video, with no content added. The Version 2.2.0 line is in the Kimi Code client header; it is not a K3.1 model-version claim." : "00:00 · 官方视频开场局部裁切，未添加画面内容。Version 2.2.0 位于 Kimi Code 客户端信息区，不能当作模型版本号。"}</figcaption>
        </figure>
        <blockquote className="mt-4 border-l-2 border-line pl-4 text-ink">Build a complex procedural 3D scene in Three.js.</blockquote>
        <p>{en
          ? "The visible prompt describes code-driven 3D scene construction. A high setting on one screen does not establish the final reasoning controls, defaults, token budgets or availability of K3.1's API."
          : "这句指令的意思是：用 Three.js 构建复杂的程序化三维场景。它强调通过代码组织画面。至于 high 是否对应正式 API 的某个参数、还有哪些档位、默认预算是多少，单凭这一帧还无法确定。"}</p>
      </section>
<section>
        <h2>{en ? "From branching forms to architectural detail" : "从树枝到螺旋建筑，预告展示了什么"}</h2>
        <p>{en
          ? "After the terminal, the clip switches quickly between natural forms, architectural drawings, mechanical structures, translucent surfaces and particle-like scenes. The four frames below show how varied the visual vocabulary is. Click any image to inspect the original-size frame."
          : "终端之后，短片快速切换自然形态、建筑线稿、机械结构、透明材质和粒子感场景。下面四张截图，可以更直观地看到这段预告的视觉跨度。点击图片可查看大图。"}</p>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          {scenes.map((scene) => (
            <figure key={scene.file}>
              <a href={`${media}/${scene.file}`} target="_blank" rel="noreferrer"><img src={`${media}/${scene.file}`} width={1920} height={1080} loading="lazy" alt={en ? scene.en : scene.zh} className="aspect-video h-auto w-full rounded-lg border border-line object-cover" /></a>
              <figcaption className="mt-2 text-xs">{scene.time} · {en ? scene.en : scene.zh}</figcaption>
            </figure>
          ))}
        </div>
        <p className="mt-4">{en
          ? "These are frames from an edited official promotion. The clip does not expose the complete prompts, source projects, dependencies, generation time or number of revisions for each scene. It therefore cannot establish that every shot was produced in one attempt by K3.1, or that a viewer can reproduce it from the opening prompt alone."
          : "这些画面来自经过剪辑的官方宣传片。视频没有逐项公开完整提示词、项目源码、素材依赖、生成耗时和修改次数。因此，我们能确认官方展示了这些视觉效果，但还不能确认每一幕都是 K3.1 一次生成，也不能保证只输入开场那句话就能复现整段效果。"}</p>
      </section>
<section>
        <h2>{en ? "What this suggests about the coding direction" : "它让人期待的，是代码到视觉成品的距离"}</h2>
        <p>{en
          ? "Our reading is that the teaser puts creative coding in the foreground: turning an idea into geometry, materials, lighting and motion that can be inspected on screen. For a developer building a product demo, an interactive explainer or a visual prototype, the useful question is whether the model can make a coherent scene and then reliably change it on request."
          : "我们的解读是，这次预告把创意编程放到了前台：把一句想法转成几何结构、材质、光照与运动，最后让人直接看到成品。对制作产品演示、交互讲解或视觉原型的开发者来说，值得期待的是，模型能否更稳地把这些环节组织起来，并在后续修改时保持一致。"}</p>
        <p>{en
          ? "A finished render is only one part of that story. Reproducible source, correct behavior, stable animation, manageable dependencies and the time spent fixing failures matter just as much. The teaser makes the direction interesting; those questions need actual tasks after access is documented."
          : "一张好看的渲染图，只是其中一步。源码能不能运行、结构是否合理、动画是否稳定、依赖是否容易安装，以及改错需要多少时间，都会决定它能不能进入真实项目。这段视频把期待拉高了，答案仍要落到可复现的任务上。"}</p>
        <figure className="mt-5">
          <a href={`${media}/moon.jpg`} target="_blank" rel="noreferrer"><img src={`${media}/moon.jpg`} width={1920} height={1080} loading="lazy" alt={en ? "The moon near the end of the official Kimi teaser" : "Kimi 官方预告接近结尾处的月球画面"} className="h-auto w-full rounded-xl" /></a>
          <figcaption className="mt-2 text-xs">{en ? "00:20 · The moon near the end of the teaser, before the KIMI closing title." : "00:20 · 接近结尾的月球画面，之后是 KIMI 品牌落版。"}</figcaption>
        </figure>
      </section>
<section>
        <h2>{en ? "Confirmed here, and still awaiting details" : "现在能确认什么，还要等什么"}</h2>
        <div className="overflow-x-auto rounded-lg border border-line">
          <table className="w-full text-left text-sm">
            <thead className="bg-card text-ink"><tr><th scope="col" className="p-3">{en ? "Item" : "项目"}</th><th scope="col" className="p-3">{en ? "Evidence as checked on October 23" : "截至 10 月 23 日本次核对的情况"}</th></tr></thead>
            <tbody>{facts.map(([label, value]) => <tr key={label} className="border-t border-line"><th scope="row" className="min-w-28 p-3 align-top font-medium text-ink">{label}</th><td className="p-3 align-top">{value}</td></tr>)}</tbody>
          </table>
        </div>
        <p className="mt-4">{en
          ? "At the time of this check, the official Kimi Code page and news index still presented K3. That is a dated observation of those pages, not proof that no other access exists. The teaser itself does not justify copying K3's context size, price or benchmark scores into a K3.1 specification."
          : "本次核对时，Kimi Code 官网和官方资讯页仍在展示 K3。这个结论只描述当时查到的页面，不能扩大成对所有入口的判断；同样，也不能把 K3 的上下文、价格或跑分直接填进 K3.1 的规格表。"}</p>
      </section>
<section>
        <h2>{en ? "The next evidence that would matter" : "正式发布时，最值得看的三件事"}</h2>
        <ul>
          <li>{en ? "Exact model identity and access: the official model ID, supported products, API instructions and release conditions." : "模型身份与入口：正式型号、适用产品、API 调用方式和开放条件。"}</li>
          <li>{en ? "Reproducible coding: complete prompts and source, first-attempt success, retained failures and behavior after requested edits." : "可复现的编程表现：完整提示词与源码、首轮成功率、保留的失败，以及多轮修改后的结果。"}</li>
          <li>{en ? "Time and cost: first visible output, total completion time, thinking settings and billed usage under comparable conditions." : "耗时与成本：相同条件下的首个可见输出、完整任务时间、思考档位与实际计费用量。"}</li>
        </ul>
        <p>{en ? "For examples of how TOKRACE separates original task evidence from official demonstrations, see the " : "想了解 TOKRACE 如何区分原始任务证据与官方演示，可以查看 "}<Link href={localizedPath("/guides/deepseek-v4-1-flash-1017", locale)}>DeepSeek V4.1 Flash 1017</Link>{en ? " and " : " 和 "}<Link href={localizedPath("/guides/minimax-m3-1-flash", locale)}>MiniMax M3.1 Flash</Link>{en ? " reviews." : " 的已有评测。"}</p>
      </section>
<section className="border-t border-line pt-6 text-xs">
        <h2>{en ? "Sources and attribution" : "来源与素材说明"}</h2>
        <p><a href={source} target="_blank" rel="noreferrer">{en ? "Kimi official X post" : "Kimi 官方 X 原帖"}</a>{en ? " · October 23, 2026, 09:41 Beijing time. Original post and media metadata retrieved via FxTwitter; all video and frame content is credited to Kimi / Moonshot AI." : " · 2026 年 10 月 23 日北京时间 09:41 发布。原帖与媒体元数据通过 FxTwitter 读取；视频及截图内容版权归 Kimi / 月之暗面所有。"}</p>
        <p><a href="https://www.kimi.com/code" target="_blank" rel="noreferrer">Kimi Code</a>{" · "}<a href="https://www.kimi.com/news/" target="_blank" rel="noreferrer">{en ? "Official Kimi news" : "Kimi 官方资讯"}</a>{en ? " · Checked October 23, 2026. Screenshots were extracted from the downloaded official video; the terminal detail is a crop. This article is a source-based preview with TOKRACE commentary." : " · 2026 年 10 月 23 日核对。文内截图均从抓取的官方视频提取，终端细节图为局部裁切。本文为基于官方素材的发布前瞻，分析部分为 TOKRACE 解读。"}</p>
        <p><a href={`${media}/source-manifest.json`}>{en ? "Media sources, frame mapping and file hashes" : "媒体来源、截图映射与文件哈希"}</a></p>
        <p><Link href={localizedPath("/reports", locale)}>{en ? "← Back to the article and report list" : "← 返回文章与报告列表"}</Link></p>
      </section>
</div>
</details>
</InfoPage>
  );
}
