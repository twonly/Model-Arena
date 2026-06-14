import { NextRequest } from "next/server";
import { rateLimit } from "@/lib/ratelimit";

/**
 * 分享页投票：
 *   POST  提交/改票（每设备每分享 1 票，upsert）
 *   GET   拉聚合结果（票数/登录票/维度均分/评论 + 本设备已投内容）
 * 登录用户的 user_id 由 Authorization: Bearer <access_token> 解析（可空=匿名）。
 * 服务端用 service_role 操作，绕过 RLS。
 */

export const runtime = "nodejs";

const COMMENT_MAX = 500;

function env() {
  return {
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_SERVICE_ROLE_KEY,
    anon: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  };
}

function sbHeaders(key: string) {
  return { apikey: key, Authorization: `Bearer ${key}` };
}

/** 用 anon key 把前端带来的用户 token 换成 user_id（验证登录身份） */
async function resolveUserId(
  req: NextRequest,
  url: string,
  anon?: string
): Promise<string | null> {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ") || !anon) return null;
  try {
    const res = await fetch(`${url.replace(/\/+$/, "")}/auth/v1/user`, {
      headers: { apikey: anon, Authorization: auth },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const j = (await res.json()) as { id?: string };
    return j.id ?? null;
  } catch {
    return null;
  }
}

interface VoteRow {
  client_id: string;
  user_id: string | null;
  pick: number;
  scores: Record<string, number> | null;
  comment: string | null;
}

async function aggregate(
  url: string,
  key: string,
  shareId: string,
  clientId: string
) {
  const res = await fetch(
    `${url.replace(/\/+$/, "")}/rest/v1/share_votes?share_id=eq.${encodeURIComponent(shareId)}&select=client_id,user_id,pick,scores,comment,created_at&order=created_at.desc`,
    { headers: sbHeaders(key), signal: AbortSignal.timeout(10000) }
  );
  if (!res.ok) throw new Error(`supabase ${res.status}`);
  const rows = (await res.json()) as (VoteRow & { created_at: string })[];

  const tallyMap = new Map<
    number,
    { votes: number; loginVotes: number; dimSum: Record<string, number>; dimN: Record<string, number> }
  >();
  const comments: {
    pick: number;
    comment: string;
    byLogin: boolean;
    at: string;
  }[] = [];
  let loginTotal = 0;
  let mine: VoteRow | null = null;

  for (const r of rows) {
    const t =
      tallyMap.get(r.pick) ??
      tallyMap.set(r.pick, { votes: 0, loginVotes: 0, dimSum: {}, dimN: {} }).get(r.pick)!;
    t.votes++;
    if (r.user_id) {
      t.loginVotes++;
      loginTotal++;
    }
    if (r.scores) {
      for (const [d, s] of Object.entries(r.scores)) {
        if (typeof s === "number" && s > 0) {
          t.dimSum[d] = (t.dimSum[d] ?? 0) + s;
          t.dimN[d] = (t.dimN[d] ?? 0) + 1;
        }
      }
    }
    if (r.comment?.trim())
      comments.push({
        pick: r.pick,
        comment: r.comment,
        byLogin: !!r.user_id,
        at: r.created_at,
      });
    if (r.client_id === clientId) mine = r;
  }

  const tallies = [...tallyMap.entries()].map(([index, t]) => {
    const dimAvg: Record<string, number> = {};
    for (const d of Object.keys(t.dimSum)) dimAvg[d] = t.dimSum[d] / t.dimN[d];
    return { index, votes: t.votes, loginVotes: t.loginVotes, dimAvg };
  });

  return {
    total: rows.length,
    loginTotal,
    tallies,
    comments: comments.slice(0, 100),
    mine: mine
      ? { pick: mine.pick, scores: mine.scores ?? undefined, comment: mine.comment ?? undefined }
      : null,
  };
}

export async function GET(req: NextRequest) {
  const { url, key } = env();
  if (!url || !key) return Response.json({ ok: false, disabled: true });
  const shareId = req.nextUrl.searchParams.get("shareId") ?? "";
  const clientId = req.nextUrl.searchParams.get("clientId") ?? "";
  if (!/^[0-9A-Za-z]{6,16}$/.test(shareId))
    return Response.json({ ok: false, error: "无效的分享 ID" }, { status: 400 });
  try {
    const agg = await aggregate(url, key, shareId, clientId);
    return Response.json({ ok: true, aggregate: agg });
  } catch (e) {
    return Response.json({
      ok: false,
      error: e instanceof Error ? e.message.slice(0, 160) : "获取失败",
    });
  }
}

export async function POST(req: NextRequest) {
  const limited = rateLimit(req, "vote", 30);
  if (limited) return Response.json({ ok: false, error: limited }, { status: 429 });

  const { url, key, anon } = env();
  if (!url || !key) return Response.json({ ok: false, disabled: true });

  let body: {
    shareId?: string;
    clientId?: string;
    pick?: number;
    scores?: Record<string, number>;
    comment?: string;
  };
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "bad json" }, { status: 400 });
  }
  const { shareId, clientId } = body;
  if (
    !shareId ||
    !/^[0-9A-Za-z]{6,16}$/.test(shareId) ||
    !clientId ||
    typeof body.pick !== "number" ||
    body.pick < 0
  )
    return Response.json({ ok: false, error: "参数不完整" }, { status: 400 });

  // 评论长度服务端兜底
  let comment: string | null = null;
  if (typeof body.comment === "string" && body.comment.trim()) {
    comment = body.comment.trim().slice(0, COMMENT_MAX);
  }
  // 星级校验 1..5
  let scores: Record<string, number> | null = null;
  if (body.scores && typeof body.scores === "object") {
    const clean: Record<string, number> = {};
    for (const [d, s] of Object.entries(body.scores)) {
      const n = Number(s);
      if (isFinite(n) && n >= 1 && n <= 5) clean[d.slice(0, 40)] = Math.round(n);
    }
    if (Object.keys(clean).length) scores = clean;
  }

  const userId = await resolveUserId(req, url, anon);

  try {
    const res = await fetch(
      `${url.replace(/\/+$/, "")}/rest/v1/share_votes?on_conflict=share_id,client_id`,
      {
        method: "POST",
        signal: AbortSignal.timeout(12000),
        headers: {
          ...sbHeaders(key),
          "Content-Type": "application/json",
          Prefer: "resolution=merge-duplicates,return=minimal",
        },
        body: JSON.stringify([
          {
            share_id: shareId,
            client_id: clientId,
            user_id: userId,
            pick: body.pick,
            scores,
            comment,
          },
        ]),
      }
    );
    if (!res.ok) {
      const msg = await res.text().catch(() => "");
      const hint =
        res.status === 404 || /share_votes|PGRST205/i.test(msg)
          ? "：share_votes 表未创建，请在 Supabase 执行建表语句"
          : `：${msg.slice(0, 140)}`;
      return Response.json({ ok: false, error: `投票失败（${res.status}）${hint}` });
    }
    const agg = await aggregate(url, key, shareId, clientId);
    return Response.json({ ok: true, aggregate: agg });
  } catch (e) {
    return Response.json({
      ok: false,
      error: e instanceof Error ? e.message.slice(0, 160) : "投票失败",
    });
  }
}
