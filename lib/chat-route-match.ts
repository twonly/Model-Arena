/**
 * 纯路由匹配逻辑：判断某个 endpoint 是否应走 Cloudflare。
 * 这里**不依赖任何服务端 API**（无 node:crypto 等），所以客户端 runner
 * 和服务端路由都能安全引用，且可单元测试。
 *
 * 规则语义：对 endpoint 的 id / model / baseUrl / name 做「大小写不敏感子串」匹配，
 * 命中任一关键词即走 Cloudflare；否则交给全局默认通路。
 */

export type ChatTransportMode = "vercel" | "cloudflare";

/** 参与匹配的 endpoint 字段。共享模型客户端虽只发 sharedId，但这些字段在 endpoint 上都在。 */
export interface RouteMatchFields {
  id?: string;
  model?: string;
  baseUrl?: string;
  name?: string;
}

export interface ChatTransportPlan {
  /** 未命中任何规则时的默认通路 */
  default: ChatTransportMode;
  /** 命中即走 Cloudflare 的关键词（已规范化：小写、无空串） */
  match: string[];
}

/**
 * 规范化匹配关键词：接受数组或以换行/逗号分隔的字符串。
 * 去空白、转小写、丢弃空串（空串会匹配一切，是危险默认）、去重、限量。
 */
export function sanitizeCloudflareMatch(input: unknown): string[] {
  const raw = Array.isArray(input)
    ? input
    : typeof input === "string"
      ? input.split(/[\n,]/)
      : [];
  const out: string[] = [];
  for (const item of raw) {
    if (typeof item !== "string") continue;
    const t = item.trim().toLowerCase();
    if (!t) continue; // 空 token 会命中所有模型，必须丢弃
    if (!out.includes(t)) out.push(t);
    if (out.length >= 50) break;
  }
  return out;
}

/** 命中任一关键词即走 CF。match 为空 → 不命中（由全局默认决定）。 */
export function matchesCloudflare(
  fields: RouteMatchFields,
  match: readonly string[]
): boolean {
  if (!match || match.length === 0) return false;
  const hay = [fields.id, fields.model, fields.baseUrl, fields.name]
    .filter((v): v is string => typeof v === "string" && v.length > 0)
    .map((v) => v.toLowerCase());
  if (hay.length === 0) return false;
  return match.some((token) => {
    const t = token.toLowerCase();
    return t.length > 0 && hay.some((h) => h.includes(t));
  });
}

/** 给定全局默认 + 规则，算出某 endpoint 的最终通路。 */
export function resolveEndpointTransport(
  fields: RouteMatchFields,
  plan: ChatTransportPlan
): ChatTransportMode {
  return matchesCloudflare(fields, plan.match) ? "cloudflare" : plan.default;
}
