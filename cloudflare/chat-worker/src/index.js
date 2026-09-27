// 与 Vercel 路由共用同一份源，避免逻辑漂移（wrangler/esbuild 会把这些纯 TS 文件
// 一起打包进 Worker bundle；它们无 node 内建依赖，Worker 运行时安全）。
import { PRIVATE_HOST_RE } from "../../../lib/private-host.ts";
import { pipeChat } from "../../../lib/chat-stream.ts";

const enc = new TextEncoder();
const sse = (obj) => enc.encode(`data: ${JSON.stringify(obj)}\n\n`);

// 浏览器伪装头：尝试降低上游 bot 防护对 Worker 请求的评分（如 Kimi 的 Cloudflare 风控）。
// 注意：真正的强信号是 TLS(JA3) 指纹 + "来自 Cloudflare 网络"，UA 改不了那些，成功率有限。
const BROWSER_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36";
const BROWSER_HINT_HEADERS = {
  "user-agent": BROWSER_UA,
  "accept-language": "en-US,en;q=0.9",
};

function corsHeaders(env) {
  return {
    "access-control-allow-origin": env.TOKRACE_ALLOWED_ORIGIN || "*",
    "access-control-allow-methods": "POST,OPTIONS",
    "access-control-allow-headers": "content-type",
    "access-control-expose-headers": "x-quota-remaining",
  };
}

function json(data, status = 200, env = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders(env),
      "content-type": "application/json; charset=utf-8",
    },
  });
}

function checkUpstreamUrl(baseUrl) {
  let u;
  try {
    u = new URL(baseUrl);
  } catch {
    return "Base URL 不是合法的 URL";
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") {
    return "Base URL 仅支持 http/https";
  }
  if (PRIVATE_HOST_RE.test(u.hostname)) {
    return "Cloudflare 通路不允许访问本机/内网地址";
  }
  return null;
}

async function exchangeTicket(env, ticket, body) {
  const origin = String(env.TOKRACE_APP_ORIGIN || "").replace(/\/+$/, "");
  const token = env.TOKRACE_WORKER_TOKEN;
  if (!origin || !token) {
    return {
      ok: false,
      response: json({ ok: false, error: "Worker secret 未配置" }, 500, env),
    };
  }
  const res = await fetch(`${origin}/api/chat/worker-ticket`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-tokrace-worker-token": token,
    },
    body: JSON.stringify({ ticket, body }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    return {
      ok: false,
      response: new Response(text, {
        status: res.status,
        headers: {
          ...corsHeaders(env),
          "content-type": res.headers.get("content-type") || "text/plain; charset=utf-8",
        },
      }),
    };
  }
  return { ok: true, data: await res.json() };
}

export default {
  async fetch(request, env) {
    const started = performance.now();
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders(env) });
    }
    const url = new URL(request.url);
    if (request.method !== "POST" || url.pathname !== "/chat") {
      return json({ ok: true, usage: "POST /chat with { ticket, body }" }, 200, env);
    }

    let payload;
    try {
      payload = await request.json();
    } catch {
      return json({ ok: false, error: "请求体不是合法 JSON" }, 400, env);
    }
    if (!payload?.ticket || !payload?.body) {
      return json({ ok: false, error: "缺少 ticket 或 body" }, 400, env);
    }

    const exchanged = await exchangeTicket(env, payload.ticket, payload.body);
    if (!exchanged.ok) return exchanged.response;
    const body = exchanged.data?.body;
    const quotaRemaining = exchanged.data?.quotaRemaining;
    if (!body?.baseUrl || !body?.model || !body?.apiKey) {
      return json({ ok: false, error: "ticket 兑换结果缺少模型配置" }, 500, env);
    }
    const guardErr = checkUpstreamUrl(body.baseUrl);
    if (guardErr) return json({ ok: false, error: guardErr }, 400, env);

    const stream = new ReadableStream({
      async start(controller) {
        const send = (obj) => {
          try {
            controller.enqueue(sse(obj));
          } catch {
            // Client disconnected.
          }
        };
        try {
          await pipeChat(body, send, request.signal, {
            headers: BROWSER_HINT_HEADERS, transport: "cloudflare",
            proxyPrepareMs: Math.round(performance.now() - started),
          });
        } catch (e) {
          if (!request.signal.aborted) {
            send({ type: "error", message: e instanceof Error ? e.message : String(e) });
          }
        } finally {
          try {
            controller.close();
          } catch {
            // Already closed.
          }
        }
      },
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders(env),
        "content-type": "text/event-stream; charset=utf-8",
        "cache-control": "no-cache, no-transform",
        "x-accel-buffering": "no",
        ...(quotaRemaining != null ? { "x-quota-remaining": String(quotaRemaining) } : {}),
      },
    });
  },
};
