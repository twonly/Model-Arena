import { encryptJson, decryptJson, type Encrypted } from "./crypto";
import { getSupabase } from "./supabase-client";

/** 参与云同步的全部本地键（含 endpoints，里面有 API Key——故必须加密） */
export const SYNC_KEYS = [
  "ma.endpoints",
  "ma.history",
  "ma.title",
  "ma.notes",
  "ma.prompt",
  "ma.params",
  "ma.markdown",
  "ma.thinkStats",
  "ma.compact",
  "ma.theme",
  "ma.watermark",
  "ma.wmTiled",
  "ma.customPrompts",
];

function gatherLocal(): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const k of SYNC_KEYS) {
    const v = localStorage.getItem(k);
    if (v != null) {
      try {
        out[k] = JSON.parse(v);
      } catch {
        /* skip */
      }
    }
  }
  return out;
}

function restoreLocal(data: Record<string, unknown>) {
  for (const k of SYNC_KEYS) {
    if (k in data) localStorage.setItem(k, JSON.stringify(data[k]));
  }
}

/** 上传：本地数据加密后存到当前用户的同步行 */
export async function pushSync(passphrase: string): Promise<void> {
  const sb = getSupabase();
  if (!sb) throw new Error("云同步未启用");
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) throw new Error("请先登录");
  const blob = await encryptJson(gatherLocal(), passphrase);
  const { error } = await sb
    .from("user_sync")
    .upsert(
      { user_id: user.id, payload: blob, updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    );
  if (error) throw new Error(error.message);
}

/** 下载：拉取密文，用同步密码解密并覆盖本地（成功后建议刷新页面） */
export async function pullSync(passphrase: string): Promise<number> {
  const sb = getSupabase();
  if (!sb) throw new Error("云同步未启用");
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) throw new Error("请先登录");
  const { data, error } = await sb
    .from("user_sync")
    .select("payload")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data?.payload) throw new Error("云端还没有数据，请先在某台设备上传");
  let obj: Record<string, unknown>;
  try {
    obj = await decryptJson<Record<string, unknown>>(
      data.payload as Encrypted,
      passphrase
    );
  } catch {
    throw new Error("解密失败：同步密码不正确");
  }
  restoreLocal(obj);
  return Object.keys(obj).length;
}

/** 云端最近一次同步时间（无则 null） */
export async function lastSyncedAt(): Promise<string | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return null;
  const { data } = await sb
    .from("user_sync")
    .select("updated_at")
    .eq("user_id", user.id)
    .maybeSingle();
  return data?.updated_at ?? null;
}
