import type { ChatBody } from "./chat-request";
import type { RunDiagnostics } from "./types";
import { createThinkSplitter } from "./think-split.ts";
import {
  anthropicThinkingMaxTokenErrorMessage,
  DEFAULT_ANTHROPIC_MAX_TOKENS,
  normalizeAnthropicThinkingPayload,
} from "./anthropic.ts";

function parseDataUrl(
  dataUrl: string,
): { mediaType: string; base64: string } | null {
  const m = dataUrl.match(/^data:([^;,]+);base64,(.+)$/);
  return m ? { mediaType: m[1], base64: m[2] } : null;
}

/** 解析 endpoint 的额外参数；非法 JSON 抛错（由上层转成 error 事件） */
function parseExtra(body: ChatBody): Record<string, unknown> {
  if (!body.extraBody?.trim()) return {};
  try {
    const j = JSON.parse(body.extraBody);
    if (j && typeof j === "object" && !Array.isArray(j))
      return j as Record<string, unknown>;
    throw new Error("不是对象");
  } catch {
    throw new Error(
      "该模型的「额外请求参数」不是合法 JSON 对象，请到模型接入里修改",
    );
  }
}

function num(v: string | undefined): number | undefined {
  if (v == null || v.trim() === "") return undefined;
  const n = Number(v);
  return isFinite(n) ? n : undefined;
}

async function readErrorMessage(res: Response): Promise<string> {
  const raw = await res.text().catch(() => "");
  try {
    const j = JSON.parse(raw);
    const msg =
      j?.error?.message ?? j?.message ?? j?.error_msg ?? j?.msg ?? raw;
    return `HTTP ${res.status}：${typeof msg === "string" ? msg : raw}`.slice(
      0,
      500,
    );
  } catch {
    return `HTTP ${res.status}：${raw.slice(0, 300) || res.statusText}`;
  }
}

type Send = (obj: Record<string, unknown>) => void;

interface StreamContext {
  send: Send;
  signal: AbortSignal;
  diagnostics: RunDiagnostics;
  now: () => number;
  headers?: Record<string, string>;
}

function safeRequestId(value: unknown, apiKey: string): string | undefined {
  return typeof value === "string" && /^[\w.:/-]{1,200}$/.test(value) &&
    !(apiKey && value.includes(apiKey)) ? value : undefined;
}

async function fetchUpstream(url: string, init: RequestInit, ctx: StreamContext, apiKey: string) {
  ctx.diagnostics.attempts = (ctx.diagnostics.attempts ?? 0) + 1;
  const res = await fetch(url, init);
  ctx.diagnostics.upstreamHeadersMs = ctx.now();
  ctx.diagnostics.upstreamStatus = res.status;
  ctx.diagnostics.requestId = safeRequestId(
    res.headers.get("x-request-id") ?? res.headers.get("request-id"), apiKey,
  );
  ctx.send({ type: "diagnostics", diagnostics: { ...ctx.diagnostics } });
  return res;
}

/** 逐行解析上游 SSE，把每个 data: JSON 交给 handler；返回是否见过 [DONE] 终止符 */
async function consumeSse(
  res: Response,
  signal: AbortSignal,
  onData: (json: unknown) => void,
  onFirstByte: () => void,
): Promise<{ sawDone: boolean }> {
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buf = "",
    sawDone = false;
  let sawByte = false;
  const line = (raw: string) => {
    if (!raw.startsWith("data:")) return;
    const payload = raw.slice(5).trim();
    if (!payload) return;
    if (payload === "[DONE]") {
      sawDone = true;
      return;
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(payload);
    } catch {
      return;
    }
    onData(parsed);
  };
  try {
    while (true) {
      if (signal.aborted) return { sawDone };
      const { done, value } = await reader.read();
      if (!sawByte && value?.byteLength) {
        sawByte = true;
        onFirstByte();
      }
      buf += done ? decoder.decode() : decoder.decode(value, { stream: true });
      let idx: number;
      while ((idx = buf.indexOf("\n")) >= 0) {
        line(buf.slice(0, idx).replace(/\r$/, ""));
        buf = buf.slice(idx + 1);
      }
      if (done) {
        if (buf.trim()) line(buf);
        break;
      }
    }
    return { sawDone };
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}

/* ------------------------- OpenAI 兼容协议 ------------------------- */

interface OpenAIChunk {
  id?: string;
  choices?: {
    delta?: {
      content?: string | null;
      reasoning_content?: string | null;
      reasoning?: string | null;
    };
    finish_reason?: string | null;
  }[];
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    completion_tokens_details?: { reasoning_tokens?: number };
    pd?: Record<string, unknown>;
  } | null;
}

async function pipeOpenAI(body: ChatBody, ctx: StreamContext) {
  const { send, signal, diagnostics, now } = ctx;
  const url = `${body.baseUrl.replace(/\/+$/, "")}/chat/completions`;
  const messages: { role: string; content: unknown }[] = [];
  if (body.systemPrompt?.trim())
    messages.push({ role: "system", content: body.systemPrompt });
  if (body.imageDataUrl) {
    // 多模态：OpenAI 兼容协议的 image_url 直接接受 data URL
    messages.push({
      role: "user",
      content: [
        { type: "text", text: body.prompt },
        { type: "image_url", image_url: { url: body.imageDataUrl } },
      ],
    });
  } else {
    messages.push({ role: "user", content: body.prompt });
  }

  const extra = parseExtra(body);
  const makePayload = (withUsage: boolean) => {
    const p: Record<string, unknown> = {
      model: body.model,
      messages,
      stream: true,
    };
    if (withUsage) p.stream_options = { include_usage: true };
    const t = num(body.temperature);
    if (t != null) p.temperature = t;
    const mt = num(body.maxTokens);
    if (mt != null) p.max_tokens = mt;
    Object.assign(p, extra); // 模型私有参数（think 开关等）优先级最高
    return p;
  };

  const doFetch = (withUsage: boolean) =>
    fetchUpstream(url, {
      method: "POST",
      signal,
      headers: {
        ...ctx.headers,
        "Content-Type": "application/json",
        Authorization: `Bearer ${body.apiKey}`,
      },
      body: JSON.stringify(makePayload(withUsage)),
    }, ctx, body.apiKey);

  let res = await doFetch(true);
  if (!res.ok && (res.status === 400 || res.status === 422)) {
    // Retry only an explicit usage-option rejection, not every invalid request.
    const firstErr = await readErrorMessage(res);
    if (!/stream_options|include_usage/i.test(firstErr)) {
      send({ type: "error", message: firstErr });
      return;
    }
    res = await doFetch(false);
    if (!res.ok) {
      send({ type: "error", message: firstErr });
      return;
    }
  } else if (!res.ok) {
    send({ type: "error", message: await readErrorMessage(res) });
    return;
  }
  if (!res.body) {
    send({ type: "error", message: "上游未返回流式响应体" });
    return;
  }

  let finishReason: string | undefined;
  let gotDelta = false;
  // 兜底：把内联 <think>…</think> 的思考拆出来（MiniMax-M3 等走 OpenAI 接口时如此）。
  // 仅当本轮从未出现独立 reasoning 字段时才启用，规矩用字段的模型（DeepSeek 等）不受影响。
  const splitter = createThinkSplitter();
  let sawReasoningField = false;
  try {
    const { sawDone } = await consumeSse(res, signal, (json) => {
      const chunk = json as OpenAIChunk;
      diagnostics.completionId ??= safeRequestId(chunk.id, body.apiKey);
      const choice = chunk.choices?.[0];
      const delta = choice?.delta;
      if (delta) {
        const reasoningField =
          delta.reasoning_content ?? delta.reasoning ?? undefined;
        if (reasoningField) sawReasoningField = true;
        const content = delta.content ?? undefined;
        let outText = "";
        let outReason = reasoningField || "";
        if (content) {
          if (sawReasoningField) {
            // 模型已用独立 reasoning 字段 → 正文就是正文，不做 <think> 拆分
            outText = content;
          } else {
            const r = splitter.push(content);
            outText = r.text;
            outReason += r.reasoning;
          }
        }
        if (outText || outReason) {
          gotDelta = true;
          send({
            type: "delta",
            ...(outText ? { text: outText } : {}),
            ...(outReason ? { reasoning: outReason } : {}),
          });
        }
      }
      if (choice?.finish_reason) finishReason = choice.finish_reason;
      if (chunk.usage) {
        const pd = chunk.usage.pd;
        if (pd && typeof pd === "object") {
          const timing = Object.fromEntries(
            ["recv_ms", "inject_ms", "compute_wait_ms", "slot_in_use_at_alloc"]
              .filter((key) => typeof pd[key] === "number" && Number.isFinite(pd[key]) && (pd[key] as number) >= 0)
              .map((key) => [key, pd[key] as number]),
          );
          if (Object.keys(timing).length) diagnostics.providerTiming = timing;
        }
        send({
          type: "usage",
          promptTokens: chunk.usage.prompt_tokens,
          outputTokens: chunk.usage.completion_tokens,
          reasoningTokens:
            chunk.usage.completion_tokens_details?.reasoning_tokens,
        });
      }
    }, () => { diagnostics.upstreamFirstByteMs ??= now(); });
    // 冲刷 <think> 拆分器缓冲（未闭合的半截标签 / 缓冲尾巴），没缓冲时返回空
    if (!signal.aborted) {
      const tail = splitter.flush();
      if (tail.text || tail.reasoning) {
        gotDelta = true;
        send({
          type: "delta",
          ...(tail.text ? { text: tail.text } : {}),
          ...(tail.reasoning ? { reasoning: tail.reasoning } : {}),
        });
      }
    }
    // 正常结束应有 [DONE] 或 finish_reason；都没有则是上游中途掐断
    if (signal.aborted) return;
    send({ type: "done", finishReason, truncated: !sawDone && !finishReason });
  } catch (e) {
    if (signal.aborted) return;
    // 上游传输途中断开：已有内容则标为截断完成，否则才是错误
    if (gotDelta) {
      send({ type: "done", truncated: true });
    } else {
      send({
        type: "error",
        message: `上游连接中断：${e instanceof Error ? e.message : String(e)}`,
      });
    }
  }
}

/* ------------------------- Anthropic 原生协议 ------------------------- */

interface AnthropicEvent {
  type: string;
  message?: { id?: string; usage?: { input_tokens?: number; output_tokens?: number } };
  delta?: {
    type?: string;
    text?: string;
    thinking?: string;
    stop_reason?: string;
  };
  usage?: { output_tokens?: number };
  error?: { message?: string };
}

async function pipeAnthropic(body: ChatBody, ctx: StreamContext) {
  const { send, signal, diagnostics, now } = ctx;
  const base = body.baseUrl.replace(/\/+$/, "");
  const url = base.endsWith("/v1") ? `${base}/messages` : `${base}/v1/messages`;

  const extra = parseExtra(body); // 如 {"thinking":{"type":"enabled"}}
  const formMax = num(body.maxTokens);
  const img = body.imageDataUrl ? parseDataUrl(body.imageDataUrl) : null;
  const payload: Record<string, unknown> = {
    model: body.model,
    max_tokens: formMax ?? DEFAULT_ANTHROPIC_MAX_TOKENS,
    stream: true,
    messages: [
      {
        role: "user",
        content: img
          ? [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: img.mediaType,
                  data: img.base64,
                },
              },
              { type: "text", text: body.prompt },
            ]
          : body.prompt,
      },
    ],
  };
  if (body.systemPrompt?.trim()) payload.system = body.systemPrompt;
  const t = num(body.temperature);
  // Opus 4.7+/Fable 已移除采样参数，仅在用户显式填写时传
  if (t != null) payload.temperature = t;
  Object.assign(payload, extra); // 模型私有参数（thinking 开关、max_tokens 覆盖等）优先

  const thinkingOn = normalizeAnthropicThinkingPayload(payload, {
    formMax,
    extra,
  });

  const res = await fetchUpstream(url, {
    method: "POST",
    signal,
    headers: {
      ...ctx.headers,
      "Content-Type": "application/json",
      "x-api-key": body.apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(payload),
  }, ctx, body.apiKey);
  if (!res.ok) {
    send({ type: "error", message: await readErrorMessage(res) });
    return;
  }
  if (!res.body) {
    send({ type: "error", message: "上游未返回流式响应体" });
    return;
  }

  let outputTokens: number | undefined;
  let finishReason: string | undefined;
  let gotText = false;
  await consumeSse(res, signal, (json) => {
    const ev = json as AnthropicEvent;
    switch (ev.type) {
      case "message_start":
        diagnostics.completionId ??= safeRequestId(ev.message?.id, body.apiKey);
        if (ev.message?.usage?.input_tokens != null) {
          send({ type: "usage", promptTokens: ev.message.usage.input_tokens });
        }
        break;
      case "content_block_delta":
        if (ev.delta?.type === "text_delta" && ev.delta.text) {
          gotText = true;
          send({ type: "delta", text: ev.delta.text });
        } else if (ev.delta?.type === "thinking_delta" && ev.delta.thinking) {
          send({ type: "delta", reasoning: ev.delta.thinking });
        }
        break;
      case "message_delta":
        if (ev.usage?.output_tokens != null)
          outputTokens = ev.usage.output_tokens;
        if (ev.delta?.stop_reason) finishReason = ev.delta.stop_reason;
        break;
      case "message_stop":
        if (outputTokens != null) send({ type: "usage", outputTokens });
        // 思考用满 max_tokens 却一个字正文都没产出 = 配置问题，给可操作建议
        // （正常截断——有正文但被切——仍按 truncated 处理，不当错误）
        if (finishReason === "max_tokens" && thinkingOn && !gotText) {
          send({
            type: "error",
            message: anthropicThinkingMaxTokenErrorMessage(payload.max_tokens),
          });
        } else {
          send({ type: "done", finishReason });
        }
        break;
      case "error":
        send({
          type: "error",
          message: ev.error?.message ?? "Anthropic 流返回错误",
        });
        break;
    }
  }, () => { diagnostics.upstreamFirstByteMs ??= now(); });
}

/** Shared by interactive requests and trusted server benchmarks. */
export async function pipeChat(
  body: ChatBody,
  send: Send,
  signal: AbortSignal,
  options: { headers?: Record<string, string>; transport?: RunDiagnostics["transport"]; proxyPrepareMs?: number } = {},
) {
  const started = performance.now();
  const now = () => Math.round(performance.now() - started);
  const diagnostics: RunDiagnostics = {
    startedAt: new Date().toISOString(), attempts: 0,
    transport: options.transport, proxyPrepareMs: options.proxyPrepareMs,
  };
  let terminal = false;
  const emitDiagnostics = () => send({ type: "diagnostics", diagnostics: { ...diagnostics }, ts: now() });
  // Open the SSE response immediately; metadata and empty events never count as tokens.
  emitDiagnostics();
  const timed: Send = (event) => {
    const ts = now();
    if (event.type === "delta" && (event.text || event.reasoning)) diagnostics.upstreamTtftMs ??= ts;
    if (event.type === "done" || event.type === "error") {
      terminal = true;
      emitDiagnostics();
    }
    send({
      ...event,
      ...(event.type === "done" &&
      ["length", "max_tokens"].includes(String(event.finishReason))
        ? { truncated: true }
        : {}),
      ts,
    });
  };
  const ctx: StreamContext = { send: timed, signal, diagnostics, now, headers: options.headers };
  try {
    if (body.kind === "anthropic") await pipeAnthropic(body, ctx);
    else await pipeOpenAI(body, ctx);
  } finally {
    if (!terminal) emitDiagnostics();
    // Preserve slow upstream receipts in runtime logs, without prompt, output or credentials.
    if ((diagnostics.proxyPrepareMs ?? 0) + (diagnostics.upstreamTtftMs ?? now()) >= 10_000) {
      console.info("chat_timing", JSON.stringify(diagnostics));
    }
  }
}
