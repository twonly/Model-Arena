import assert from "node:assert/strict";
import test from "node:test";

import { runEndpoint } from "../lib/runner.ts";

test("shared model chat requests include the current auth header", async () => {
  const originalFetch = globalThis.fetch;
  let capturedHeaders = {};

  globalThis.fetch = async (_url, init = {}) => {
    capturedHeaders = Object.fromEntries(new Headers(init.headers).entries());
    return new Response('data: {"type":"done"}\n\n', {
      status: 200,
      headers: { "Content-Type": "text/event-stream", "X-Quota-Remaining": "14" },
    });
  };

  try {
    let state = { status: "idle", text: "", reasoning: "", metrics: null, samples: [] };
    await runEndpoint({
      endpoint: {
        id: "deepseek-flash",
        name: "DeepSeek V4 Flash",
        kind: "openai",
        baseUrl: "",
        apiKey: "",
        model: "deepseek-v4-flash",
        enabled: true,
        shared: true,
      },
      prompt: "hello",
      params: { systemPrompt: "", temperature: "", maxTokens: "" },
      signal: new AbortController().signal,
      update(fn) {
        state = fn(state);
      },
      onSettled() {},
      runId: "run-auth-test",
      onQuota() {},
      authHeaders: async () => ({ Authorization: "Bearer user-token" }),
    });

    assert.equal(capturedHeaders.authorization, "Bearer user-token");
  } finally {
    globalThis.fetch = originalFetch;
  }
});
