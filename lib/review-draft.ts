import { countChars, fmtInt, fmtSeconds, fmtTps } from "./format.ts";
import type { Locale } from "./i18n.ts";
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
  locale?: Locale;
}

export const REVIEW_DRAFT_SYSTEM_PROMPT = [
  "你是一名严谨的大模型评测编辑，擅长基于已有评测稿做总结、润色和结构优化。",
  "只依据用户提供的基础评测稿写作，不要虚构没有给出的速度、token、测试次数、事实正确性或模型能力。",
  "如果只能从输出文本观察到倾向，要明确写成“从本次输出看”或“样本有限”。",
  "保留可复查证据：指标、Prompt、模型输出观察、token 口径和分享链接；不要改写事实数据。",
].join("\n");

export const REVIEW_DRAFT_SYSTEM_PROMPT_EN = [
  "You are a rigorous LLM review editor. You summarize, polish, and structure reviews from existing benchmark evidence.",
  "Write only from the review draft provided by the user. Do not invent speed, token counts, sample counts, factual accuracy, or model capability claims that are not present.",
  "When you can only infer tendencies from this run's outputs, say 'in this run' or 'with limited samples'.",
  "Preserve verifiable evidence: metrics, Prompt, output observations, token basis, and share link. Do not alter factual data.",
].join("\n");

export function reviewDraftSystemPrompt(locale: Locale = "zh-CN"): string {
  return locale === "en" ? REVIEW_DRAFT_SYSTEM_PROMPT_EN : REVIEW_DRAFT_SYSTEM_PROMPT;
}

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

const STYLE_GUIDE_EN: Record<ReviewDraftStyle, string> = {
  xiaohongshu:
    "Short social post style: start with a one-sentence conclusion, use short bullet points, make it image-post friendly, and avoid exaggerated marketing language.",
  article:
    "Blog/article style: full structure with title, summary, method, speed conclusion, content-quality observations, and usage recommendations.",
  technical:
    "Technical review style: emphasize method, metric definitions, data table, limitations, and reproducibility.",
  brief:
    "Briefing style: use the fewest words to cover conclusion, ranking, key numbers, and next steps.",
};

const MAX_OUTPUT_CHARS = 1600;
const MAX_REASONING_CHARS = 500;
const MAX_FIXED_APPENDIX_CHARS = 900;

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

export function buildFixedReviewDraft(input: ReviewDraftPromptInput): string {
  const en = input.locale === "en";
  const rows = reviewDraftRows(input.rows);
  const completed = rows.filter((row) => row.run.metrics);
  const failures = rows.filter((row) => !row.run.metrics && row.run.error);
  const missingOfficial = rows.some((row) => row.run.metrics && !row.run.metrics.official);
  const fastestTtft = pickMin(completed, (row) => row.run.metrics?.ttftMs);
  const fastestOutput = pickMax(completed, (row) => row.run.metrics?.contentTps);
  const fastestPeak = pickMax(completed, (row) => row.run.metrics?.peakTps);
  const shortestOutput = pickMin(completed, (row) => row.run.metrics?.outputTokens);
  const longestOutput = pickMax(completed, (row) => row.run.metrics?.outputTokens);

  const lines: string[] = [];
  lines.push(`# ${input.title.trim() || (en ? "Model Review Draft" : "模型评测稿")}`);
  if (input.notes.trim()) lines.push("", `> ${input.notes.trim().replace(/\n/g, "\n> ")}`);
  if (en) {
    lines.push(
      "",
      "## One-line conclusion",
      buildOneLineConclusion({
        total: rows.length,
        completed: completed.length,
        failures: failures.length,
        fastestTtft,
        fastestOutput,
        shortestOutput,
        locale: "en",
      }),
      "",
      "## Test method",
      "- The same Prompt was sent to multiple models concurrently to reduce time-of-day and ordering bias.",
      "- Speed focuses on TTFT, output TPS, average TPS, peak TPS, and total duration.",
      "- Content quality observations are based only on this run and do not prove long-term model stability or factual accuracy.",
      missingOfficial
        ? "- Token basis: some models did not return official usage, so relevant token counts are estimated."
        : "- Token basis: provider official usage is preferred when available.",
      "",
      "## Key metrics table",
      buildMetricTable(rows, input.thinkingStats, "en"),
      "",
      "## Speed observations",
      ...buildSpeedObservations({ fastestTtft, fastestOutput, fastestPeak, shortestOutput, longestOutput, locale: "en" }),
      "",
      "## Output quality observations",
      ...buildQualityObservations(rows, "en"),
      "",
      "## Publishable conclusions",
      ...buildPublishableConclusions({ fastestTtft, fastestOutput, shortestOutput, failures, locale: "en" }),
      "",
      "## Original Prompt",
      input.prompt.trim() || "(empty)"
    );
  } else {
    lines.push(
      "",
      "## 一句话结论",
      buildOneLineConclusion({
        total: rows.length,
        completed: completed.length,
        failures: failures.length,
        fastestTtft,
        fastestOutput,
        shortestOutput,
      }),
      "",
      "## 测试方法",
      "- 同一 Prompt 对多个模型并发发起请求，减少先后顺序带来的时段偏差。",
      "- 速度重点看首 Token 时延、输出 TPS、平均 TPS、峰值 TPS 和总用时。",
      "- 内容质量只基于本次输出做观察，不代表模型长期稳定能力或事实正确性。",
      missingOfficial
        ? "- token 口径：部分模型未返回官方 usage，相关 token 数为估算。"
        : "- token 口径：优先使用厂商返回的官方 usage。",
      "",
      "## 关键指标表",
      buildMetricTable(rows, input.thinkingStats),
      "",
      "## 速度观察",
      ...buildSpeedObservations({ fastestTtft, fastestOutput, fastestPeak, shortestOutput, longestOutput }),
      "",
      "## 输出质量观察",
      ...buildQualityObservations(rows),
      "",
      "## 可发布结论",
      ...buildPublishableConclusions({ fastestTtft, fastestOutput, shortestOutput, failures }),
      "",
      "## 原始 Prompt",
      input.prompt.trim() || "（空）"
    );
  }
  if (input.shareUrl?.trim()) {
    lines.push("", en ? "## Verifiable link" : "## 可复查链接", input.shareUrl.trim());
  }
  lines.push("", en ? "## Model output excerpts" : "## 模型输出摘录", buildFixedOutputAppendix(rows, input.locale));
  if (missingOfficial) {
    lines.push(
      "",
      en
        ? "> Note: tokens marked as estimated are not provider official usage."
        : "> 注：表格中标注“估算”的 token 不是厂商官方 usage。"
    );
  }
  return lines.join("\n");
}

export function buildReviewDraftPrompt(input: ReviewDraftPromptInput): string {
  const en = input.locale === "en";
  const rows = reviewDraftRows(input.rows);
  const missingOfficial = rows.some((row) => row.run.metrics && !row.run.metrics.official);
  const fixedDraft = buildFixedReviewDraft(input);

  if (en) {
    return [
      "# Task",
      "Based on the TOKRACE base review draft below, produce a publishable English summary or polished review.",
      "",
      "# Writing style",
      STYLE_GUIDE_EN[input.style],
      "",
      "# Requirements",
      "- Do not invent metrics, sample counts, prices, model versions, or external facts that are not in the base draft.",
      "- Do not alter model names, rankings, speeds, tokens, errors, or share links in the tables.",
      "- Content-quality claims must be grounded in this run's outputs and cannot assert overall model capability.",
      "- Cover TTFT experience, output speed, peak speed, token usage, output completeness, and Prompt following.",
      "- Mention failed or truncated models if any exist.",
      "- If tokens are not official usage, state that some tokens are estimated.",
      "- Do not repeat all model outputs. Quote only short excerpts or summarize differences.",
      "",
      "# Suggested structure",
      "1. Titles: provide 3 optional titles.",
      "2. One-line conclusion: directly say who is fast, who is stable, and who is better for publishable samples.",
      "3. Method: same Prompt, concurrent comparison, metric basis, and sample limitations.",
      "4. Results table: Markdown table with key metrics.",
      "5. Output quality observations: factual density, completeness, off-topic behavior, and token value.",
      "6. Usage recommendations: recommend models for different scenarios.",
      "7. Verifiability: Prompt, share link, and token-basis notes.",
      "",
      "# Run metadata",
      `Title: ${input.title.trim() || "not provided"}`,
      `Notes: ${input.notes.trim() || "none"}`,
      `Reasoning stats shown: ${input.thinkingStats ? "yes" : "no"}`,
      `Share link: ${input.shareUrl?.trim() || "none"}`,
      missingOfficial ? "Token basis: some models did not return official usage, so estimates exist." : "Token basis: official usage is preferred when available.",
      "",
      "# Base review draft",
      fixedDraft,
    ].join("\n");
  }

  return [
    "# 任务",
    "请基于下面这份 TOKRACE/百模竞速基础评测稿，生成一版可发布的中文总结或润色稿。",
    "",
    "# 写作风格",
    STYLE_GUIDE[input.style],
    "",
    "# 必须遵守",
    "- 不要虚构任何基础稿未提供的指标、测试次数、价格、模型版本或外部事实。",
    "- 不要修改表格里的模型名称、排名、速度、token、错误信息和分享链接。",
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
    "# 基础评测稿",
    fixedDraft,
  ].join("\n");
}

function buildMetricTable(rows: ReviewDraftRow[], thinkingStats: boolean, locale: Locale = "zh-CN"): string {
  const en = locale === "en";
  const header = thinkingStats
    ? en
      ? "| Model | Rank | Status | TTFT | Reasoning TPS | Reasoning Tokens | Output TPS | Avg TPS | Peak TPS | Output Tokens | Total Time |\n| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |"
      : "| 模型 | 排名 | 状态 | 首 Token | 思考 TPS | 思考 Tokens | 输出 TPS | 平均 TPS | 峰值 TPS | 输出 Tokens | 总用时 |\n| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |"
    : en
      ? "| Model | Rank | Status | TTFT | Output TPS | Avg TPS | Peak TPS | Output Tokens | Total Time |\n| --- | --- | --- | --- | --- | --- | --- | --- | --- |"
      : "| 模型 | 排名 | 状态 | 首 Token | 输出 TPS | 平均 TPS | 峰值 TPS | 输出 Tokens | 总用时 |\n| --- | --- | --- | --- | --- | --- | --- | --- | --- |";
  const body = rows.map((row) => formatMetricTableRow(row, thinkingStats, locale)).join("\n");
  const empty = en ? "No results" : "暂无结果";
  return body ? `${header}\n${body}` : `${header}\n| ${empty} | — | — | — | ${thinkingStats ? "— | — | " : ""}— | — | — | — | — |`;
}

function formatMetricTableRow(row: ReviewDraftRow, thinkingStats: boolean, locale: Locale = "zh-CN"): string {
  const en = locale === "en";
  const m = row.run.metrics;
  const model = escapeCell(`${row.name} (${row.model})`);
  if (!m) {
    const err = escapeCell(row.run.error || (en ? "Unknown error" : "未知错误"));
    return thinkingStats
      ? `| ${model} | — | ${en ? "Failed" : "失败"}：${err} | — | — | — | — | — | — | — | — |`
      : `| ${model} | — | ${en ? "Failed" : "失败"}：${err} | — | — | — | — | — | — |`;
  }
  const base = [
    model,
    row.run.rank ? `#${row.run.rank}` : en ? "unranked" : "未排名",
    statusLabel(row.run.status, locale),
    `${fmtSeconds(m.ttftMs)}s`,
  ];
  const tail = [
    fmtTps(m.contentTps),
    fmtTps(m.avgTps),
    fmtTps(m.peakTps),
    `${fmtInt(m.outputTokens)}${m.official ? (en ? " (official)" : "（官方）") : en ? " (estimated)" : "（估算）"}`,
    `${fmtSeconds(m.totalMs)}s`,
  ];
  const cells = thinkingStats
    ? [
        ...base,
        fmtTps(m.thinkingTps),
        fmtInt(m.reasoningTokens),
        ...tail,
      ]
    : [...base, ...tail];
  return `| ${cells.map(escapeCell).join(" | ")} |`;
}

function buildOneLineConclusion({
  total,
  completed,
  failures,
  fastestTtft,
  fastestOutput,
  shortestOutput,
  locale = "zh-CN",
}: {
  total: number;
  completed: number;
  failures: number;
  fastestTtft?: ReviewDraftRow;
  fastestOutput?: ReviewDraftRow;
  shortestOutput?: ReviewDraftRow;
  locale?: Locale;
}): string {
  const en = locale === "en";
  if (!total) {
    return en ? "No usable results yet. Complete at least one model comparison first." : "这轮还没有可用结果，建议先完成至少一次模型对比。";
  }
  const parts = [en ? `${completed}/${total} models completed output` : `本轮 ${completed}/${total} 个模型完成输出`];
  if (fastestTtft?.run.metrics) {
    parts.push(
      en
        ? `${fastestTtft.name} had the fastest TTFT (${fmtSeconds(fastestTtft.run.metrics.ttftMs)}s)`
        : `${fastestTtft.name} 首 Token 最快（${fmtSeconds(fastestTtft.run.metrics.ttftMs)}s）`
    );
  }
  if (fastestOutput?.run.metrics) {
    parts.push(
      en
        ? `${fastestOutput.name} had the highest output TPS (${fmtTps(fastestOutput.run.metrics.contentTps)} tok/s)`
        : `${fastestOutput.name} 输出 TPS 最高（${fmtTps(fastestOutput.run.metrics.contentTps)} tok/s）`
    );
  }
  if (shortestOutput?.run.metrics) {
    parts.push(
      en
        ? `${shortestOutput.name} used the fewest output tokens in this run (${fmtInt(shortestOutput.run.metrics.outputTokens)})`
        : `${shortestOutput.name} 本轮输出 token 最少（${fmtInt(shortestOutput.run.metrics.outputTokens)}）`
    );
  }
  if (failures) {
    parts.push(en ? `${failures} model(s) failed or returned no valid result` : `${failures} 个模型失败或未返回有效结果`);
  }
  return `${parts.join(en ? "; " : "；")}${en ? "." : "。"}`;
}

function buildSpeedObservations({
  fastestTtft,
  fastestOutput,
  fastestPeak,
  shortestOutput,
  longestOutput,
  locale = "zh-CN",
}: {
  fastestTtft?: ReviewDraftRow;
  fastestOutput?: ReviewDraftRow;
  fastestPeak?: ReviewDraftRow;
  shortestOutput?: ReviewDraftRow;
  longestOutput?: ReviewDraftRow;
  locale?: Locale;
}): string[] {
  const en = locale === "en";
  const lines: string[] = [];
  if (fastestTtft?.run.metrics) {
    lines.push(
      en
        ? `- TTFT: ${fastestTtft.name} was fastest at about ${fmtSeconds(fastestTtft.run.metrics.ttftMs)}s, giving the shortest perceived wait.`
        : `- 首 Token：${fastestTtft.name} 最快，约 ${fmtSeconds(fastestTtft.run.metrics.ttftMs)}s，体感等待最短。`
    );
  }
  if (fastestOutput?.run.metrics) {
    lines.push(
      en
        ? `- Output throughput: ${fastestOutput.name} had the highest output TPS at about ${fmtTps(fastestOutput.run.metrics.contentTps)} tok/s.`
        : `- 输出吞吐：${fastestOutput.name} 输出 TPS 最高，约 ${fmtTps(fastestOutput.run.metrics.contentTps)} tok/s。`
    );
  }
  if (fastestPeak?.run.metrics) {
    lines.push(
      en
        ? `- Peak speed: ${fastestPeak.name} had the highest peak TPS at about ${fmtTps(fastestPeak.run.metrics.peakTps)} tok/s.`
        : `- 峰值速度：${fastestPeak.name} 峰值 TPS 最高，约 ${fmtTps(fastestPeak.run.metrics.peakTps)} tok/s。`
    );
  }
  if (shortestOutput?.run.metrics && longestOutput?.run.metrics && shortestOutput.name !== longestOutput.name) {
    lines.push(
      en
        ? `- Token usage: ${shortestOutput.name} used the fewest output tokens (${fmtInt(shortestOutput.run.metrics.outputTokens)}), while ${longestOutput.name} used the most (${fmtInt(longestOutput.run.metrics.outputTokens)}).`
        : `- token 消耗：${shortestOutput.name} 输出 token 最少（${fmtInt(shortestOutput.run.metrics.outputTokens)}），${longestOutput.name} 输出 token 最多（${fmtInt(longestOutput.run.metrics.outputTokens)}）。`
    );
  }
  return lines.length ? lines : [en ? "- Not enough speed metrics are available for comparison in this run." : "- 本轮暂无足够速度指标可比较。"];
}

function buildQualityObservations(rows: ReviewDraftRow[], locale: Locale = "zh-CN"): string[] {
  const en = locale === "en";
  const lines = rows.map((row) => {
    const m = row.run.metrics;
    if (!m) {
      return en
        ? `- ${row.name}: failed in this run. Error: "${row.run.error || "Unknown error"}".`
        : `- ${row.name}：本轮失败，错误为「${row.run.error || "未知错误"}」。`;
    }
    const text = row.run.text.trim();
    const chars = countChars(text);
    if (en) {
      const parts = [`${row.name}: output was about ${fmtInt(chars)} characters`];
      if (row.run.status === "truncated") parts.push("the stream was truncated and should be rerun to confirm completeness");
      if (!text) parts.push("no content output");
      else if (chars < 80) parts.push("short output, good for quick answers but information density needs manual review");
      else if (chars > 1200) parts.push("long output, good for long-form tasks but watch for redundancy");
      else parts.push("moderate length; factual density and structure still need manual judgment");
      if (row.run.reasoning.trim()) parts.push("includes a reasoning excerpt");
      return `- ${parts.join("; ")}.`;
    }
    const parts = [`${row.name}：输出约 ${fmtInt(chars)} 字`];
    if (row.run.status === "truncated") parts.push("流式输出被截断，需要复跑确认完整性");
    if (!text) parts.push("没有正文输出");
    else if (chars < 80) parts.push("内容较短，适合速答但信息密度需人工复核");
    else if (chars > 1200) parts.push("内容较长，适合长文任务但需要关注冗余");
    else parts.push("长度适中，可进一步人工判断事实密度与结构");
    if (row.run.reasoning.trim()) parts.push("包含思考输出摘录");
    return `- ${parts.join("，")}。`;
  });
  return lines.length ? lines : [en ? "- No model output is available for observation." : "- 暂无模型输出可观察。"];
}

function buildPublishableConclusions({
  fastestTtft,
  fastestOutput,
  shortestOutput,
  failures,
  locale = "zh-CN",
}: {
  fastestTtft?: ReviewDraftRow;
  fastestOutput?: ReviewDraftRow;
  shortestOutput?: ReviewDraftRow;
  failures: ReviewDraftRow[];
  locale?: Locale;
}): string[] {
  const en = locale === "en";
  const lines: string[] = [];
  if (fastestTtft) {
    lines.push(
      en
        ? `- If interaction feel matters most, pay close attention to ${fastestTtft.name}'s TTFT.`
        : `- 如果重点是交互体感，可以优先关注 ${fastestTtft.name} 的首 Token 表现。`
    );
  }
  if (fastestOutput) {
    lines.push(
      en
        ? `- If long-form generation speed matters most, pay close attention to ${fastestOutput.name}'s output TPS.`
        : `- 如果重点是长文本生成速度，可以优先关注 ${fastestOutput.name} 的输出 TPS。`
    );
  }
  if (shortestOutput) {
    lines.push(
      en
        ? `- If output length or token cost matters, ${shortestOutput.name} was shortest in this run, but completeness still needs review.`
        : `- 如果重点是控制输出长度或 token 成本，本轮 ${shortestOutput.name} 的输出最短，但仍需结合内容完整性判断。`
    );
  }
  if (failures.length) {
    lines.push(
      en
        ? `- ${failures.map((row) => row.name).join(", ")} failed in this run; keep the error information or rerun before publishing.`
        : `- ${failures.map((row) => row.name).join("、")} 本轮失败，发布时建议保留错误信息或复跑一次。`
    );
  }
  lines.push(
    en
      ? "- This is a sample run. Before formal model selection, rerun with different Prompts, times, and task types."
      : "- 这是一轮样本测试，正式选型前建议更换 Prompt、时段和任务类型复测。"
  );
  return lines;
}

function buildFixedOutputAppendix(rows: ReviewDraftRow[], locale: Locale = "zh-CN"): string {
  const en = locale === "en";
  if (!rows.length) return en ? "No output." : "暂无输出。";
  return rows
    .map((row, index) => {
      const text = row.run.text.trim();
      const excerpt =
        text.length > MAX_FIXED_APPENDIX_CHARS
          ? `${text.slice(0, MAX_FIXED_APPENDIX_CHARS)}\n...[${en ? "excerpt truncated" : "摘录已截断"}]`
          : text || (en ? "(no content output)" : "（无正文输出）");
      return [`### ${index + 1}. ${row.name} (${row.model})`, row.run.error ? `${en ? "Error" : "错误"}：${row.run.error}` : null, excerpt]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n\n");
}

function pickMin(
  rows: ReviewDraftRow[],
  value: (row: ReviewDraftRow) => number | undefined
): ReviewDraftRow | undefined {
  return rows.reduce<ReviewDraftRow | undefined>((best, row) => {
    const v = value(row);
    if (v == null || !isFinite(v)) return best;
    if (!best) return row;
    const bv = value(best);
    return bv == null || v < bv ? row : best;
  }, undefined);
}

function pickMax(
  rows: ReviewDraftRow[],
  value: (row: ReviewDraftRow) => number | undefined
): ReviewDraftRow | undefined {
  return rows.reduce<ReviewDraftRow | undefined>((best, row) => {
    const v = value(row);
    if (v == null || !isFinite(v)) return best;
    if (!best) return row;
    const bv = value(best);
    return bv == null || v > bv ? row : best;
  }, undefined);
}

function escapeCell(value: string | number): string {
  return String(value).replace(/\|/g, "\\|").replace(/\n/g, " ");
}

function statusLabel(status: RunState["status"], locale: Locale = "zh-CN"): string {
  if (locale === "en") {
    if (status === "done") return "done";
    if (status === "truncated") return "truncated";
    if (status === "error") return "failed";
    if (status === "stopped") return "stopped";
    if (status === "streaming") return "streaming";
    if (status === "thinking") return "thinking";
    if (status === "connecting") return "connecting";
    return "not started";
  }
  if (status === "done") return "完成";
  if (status === "truncated") return "截断";
  if (status === "error") return "失败";
  if (status === "stopped") return "停止";
  if (status === "streaming") return "生成中";
  if (status === "thinking") return "思考中";
  if (status === "connecting") return "连接中";
  return "未开始";
}

function formatMetricLine(
  row: ReviewDraftRow,
  position: number,
  thinkingStats: boolean,
  locale: Locale = "zh-CN"
): string {
  const en = locale === "en";
  const { run } = row;
  const m = run.metrics;
  if (!m) {
    return [
      `${position}. ${row.name} (${row.model})`,
      `${en ? "Status" : "状态"}：${statusLabel(run.status, locale)}`,
      `${en ? "Error" : "错误"}：${run.error || (en ? "Unknown error" : "未知错误")}`,
    ].join(" | ");
  }
  const parts = [
    `${position}. ${row.name} (${row.model})`,
    `${en ? "Rank" : "排名"}：${run.rank ? `#${run.rank}` : en ? "unranked" : "未排名"}`,
    `${en ? "Status" : "状态"}：${statusLabel(run.status, locale)}`,
    `${en ? "TTFT" : "首 Token"}：${fmtSeconds(m.ttftMs)}s`,
    `${en ? "Output TPS" : "输出 TPS"}：${fmtTps(m.contentTps)}`,
    `${en ? "Avg TPS" : "平均 TPS"}：${fmtTps(m.avgTps)}`,
    `${en ? "Peak TPS" : "峰值 TPS"}：${fmtTps(m.peakTps)}`,
    `${en ? "Output Tokens" : "输出 Tokens"}：${fmtInt(m.outputTokens)}${m.official ? (en ? " (official)" : "（官方）") : en ? " (estimated)" : "（估算）"}`,
    `${en ? "Total Time" : "总用时"}：${fmtSeconds(m.totalMs)}s`,
  ];
  if (thinkingStats) {
    parts.splice(
      4,
      0,
      `${en ? "Reasoning TPS" : "思考 TPS"}：${fmtTps(m.thinkingTps)}`,
      `${en ? "Reasoning Tokens" : "思考 Tokens"}：${fmtInt(m.reasoningTokens)}`
    );
  }
  return parts.join(" | ");
}

function formatOutputBlock(row: ReviewDraftRow, position: number, locale: Locale = "zh-CN"): string {
  const en = locale === "en";
  const text = row.run.text.trim();
  const reasoning = row.run.reasoning.trim();
  const textExcerpt =
    text.length > MAX_OUTPUT_CHARS
      ? `${text.slice(0, MAX_OUTPUT_CHARS)}\n...[${en ? "output truncated; original is longer" : "输出已截断，原文更长"}]`
      : text || (en ? "(no content output)" : "（无正文输出）");
  const reasoningExcerpt =
    reasoning.length > MAX_REASONING_CHARS
      ? `${reasoning.slice(0, MAX_REASONING_CHARS)}...[${en ? "reasoning excerpt truncated" : "思考摘录已截断"}]`
      : reasoning;

  return [
    `## ${position}. ${row.name} (${row.model})`,
    row.run.error ? `${en ? "Error" : "错误"}：${row.run.error}` : null,
    reasoningExcerpt ? `${en ? "Reasoning excerpt" : "思考摘录"}：${reasoningExcerpt}` : null,
    `${en ? "Content excerpt" : "正文摘录"}：${textExcerpt}`,
  ]
    .filter(Boolean)
    .join("\n");
}
