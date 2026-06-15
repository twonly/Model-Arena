/**
 * 品牌常量（单一事实来源）。
 * 中文主名「百模竞速」，英文名 / 域名 TOKRACE。标语走中立双语调性。
 * 改名只改这里；UI / metadata / 结构化数据全部引用本文件。
 *
 * 注意：内部数据标识（localStorage 的 ma.* 键、备份文件的 __app="model-arena"）
 * 不属于品牌字符串，改动会破坏老用户数据，故保持原值，不在此处。
 */
export const BRAND = {
  zh: "百模竞速",
  en: "TOKRACE",
  /** 锁定写法，作默认水印 / 页脚署名 */
  full: "百模竞速 · TOKRACE",
  domain: "tokrace.com",
  url: "https://tokrace.com",
  taglineZh: "大模型速度 · 时延 · 实时实测",
  taglineEn: "Real-time LLM speed & latency benchmark",
  descZh:
    "同一个 Prompt 并发打到多个大模型，实时对比首 Token 时延、思考 / 输出 TPS、峰值速度与 token 数。开源、免费，API Key 只存你本地、服务器不留存。",
  descEn:
    "Run one prompt across many LLMs at once and compare time-to-first-token, thinking / output tokens-per-second and peak speed in real time. Open-source and free; your API key stays in your browser and is never stored or logged on our servers.",
  /** 出品冠名（运营人格，保留） */
  publisher: "AI拯救打工人",
} as const;

export const SEO_KEYWORDS = [
  "大模型速度对比",
  "模型测速",
  "首Token时延",
  "TTFT",
  "tokens per second",
  "输出速度",
  "LLM benchmark",
  "LLM speed test",
  "DeepSeek 速度",
  "Kimi 速度",
  "GPT 速度",
  "Claude 速度",
  "百模竞速",
  "TOKRACE",
];
