import { NextRequest } from "next/server";
import { rateLimit } from "@/lib/ratelimit";
import { makeShareId, type ShareSnapshot } from "@/lib/share";

/**
 * 分享只读链接：POST 存快照到 Supabase 返回短 ID。
 * 快照由前端构建（已剥离 API Key/baseUrl）；服务端只做体积与字段校验。
 * 未配置 Supabase 时返回 disabled。
 */

export const runtime = "nodejs";

const MAX_BODY = 600_000; // 约 0.6MB，足够多模型长文 + 曲线

function sbHeaders(key: string) {
  return {
    "Content-Type": "application/json",
    apikey: key,
    Authorization: `Bearer ${key}`,
  };
}

export async function POST(req: NextRequest) {
  const limited = rateLimit(req, "share", 20);
  if (limited) return Response.json({ ok: false, error: limited }, { status: 429 });

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key)
    return Response.json({ ok: false, disabled: true });

  let snapshot: ShareSnapshot;
  try {
    snapshot = (await req.json()) as ShareSnapshot;
  } catch {
    return Response.json({ ok: false, error: "bad json" }, { status: 400 });
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
  try {
    const res = await fetch(`${url.replace(/\/+$/, "")}/rest/v1/shares`, {
      method: "POST",
      signal: AbortSignal.timeout(10000),
      headers: { ...sbHeaders(key), Prefer: "return=minimal" },
      body: JSON.stringify([{ id, payload: snapshot }]),
    });
    if (!res.ok) {
      const msg = await res.text().catch(() => "");
      // 表不存在（PGRST205 / 42P01）给出明确指引
      const hint =
        res.status === 404 || /relation .* does not exist|PGRST205/i.test(msg)
          ? "：shares 表尚未创建，请在 Supabase SQL Editor 执行 supabase/schema.sql 中的 shares 建表语句"
          : `：${msg.slice(0, 160)}`;
      return Response.json({
        ok: false,
        error: `保存失败（${res.status}）${hint}`,
      });
    }
    return Response.json({ ok: true, id });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return Response.json({
      ok: false,
      error: msg.includes("timeout") || msg.includes("abort")
        ? "保存超时（10s），数据库无响应，请稍后重试"
        : `保存失败：${msg.slice(0, 160)}`,
    });
  }
}
