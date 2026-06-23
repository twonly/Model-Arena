import { NextRequest } from "next/server";
import { ChatBody, prepareChatBody } from "@/lib/chat-request";
import { verifyWorkerTicket, workerTokenMatches } from "@/lib/chat-transport";
import { rateLimitByKey } from "@/lib/ratelimit";

export const runtime = "nodejs";

interface WorkerTicketRequest {
  ticket?: string;
  body?: ChatBody;
}

async function responseToJsonError(res: Response): Promise<Response> {
  const contentType = res.headers.get("content-type") || "text/plain";
  const text = await res.text().catch(() => "");
  if (contentType.includes("application/json")) {
    return new Response(text, {
      status: res.status,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  }
  return Response.json({ ok: false, error: text || res.statusText }, { status: res.status });
}

export async function POST(req: NextRequest) {
  if (!workerTokenMatches(req)) {
    return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  let payload: WorkerTicketRequest;
  try {
    payload = (await req.json()) as WorkerTicketRequest;
  } catch {
    return Response.json({ ok: false, error: "请求体不是合法 JSON" }, { status: 400 });
  }
  if (!payload.ticket || !payload.body) {
    return Response.json({ ok: false, error: "缺少 ticket 或 body" }, { status: 400 });
  }

  const verified = verifyWorkerTicket(payload.ticket, payload.body);
  if (!verified.ok) {
    return Response.json({ ok: false, error: verified.error }, { status: 401 });
  }

  // 限流维度用 ticket 内的原始用户身份（请求 IP 是 Cloudflare 的，无法区分用户）。
  // 每用户每分钟最多 40 次开流——正常一轮对比只命中几次，却能卡死「截票重放反复烧 key」。
  const who = verified.claims.uid || verified.claims.ip || "anon";
  const limited = rateLimitByKey(`worker-ticket:${who}`, 40);
  if (limited) {
    return Response.json({ ok: false, error: limited }, { status: 429 });
  }

  const prepared = await prepareChatBody(req, payload.body, {
    userId: verified.claims.uid ?? null,
    ip: verified.claims.ip ?? "",
  });
  if (prepared instanceof Response) return responseToJsonError(prepared);

  return Response.json({
    ok: true,
    body: prepared.body,
    quotaRemaining: prepared.quotaRemaining,
  });
}
