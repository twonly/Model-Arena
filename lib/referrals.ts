export const REFERRAL_CODE_PARAM = "ref";
export const REFERRAL_CODE_STORAGE_KEY = "ma.referral.code";
export const REFERRAL_INVITER_REWARD = 10;
export const REFERRAL_INVITEE_REWARD = 5;
export const REFERRAL_REWARD_TTL_DAYS = 60;
export const REFERRAL_MONTHLY_REWARD_LIMIT = 10;
export const REFERRAL_TOTAL_REWARD_LIMIT = 50;

export interface QuotaSnapshotInput {
  baseLimit: number;
  baseUsed: number;
  bonusRemaining: number;
}

export interface QuotaSnapshot {
  baseLimit: number;
  baseUsed: number;
  baseRemaining: number;
  bonusRemaining: number;
  totalRemaining: number;
  totalLimit: number;
}

export function normalizeReferralCode(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const code = input.trim().replace(/[-_]/g, "").toUpperCase();
  return /^[A-Z0-9]{6,16}$/.test(code) ? code : null;
}

export function buildInviteUrl(origin: string, code: string): URL {
  const normalized = normalizeReferralCode(code);
  if (!normalized) throw new Error("Invalid referral code");
  const url = new URL("/arena", origin);
  url.searchParams.set(REFERRAL_CODE_PARAM, normalized);
  return url;
}

export function referralModelPhrase(models: string[] = []): string {
  const clean = Array.from(
    new Set(
      models
        .map((m) => m.trim())
        .filter(Boolean)
        .map((m) => (m.length > 28 ? `${m.slice(0, 26)}...` : m))
    )
  ).slice(0, 2);

  if (clean.length >= 2) return `${clean[0]} 与 ${clean[1]}`;
  if (clean.length === 1) return clean[0];
  return "多个 AI";
}

export function buildReferralShareText({
  inviteUrl,
  models = [],
}: {
  inviteUrl: string;
  models?: string[];
}): string {
  return `我在用 TOKRACE 评测 ${referralModelPhrase(models)} 模型，你通过我的链接注册并完成首次对比，可以获得 ${REFERRAL_INVITEE_REWARD} 次免费体验：${inviteUrl}`;
}

export function quotaSnapshot(input: QuotaSnapshotInput): QuotaSnapshot {
  const baseLimit = Math.max(0, Math.floor(input.baseLimit));
  const baseUsed = Math.max(0, Math.floor(input.baseUsed));
  const bonusRemaining = Math.max(0, Math.floor(input.bonusRemaining));
  const baseRemaining = Math.max(baseLimit - baseUsed, 0);

  return {
    baseLimit,
    baseUsed,
    baseRemaining,
    bonusRemaining,
    totalRemaining: baseRemaining + bonusRemaining,
    totalLimit: baseLimit + bonusRemaining,
  };
}
