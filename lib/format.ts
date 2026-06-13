import type { HistoryResult, RunMetrics, RunState } from "./types";

export function fmtSeconds(ms?: number): string {
  if (ms == null || !isFinite(ms)) return "—";
  const s = ms / 1000;
  if (s < 10) return s.toFixed(2);
  if (s < 100) return s.toFixed(1);
  return Math.round(s).toString();
}

/** 统计中文字数（CJK 字符算 1 字，英文按词近似算字） */
export function countChars(text: string): number {
  if (!text) return 0;
  const cjk = (text.match(/[一-鿿㐀-䶿]/g) ?? []).length;
  // 去掉 CJK 后按英文单词数估算，再与 CJK 相加
  const rest = text.replace(/[一-鿿㐀-䶿]/g, " ");
  const words = (rest.match(/[A-Za-z0-9]+/g) ?? []).length;
  return cjk + words;
}

/** 从 Prompt 中识别「N 字」「N 字左右」「不少于 N 字」类要求，取最大目标值 */
export function extractWordTarget(prompt: string): number | null {
  if (!prompt) return null;
  // 匹配 1000字 / 1,000 字 / 5000 字左右 / 一千字（仅阿拉伯数字）
  const matches = [...prompt.matchAll(/([\d,]{2,})\s*字/g)]
    .map((m) => parseInt(m[1].replace(/,/g, ""), 10))
    .filter((n) => isFinite(n) && n >= 20); // 过滤「3字」这种太小的误匹配
  if (!matches.length) return null;
  return Math.max(...matches);
}

export function fmtTps(tps?: number): string {
  if (tps == null || !isFinite(tps) || tps <= 0) return "—";
  if (tps < 10) return tps.toFixed(1);
  return Math.round(tps).toString();
}

export function fmtInt(n?: number): string {
  if (n == null || !isFinite(n)) return "—";
  return Math.round(n).toLocaleString("en-US");
}

const MEDALS = ["🥇", "🥈", "🥉"];
export function rankBadge(rank?: number): string {
  if (!rank) return "";
  return MEDALS[rank - 1] ?? `#${rank}`;
}

/** 把一次对比结果导出成 Markdown，方便博主直接贴进文章 */
export function buildMarkdown(opts: {
  title: string;
  notes: string;
  prompt: string;
  rows: { name: string; model: string; run: RunState }[];
  watermark?: string;
  /** false = 关闭思考统计：首Token 按首个正文 token 计，只导出正文速度 */
  thinkingStats?: boolean;
}): string {
  const { title, notes, prompt, rows, watermark, thinkingStats = true } = opts;
  const lines: string[] = [];
  lines.push(`## ${title || "模型速度对比"}`);
  if (notes.trim()) lines.push(`\n> ${notes.trim().replace(/\n/g, "\n> ")}`);
  lines.push(`\n**Prompt**：${prompt.trim()}\n`);
  const sec = (v?: number) => (v != null ? `${fmtSeconds(v)}s` : "—");
  if (thinkingStats) {
    lines.push(
      `| 模型 | 首Token | 思考用时 | 思考TPS | 输出TPS | 平均TPS | 峰值TPS | 输出Tokens | 总用时 | 名次 |`
    );
    lines.push(`| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |`);
  } else {
    lines.push(
      `| 模型 | 首Token | 输出TPS | 峰值TPS | 输出Tokens | 总用时 | 名次 |`
    );
    lines.push(`| --- | --- | --- | --- | --- | --- | --- |`);
  }
  for (const { name, model, run } of rows) {
    const m = run.metrics;
    if (run.status === "error") {
      const pad = thinkingStats ? "| | | | | | | | |" : "| | | | | |";
      lines.push(`| ${name} (${model}) | 失败：${run.error ?? "未知错误"} ${pad}`);
      continue;
    }
    if (!m) continue;
    if (thinkingStats) {
      lines.push(
        `| ${name} (${model}) | ${sec(m.ttftMs)} | ${
          m.thinkingMs ? sec(m.thinkingMs) : "—"
        } | ${fmtTps(m.thinkingTps)} | ${fmtTps(m.contentTps)} | ${fmtTps(
          m.avgTps
        )} | ${fmtTps(m.peakTps)} | ${fmtInt(m.outputTokens)}${
          m.official ? "" : "*"
        } | ${sec(m.totalMs)} | ${rankBadge(run.rank) || "—"} |`
      );
    } else {
      lines.push(
        `| ${name} (${model}) | ${sec(m.ttftMs)} | ${fmtTps(
          m.contentTps
        )} | ${fmtTps(m.peakTps)} | ${fmtInt(m.contentTokens)}${
          m.official ? "" : "*"
        } | ${sec(m.totalMs)} | ${rankBadge(run.rank) || "—"} |`
      );
    }
  }
  if (!thinkingStats && rows.some(({ run }) => run.reasoning)) {
    lines.push(`\n> 注：思考统计已关闭，速度只按正文 token 计算`);
  }
  if (rows.some(({ run }) => run.metrics && !run.metrics.official)) {
    lines.push(`\n\\* 该模型未返回官方 usage，tokens 为估算值`);
  }
  lines.push(
    `\n<sub>${watermark?.trim() ? `${watermark.trim()} · ` : ""}由「百模竞速 Model Arena」生成 · TPS = tokens/秒 · 首Token 含网络往返</sub>`
  );
  return lines.join("\n");
}

export function metricsFromHistory(r: HistoryResult): RunMetrics | null {
  return r.metrics;
}
