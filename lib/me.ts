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

/**
 * 把对象 gzip 后转 base64。失败/不支持则返回 null（调用方回退到明文）。
 * 压缩后体积通常只剩原来的 1/5~1/10，能绕开部分公司网关「上传 >1MB」的拦截。
 */
async function gzipBase64(obj: unknown): Promise<string | null> {
  try {
    if (typeof CompressionStream === "undefined") return null;
    const stream = new Blob([JSON.stringify(obj)])
      .stream()
      .pipeThrough(new CompressionStream("gzip"));
    const bytes = new Uint8Array(await new Response(stream).arrayBuffer());
    let bin = "";
    const CHUNK = 0x8000; // 分块拼接，避免 fromCharCode(...大数组) 爆栈
    for (let i = 0; i < bytes.length; i += CHUNK) {
      bin += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
    }
    return btoa(bin);
  } catch {
    return null;
  }
}

/** 创建分享（带归属信息），返回 {ok,id?,error?,disabled?} */
export async function createShare(snapshot: ShareSnapshot): Promise<{
  ok: boolean;
  id?: string;
  error?: string;
  disabled?: boolean;
}> {
  const clientId = getClientId();
  const gz = await gzipBase64(snapshot);
  const body = gz ? { gz, clientId } : { snapshot, clientId };
  const res = await fetch("/api/share", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(await authHeader()) },
    body: JSON.stringify(body),
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
