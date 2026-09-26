import { NextRequest } from "next/server";
import { rateLimit } from "@/lib/ratelimit";
import { type ChatBody, prepareChatBody } from "@/lib/chat-request";
import { pipeChat } from "@/lib/chat-stream";
export const runtime = "nodejs";
export const maxDuration = 300;
const enc = new TextEncoder();
const sse = (obj: unknown) => enc.encode(`data: ${JSON.stringify(obj)}\n\n`);

export async function POST(req: NextRequest) {
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
        await pipeChat(body, send, req.signal);
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
