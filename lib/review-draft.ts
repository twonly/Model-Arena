import { fmtInt, fmtSeconds, fmtTps } from "./format.ts";
import type { ModelEndpoint, RunState } from "./types.ts";

export type ReviewDraftStyle =
  | "xiaohongshu"
  | "article"
  | "technical"
  | "brief";

export interface ReviewDraftRow {
  name: string;
  model: string;
  run: RunState;
}

export interface ReviewDraftPromptInput {
  title: string;
  notes: string;
  prompt: string;
  rows: ReviewDraftRow[];
  style: ReviewDraftStyle;
  thinkingStats: boolean;
  shareUrl?: string;
}

export const REVIEW_DRAFT_SYSTEM_PROMPT = [
  "你是一名严谨的大模型评测编辑，擅长把多模型对比结果整理成可发布的中文评测稿。",
  "只依据用户提供的评测数据写作，不要虚构没有给出的速度、token、事实正确性或模型能力。",
  "如果只能从输出文本观察到倾向，要明确写成“从本次输出看”或“样本有限”。",
  "保留可复查证据：指标、Prompt、模型输出观察、token 口径和分享链接。",
].join("\n");

const STYLE_GUIDE: Record<ReviewDraftStyle, string> = {
  xiaohongshu:
    "小红书风格：开头给 1 句话结论，分点短句，适合截图发布；避免夸张营销词。",
  article:
    "公众号/博客风格：结构完整，包含标题、摘要、方法、速度结论、内容质量观察、适用建议。",
  technical:
    "技术评测风格：更重视方法、指标口径、数据表、局限性和可复现性。",
  brief:
    "简报风格：用最少篇幅输出结论、排名、关键数字、下一步建议。",
};

const MAX_OUTPUT_CHARS = 1600;
const MAX_REASONING_CHARS = 500;

export function reviewDraftGeneratorCandidates(
  endpoints: ModelEndpoint[]
): ModelEndpoint[] {
  return endpoints.filter(
    (ep) =>
      !ep.shared &&
      ep.apiKey.trim() &&
      ep.model.trim() &&
      ep.baseUrl.trim()
  );
}

export function reviewDraftRows(
  rows: ReviewDraftRow[]
): ReviewDraftRow[] {
  return rows.filter(({ run }) => run.metrics || run.error);
}

export function buildReviewDraftPrompt(input: ReviewDraftPromptInput): string {
  const rows = reviewDraftRows(input.rows);
  const metricLines = rows.map((row, index) =>
    formatMetricLine(row, index + 1, input.thinkingStats)
  );
  const outputBlocks = rows.map((row, index) => formatOutputBlock(row, index + 1));
  const missingOfficial = rows.some((row) => row.run.metrics && !row.run.metrics.official);

  return [
    "# 任务",
    "请基于下面这次 TOKRACE/百模竞速评测结果，生成一篇可发布的中文评测稿。",
    "",
    "# 写作风格",
    STYLE_GUIDE[input.style],
    "",
    "# 必须遵守",
    "- 不要虚构任何未提供的指标、测试次数、价格、模型版本或外部事实。",
    "- 内容质量只能基于本次模型输出观察，不能断言模型整体能力。",
    "- 必须同时评价：首 Token 体感、输出速度、峰值速度、token 消耗、输出完整性、Prompt 遵循度。",
    "- 如存在失败或截断模型，要在稿件中说明。",
    "- 如 token 不是官方 usage，要说明“部分 token 为估算”。",
    "- 不要复述全部模型输出，只引用短片段或概括差异。",
    "",
    "# 建议结构",
    "1. 标题：给 3 个可选标题。",
    "2. 一句话结论：直接说明这轮谁快、谁稳、谁更适合发布样本。",
    "3. 测试方法：说明同一 Prompt 并发对比、指标口径和样本局限。",
    "4. 结果表：用 Markdown 表格列出关键指标。",
    "5. 输出质量观察：从事实密度、完整性、是否跑题、token 性价比分析。",
    "6. 适用建议：给不同使用场景推荐模型。",
    "7. 可复查信息：Prompt、分享链接、token 口径说明。",
    "",
    "# 本次评测元信息",
    `标题：${input.title.trim() || "未填写"}`,
    `备注：${input.notes.trim() || "无"}`,
    `是否展示思考统计：${input.thinkingStats ? "是" : "否"}`,
    `分享链接：${input.shareUrl?.trim() || "暂无"}`,
    missingOfficial ? "token 口径：部分模型未返回官方 usage，存在估算。" : "token 口径：本次结果按可用官方 usage 优先。",
    "",
    "# 原始 Prompt",
    input.prompt.trim() || "（空）",
    "",
    "# 指标表",
    metricLines.join("\n"),
    "",
    "# 模型输出摘录",
    outputBlocks.join("\n\n"),
  ].join("\n");
}

function formatMetricLine(
  row: ReviewDraftRow,
  position: number,
  thinkingStats: boolean
): string {
  const { run } = row;
  const m = run.metrics;
  if (!m) {
    return [
      `${position}. ${row.name} (${row.model})`,
      `状态：${run.status}`,
      `错误：${run.error || "未知错误"}`,
    ].join(" | ");
  }
  const parts = [
    `${position}. ${row.name} (${row.model})`,
    `排名：${run.rank ? `#${run.rank}` : "未排名"}`,
    `状态：${run.status}`,
    `首 Token：${fmtSeconds(m.ttftMs)}s`,
    `输出 TPS：${fmtTps(m.contentTps)}`,
    `平均 TPS：${fmtTps(m.avgTps)}`,
    `峰值 TPS：${fmtTps(m.peakTps)}`,
    `输出 Tokens：${fmtInt(m.outputTokens)}${m.official ? "（官方）" : "（估算）"}`,
    `总用时：${fmtSeconds(m.totalMs)}s`,
  ];
  if (thinkingStats) {
    parts.splice(
      4,
      0,
      `思考 TPS：${fmtTps(m.thinkingTps)}`,
      `思考 Tokens：${fmtInt(m.reasoningTokens)}`
    );
  }
  return parts.join(" | ");
}

function formatOutputBlock(row: ReviewDraftRow, position: number): string {
  const text = row.run.text.trim();
  const reasoning = row.run.reasoning.trim();
  const textExcerpt =
    text.length > MAX_OUTPUT_CHARS
      ? `${text.slice(0, MAX_OUTPUT_CHARS)}\n...[输出已截断，原文更长]`
      : text || "（无正文输出）";
  const reasoningExcerpt =
    reasoning.length > MAX_REASONING_CHARS
      ? `${reasoning.slice(0, MAX_REASONING_CHARS)}...[思考摘录已截断]`
      : reasoning;

  return [
    `## ${position}. ${row.name} (${row.model})`,
    row.run.error ? `错误：${row.run.error}` : null,
    reasoningExcerpt ? `思考摘录：${reasoningExcerpt}` : null,
    `正文摘录：${textExcerpt}`,
  ]
    .filter(Boolean)
    .join("\n");
}
