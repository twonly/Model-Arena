import { SHARED_MODELS, sharedAsEndpoints } from "./shared-models.ts";
import type { ModelEndpoint } from "./types.ts";

export const ARENA_SEED_STORAGE_KEY = "ma.arena.seed";

export const QUICK_SAMPLE = {
  title: "三模型速度短测（可自己编辑）",
  notes:
    "快速体验模式（可自己编辑）：同一个短任务并发跑 3 个预置模型，先看首 Token 时延、输出速度和完成排名。",
  prompt:
    "请用中文写一段 180 字以内的产品说明，主题是：为什么大模型测速不能只看单次主观感受，而要同时比较首 Token 时延、输出速度和稳定性。",
  sharedIds: ["deepseek-flash", "kimi", "stepfun"],
} as const;

export interface ArenaSeed {
  mode: "sample" | "share-full" | "share-prompt";
  title?: string;
  notes?: string;
  prompt: string;
  models?: string[];
  /** 来源评测模板：只做本地历史归档，不会覆盖用户模型配置 */
  templateId?: string;
  templateTitle?: string;
}

export function arenaSeedUsesTemporaryEndpoints(_mode: ArenaSeed["mode"]): boolean {
  return true;
}

export function quickSampleEndpoints(): ModelEndpoint[] {
  const all = sharedAsEndpoints();
  const wanted = new Set<string>(QUICK_SAMPLE.sharedIds);
  return all.filter((m) => wanted.has(m.id));
}

export function sharedEndpointsForModels(models: string[] = []): ModelEndpoint[] {
  const wanted = new Set(models.map((m) => m.trim()).filter(Boolean));
  if (!wanted.size) return [];
  const byModel = new Map(SHARED_MODELS.map((m) => [m.model, m.id]));
  const ids = new Set<string>();
  for (const model of wanted) {
    const id = byModel.get(model);
    if (id) ids.add(id);
  }
  return sharedAsEndpoints().filter((m) => ids.has(m.id));
}

export function sampleConfidence(samples: number): {
  label: string;
  tone: "low" | "medium" | "high";
  description: string;
} {
  if (samples >= 50) {
    return {
      label: "样本较稳",
      tone: "high",
      description: "50+ 次实测，受单次网络抖动影响较小。",
    };
  }
  if (samples >= 10) {
    return {
      label: "可参考",
      tone: "medium",
      description: "10+ 次实测，适合初步比较。",
    };
  }
  return {
    label: "样本偏少",
    tone: "low",
    description: "样本不足 10 次，建议继续贡献实测。",
  };
}

export function voteConfidence(votes: number): {
  label: string;
  tone: "low" | "medium" | "high";
  description: string;
} {
  if (votes >= 30) {
    return {
      label: "投票较稳",
      tone: "high",
      description: "30+ 次投票，Wilson 排名更可靠。",
    };
  }
  if (votes >= 8) {
    return {
      label: "可参考",
      tone: "medium",
      description: "8+ 次投票，仍会被 Wilson 自动折扣。",
    };
  }
  return {
    label: "票数偏少",
    tone: "low",
    description: "投票不足 8 次，排名波动会比较大。",
  };
}
