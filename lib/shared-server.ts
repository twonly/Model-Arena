/**
 * 共享「测试额度」服务端逻辑（绝不进客户端 bundle）：
 * provider → 环境变量 key 名映射 + Supabase 配额 RPC 调用。
 * key 只在这里从 process.env 读，注入到上游请求；客户端永不接触。
 */
import type { SharedModel } from "./shared-models";

const PROVIDER_ENV: Record<SharedModel["provider"], string> = {
  deepseek: "SHARED_KEY_DEEPSEEK",
  kimi: "SHARED_KEY_KIMI",
  xiaomi: "SHARED_KEY_XIAOMI",
  zhipu: "SHARED_KEY_ZHIPU",
  stepfun: "SHARED_KEY_STEPFUN",
};

export function sharedKeyFor(provider: SharedModel["provider"]): string | undefined {
  return process.env[PROVIDER_ENV[provider]];
}

export interface ClaimResult {
  ok: boolean;
  remaining: number;
  reason: string;
  source?: "base" | "referral";
  baseLimit?: number;
  baseUsed?: number;
  baseRemaining?: number;
  bonusRemaining?: number;
  totalUsed?: number;
  limit?: number;
}

export async function supabaseRpc<T>(
  name: string,
  args: Record<string, unknown>
): Promise<T | null> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  try {
    const res = await fetch(`${url.replace(/\/+$/, "")}/rest/v1/rpc/${name}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify(args),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/**
 * 认领一次共享对比额度。fail-closed：配额系统不可用（未建表/超时）时拒绝，
 * 宁可暂时不能用，也不让共享 key 被无计数地消耗。
 */
export async function claimSharedRun(
  who: string,
  whoKind: "client" | "user",
  ip: string,
  runId: string,
  limit: number,
  ceiling: number
): Promise<ClaimResult> {
  const r = await supabaseRpc<ClaimResult>("claim_shared_run", {
    p_who: who,
    p_who_kind: whoKind,
    p_ip: ip,
    p_run_id: runId,
    p_limit: limit,
    p_ip_ceiling: ceiling,
  });
  return r ?? { ok: false, remaining: 0, reason: "unavailable" };
}

export async function sharedUsedToday(who: string): Promise<number | null> {
  const r = await supabaseRpc<number>("shared_used_today", { p_who: who });
  return typeof r === "number" ? r : null;
}

export interface SharedQuotaStatus {
  baseLimit: number;
  baseUsed: number;
  baseRemaining: number;
  bonusRemaining: number;
  totalUsed: number;
  remaining: number;
  limit: number;
}

export async function sharedQuotaStatus(
  who: string,
  whoKind: "client" | "user",
  baseLimit: number
): Promise<SharedQuotaStatus | null> {
  return supabaseRpc<SharedQuotaStatus>("shared_quota_status", {
    p_who: who,
    p_who_kind: whoKind,
    p_limit: baseLimit,
  });
}
