import { SHARED_MODELS, sharedAsEndpoints } from "./shared-models.ts";
import { DEFAULT_LOCALE, type Locale } from "./i18n.ts";
import { getMessages } from "./i18n-messages.ts";
import type { ModelEndpoint } from "./types.ts";

export const ARENA_SEED_STORAGE_KEY = "ma.arena.seed";

export const QUICK_SAMPLE_BY_LOCALE = {
  "zh-CN": {
    title: "三模型速度短测（可自己编辑）",
    notes:
      "快速体验模式（可自己编辑）：同一个短任务并发跑 3 个预置模型，先看首 Token 时延、输出速度和完成排名。",
    prompt:
      "请用中文写一段 180 字以内的产品说明，主题是：为什么大模型测速不能只看单次主观感受，而要同时比较首 Token 时延、输出速度和稳定性。",
    sharedIds: ["deepseek-flash", "kimi", "stepfun"],
  },
  en: {
    title: "Three-model speed sample (editable)",
    notes:
      "Quick sample mode (editable): run one short task across 3 preset models and compare TTFT, output speed and finish order.",
    prompt:
      "Write a product-style explanation in English, under 180 words, about why LLM speed testing should not rely on a single subjective impression and should compare TTFT, output speed and stability together.",
    sharedIds: ["deepseek-flash", "kimi", "stepfun"],
  },
} as const satisfies Record<
  Locale,
  { title: string; notes: string; prompt: string; sharedIds: readonly string[] }
>;

export const QUICK_SAMPLE = QUICK_SAMPLE_BY_LOCALE[DEFAULT_LOCALE];

export function quickSample(locale: Locale = DEFAULT_LOCALE) {
  return QUICK_SAMPLE_BY_LOCALE[locale];
}

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

export function sampleConfidence(samples: number, locale: Locale = DEFAULT_LOCALE): {
  label: string;
  tone: "low" | "medium" | "high";
  description: string;
} {
  const messages = getMessages(locale).confidence;
  if (samples >= 50) {
    return {
      label: messages.sampleHigh.label,
      tone: "high",
      description: messages.sampleHigh.description,
    };
  }
  if (samples >= 10) {
    return {
      label: messages.sampleMedium.label,
      tone: "medium",
      description: messages.sampleMedium.description,
    };
  }
  return {
    label: messages.sampleLow.label,
    tone: "low",
    description: messages.sampleLow.description,
  };
}

export function voteConfidence(votes: number, locale: Locale = DEFAULT_LOCALE): {
  label: string;
  tone: "low" | "medium" | "high";
  description: string;
} {
  const messages = getMessages(locale).confidence;
  if (votes >= 30) {
    return {
      label: messages.voteHigh.label,
      tone: "high",
      description: messages.voteHigh.description,
    };
  }
  if (votes >= 8) {
    return {
      label: messages.voteMedium.label,
      tone: "medium",
      description: messages.voteMedium.description,
    };
  }
  return {
    label: messages.voteLow.label,
    tone: "low",
    description: messages.voteLow.description,
  };
}
