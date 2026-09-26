"use client";
import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase-client";
import { Markdown } from "@/components/Markdown";
import type { BenchmarkDraft, Editorial } from "@/lib/benchmark-editorial";
const emptyEditorial = (): Editorial => ({
  "zh-CN": { title: "", summary: "", body: "" },
  en: { title: "", summary: "", body: "" },
});
const errors: Record<string, string> = {
  unauthorized: "请先在竞速场登录管理员账号。",
  draft_conflict: "草稿已有新版本。你的编辑仍保留，请刷新并对照后重新保存。",
  current_availability_unverified: "模型可用性记录已过期，请先刷新模型目录。",
  evidence_stale: "测试数据已超过 7 天，请先复测。",
  invalid_editorial_title: "请填写中英文标题（不超过 160 字符）。",
  invalid_editorial_summary: "请填写中英文摘要（不超过 500 字符）。",
  invalid_editorial_body: "请填写中英文正文（不超过 30000 字符）。",
};
export function Operations({ en }: { en: boolean }) {
  const [status, setStatus] = useState<Record<string, unknown> | null>(null);
  const [drafts, setDrafts] = useState<BenchmarkDraft[]>([]);
  const [selected, setSelected] = useState<BenchmarkDraft | null>(null);
  const [editorial, setEditorial] = useState<Editorial>(emptyEditorial);
  const [locale, setLocale] = useState<"zh-CN" | "en">(en ? "en" : "zh-CN");
  const [filter, setFilter] = useState("pending");
  const [dirty, setDirty] = useState(false);
  const [preview, setPreview] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  async function request(path = "", body?: unknown) {
    const session = await getSupabase()?.auth.getSession();
    const token = session?.data.session?.access_token;
    if (!token) throw new Error("unauthorized");
    const response = await fetch(`/api/benchmarks${path}`, {
      method: body ? "POST" : "GET",
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const result = await response.json();
    if (!response.ok)
      throw new Error(
        result.error ??
          result.problems?.join("；") ??
          `HTTP ${response.status}`,
      );
    return result;
  }
  async function act(action: () => Promise<void>) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await action();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unknown error";
      setError(en ? message : (errors[message] ?? message));
    } finally {
      setBusy(false);
    }
  }
  async function refresh() {
    const [s, queue] = await Promise.all([request(), request("?editorial=1")]);
    setStatus(s);
    setDrafts(queue);
  }
  useEffect(() => {
    void act(refresh);
  }, []);
  function choose(draft: BenchmarkDraft) {
    if (
      dirty &&
      !window.confirm(
        en
          ? "Discard unsaved edits?"
          : "切换草稿将放弃尚未保存的修改，继续吗？",
      )
    )
      return;
    setSelected(draft);
    setEditorial(draft.editorial ?? emptyEditorial());
    setDirty(false);
    setError("");
    setNotice("");
  }
  function accept(saved: BenchmarkDraft) {
    setSelected(saved);
    setEditorial(saved.editorial ?? emptyEditorial());
    setDirty(false);
    setDrafts((rows) => rows.map((row) => (row.id === saved.id ? saved : row)));
  }
  async function save() {
    if (!selected) return null;
    const saved = await request("", {
      action: "save_editorial",
      id: selected.id,
      revision: selected.revision,
      editorial,
    });
    accept(saved);
    return saved as BenchmarkDraft;
  }
  async function publish() {
    if (!selected) return;
    const draft = dirty ? await save() : selected;
    if (!draft) return;
    const result = await request("", {
      action: "publish",
      id: draft.id,
      revision: draft.revision,
    });
    const saved = await request(`?draft=${encodeURIComponent(draft.id)}`);
    accept(saved);
    await refresh();
    setNotice(
      (en ? "Published. " : "已发布到线上。") +
        (result.indexing === "pending"
          ? en
            ? "Index submission will need a retry."
            : "索引提交暂未成功，页面已可访问。"
          : ""),
    );
  }
  const pending = drafts.filter((d) => d.published_revision !== d.revision);
  const visible = filter === "pending" ? pending : drafts;
  const fieldClass =
    "w-full rounded border border-line bg-paper px-3 py-2 text-ink";
  return (
    <main className="mx-auto max-w-7xl px-5 py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-faint">
            TOKRACE / {en ? "OPERATIONS" : "内容运营"}
          </p>
          <h1 className="mt-2 text-3xl font-bold">
            {en ? "Benchmark editorial desk" : "新模型评测工作台"}
          </h1>
          <p className="mt-3 text-faint">
            {en
              ? "Automatic tests → Codex draft → your confirmation → public report."
              : "自动评测 → Codex 写稿 → 你确认 → 线上报告"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="rounded border border-line px-4 py-2" disabled={busy} onClick={() => void act(async () => {
            const result = await request("", {action: "discover"});
            await refresh();
            setNotice(result.every((r: {state: string}) => r.state === "ok") ? (en ? "Model catalog refreshed." : "模型目录已刷新。") : (en ? "Some providers are unavailable; see diagnostics." : "部分渠道暂不可用，请查看运行诊断。"));
          })}>{en ? "Discover now" : "立即抓取"}</button>
          <a
            className="rounded border border-line px-4 py-2"
            href={en ? "/en/arena" : "/zh-CN/arena"}
          >
            {en ? "Account / sign in" : "账号 / 登录"}
          </a>
          <button
            className="rounded border border-line px-4 py-2"
            disabled={busy}
            onClick={() => void act(refresh)}
          >
            {en ? "Refresh queue" : "刷新队列"}
          </button>
        </div>
      </div>
      <div className="my-7 grid gap-3 sm:grid-cols-3">
        {[
          [en ? "Awaiting publication" : "待发布", pending.length],
          [
            en ? "Discovery heartbeat" : "抓取状态",
            status
              ? status.schedulerStale
                ? en
                  ? "Delayed"
                  : "更新延迟"
                : en
                  ? "Current"
                  : "正常"
              : "—",
          ],
          [
            en ? "Daily budget" : "每日评测上限",
            status
              ? `¥${(status.budget as { daily: number })?.daily ?? "—"}`
              : "—",
          ],
        ].map(([label, value]) => (
          <div
            key={String(label)}
            className="rounded-lg border border-line bg-card p-4"
          >
            <p className="text-sm text-faint">{label}</p>
            <p className="mt-1 text-2xl font-bold">{value}</p>
          </div>
        ))}
      </div>
      {error && (
        <p
          role="alert"
          className="mb-4 rounded border border-line p-4 text-accent"
        >
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="mb-4 rounded border border-line p-4">
          {notice}
        </p>
      )}
      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside>
          <div className="mb-3 flex gap-2">
            {["pending", "all"].map((f) => (
              <button
                key={f}
                aria-pressed={filter === f}
                onClick={() => setFilter(f)}
                className={`rounded px-3 py-2 ${filter === f ? "bg-ink text-paper" : "border border-line"}`}
              >
                {f === "pending"
                  ? en
                    ? "Pending"
                    : "待发布"
                  : en
                    ? "All"
                    : "全部"}
              </button>
            ))}
          </div>
          {!visible.length && (
            <p className="rounded border border-dashed border-line p-5 text-sm text-faint">
              {en
                ? "Completed evaluations will appear here. Drafts remain private."
                : "评测完成后，草稿会出现在这里。确认发布前仅管理员可见。"}
            </p>
          )}
          <div className="space-y-3">
            {visible.map((draft) => (
              <button
                key={draft.id}
                disabled={busy}
                onClick={() => choose(draft)}
                className={`w-full rounded-lg border p-4 text-left ${selected?.id === draft.id ? "border-ink bg-card" : "border-line"}`}
              >
                <span className="block text-xs text-faint">
                  {draft.summary.stage === "first-look"
                    ? en
                      ? "FIRST LOOK"
                      : "首测"
                    : en
                      ? "STANDARD"
                      : "完整评测"}{" "}
                  · {draft.summary.testedAt.slice(0, 10)}
                </span>
                <strong className="my-2 block">
                  {draft.editorial?.[locale].title ??
                    draft.summary.models.map((m) => m.name).join(" / ")}
                </strong>
                <span className="text-xs text-faint">
                  {draft.published_revision === draft.revision
                    ? en
                      ? "Published"
                      : "已发布"
                    : draft.editorial
                      ? en
                        ? "Awaiting your confirmation"
                        : "待你确认"
                      : en
                        ? "Awaiting Codex draft"
                        : "待 Codex 写稿"}
                </span>
              </button>
            ))}
          </div>
        </aside>
        {selected ? (
          <section className="min-w-0 rounded-lg border border-line bg-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex gap-2">
                {(["zh-CN", "en"] as const).map((l) => (
                  <button
                    key={l}
                    aria-pressed={locale === l}
                    className={`rounded px-3 py-2 ${locale === l ? "bg-ink text-paper" : "border border-line"}`}
                    onClick={() => setLocale(l)}
                  >
                    {l === "en" ? "English" : "中文"}
                  </button>
                ))}
              </div>
              <span className="text-sm text-faint">
                {dirty
                  ? en
                    ? "Unsaved changes"
                    : "有未保存修改"
                  : en
                    ? "Saved"
                    : "已保存"}
              </span>
            </div>
            <p className="my-4 text-sm text-faint">
              {selected.summary.attemptCount}{" "}
              {en
                ? "attempts · original evidence is read only"
                : "次实测 · 原始数据只读"}{" "}
              ·{" "}
              {selected.summary.stage === "first-look"
                ? en
                  ? "single time window"
                  : "单一时间段首测"
                : en
                  ? "two time windows"
                  : "跨时间段复测"}
            </p>
            <fieldset disabled={busy} className="space-y-4">
              {(
                [
                  ["title", en ? "Title / SEO title" : "标题 / SEO 标题", 160],
                  [
                    "summary",
                    en ? "Summary / SEO description" : "摘要 / SEO 描述",
                    500,
                  ],
                  [
                    "body",
                    en ? "Review (Markdown)" : "评测正文（Markdown）",
                    30000,
                  ],
                ] as const
              ).map(([key, label, limit]) => (
                <label key={key} className="block text-sm font-medium">
                  {label}
                  <textarea
                    aria-label={label}
                    className={`${fieldClass} mt-2 font-normal`}
                    rows={key === "body" ? 14 : key === "summary" ? 3 : 2}
                    maxLength={limit}
                    value={editorial[locale][key]}
                    onChange={(e) => {
                      setEditorial((v) => ({
                        ...v,
                        [locale]: { ...v[locale], [key]: e.target.value },
                      }));
                      setDirty(true);
                    }}
                  />
                </label>
              ))}
            </fieldset>
            <div className="my-5 flex flex-wrap gap-3">
              <button
                disabled={busy || !dirty}
                className="rounded border border-line px-4 py-2 disabled:opacity-40"
                onClick={() =>
                  void act(async () => {
                    await save();
                    setNotice(en ? "Draft saved." : "草稿已保存。");
                  })
                }
              >
                {en ? "Save draft" : "保存草稿"}
              </button>
              <button
                aria-expanded={preview}
                className="rounded border border-line px-4 py-2"
                onClick={() => setPreview(!preview)}
              >
                {en ? "Preview" : "查看预览"}
              </button>
              <button
                disabled={
                  busy ||
                  (!dirty && selected.published_revision === selected.revision)
                }
                className="rounded bg-ink px-5 py-2 text-paper disabled:opacity-40"
                onClick={() => void act(publish)}
              >
                {busy ? "…" : en ? "Confirm and publish" : "确认并发布"}
              </button>
              {selected.published_report_id && (
                <a
                  className="px-2 py-2 underline"
                  target="_blank"
                  rel="noreferrer"
                  href={`/${locale}/reports/${selected.published_report_id}`}
                >
                  {en ? "Open published page" : "打开线上页面"}
                </a>
              )}
            </div>
            {preview && (
              <article className="rounded border border-line bg-paper p-5">
                <p className="text-xs text-faint">
                  {en ? "PRIVATE PREVIEW" : "私有预览 · 尚未发布的修改仅你可见"}
                </p>
                <h2 className="my-3 text-2xl font-bold">
                  {editorial[locale].title ||
                    (en ? "Title pending" : "待生成标题")}
                </h2>
                <p className="mb-5 text-faint">{editorial[locale].summary}</p>
                <Markdown text={editorial[locale].body} />
                <div className="mt-5 overflow-x-auto">
                  <table className="w-full min-w-[480px] text-left text-sm">
                    <thead>
                      <tr>
                        {(en
                          ? ["Model", "Passed / attempts", "Complete"]
                          : ["模型", "通过 / 尝试", "完整完成"]
                        ).map((t) => (
                          <th key={t} className="border-b border-line py-2">
                            {t}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {selected.summary.models.map((m) => {
                        const tasks = selected.summary.summaries[m.id];
                        return (
                          <tr key={m.id}>
                            <td className="py-2">{m.name}</td>
                            <td>
                              {tasks.reduce((n, s) => n + s.passed, 0)} /{" "}
                              {tasks.reduce((n, s) => n + s.attempts, 0)}
                            </td>
                            <td>
                              {tasks.reduce((n, s) => n + s.completed, 0)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </article>
            )}
            <details
              className="mt-5"
              onToggle={(e) => {
                if (e.currentTarget.open && !selected.snapshot && !busy)
                  void act(async () => {
                    const data = await request(
                      `?draft=${encodeURIComponent(selected.id)}`,
                    );
                    setSelected((current) =>
                      current && current.id === data.id
                        ? { ...current, snapshot: data.snapshot }
                        : current,
                    );
                  });
              }}
            >
              <summary className="cursor-pointer font-medium">
                {en
                  ? "Inspect prompts and raw outputs"
                  : "检查测试题与原始回答"}
              </summary>
              {selected.snapshot?.cases.map((c) => (
                <details
                  key={c.id}
                  className="mt-3 rounded border border-line p-3"
                >
                  <summary className="cursor-pointer">
                    {en ? c.titleEn : c.title}
                  </summary>
                  <p className="my-3 whitespace-pre-wrap text-sm">{c.prompt}</p>
                  {selected
                    .snapshot!.attempts.filter((a) => a.caseId === c.id)
                    .map((a) => (
                      <div key={a.id} className="mt-3">
                        <p className="text-sm font-bold">
                          {a.model.name} ·{" "}
                          {a.pass
                            ? en
                              ? "Passed"
                              : "通过"
                            : en
                              ? "Not passed"
                              : "未通过"}{" "}
                          · {a.status}
                        </p>
                        <pre className="max-h-72 overflow-auto whitespace-pre-wrap break-words bg-paper p-3 text-xs">
                          {a.text || a.error || "—"}
                        </pre>
                      </div>
                    ))}
                </details>
              ))}
            </details>
          </section>
        ) : (
          <section className="flex min-h-72 items-center justify-center rounded-lg border border-dashed border-line p-8 text-faint">
            {en
              ? "Select a report to edit and preview."
              : "选择一份报告，编辑内容并预览发布效果。"}
          </section>
        )}
      </div>
      {status && (
        <details className="mt-8">
          <summary className="cursor-pointer text-sm text-faint">
            {en ? "Run diagnostics" : "运行诊断"}
          </summary>
          <pre className="mt-3 max-h-72 overflow-auto rounded border border-line p-4 text-xs">
            {JSON.stringify(status, null, 2)}
          </pre>
        </details>
      )}
    </main>
  );
}
