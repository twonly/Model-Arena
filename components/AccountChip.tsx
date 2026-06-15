"use client";

import { useEffect, useState } from "react";
import { getSupabase, supabaseEnabled } from "@/lib/supabase-client";
import { lastSyncedAt } from "@/lib/sync";

/**
 * 右上角常驻账号入口，三态：
 *   未登录 → 「登录 / 同步」
 *   已登录 → 邮箱 + 云同步状态（已同步 / 云端无数据）
 * 点击打开 AccountDialog。云同步未配置时整体不渲染。
 */
export function AccountChip({ onOpen }: { onOpen: () => void }) {
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [synced, setSynced] = useState<string | null>(null);

  useEffect(() => {
    if (!supabaseEnabled()) {
      setReady(true);
      return;
    }
    const sb = getSupabase();
    if (!sb) {
      setReady(true);
      return;
    }
    sb.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
      setReady(true);
    });
    const { data: sub } = sb.auth.onAuthStateChange((_e, session) => {
      setEmail(session?.user?.email ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (email) lastSyncedAt().then(setSynced);
    else setSynced(null);
  }, [email]);

  if (!supabaseEnabled()) return null;

  const shortEmail =
    email && email.length > 22 ? email.slice(0, 20) + "…" : email;

  return (
    <button
      onClick={onOpen}
      title={email ? "账号与云同步" : "登录以跨设备同步配置 / 历史 / Prompt 库"}
      className="flex items-center gap-1.5 rounded-full border border-line bg-card px-3 py-1.5 text-[12px] text-faint hover:border-ink/30 hover:text-ink cursor-pointer"
    >
      {!ready ? (
        <span className="text-faint/50">…</span>
      ) : email ? (
        <>
          <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-ink text-[9px] font-bold text-paper">
            {email[0]?.toUpperCase()}
          </span>
          <span className="num max-w-[150px] truncate text-ink">
            {shortEmail}
          </span>
          <span
            className="shrink-0"
            style={{ color: synced ? "var(--go)" : "var(--faint)" }}
          >
            · {synced ? "☁ 已同步" : "☁ 未同步"}
          </span>
        </>
      ) : (
        <>
          <span>👤</span>
          <span>登录 / 同步</span>
        </>
      )}
    </button>
  );
}
