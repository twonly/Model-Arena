/**
 * 共享「测试额度」模型池：未登录用户可免费试跑这些模型（每 IP/浏览器 5 次、
 * 登录后共 15 次，详见 quota 逻辑）。
 *
 * 安全：这里只放**非机密**配置（baseUrl / model / kind / extraBody）。
 * 真正的 API Key 由服务端按 provider 从环境变量 SHARED_KEY_* 注入，
 * 客户端永远拿不到、也不发送 key（只发 sharedId）。
 *
 * 配置来源：站长本人的 model-arena 备份（2026-06-15）。改这里即改共享池。
 */
export interface SharedModel {
  /** 稳定 ID，客户端用它请求、服务端用它查配置 */
  id: string;
  /** 映射到服务端 env key 的 provider（见 /api/chat 的 SHARED_PROVIDER_KEY） */
  provider: "deepseek" | "kimi" | "xiaomi" | "zhipu" | "stepfun";
  /** 展示名 */
  name: string;
  kind: "openai" | "anthropic";
  baseUrl: string;
  model: string;
  /** 厂商私有参数（JSON 字符串），如 Kimi 的 thinking 开关 */
  extraBody?: string;
}

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
    id: "deepseek-pro",
    provider: "deepseek",
    name: "DeepSeek V4 Pro",
    kind: "openai",
    baseUrl: "https://api.deepseek.com/v1",
    model: "deepseek-v4-pro",
  },
  {
    id: "kimi",
    provider: "kimi",
    name: "Kimi",
    kind: "anthropic",
    baseUrl: "https://api.kimi.com/coding/",
    model: "kimi-for-coding",
    extraBody: '{"thinking": {"type": "enabled"}}',
  },
  {
    id: "mimo",
    provider: "xiaomi",
    name: "小米 MiMo V2.5",
    kind: "openai",
    baseUrl: "https://api.xiaomimimo.com/v1",
    model: "mimo-v2.5",
  },
  {
    id: "mimo-pro",
    provider: "xiaomi",
    name: "小米 MiMo V2.5 Pro",
    kind: "openai",
    baseUrl: "https://api.xiaomimimo.com/v1",
    model: "mimo-v2.5-pro",
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
    id: "stepfun",
    provider: "stepfun",
    name: "阶跃 Step-3.7 Flash",
    kind: "openai",
    baseUrl: "https://api.stepfun.com/step_plan/v1",
    model: "step-3.7-flash",
  },
];

/** 免费额度（一次「对比」算 1 次，不论本轮跑几个模型） */
export const FREE_LIMIT_ANON = 5; // 每浏览器（clientId）
export const FREE_LIMIT_USER = 15; // 登录后（5 + 10）
export const IP_DAILY_CEILING = 50; // 每 IP 每天总量天花板（防清缓存刷 clientId）

export const sharedById = (id: string): SharedModel | undefined =>
  SHARED_MODELS.find((m) => m.id === id);

/**
 * 转成 ModelEndpoint 形态（无 key，shared:true），用于首访预置进 ma.endpoints。
 * 注意 import type 避免环依赖。
 */
import type { ModelEndpoint } from "./types";
export function sharedAsEndpoints(): ModelEndpoint[] {
  return SHARED_MODELS.map((m) => ({
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
