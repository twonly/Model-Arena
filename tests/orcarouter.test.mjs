import assert from "node:assert/strict";
import test from "node:test";

import { POST as exchangeOrcaRouterCode } from "../app/api/orcarouter/exchange/route.ts";
import {
  ORCAROUTER_BASE_URL,
  ORCAROUTER_DEFAULT_MODEL,
  ORCAROUTER_REFERRAL_CODE,
  ORCAROUTER_TOKEN_URL,
  buildOrcaRouterAuthorizationUrl,
  safeOrcaRouterReturnPath,
  upsertOrcaRouterEndpoint,
} from "../lib/orcarouter.ts";
import { PROVIDER_PRESETS } from "../lib/providers.ts";

test("OrcaRouter preset uses the verified OpenAI-compatible endpoint", () => {
  const preset = PROVIDER_PRESETS.find((item) => item.id === "orcarouter");
  assert.equal(preset?.kind, "openai");
  assert.equal(preset?.baseUrl, ORCAROUTER_BASE_URL);
  assert.equal(preset?.exampleModels[0], ORCAROUTER_DEFAULT_MODEL);
});

test("PKCE authorization URL includes exact callback, S256, state, scope, and referral", () => {
  const url = buildOrcaRouterAuthorizationUrl({
    origin: "https://www.tokrace.com/path?ignored=1",
    state: "opaque-state",
    challenge: "pkce-challenge",
  });
  assert.equal(url.origin + url.pathname, "https://www.orcarouter.ai/auth");
  assert.equal(
    url.searchParams.get("callback_url"),
    "https://www.tokrace.com/auth/orcarouter/callback"
  );
  assert.equal(url.searchParams.get("code_challenge_method"), "S256");
  assert.equal(url.searchParams.get("state"), "opaque-state");
  assert.equal(url.searchParams.get("scope"), "api");
  assert.equal(url.searchParams.get("ref"), ORCAROUTER_REFERRAL_CODE);
});

test("OAuth callback only returns to a same-site path", () => {
  assert.equal(safeOrcaRouterReturnPath("/en/arena"), "/en/arena");
  assert.equal(safeOrcaRouterReturnPath("//evil.example"), "/zh-CN/arena");
  assert.equal(safeOrcaRouterReturnPath("/\\evil.example"), "/zh-CN/arena");
  assert.equal(safeOrcaRouterReturnPath("https://evil.example"), "/zh-CN/arena");
});

test("authorized key creates or replaces one stable OrcaRouter endpoint", () => {
  const existing = [
    {
      id: "other",
      name: "Other",
      kind: "openai",
      baseUrl: "https://example.com/v1",
      apiKey: "other-key",
      model: "model",
      enabled: false,
    },
  ];
  const once = upsertOrcaRouterEndpoint(existing, "sk-orca-first");
  const twice = upsertOrcaRouterEndpoint(once, "sk-orca-second");
  assert.equal(twice.length, 2);
  assert.equal(twice[0], existing[0]);
  assert.deepEqual(twice[1], {
    id: "orcarouter-auto",
    name: "OrcaRouter Auto",
    kind: "openai",
    baseUrl: ORCAROUTER_BASE_URL,
    apiKey: "sk-orca-second",
    model: ORCAROUTER_DEFAULT_MODEL,
    enabled: true,
  });
});

test("server exchange forwards code and verifier to the current OrcaRouter token endpoint", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init) => {
    assert.equal(url, ORCAROUTER_TOKEN_URL);
    assert.equal(init?.method, "POST");
    assert.deepEqual(JSON.parse(String(init?.body)), {
      code: "authorization-code",
      code_verifier: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-._~",
    });
    return Response.json({ key: "sk-orca-returned", user_id: "1", scope: "api" });
  };
  try {
    const req = new Request("https://www.tokrace.com/api/orcarouter/exchange", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: "authorization-code",
        codeVerifier: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-._~",
      }),
    });
    const response = await exchangeOrcaRouterCode(req);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.deepEqual(await response.json(), { key: "sk-orca-returned" });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("server exchange rejects malformed input before contacting OrcaRouter", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    throw new Error("fetch should not be called");
  };
  try {
    const req = new Request("https://www.tokrace.com/api/orcarouter/exchange", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: "bad code", codeVerifier: "short" }),
    });
    const response = await exchangeOrcaRouterCode(req);
    assert.equal(response.status, 400);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
