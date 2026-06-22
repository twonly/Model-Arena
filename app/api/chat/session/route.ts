import { NextRequest } from "next/server";
import { rateLimit } from "@/lib/ratelimit";
import { resolveUserId } from "@/lib/server-auth";
import {
  chatTransportEnvStatus,
  chatTransportPlan,
  createWorkerTicket,
  loadChatTransportConfig,
  workerChatUrl,
} from "@/lib/chat-transport";

export const runtime = "nodejs";

function requestIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    ""
  );
}

// 轻量探测：客户端每页加载调一次，拿到整套路由计划（全局默认 + 命中即走 CF 的关键词），
// 之后对每个模型本地匹配。不带 body、不签 ticket。CF 配置不完整时回退全 Vercel、无规则。
export async function GET(req: NextRequest) {
  const limited = rateLimit(req, "chat-session", 120);
  if (limited) return new Response(limited, { status: 429 });
  const config = await loadChatTransportConfig();
  const status = chatTransportEnvStatus(config);
  const plan = chatTransportPlan(config, status);
  return Response.json({ ok: true, ...plan });
}

export async function POST(req: NextRequest) {
  const limited = rateLimit(req, "chat-session", 60);
  if (limited) return new Response(limited, { status: 429 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response("请求体不是合法 JSON", { status: 400 });
  }

  const config = await loadChatTransportConfig();
  const status = chatTransportEnvStatus(config);
  if (!status.ready) {
    return Response.json({
      ok: true,
      transport: "vercel",
      reason: "Cloudflare 通路配置不完整，已回退 Vercel",
    });
  }

  const uid = await resolveUserId(
    req,
    process.env.SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  const signed = createWorkerTicket(body, { uid, ip: requestIp(req) });
  if (!signed) {
    return Response.json({
      ok: true,
      transport: "vercel",
      reason: "Cloudflare ticket 签名密钥未配置，已回退 Vercel",
    });
  }

  return Response.json({
    ok: true,
    transport: "cloudflare",
    workerUrl: workerChatUrl(config.cloudflareWorkerUrl),
    ticket: signed.ticket,
    expiresAt: signed.expiresAt,
  });
}
