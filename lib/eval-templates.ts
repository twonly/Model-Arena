import type { PromptItem } from "./prompts.ts";
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

export const EVAL_TEMPLATE_CATEGORIES: {
  id: EvalTemplateCategory | "all" | "mine";
  label: string;
}[] = [
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
];

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

export function customPromptToEvalTemplate(
  item: PromptItem,
  index: number
): EvalTemplate {
  const title = item.label.trim() || `我的模板 ${index + 1}`;
  return {
    id: `custom-${stableHash(`${title}:${item.text}`)}`,
    source: "custom",
    title,
    description: "从你的自定义 Prompt 保存而来。",
    category: "instruction",
    tags: ["自定义"],
    prompt: item.text,
    scoring: ["输出完整性", "是否满足你的业务标准", "速度表现", "token 消耗"],
    recommendedFor: "你的真实业务任务",
    estimatedMinutes: 2,
    publicSamples: 0,
  };
}

export function buildTemplateArenaSeed(template: EvalTemplate): ArenaSeed {
  return {
    mode: "share-prompt",
    title: `${template.title} · 模型评测`,
    notes: `来自评测模板「${template.title}」：${template.description}（可自己编辑）`,
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

export function templateConfidenceLabel(publicSamples: number, localSamples = 0) {
  return sampleConfidence(publicSamples + localSamples);
}

function stableHash(input: string): string {
  let hash = 5381;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 33) ^ input.charCodeAt(i);
  }
  return (hash >>> 0).toString(36);
}
