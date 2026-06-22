import { NextRequest } from "next/server";
import { checkUpstreamUrl } from "@/lib/upstream-guard";
import { resolveUserId } from "@/lib/server-auth";
import {
  sharedById,
  FREE_LIMIT_ANON,
  FREE_LIMIT_USER,
  IP_DAILY_CEILING,
} from "@/lib/shared-models";
import { sharedKeyFor, claimSharedRun } from "@/lib/shared-server";
import { qualifyReferral } from "@/lib/referral-server";

export interface ChatBody {
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
  /** 共享「测试额度」模式：true 时不带 key/baseUrl，服务端按 sharedId 注入 */
  shared?: boolean;
  sharedId?: string;
  clientId?: string;
  runId?: string;
}

export interface PreparedChatBody {
  body: ChatBody;
  quotaRemaining?: number;
}

function requestIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    ""
  );
}

export async function prepareChatBody(
  req: NextRequest,
  input: ChatBody,
  context: { userId?: string | null; ip?: string | null } = {}
): Promise<PreparedChatBody | Response> {
  const body: ChatBody = { ...input };
  let quotaRemaining: number | undefined;

  // 共享「测试额度」模式：服务端按 sharedId 注入 key/baseUrl/model，并扣额度。
  if (body.shared) {
    const sm = body.sharedId ? sharedById(body.sharedId) : undefined;
    if (!sm) return new Response("未知的体验模型", { status: 400 });
    const key = sharedKeyFor(sm.provider);
    if (!key) return new Response("该体验模型暂不可用", { status: 503 });
    if (!body.runId || !body.clientId)
      return new Response("缺少 runId 或 clientId", { status: 400 });

    const ip = context.ip ?? requestIp(req);
    const uid =
      "userId" in context
        ? context.userId
        : await resolveUserId(
            req,
            process.env.SUPABASE_URL ?? "",
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
          );
    const who = uid ?? body.clientId;
    const claim = await claimSharedRun(
      who,
      uid ? "user" : "client",
      ip ?? "",
      body.runId,
      uid ? FREE_LIMIT_USER : FREE_LIMIT_ANON,
      IP_DAILY_CEILING
    );
    if (!claim.ok) {
      const msg =
        claim.reason === "ip"
          ? "本网络今日的免费额度已用完，请登录或在「模型配置」填你自己的 API Key。"
          : claim.reason === "unavailable"
            ? "体验额度暂不可用，请稍后再试或配置你自己的 API Key。"
            : "今日免费额度已用完，登录可再得 10 次，也可以邀请好友获得奖励次数，或填你自己的 API Key 无限使用。";
      return Response.json(
        { error: msg, reason: claim.reason, quota: true },
        { status: 402 }
      );
    }
    quotaRemaining = claim.remaining;
    if (uid) {
      await qualifyReferral(uid, body.runId).catch(() => null);
    }
    // 用服务端可信配置覆盖客户端字段（key 永不来自客户端）
    body.kind = sm.kind;
    body.baseUrl = sm.baseUrl;
    body.model = sm.model;
    body.apiKey = key;
    body.extraBody = sm.extraBody;
  }

  if (!body.baseUrl || !body.model) {
    return new Response("缺少 baseUrl 或 model", { status: 400 });
  }
  const guardErr = checkUpstreamUrl(body.baseUrl);
  if (guardErr) return new Response(guardErr, { status: 400 });

  return { body, quotaRemaining };
}
