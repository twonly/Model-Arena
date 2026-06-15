import { NextRequest } from "next/server";
import { gunzipSync } from "node:zlib";
import { rateLimit } from "@/lib/ratelimit";
import { makeShareId, type ShareSnapshot } from "@/lib/share";
import { resolveUserId, safeClientId, ownerFilter } from "@/lib/server-auth";

/**
 * 分享只读链接：
 *   POST   存快照到 Supabase，归属到创建者(设备ID + 可选登录账号)，返回短 ID
 *   GET    ?clientId=...&mine=1  列出「我的分享」（含关闭状态/浏览数）
 *   PATCH  {id, clientId, disabled}  软关闭/重新开启（仅归属人）
 *   DELETE {id, clientId}  彻底删除（仅归属人）
 * 快照由前端构建（已剥离 API Key/baseUrl）；服务端做体积与字段校验。
 * service_role 绕过 RLS，故归属校验由服务端自行用 owner 过滤兜住。
 */

export const runtime = "nodejs";

const MAX_BODY = 1_500_000; // 约 1.5MB，容纳多模型长文/HTML + 曲线

function env() {
  return {
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_SERVICE_ROLE_KEY,
    anon: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  };
}
function sbHeaders(key: string) {
  return {
    "Content-Type": "application/json",
    apikey: key,
    Authorization: `Bearer ${key}`,
  };
}
const base = (url: string) => url.replace(/\/+$/, "");

export async function POST(req: NextRequest) {
  const limited = rateLimit(req, "share", 20);
  if (limited) return Response.json({ ok: false, error: limited }, { status: 429 });

  const { url, key, anon } = env();
  if (!url || !key) return Response.json({ ok: false, disabled: true });

  let body: { snapshot?: ShareSnapshot; gz?: string; clientId?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return Response.json({ ok: false, error: "bad json" }, { status: 400 });
  }
  // 新客户端发 gz（base64 gzip 的 snapshot）；老客户端仍发明文 snapshot
  let snapshot = body.snapshot;
  if (!snapshot && typeof body.gz === "string") {
    try {
      const json = gunzipSync(Buffer.from(body.gz, "base64"), {
        maxOutputLength: MAX_BODY, // 防 zip bomb：解压超上限即抛 RangeError
      }).toString("utf8");
      snapshot = JSON.parse(json) as ShareSnapshot;
    } catch (e) {
      const tooBig = e instanceof RangeError;
      return Response.json(
        {
          ok: false,
          error: tooBig
            ? `内容过大无法分享（上限 ${Math.round(MAX_BODY / 1024)}KB）。可减少模型数量或缩短输出后重试。`
            : "压缩内容解析失败",
        },
        { status: tooBig ? 413 : 400 }
      );
    }
  }
  if (
    !snapshot ||
    snapshot.v !== 1 ||
    !Array.isArray(snapshot.results) ||
    !snapshot.results.length
  ) {
    return Response.json({ ok: false, error: "无可分享的结果" }, { status: 400 });
  }
  const size = JSON.stringify(snapshot).length;
  if (size > MAX_BODY)
    return Response.json(
      {
        ok: false,
        error: `内容过大无法分享（${Math.round(size / 1024)}KB，上限 ${Math.round(MAX_BODY / 1024)}KB）。可减少模型数量或缩短输出后重试。`,
      },
      { status: 413 }
    );

  const id = makeShareId();
  const ownerClientId = safeClientId(body.clientId);
  const ownerUserId = await resolveUserId(req, url, anon);
  const row = {
    id,
    payload: snapshot,
    owner_client_id: ownerClientId,
    owner_user_id: ownerUserId,
    disabled: false,
    title: (snapshot.title || "").slice(0, 200),
    model_count: snapshot.results.length,
  };

  try {
    const res = await fetch(`${base(url)}/rest/v1/shares`, {
      method: "POST",
      signal: AbortSignal.timeout(10000),
      headers: { ...sbHeaders(key), Prefer: "return=minimal" },
      body: JSON.stringify([row]),
    });
    if (!res.ok) {
      const msg = await res.text().catch(() => "");
      const hint =
        res.status === 404 || /relation .* does not exist|PGRST205/i.test(msg)
          ? "：shares 表尚未创建，请在 Supabase SQL Editor 执行 supabase/schema.sql 中的 shares 建表语句"
          : /owner_client_id|owner_user_id|disabled|model_count|column .* does not exist|PGRST204/i.test(
                msg
              )
            ? "：shares 表缺少新列，请重跑 supabase/schema.sql 里 shares 的 alter 语句（owner/disabled 等）"
            : `：${msg.slice(0, 160)}`;
      return Response.json({ ok: false, error: `保存失败（${res.status}）${hint}` });
    }
    return Response.json({ ok: true, id });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return Response.json({
      ok: false,
      error:
        msg.includes("timeout") || msg.includes("abort")
          ? "保存超时（10s），数据库无响应，请稍后重试"
          : `保存失败：${msg.slice(0, 160)}`,
    });
  }
}

/** 列出「我的分享」 */
export async function GET(req: NextRequest) {
  const { url, key, anon } = env();
  if (!url || !key) return Response.json({ ok: false, disabled: true });
  const clientId = safeClientId(req.nextUrl.searchParams.get("clientId"));
  if (!clientId)
    return Response.json({ ok: false, error: "缺少有效 clientId" }, { status: 400 });
  const uid = await resolveUserId(req, url, anon);

  const q =
    `${base(url)}/rest/v1/shares?` +
    ownerFilter("owner_client_id", "owner_user_id", clientId, uid) +
    `&select=id,created_at,disabled,views,title,model_count` +
    `&order=created_at.desc&limit=200`;
  try {
    const res = await fetch(q, { headers: sbHeaders(key), cache: "no-store" });
    if (!res.ok) {
      const msg = await res.text().catch(() => "");
      return Response.json({
        ok: false,
        error: `加载失败 ${res.status}: ${msg.slice(0, 140)}`,
      });
    }
    const rows = (await res.json()) as Array<{
      id: string;
      created_at: string;
      disabled: boolean | null;
      views: number | null;
      title: string | null;
      model_count: number | null;
    }>;
    return Response.json({
      ok: true,
      shares: rows.map((r) => ({
        id: r.id,
        createdAt: r.created_at,
        disabled: !!r.disabled,
        views: r.views ?? 0,
        title: r.title ?? "",
        modelCount: r.model_count ?? 0,
      })),
    });
  } catch (e) {
    return Response.json({
      ok: false,
      error: e instanceof Error ? e.message.slice(0, 160) : "加载失败",
    });
  }
}

/** 软关闭 / 重新开启 */
export async function PATCH(req: NextRequest) {
  const limited = rateLimit(req, "share", 40);
  if (limited) return Response.json({ ok: false, error: limited }, { status: 429 });
  const { url, key, anon } = env();
  if (!url || !key) return Response.json({ ok: false, disabled: true });

  let body: { id?: string; clientId?: string; disabled?: boolean };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return Response.json({ ok: false, error: "bad json" }, { status: 400 });
  }
  const clientId = safeClientId(body.clientId);
  if (!body.id || !/^[0-9A-Za-z]{6,16}$/.test(body.id) || !clientId)
    return Response.json({ ok: false, error: "参数不完整" }, { status: 400 });
  const uid = await resolveUserId(req, url, anon);

  const q =
    `${base(url)}/rest/v1/shares?id=eq.${body.id}&` +
    ownerFilter("owner_client_id", "owner_user_id", clientId, uid);
  try {
    const res = await fetch(q, {
      method: "PATCH",
      headers: { ...sbHeaders(key), Prefer: "return=representation" },
      body: JSON.stringify({ disabled: !!body.disabled }),
    });
    if (!res.ok) {
      const msg = await res.text().catch(() => "");
      return Response.json({
        ok: false,
        error: `操作失败 ${res.status}: ${msg.slice(0, 140)}`,
      });
    }
    const updated = (await res.json()) as unknown[];
    if (!updated.length)
      return Response.json({ ok: false, error: "无权操作或分享不存在" }, { status: 403 });
    return Response.json({ ok: true, disabled: !!body.disabled });
  } catch (e) {
    return Response.json({
      ok: false,
      error: e instanceof Error ? e.message.slice(0, 160) : "操作失败",
    });
  }
}

/** 彻底删除 */
export async function DELETE(req: NextRequest) {
  const limited = rateLimit(req, "share", 40);
  if (limited) return Response.json({ ok: false, error: limited }, { status: 429 });
  const { url, key, anon } = env();
  if (!url || !key) return Response.json({ ok: false, disabled: true });

  let body: { id?: string; clientId?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return Response.json({ ok: false, error: "bad json" }, { status: 400 });
  }
  const clientId = safeClientId(body.clientId);
  if (!body.id || !/^[0-9A-Za-z]{6,16}$/.test(body.id) || !clientId)
    return Response.json({ ok: false, error: "参数不完整" }, { status: 400 });
  const uid = await resolveUserId(req, url, anon);

  const q =
    `${base(url)}/rest/v1/shares?id=eq.${body.id}&` +
    ownerFilter("owner_client_id", "owner_user_id", clientId, uid);
  try {
    const res = await fetch(q, {
      method: "DELETE",
      headers: { ...sbHeaders(key), Prefer: "return=representation" },
    });
    if (!res.ok) {
      const msg = await res.text().catch(() => "");
      return Response.json({
        ok: false,
        error: `删除失败 ${res.status}: ${msg.slice(0, 140)}`,
      });
    }
    const deleted = (await res.json()) as unknown[];
    if (!deleted.length)
      return Response.json({ ok: false, error: "无权操作或分享不存在" }, { status: 403 });
    // 顺手清掉这条分享下的投票，避免孤儿数据
    await fetch(`${base(url)}/rest/v1/share_votes?share_id=eq.${body.id}`, {
      method: "DELETE",
      headers: sbHeaders(key),
    }).catch(() => {});
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({
      ok: false,
      error: e instanceof Error ? e.message.slice(0, 160) : "删除失败",
    });
  }
}
