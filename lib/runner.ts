import { estimateTokens } from "./tokens";
import type {
  ModelEndpoint,
  RunParams,
  RunState,
  SpeedSample,
  StreamEvent,
} from "./types";

interface RunOptions {
  endpoint: ModelEndpoint;
  prompt: string;
  params: RunParams;
  signal: AbortSignal;
  update: (fn: (prev: RunState) => RunState) => void;
  /** 完成（含报错/中断）时回调，用于竞速排名 */
  onSettled: (ok: boolean) => void;
}

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
  signal,
  update,
  onSettled,
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

  const liveTok = () => estimateTokens(reasoning) + estimateTokens(text);

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

  const finalize = (status: "done" | "stopped", finishReason?: string) => {
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
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal,
      body: JSON.stringify({
        kind: endpoint.kind,
        baseUrl: endpoint.baseUrl,
        apiKey: endpoint.apiKey,
        model: endpoint.model,
        systemPrompt: params.systemPrompt,
        prompt,
        temperature: params.temperature,
        maxTokens: params.maxTokens,
        extraBody: endpoint.extraBody,
      }),
    });

    if (!res.ok || !res.body) {
      const detail = await res.text().catch(() => "");
      throw new Error(detail || `HTTP ${res.status}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = "";
    let finished = false;

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
            tLastReasoning = t;
          }
          if (ev.text) {
            if (tFirstContent == null) tFirstContent = t;
            text += ev.text;
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
          finalize("done", ev.finishReason);
        }
      }
    }
    if (!finished) finalize("done");
    onSettled(true);
  } catch (err) {
    if (signal.aborted) {
      // 手动停止：保留已收到的内容并按已收数据结算
      finalize("stopped");
      onSettled(false);
      return;
    }
    const message = err instanceof Error ? err.message : String(err);
    update((prev) => ({ ...prev, status: "error", error: message }));
    onSettled(false);
  }
}
