import { NextRequest } from "next/server";
import { rateLimit } from "@/lib/ratelimit";

/**
 * 分享页投票：POST 提交/改票（每设备每分享 1 票，upsert）；GET 拉聚合。
 * 三种方式 single/rank/score；评论针对模型 + 👍/👎。
 * 服务端用 service_role 绕过 RLS；登录身份由 Bearer token 解析。
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
    const j = (await res.json()) as { id?: string };
    return j.id ?? null;
  } catch {
    return null;
  }
}

interface Row {
  client_id: string;
  user_id: string | null;
  pick: number | null;
  ranks: number[] | null;
  scores: Record<string, Record<string, number>> | null;
  comment: string | null;
  comment_target: number | null;
  comment_sentiment: string | null;
  created_at: string;
}

async function aggregate(
  url: string,
  key: string,
  shareId: string,
  clientId: string,
  method: string
) {
  const res = await fetch(
    `${url.replace(/\/+$/, "")}/rest/v1/share_votes?share_id=eq.${encodeURIComponent(shareId)}&select=*&order=created_at.desc`,
    { headers: sbHeaders(key), signal: AbortSignal.timeout(10000) }
  );
  if (!res.ok) throw new Error(`supabase ${res.status}`);
  const rows = (await res.json()) as Row[];

  type T = {
    metric: number;
    voters: number;
    loginVoters: number;
    rankFirsts: number;
    dimSum: Record<string, number>;
    dimN: Record<string, number>;
    scoreSum: number;
    scoreN: number;
    up: number;
    down: number;
  };
  const m = new Map<number, T>();
  const get = (i: number): T =>
    m.get(i) ??
    m.set(i, {
      metric: 0,
      voters: 0,
      loginVoters: 0,
      rankFirsts: 0,
      dimSum: {},
      dimN: {},
      scoreSum: 0,
      scoreN: 0,
      up: 0,
      down: 0,
    }).get(i)!;

  const comments: {
    target: number;
    sentiment: string | null;
    text: string;
    byLogin: boolean;
    at: string;
  }[] = [];
  let loginTotal = 0;
  let mine: Row | null = null;
  let voterCount = 0;

  for (const r of rows) {
    const login = !!r.user_id;
    const votedSomething =
      r.pick != null || (r.ranks && r.ranks.length) || (r.scores && Object.keys(r.scores).length);
    if (votedSomething) {
      voterCount++;
      if (login) loginTotal++;
    }

    if (method === "single" && r.pick != null) {
      const t = get(r.pick);
      t.metric++;
      t.voters++;
      if (login) t.loginVoters++;
    } else if (method === "rank" && r.ranks) {
      r.ranks.forEach((idx, pos) => {
        const t = get(idx);
        t.metric += [3, 2, 1][pos] ?? 0; // 1/2/3 名 → 3/2/1 分
        t.voters++;
        if (login) t.loginVoters++;
        if (pos === 0) t.rankFirsts++;
      });
    } else if (method === "score" && r.scores) {
      for (const [idxS, dims] of Object.entries(r.scores)) {
        const idx = Number(idxS);
        const t = get(idx);
        let sum = 0,
          n = 0;
        for (const [d, s] of Object.entries(dims)) {
          if (typeof s === "number" && s > 0) {
            t.dimSum[d] = (t.dimSum[d] ?? 0) + s;
            t.dimN[d] = (t.dimN[d] ?? 0) + 1;
            sum += s;
            n++;
          }
        }
        if (n > 0) {
          t.scoreSum += sum / n;
          t.scoreN++;
          t.voters++;
          if (login) t.loginVoters++;
        }
      }
    }

    // 评论 + 赞踩（独立于投票方式）
    if (r.comment_sentiment === "up" || r.comment_sentiment === "down") {
      if (r.comment_target != null && r.comment_target >= 0) {
        const t = get(r.comment_target);
        if (r.comment_sentiment === "up") t.up++;
        else t.down++;
      }
    }
    if (r.comment?.trim())
      comments.push({
        target: r.comment_target ?? -1,
        sentiment: r.comment_sentiment ?? null,
        text: r.comment,
        byLogin: login,
        at: r.created_at,
      });
    if (r.client_id === clientId) mine = r;
  }

  const tallies = [...m.entries()].map(([index, t]) => {
    const dimAvg: Record<string, number> = {};
    for (const d of Object.keys(t.dimSum)) dimAvg[d] = t.dimSum[d] / t.dimN[d];
    const overallAvg = t.scoreN > 0 ? t.scoreSum / t.scoreN : undefined;
    return {
      index,
      metric: method === "score" ? (overallAvg ?? 0) : t.metric,
      voters: t.voters,
      loginVoters: t.loginVoters,
      rankFirsts: method === "rank" ? t.rankFirsts : undefined,
      dimAvg,
      overallAvg,
      up: t.up,
      down: t.down,
    };
  });

  return {
    method,
    total: voterCount,
    loginTotal,
    tallies,
    comments: comments.slice(0, 100),
    mine: mine
      ? {
          pick: mine.pick ?? undefined,
          ranks: mine.ranks ?? undefined,
          scores: mine.scores ?? undefined,
          comment:
            mine.comment || mine.comment_target != null
              ? {
                  target: mine.comment_target ?? -1,
                  sentiment: (mine.comment_sentiment ?? null) as
                    | "up"
                    | "down"
                    | null,
                  text: mine.comment ?? "",
                }
              : undefined,
        }
      : null,
  };
}

async function shareMethod(url: string, key: string, shareId: string) {
  try {
    const res = await fetch(
      `${url.replace(/\/+$/, "")}/rest/v1/shares?id=eq.${encodeURIComponent(shareId)}&select=payload`,
      { headers: sbHeaders(key), signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return "single";
    const rows = (await res.json()) as { payload?: { voting?: { method?: string } } }[];
    return rows[0]?.payload?.voting?.method ?? "single";
  } catch {
    return "single";
  }
}

export async function GET(req: NextRequest) {
  const { url, key } = env();
  if (!url || !key) return Response.json({ ok: false, disabled: true });
  const shareId = req.nextUrl.searchParams.get("shareId") ?? "";
  const clientId = req.nextUrl.searchParams.get("clientId") ?? "";
  if (!/^[0-9A-Za-z]{6,16}$/.test(shareId))
    return Response.json({ ok: false, error: "无效的分享 ID" }, { status: 400 });
  try {
    const method = await shareMethod(url, key, shareId);
    const agg = await aggregate(url, key, shareId, clientId, method);
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
    ranks?: number[];
    scores?: Record<string, Record<string, number>>;
    winnerModel?: string;
    comment?: { target?: number; sentiment?: string; text?: string };
  };
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "bad json" }, { status: 400 });
  }
  const { shareId, clientId } = body;
  if (!shareId || !/^[0-9A-Za-z]{6,16}$/.test(shareId) || !clientId)
    return Response.json({ ok: false, error: "参数不完整" }, { status: 400 });

  const method = await shareMethod(url, key, shareId);

  // 按方式校验主投票
  const row: Record<string, unknown> = {
    share_id: shareId,
    client_id: clientId,
    pick: null,
    ranks: null,
    scores: null,
  };
  if (method === "single") {
    if (typeof body.pick !== "number" || body.pick < 0)
      return Response.json({ ok: false, error: "请选出最佳" }, { status: 400 });
    row.pick = body.pick;
  } else if (method === "rank") {
    if (!Array.isArray(body.ranks) || !body.ranks.length)
      return Response.json({ ok: false, error: "请排出名次" }, { status: 400 });
    row.ranks = body.ranks.slice(0, 3).map((n) => Number(n));
    row.pick = (row.ranks as number[])[0];
  } else if (method === "score") {
    const clean: Record<string, Record<string, number>> = {};
    for (const [idx, dims] of Object.entries(body.scores ?? {})) {
      const cd: Record<string, number> = {};
      for (const [d, s] of Object.entries(dims)) {
        const n = Number(s);
        if (isFinite(n) && n >= 1 && n <= 5) cd[d.slice(0, 40)] = Math.round(n);
      }
      if (Object.keys(cd).length) clean[idx] = cd;
    }
    if (!Object.keys(clean).length)
      return Response.json({ ok: false, error: "请至少给一个模型打分" }, { status: 400 });
    row.scores = clean;
  }
  if (body.winnerModel) row.winner_model = String(body.winnerModel).slice(0, 80);

  // 评论（可选，可针对任意模型）
  if (body.comment) {
    const text =
      typeof body.comment.text === "string"
        ? body.comment.text.trim().slice(0, COMMENT_MAX)
        : "";
    const sentiment =
      body.comment.sentiment === "up" || body.comment.sentiment === "down"
        ? body.comment.sentiment
        : null;
    const target =
      typeof body.comment.target === "number" ? body.comment.target : -1;
    if (text || sentiment) {
      row.comment = text || null;
      row.comment_sentiment = sentiment;
      row.comment_target = target;
    }
  }

  row.user_id = await resolveUserId(req, url, anon);

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
        body: JSON.stringify([row]),
      }
    );
    if (!res.ok) {
      const msg = await res.text().catch(() => "");
      const hint =
        res.status === 404 || /share_votes|PGRST205|column/i.test(msg)
          ? "：share_votes 表未建或缺列，请在 Supabase 跑最新建表/ALTER 语句"
          : `：${msg.slice(0, 140)}`;
      return Response.json({ ok: false, error: `投票失败（${res.status}）${hint}` });
    }
    const agg = await aggregate(url, key, shareId, clientId, method);
    return Response.json({ ok: true, aggregate: agg });
  } catch (e) {
    return Response.json({
      ok: false,
      error: e instanceof Error ? e.message.slice(0, 160) : "投票失败",
    });
  }
}
