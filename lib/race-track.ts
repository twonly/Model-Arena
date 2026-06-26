export const RACE_LEADER_MAX_PROGRESS = 92;

export function raceProgressPct(tokens: number, maxTokens: number): number {
  if (tokens <= 0 || maxTokens <= 0) return 0;
  return Math.min(RACE_LEADER_MAX_PROGRESS, (tokens / maxTokens) * RACE_LEADER_MAX_PROGRESS);
}

/**
 * 速度细条：宽度 = 当前 tps / 全场最快 tps。与「进度=已生成 token」的粗条并列，
 * 给每行第二个可直接横向比较的长度——一眼看出「谁跑得快」（速率），而不只是
 * 「谁跑得多」（数量）。最快者满格。
 */
export function speedBarPct(tps: number, maxTps: number): number {
  if (tps <= 0 || maxTps <= 0) return 0;
  return Math.min(100, (tps / maxTps) * 100);
}

