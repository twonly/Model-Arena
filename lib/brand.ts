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
  // 规范主机：apex 域 tokrace.com 会 308 跳到 www，故所有 canonical /
  // hreflang / sitemap / OG / JSON-LD 的绝对地址都以 www 为准，避免指向跳转源。
  url: "https://www.tokrace.com",
  githubUrl: "https://github.com/twonly/Model-Arena",
  taglineZh: "开发者与 AI 测评作者的免费开源模型测速台",
  taglineEn: "Free, open-source LLM speed test bench for developers and AI reviewers",
  descZh:
    "TOKRACE 是免费开源的大模型测速与 AI 模型评测工具：同一个 Prompt 并发对比多个 LLM 的首 Token 时延、输出 TPS、峰值速度与稳定性，支持免费模型试用、免费评测样例、分享快照和速度榜。",
  descEn:
    "TOKRACE is a free, open-source LLM speed testing and AI model evaluation bench for developers and AI reviewers. Run free model trials, compare TTFT, output TPS, peak speed and stability, then share evidence snapshots and leaderboards.",
  /** 出品冠名（运营人格，保留） */
  publisher: "AI拯救打工人",
} as const;

/**
 * 默认社媒分享图（文件式路由 app/opengraph-image.tsx，1200×630）。
 * 显式声明给各页 metadata，避免本地化路由下 OG 图丢失。
 * url 用相对路径，由 metadataBase 解析为 www 绝对地址。
 */
export const OG_IMAGE = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: `${BRAND.full} — ${BRAND.taglineEn}`,
} as const;

export const SEO_KEYWORDS = [
  "大模型速度对比",
  "大模型测速工具",
  "免费大模型评测",
  "免费 AI 模型评测",
  "免费模型试用",
  "免费 LLM 评测",
  "开源大模型测速",
  "开源 AI 模型评测工具",
  "AI模型测速",
  "LLM测速",
  "LLM速度对比",
  "模型测速",
  "首Token时延",
  "TTFT",
  "首 Token 延迟",
  "tokens per second",
  "TPS 测试",
  "输出速度",
  "模型响应速度",
  "AI测评工具",
  "模型选型",
  "open source LLM benchmark",
  "open source AI evaluation tool",
  "free LLM benchmark",
  "free AI model evaluation",
  "free model trial",
  "LLM benchmark",
  "LLM speed test",
  "DeepSeek 速度",
  "Kimi 速度",
  "GPT 速度",
  "Claude 速度",
  "百模竞速",
  "TOKRACE",
];
