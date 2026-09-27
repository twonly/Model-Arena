import { NextRequest } from "next/server";
import { rateLimit } from "@/lib/ratelimit";
import { type ChatBody, prepareChatBody } from "@/lib/chat-request";
import { pipeChat } from "@/lib/chat-stream";
import { startChat, resumeChat, stopChat } from "@/lib/chat-resume";
export const runtime = "nodejs";
export const maxDuration = 300;
const enc = new TextEncoder();
const sse = (obj: unknown) => enc.encode(`data: ${JSON.stringify(obj)}\n\n`);

export async function POST(req: NextRequest) {
  const started = performance.now();
  // 每 IP 每分钟最多 60 次对比请求（同时跑多个模型也算多次）
  const limited = rateLimit(req, "chat", 60);
  if (limited) return new Response(limited, { status: 429 });

  let body: ChatBody;
  try {
    body = (await req.json()) as ChatBody;
  } catch {
    return new Response("请求体不是合法 JSON", { status: 400 });
  }

  const prepared = await prepareChatBody(req, body);
  if (prepared instanceof Response) return prepared;
  body = prepared.body;
  const quotaRemaining = prepared.quotaRemaining;

  // Railway runs one persistent Node process. Keep Vercel/Worker rollback behavior intact.
  if (process.env.RAILWAY_SERVICE_ID && req.headers.get("x-chat-resume") === "1") {
    const token = startChat((send, signal) => pipeChat(body, send, signal, {
      transport: "railway", proxyPrepareMs: Math.round(performance.now() - started),
    }));
    if (!token) return new Response("当前并发测试较多，请稍后重试。", { status: 503 });
    return resumeChat(token, 0, req.signal, quotaRemaining != null ? { "X-Quota-Remaining": String(quotaRemaining) } : {});
  }

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      // 服务端计时基准：delta 事件统一盖时间戳，
      // 前端用它计算各阶段速度，避免浏览器渲染卡顿污染测量
      const send = (obj: Record<string, unknown>) => {
        try {
          controller.enqueue(sse(obj));
        } catch {
          /* client disconnected */
        }
      };
      try {
        await pipeChat(body, send, req.signal, {
          transport: process.env.RAILWAY_SERVICE_ID ? "railway" : "vercel",
          proxyPrepareMs: Math.round(performance.now() - started),
        });
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
      ...(quotaRemaining != null
        ? { "X-Quota-Remaining": String(quotaRemaining) }
        : {}),
    },
  });
}

export async function GET(req: NextRequest) {
  if (!process.env.RAILWAY_SERVICE_ID) return new Response(null, { status: 404 });
  const token = req.headers.get("x-chat-stream") ?? "";
  if (!/^[a-f0-9]{64}$/.test(token)) return new Response(null, { status: 401 });
  return resumeChat(token, Number(req.nextUrl.searchParams.get("after") ?? "0"), req.signal);
}

export async function DELETE(req: NextRequest) {
  if (!process.env.RAILWAY_SERVICE_ID) return new Response(null, { status: 404 });
  const token = req.headers.get("x-chat-stream") ?? "";
  if (!/^[a-f0-9]{64}$/.test(token)) return new Response(null, { status: 401 });
  stopChat(token);
  return new Response(null, { status: 204 });
}
