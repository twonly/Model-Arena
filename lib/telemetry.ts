import type { ModelEndpoint, RunState } from "./types";

/**
 * 可选遥测：用户明确同意后，把「评测指标数据」上报到后端（Supabase）
 * 供进一步分析。
 *
 * 会上报：模型供应商/接口地址(host)、模型名、各项时延与 token 指标、
 *        输入/输出「长度」、时间、匿名设备 ID。
 * 不上报：API Key、Prompt 与模型输出的「内容」。
 *
 * 用户标识：随机 UUID（localStorage），非浏览器指纹——清空浏览器数据即可重置。
 */

export const CONSENT_VERSION = 1;

export const CONSENT_FIELDS = {
  collected: [
    "模型供应商与接口地址（仅域名）",
    "模型名称、接口协议",
    "首Token/思考/输出各阶段时延与 TPS、峰值速度",
    "输入与输出的 token 数及字符长度",
    "运行时间、是否成功、是否带图片",
    "匿名设备 ID（随机生成，可随浏览器数据清除）",
  ],
  notCollected: ["API Key", "Prompt 内容", "模型输出/思考内容", "上传的图片"],
};

export type ConsentChoice = "granted" | "denied";

export function getClientId(): string {
  const KEY = "ma.clientId";
  try {
    let id = localStorage.getItem(KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    return "unknown";
  }
}

/** 上报同意/拒绝记录本身（用于合规留痕） */
export async function reportConsent(choice: ConsentChoice): Promise<void> {
  try {
    await fetch("/api/telemetry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "consent",
        clientId: getClientId(),
        choice,
        consentVersion: CONSENT_VERSION,
        userAgent: navigator.userAgent.slice(0, 200),
      }),
    });
  } catch {
    /* 遥测失败不影响使用 */
  }
}

function hostOf(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return "invalid";
  }
}

/** 一轮对比完成后上报各模型的指标（仅在用户已同意时调用） */
export async function reportRunMetrics(opts: {
  runId: string;
  promptChars: number;
  hasImage: boolean;
  rows: { endpoint: ModelEndpoint; run: RunState }[];
}): Promise<void> {
  const clientId = getClientId();
  const records = opts.rows
    .filter(({ run }) => run.metrics || run.error)
    .map(({ endpoint, run }) => {
      const m = run.metrics;
      return {
        clientId,
        runId: opts.runId,
        provider: hostOf(endpoint.baseUrl),
        kind: endpoint.kind,
        model: endpoint.model,
        status: run.status,
        hasError: run.status === "error",
        hasImage: opts.hasImage,
        promptChars: opts.promptChars,
        outputChars: run.text.length,
        reasoningChars: run.reasoning.length,
        ttftMs: m?.ttftMs,
        thinkingMs: m?.thinkingMs,
        contentMs: m?.contentMs,
        totalMs: m?.totalMs,
        thinkingTps: m?.thinkingTps,
        contentTps: m?.contentTps,
        avgTps: m?.avgTps,
        peakTps: m?.peakTps,
        promptTokens: m?.promptTokens,
        outputTokens: m?.outputTokens,
        reasoningTokens: m?.reasoningTokens,
        contentTokens: m?.contentTokens,
        tokensOfficial: m?.official,
        rank: run.rank,
      };
    });
  if (!records.length) return;
  try {
    await fetch("/api/telemetry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "metrics", records }),
    });
  } catch {
    /* 遥测失败不影响使用 */
  }
}
