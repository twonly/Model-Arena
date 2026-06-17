"use client";

import { authHeader } from "./me";
import { REFERRAL_CODE_PARAM, REFERRAL_CODE_STORAGE_KEY, normalizeReferralCode } from "./referrals";
import { getClientId } from "./telemetry";

export interface ReferralDashboardClient {
  code: string;
  inviteUrl: string;
  bonusRemaining: number;
  bonusEarned: number;
  pendingInvites: number;
  rewardedInvites: number;
  nextExpiry: string | null;
}

export interface ReferralClaimClientResult {
  ok: boolean;
  reason?: string;
  message?: string;
}

export interface ReferralRewardNotice {
  gained: number;
  newRewardedInvites: number;
  bonusRemaining: number;
  message: string;
}

const REWARD_SNAPSHOT_PREFIX = "ma.referral.rewardSnapshot.";

export function captureReferralFromLocation(): string | null {
  try {
    const url = new URL(window.location.href);
    const code = normalizeReferralCode(url.searchParams.get(REFERRAL_CODE_PARAM));
    if (!code) return null;
    localStorage.setItem(REFERRAL_CODE_STORAGE_KEY, code);
    return code;
  } catch {
    return null;
  }
}

export function storedReferralCode(): string | null {
  try {
    return normalizeReferralCode(localStorage.getItem(REFERRAL_CODE_STORAGE_KEY));
  } catch {
    return null;
  }
}

export function clearStoredReferralCode(): void {
  try {
    localStorage.removeItem(REFERRAL_CODE_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export async function claimStoredReferral(): Promise<ReferralClaimClientResult | null> {
  const code = storedReferralCode();
  if (!code) return null;
  const headers = await authHeader();
  if (!headers.Authorization) return { ok: false, reason: "login" };

  const res = await fetch("/api/referral", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify({ code, clientId: getClientId() }),
  });

  if (res.status === 401) return { ok: false, reason: "login" };
  const j = (await res.json().catch(() => null)) as ReferralClaimClientResult | null;
  if (!j) return { ok: false, reason: "invalid", message: "邀请系统暂不可用" };

  if (
    j.ok ||
    j.reason === "self" ||
    j.reason === "existing_user" ||
    j.reason === "already_attributed" ||
    j.reason === "invalid"
  ) {
    clearStoredReferralCode();
  }
  return j;
}

export async function fetchReferralDashboard(): Promise<ReferralDashboardClient | null> {
  const res = await fetch("/api/referral", {
    headers: { ...(await authHeader()) },
    cache: "no-store",
  });
  const j = (await res.json().catch(() => null)) as
    | {
        ok?: boolean;
        loggedIn?: boolean;
        available?: boolean;
        dashboard?: ReferralDashboardClient;
      }
    | null;
  return j?.ok && j.loggedIn && j.available && j.dashboard ? j.dashboard : null;
}

export function consumeReferralRewardNotice(
  dashboard: ReferralDashboardClient
): ReferralRewardNotice | null {
  try {
    const key = `${REWARD_SNAPSHOT_PREFIX}${dashboard.code}`;
    const raw = localStorage.getItem(key);
    const previous = raw
      ? (JSON.parse(raw) as {
          bonusEarned?: number;
          rewardedInvites?: number;
        })
      : null;
    const prevEarned = Math.max(0, previous?.bonusEarned ?? 0);
    const prevRewarded = Math.max(0, previous?.rewardedInvites ?? 0);
    const gained = Math.max(0, dashboard.bonusEarned - prevEarned);
    const newRewardedInvites = Math.max(
      0,
      dashboard.rewardedInvites - prevRewarded
    );

    localStorage.setItem(
      key,
      JSON.stringify({
        bonusEarned: dashboard.bonusEarned,
        rewardedInvites: dashboard.rewardedInvites,
        checkedAt: Date.now(),
      })
    );

    if (gained <= 0) return null;

    const who =
      newRewardedInvites > 0
        ? `${newRewardedInvites} 位好友完成首次对比，`
        : "";
    return {
      gained,
      newRewardedInvites,
      bonusRemaining: dashboard.bonusRemaining,
      message: `${who}邀请奖励已到账：+${gained} 次。当前奖励余额 ${dashboard.bonusRemaining} 次。`,
    };
  } catch {
    return null;
  }
}
