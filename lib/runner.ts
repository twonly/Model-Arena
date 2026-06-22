import { estimateTokens } from "./tokens.ts";
import { getClientId } from "./telemetry.ts";
import {
  resolveEndpointTransport,
  type ChatTransportPlan,
} from "./chat-route-match.ts";
import type {
  ModelEndpoint,
  RunParams,
  RunState,
  SpeedSample,
  StreamEvent,
} from "./types.ts";

interface RunOptions {
  endpoint: ModelEndpoint;
  prompt: string;
  params: RunParams;
  /** 视觉对比：随 Prompt 一起发送的图片（data URL，JPEG 压缩后） */
  imageDataUrl?: string;
  signal: AbortSignal;
  update: (fn: (prev: RunState) => RunState) => void;
  /** 完成（含报错/中断）时回调，用于竞速排名 */
  onSettled: (ok: boolean) => void;
  /** 本轮对比的唯一 ID（共享额度按此去重计数） */
  runId?: string;
  /** 共享额度剩余次数回调（读自响应头 X-Quota-Remaining） */
  onQuota?: (remaining: number) => void;
  /** 登录态请求头；默认读取当前 Supabase session，测试可注入。 */
  authHeaders?: () => Promise<Record<string, string>>;
}

type ChatTransportSession =
  | { ok: true; transport: "vercel"; reason?: string }
  | {
      ok: true;
      transport: "cloudflare";
      workerUrl: string;
      ticket: string;
      expiresAt: string;
    };

const FLUSH_MS = 80; // UI 刷新节流
const SAMPLE_MS = 250; // 速度曲线采样间隔
const WINDOW_MS = 2000; // 瞬时速度滑动窗口

/**
 * 在客户端发起一次对比请求：经 /api/chat 代理流式拉取，
 * 计时全部在浏览器测量（本地代理开销可忽略）。
 */
export async function runEndpoint({
  endpoint,
  prompt,
  params,
  imageDataUrl,
  signal,
  update,
  onSettled,
  runId,
  onQuota,
  authHeaders = defaultAuthHeaders,
}: RunOptions): Promise<void> {
  const t0 = performance.now();
  let reasoning = "";
  let text = "";
  let tFirst: number | undefined; // 首个 token（思考或正文）
  let tFirstReasoning: number | undefined; // 思考阶段首末 delta（独立计时窗口）
  let tLastReasoning: number | undefined;
  let tFirstContent: number | undefined; // 正文阶段首末 delta
  let tLastContent: number | undefined;
  let usage: {
    promptTokens?: number;
    outputTokens?: number;
    reasoningTokens?: number;
  } = {};

  // 实时速度：记录 (时间, 累计估算 tokens) 检查点
  const checkpoints: { t: number; tok: number }[] = [];
  const samples: SpeedSample[] = [];
  let lastFlush = 0;
  let lastSample = 0;

  const now = () => performance.now() - t0;

  // 实时估算用增量累加（O(delta)），避免每次 flush 全文重扫；
  // 最终指标在 finalize 里仍用全文一次性精确估算
  let estLiveTok = 0;
  const liveTok = () => estLiveTok;

  const instantTps = (): number => {
    const t = now();
    const tok = liveTok();
    checkpoints.push({ t, tok });
    // 找滑动窗口起点
    let base = checkpoints[0];
    for (let i = checkpoints.length - 1; i >= 0; i--) {
      if (t - checkpoints[i].t >= WINDOW_MS) {
        base = checkpoints[i];
        break;
      }
    }
    const dt = (t - base.t) / 1000;
    if (dt <= 0.1) return 0;
    return (tok - base.tok) / dt;
  };

  const flush = (force = false) => {
    const t = now();
    if (!force && t - lastFlush < FLUSH_MS) return;
    lastFlush = t;
    const tps = instantTps();
    if (t - lastSample >= SAMPLE_MS) {
      lastSample = t;
      samples.push({ t, tps });
    }
    const r = reasoning;
    const x = text;
    const lt = liveTok();
    const ttft = tFirst;
    update((prev) => ({
      ...prev,
      reasoning: r,
      text: x,
      liveTokens: lt,
      liveTps: tps,
      liveTtftMs: ttft,
      samples: [...samples],
      status: x ? "streaming" : r ? "thinking" : prev.status,
    }));
  };

  const finalize = (
    status: "done" | "stopped" | "truncated",
    finishReason?: string
  ) => {
    const tEnd = now();
    const estReasoning = estimateTokens(reasoning);
    const estContent = estimateTokens(text);
    const official = usage.outputTokens != null;
    const outputTokens = usage.outputTokens ?? estReasoning + estContent;

    // —— token 拆分：官方 reasoning_tokens（>0）优先；
    //    否则各阶段按自己的字符独立估算，再用官方总量统一校准。
    //    （部分厂商如阶跃恒返回 0，视同缺失）
    let reasoningTokens = usage.reasoningTokens;
    let phaseSplitEstimated = false;
    if ((reasoningTokens == null || reasoningTokens <= 0) && reasoning) {
      const estTotal = estReasoning + estContent || 1;
      reasoningTokens = Math.round((outputTokens * estReasoning) / estTotal);
      phaseSplitEstimated = true;
    }
    const contentTokens = Math.max(outputTokens - (reasoningTokens ?? 0), 0);

    // —— 阶段计时完全独立：各用该阶段首末 delta 的活跃窗口。
    //    思考时长不再包含「思考结束→正文开始」的空隙，
    //    输出时长不再包含最后一个 token 之后等 usage/收尾的时间。
    const thinkingMs =
      reasoning && tFirstReasoning != null && tLastReasoning != null
        ? Math.max(tLastReasoning - tFirstReasoning, 1)
        : undefined;
    const contentMs =
      text && tFirstContent != null && tLastContent != null
        ? Math.max(tLastContent - tFirstContent, 1)
        : undefined;
    // 平均速度同样按活跃窗口（首 token → 末 token）计算
    const tLastDelta = Math.max(tLastContent ?? 0, tLastReasoning ?? 0);

    // 速度曲线校准：实时曲线基于字符估算，结束后按官方总量整体缩放，
    // 使峰值/曲线读数与官方 token 口径一致
    const estTotal = estReasoning + estContent;
    const k = official && estTotal > 0 ? outputTokens / estTotal : 1;
    const calibratedSamples = samples.map((s) => ({ t: s.t, tps: s.tps * k }));
    const peakTps = calibratedSamples.length
      ? Math.max(...calibratedSamples.map((s) => s.tps))
      : undefined;

    const metrics = {
      ttftMs: tFirst,
      firstContentMs: tFirstContent,
      thinkingMs,
      contentMs,
      totalMs: tEnd,
      promptTokens: usage.promptTokens,
      outputTokens,
      reasoningTokens: reasoning ? reasoningTokens : undefined,
      contentTokens,
      official,
      phaseSplitEstimated: reasoning ? phaseSplitEstimated : undefined,
      thinkingTps:
        thinkingMs && thinkingMs > 50 && reasoningTokens
          ? reasoningTokens / (thinkingMs / 1000)
          : undefined,
      contentTps:
        contentMs && contentMs > 50 && contentTokens > 0
          ? contentTokens / (contentMs / 1000)
          : undefined,
      avgTps:
        tFirst != null && tLastDelta - tFirst > 50
          ? outputTokens / ((tLastDelta - tFirst) / 1000)
          : undefined,
      peakTps,
    };
    void finishReason;
    update((prev) => ({
      ...prev,
      reasoning,
      text,
      status,
      metrics,
      liveTokens: outputTokens,
      samples: calibratedSamples,
    }));
  };

  update((prev) => ({
    ...prev,
    status: "connecting",
    reasoning: "",
    text: "",
    error: undefined,
    metrics: null,
    samples: [],
    liveTokens: 0,
    liveTps: 0,
    rank: undefined,
  }));

  try {
    // 共享「体验额度」模型：不带 key/baseUrl，服务端按 sharedId 注入 + 扣额度
    const reqBody = endpoint.shared
      ? {
          shared: true,
          sharedId: endpoint.id,
          clientId: getClientId(),
          runId,
          systemPrompt: params.systemPrompt,
          prompt,
          temperature: params.temperature,
          maxTokens: params.maxTokens,
          imageDataUrl,
        }
      : {
          kind: endpoint.kind,
          baseUrl: endpoint.baseUrl,
          apiKey: endpoint.apiKey,
          model: endpoint.model,
          systemPrompt: params.systemPrompt,
          prompt,
          temperature: params.temperature,
          maxTokens: params.maxTokens,
          extraBody: endpoint.extraBody,
          imageDataUrl,
        };
    const headers = { "Content-Type": "application/json", ...(await authHeaders()) };
    // 默认 Vercel：直接打 /api/chat，不多打 session（每页只探测一次路由计划并缓存）。
    // 仅当该模型命中 Cloudflare 规则（或全局默认即 CF）时，才按请求签一次性
    // ticket（ticket 绑定 body，无法预签）走 Worker。
    const plan = await getTransportPlan();
    const useCloudflare =
      resolveEndpointTransport(
        {
          id: endpoint.id,
          model: endpoint.model,
          baseUrl: endpoint.baseUrl,
          name: endpoint.name,
        },
        plan
      ) === "cloudflare";
    const session = useCloudflare
      ? await resolveChatTransport(reqBody, headers, signal)
      : null;
    const chatUrl =
      session?.transport === "cloudflare" ? session.workerUrl : "/api/chat";
    const chatBody =
      session?.transport === "cloudflare"
        ? { ticket: session.ticket, body: reqBody }
        : reqBody;
    const chatHeaders =
      session?.transport === "cloudflare"
        ? { "Content-Type": "application/json" }
        : headers;

    const res = await fetch(chatUrl, {
      method: "POST",
      headers: chatHeaders,
      signal,
      body: JSON.stringify(chatBody),
    });

    // 额度已用完（402）：抛出后端给的友好中文提示
    if (res.status === 402) {
      const j = await res.json().catch(() => null);
      throw new Error(j?.error || "今日免费额度已用完，请配置你自己的 API Key。");
    }
    if (!res.ok || !res.body) {
      const detail = await res.text().catch(() => "");
      throw new Error(detail || `HTTP ${res.status}`);
    }
    const rem = res.headers.get("X-Quota-Remaining");
    if (rem != null && onQuota) onQuota(Number(rem));

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = "";
    let finished = false; // 收到 done 事件（无论是否截断）
    let cleanFinish = false; // 正常完成（用于竞速排名，截断不计）

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const parts = buf.split("\n\n");
      buf = parts.pop() ?? "";
      for (const part of parts) {
        const line = part.trim();
        if (!line.startsWith("data:")) continue;
        let ev: StreamEvent;
        try {
          ev = JSON.parse(line.slice(5).trim());
        } catch {
          continue;
        }
        if (ev.type === "delta") {
          // 优先用代理盖的服务端时间戳（不受浏览器渲染/解析卡顿影响）
          const t = ev.ts ?? now();
          if (tFirst == null && (ev.text || ev.reasoning)) tFirst = t;
          if (ev.reasoning) {
            if (tFirstReasoning == null) tFirstReasoning = t;
            reasoning += ev.reasoning;
            estLiveTok += estimateTokens(ev.reasoning);
            tLastReasoning = t;
          }
          if (ev.text) {
            if (tFirstContent == null) tFirstContent = t;
            text += ev.text;
            estLiveTok += estimateTokens(ev.text);
            tLastContent = t;
          }
          flush();
        } else if (ev.type === "usage") {
          usage = {
            promptTokens: ev.promptTokens ?? usage.promptTokens,
            outputTokens: ev.outputTokens ?? usage.outputTokens,
            reasoningTokens: ev.reasoningTokens ?? usage.reasoningTokens,
          };
        } else if (ev.type === "error") {
          throw new Error(ev.message);
        } else if (ev.type === "done") {
          finished = true;
          cleanFinish = !ev.truncated;
          finalize(ev.truncated ? "truncated" : "done", ev.finishReason);
        }
      }
    }
    // 收到正常 done 事件才算「完成」；否则是流被意外掐断（函数超时/连接断）
    if (!finished) finalize("truncated");
    onSettled(cleanFinish);
  } catch (err) {
    if (signal.aborted) {
      // 手动停止：保留已收到的内容并按已收数据结算
      finalize("stopped");
      onSettled(false);
      return;
    }
    const raw = err instanceof Error ? err.message : String(err);
    const gotData = tFirst != null;
    // 把浏览器底层的 fetch 失败翻译成可读、可操作的诊断
    let message = raw;
    if (/Failed to fetch|NetworkError|network error|ERR_|load failed/i.test(raw)) {
      message = gotData
        ? `连接中断：传输途中与服务器的连接断开（多为浏览器↔本站的跨境网络波动，与模型厂商无关）。点「重跑」通常可恢复。原始：${raw}`
        : `无法连接到服务器：浏览器没能连上本站代理（多为本地网络/跨境到 Vercel 不稳定）。请检查网络后点「重跑」。原始：${raw}`;
    } else if (/aborted|timeout/i.test(raw)) {
      message = `请求超时：${raw}`;
    }
    update((prev) => ({ ...prev, status: "error", error: message }));
    onSettled(false);
  }
}

const VERCEL_ONLY_PLAN: ChatTransportPlan = { default: "vercel", match: [] };

// 路由计划（全局默认 + 命中即走 CF 的关键词）。全站配置、极少变动：每页加载
// 只探测一次并缓存，不在每次对比时都多打一趟 /api/chat/session。探测失败/超时
// 一律按全 Vercel 兜底（默认稳定路径，且 CF 本就依赖能连上 Vercel 签 ticket）。
let transportPlanPromise: Promise<ChatTransportPlan> | null = null;

export function prewarmTransportPlan(): void {
  void getTransportPlan();
}

function getTransportPlan(): Promise<ChatTransportPlan> {
  if (!transportPlanPromise) {
    transportPlanPromise = (async () => {
      try {
        const res = await fetch("/api/chat/session", {
          method: "GET",
          signal: AbortSignal.timeout(3000),
        });
        if (!res.ok) return VERCEL_ONLY_PLAN;
        const j = (await res.json()) as {
          default?: string;
          match?: unknown;
        };
        return {
          default: j?.default === "cloudflare" ? "cloudflare" : "vercel",
          match: Array.isArray(j?.match)
            ? j.match.filter((x): x is string => typeof x === "string")
            : [],
        };
      } catch {
        return VERCEL_ONLY_PLAN;
      }
    })();
  }
  return transportPlanPromise;
}

async function resolveChatTransport(
  reqBody: unknown,
  headers: Record<string, string>,
  signal: AbortSignal
): Promise<ChatTransportSession | null> {
  try {
    const res = await fetch("/api/chat/session", {
      method: "POST",
      headers,
      signal,
      body: JSON.stringify(reqBody),
    });
    if (!res.ok) return null;
    const j = (await res.json()) as ChatTransportSession;
    if (j?.ok && j.transport === "cloudflare" && j.workerUrl && j.ticket) return j;
    if (j?.ok && j.transport === "vercel") return j;
    return null;
  } catch {
    return null;
  }
}

async function defaultAuthHeaders(): Promise<Record<string, string>> {
  try {
    const { authHeader } = await import("./me.ts");
    return authHeader();
  } catch {
    return {};
  }
}
