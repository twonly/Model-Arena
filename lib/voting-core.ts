/**
 * 投票纯逻辑核心（无客户端依赖，可被服务端 /api 与客户端共用）。
 * 简化版：每个模型卡片直接 👍/👎 + 评论；榜单按 Wilson 置信下界排名。
 */

export type Sentiment = "up" | "down" | null;
export const COMMENT_MAX = 500;

/** 存进分享快照的投票配置——简化到只有开关 */
export interface VotingConfigLite {
  enabled: boolean;
}

export interface ModelStat {
  index: number;
  up: number;
  down: number;
  loginUp: number; // 登录用户的赞（更可信）
  comments: number;
  ratio: number; // 好评率 up/(up+down)，无人点=0
  wilson: number; // 排名分（Wilson 95% 置信下界）
}

export interface VoteComment {
  modelIndex: number;
  sentiment: Sentiment;
  text: string;
  byLogin: boolean;
  at: string;
}

export interface VoteAggregate {
  totalVoters: number; // 参与过的设备数
  loginVoters: number;
  models: ModelStat[]; // 按 index 升序
  comments: VoteComment[];
  /** 本设备对各模型的反应：index → {sentiment, comment} */
  mine: Record<number, { sentiment: Sentiment; comment?: string }>;
}

/**
 * Wilson 置信下界（95%）：在赞踩样本下，对"好评率"的保守估计。
 * 票越多越接近真实好评率，票少则向下打折；0 票返回 0。
 */
export function wilson(up: number, total: number): number {
  if (total <= 0) return 0;
  const z = 1.96;
  const p = up / total;
  return (
    (p + (z * z) / (2 * total) -
      z * Math.sqrt((p * (1 - p) + (z * z) / (4 * total)) / total)) /
    (1 + (z * z) / total)
  );
}
