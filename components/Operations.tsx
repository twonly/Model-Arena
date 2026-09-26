"use client";
import { useState } from "react";
import { getSupabase } from "@/lib/supabase-client";
export function Operations({ en }: { en: boolean }) {
  const [status, setStatus] = useState<Record<string, unknown> | null>(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(false);
  async function refresh() {
    setLoading(true);
    setError("");
    try {
      const session = await getSupabase()?.auth.getSession();
      const token = session?.data.session?.access_token;
      if (!token)
        throw new Error(
          en
            ? "Sign in to an administrator account in the arena first."
            : "请先在竞速场登录管理员账号。",
        );
      const res = await fetch("/api/benchmarks", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok)
        throw new Error(
          res.status === 401
            ? en
              ? "Administrator access required."
              : "需要管理员权限。"
            : en
              ? "Storage is not ready. Check migration 005."
              : "存储尚未就绪，请检查迁移 005。",
        );
      setStatus(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }
  return (
    <main className="mx-auto max-w-5xl px-5 py-10">
      <h1 className="text-3xl font-bold">
        {en ? "Benchmark operations" : "自动实测运行状态"}
      </h1>
      <p className="my-4 text-faint">
        {en
          ? "Read-only administrative view. Scheduled-run delays and provider failures are tracked separately."
          : "管理员只读视图，分别展示调度延迟、模型失败、预算与发布状态。"}
      </p>
      <button
        className="rounded bg-ink px-5 py-3 text-paper"
        disabled={loading}
        onClick={refresh}
      >
        {loading ? "…" : en ? "Load / refresh" : "读取 / 刷新"}
      </button>
      {error && (
        <p role="alert" className="mt-4 text-accent">
          {error}
        </p>
      )}
      {status && (
        <>
          <div className="my-5 grid gap-4 sm:grid-cols-3">
            <p>
              {en ? "Scheduler" : "调度"}：
              {status.schedulerStale
                ? en
                  ? "Overdue"
                  : "超过 8 小时未更新"
                : "OK"}
            </p>
            <p>
              {en ? "Last completed" : "最近完成"}：
              {String(status.lastCompletedAt ?? "—")}
            </p>
            <p>
              {en ? "API tests" : "API 测试"}：
              {status.enabled
                ? en
                  ? "Enabled"
                  : "已启用"
                : en
                  ? "Paused"
                  : "暂停"}
            </p>
          </div>
          <pre className="max-h-[70vh] overflow-auto rounded border border-line bg-card p-4 text-xs">
            {JSON.stringify(status, null, 2)}
          </pre>
        </>
      )}
    </main>
  );
}
