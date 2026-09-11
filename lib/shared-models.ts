/**
 * 共享「测试额度」模型池：未登录用户可免费试跑这些模型（每 IP/浏览器 5 次、
 * 登录后共 15 次，详见 quota 逻辑）。
 *
 * 安全：这里只放**非机密**配置（baseUrl / model / kind / extraBody）。
 * 真正的 API Key 由服务端按 provider 从环境变量 SHARED_KEY_* 注入，
 * 客户端永远拿不到、也不发送 key（只发 sharedId）。
 *
 * 配置来源：各服务商当前可用模型目录。改这里即改共享池。
 */
export interface SharedModel {
  /** 稳定 ID，客户端用它请求、服务端用它查配置 */
  id: string;
  /** 映射到服务端 env key 的 provider（见 /api/chat 的 SHARED_PROVIDER_KEY） */
  provider: "deepseek" | "zhipu" | "orcarouter";
  /** 展示名 */
  name: string;
  kind: "openai" | "anthropic";
  baseUrl: string;
  model: string;
  /** 厂商私有参数（JSON 字符串），如 Kimi 的 thinking 开关 */
  extraBody?: string;
  /** 限时模型到期时间；到期后客户端不再展示、服务端也拒绝继续注入共享 Key */
  availableUntil?: string;
}

export const DEEPSEEK_V41_MODEL_ID = "deepseek-v4.1-flash-expires-on-0910";
export const DEEPSEEK_V41_AVAILABLE_UNTIL = "2026-09-10T00:00:00+08:00";
export const SHARED_POOL_VERSION = "2026-09-11-orcarouter-free-pool";

export const SHARED_MODELS: SharedModel[] = [
  {
    id: "deepseek-flash",
    provider: "deepseek",
    name: "DeepSeek V4 Flash",
    kind: "openai",
    baseUrl: "https://api.deepseek.com/v1",
    model: "deepseek-v4-flash",
  },
  {
    id: "deepseek-v4-1-flash",
    provider: "deepseek",
    name: "DeepSeek V4.1 Flash（限时预览）",
    kind: "openai",
    baseUrl: "https://api.deepseek.com/v1",
    model: DEEPSEEK_V41_MODEL_ID,
    availableUntil: DEEPSEEK_V41_AVAILABLE_UNTIL,
  },
  {
    id: "deepseek-pro",
    provider: "deepseek",
    name: "DeepSeek V4 Pro",
    kind: "openai",
    baseUrl: "https://api.deepseek.com/v1",
    model: "deepseek-v4-pro",
  },
  {
    id: "glm-5-1",
    provider: "zhipu",
    name: "智谱 GLM-5.1",
    kind: "openai",
    baseUrl: "https://open.bigmodel.cn/api/coding/paas/v4",
    model: "glm-5.1",
  },
  {
    id: "glm-5-2",
    provider: "zhipu",
    name: "智谱 GLM-5.2",
    kind: "openai",
    baseUrl: "https://open.bigmodel.cn/api/coding/paas/v4",
    model: "glm-5.2",
  },
  {
    id: "orcarouter-free",
    provider: "orcarouter",
    name: "OrcaRouter Free",
    kind: "openai",
    baseUrl: "https://api.orcarouter.ai/v1",
    model: "orcarouter/free",
  },
  {
    id: "orcarouter-hy3-free",
    provider: "orcarouter",
    name: "Tencent HY3 Free",
    kind: "openai",
    baseUrl: "https://api.orcarouter.ai/v1",
    model: "tencent/hy3-free",
  },
  {
    id: "orcarouter-glm-5-3-flash-free",
    provider: "orcarouter",
    name: "GLM-5.3 Flash Free · OrcaRouter",
    kind: "openai",
    baseUrl: "https://api.orcarouter.ai/v1",
    model: "z-ai/glm-5.3-flash-free",
  },
  {
    id: "orcarouter-deepseek-v4-flash-free",
    provider: "orcarouter",
    name: "DeepSeek V4 Flash Free · OrcaRouter",
    kind: "openai",
    baseUrl: "https://api.orcarouter.ai/v1",
    model: "deepseek/deepseek-v4-flash-free",
  },
];

/** 免费额度（一次「对比」算 1 次，不论本轮跑几个模型） */
export const FREE_LIMIT_ANON = 5; // 每浏览器（clientId）
export const FREE_LIMIT_USER = 15; // 登录后（5 + 10）
export const IP_DAILY_CEILING = 50; // 每 IP 每天总量天花板（防清缓存刷 clientId）

export function sharedModelIsAvailable(
  model: SharedModel,
  now: Date = new Date()
): boolean {
  if (!model.availableUntil) return true;
  const deadline = Date.parse(model.availableUntil);
  return Number.isFinite(deadline) && now.getTime() < deadline;
}

export const sharedById = (
  id: string,
  now: Date = new Date()
): SharedModel | undefined =>
  SHARED_MODELS.find((m) => m.id === id && sharedModelIsAvailable(m, now));

/**
 * 转成 ModelEndpoint 形态（无 key，shared:true），用于首访预置进 ma.endpoints。
 * 注意 import type 避免环依赖。
 */
import type { ModelEndpoint } from "./types";
export function sharedAsEndpoints(now: Date = new Date()): ModelEndpoint[] {
  return SHARED_MODELS.filter((m) => sharedModelIsAvailable(m, now)).map((m) => ({
    id: m.id, // 跑时即 sharedId
    name: m.name,
    kind: m.kind,
    baseUrl: m.baseUrl, // 仅占位/展示；服务端会覆盖
    apiKey: "",
    model: m.model,
    enabled: true,
    extraBody: m.extraBody,
    shared: true,
  }));
}

/**
 * 让已有用户的本地体验模型与当前共享池保持一致：
 * - 无条件移除已下架、已过期或未知的 shared 端点；
 * - 刷新仍在池中的服务端可信配置；
 * - addMissing 仅在共享池版本变化时为老用户补新模型，避免用户手动删除后又被每次加回。
 */
export function reconcileSharedPool(
  endpoints: ModelEndpoint[],
  addMissing: boolean,
  now: Date = new Date()
): ModelEndpoint[] {
  const active = new Map(sharedAsEndpoints(now).map((endpoint) => [endpoint.id, endpoint]));

  let changed = false;
  const next = endpoints.flatMap((endpoint) => {
    if (!endpoint.shared) return [endpoint];
    const current = active.get(endpoint.id);
    if (!current) {
      changed = true;
      return [];
    }
    active.delete(endpoint.id);
    const refreshed = { ...current, enabled: endpoint.enabled };
    if (
      endpoint.name !== refreshed.name ||
      endpoint.kind !== refreshed.kind ||
      endpoint.baseUrl !== refreshed.baseUrl ||
      endpoint.model !== refreshed.model ||
      endpoint.extraBody !== refreshed.extraBody ||
      endpoint.apiKey !== refreshed.apiKey
    ) {
      changed = true;
      return [refreshed];
    }
    return [endpoint];
  });

  if (addMissing && active.size) {
    next.push(...active.values());
    changed = true;
  }
  return changed ? next : endpoints;
}

/**
 * 「体验模型」是上手脚手架：一旦用户配好了自己的、可用的模型（非 shared 且有 Key），
 * 脚手架就该整体退场——把**所有**体验模型默认取消勾选，主页只剩用户自己的模型。
 * 这是真正缩短主页卡片网格的杠杆（卡片由 enabled 驱动）。只改 enabled、不删除，
 * 体验模型仍留在列表里（折叠），想拿来当基线对比时随时可再勾回。
 * 无变化时返回原引用，便于调用方判断是否需要落库。
 */
export function graduateShared(eps: ModelEndpoint[]): ModelEndpoint[] {
  const hasUsableOwn = eps.some((e) => !e.shared && e.apiKey.trim());
  if (!hasUsableOwn) return eps;
  let changed = false;
  const next = eps.map((e) => {
    if (e.shared && e.enabled) {
      changed = true;
      return { ...e, enabled: false };
    }
    return e;
  });
  return changed ? next : eps;
}
