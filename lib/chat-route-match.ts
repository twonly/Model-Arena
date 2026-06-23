/**
 * 纯路由匹配逻辑：判断某个 endpoint 是否应走 Cloudflare。
 * 这里**不依赖任何服务端 API**（无 node:crypto 等），所以客户端 runner
 * 和服务端路由都能安全引用，且可单元测试。
 *
 * 规则语义：对 endpoint 的 id / model / baseUrl / name 做「大小写不敏感子串」匹配。
 * - 规则之间（换行 / 逗号分隔）= OR：命中任一条规则即走 Cloudflare。
 * - 单条规则内用 `&` 连接 = AND：所有子词都要命中（各自可命中任一字段）才算这条成立。
 *   例：`bigmodel.cn & glm-5.2` 只匹配「baseUrl 含 bigmodel.cn 且 含 glm-5.2」的模型，
 *   从而把同名模型在不同 API 上的情况区分开。
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

/** 把一条规则拆成 AND 子词（按 `&` 分隔，去空白、丢空）。 */
function ruleSubTokens(rule: string): string[] {
  return rule
    .toLowerCase()
    .split("&")
    .map((p) => p.trim())
    .filter(Boolean);
}

/**
 * 规范化匹配规则：接受数组或以换行/逗号分隔的字符串。
 * 每条规则转小写、按 `&` 拆子词后去空白/丢空再以 ` & ` 规整重组；
 * 丢弃无有效子词的规则（空串 / 纯 `&` / 空白——空规则会匹配一切，是危险默认）；去重、限量。
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
    const subs = ruleSubTokens(item);
    if (subs.length === 0) continue; // 无有效子词的规则丢弃
    const rule = subs.join(" & ");
    if (!out.includes(rule)) out.push(rule);
    if (out.length >= 50) break;
  }
  return out;
}

/**
 * 命中任一规则即走 CF（规则间 OR）；单条规则内 `&` 的子词须全部命中（AND）。
 * match 为空 → 不命中（由全局默认决定）。
 */
export function matchesCloudflare(
  fields: RouteMatchFields,
  match: readonly string[]
): boolean {
  if (!match || match.length === 0) return false;
  const hay = [fields.id, fields.model, fields.baseUrl, fields.name]
    .filter((v): v is string => typeof v === "string" && v.length > 0)
    .map((v) => v.toLowerCase());
  if (hay.length === 0) return false;
  return match.some((rule) => {
    const subs = ruleSubTokens(rule);
    return subs.length > 0 && subs.every((t) => hay.some((h) => h.includes(t)));
  });
}

/** 给定全局默认 + 规则，算出某 endpoint 的最终通路。 */
export function resolveEndpointTransport(
  fields: RouteMatchFields,
  plan: ChatTransportPlan
): ChatTransportMode {
  return matchesCloudflare(fields, plan.match) ? "cloudflare" : plan.default;
}
