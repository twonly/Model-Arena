const enc = new TextEncoder();
const sse = (obj) => enc.encode(`data: ${JSON.stringify(obj)}\n\n`);

const PRIVATE_HOST_RE =
  /^(localhost|.*\.local|.*\.internal|0\.0\.0\.0|127\.\d+\.\d+\.\d+|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|169\.254\.\d+\.\d+|metadata\.google\.internal|\[?::1\]?|\[?f[cd][0-9a-f]{2}:.*)$/i;

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

function parseExtra(body) {
  if (!body.extraBody || !body.extraBody.trim()) return {};
  try {
    const j = JSON.parse(body.extraBody);
    if (j && typeof j === "object" && !Array.isArray(j)) return j;
  } catch {
    // handled below
  }
  throw new Error("该模型的「额外请求参数」不是合法 JSON 对象，请到模型接入里修改");
}

function num(v) {
  if (v == null || String(v).trim() === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function parseDataUrl(dataUrl) {
  const m = String(dataUrl || "").match(/^data:([^;,]+);base64,(.+)$/);
  return m ? { mediaType: m[1], base64: m[2] } : null;
}

async function readErrorMessage(res) {
  const raw = await res.text().catch(() => "");
  try {
    const j = JSON.parse(raw);
    const msg = j?.error?.message ?? j?.message ?? j?.error_msg ?? j?.msg ?? raw;
    return `HTTP ${res.status}：${typeof msg === "string" ? msg : raw}`.slice(0, 500);
  } catch {
    return `HTTP ${res.status}：${raw.slice(0, 300) || res.statusText}`;
  }
}

async function consumeSse(res, signal, onData) {
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  let sawDone = false;
  while (true) {
    if (signal.aborted) {
      await reader.cancel().catch(() => {});
      return { sawDone };
    }
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    let idx;
    while ((idx = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, idx).replace(/\r$/, "");
      buf = buf.slice(idx + 1);
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (!payload) continue;
      if (payload === "[DONE]") {
        sawDone = true;
        continue;
      }
      try {
        onData(JSON.parse(payload));
      } catch {
        // Ignore malformed partial lines.
      }
    }
  }
  return { sawDone };
}

async function pipeOpenAI(body, send, signal) {
  const url = `${body.baseUrl.replace(/\/+$/, "")}/chat/completions`;
  const messages = [];
  if (body.systemPrompt && body.systemPrompt.trim()) {
    messages.push({ role: "system", content: body.systemPrompt });
  }
  if (body.imageDataUrl) {
    messages.push({
      role: "user",
      content: [
        { type: "text", text: body.prompt },
        { type: "image_url", image_url: { url: body.imageDataUrl } },
      ],
    });
  } else {
    messages.push({ role: "user", content: body.prompt });
  }

  const extra = parseExtra(body);
  const makePayload = (withUsage) => {
    const p = { model: body.model, messages, stream: true };
    if (withUsage) p.stream_options = { include_usage: true };
    const t = num(body.temperature);
    if (t != null) p.temperature = t;
    const mt = num(body.maxTokens);
    if (mt != null) p.max_tokens = mt;
    Object.assign(p, extra);
    return p;
  };

  const doFetch = (withUsage) =>
    fetch(url, {
      method: "POST",
      signal,
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${body.apiKey}`,
      },
      body: JSON.stringify(makePayload(withUsage)),
    });

  let res = await doFetch(true);
  if (!res.ok && (res.status === 400 || res.status === 422)) {
    const firstErr = await readErrorMessage(res);
    res = await doFetch(false);
    if (!res.ok) {
      send({ type: "error", message: firstErr });
      return;
    }
  } else if (!res.ok) {
    send({ type: "error", message: await readErrorMessage(res) });
    return;
  }
  if (!res.body) {
    send({ type: "error", message: "上游未返回流式响应体" });
    return;
  }

  let finishReason;
  let gotDelta = false;
  try {
    const { sawDone } = await consumeSse(res, signal, (json) => {
      const choice = json?.choices?.[0];
      const delta = choice?.delta;
      if (delta) {
        const reasoning = delta.reasoning_content ?? delta.reasoning ?? undefined;
        const text = delta.content ?? undefined;
        if (reasoning || text) {
          gotDelta = true;
          send({
            type: "delta",
            ...(text ? { text } : {}),
            ...(reasoning ? { reasoning } : {}),
          });
        }
      }
      if (choice?.finish_reason) finishReason = choice.finish_reason;
      if (json?.usage) {
        send({
          type: "usage",
          promptTokens: json.usage.prompt_tokens,
          outputTokens: json.usage.completion_tokens,
          reasoningTokens: json.usage.completion_tokens_details?.reasoning_tokens,
        });
      }
    });
    if (signal.aborted) return;
    send({ type: "done", finishReason, truncated: !sawDone && !finishReason });
  } catch (e) {
    if (signal.aborted) return;
    if (gotDelta) send({ type: "done", truncated: true });
    else {
      send({
        type: "error",
        message: `上游连接中断：${e instanceof Error ? e.message : String(e)}`,
      });
    }
  }
}

function normalizeAnthropicThinkingPayload(payload, formMax, extra) {
  const thinking = payload.thinking;
  if (!thinking || typeof thinking !== "object" || thinking.type !== "enabled") {
    return false;
  }
  const budget = Number(thinking.budget_tokens ?? 0);
  const max = Number(payload.max_tokens ?? 0);
  if (Number.isFinite(budget) && Number.isFinite(max) && budget >= max) {
    payload.max_tokens = Math.max(budget + 1024, formMax || 0, 4096);
  }
  if (!extra.temperature && payload.temperature == null) delete payload.temperature;
  return true;
}

function anthropicThinkingMaxTokenErrorMessage(maxTokens) {
  return `思考预算已用满但没有生成正文。请把 max_tokens 提高到 ${Number(maxTokens || 0) + 1024} 以上，或降低 thinking.budget_tokens。`;
}

async function pipeAnthropic(body, send, signal) {
  const base = body.baseUrl.replace(/\/+$/, "");
  const url = base.endsWith("/v1") ? `${base}/messages` : `${base}/v1/messages`;
  const extra = parseExtra(body);
  const formMax = num(body.maxTokens);
  const img = body.imageDataUrl ? parseDataUrl(body.imageDataUrl) : null;
  const payload = {
    model: body.model,
    max_tokens: formMax ?? 4096,
    stream: true,
    messages: [
      {
        role: "user",
        content: img
          ? [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: img.mediaType,
                  data: img.base64,
                },
              },
              { type: "text", text: body.prompt },
            ]
          : body.prompt,
      },
    ],
  };
  if (body.systemPrompt && body.systemPrompt.trim()) payload.system = body.systemPrompt;
  const t = num(body.temperature);
  if (t != null) payload.temperature = t;
  Object.assign(payload, extra);
  const thinkingOn = normalizeAnthropicThinkingPayload(payload, formMax, extra);

  const res = await fetch(url, {
    method: "POST",
    signal,
    headers: {
      "content-type": "application/json",
      "x-api-key": body.apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    send({ type: "error", message: await readErrorMessage(res) });
    return;
  }
  if (!res.body) {
    send({ type: "error", message: "上游未返回流式响应体" });
    return;
  }

  let outputTokens;
  let finishReason;
  let gotText = false;
  await consumeSse(res, signal, (json) => {
    switch (json?.type) {
      case "message_start":
        if (json.message?.usage?.input_tokens != null) {
          send({ type: "usage", promptTokens: json.message.usage.input_tokens });
        }
        break;
      case "content_block_delta":
        if (json.delta?.type === "text_delta" && json.delta.text) {
          gotText = true;
          send({ type: "delta", text: json.delta.text });
        } else if (json.delta?.type === "thinking_delta" && json.delta.thinking) {
          send({ type: "delta", reasoning: json.delta.thinking });
        }
        break;
      case "message_delta":
        if (json.usage?.output_tokens != null) outputTokens = json.usage.output_tokens;
        if (json.delta?.stop_reason) finishReason = json.delta.stop_reason;
        break;
      case "message_stop":
        if (outputTokens != null) send({ type: "usage", outputTokens });
        if (finishReason === "max_tokens" && thinkingOn && !gotText) {
          send({
            type: "error",
            message: anthropicThinkingMaxTokenErrorMessage(payload.max_tokens),
          });
        } else {
          send({ type: "done", finishReason });
        }
        break;
      case "error":
        send({ type: "error", message: json.error?.message ?? "Anthropic 流返回错误" });
        break;
    }
  });
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

    const started = Date.now();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (obj) => {
          if (obj.type === "delta") obj.ts = Date.now() - started;
          try {
            controller.enqueue(sse(obj));
          } catch {
            // Client disconnected.
          }
        };
        try {
          if (body.kind === "anthropic") await pipeAnthropic(body, send, request.signal);
          else await pipeOpenAI(body, send, request.signal);
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
