"use client";

/** 我的中心客户端助手：分享管理 + 赞踩评论记录。归属 = 设备 ID(+登录账号)。 */
import { getClientId } from "./telemetry";
import { getSupabase } from "./supabase-client";
import type { ShareSnapshot } from "./share";

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

export interface MyShare {
  id: string;
  createdAt: string;
  disabled: boolean;
  views: number;
  title: string;
  modelCount: number;
}

export interface MyReaction {
  shareId: string;
  modelIndex: number;
  modelId: string;
  sentiment: "up" | "down" | null;
  comment: string;
  at: string;
}

/** 创建分享（带归属信息），返回 {ok,id?,error?,disabled?} */
export async function createShare(snapshot: ShareSnapshot): Promise<{
  ok: boolean;
  id?: string;
  error?: string;
  disabled?: boolean;
}> {
  const res = await fetch("/api/share", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(await authHeader()) },
    body: JSON.stringify({ snapshot, clientId: getClientId() }),
  });
  const raw = await res.text();
  try {
    return JSON.parse(raw);
  } catch {
    return { ok: false, error: `服务端异常（HTTP ${res.status}）` };
  }
}

export async function listMyShares(): Promise<MyShare[]> {
  const res = await fetch(
    `/api/share?mine=1&clientId=${encodeURIComponent(getClientId())}`,
    { headers: { ...(await authHeader()) } }
  );
  const j = await res.json();
  if (!j.ok) throw new Error(j.error || "加载失败");
  return j.shares as MyShare[];
}

export async function setShareDisabled(id: string, disabled: boolean): Promise<void> {
  const res = await fetch("/api/share", {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...(await authHeader()) },
    body: JSON.stringify({ id, clientId: getClientId(), disabled }),
  });
  const j = await res.json();
  if (!j.ok) throw new Error(j.error || "操作失败");
}

export async function deleteShare(id: string): Promise<void> {
  const res = await fetch("/api/share", {
    method: "DELETE",
    headers: { "Content-Type": "application/json", ...(await authHeader()) },
    body: JSON.stringify({ id, clientId: getClientId() }),
  });
  const j = await res.json();
  if (!j.ok) throw new Error(j.error || "删除失败");
}

export async function listMyReactions(): Promise<MyReaction[]> {
  const res = await fetch(
    `/api/vote?mine=1&clientId=${encodeURIComponent(getClientId())}`,
    { headers: { ...(await authHeader()) } }
  );
  const j = await res.json();
  if (!j.ok) throw new Error(j.error || "加载失败");
  return j.reactions as MyReaction[];
}
