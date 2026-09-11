import type { ModelEndpoint } from "./types";

export const ORCAROUTER_REFERRAL_CODE = "ref_d0785b3ec87207162565";
export const ORCAROUTER_REFERRAL_URL =
  `https://www.orcarouter.ai/ref/${ORCAROUTER_REFERRAL_CODE}`;
export const ORCAROUTER_BASE_URL = "https://api.orcarouter.ai/v1";
export const ORCAROUTER_DEFAULT_MODEL = "orcarouter/auto";
export const ORCAROUTER_DOCS_URL = "https://docs.orcarouter.ai/";
export const ORCAROUTER_AUTH_URL = "https://www.orcarouter.ai/auth";
// The current PKCE documentation serves the key exchange from the website host.
export const ORCAROUTER_TOKEN_URL =
  "https://www.orcarouter.ai/api/v1/auth/keys";
export const ORCAROUTER_CALLBACK_PATH = "/auth/orcarouter/callback";
export const ORCAROUTER_PKCE_STORAGE_KEY = "tokrace.orcarouter.pkce";

export interface OrcaRouterPkceSession {
  state: string;
  verifier: string;
  returnTo: string;
}

function base64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function safeOrcaRouterReturnPath(raw: string | null | undefined): string {
  if (!raw?.startsWith("/") || raw.startsWith("//") || raw.includes("\\")) {
    return "/zh-CN/arena";
  }
  const base = "https://tokrace.invalid";
  const parsed = new URL(raw, base);
  return parsed.origin === base
    ? `${parsed.pathname}${parsed.search}${parsed.hash}`
    : "/zh-CN/arena";
}

export function buildOrcaRouterAuthorizationUrl(input: {
  origin: string;
  state: string;
  challenge: string;
}): URL {
  const url = new URL(ORCAROUTER_AUTH_URL);
  url.searchParams.set(
    "callback_url",
    `${new URL(input.origin).origin}${ORCAROUTER_CALLBACK_PATH}`
  );
  url.searchParams.set("code_challenge", input.challenge);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("state", input.state);
  url.searchParams.set("app_name", "TOKRACE");
  url.searchParams.set("scope", "api");
  url.searchParams.set("ref", ORCAROUTER_REFERRAL_CODE);
  return url;
}

export async function beginOrcaRouterConnect(returnTo: string): Promise<void> {
  const verifier = base64Url(crypto.getRandomValues(new Uint8Array(32)));
  const state = base64Url(crypto.getRandomValues(new Uint8Array(24)));
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(verifier)
  );
  const challenge = base64Url(new Uint8Array(digest));
  const session: OrcaRouterPkceSession = {
    state,
    verifier,
    returnTo: safeOrcaRouterReturnPath(returnTo),
  };
  sessionStorage.setItem(ORCAROUTER_PKCE_STORAGE_KEY, JSON.stringify(session));
  location.assign(
    buildOrcaRouterAuthorizationUrl({
      origin: location.origin,
      state,
      challenge,
    }).toString()
  );
}

export function upsertOrcaRouterEndpoint(
  endpoints: ModelEndpoint[],
  apiKey: string
): ModelEndpoint[] {
  const endpoint: ModelEndpoint = {
    id: "orcarouter-auto",
    name: "OrcaRouter Auto",
    kind: "openai",
    baseUrl: ORCAROUTER_BASE_URL,
    apiKey,
    model: ORCAROUTER_DEFAULT_MODEL,
    enabled: true,
  };
  const index = endpoints.findIndex((item) => item.id === endpoint.id);
  if (index < 0) return [...endpoints, endpoint];
  return endpoints.map((item, itemIndex) =>
    itemIndex === index ? endpoint : item
  );
}
