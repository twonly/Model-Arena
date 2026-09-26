export interface ProviderBrand {
  key: string;
  label: string;
  icon: string;
  color: string;
  sourceDomain: string;
}

// Model marks precede company marks; all assets are bundled locally (see SOURCES.md).
const brands = [
  ["claude", "Claude", "claude-color", "#d97757", "claude.ai", /claude/],
  ["anthropic", "Anthropic", "anthropic", "#d97757", "anthropic.com", /anthropic/],
  ["deepseek", "DeepSeek", "deepseek-color", "#4f6cff", "deepseek.com", /deepseek|深度求索/],
  ["gemini", "Gemini", "gemini-color", "#4285f4", "gemini.google.com", /gemini/],
  ["gemma", "Gemma", "gemma-color", "#4285f4", "ai.google.dev", /gemma/],
  ["google", "Google", "google-color", "#4285f4", "ai.google.dev", /google/],
  ["minimax", "MiniMax", "minimax-color", "#ff4f8f", "minimaxi.com", /mini[\s._-]?max|海螺|稀宇|abab(?=\d|\b)/],
  ["moonshot-kimi", "Kimi", "kimi", "#111111", "kimi.com", /kimi|moonshot|月之暗面/],
  ["openai", "OpenAI", "openai", "#111111", "openai.com", /openai|chatgpt|gpt(?=\d|\b)|o[134](?=\b)/],
  ["grok", "Grok", "grok", "#111111", "grok.com", /grok/],
  ["xai", "xAI", "xai", "#111111", "x.ai", /x[\s._-]?ai/],
  ["bytedance-doubao", "豆包 Doubao", "doubao-color", "#1f8cff", "doubao.com", /doubao|豆包|字节|bytedance|volc(?:engine|es)|seed[\s._-]?(?:\d|oss)/],
  ["xiaomi-mimo", "小米 MiMo", "xiaomimimo", "#ff6900", "xiaomimimo.com", /xiaomi|小米|mimo/],
  ["zhipu", "智谱 GLM", "zai", "#3859ff", "z.ai", /zhipu|智谱|chatglm|glm(?=\d|\b)|z[\s._-]?ai|bigmodel/],
  ["qwen", "千问 Qwen", "qwen-color", "#6b5cff", "qwen.ai", /qwen|qwq|通义|千问|阿里|alibaba|aliyun|dashscope/],
  ["hunyuan", "腾讯混元 Hunyuan", "hunyuan-color", "#0052d9", "hunyuan.tencent.com", /hunyuan|混元|tencent|腾讯|hy(?=\d|\b)/],
  ["stepfun", "阶跃星辰 StepFun", "stepfun-color", "#005aff", "stepfun.com", /stepfun|阶跃|step(?=\d|\b)/],
  ["meta", "Meta Llama", "meta-color", "#0668e1", "llama.com", /meta(?=\b)|llama/],
  ["mistral", "Mistral", "mistral-color", "#ff7000", "mistral.ai", /mistral|mixtral|ministral|codestral|devstral|magistral|pixtral/],
  ["cohere", "Cohere", "cohere-color", "#39594d", "cohere.com", /cohere|command[\s._-]?(?:r|a)(?=\d|\b)|aya(?=\d|\b)/],
  ["wenxin", "百度文心 ERNIE", "wenxin-color", "#2932e1", "yiyan.baidu.com", /ernie|wenxin|文心|百度|baidu/],
  ["spark", "讯飞星火 Spark", "spark-color", "#0075ff", "xinghuo.xfyun.cn", /spark|讯飞|星火|iflytek|xfyun|xinghuo/],
  ["baichuan", "百川 Baichuan", "baichuan-color", "#ff631e", "baichuan-ai.com", /baichuan|百川/],
  ["yi", "零一万物 Yi", "yi-color", "#003425", "01.ai", /yi(?=\d|\b)|零一万物|01[.]ai/],
  ["internlm", "书生 InternLM", "internlm-color", "#5b4bff", "intern-ai.org.cn", /internlm|internvl|书生/],
  ["microsoft", "Microsoft Phi", "microsoft-color", "#00a4ef", "microsoft.com", /microsoft|微软|phi(?=\d|\b)/],
  ["nvidia", "NVIDIA Nemotron", "nvidia-color", "#76b900", "nvidia.com", /nvidia|nemotron|英伟达/],
  ["perplexity", "Perplexity", "perplexity-color", "#20808d", "perplexity.ai", /perplexity|sonar|pplx/],
  ["siliconflow", "硅基流动 SiliconFlow", "siliconcloud-color", "#6e29f6", "siliconflow.cn", /siliconflow|siliconcloud|硅基流动/],
  ["groq", "Groq", "groq", "#f55036", "groq.com", /groq/],
  ["openrouter", "OpenRouter", "openrouter", "#6467f2", "openrouter.ai", /openrouter/],
  ["ollama", "Ollama", "ollama", "#111111", "ollama.com", /ollama/],
] as const;

export const PROVIDER_BRANDS: ProviderBrand[] = brands.map(
  ([key, label, icon, color, sourceDomain]) => ({
    key, label, icon: '/provider-icons/' + icon + '.svg', color, sourceDomain,
  }),
);

const matchers = brands.map(([, , , , , pattern]) =>
  new RegExp('(?:^|[^a-z0-9])(?:' + pattern.source + ')', "i"),
);

export function providerBrandFor(provider: string | null | undefined): ProviderBrand | null {
  if (!provider?.trim()) return null;
  // URLs identify hosts, never protocol paths such as /openai or /anthropic.
  let name = provider.trim().toLowerCase();
  if (name.includes("://")) {
    try { name = new URL(name).hostname; } catch { return null; }
  }
  return PROVIDER_BRANDS[matchers.findIndex((pattern) => pattern.test(name))] ?? null;
}

export interface ModelBrandInput {
  model?: string;
  name?: string;
  provider?: string;
  baseUrl?: string;
}

export function modelBrandFor({ model, name, provider, baseUrl }: ModelBrandInput): ProviderBrand | null {
  return providerBrandFor(model) ?? providerBrandFor(name) ??
    providerBrandFor(provider) ?? providerBrandFor(baseUrl);
}

export function providerInitials(provider: string | null | undefined): string {
  const trimmed = provider?.trim();
  if (!trimmed) return "?";
  const asciiWords = trimmed.match(/[A-Za-z0-9]+/g);
  if (asciiWords?.length) {
    const first = asciiWords[0]?.[0] ?? "";
    const second = asciiWords.length > 1 ? asciiWords[1]?.[0] : asciiWords[0]?.[1];
    return (first + (second ?? "")).toUpperCase();
  }
  return Array.from(trimmed).slice(0, 2).join("");
}
