import type { PromptItem } from "./prompts.ts";
import { DEFAULT_LOCALE, type Locale } from "./i18n.ts";
import type { ArenaSeed } from "./quickstart.ts";
import { sampleConfidence } from "./quickstart.ts";
import type { HistoryEntry } from "./types.ts";

export type EvalTemplateCategory =
  | "speed"
  | "reasoning"
  | "coding"
  | "instruction"
  | "knowledge"
  | "writing"
  | "vision"
  | "long-context";

export interface EvalTemplate {
  id: string;
  source: "official" | "custom";
  title: string;
  description: string;
  category: EvalTemplateCategory;
  tags: string[];
  prompt: string;
  scoring: string[];
  recommendedFor: string;
  estimatedMinutes: number;
  publicSamples: number;
}

export const EVAL_TEMPLATE_CATEGORIES_BY_LOCALE: Record<
  Locale,
  {
    id: EvalTemplateCategory | "all" | "mine";
    label: string;
  }[]
> = {
  "zh-CN": [
    { id: "all", label: "全部" },
    { id: "speed", label: "速度" },
    { id: "reasoning", label: "推理" },
    { id: "coding", label: "代码" },
    { id: "instruction", label: "指令" },
    { id: "knowledge", label: "知识" },
    { id: "writing", label: "写作" },
    { id: "vision", label: "视觉" },
    { id: "long-context", label: "长文本" },
    { id: "mine", label: "我的" },
  ],
  en: [
    { id: "all", label: "All" },
    { id: "speed", label: "Speed" },
    { id: "reasoning", label: "Reasoning" },
    { id: "coding", label: "Coding" },
    { id: "instruction", label: "Instruction" },
    { id: "knowledge", label: "Knowledge" },
    { id: "writing", label: "Writing" },
    { id: "vision", label: "Vision" },
    { id: "long-context", label: "Long context" },
    { id: "mine", label: "Mine" },
  ],
};

export const EVAL_TEMPLATE_CATEGORIES: {
  id: EvalTemplateCategory | "all" | "mine";
  label: string;
}[] = EVAL_TEMPLATE_CATEGORIES_BY_LOCALE[DEFAULT_LOCALE];

export function evalTemplateCategories(locale: Locale = DEFAULT_LOCALE) {
  return EVAL_TEMPLATE_CATEGORIES_BY_LOCALE[locale];
}

export const OFFICIAL_EVAL_TEMPLATES: EvalTemplate[] = [
  {
    id: "official-speed-long-output",
    source: "official",
    title: "长文输出吞吐",
    description: "用 5000 字输出任务拉开解码速度差异，适合看输出 TPS、峰值速度和截断风险。",
    category: "speed",
    tags: ["TPS", "长输出", "稳定性"],
    prompt:
      "写一篇 5000 字左右的短文，主题是「为什么速度本身就是一种能力」，要有条理。",
    scoring: ["输出 TPS", "峰值 TPS", "总用时", "是否截断", "内容结构"],
    recommendedFor: "长文生成、报告草稿、内容生产工具选型",
    estimatedMinutes: 3,
    publicSamples: 0,
  },
  {
    id: "official-speed-ttft",
    source: "official",
    title: "首 Token 体感",
    description: "极短任务更容易观察首响延迟，适合聊天、Agent、实时交互场景。",
    category: "speed",
    tags: ["TTFT", "首响", "对话"],
    prompt: "用一句话介绍你自己，并说明你的模型名称和版本。",
    scoring: ["首 Token", "总用时", "是否直接回答", "是否幻觉模型版本"],
    recommendedFor: "聊天机器人、Copilot、客服和实时 Agent",
    estimatedMinutes: 1,
    publicSamples: 0,
  },
  {
    id: "official-reasoning-rope",
    source: "official",
    title: "烧绳计时推理",
    description: "经典逻辑题，观察模型是否能给出可执行步骤，而不是只给结论。",
    category: "reasoning",
    tags: ["逻辑", "步骤", "经典题"],
    prompt:
      "一根绳子烧完要 60 分钟，但燃烧不均匀。现在有两根这样的绳子，如何精确测量 45 分钟？请先仔细思考再回答。",
    scoring: ["推理步骤", "结论正确性", "是否解释不均匀燃烧", "输出完整性"],
    recommendedFor: "推理模型、复杂任务代理、教学问答",
    estimatedMinutes: 2,
    publicSamples: 0,
  },
  {
    id: "official-reasoning-math-discount",
    source: "official",
    title: "折扣叠加应用题",
    description: "短数学题，容易暴露优惠券顺序、单位和分步计算问题。",
    category: "reasoning",
    tags: ["数学", "易错", "分步"],
    prompt:
      "一件商品原价 200 元，先打 8 折，再用满 100 减 20 的券，最后实付多少钱？分步说明。",
    scoring: ["最终答案", "计算过程", "单位", "是否说明优惠顺序"],
    recommendedFor: "电商助手、财务问答、轻量推理场景",
    estimatedMinutes: 1,
    publicSamples: 0,
  },
  {
    id: "official-coding-single-html",
    source: "official",
    title: "单文件 HTML 代码生成",
    description: "要求直接输出完整代码，观察代码完整性、可运行性和无解释遵循度。",
    category: "coding",
    tags: ["代码生成", "HTML", "可运行"],
    prompt:
      "写一个单文件 HTML 贪吃蛇游戏，包含计分和加速逻辑，直接给完整代码，不要解释。",
    scoring: ["完整代码", "可运行性", "游戏状态", "是否遵循不要解释", "输出速度"],
    recommendedFor: "代码助手、前端原型、Demo 生成",
    estimatedMinutes: 3,
    publicSamples: 0,
  },
  {
    id: "official-coding-debug",
    source: "official",
    title: "代码调试与修复",
    description: "检查模型是否能识别重复元素丢失等细节 bug，并给出合理修复。",
    category: "coding",
    tags: ["Debug", "Python", "解释"],
    prompt:
      "下面的快排有什么 bug？修正并说明：\n\ndef quicksort(a):\n    if len(a) <= 1: return a\n    p = a[0]\n    left = [x for x in a if x < p]\n    right = [x for x in a if x > p]\n    return quicksort(left) + quicksort(right)",
    scoring: ["bug 定位", "修复代码", "重复元素处理", "解释清晰度"],
    recommendedFor: "代码审查、教学、编程助手",
    estimatedMinutes: 2,
    publicSamples: 0,
  },
  {
    id: "official-instruction-json",
    source: "official",
    title: "严格 JSON 输出",
    description: "高约束格式题，适合看模型是否会夹带解释或破坏 JSON。",
    category: "instruction",
    tags: ["JSON", "格式", "约束"],
    prompt:
      "提取下面这句话里的信息，只输出 JSON（字段：name, age, city），不要任何额外文字：「张伟今年 28 岁，住在杭州。」",
    scoring: ["JSON 合法性", "字段完整", "无额外文字", "抽取准确"],
    recommendedFor: "结构化抽取、工作流、自动化系统",
    estimatedMinutes: 1,
    publicSamples: 0,
  },
  {
    id: "official-knowledge-mmlu-lite",
    source: "official",
    title: "跨学科速答",
    description: "5 个短知识点混合，快速观察知识覆盖和简洁回答能力。",
    category: "knowledge",
    tags: ["MMLU", "知识", "速答"],
    prompt:
      "简要回答以下 5 题，每题一句：1) 光合作用的化学方程式；2) 凯恩斯主义的核心观点；3) 快速排序平均时间复杂度；4) 《赤壁赋》的作者；5) DNA 的双螺旋结构由谁提出。",
    scoring: ["知识准确", "简洁性", "逐题完整", "是否混淆概念"],
    recommendedFor: "通用问答、教育、知识库补全",
    estimatedMinutes: 2,
    publicSamples: 0,
  },
  {
    id: "official-writing-xhs",
    source: "official",
    title: "小红书产品文案",
    description: "观察创作风格、约束长度和分点表达，适合内容生产场景。",
    category: "writing",
    tags: ["创作", "风格", "短文案"],
    prompt:
      "为一款主打「续航 3 天」的无线降噪耳机写一条小红书种草文案，要有 emoji、分点、有记忆点，200 字以内。",
    scoring: ["风格匹配", "长度控制", "卖点提炼", "可发布性"],
    recommendedFor: "营销文案、社媒内容、品牌运营",
    estimatedMinutes: 1,
    publicSamples: 0,
  },
  {
    id: "official-vision-svg",
    source: "official",
    title: "SVG 指令绘图",
    description: "要求输出纯 SVG，测试视觉结构描述、代码完整性和渲染可用性。",
    category: "vision",
    tags: ["SVG", "视觉", "代码"],
    prompt:
      "Generate an SVG of a pelican riding a bicycle. 直接输出完整的 <svg> 代码（包含 xmlns 属性和 viewBox），不要任何解释文字。",
    scoring: ["SVG 完整性", "主体可识别", "无额外解释", "可渲染性"],
    recommendedFor: "图形生成、可视化、创意编码",
    estimatedMinutes: 2,
    publicSamples: 0,
  },
  {
    id: "official-visual-canvas-parallax",
    source: "official",
    title: "Canvas 动态视差场景",
    description:
      "one-shot 生成单文件 HTML + Canvas 动画，测试模型能否一次写出可运行、流畅、有层次的动态效果。",
    category: "vision",
    tags: ["Canvas", "动画", "可预览"],
    prompt:
      "写一个单文件 HTML（只输出完整代码，不要解释），在 16:9 深色画布上用原生 Canvas 实现一辆车向右行驶的循环动画：前景车辆始终可见，远山、树、路灯、地面分层视差滚动，轮胎旋转，有速度仪表和暂停/继续按钮。不要使用外部库。",
    scoring: ["完整 HTML", "Canvas 可运行", "动画流畅", "视差层次", "交互控件"],
    recommendedFor: "创意编码、前端原型、动态视觉模型评测",
    estimatedMinutes: 3,
    publicSamples: 0,
  },
  {
    id: "official-visual-hexagon-ball",
    source: "official",
    title: "六边形弹球物理",
    description:
      "近期最火的「旋转六边形内弹跳小球」推理题：纯 Canvas、无需联网，球是否始终留在六边形内一眼可判，强烈区分模型的物理与碰撞推理。",
    category: "vision",
    tags: ["Canvas", "物理", "推理"],
    prompt:
      "写一个单文件 HTML（只输出完整代码，不要解释），用原生 Canvas 实现：一个小球在一个匀速旋转的正六边形内部弹跳。小球受重力下落，与六边形的六条边发生带能量损失的反弹（注意边在旋转，要考虑墙面速度和切向摩擦），任何时刻都不能穿出六边形。深色背景，小球带运动拖尾。不要使用外部库。",
    scoring: ["完整 HTML", "球始终在内部", "碰撞反弹正确", "重力/摩擦真实感", "旋转流畅"],
    recommendedFor: "推理模型、物理直觉、一次成稿能力评测",
    estimatedMinutes: 3,
    publicSamples: 0,
  },
  {
    id: "official-visual-threejs-orbit",
    source: "official",
    title: "Three.js 3D 场景",
    description:
      "one-shot 生成单文件 Three.js/WebGL 场景，观察空间结构、光照、相机和交互是否一次成型。",
    category: "vision",
    tags: ["Three.js", "3D", "WebGL"],
    prompt:
      "写一个单文件 HTML（只输出完整代码，不要解释）。在 <head> 用 importmap 引入 Three.js（把 `three` 映射到 `https://registry.npmmirror.com/three/0.171.0/files/build/three.module.js`、`three/addons/` 映射到 `https://registry.npmmirror.com/three/0.171.0/files/examples/jsm/`），再用 <script type=\"module\"> 构建可运行 3D 场景：缓慢自转的发光水晶核心、环绕粒子、合理的光照与材质、用 OrbitControls 支持鼠标拖拽旋转与滚轮缩放、canvas 铺满视口并随窗口自适应；若脚本加载失败，在页面上显示明确的错误文字。",
    scoring: ["完整 HTML", "importmap/模块加载", "3D 结构", "光照与材质", "相机/鼠标交互"],
    recommendedFor: "3D 原型、WebGL demo、视觉代码生成评测",
    estimatedMinutes: 3,
    publicSamples: 0,
  },
  {
    id: "official-long-context-summary",
    source: "official",
    title: "长文本结构化摘要",
    description: "需要用户替换正文，适合测长输入理解、信息抽取和结构化输出。",
    category: "long-context",
    tags: ["长文本", "摘要", "抽取"],
    prompt:
      "请阅读我接下来粘贴的文章，输出：1) 一句话主旨；2) 3 个核心论点；3) 一个反方观点。\n\n（在这里粘贴你的长文章）",
    scoring: ["主旨准确", "论点覆盖", "结构清晰", "是否遗漏关键信息"],
    recommendedFor: "研报阅读、文档摘要、知识管理",
    estimatedMinutes: 3,
    publicSamples: 0,
  },
];

export const OFFICIAL_EVAL_TEMPLATES_EN: EvalTemplate[] = [
  {
    id: "official-speed-long-output",
    source: "official",
    title: "Long-form output throughput",
    description:
      "Use a 5,000-word generation task to separate decode speed, useful for output TPS, peak speed and truncation risk.",
    category: "speed",
    tags: ["TPS", "Long output", "Stability"],
    prompt:
      "Write a roughly 5,000-word essay on the topic: why speed itself is a capability. Make it well structured.",
    scoring: ["Output TPS", "Peak TPS", "Total time", "Truncation", "Content structure"],
    recommendedFor: "Long-form generation, report drafting and content production tools",
    estimatedMinutes: 3,
    publicSamples: 0,
  },
  {
    id: "official-speed-ttft",
    source: "official",
    title: "First-token responsiveness",
    description:
      "A very short task makes TTFT easier to observe, suitable for chat, agents and real-time interaction.",
    category: "speed",
    tags: ["TTFT", "Latency", "Chat"],
    prompt: "Introduce yourself in one sentence and state your model name and version.",
    scoring: ["First token", "Total time", "Direct answer", "Model/version hallucination"],
    recommendedFor: "Chatbots, copilots, support agents and real-time agents",
    estimatedMinutes: 1,
    publicSamples: 0,
  },
  {
    id: "official-reasoning-rope",
    source: "official",
    title: "Burning-rope timing puzzle",
    description:
      "A classic logic puzzle that checks whether the model gives executable steps instead of only a conclusion.",
    category: "reasoning",
    tags: ["Logic", "Steps", "Classic"],
    prompt:
      "A rope takes 60 minutes to burn completely, but it burns unevenly. You have two such ropes. How can you measure exactly 45 minutes? Think carefully before answering.",
    scoring: ["Reasoning steps", "Correct conclusion", "Uneven burn explanation", "Completeness"],
    recommendedFor: "Reasoning models, complex task agents and educational Q&A",
    estimatedMinutes: 2,
    publicSamples: 0,
  },
  {
    id: "official-reasoning-math-discount",
    source: "official",
    title: "Stacked discount word problem",
    description:
      "A short math problem that exposes mistakes around coupon order, units and step-by-step calculation.",
    category: "reasoning",
    tags: ["Math", "Error-prone", "Steps"],
    prompt:
      "An item originally costs 200. It is first discounted by 20%, then a coupon subtracts 20 from orders over 100. What is the final price? Show the steps.",
    scoring: ["Final answer", "Calculation process", "Units", "Discount order"],
    recommendedFor: "E-commerce assistants, finance Q&A and lightweight reasoning",
    estimatedMinutes: 1,
    publicSamples: 0,
  },
  {
    id: "official-coding-single-html",
    source: "official",
    title: "Single-file HTML generation",
    description:
      "Ask for complete runnable code and check completeness, executability and whether the model avoids extra explanation.",
    category: "coding",
    tags: ["Code generation", "HTML", "Runnable"],
    prompt:
      "Write a single-file HTML Snake game with scoring and speed-up logic. Output the complete code directly, with no explanation.",
    scoring: ["Complete code", "Runnable behavior", "Game state", "No explanation", "Output speed"],
    recommendedFor: "Coding assistants, frontend prototypes and demo generation",
    estimatedMinutes: 3,
    publicSamples: 0,
  },
  {
    id: "official-coding-debug",
    source: "official",
    title: "Debug and fix code",
    description:
      "Checks whether the model notices the duplicated-element bug and proposes a reasonable fix.",
    category: "coding",
    tags: ["Debug", "Python", "Explanation"],
    prompt:
      "What is wrong with this quicksort? Fix it and explain:\n\ndef quicksort(a):\n    if len(a) <= 1: return a\n    p = a[0]\n    left = [x for x in a if x < p]\n    right = [x for x in a if x > p]\n    return quicksort(left) + quicksort(right)",
    scoring: ["Bug identification", "Fixed code", "Duplicate handling", "Explanation clarity"],
    recommendedFor: "Code review, teaching and programming assistants",
    estimatedMinutes: 2,
    publicSamples: 0,
  },
  {
    id: "official-instruction-json",
    source: "official",
    title: "Strict JSON output",
    description:
      "A high-constraint formatting task that checks whether the model adds explanations or breaks JSON.",
    category: "instruction",
    tags: ["JSON", "Format", "Constraints"],
    prompt:
      'Extract the information from this sentence and output only JSON with fields name, age and city. No extra text: "Zhang Wei is 28 years old and lives in Hangzhou."',
    scoring: ["Valid JSON", "Complete fields", "No extra text", "Extraction accuracy"],
    recommendedFor: "Structured extraction, workflows and automation systems",
    estimatedMinutes: 1,
    publicSamples: 0,
  },
  {
    id: "official-knowledge-mmlu-lite",
    source: "official",
    title: "Cross-domain quick answers",
    description:
      "Five short mixed knowledge questions for a quick read on coverage and concise answering.",
    category: "knowledge",
    tags: ["MMLU", "Knowledge", "Quick answer"],
    prompt:
      "Answer these 5 questions briefly, one sentence each: 1) chemical equation for photosynthesis; 2) core idea of Keynesian economics; 3) average time complexity of quicksort; 4) author of Red Cliff Rhapsody; 5) who proposed the DNA double helix structure.",
    scoring: ["Knowledge accuracy", "Conciseness", "Complete answers", "Concept confusion"],
    recommendedFor: "General Q&A, education and knowledge base completion",
    estimatedMinutes: 2,
    publicSamples: 0,
  },
  {
    id: "official-writing-xhs",
    source: "official",
    title: "Social product copy",
    description:
      "Observe creative style, length control and bullet formatting for content production scenarios.",
    category: "writing",
    tags: ["Creative", "Style", "Short copy"],
    prompt:
      "Write a short social media product recommendation for wireless noise-cancelling earbuds with a 3-day battery life. Use emoji, bullet points and a memorable hook, under 200 words.",
    scoring: ["Style fit", "Length control", "Selling points", "Publishability"],
    recommendedFor: "Marketing copy, social media content and brand operations",
    estimatedMinutes: 1,
    publicSamples: 0,
  },
  {
    id: "official-vision-svg",
    source: "official",
    title: "SVG instruction drawing",
    description:
      "Ask for pure SVG to test visual structure, code completeness and renderability.",
    category: "vision",
    tags: ["SVG", "Vision", "Code"],
    prompt:
      "Generate an SVG of a pelican riding a bicycle. Output only complete <svg> code with xmlns and viewBox, with no explanation.",
    scoring: ["SVG completeness", "Recognizable subject", "No extra explanation", "Renderability"],
    recommendedFor: "Graphic generation, visualization and creative coding",
    estimatedMinutes: 2,
    publicSamples: 0,
  },
  {
    id: "official-visual-canvas-parallax",
    source: "official",
    title: "Canvas parallax animation",
    description:
      "One-shot single-file HTML + Canvas animation task for testing runnable, smooth, layered motion effects.",
    category: "vision",
    tags: ["Canvas", "Animation", "Previewable"],
    prompt:
      "Write a single-file HTML document (output complete code only, no explanation). Use vanilla Canvas on a 16:9 dark scene to animate a car driving to the right in a seamless loop: the foreground car stays visible, distant mountains, trees, streetlights and road layers scroll with parallax, wheels rotate, and there is a speed gauge plus pause/resume button. Do not use external libraries.",
    scoring: ["Complete HTML", "Runnable Canvas", "Smooth animation", "Layered parallax", "Controls"],
    recommendedFor: "Creative coding, frontend prototypes and dynamic visual model reviews",
    estimatedMinutes: 3,
    publicSamples: 0,
  },
  {
    id: "official-visual-hexagon-ball",
    source: "official",
    title: "Hexagon bouncing ball physics",
    description:
      "The recently viral 'ball bouncing inside a rotating hexagon' reasoning task: pure Canvas, no network needed, and whether the ball stays inside is visually obvious — strongly separates models' physics and collision reasoning.",
    category: "vision",
    tags: ["Canvas", "Physics", "Reasoning"],
    prompt:
      "Write a single-file HTML document (output complete code only, no explanation) using vanilla Canvas: a ball bounces inside a steadily rotating regular hexagon. The ball falls under gravity and bounces off the six moving walls with energy loss (account for the walls' rotation, including wall velocity and tangential friction), and must never escape the hexagon at any time. Dark background, with a motion trail on the ball. Do not use external libraries.",
    scoring: ["Complete HTML", "Ball stays inside", "Correct bounce", "Gravity/friction realism", "Smooth rotation"],
    recommendedFor: "Reasoning models, physical intuition and one-shot delivery reviews",
    estimatedMinutes: 3,
    publicSamples: 0,
  },
  {
    id: "official-visual-threejs-orbit",
    source: "official",
    title: "Three.js 3D scene",
    description:
      "One-shot single-file Three.js/WebGL scene task for checking spatial structure, lighting, camera motion and interaction.",
    category: "vision",
    tags: ["Three.js", "3D", "WebGL"],
    prompt:
      "Write a single-file HTML document (output complete code only, no explanation). In <head>, add an importmap mapping `three` to `https://registry.npmmirror.com/three/0.171.0/files/build/three.module.js` and `three/addons/` to `https://registry.npmmirror.com/three/0.171.0/files/examples/jsm/`, then use a <script type=\"module\"> to build a runnable 3D scene: a slowly self-rotating glowing crystal core, orbiting particles, sensible lighting and materials, OrbitControls for mouse-drag rotation and wheel zoom, and a canvas that fills the viewport and resizes with the window; if the scripts fail to load, show clear error text on the page.",
    scoring: ["Complete HTML", "importmap/module load", "3D structure", "Lighting/materials", "Camera/mouse interaction"],
    recommendedFor: "3D prototypes, WebGL demos and visual code generation reviews",
    estimatedMinutes: 3,
    publicSamples: 0,
  },
  {
    id: "official-long-context-summary",
    source: "official",
    title: "Structured long-text summary",
    description:
      "Requires the user to paste source text, useful for testing long-input understanding, extraction and structured output.",
    category: "long-context",
    tags: ["Long text", "Summary", "Extraction"],
    prompt:
      "Read the article I paste next and output: 1) one-sentence thesis; 2) three core arguments; 3) one opposing view.\n\n(Paste your long article here.)",
    scoring: ["Accurate thesis", "Argument coverage", "Clear structure", "Missing key information"],
    recommendedFor: "Research reading, document summarization and knowledge management",
    estimatedMinutes: 3,
    publicSamples: 0,
  },
];

export function officialEvalTemplates(locale: Locale = DEFAULT_LOCALE): EvalTemplate[] {
  return locale === "en" ? OFFICIAL_EVAL_TEMPLATES_EN : OFFICIAL_EVAL_TEMPLATES;
}

export function customPromptToEvalTemplate(
  item: PromptItem,
  index: number,
  locale: Locale = DEFAULT_LOCALE
): EvalTemplate {
  const title = item.label.trim() || (locale === "en" ? `My template ${index + 1}` : `我的模板 ${index + 1}`);
  return {
    id: `custom-${stableHash(`${title}:${item.text}`)}`,
    source: "custom",
    title,
    description:
      locale === "en"
        ? "Saved from your custom prompt."
        : "从你的自定义 Prompt 保存而来。",
    category: "instruction",
    tags: [locale === "en" ? "Custom" : "自定义"],
    prompt: item.text,
    scoring:
      locale === "en"
        ? ["Output completeness", "Your business criteria", "Speed", "Token cost"]
        : ["输出完整性", "是否满足你的业务标准", "速度表现", "token 消耗"],
    recommendedFor: locale === "en" ? "Your real business task" : "你的真实业务任务",
    estimatedMinutes: 2,
    publicSamples: 0,
  };
}

export function buildTemplateArenaSeed(
  template: EvalTemplate,
  locale: Locale = DEFAULT_LOCALE
): ArenaSeed {
  const titleSuffix = locale === "en" ? "Model evaluation" : "模型评测";
  return {
    mode: "share-prompt",
    title: `${template.title} · ${titleSuffix}`,
    notes:
      locale === "en"
        ? `From evaluation template "${template.title}": ${template.description} (editable)`
        : `来自评测模板「${template.title}」：${template.description}（可自己编辑）`,
    prompt: template.prompt,
    templateId: template.id,
    templateTitle: template.title,
  };
}

export function templateHistoryCounts(
  entries: HistoryEntry[]
): Record<string, number> {
  return entries.reduce<Record<string, number>>((acc, entry) => {
    if (!entry.templateId) return acc;
    acc[entry.templateId] = (acc[entry.templateId] ?? 0) + 1;
    return acc;
  }, {});
}

export function templateConfidenceLabel(
  publicSamples: number,
  localSamples = 0,
  locale: Locale = DEFAULT_LOCALE
) {
  return sampleConfidence(publicSamples + localSamples, locale);
}

function stableHash(input: string): string {
  let hash = 5381;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 33) ^ input.charCodeAt(i);
  }
  return (hash >>> 0).toString(36);
}
