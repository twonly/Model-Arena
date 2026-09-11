import type { NextRequest } from "next/server";
import { ORCAROUTER_TOKEN_URL } from "../../../../lib/orcarouter.ts";
import { rateLimit } from "../../../../lib/ratelimit.ts";

export const runtime = "nodejs";

interface ExchangeBody {
  code?: string;
  codeVerifier?: string;
}

function validCode(value: string | undefined): value is string {
  return !!value && value.length <= 2048 && !/[\s\u0000-\u001f\u007f]/.test(value);
}

function validVerifier(value: string | undefined): value is string {
  return (
    !!value &&
    value.length >= 43 &&
    value.length <= 128 &&
    /^[A-Za-z0-9._~-]+$/.test(value)
  );
}

export async function POST(req: NextRequest) {
  const limited = rateLimit(req, "orcarouter-exchange", 10);
  if (limited) return Response.json({ error: limited }, { status: 429 });

  let body: ExchangeBody;
  try {
    body = (await req.json()) as ExchangeBody;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!validCode(body.code) || !validVerifier(body.codeVerifier)) {
    return Response.json(
      { error: "Invalid authorization code or PKCE verifier" },
      { status: 400 }
    );
  }

  try {
    const upstream = await fetch(ORCAROUTER_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: body.code,
        code_verifier: body.codeVerifier,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
    const payload = (await upstream.json().catch(() => null)) as {
      key?: unknown;
      error?: unknown;
      message?: unknown;
    } | null;
    if (
      !upstream.ok ||
      typeof payload?.key !== "string" ||
      !payload.key.startsWith("sk-orca-")
    ) {
      const detail =
        typeof payload?.error === "string"
          ? payload.error
          : typeof payload?.message === "string"
            ? payload.message
            : "OrcaRouter rejected the authorization code";
      return Response.json({ error: detail.slice(0, 300) }, { status: 400 });
    }
    return Response.json(
      { key: payload.key },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json(
      {
        error:
          message.includes("abort") || message.includes("timeout")
            ? "OrcaRouter key exchange timed out"
            : "Unable to reach OrcaRouter",
      },
      { status: 502 }
    );
  }
}
