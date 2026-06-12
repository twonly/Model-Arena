import { NextRequest } from "next/server";
import { checkUpstreamUrl } from "@/lib/upstream-guard";

/**
 * 流式代理：把各家厂商接口统一成一种 SSE 事件流，顺带解决浏览器 CORS。
 * API Key 由前端随请求带来（仅存于用户本机 localStorage），本服务不落盘。
 *
 * 统一事件（data: JSON\n\n）：
 *   {type:"delta", text?, reasoning?}
 *   {type:"usage", promptTokens?, outputTokens?, reasoningTokens?}
 *   {type:"done", finishReason?}
 *   {type:"error", message}
 */

export const runtime = "nodejs";

interface ChatBody {
  kind: "openai" | "anthropic";
  baseUrl: string;
  apiKey: string;
  model: string;
  systemPrompt?: string;
  prompt: string;
  temperature?: string;
  maxTokens?: string;
  /** 额外请求参数（JSON 字符串），合并进上游请求体 */
  extraBody?: string;
  /** 视觉对比：随 Prompt 发送的图片（base64 data URL） */
  imageDataUrl?: string;
}

function parseDataUrl(
  dataUrl: string
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
    throw new Error("该模型的「额外请求参数」不是合法 JSON 对象，请到模型接入里修改");
  }
}

const enc = new TextEncoder();
const sse = (obj: unknown) => enc.encode(`data: ${JSON.stringify(obj)}\n\n`);

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
      500
    );
  } catch {
    return `HTTP ${res.status}：${raw.slice(0, 300) || res.statusText}`;
  }
}

export async function POST(req: NextRequest) {
  let body: ChatBody;
  try {
    body = (await req.json()) as ChatBody;
  } catch {
    return new Response("请求体不是合法 JSON", { status: 400 });
  }
  if (!body.baseUrl || !body.model) {
    return new Response("缺少 baseUrl 或 model", { status: 400 });
  }
  const guardErr = checkUpstreamUrl(body.baseUrl);
  if (guardErr) return new Response(guardErr, { status: 400 });

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      // 服务端计时基准：delta 事件统一盖时间戳，
      // 前端用它计算各阶段速度，避免浏览器渲染卡顿污染测量
      const tStart = performance.now();
      const send = (obj: Record<string, unknown>) => {
        if (obj.type === "delta")
          obj.ts = Math.round(performance.now() - tStart);
        try {
          controller.enqueue(sse(obj));
        } catch {
          /* 客户端已断开 */
        }
      };
      try {
        if (body.kind === "anthropic") {
          await pipeAnthropic(body, send, req.signal);
        } else {
          await pipeOpenAI(body, send, req.signal);
        }
      } catch (err) {
        if (!req.signal.aborted) {
          send({
            type: "error",
            message: err instanceof Error ? err.message : String(err),
          });
        }
      } finally {
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

type Send = (obj: Record<string, unknown>) => void;

/** 逐行解析上游 SSE，把每个 data: JSON 交给 handler */
async function consumeSse(
  res: Response,
  signal: AbortSignal,
  onData: (json: unknown) => void
) {
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  while (true) {
    if (signal.aborted) {
      await reader.cancel().catch(() => {});
      return;
    }
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    let idx: number;
    while ((idx = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, idx).replace(/\r$/, "");
      buf = buf.slice(idx + 1);
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        onData(JSON.parse(payload));
      } catch {
        /* 跳过半截 JSON（理论上不会，data 行是完整的） */
      }
    }
  }
}

/* ------------------------- OpenAI 兼容协议 ------------------------- */

interface OpenAIChunk {
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
  } | null;
}

async function pipeOpenAI(body: ChatBody, send: Send, signal: AbortSignal) {
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
    fetch(url, {
      method: "POST",
      signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${body.apiKey}`,
      },
      body: JSON.stringify(makePayload(withUsage)),
    });

  let res = await doFetch(true);
  if (!res.ok && (res.status === 400 || res.status === 422)) {
    // 个别厂商不支持 stream_options，去掉后重试一次
    const firstErr = await readErrorMessage(res);
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
  await consumeSse(res, signal, (json) => {
    const chunk = json as OpenAIChunk;
    const choice = chunk.choices?.[0];
    const delta = choice?.delta;
    if (delta) {
      const reasoning = delta.reasoning_content ?? delta.reasoning ?? undefined;
      const text = delta.content ?? undefined;
      if (reasoning || text) {
        send({
          type: "delta",
          ...(text ? { text } : {}),
          ...(reasoning ? { reasoning } : {}),
        });
      }
    }
    if (choice?.finish_reason) finishReason = choice.finish_reason;
    if (chunk.usage) {
      send({
        type: "usage",
        promptTokens: chunk.usage.prompt_tokens,
        outputTokens: chunk.usage.completion_tokens,
        reasoningTokens:
          chunk.usage.completion_tokens_details?.reasoning_tokens,
      });
    }
  });
  send({ type: "done", finishReason });
}

/* ------------------------- Anthropic 原生协议 ------------------------- */

interface AnthropicEvent {
  type: string;
  message?: { usage?: { input_tokens?: number; output_tokens?: number } };
  delta?: {
    type?: string;
    text?: string;
    thinking?: string;
    stop_reason?: string;
  };
  usage?: { output_tokens?: number };
  error?: { message?: string };
}

async function pipeAnthropic(body: ChatBody, send: Send, signal: AbortSignal) {
  const base = body.baseUrl.replace(/\/+$/, "");
  const url = base.endsWith("/v1") ? `${base}/messages` : `${base}/v1/messages`;

  const img = body.imageDataUrl ? parseDataUrl(body.imageDataUrl) : null;
  const payload: Record<string, unknown> = {
    model: body.model,
    max_tokens: num(body.maxTokens) ?? 8192,
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
  Object.assign(payload, parseExtra(body)); // 如 {"thinking":{"type":"adaptive"}}

  const res = await fetch(url, {
    method: "POST",
    signal,
    headers: {
      "Content-Type": "application/json",
      "x-api-key": body.apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(payload),
  });
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
  await consumeSse(res, signal, (json) => {
    const ev = json as AnthropicEvent;
    switch (ev.type) {
      case "message_start":
        if (ev.message?.usage?.input_tokens != null) {
          send({ type: "usage", promptTokens: ev.message.usage.input_tokens });
        }
        break;
      case "content_block_delta":
        if (ev.delta?.type === "text_delta" && ev.delta.text) {
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
        if (outputTokens != null)
          send({ type: "usage", outputTokens });
        send({ type: "done", finishReason });
        break;
      case "error":
        send({
          type: "error",
          message: ev.error?.message ?? "Anthropic 流返回错误",
        });
        break;
    }
  });
}
