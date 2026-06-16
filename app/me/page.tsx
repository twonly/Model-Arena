"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Credit } from "@/components/Credit";
import { Logo } from "@/components/Logo";
import { AccountDialog } from "@/components/AccountDialog";
import { getSupabase } from "@/lib/supabase-client";
import {
  listMyShares,
  setShareDisabled,
  deleteShare,
  listMyReactions,
  type MyShare,
  type MyReaction,
} from "@/lib/me";
import type { HistoryEntry } from "@/lib/types";

function fmt(ts: string | number): string {
  const d = new Date(ts);
  if (isNaN(d.getTime())) return "";
  const diff = Date.now() - d.getTime();
  const day = 86400000;
  if (diff < day && d.getDate() === new Date().getDate())
    return d.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
  if (diff < 7 * day) return `${Math.max(1, Math.floor(diff / day))} 天前`;
  return d.toLocaleDateString("zh-CN", { month: "2-digit", day: "2-digit" });
}

export default function MePage() {
  const [accountOpen, setAccountOpen] = useState(false);
  const [email, setEmail] = useState<string | null>(null);

  const [shares, setShares] = useState<MyShare[] | null>(null);
  const [reactions, setReactions] = useState<MyReaction[] | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [err, setErr] = useState("");
  const [busyId, setBusyId] = useState("");
  const [copiedId, setCopiedId] = useState("");

  const reload = useCallback(() => {
    setErr("");
    listMyShares()
      .then(setShares)
      .catch((e) => {
        setShares([]);
        setErr(String(e.message || e));
      });
    listMyReactions()
      .then(setReactions)
      .catch(() => setReactions([]));
  }, []);

  useEffect(() => {
    // 本地任务历史
    try {
      const raw = localStorage.getItem("ma.history");
      if (raw) setHistory(JSON.parse(raw));
    } catch {}
    // 登录态
    const sb = getSupabase();
    if (sb) {
      sb.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
      const { data: sub } = sb.auth.onAuthStateChange((_e, session) => {
        setEmail(session?.user?.email ?? null);
        reload(); // 登录后归属可能变化，重新拉
      });
      return () => sub.subscription.unsubscribe();
    }
  }, [reload]);

  useEffect(() => {
    reload();
  }, [reload]);

  const toggle = async (s: MyShare) => {
    setBusyId(s.id);
    try {
      await setShareDisabled(s.id, !s.disabled);
      setShares((prev) =>
        (prev ?? []).map((x) => (x.id === s.id ? { ...x, disabled: !s.disabled } : x))
      );
    } catch (e) {
      setErr(String((e as Error).message || e));
    } finally {
      setBusyId("");
    }
  };

  const remove = async (s: MyShare) => {
    if (!confirm(`确定彻底删除这条分享？\n「${s.title || "未命名对比"}」\n删除后链接永久失效、无法恢复。`))
      return;
    setBusyId(s.id);
    try {
      await deleteShare(s.id);
      setShares((prev) => (prev ?? []).filter((x) => x.id !== s.id));
      // 该分享下我的评论也随之失效，刷新一下
      setReactions((prev) => (prev ?? []).filter((r) => r.shareId !== s.id));
    } catch (e) {
      setErr(String((e as Error).message || e));
    } finally {
      setBusyId("");
    }
  };

  const copy = (s: MyShare) => {
    const url = `${location.origin}/r/${s.id}`;
    void navigator.clipboard.writeText(url).catch(() => {});
    setCopiedId(s.id);
    setTimeout(() => setCopiedId(""), 1500);
  };

  const btn =
    "rounded-md border border-line bg-card px-2.5 py-1 text-[12px] text-faint hover:text-ink cursor-pointer disabled:opacity-40";

  return (
    <main className="mx-auto max-w-3xl px-5 py-8">
      <nav className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo />
          <Link href="/arena" className="text-[13px] text-faint hover:text-ink">
            ← 竞速场
          </Link>
        </div>
        <button
          onClick={() => setAccountOpen(true)}
          className="rounded-md border border-line px-3 py-1.5 text-[12.5px] text-faint hover:text-ink cursor-pointer"
        >
          {email ? `👤 ${email}` : "登录 / 账号"}
        </button>
      </nav>

      <header className="mb-5">
        <h1 className="text-[26px] font-black" style={{ fontFamily: "var(--font-title)" }}>
          我的中心
        </h1>
        <p className="mt-1 text-[12.5px] text-faint">
          {email
            ? "已登录：分享与赞踩评论按账号归属，换设备也能看到与管理。"
            : "当前按「本设备」展示你的记录。登录后可跨设备管理，避免清空浏览器数据后丢失。"}
        </p>
      </header>

      {err && (
        <div className="mb-4 rounded-lg border border-accent/30 bg-accent/5 px-3 py-2 text-[12px] text-accent">
          {err}
          {/share_votes|shares 表|alter|column/i.test(err) && (
            <span className="text-faint">
              （需在 Supabase 重跑 supabase/schema.sql 的相关建表/alter 语句）
            </span>
          )}
        </div>
      )}

      {/* 我的分享 */}
      <section className="mb-7">
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="text-[15px] font-bold">📤 我的分享</h2>
          <span className="num text-[11px] text-faint">
            {shares ? `${shares.length} 条` : "加载中…"}
          </span>
        </div>
        {shares && shares.length === 0 ? (
          <div className="rounded-lg border border-dashed border-line bg-card/60 px-4 py-6 text-center text-[12.5px] text-faint">
            还没有分享过。去竞速场跑一轮 → 生成分享链接，就会出现在这里。
          </div>
        ) : (
          <div className="space-y-2">
            {(shares ?? []).map((s) => (
              <div
                key={s.id}
                className={`rounded-lg border bg-card px-3.5 py-2.5 ${
                  s.disabled ? "border-line opacity-70" : "border-line"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate text-[13.5px] font-semibold">
                      {s.title || "未命名对比"}
                      {s.disabled && (
                        <span className="ml-2 rounded bg-paper px-1.5 py-0.5 text-[10px] text-faint">
                          已关闭
                        </span>
                      )}
                    </div>
                    <div className="num mt-0.5 text-[11px] text-faint">
                      {fmt(s.createdAt)} · {s.modelCount} 个模型 · 👁 {s.views}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
                    {!s.disabled && (
                      <a href={`/r/${s.id}`} target="_blank" className={btn} rel="noreferrer">
                        打开
                      </a>
                    )}
                    <button className={btn} onClick={() => copy(s)}>
                      {copiedId === s.id ? "已复制 ✓" : "复制链接"}
                    </button>
                    <button
                      className={btn}
                      disabled={busyId === s.id}
                      onClick={() => toggle(s)}
                      title={s.disabled ? "重新公开" : "关闭后链接失效，可随时再开"}
                    >
                      {s.disabled ? "重新开启" : "关闭分享"}
                    </button>
                    <button
                      className="rounded-md border border-accent/30 px-2.5 py-1 text-[12px] text-accent hover:bg-accent/5 cursor-pointer disabled:opacity-40"
                      disabled={busyId === s.id}
                      onClick={() => remove(s)}
                    >
                      删除
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 我的赞踩 / 评论 */}
      <section className="mb-7">
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="text-[15px] font-bold">👍 我的赞踩 / 评论</h2>
          <span className="num text-[11px] text-faint">
            {reactions ? `${reactions.length} 条` : "加载中…"}
          </span>
        </div>
        {reactions && reactions.length === 0 ? (
          <div className="rounded-lg border border-dashed border-line bg-card/60 px-4 py-6 text-center text-[12.5px] text-faint">
            还没有在分享页给模型点过赞踩或评论。
          </div>
        ) : (
          <div className="space-y-1.5">
            {(reactions ?? []).map((r, i) => (
              <a
                key={i}
                href={`/r/${r.shareId}`}
                target="_blank"
                rel="noreferrer"
                className="block rounded-lg border border-line bg-card px-3.5 py-2 hover:border-ink/30"
              >
                <div className="flex items-center gap-2 text-[12.5px]">
                  <span>
                    {r.sentiment === "up" ? "👍" : r.sentiment === "down" ? "👎" : "💬"}
                  </span>
                  <span className="num truncate font-semibold">{r.modelId || "（模型）"}</span>
                  <span className="num ml-auto shrink-0 text-[11px] text-faint">
                    {fmt(r.at)}
                  </span>
                </div>
                {r.comment && (
                  <div className="mt-1 break-words text-[12px] text-faint">{r.comment}</div>
                )}
              </a>
            ))}
          </div>
        )}
      </section>

      {/* 我的任务历史（本机） */}
      <section className="mb-7">
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="text-[15px] font-bold">🕘 我的任务历史</h2>
          <span className="num text-[11px] text-faint">{history.length} 条（本机）</span>
        </div>
        {history.length === 0 ? (
          <div className="rounded-lg border border-dashed border-line bg-card/60 px-4 py-6 text-center text-[12.5px] text-faint">
            本机还没有跑过对比。
          </div>
        ) : (
          <div className="space-y-1.5">
            {history.map((h) => (
              <Link
                key={h.id}
                href="/arena"
                className="block rounded-lg border border-line bg-card px-3.5 py-2 hover:border-ink/30"
              >
                <div className="flex items-center gap-2">
                  <span className="truncate text-[13px] font-semibold">
                    {h.title?.trim() || h.prompt.slice(0, 24) || "未命名任务"}
                  </span>
                  <span className="num ml-auto shrink-0 text-[11px] text-faint">
                    {fmt(h.at)}
                  </span>
                </div>
                <div className="mt-0.5 truncate text-[11.5px] text-faint">
                  {h.results.length} 个模型 · {h.prompt.slice(0, 40) || "（无提示词）"}
                </div>
              </Link>
            ))}
          </div>
        )}
        <p className="mt-2 text-[11px] text-faint/70">
          任务历史保存在本机浏览器；登录并在竞速场开启「云同步」可加密备份、换机恢复。在{" "}
          <Link href="/arena" className="underline hover:text-ink">
            竞速场
          </Link>{" "}
          的历史抽屉里可一键恢复某次任务。
        </p>
      </section>

      <footer className="mt-8 flex justify-center">
        <Credit compact />
      </footer>

      <AccountDialog open={accountOpen} onClose={() => setAccountOpen(false)} />
    </main>
  );
}
