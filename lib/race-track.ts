export const RACE_LEADER_MAX_PROGRESS = 92;

export function raceProgressPct(tokens: number, maxTokens: number): number {
  if (tokens <= 0 || maxTokens <= 0) return 0;
  return Math.min(RACE_LEADER_MAX_PROGRESS, (tokens / maxTokens) * RACE_LEADER_MAX_PROGRESS);
}

// 速度细条用「绝对刻度」而非「相对当前最快」。相对刻度下最快者永远 100%、看着不动
// （正是要修的问题）；绝对刻度下柱长 = 真实 tps / 满格基准，实时 tps 抖动会让柱子
// 真实地动，跑完即定格（静止）。
// - SPEED_BAR_FULL：满格对应的 t/s（到此 100%，更快截断）。
// - SPEED_BAR_REF：参考基准线，越过即「破线」（视觉上越过那条虚线）。
// 注意：本条吃的是「持续速度」(contentTps/liveTps)，比「峰值」(peakTps，常说的 ~400)
// 低，故基准取 300 让常见高速模型（实测约 339）能越线；要按峰值口径就把两常量调大。
export const SPEED_BAR_FULL = 500;
export const SPEED_BAR_REF = 300;
export const SPEED_REF_PCT = (SPEED_BAR_REF / SPEED_BAR_FULL) * 100;

export function speedBarPct(tps: number, full: number = SPEED_BAR_FULL): number {
  if (tps <= 0 || full <= 0) return 0;
  return Math.min(100, (tps / full) * 100);
}

/**
 * 粗条「撞线即定格」：进度 = token / 全场最高，分母会随别人继续生成而变大、把已完成的
 * 粗条往回挤。这里记下模型「完成首帧」的进度 pct 并钉住，之后即便 max 再涨也返回快照、
 * 不回缩；未完成则清掉快照（重跑自然复位）。cache 由调用方（组件）跨 tick 持有。
 */
export function frozenRaceProgress(
  cache: Map<string, number>,
  id: string,
  done: boolean,
  livePct: number
): number {
  if (!done) {
    cache.delete(id);
    return livePct;
  }
  const frozen = cache.get(id);
  if (frozen == null) {
    cache.set(id, livePct);
    return livePct;
  }
  return frozen;
}

