"use client";

import { useEffect, useState } from "react";
import { getSupabase, supabaseEnabled } from "@/lib/supabase-client";
import { lastSyncedAt, pullSync, pushSync } from "@/lib/sync";

type Mode = "login" | "register";

export function AccountDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [mode, setMode] = useState<Mode>("login");
  const [user, setUser] = useState<{ email?: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  // 同步密码（仅本机内存，不持久化）
  const [passphrase, setPassphrase] = useState("");
  const [synced, setSynced] = useState<string | null>(null);
  // 同步方式：合并(并集，来源胜) / 覆盖(整盘替换)。默认合并，避免误删数据
  const [syncMode, setSyncMode] = useState<"merge" | "overwrite">("merge");

  const sb = getSupabase();

  useEffect(() => {
    if (!open || !sb) return;
    sb.auth.getUser().then(({ data }) => {
      setUser(data.user ? { email: data.user.email ?? undefined } : null);
    });
    const { data: sub } = sb.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ? { email: session.user.email ?? undefined } : null);
    });
    return () => sub.subscription.unsubscribe();
  }, [open, sb]);

  useEffect(() => {
    if (user) lastSyncedAt().then(setSynced);
  }, [user]);

  if (!open) return null;

  const reset = () => {
    setErr("");
    setMsg("");
  };

  const submit = async () => {
    if (!sb) return;
    reset();
    if (!email.trim() || pw.length < 6) {
      setErr("请填写邮箱，密码至少 6 位");
      return;
    }
    setBusy(true);
    try {
      if (mode === "register") {
        const { error } = await sb.auth.signUp({ email, password: pw });
        if (error) throw error;
        setMsg(
          "注册成功。若开启了邮箱验证，请到邮箱点确认链接后再登录。"
        );
      } else {
        const { error } = await sb.auth.signInWithPassword({
          email,
          password: pw,
        });
        if (error) throw error;
        setMsg("登录成功");
        setPw("");
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "操作失败");
    } finally {
      setBusy(false);
    }
  };

  const logout = async () => {
    await sb?.auth.signOut();
    setUser(null);
    setMsg("已登出");
  };

  const doPush = async () => {
    reset();
    if (passphrase.length < 6) {
      setErr("同步密码至少 6 位");
      return;
    }
    if (
      syncMode === "overwrite" &&
      !confirm(
        "「覆盖上传」会用本机数据整盘替换云端，其他设备上传过的内容将被覆盖。继续吗？"
      )
    )
      return;
    setBusy(true);
    try {
      await pushSync(passphrase, syncMode);
      const t = await lastSyncedAt();
      setSynced(t);
      setMsg(syncMode === "merge" ? "已合并并加密上传 ✓" : "已覆盖上传到云端 ✓");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "上传失败");
    } finally {
      setBusy(false);
    }
  };

  const doPull = async () => {
    reset();
    if (passphrase.length < 6) {
      setErr("请输入上传时用的同步密码");
      return;
    }
    if (
      !confirm(
        syncMode === "overwrite"
          ? "「覆盖恢复」会用云端数据替换本机当前的模型配置、历史与 Prompt 库，本机独有的内容会丢失。继续吗？"
          : "「合并恢复」会把云端数据并入本机（同一项以云端为准，本机独有的保留）。继续吗？"
      )
    )
      return;
    setBusy(true);
    try {
      const n = await pullSync(passphrase, syncMode);
      setMsg(`已${syncMode === "merge" ? "合并" : "恢复"} ${n} 项，正在刷新…`);
      setTimeout(() => location.reload(), 800);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "恢复失败");
    } finally {
      setBusy(false);
    }
  };

  const input =
    "w-full rounded-md border border-line bg-card px-2.5 py-1.5 text-[13px] outline-none focus:border-ink/40";

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-ink/30 p-4 pt-[8vh]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl border border-line bg-paper shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <div>
            <div className="text-[15px] font-bold">账号与云同步</div>
            <div className="text-[11px] text-faint">
              跨设备同步配置/历史/Prompt 库 · 数据端到端加密
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-md border border-line px-2.5 py-1.5 text-[16px] leading-none text-faint hover:text-ink cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="p-5">
          {!supabaseEnabled() ? (
            <div className="text-[13px] text-faint">
              云同步未启用：服务端未配置 NEXT_PUBLIC_SUPABASE 环境变量。
            </div>
          ) : !user ? (
            <div className="space-y-3">
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setMode("login");
                    reset();
                  }}
                  className={`rounded-md px-3 py-1.5 text-[13px] cursor-pointer ${mode === "login" ? "bg-ink text-paper font-semibold" : "border border-line text-faint"}`}
                >
                  登录
                </button>
                <button
                  onClick={() => {
                    setMode("register");
                    reset();
                  }}
                  className={`rounded-md px-3 py-1.5 text-[13px] cursor-pointer ${mode === "register" ? "bg-ink text-paper font-semibold" : "border border-line text-faint"}`}
                >
                  注册
                </button>
              </div>
              <input
                className={input}
                type="email"
                placeholder="邮箱"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <input
                className={input}
                type="password"
                placeholder="密码（至少 6 位）"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
              />
              <button
                onClick={submit}
                disabled={busy}
                className="w-full rounded-md bg-ink py-2 text-[13px] font-bold text-paper disabled:opacity-50 cursor-pointer"
              >
                {busy ? "处理中…" : mode === "login" ? "登录" : "注册"}
              </button>
              <p className="text-[11px] text-faint/80">
                账号仅用于跨设备同步。数据上传前已在本机用「同步密码」加密，
                服务器无法解密。
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-md border border-line bg-card px-3 py-2">
                <div className="min-w-0">
                  <div className="text-[12.5px] font-semibold truncate">
                    {user.email}
                  </div>
                  <div className="num text-[10.5px] text-faint">
                    {synced
                      ? `云端更新于 ${new Date(synced).toLocaleString("zh-CN", { hour12: false })}`
                      : "云端暂无数据"}
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="shrink-0 rounded-md border border-line px-2.5 py-1 text-[11.5px] text-faint hover:text-ink cursor-pointer"
                >
                  登出
                </button>
              </div>

              <div className="rounded-md border border-line bg-card p-3">
                <div className="mb-1.5 text-[12px] font-semibold">
                  同步密码（端到端加密用）
                </div>
                <input
                  className={input}
                  type="password"
                  placeholder="设一个只有你知道的同步密码（≥6 位）"
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                />
                <p className="mt-1.5 text-[10.5px]" style={{ color: "var(--think)" }}>
                  ⚠ 这个密码不会上传也无法找回，请牢记。换设备恢复时要输同一个。
                </p>

                <div className="mt-2.5">
                  <div className="mb-1 text-[11px] text-faint">同步方式</div>
                  <div className="flex gap-1.5">
                    {(
                      [
                        ["merge", "合并"],
                        ["overwrite", "覆盖"],
                      ] as const
                    ).map(([m, label]) => (
                      <button
                        key={m}
                        onClick={() => setSyncMode(m)}
                        className={`flex-1 rounded-md px-2 py-1 text-[12px] cursor-pointer ${syncMode === m ? "bg-ink text-paper font-semibold" : "border border-line text-faint"}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <p className="mt-1 text-[10.5px] text-faint/80">
                    {syncMode === "merge"
                      ? "合并：模型/历史/Prompt 取并集，同一项以来源为准，两端独有的都保留；设置项不互相覆盖。"
                      : "覆盖：用来源整盘替换目标（上传=替换云端，恢复=替换本机）。"}
                  </p>
                </div>

                <div className="mt-2.5 flex gap-2">
                  <button
                    onClick={doPush}
                    disabled={busy}
                    className="flex-1 rounded-md bg-ink py-1.5 text-[12.5px] font-semibold text-paper disabled:opacity-50 cursor-pointer"
                  >
                    ⤴ 上传到云端
                  </button>
                  <button
                    onClick={doPull}
                    disabled={busy}
                    className="flex-1 rounded-md border border-line py-1.5 text-[12.5px] font-semibold text-ink hover:border-ink/40 disabled:opacity-50 cursor-pointer"
                  >
                    ⤵ 从云端恢复
                  </button>
                </div>
              </div>
              <p className="text-[11px] text-faint/80">
                「上传」把本机的模型配置（含 Key，已加密）、历史、Prompt
                库存到云端；换设备登录后「恢复」即可。不登录也能用，数据默认只存本机。
              </p>
            </div>
          )}

          {msg && (
            <div className="mt-3 text-[12px]" style={{ color: "var(--go)" }}>
              {msg}
            </div>
          )}
          {err && <div className="mt-3 text-[12px] text-accent">✗ {err}</div>}
        </div>
      </div>
    </div>
  );
}
