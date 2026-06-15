import { NextRequest } from "next/server";

/**
 * 服务端用 Bearer token 经 Supabase /auth/v1/user 解析登录用户 id。
 * 失败（无 token/过期/网络）一律返回 null —— 调用方据此回退到匿名(client_id)。
 */
export async function resolveUserId(
  req: NextRequest,
  url: string,
  anon?: string
): Promise<string | null> {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ") || !anon) return null;
  try {
    const res = await fetch(`${url.replace(/\/+$/, "")}/auth/v1/user`, {
      headers: { apikey: anon, Authorization: auth },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    return ((await res.json()) as { id?: string }).id ?? null;
  } catch {
    return null;
  }
}

/** client_id 取值受限于安全字符集，可安全拼进 PostgREST 过滤器 */
export function safeClientId(v: unknown): string | null {
  return typeof v === "string" && /^[0-9A-Za-z_-]{1,64}$/.test(v) ? v : null;
}

/** 是否合法 UUID（用于把 user_id 安全拼进 PostgREST 过滤器） */
export function isUuid(v: unknown): v is string {
  return typeof v === "string" && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(v);
}

/**
 * 拼出「按归属人过滤」的 PostgREST 查询串（不含前导 & ）。
 * 有登录：owner 命中 client_id 或 user_id 任一；纯匿名：只认 client_id。
 * 用于 service_role 绕过 RLS 时由服务端自行兜住归属校验。
 */
export function ownerFilter(
  clientCol: string,
  userCol: string,
  clientId: string,
  userId: string | null
): string {
  if (userId) {
    return `or=(${clientCol}.eq.${clientId},${userCol}.eq.${userId})`;
  }
  return `${clientCol}=eq.${clientId}`;
}

/** 检查给定 user_id 是否在 ADMIN_USER_IDS 环境变量允许列表中 */
export function isAdmin(userId: string | null): boolean {
  if (!userId) return false;
  const list = process.env.ADMIN_USER_IDS?.split(",").map((s) => s.trim()) ?? [];
  return list.includes(userId);
}
