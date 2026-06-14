/**
 * 分享页投票/打榜：
 * 三种自洽评价方式（创建者选）——
 *   single 单选投票 / rank 排序打榜(前3) / score 逐项评分(每模型独立打星)
 * 评论可针对任意模型 + 👍好评/👎差评；每设备每分享 1 票/1 评（可改）。
 * 登录票单独计、加权可信。
 */
import { getClientId } from "./telemetry";
import { getSupabase } from "./supabase-client";

export type VoteMethod = "single" | "rank" | "score";
export type VoteMode = "open" | "blind";

export interface Scene {
  id: string;
  label: string;
  dims: string[];
}

export const SCENES: Scene[] = [
  { id: "none", label: "不分维度", dims: [] },
  { id: "code", label: "代码", dims: ["能运行", "功能完整", "代码质量", "美观度"] },
  { id: "writing", label: "写作", dims: ["文采", "扣题", "结构", "创意"] },
  { id: "reasoning", label: "推理/数学", dims: ["正确性", "推理清晰"] },
  { id: "general", label: "通用", dims: ["综合体验"] },
];

export const METHODS: { id: VoteMethod; label: string; desc: string }[] = [
  { id: "single", label: "单选投票", desc: "选 1 个最佳，最低门槛、最粉圈" },
  { id: "rank", label: "排序打榜", desc: "排出你心中前 3 名（3/2/1 分）" },
  { id: "score", label: "逐项评分", desc: "给每个模型按维度独立打星，按均分排" },
];

export function guessScene(prompt: string): string {
  const p = (prompt || "").toLowerCase();
  if (/代码|code|html|函数|function|贪吃蛇|游戏|算法|bug|python|js/.test(p))
    return "code";
  if (/写一篇|短文|文案|诗|作文|翻译|故事|essay/.test(p)) return "writing";
  if (/推理|计算|数学|多少|证明|逻辑|几次/.test(p)) return "reasoning";
  return "general";
}

export const sceneById = (id?: string): Scene =>
  SCENES.find((s) => s.id === id) ?? SCENES[0];

export const COMMENT_MAX = 500;

export type Sentiment = "up" | "down" | null;

/** 提交一次投票（+可选评论） */
export interface VoteSubmit {
  shareId: string;
  /** 冠军模型 id（服务端记到 winner_model，供全站周榜聚合） */
  winnerModel?: string;
  pick?: number; // single
  ranks?: number[]; // rank: 有序前 3 的下标
  scores?: Record<number, Record<string, number>>; // score: 模型→维度→星
  comment?: { target: number; sentiment: Sentiment; text: string };
}

/** 单模型聚合 */
export interface ModelTally {
  index: number;
  /** 排名度量：single=票数, rank=积分, score=综合均分 */
  metric: number;
  voters: number; // 多少人评价了它（票/排进前3/打过分）
  loginVoters: number;
  rankFirsts?: number; // rank: 拿第 1 的次数
  dimAvg: Record<string, number>; // score
  overallAvg?: number; // score
  up: number; // 👍
  down: number; // 👎
}

export interface VoteComment {
  target: number; // 模型下标，-1=综合
  sentiment: Sentiment;
  text: string;
  byLogin: boolean;
  at: string;
}

export interface MyVote {
  pick?: number;
  ranks?: number[];
  scores?: Record<number, Record<string, number>>;
  comment?: { target: number; sentiment: Sentiment; text: string };
}

export interface VoteAggregate {
  method: VoteMethod;
  total: number; // 参与投票的人数
  loginTotal: number;
  tallies: ModelTally[];
  comments: VoteComment[];
  mine: MyVote | null;
}

async function authHeader(): Promise<Record<string, string>> {
  try {
    const sb = getSupabase();
    if (!sb) return {};
    const {
      data: { session },
    } = await sb.auth.getSession();
    return session?.access_token
      ? { Authorization: `Bearer ${session.access_token}` }
      : {};
  } catch {
    return {};
  }
}

export async function submitVote(v: VoteSubmit): Promise<VoteAggregate> {
  const res = await fetch("/api/vote", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(await authHeader()) },
    body: JSON.stringify({ ...v, clientId: getClientId() }),
  });
  const j = await res.json();
  if (!j.ok) throw new Error(j.error || "投票失败");
  return j.aggregate as VoteAggregate;
}

export async function fetchVotes(shareId: string): Promise<VoteAggregate> {
  const res = await fetch(
    `/api/vote?shareId=${encodeURIComponent(shareId)}&clientId=${encodeURIComponent(getClientId())}`
  );
  const j = await res.json();
  if (!j.ok) throw new Error(j.error || "获取投票失败");
  return j.aggregate as VoteAggregate;
}
