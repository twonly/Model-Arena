export const RACE_LEADER_MAX_PROGRESS = 92;
export const TTFT_BAR_FULL_MS = 5_000;
export const TTFT_BAR_REF_MS = 1_000;
export const TTFT_REF_PCT = (TTFT_BAR_REF_MS / TTFT_BAR_FULL_MS) * 100;

export function fastestTtftId(
  runners: readonly { id: string; ttftMs?: number }[]
): string | null {
  let fastest: { id: string; ttftMs: number } | null = null;
  for (const runner of runners) {
    const ttftMs = runner.ttftMs;
    if (ttftMs == null || !Number.isFinite(ttftMs) || ttftMs < 0) continue;
    if (!fastest || ttftMs < fastest.ttftMs) fastest = { id: runner.id, ttftMs };
  }
  return fastest?.id ?? null;
}

/** 首响等待柱：5 秒满格，等待越久越长；超过满格后截断。 */
export function ttftBarPct(ms: number | undefined, fullMs: number = TTFT_BAR_FULL_MS): number {
  if (ms == null || !Number.isFinite(ms) || ms <= 0 || fullMs <= 0) return 0;
  return Math.min(100, (ms / fullMs) * 100);
}

export function raceProgressPct(tokens: number, maxTokens: number): number {
  if (tokens <= 0 || maxTokens <= 0) return 0;
  return Math.min(RACE_LEADER_MAX_PROGRESS, (tokens / maxTokens) * RACE_LEADER_MAX_PROGRESS);
}

// 输出速度默认使用 500 token/s 的绝对刻度；赛道可传入更大的满格值。
// 300 token/s 为参考线，与峰值速度无关。
export const SPEED_BAR_FULL = 500;
export const SPEED_BAR_REF = 300;

export function speedBarPct(tps: number, full: number = SPEED_BAR_FULL): number {
  if (tps <= 0 || full <= 0) return 0;
  return Math.min(100, (tps / full) * 100);
}

/** 辅助数量条中，思考 token 占总 token 的比例（0–100）。 */
export function reasoningSharePct(reasoningTokens: number, totalTokens: number): number {
  if (reasoningTokens <= 0 || totalTokens <= 0) return 0;
  return Math.min(100, (reasoningTokens / totalTokens) * 100);
}
