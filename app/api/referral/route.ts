import { NextRequest } from "next/server";
import { getReferralDashboard, claimReferralAttribution } from "@/lib/referral-server";
import { normalizeReferralCode } from "@/lib/referrals";
import { resolveUserId, safeClientId } from "@/lib/server-auth";

export const runtime = "nodejs";

async function currentUserId(req: NextRequest): Promise<string | null> {
  return resolveUserId(
    req,
    process.env.SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export async function GET(req: NextRequest) {
  const uid = await currentUserId(req);
  if (!uid) {
    return Response.json({ ok: true, loggedIn: false });
  }

  const dashboard = await getReferralDashboard(uid, req.nextUrl.origin);
  if (!dashboard) {
    return Response.json(
      { ok: true, loggedIn: true, available: false },
      { status: 200 }
    );
  }

  return Response.json({
    ok: true,
    loggedIn: true,
    available: true,
    dashboard,
  });
}

export async function POST(req: NextRequest) {
  const uid = await currentUserId(req);
  if (!uid) {
    return Response.json({ ok: false, error: "请先登录", reason: "login" }, { status: 401 });
  }

  let body: { code?: unknown; clientId?: unknown };
  try {
    body = (await req.json()) as { code?: unknown; clientId?: unknown };
  } catch {
    return Response.json({ ok: false, error: "请求体不是合法 JSON" }, { status: 400 });
  }

  const code = normalizeReferralCode(body.code);
  if (!code) {
    return Response.json({ ok: false, error: "邀请码无效", reason: "invalid" }, { status: 400 });
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    null;
  const result = await claimReferralAttribution({
    code,
    inviteeUserId: uid,
    clientId: safeClientId(body.clientId) ?? null,
    ip,
    userAgent: req.headers.get("user-agent"),
  });

  const ok = result.ok || result.reason === "already";
  return Response.json(
    {
      ok,
      reason: result.reason,
      status: result.status,
      message: referralClaimMessage(result.reason),
    },
    { status: ok ? 200 : 400 }
  );
}

function referralClaimMessage(reason: string): string {
  switch (reason) {
    case "claimed":
      return "邀请关系已记录，完成首次对比后双方会自动获得奖励次数。";
    case "already":
      return "邀请关系已记录，完成首次对比后会自动发放奖励。";
    case "self":
      return "不能使用自己的邀请链接。";
    case "existing_user":
      return "该账号已体验过，不能作为新邀请用户领取奖励。";
    case "already_attributed":
      return "该账号已绑定过其他邀请人。";
    case "unavailable":
      return "邀请系统暂不可用，请稍后再试。";
    default:
      return "邀请码无效。";
  }
}
