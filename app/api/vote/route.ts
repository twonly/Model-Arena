import { NextRequest } from "next/server";
import { rateLimit } from "@/lib/ratelimit";
import { COMMENT_MAX, wilson } from "@/lib/voting-core";

/**
 * 分享页投票（简化版）：每模型 👍/👎 + 评论。
 *   POST 对某模型表态/评论（upsert 每设备每模型一行）
 *   GET  拉聚合（每模型 up/down/wilson + 评论 + 本设备反应）
 * 服务端用 service_role 绕过 RLS；登录身份由 Bearer token 解析。
 */
export const runtime = "nodejs";

function env() {
  return {
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_SERVICE_ROLE_KEY,
    anon: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  };
}
const sbHeaders = (key: string) => ({ apikey: key, Authorization: `Bearer ${key}` });

async function resolveUserId(req: NextRequest, url: string, anon?: string) {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ") || !anon) return null;
  try {
    const res = await fetch(`${url.replace(/\/+$/, "")}/auth/v1/user`, {
      headers: { apikey: anon, Authorization: auth },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    return ((await res.json()) as { id?: string }).id ?? null;
  } catch {
    return null;
  }
}

interface Row {
  client_id: string;
  user_id: string | null;
  model_index: number;
  sentiment: string | null;
  comment: string | null;
  created_at: string;
}

async function aggregate(url: string, key: string, shareId: string, clientId: string) {
  const res = await fetch(
    `${url.replace(/\/+$/, "")}/rest/v1/share_votes?share_id=eq.${encodeURIComponent(shareId)}&select=client_id,user_id,model_index,sentiment,comment,created_at&order=created_at.desc`,
    { headers: sbHeaders(key), signal: AbortSignal.timeout(10000) }
  );
  if (!res.ok) throw new Error(`supabase ${res.status}`);
  const rows = (await res.json()) as Row[];

  const stat = new Map<
    number,
    { up: number; down: number; loginUp: number; comments: number }
  >();
  const get = (i: number) =>
    stat.get(i) ??
    stat.set(i, { up: 0, down: 0, loginUp: 0, comments: 0 }).get(i)!;

  const comments: {
    modelIndex: number;
    sentiment: string | null;
    text: string;
    byLogin: boolean;
    at: string;
  }[] = [];
  const voters = new Set<string>();
  const loginVoterSet = new Set<string>();
  const mine: Record<number, { sentiment: string | null; comment?: string }> = {};

  for (const r of rows) {
    const s = get(r.model_index);
    if (r.sentiment === "up") {
      s.up++;
      if (r.user_id) s.loginUp++;
    } else if (r.sentiment === "down") s.down++;
    if (r.sentiment) {
      voters.add(r.client_id);
      if (r.user_id) loginVoterSet.add(r.client_id);
    }
    if (r.comment?.trim()) {
      s.comments++;
      comments.push({
        modelIndex: r.model_index,
        sentiment: r.sentiment,
        text: r.comment,
        byLogin: !!r.user_id,
        at: r.created_at,
      });
    }
    if (r.client_id === clientId)
      mine[r.model_index] = {
        sentiment: r.sentiment,
        comment: r.comment ?? undefined,
      };
  }

  const models = [...stat.entries()]
    .map(([index, s]) => {
      const total = s.up + s.down;
      return {
        index,
        up: s.up,
        down: s.down,
        loginUp: s.loginUp,
        comments: s.comments,
        ratio: total > 0 ? s.up / total : 0,
        wilson: wilson(s.up, total),
      };
    })
    .sort((a, b) => a.index - b.index);

  return {
    totalVoters: voters.size,
    loginVoters: loginVoterSet.size,
    models,
    comments: comments.slice(0, 100),
    mine,
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
    return Response.json({ ok: true, aggregate: await aggregate(url, key, shareId, clientId) });
  } catch (e) {
    return Response.json({
      ok: false,
      error: e instanceof Error ? e.message.slice(0, 160) : "获取失败",
    });
  }
}

export async function POST(req: NextRequest) {
  const limited = rateLimit(req, "vote", 60);
  if (limited) return Response.json({ ok: false, error: limited }, { status: 429 });
  const { url, key, anon } = env();
  if (!url || !key) return Response.json({ ok: false, disabled: true });

  let body: {
    shareId?: string;
    clientId?: string;
    modelIndex?: number;
    modelId?: string;
    sentiment?: string | null;
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
    typeof body.modelIndex !== "number" ||
    body.modelIndex < 0
  )
    return Response.json({ ok: false, error: "参数不完整" }, { status: 400 });

  const sentiment =
    body.sentiment === "up" || body.sentiment === "down" ? body.sentiment : null;
  let comment: string | null = null;
  if (typeof body.comment === "string" && body.comment.trim())
    comment = body.comment.trim().slice(0, COMMENT_MAX);

  const row = {
    share_id: shareId,
    client_id: clientId,
    user_id: await resolveUserId(req, url, anon),
    model_index: body.modelIndex,
    model_id: body.modelId ? String(body.modelId).slice(0, 80) : null,
    sentiment,
    comment,
  };

  try {
    const res = await fetch(
      `${url.replace(/\/+$/, "")}/rest/v1/share_votes?on_conflict=share_id,client_id,model_index`,
      {
        method: "POST",
        signal: AbortSignal.timeout(12000),
        headers: {
          ...sbHeaders(key),
          "Content-Type": "application/json",
          Prefer: "resolution=merge-duplicates,return=minimal",
        },
        body: JSON.stringify([row]),
      }
    );
    if (!res.ok) {
      const msg = await res.text().catch(() => "");
      const hint =
        res.status === 404 || /share_votes|PGRST205|column|model_index/i.test(msg)
          ? "：share_votes 表结构为旧版，请在 Supabase 重跑最新建表语句（会 drop 重建）"
          : `：${msg.slice(0, 140)}`;
      return Response.json({ ok: false, error: `操作失败（${res.status}）${hint}` });
    }
    return Response.json({
      ok: true,
      aggregate: await aggregate(url, key, shareId, clientId),
    });
  } catch (e) {
    return Response.json({
      ok: false,
      error: e instanceof Error ? e.message.slice(0, 160) : "操作失败",
    });
  }
}
