import { NextRequest } from "next/server";
import { rateLimit } from "@/lib/ratelimit";

/**
 * 可选遥测接收端：写入 Supabase（REST 接口，免 SDK）。
 *
 * 仅保存指标类数据（供应商域名、模型名、时延/TPS/token 数、输入输出长度、
 * 匿名设备 ID、同意记录）；不接收也不保存 API Key 和输入输出内容——
 * 客户端根本不会发送这些字段，服务端按白名单字段二次过滤。
 *
 * 未配置 SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 时整体禁用（返回 disabled）。
 */

export const runtime = "nodejs";

const METRIC_FIELDS = [
  "clientId",
  "runId",
  "provider",
  "kind",
  "model",
  "status",
  "hasError",
  "hasImage",
  "promptChars",
  "outputChars",
  "reasoningChars",
  "ttftMs",
  "thinkingMs",
  "contentMs",
  "totalMs",
  "thinkingTps",
  "contentTps",
  "avgTps",
  "peakTps",
  "promptTokens",
  "outputTokens",
  "reasoningTokens",
  "contentTokens",
  "tokensOfficial",
  "rank",
] as const;

/** camelCase → snake_case（与表结构对应） */
const snake = (s: string) => s.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);

/**
 * 把一条原始记录规整成固定列集合的行。
 * 关键：每行都包含「全部」字段（缺失/undefined/非有限数 → null），
 * 否则 PostgREST 批量插入会因各对象 key 不一致报 PGRST102
 * （"All object keys must match"）——成功行有全部指标、出错行只有少数字段时必触发。
 */
function pickMetricRow(raw: Record<string, unknown>) {
  const row: Record<string, unknown> = {};
  for (const f of METRIC_FIELDS) {
    let v = raw[f];
    if (typeof v === "number" && !isFinite(v)) v = undefined;
    else if (typeof v === "string" && v.length > 200) v = v.slice(0, 200);
    row[snake(f)] = v === undefined ? null : v;
  }
  return row;
}

async function supabaseInsert(
  table: string,
  rows: Record<string, unknown>[]
): Promise<string | null> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return "disabled";
  // 跨区/弱网下 10s 太紧——放宽到 25s，并对超时重试一次
  let lastErr = "";
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(`${url.replace(/\/+$/, "")}/rest/v1/${table}`, {
        method: "POST",
        signal: AbortSignal.timeout(25000),
        headers: {
          "Content-Type": "application/json",
          apikey: key,
          Authorization: `Bearer ${key}`,
          Prefer: "return=minimal",
        },
        body: JSON.stringify(rows),
      });
      if (res.ok) return null;
      const msg = await res.text().catch(() => "");
      return `supabase ${res.status}: ${msg.slice(0, 200)}`; // HTTP 错误不重试
    } catch (e) {
      lastErr = e instanceof Error ? e.message : String(e);
      // 仅超时/网络错误重试
    }
  }
  return `上报超时或网络异常：${lastErr.slice(0, 120)}`;
}

export async function POST(req: NextRequest) {
  const limited = rateLimit(req, "telemetry", 120);
  if (limited) return Response.json({ ok: false, error: limited }, { status: 429 });

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ ok: false, error: "bad json" }, { status: 400 });
  }

  try {
    if (body.type === "consent") {
      const row = {
        client_id: String(body.clientId ?? "unknown").slice(0, 64),
        choice: body.choice === "granted" ? "granted" : "denied",
        consent_version: Number(body.consentVersion) || 0,
        user_agent: String(body.userAgent ?? "").slice(0, 200),
      };
      const err = await supabaseInsert("consents", [row]);
      if (err === "disabled") return Response.json({ ok: false, disabled: true });
      if (err) return Response.json({ ok: false, error: err });
      return Response.json({ ok: true });
    }

    if (body.type === "metrics") {
      const raw = Array.isArray(body.records) ? body.records : [];
      const rows = raw
        .slice(0, 20) // 单次最多 20 条，防滥用
        .map((r) => pickMetricRow(r as Record<string, unknown>))
        .filter((r) => r.model && r.provider);
      if (!rows.length)
        return Response.json({ ok: false, error: "no rows" }, { status: 400 });
      const err = await supabaseInsert("run_metrics", rows);
      if (err === "disabled") return Response.json({ ok: false, disabled: true });
      if (err) return Response.json({ ok: false, error: err });
      return Response.json({ ok: true, count: rows.length });
    }

    return Response.json({ ok: false, error: "unknown type" }, { status: 400 });
  } catch (e) {
    return Response.json({
      ok: false,
      error: e instanceof Error ? e.message.slice(0, 200) : "error",
    });
  }
}
