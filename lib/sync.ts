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

export type SyncMode = "overwrite" | "merge";

/** 集合类键 → 去重身份字段；其余键视为标量 */
const COLLECTION_KEYS: Record<string, string> = {
  "ma.endpoints": "id",
  "ma.history": "id",
  "ma.customPrompts": "label",
};

/**
 * 合并两份同步数据（「来源方胜」策略）：
 * - 集合类：按身份字段求并集，同 id 时 source 覆盖 target，target 独有的保留；
 * - 标量类：target 已有就保留，仅当 target 缺失时才补 source（即「只补缺失的」）。
 */
function mergeData(
  target: Record<string, unknown>,
  source: Record<string, unknown>
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...target };
  for (const k of SYNC_KEYS) {
    const idField = COLLECTION_KEYS[k];
    if (idField) {
      const tArr = Array.isArray(target[k]) ? (target[k] as unknown[]) : [];
      const sArr = Array.isArray(source[k]) ? (source[k] as unknown[]) : [];
      if (!sArr.length) continue; // source 无此集合：保留 target
      const idOf = (it: unknown): unknown =>
        (it as Record<string, unknown>)?.[idField] ?? Symbol(); // 无 id 的项各自唯一，不被并掉
      const map = new Map<unknown, unknown>();
      for (const it of tArr) map.set(idOf(it), it);
      for (const it of sArr) map.set(idOf(it), it); // source 胜
      out[k] = [...map.values()];
    } else if (!(k in target) && k in source) {
      out[k] = source[k]; // 标量：仅补缺失
    }
  }
  return out;
}

/**
 * 上传：本地数据加密后存到当前用户的同步行。
 * - overwrite：用本机整盘替换云端；
 * - merge：先拉云端解密，把本机并进去（本机=source 胜），再整体加密回写。
 */
export async function pushSync(
  passphrase: string,
  mode: SyncMode = "overwrite"
): Promise<void> {
  const sb = getSupabase();
  if (!sb) throw new Error("云同步未启用");
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) throw new Error("请先登录");

  let toUpload = gatherLocal();
  if (mode === "merge") {
    const { data } = await sb
      .from("user_sync")
      .select("payload")
      .eq("user_id", user.id)
      .maybeSingle();
    if (data?.payload) {
      let cloud: Record<string, unknown>;
      try {
        cloud = await decryptJson(data.payload as Encrypted, passphrase);
      } catch {
        throw new Error(
          "无法解密云端数据：同步密码与云端不一致，不能合并（可改用「覆盖上传」）"
        );
      }
      toUpload = mergeData(cloud, gatherLocal()); // target=云端，source=本机（本机胜）
    }
  }

  const blob = await encryptJson(toUpload, passphrase);
  const { error } = await sb
    .from("user_sync")
    .upsert(
      { user_id: user.id, payload: blob, updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    );
  if (error) throw new Error(error.message);
}

/**
 * 下载：拉取密文，用同步密码解密后写回本地（成功后建议刷新页面）。
 * - overwrite：用云端整盘覆盖本地；
 * - merge：把云端并进本机（云端=source 胜），本机独有的保留。
 */
export async function pullSync(
  passphrase: string,
  mode: SyncMode = "overwrite"
): Promise<number> {
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
  let cloud: Record<string, unknown>;
  try {
    cloud = await decryptJson<Record<string, unknown>>(
      data.payload as Encrypted,
      passphrase
    );
  } catch {
    throw new Error("解密失败：同步密码不正确");
  }
  const toRestore =
    mode === "merge" ? mergeData(gatherLocal(), cloud) : cloud; // 合并：target=本机，source=云端（云端胜）
  restoreLocal(toRestore);
  return Object.keys(toRestore).length;
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
