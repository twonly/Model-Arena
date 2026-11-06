import type { Locale } from "./i18n";
import type { ArticleSection } from "@/components/ArticleNavigation";

export const REVIEW_PRESENTATION_UPDATED_AT = "2026-11-02T10:30:00Z";
type Bilingual = { zh: string; en: string };
type Presentation = {
  name: string; brand: "kimi" | "deepseek" | "minimax" | "longcat";
  title: Bilingual; description: Bilingual; introduction: Bilingual; background: Bilingual;
  scope: Bilingual; verdict: Bilingual; source: string;
  kind: "visual" | "creative" | "baseline" | "teaser" | "weights";
  related?: { slug: string; label: Bilingual };
};
const kimiSource = "https://www.kimi.ai/blog/kimi-k3-1-pro";
const miniSource = "https://www.minimax.io/blog/minimax-m31f";
const longcatSource = "https://longcat.ai/platform/docs/ChangeLog.html";
const kimiIntro = { zh: "Kimi K3.1 Pro 是月之暗面的推理与编程模型，面向代码开发、三维创作和多步骤智能体任务。", en: "Moonshot AI's Kimi K3.1 Pro focuses on reasoning, coding, 3D creation and multi-step agent tasks." };
const kimiBackground = { zh: "Kimi 于 2026 年 10 月 23 日公布 K3.1 Pro，官方介绍了 1M 上下文，以及编程、3D 和金融研究等方向的升级。模型可通过 Kimi、Kimi Code 和 API 使用。", en: "Kimi introduced K3.1 Pro on October 23, 2026, with a 1M-token context window and improvements in coding, 3D work and financial research. It is available through Kimi, Kimi Code and the API." };
const longIntro = { zh: "LongCat 2.5 Preview 是美团的多模态与编程预览模型，支持图片理解、工具调用和多步骤任务。", en: "Meituan's LongCat 2.5 Preview combines visual understanding, coding and tool use." };
const longBackground = { zh: "美团于 2026 年 9 月 25 日上线 LongCat-2.5-Preview，重点增加图片理解并加强编程能力。这里保留当时的 Preview 测试，11 月发布的正式版另有评测页。", en: "LongCat-2.5-Preview launched on September 25, 2026, adding image understanding and stronger coding. This page retains its Preview tests; the November release has a separate review." };
const miniIntro = { zh: "MiniMax M3.1 Flash 面向编程、电脑操作和长程智能体任务，官方重点强调执行效率与使用成本。", en: "MiniMax M3.1 Flash targets coding, computer use and long agent workflows, with an emphasis on efficiency and cost." };
const miniBackground = { zh: "MiniMax 于 2026 年 10 月 19 日发布 M3.1 Flash，并确认匿名模型 Space Bunny 是其早期版本。官方介绍的升级包括软件开发、多步骤工具调用和电脑操作。", en: "MiniMax released M3.1 Flash on October 19, 2026, identifying Space Bunny as an early version. The release focuses on software development, multi-step tool use and computer operation." };

export const modelReviewPresentations: Record<string, Presentation> = {
  "deepseek-v4-1-flash-1017": {
    description: { zh: "DeepSeek V4.1 Flash 1017 实测：文本、代码、SVG 与骑车动画，比较思考档位，展示原始作品、官方跑分与完整测试记录。", en: "DeepSeek V4.1 Flash 1017 reviewed with text, code, SVG and animation tasks. Compare thinking settings, inspect outputs and download original results." },
    name: "DeepSeek V4.1 Flash 1017", brand: "deepseek", kind: "visual",
    title: { zh: "DeepSeek V4.1 Flash 1017 评测：文本、代码与 SVG", en: "DeepSeek V4.1 Flash 1017 review: text, code and SVG" },
    introduction: { zh: "DeepSeek V4.1 Flash 1017 是 DeepSeek 的多模态模型更新，重点加强编程、工具使用和任务执行效率。", en: "DeepSeek V4.1 Flash 1017 updates DeepSeek's multimodal model, with improvements in coding, tool use and task efficiency." },
    background: { zh: "DeepSeek 于 2026 年 10 月 17 日推出这次更新，API 继续使用 deepseek-flash。官方介绍了代码开发、工具任务和视觉理解的提升，并优化任务耗时与输出长度。", en: "Released on October 17, 2026, this update retains the deepseek-flash API name. DeepSeek highlights gains in software development, tool tasks and visual understanding, with shorter task runtimes and outputs." },
    scope: { zh: "本页整理 10 月 18 日的 30 次文本、6 次代码请求，以及后续四类 SVG 绘图和骑车动画测试。", en: "This review covers 30 text and six code requests from October 18, plus later SVG drawing and cycling-animation tests." },
    verdict: { zh: "短文本处理可靠，代码和绘图也能形成完整结果。主要问题集中在函数边界、局部排版和动画连接；较高思考档位的部分作品更完整，但也用到了重试和更高预算。", en: "Short text tasks are reliable, and code and drawings reach usable forms. The main issues are function edge cases, layout and animation joints. Some higher-thinking outputs are more complete, with retries and larger budgets also involved." },
    source: "https://api-docs.deepseek.com/updates/",
  },
  "kimi-k3-1-pro": {
    description: { zh: "Kimi K3.1 Pro 评测：三个思考档位的文本、代码、SVG 与动画结果，附模型介绍、官方跑分、原始回答和作品下载。", en: "Tested Kimi K3.1 Pro on text, code, SVG and animation at three thinking settings. View outputs, official benchmarks and original response records." },
    name: "Kimi K3.1 Pro", brand: "kimi", kind: "visual", title: { zh: "Kimi K3.1 Pro 评测：文本、代码与视觉创作", en: "Kimi K3.1 Pro review: text, code and visual creation" },
    introduction: kimiIntro, background: kimiBackground,
    scope: { zh: "10 月 24 日的测试覆盖 3 个思考档位，每档包含 15 道文本题、3 道代码题、4 张静态 SVG 和 1 组动画，并附官方与第三方跑分。", en: "The October 24 tests cover three thinking settings, each with 15 text tasks, three code tasks, four static SVGs and one animation, alongside official and third-party benchmarks." },
    verdict: { zh: "文本和短函数均通过固定检查，视觉作品的整体完成度也较高。主要短板在动画关节和局部视觉细节，部分动作看起来仍较机械。", en: "Text and short functions pass the fixed checks, and the visual work is largely complete. Animation joints and local visual details are the main weaknesses, with some movement still looking mechanical." }, source: kimiSource,
    related: { slug: "kimi-k3-1-pro-creative", label: { zh: "Blender 与知识视频评测", en: "Blender and knowledge-video review" } },
  },
  "kimi-k3-1-pro-creative": {
    description: { zh: "Kimi K3.1 Pro 创作评测：6 项 Blender 场景与 4 段知识视频，查看真实作品、结构与知识错误，并下载可编辑工程和源码。", en: "Six Blender projects and four knowledge videos made with Kimi K3.1 Pro. View renders, check strengths and errors, and download editable source." },
    name: "Kimi K3.1 Pro", brand: "kimi", kind: "creative", title: { zh: "Kimi K3.1 Pro 创作评测：3D 与知识视频", en: "Kimi K3.1 Pro creative review: 3D and knowledge videos" },
    introduction: kimiIntro, background: kimiBackground,
    scope: { zh: "这轮让模型制作 6 项 Blender 场景和 4 段知识视频，观察工程可编辑性、尺寸结构、动画和解释准确性。", en: "Six Blender scenes and four knowledge videos test editable projects, dimensions, structure, animation and explanatory accuracy." },
    verdict: { zh: "模型能交付有结构的三维工程和完整视频，参数修改也有较好的可操作性。复杂机械的连接、空间尺度和科普动画的知识表达仍会出错，成品完成度与细节准确性有明显差别。", en: "The model delivers structured 3D projects and complete videos, with practical parameter editing. Complex mechanical joints, spatial scale and scientific explanations still contain errors; finishing the file and getting its details right are separate strengths." }, source: kimiSource,
    related: { slug: "kimi-k3-1-pro", label: { zh: "文本、代码与 SVG 评测", en: "Text, code and SVG review" } },
  },
  "kimi-k3-1": {
    description: { zh: "回看 Kimi K3.1 官方预告：24 秒视频、Kimi Code 与 Three.js 画面，了解视觉编程方向，并前往 K3.1 Pro 正式版评测。", en: "Explore Kimi K3.1's official 24-second teaser, Kimi Code and Three.js scenes, with a link to the later K3.1 Pro release review and measured results." },
    name: "Kimi K3.1", brand: "kimi", kind: "teaser", title: { zh: "Kimi K3.1 发布前瞻：官方视频与视觉编程方向", en: "Kimi K3.1 preview: official video and visual coding" },
    introduction: { zh: "Kimi K3.1 最早出现在月之暗面的官方预告中，视频聚焦用代码构建三维视觉场景。", en: "Kimi K3.1 first appeared in Moonshot's official teaser, focused on building 3D visuals with code." },
    background: { zh: "这篇保留 2026 年 10 月 23 日的预告内容：24 秒官方视频中出现了 Kimi K3.1、Kimi Code 和 Three.js 指令。后续正式发布的 K3.1 Pro 另有完整介绍与评测。", en: "This page preserves the October 23, 2026 teaser. Its 24-second video shows Kimi K3.1, Kimi Code and a Three.js prompt. The later K3.1 Pro release has its own introduction and review." },
    scope: { zh: "本页看官方预告、终端画面和几段视觉示例，梳理当时展示的产品方向。", en: "We examine the official teaser, terminal frames and visual examples to explain the direction shown at the time." },
    verdict: { zh: "预告的重点是从代码生成走向可见的三维成品。这里展示的是官方演示；实际任务表现见后续 K3.1 Pro 评测。", en: "The teaser emphasizes turning code into visible 3D work. These are official demonstrations; measured task results are in the later K3.1 Pro review." },
    source: "https://x.com/Kimi_Moonshot/status/2113445757185606062", related: { slug: "kimi-k3-1-pro", label: { zh: "K3.1 Pro 正式版评测", en: "K3.1 Pro release review" } },
  },
  "longcat-2-5": {
    description: { zh: "LongCat 2.5 Preview 的 10 月 26 日实测：文本、代码、SVG、动画、截图复刻与看图回答，保留原始作品并关联正式版评测。", en: "LongCat 2.5 Preview tested on text, code, SVG, animation, screenshot-to-page and image questions. View original outputs and the separate release review." },
    name: "LongCat 2.5 Preview", brand: "longcat", kind: "visual", title: { zh: "LongCat 2.5 Preview 评测：文本、代码与视觉任务", en: "LongCat 2.5 Preview review: text, code and visual tasks" },
    introduction: longIntro, background: longBackground,
    scope: { zh: "本页整理 10 月 26 日的文本、代码、SVG、骑车动画、截图复刻网页和看图回答测试。", en: "The October 26 tests cover text, code, SVG, cycling animation, screenshot-to-page work and image questions." },
    verdict: { zh: "明确的短文本与函数任务表现较稳，也能生成可辨认的视觉作品。更复杂的布局、动作关系和页面细节仍需修改，模型写出的说明与实际画面偶尔不一致。", en: "Clearly specified short text and function tasks are dependable, with recognizable visual outputs. More complex layouts, motion and page details need refinement, and written explanations sometimes differ from the rendered result." }, source: longcatSource,
    related: { slug: "longcat-2-5-release", label: { zh: "LongCat 2.5 正式版评测", en: "LongCat 2.5 release review" } },
  },
  "longcat-2-5-preview": {
    description: { zh: "LongCat 2.5 Preview 早期评测，保留 10 月 10 日的文本与代码结果及后续 SVG、动画作品，附测试记录和正式版评测入口。", en: "LongCat 2.5 Preview's early text and code tests from October 10, followed by SVG and animation outputs. Includes original records and the release review." },
    name: "LongCat 2.5 Preview", brand: "longcat", kind: "visual", title: { zh: "LongCat 2.5 Preview 早期评测：文本、代码与 SVG", en: "LongCat 2.5 Preview early review: text, code and SVG" },
    introduction: longIntro, background: longBackground,
    scope: { zh: "10 月 10 日测试两组共 30 次文本请求和 3 道代码题，后续补充了四类 SVG 与动画作品。", en: "The October 10 batch contains 30 text requests and three coding tasks, followed by four SVG tasks and animation." },
    verdict: { zh: "短文本任务完成得较好，代码生成会受到思考与输出预算影响。视觉作品可以成形，但精确角度、布局和运动连接的表现不均衡。", en: "Short text tasks work well, while code generation can run into reasoning and output limits. Visual work reaches a recognizable form, with uneven precision in angles, layout and motion." }, source: longcatSource,
    related: { slug: "longcat-2-5-release", label: { zh: "LongCat 2.5 正式版评测", en: "LongCat 2.5 release review" } },
  },
  "longcat-2-5-claude-code": {
    description: { zh: "LongCat 2.5 Preview 在 Claude Code 中完成 15 项创作任务：3D、知识视频、SVG 与动画，展示成品、具体问题和工程下载。", en: "LongCat 2.5 Preview in Claude Code: 15 tasks spanning 3D, knowledge videos, SVG and animation. View finished and partial outputs and download source." },
    name: "LongCat 2.5 Preview", brand: "longcat", kind: "creative", title: { zh: "LongCat 2.5 Preview 创作评测：3D、SVG 与知识视频", en: "LongCat 2.5 Preview creative review: 3D, SVG and video" },
    introduction: longIntro, background: longBackground,
    scope: { zh: "用 Claude Code 驱动 Preview 运行 15 项创作任务，覆盖 6 项 3D、4 项知识视频、4 张 SVG 和 1 段动画。", en: "Claude Code runs Preview through 15 creative tasks: six 3D projects, four knowledge videos, four SVG drawings and an animation." },
    verdict: { zh: "简单绘图和参数化建模已有可用性。复杂工程的完整交付较不稳定，视频解释、构图和动作连接也有具体问题；不少任务只留下了部分作品。", en: "Simple drawing and parametric modelling are useful. Complete delivery becomes less reliable on complex projects, with errors in explanations, framing and motion; several tasks leave only partial work." }, source: longcatSource,
    related: { slug: "longcat-2-5-release", label: { zh: "LongCat 2.5 正式版评测", en: "LongCat 2.5 release review" } },
  },
  "minimax-m3-1-flash": {
    description: { zh: "MiniMax M3.1 Flash 官方 API 评测：40 次文本、6 次代码请求及 low / max 的 SVG 与动画结果，附模型介绍、官方跑分和原始记录。", en: "MiniMax M3.1 Flash reviewed through its official API: text, code, SVG and animation at low and max thinking, with outputs, benchmarks and original records." },
    name: "MiniMax M3.1 Flash", brand: "minimax", kind: "visual", title: { zh: "MiniMax M3.1 Flash 评测：文本、代码与 SVG", en: "MiniMax M3.1 Flash review: text, code and SVG" },
    introduction: miniIntro, background: miniBackground,
    scope: { zh: "本页保留 10 月 20–21 日官方 API 的 40 次文本、6 次代码请求，以及 low / max 两档的 SVG 和动画结果。", en: "This review retains the October 20–21 official-API batch: 40 text requests, six coding requests, and SVG and animation results at low and max." },
    verdict: { zh: "文本与短函数整体完成度较好，较高思考档位的视觉结构和排版更完整。低档位出现了计算、指针角度和动画坐标错误，使用时应重点检查数值与连接关系。", en: "Text and short functions are largely complete, with stronger visual structure and layout at higher thinking. Low-effort outputs include calculation, clock-angle and animation-coordinate errors, making values and connections important checks." }, source: miniSource,
    related: { slug: "minimax-m3-1-flash-open-weights", label: { zh: "公开权重与下载入口", en: "Public weights and downloads" } },
  },
  "minimax-m3-1-flash-preview": {
    description: { zh: "MiniMax M3.1 Flash Preview 的历史实测：15 道文本题、3 道 JavaScript 函数题与 26 项代码检查，附原始回答及正式版评测。", en: "MiniMax M3.1 Flash Preview's historical review: 15 text tasks, three JavaScript functions and 26 code checks, with original answers and release-review links." },
    name: "MiniMax M3.1 Flash Preview", brand: "minimax", kind: "baseline", title: { zh: "MiniMax M3.1 Flash Preview 评测：文本与代码", en: "MiniMax M3.1 Flash Preview review: text and code" },
    introduction: { zh: "MiniMax M3.1 Flash Preview 是正式版之前的预览接口，这篇保留它在 2026 年 10 月 3 日的测试结果。", en: "MiniMax M3.1 Flash Preview precedes the released model. This page retains its October 3, 2026 test results." }, background: miniBackground,
    scope: { zh: "这轮测试包含 15 道短文本题和 3 道 JavaScript 函数题，原始回答和检查记录都保留在下载中。", en: "The batch contains 15 short text tasks and three JavaScript functions, with original answers and checks available below." },
    verdict: { zh: "15 道文本题全部通过，三道函数也通过了 26 项固定检查，表现出较好的格式遵循和基础代码能力。正式版的更多视觉与档位结果另文展示。", en: "All 15 text tasks pass, and the three functions pass 26 fixed checks, showing solid format following and basic coding. The released model's visual and thinking-level tests have a separate review." }, source: miniSource,
    related: { slug: "minimax-m3-1-flash", label: { zh: "M3.1 Flash 正式版评测", en: "M3.1 Flash release review" } },
  },
  "minimax-m3-1-flash-open-weights": {
    description: { zh: "MiniMax M3.1 Flash 公开权重介绍：428B 总参数、约 23B 激活、1M 上下文，整理官方模型卡、权重下载、DSpark 与许可证。", en: "MiniMax M3.1 Flash open weights: 428B total and about 23B active parameters, 1M context, official model card, weight downloads, DSpark and license." },
    name: "MiniMax M3.1 Flash", brand: "minimax", kind: "weights", title: { zh: "MiniMax M3.1 Flash 公开权重：模型介绍与下载", en: "MiniMax M3.1 Flash open weights: overview and downloads" },
    introduction: miniIntro,
    background: { zh: "M3.1 Flash 的 API 于 10 月 19 日发布，官方权重仓库在 10 月 23 日建立，本页于 10 月 24 日核验下载文件。模型采用原生多模态 MoE 架构，总参数 428B，激活约 23B。", en: "The API launched on October 19, the official weights repository opened on October 23, and this page checked downloads on October 24. The native multimodal MoE has 428B total parameters and about 23B active." },
    scope: { zh: "本页整理官方模型卡、权重与 DSpark 下载、架构和许可证。历史 API 的实际任务表现见关联评测。", en: "This page covers the official model card, weights and DSpark downloads, architecture and license. Measured historical API results are linked separately." },
    verdict: { zh: "公开仓库提供了模型文件和推理部署资料，便于研究与自行部署。官方跑分、文件规格和使用许可放在下方，API 实测仍按原批次展示。", en: "The public repository supplies model files and serving information for research and self-hosting. Official benchmarks, file specifications and license details follow; API measurements retain their original batch identity." },
    source: "https://huggingface.co/MiniMaxAI/MiniMax-M3.1-Flash", related: { slug: "minimax-m3-1-flash", label: { zh: "历史 API 实测", en: "Historical API review" } },
  },
};

export function reviewPresentation(path: string) {
  return modelReviewPresentations[path.replace(/^\/guides\//, "")];
}
export function reviewText(text: Bilingual, locale: Locale) { return locale === "en" ? text.en : text.zh; }
export function reviewNavigation(slug: string, locale: Locale): ArticleSection[] {
  const p = modelReviewPresentations[slug], en = locale === "en";
  return [
    { id: "model-introduction", label: en ? "Meet the model" : "模型介绍" },
    { id: "review-overview", label: p.kind === "weights" ? (en ? "Release overview" : "发布概览") : p.kind === "teaser" ? (en ? "What the teaser shows" : "预告概览") : (en ? "Our evaluation" : "评测概览") },
    ...(p.kind === "visual" ? [{ id: "visual-supplement", label: en ? "SVG and animation" : "SVG 与动画" }, { id: "official-benchmarks", label: en ? "Official benchmarks" : "官方跑分" }] : []),
    ...(p.kind === "creative" ? [{ id: "creative-blender", label: en ? "3D modelling" : "3D 建模" }, { id: "creative-knowledge-video", label: en ? "Knowledge videos" : "知识视频" }, ...(slug.startsWith("longcat") ? [{ id: "creative-svg", label: en ? "SVG and animation" : "SVG 与动画" }] : [])] : []),
    ...(p.kind === "teaser" ? [{ id: "official-video", label: en ? "Official video" : "官方视频" }] : []),
    ...(p.kind === "weights" ? [{ id: "downloads", label: en ? "Downloads" : "下载入口" }] : []),
    { id: "review-details", label: en ? "Test details and sources" : "测试详情与来源" },
  ];
}
