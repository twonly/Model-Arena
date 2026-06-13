import type { NextRequest } from "next/server";

/**
 * 轻量 IP 限流（滑动窗口，函数实例内存级）。
 * 公网代理若不限流，脚本可白嫖函数额度。Fluid Compute 会复用实例，
 * 内存计数对单实例内的突发滥用足够；跨实例的极端场景交给 Vercel WAF。
 * 仅在托管环境（VERCEL=1）启用，不影响本地开发与测试。
 */

const buckets = new Map<string, number[]>();

export function rateLimit(
  req: NextRequest,
  key: string,
  limit: number,
  windowMs = 60_000
): string | null {
  if (!process.env.VERCEL) return null;
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";
  const k = `${key}:${ip}`;
  const now = Date.now();
  const arr = (buckets.get(k) ?? []).filter((t) => now - t < windowMs);
  if (arr.length >= limit) {
    buckets.set(k, arr);
    const retry = Math.ceil((arr[0] + windowMs - now) / 1000);
    return `请求过于频繁，请 ${retry}s 后再试`;
  }
  arr.push(now);
  buckets.set(k, arr);
  // 防 Map 无限膨胀：超过 5000 个 IP 桶时清理过期项
  if (buckets.size > 5000) {
    const cutoff = now - windowMs;
    for (const [kk, vv] of buckets) {
      if (!vv.length || vv[vv.length - 1] < cutoff) buckets.delete(kk);
    }
  }
  return null;
}
