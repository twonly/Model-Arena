/**
 * 投票客户端助手：每个模型卡片 👍/👎 + 评论。
 * 匿名(设备 ID)可投，登录票单独计、更可信。
 */
import { getClientId } from "./telemetry";
import { getSupabase } from "./supabase-client";
import type { Sentiment, VoteAggregate } from "./voting-core";

export * from "./voting-core";

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

/** 对某个模型表态/评论（upsert，每设备每模型一条，可改） */
export async function reactModel(args: {
  shareId: string;
  modelIndex: number;
  modelId: string;
  sentiment: Sentiment;
  comment?: string;
}): Promise<VoteAggregate> {
  const res = await fetch("/api/vote", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(await authHeader()) },
    body: JSON.stringify({ ...args, clientId: getClientId() }),
  });
  const j = await res.json();
  if (!j.ok) throw new Error(j.error || "操作失败");
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
