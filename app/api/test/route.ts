import { NextRequest } from "next/server";
import { checkUpstreamUrl } from "@/lib/upstream-guard";

/** 连通性测试：用极小的 max_tokens 发一次真实补全，验证 URL / Key / 模型 ID */

export const runtime = "nodejs";

interface Body {
  kind: "openai" | "anthropic";
  baseUrl: string;
  apiKey: string;
  model: string;
}

async function readErr(res: Response): Promise<string> {
  const raw = await res.text().catch(() => "");
  try {
    const j = JSON.parse(raw);
    const msg = j?.error?.message ?? j?.message ?? j?.msg ?? raw;
    return `HTTP ${res.status}：${typeof msg === "string" ? msg : raw}`.slice(0, 400);
  } catch {
    return `HTTP ${res.status}：${raw.slice(0, 200) || res.statusText}`;
  }
}

export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return Response.json({ ok: false, error: "请求体不是合法 JSON" });
  }
  if (!body.baseUrl || !body.model)
    return Response.json({ ok: false, error: "请先填写 Base URL 和模型 ID" });
  const guardErr = checkUpstreamUrl(body.baseUrl);
  if (guardErr) return Response.json({ ok: false, error: guardErr });

  const base = body.baseUrl.replace(/\/+$/, "");
  const t0 = Date.now();
  try {
    let res: Response;
    if (body.kind === "anthropic") {
      const url = `${base.endsWith("/v1") ? base : `${base}/v1`}/messages`;
      res = await fetch(url, {
        method: "POST",
        signal: AbortSignal.timeout(30000),
        headers: {
          "Content-Type": "application/json",
          "x-api-key": body.apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: body.model,
          max_tokens: 16,
          messages: [{ role: "user", content: "hi" }],
        }),
      });
    } else {
      res = await fetch(`${base}/chat/completions`, {
        method: "POST",
        signal: AbortSignal.timeout(30000),
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${body.apiKey}`,
        },
        body: JSON.stringify({
          model: body.model,
          max_tokens: 16,
          messages: [{ role: "user", content: "hi" }],
        }),
      });
    }
    if (!res.ok)
      return Response.json({ ok: false, error: await readErr(res) });
    await res.json().catch(() => null);
    return Response.json({ ok: true, latencyMs: Date.now() - t0 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return Response.json({
      ok: false,
      error: msg.includes("abort") || msg.includes("timeout")
        ? "请求超时（30s），请检查 Base URL 与网络"
        : `请求失败：${msg}`,
    });
  }
}
