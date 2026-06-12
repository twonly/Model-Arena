import type { ProviderKind } from "./types";

export interface ProviderPreset {
  id: string;
  label: string;
  kind: ProviderKind;
  baseUrl: string;
  /** 建议填写的模型 ID 示例 */
  exampleModels: string[];
  note?: string;
}

export const PROVIDER_PRESETS: ProviderPreset[] = [
  {
    id: "deepseek",
    label: "DeepSeek",
    kind: "openai",
    baseUrl: "https://api.deepseek.com/v1",
    exampleModels: ["deepseek-chat", "deepseek-reasoner"],
  },
  {
    id: "moonshot",
    label: "Kimi 月之暗面",
    kind: "openai",
    baseUrl: "https://api.moonshot.cn/v1",
    exampleModels: ["kimi-k2-turbo-preview", "kimi-latest"],
  },
  {
    id: "zhipu",
    label: "智谱 GLM",
    kind: "openai",
    baseUrl: "https://open.bigmodel.cn/api/paas/v4",
    exampleModels: ["glm-4.6", "glm-4-flash"],
  },
  {
    id: "qwen",
    label: "通义千问",
    kind: "openai",
    baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    exampleModels: ["qwen-plus", "qwen-max", "qwen-turbo"],
  },
  {
    id: "doubao",
    label: "豆包 / 火山方舟",
    kind: "openai",
    baseUrl: "https://ark.cn-beijing.volces.com/api/v3",
    exampleModels: ["doubao-seed-1-6-250615"],
    note: "模型一栏填推理接入点 ID 或模型版本号",
  },
  {
    id: "stepfun",
    label: "阶跃星辰",
    kind: "openai",
    baseUrl: "https://api.stepfun.com/v1",
    exampleModels: ["step-3", "step-2-mini"],
  },
  {
    id: "minimax",
    label: "MiniMax",
    kind: "openai",
    baseUrl: "https://api.minimaxi.com/v1",
    exampleModels: ["MiniMax-M2", "MiniMax-Text-01"],
  },
  {
    id: "siliconflow",
    label: "硅基流动",
    kind: "openai",
    baseUrl: "https://api.siliconflow.cn/v1",
    exampleModels: ["deepseek-ai/DeepSeek-V3", "Qwen/Qwen3-32B"],
  },
  {
    id: "openai",
    label: "OpenAI",
    kind: "openai",
    baseUrl: "https://api.openai.com/v1",
    exampleModels: ["gpt-4o-mini", "gpt-4.1"],
  },
  {
    id: "anthropic",
    label: "Anthropic Claude",
    kind: "anthropic",
    baseUrl: "https://api.anthropic.com",
    exampleModels: ["claude-sonnet-4-6", "claude-haiku-4-5", "claude-opus-4-8"],
  },
  {
    id: "gemini",
    label: "Google Gemini",
    kind: "openai",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
    exampleModels: ["gemini-2.5-flash", "gemini-2.5-pro"],
    note: "使用 Gemini 的 OpenAI 兼容接口",
  },
  {
    id: "xai",
    label: "xAI Grok",
    kind: "openai",
    baseUrl: "https://api.x.ai/v1",
    exampleModels: ["grok-4", "grok-3-mini"],
  },
  {
    id: "groq",
    label: "Groq",
    kind: "openai",
    baseUrl: "https://api.groq.com/openai/v1",
    exampleModels: ["llama-3.3-70b-versatile"],
  },
  {
    id: "openrouter",
    label: "OpenRouter",
    kind: "openai",
    baseUrl: "https://openrouter.ai/api/v1",
    exampleModels: ["deepseek/deepseek-chat", "anthropic/claude-sonnet-4.6"],
  },
  {
    id: "ollama",
    label: "Ollama 本地",
    kind: "openai",
    baseUrl: "http://localhost:11434/v1",
    exampleModels: ["qwen3:8b", "llama3.1"],
    note: "本地模型无需 API Key，随便填一个即可",
  },
  {
    id: "custom",
    label: "自定义（OpenAI 兼容）",
    kind: "openai",
    baseUrl: "https://",
    exampleModels: [],
    note: "任何兼容 /chat/completions 流式接口的服务",
  },
];

/** 速度测评常用的预设 Prompt */
export const PRESET_PROMPTS: { label: string; text: string }[] = [
  {
    label: "5000 字短文（拉满输出）",
    text: "写一篇 5000 字左右的短文，主题是「为什么速度本身就是一种能力」，要有条理。",
  },
  {
    label: "自我介绍（最短测首响）",
    text: "用一句话介绍你自己，并说明你的模型名称和版本。",
  },
  {
    label: "贪吃蛇（代码输出速度）",
    text: "写一个单文件 HTML 贪吃蛇游戏，包含计分和加速逻辑，直接给完整代码。",
  },
  {
    label: "SVG 画鹈鹕骑车（自动渲染预览）",
    text: "Generate an SVG of a pelican riding a bicycle. 直接输出完整的 <svg> 代码（包含 xmlns 属性和 viewBox），不要任何解释文字。",
  },
  {
    label: "推理题（测思考链路）",
    text: "一根绳子烧完要 60 分钟，但燃烧不均匀。现在有两根这样的绳子，如何精确测量 45 分钟？请先仔细思考再回答。",
  },
  {
    label: "翻译长文（中英混合）",
    text: "把下面这段话翻译成英文，再用中文总结成三点：\n\n大模型的推理速度由首 token 时延和吞吐两部分组成。首 token 时延主要取决于 prompt 处理（prefill）阶段的算力，而吞吐则取决于解码（decode）阶段的显存带宽。对实时对话类应用来说，首响应往往比总吞吐更影响体验。",
  },
];
