/**
 * 分享页投票/打榜：匿名可投（每设备每分享 1 票，可改票）+ 登录加权，
 * 打榜(显示模型名)/盲评(隐藏名字投完揭晓)两种模式，
 * 一键选最佳 + 可选多维星级 + 文字评论（≤500 字）。
 */
import { getClientId } from "./telemetry";
import { getSupabase } from "./supabase-client";

/** 已登录则取 access token，用于服务端识别登录身份（加权/可信票） */
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

export type VoteMode = "open" | "blind";

/** 评分场景 → 多维维度预设（创建分享时选） */
export interface Scene {
  id: string;
  label: string;
  dims: string[];
}

export const SCENES: Scene[] = [
  { id: "none", label: "只投票，不评维度", dims: [] },
  { id: "code", label: "代码", dims: ["能运行", "功能完整", "代码质量", "美观度"] },
  { id: "writing", label: "写作", dims: ["文采", "扣题", "结构", "创意"] },
  { id: "reasoning", label: "推理/数学", dims: ["正确性", "推理清晰"] },
  { id: "general", label: "通用", dims: ["综合体验"] },
];

/** 据 prompt 粗略猜场景，作为创建分享时的默认选择 */
export function guessScene(prompt: string): string {
  const p = (prompt || "").toLowerCase();
  if (/代码|code|html|函数|function|贪吃蛇|游戏|算法|bug|python|js/.test(p))
    return "code";
  if (/写一篇|短文|文案|诗|作文|翻译|故事|essay/.test(p)) return "writing";
  if (/推理|计算|数学|多少|证明|逻辑|几次/.test(p)) return "reasoning";
  return "general";
}

export function sceneById(id?: string): Scene {
  return SCENES.find((s) => s.id === id) ?? SCENES[0];
}

/** 存进分享快照的投票配置 */
export interface VotingConfig {
  enabled: boolean;
  mode: VoteMode;
  scene: string; // Scene.id
}

export const COMMENT_MAX = 500;

/** 一次投票（提交到 /api/vote） */
export interface VoteSubmit {
  shareId: string;
  pick: number; // 选最佳：快照 results 的下标
  scores?: Record<string, number>; // 维度→1..5 星
  comment?: string;
}

/** 单模型的聚合结果 */
export interface ModelTally {
  index: number;
  votes: number; // 总票
  loginVotes: number; // 登录票
  dimAvg: Record<string, number>; // 各维度平均星
}

export interface VoteComment {
  pick: number;
  comment: string;
  byLogin: boolean;
  at: string;
}

export interface VoteAggregate {
  total: number;
  loginTotal: number;
  tallies: ModelTally[];
  comments: VoteComment[];
  /** 当前设备已投的内容（用于回显/改票），无则 null */
  mine: { pick: number; scores?: Record<string, number>; comment?: string } | null;
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
