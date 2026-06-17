import { createHash, randomBytes } from "node:crypto";
import { buildInviteUrl, normalizeReferralCode } from "./referrals";
import {
  REFERRAL_INVITEE_REWARD,
  REFERRAL_INVITER_REWARD,
  REFERRAL_MONTHLY_REWARD_LIMIT,
  REFERRAL_REWARD_TTL_DAYS,
  REFERRAL_TOTAL_REWARD_LIMIT,
} from "./referrals";
import { supabaseRpc } from "./shared-server";

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export interface ReferralDashboard {
  code: string;
  inviteUrl: string;
  bonusRemaining: number;
  bonusEarned: number;
  pendingInvites: number;
  rewardedInvites: number;
  nextExpiry: string | null;
}

export interface ReferralClaimResult {
  ok: boolean;
  reason: string;
  status?: string;
}

export interface ReferralQualifyResult {
  ok: boolean;
  reason: string;
  inviterReward?: number;
  inviteeReward?: number;
}

interface SupabaseConfig {
  url: string;
  key: string;
}

function supabaseConfig(): SupabaseConfig | null {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? { url: url.replace(/\/+$/, ""), key } : null;
}

async function rest<T>(
  path: string,
  init: RequestInit & { prefer?: string } = {}
): Promise<T | null> {
  const cfg = supabaseConfig();
  if (!cfg) return null;
  const headers = new Headers(init.headers);
  headers.set("apikey", cfg.key);
  headers.set("Authorization", `Bearer ${cfg.key}`);
  if (init.body && !headers.has("Content-Type"))
    headers.set("Content-Type", "application/json");
  if (init.prefer) headers.set("Prefer", init.prefer);

  try {
    const res = await fetch(`${cfg.url}/rest/v1/${path}`, {
      ...init,
      headers,
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    if (res.status === 204) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

function generateCode(length = 8): string {
  const bytes = randomBytes(length);
  let out = "";
  for (const b of bytes) out += CODE_ALPHABET[b % CODE_ALPHABET.length];
  return out;
}

export function hashReferralField(value: string | null | undefined): string | null {
  if (!value) return null;
  const salt =
    process.env.REFERRAL_HASH_SALT ??
    process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 24) ??
    "tokrace-referral";
  return createHash("sha256").update(salt).update(":").update(value).digest("hex");
}

export async function ensureReferralCode(userId: string): Promise<string | null> {
  const existing = await rest<{ code: string }[]>(
    `referral_codes?user_id=eq.${encodeURIComponent(userId)}&disabled_at=is.null&select=code&limit=1`
  );
  if (existing?.[0]?.code) return existing[0].code;

  for (let i = 0; i < 5; i++) {
    const code = generateCode();
    const inserted = await rest<{ code: string }[]>("referral_codes?select=code", {
      method: "POST",
      prefer: "return=representation",
      body: JSON.stringify({ user_id: userId, code }),
    });
    if (inserted?.[0]?.code) return inserted[0].code;

    const raced = await rest<{ code: string }[]>(
      `referral_codes?user_id=eq.${encodeURIComponent(userId)}&disabled_at=is.null&select=code&limit=1`
    );
    if (raced?.[0]?.code) return raced[0].code;
  }
  return null;
}

export async function getReferralDashboard(
  userId: string,
  origin: string
): Promise<ReferralDashboard | null> {
  const code = await ensureReferralCode(userId);
  if (!code) return null;

  const raw = await supabaseRpc<{
    code?: string | null;
    bonusRemaining?: number;
    bonusEarned?: number;
    pendingInvites?: number;
    rewardedInvites?: number;
    nextExpiry?: string | null;
  }>("referral_dashboard", { p_user_id: userId });

  return {
    code,
    inviteUrl: buildInviteUrl(origin, code).toString(),
    bonusRemaining: raw?.bonusRemaining ?? 0,
    bonusEarned: raw?.bonusEarned ?? 0,
    pendingInvites: raw?.pendingInvites ?? 0,
    rewardedInvites: raw?.rewardedInvites ?? 0,
    nextExpiry: raw?.nextExpiry ?? null,
  };
}

export async function claimReferralAttribution(opts: {
  code: string;
  inviteeUserId: string;
  clientId: string | null;
  ip: string | null;
  userAgent: string | null;
}): Promise<ReferralClaimResult> {
  const code = normalizeReferralCode(opts.code);
  if (!code) return { ok: false, reason: "invalid" };

  const result = await supabaseRpc<ReferralClaimResult>("claim_referral_attribution", {
    p_code: code,
    p_invitee_user_id: opts.inviteeUserId,
    p_client_id: opts.clientId,
    p_ip_hash: hashReferralField(opts.ip),
    p_user_agent_hash: hashReferralField(opts.userAgent),
  });
  return result ?? { ok: false, reason: "unavailable" };
}

export async function qualifyReferral(
  inviteeUserId: string,
  runId: string
): Promise<ReferralQualifyResult> {
  const result = await supabaseRpc<ReferralQualifyResult>("qualify_referral", {
    p_invitee_user_id: inviteeUserId,
    p_run_id: runId,
    p_inviter_reward: REFERRAL_INVITER_REWARD,
    p_invitee_reward: REFERRAL_INVITEE_REWARD,
    p_ttl_days: REFERRAL_REWARD_TTL_DAYS,
    p_monthly_limit: REFERRAL_MONTHLY_REWARD_LIMIT,
    p_total_limit: REFERRAL_TOTAL_REWARD_LIMIT,
  });
  return result ?? { ok: false, reason: "unavailable" };
}
