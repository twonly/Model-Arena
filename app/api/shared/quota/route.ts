import { NextRequest } from "next/server";
import { resolveUserId, safeClientId } from "@/lib/server-auth";
import { sharedQuotaStatus, sharedUsedToday } from "@/lib/shared-server";
import { FREE_LIMIT_ANON, FREE_LIMIT_USER } from "@/lib/shared-models";

export const runtime = "nodejs";

/** 返回当前身份今日的共享额度用量，供前端额度条显示。 */
export async function GET(req: NextRequest) {
  const clientId = safeClientId(req.nextUrl.searchParams.get("clientId"));
  const uid = await resolveUserId(
    req,
    process.env.SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  const who = uid ?? clientId;
  if (!who) return Response.json({ ok: false, error: "缺少身份" }, { status: 400 });

  const limit = uid ? FREE_LIMIT_USER : FREE_LIMIT_ANON;
  const status = await sharedQuotaStatus(who, uid ? "user" : "client", limit);
  if (status) {
    return Response.json({
      ok: true,
      available: true,
      loggedIn: !!uid,
      ...status,
    });
  }

  const used = await sharedUsedToday(who);
  if (used == null) {
    // 配额系统不可用（未建表等）：不阻塞页面，给个保守占位
    return Response.json({
      ok: true,
      available: false,
      limit,
      baseLimit: limit,
      baseUsed: 0,
      baseRemaining: 0,
      bonusRemaining: 0,
      remaining: 0,
      loggedIn: !!uid,
    });
  }
  return Response.json({
    ok: true,
    available: true,
    limit,
    baseLimit: limit,
    baseUsed: used,
    baseRemaining: Math.max(limit - used, 0),
    bonusRemaining: 0,
    totalUsed: used,
    remaining: Math.max(limit - used, 0),
    loggedIn: !!uid,
  });
}
