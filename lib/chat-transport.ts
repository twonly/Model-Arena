import { timingSafeEqual } from "node:crypto";
export {
  createWorkerTicket,
  hashChatBody,
  normalizeWorkerUrl,
  verifyWorkerTicket,
  workerChatUrl,
} from "./chat-ticket.ts";
import { normalizeWorkerUrl, workerChatUrl } from "./chat-ticket.ts";
import {
  sanitizeCloudflareMatch,
  type ChatTransportMode,
  type ChatTransportPlan,
} from "./chat-route-match.ts";

export type { ChatTransportMode, ChatTransportPlan };

export interface ChatTransportConfig {
  /** 全局默认通路（未命中规则的模型走这里）。 */
  mode: ChatTransportMode;
  cloudflareWorkerUrl: string;
  /** 命中即走 Cloudflare 的关键词（匹配 endpoint 的 id/model/baseUrl/name 子串）。 */
  cloudflareMatch: string[];
  note?: string;
}

export interface ChatTransportEnvStatus {
  workerUrlConfigured: boolean;
  workerTokenConfigured: boolean;
  signingSecretConfigured: boolean;
  /** Cloudflare 通路是否整体可用（URL + token + secret 都就绪），与全局 mode 无关。 */
  ready: boolean;
}

export const CHAT_TRANSPORT_SETTING_KEY = "chat_transport";

export const DEFAULT_CHAT_TRANSPORT_CONFIG: ChatTransportConfig = {
  mode: "vercel",
  cloudflareWorkerUrl: "",
  cloudflareMatch: [],
};

function supabaseAdminEnv(): { url: string; key: string } | null {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? { url, key } : null;
}

function sbHeaders(key: string) {
  return { apikey: key, Authorization: `Bearer ${key}` };
}

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

export function sanitizeChatTransportConfig(input: unknown): ChatTransportConfig {
  if (!input || typeof input !== "object") return DEFAULT_CHAT_TRANSPORT_CONFIG;
  const obj = input as Record<string, unknown>;
  const mode = obj.mode === "cloudflare" ? "cloudflare" : "vercel";
  return {
    mode,
    cloudflareWorkerUrl: normalizeWorkerUrl(str(obj.cloudflareWorkerUrl)),
    cloudflareMatch: sanitizeCloudflareMatch(obj.cloudflareMatch),
    ...(str(obj.note) ? { note: str(obj.note).slice(0, 500) } : {}),
  };
}

export function chatTransportEnvStatus(
  config: ChatTransportConfig
): ChatTransportEnvStatus {
  const workerUrlConfigured = !!workerChatUrl(config.cloudflareWorkerUrl);
  const workerTokenConfigured = !!process.env.CHAT_WORKER_TOKEN;
  const signingSecretConfigured = !!process.env.CHAT_WORKER_SIGNING_SECRET;
  return {
    workerUrlConfigured,
    workerTokenConfigured,
    signingSecretConfigured,
    ready: workerUrlConfigured && workerTokenConfigured && signingSecretConfigured,
  };
}

/**
 * 客户端探测用的路由计划：CF 不可用时强制全 Vercel、无规则；
 * 可用时返回全局默认 + 命中即走 CF 的关键词。
 */
export function chatTransportPlan(
  config: ChatTransportConfig,
  status: ChatTransportEnvStatus
): ChatTransportPlan {
  if (!status.ready) return { default: "vercel", match: [] };
  return { default: config.mode, match: config.cloudflareMatch };
}

// 进程内短缓存：通路开关是全站、极少变动的运营配置，没必要每个请求都打一次
// Supabase REST。TTL 内复用；管理端保存后会就地刷新（见 saveChatTransportConfig）。
// 不同实例间最长 TTL 后一致，对一个运营级开关足够。
let configCache: { config: ChatTransportConfig; at: number } | null = null;
const CONFIG_CACHE_TTL_MS = 10_000;

export async function loadChatTransportConfig(): Promise<ChatTransportConfig> {
  if (configCache && Date.now() - configCache.at < CONFIG_CACHE_TTL_MS) {
    return configCache.config;
  }
  const config = await fetchChatTransportConfig();
  configCache = { config, at: Date.now() };
  return config;
}

async function fetchChatTransportConfig(): Promise<ChatTransportConfig> {
  const env = supabaseAdminEnv();
  if (!env) return DEFAULT_CHAT_TRANSPORT_CONFIG;
  const base = env.url.replace(/\/+$/, "");
  try {
    const res = await fetch(
      `${base}/rest/v1/app_settings?key=eq.${encodeURIComponent(
        CHAT_TRANSPORT_SETTING_KEY
      )}&select=value&limit=1`,
      { headers: sbHeaders(env.key), cache: "no-store" }
    );
    if (!res.ok) return DEFAULT_CHAT_TRANSPORT_CONFIG;
    const rows = (await res.json()) as Array<{ value: unknown }>;
    return sanitizeChatTransportConfig(rows[0]?.value);
  } catch {
    return DEFAULT_CHAT_TRANSPORT_CONFIG;
  }
}

export async function saveChatTransportConfig(
  config: ChatTransportConfig,
  updatedBy: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const env = supabaseAdminEnv();
  if (!env) return { ok: false, error: "Supabase admin env 未配置" };
  const base = env.url.replace(/\/+$/, "");
  const clean = sanitizeChatTransportConfig(config);
  try {
    const res = await fetch(
      `${base}/rest/v1/app_settings?on_conflict=key`,
      {
        method: "POST",
        headers: {
          ...sbHeaders(env.key),
          "Content-Type": "application/json",
          Prefer: "resolution=merge-duplicates",
        },
        body: JSON.stringify({
          key: CHAT_TRANSPORT_SETTING_KEY,
          value: clean,
          updated_by: updatedBy,
        }),
      }
    );
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { ok: false, error: text.slice(0, 300) || `HTTP ${res.status}` };
    }
    // 就地刷新缓存，让本实例的后续请求立即看到新开关
    configCache = { config: clean, at: Date.now() };
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "保存运行通路配置失败",
    };
  }
}

export function workerTokenMatches(req: Request): boolean {
  const expected = process.env.CHAT_WORKER_TOKEN;
  if (!expected) return false;
  const raw =
    req.headers.get("x-tokrace-worker-token") ||
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
    "";
  if (!raw) return false;
  const a = Buffer.from(raw);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
