import { NextRequest } from "next/server";
import { checkUpstreamUrl } from "@/lib/upstream-guard";
import { rateLimit } from "@/lib/ratelimit";

/** 拉取厂商的模型列表（OpenAI 兼容 GET /models；Anthropic GET /v1/models） */

export const runtime = "nodejs";

interface Body {
  kind: "openai" | "anthropic";
  baseUrl: string;
  apiKey: string;
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
  const limited = rateLimit(req, "models", 30);
  if (limited) return Response.json({ error: limited }, { status: 429 });

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return Response.json({ error: "请求体不是合法 JSON" });
  }
  if (!body.baseUrl) return Response.json({ error: "请先填写 Base URL" });
  const guardErr = checkUpstreamUrl(body.baseUrl);
  if (guardErr) return Response.json({ error: guardErr });

  const base = body.baseUrl.replace(/\/+$/, "");
  let url: string;
  let headers: Record<string, string>;
  if (body.kind === "anthropic") {
    url = `${base.endsWith("/v1") ? base : `${base}/v1`}/models?limit=100`;
    headers = {
      "x-api-key": body.apiKey,
      "anthropic-version": "2023-06-01",
    };
  } else {
    url = `${base}/models`;
    headers = { Authorization: `Bearer ${body.apiKey}` };
  }

  try {
    const res = await fetch(url, {
      headers,
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return Response.json({ error: await readErr(res) });
    const j: unknown = await res.json();
    const obj = j as { data?: unknown[]; models?: unknown[] };
    const arr: unknown[] = Array.isArray(j) ? j : (obj.data ?? obj.models ?? []);
    const models = arr
      .map((m) => {
        if (typeof m === "string") return m;
        const o = m as { id?: string; model?: string };
        return o.id ?? o.model ?? "";
      })
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));
    if (!models.length)
      return Response.json({
        error: "该接口未返回模型列表（部分厂商不提供，需手填模型 ID）",
      });
    return Response.json({ models });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return Response.json({
      error: msg.includes("abort") || msg.includes("timeout")
        ? "请求超时（15s），请检查 Base URL 与网络"
        : `请求失败：${msg}`,
    });
  }
}
