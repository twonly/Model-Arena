import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export interface ChatWorkerTicketClaims {
  v: 1;
  iat: number;
  exp: number;
  bodyHash: string;
  uid?: string;
  ip?: string;
}

export function normalizeWorkerUrl(url: string): string {
  return url.trim().replace(/\/+$/, "");
}

export function workerChatUrl(url: string): string {
  const base = normalizeWorkerUrl(url);
  if (!base) return "";
  return base.endsWith("/chat") ? base : `${base}/chat`;
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  const obj = value as Record<string, unknown>;
  return `{${Object.keys(obj)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(obj[key])}`)
    .join(",")}}`;
}

export function hashChatBody(body: unknown): string {
  return createHash("sha256").update(stableStringify(body)).digest("base64url");
}

function signPayload(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function createWorkerTicket(
  body: unknown,
  context: { uid?: string | null; ip?: string | null },
  secret = process.env.CHAT_WORKER_SIGNING_SECRET,
  now = Date.now()
): { ticket: string; expiresAt: string } | null {
  if (!secret) return null;
  const claims: ChatWorkerTicketClaims = {
    v: 1,
    iat: now,
    exp: now + 30 * 60 * 1000,
    bodyHash: hashChatBody(body),
    ...(context.uid ? { uid: context.uid } : {}),
    ...(context.ip ? { ip: context.ip } : {}),
  };
  const payload = Buffer.from(JSON.stringify(claims), "utf8").toString("base64url");
  const sig = signPayload(payload, secret);
  return {
    ticket: `${payload}.${sig}`,
    expiresAt: new Date(claims.exp).toISOString(),
  };
}

export function verifyWorkerTicket(
  ticket: string,
  body: unknown,
  secret = process.env.CHAT_WORKER_SIGNING_SECRET,
  now = Date.now()
): { ok: true; claims: ChatWorkerTicketClaims } | { ok: false; error: string } {
  if (!secret) return { ok: false, error: "CHAT_WORKER_SIGNING_SECRET 未配置" };
  const [payload, sig] = ticket.split(".");
  if (!payload || !sig) return { ok: false, error: "ticket 格式无效" };
  const expected = signPayload(payload, secret);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return { ok: false, error: "ticket 签名无效" };
  }
  let claims: ChatWorkerTicketClaims;
  try {
    claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return { ok: false, error: "ticket 内容无效" };
  }
  if (claims.v !== 1 || typeof claims.exp !== "number") {
    return { ok: false, error: "ticket 版本无效" };
  }
  if (claims.exp < now) return { ok: false, error: "ticket 已过期" };
  if (claims.bodyHash !== hashChatBody(body)) {
    return { ok: false, error: "ticket 与请求体不匹配" };
  }
  return { ok: true, claims };
}
