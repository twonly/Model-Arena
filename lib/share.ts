import type { RunMetrics, RunState, SpeedSample } from "./types";

/**
 * 分享快照：用户主动公开的对比结果。
 * 含 Prompt 与各模型输出（用户自己的内容），但绝不含 API Key 与 baseUrl。
 */
export interface ShareResult {
  name: string;
  model: string;
  status: RunState["status"];
  rank?: number;
  metrics: RunMetrics | null;
  text: string;
  reasoning: string;
  samples: SpeedSample[];
  error?: string;
}

export interface ShareSnapshot {
  v: 1;
  title: string;
  notes: string;
  prompt: string;
  watermark: string;
  thinkingStats: boolean;
  results: ShareResult[];
}

const MAX_TEXT = 20000;
const MAX_REASONING = 8000;
const MAX_SAMPLES = 400;

/** 速度曲线点过多时等距抽稀，控制 payload 体积 */
function thinSamples(s: SpeedSample[]): SpeedSample[] {
  if (s.length <= MAX_SAMPLES) return s;
  const step = Math.ceil(s.length / MAX_SAMPLES);
  return s.filter((_, i) => i % step === 0 || i === s.length - 1);
}

export function buildSnapshot(opts: {
  title: string;
  notes: string;
  prompt: string;
  watermark: string;
  thinkingStats: boolean;
  rows: { name: string; model: string; run: RunState }[];
}): ShareSnapshot {
  return {
    v: 1,
    title: opts.title.slice(0, 200),
    notes: opts.notes.slice(0, 1000),
    prompt: opts.prompt.slice(0, 8000),
    watermark: opts.watermark.slice(0, 100),
    thinkingStats: opts.thinkingStats,
    results: opts.rows
      .filter(({ run }) => run.metrics || run.error)
      .map(({ name, model, run }) => ({
        name,
        model,
        status: run.status,
        rank: run.rank,
        metrics: run.metrics,
        text: run.text.slice(0, MAX_TEXT),
        reasoning: run.reasoning.slice(0, MAX_REASONING),
        samples: thinSamples(run.samples),
        error: run.error,
      })),
  };
}

/** 生成 URL 友好的短 ID（10 位 base62） */
export function makeShareId(): string {
  const chars =
    "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const bytes = crypto.getRandomValues(new Uint8Array(10));
  return Array.from(bytes, (b) => chars[b % 62]).join("");
}
