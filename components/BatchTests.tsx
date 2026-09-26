"use client";
import { useEffect, useRef, useState } from "react";
import { track } from "@vercel/analytics";
import {
  BENCHMARK_CASES,
  BENCHMARK_PARAMS,
  type TaskIdentity,
} from "@/lib/benchmark-suite";
import { grade } from "@/lib/grade";
import { runEndpoint } from "@/lib/runner";
import {
  emptyRun,
  type ModelEndpoint,
  type RunParams,
  type RunState,
} from "@/lib/types";
type TestCase = {
  id: string;
  title: string;
  prompt: string;
  task?: TaskIdentity;
};
type BatchRow = {
  caseId: string;
  title: string;
  prompt: string;
  task?: TaskIdentity;
  model: string;
  provider: string;
  params: RunParams;
  at: string;
  run: RunState;
};
export function BatchTests({
  endpoints,
  params,
  prompt,
  en,
  onBusy,
}: {
  endpoints: ModelEndpoint[];
  params: RunParams;
  prompt: string;
  en: boolean;
  onBusy: (busy: boolean) => void;
}) {
  const [custom, setCustom] = useState<TestCase[]>([]),
    [rows, setRows] = useState<BatchRow[]>([]),
    [busy, setBusy] = useState(false),
    [progress, setProgress] = useState(""),
    [which, setWhich] = useState("standard");
  const ctrl = useRef<AbortController | null>(null);
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("ma.testSuite") || "[]");
      if (Array.isArray(saved))
        setCustom(
          saved
            .filter(
              (c) =>
                typeof c?.prompt === "string" &&
                typeof c?.id === "string" &&
                typeof c?.title === "string",
            )
            .slice(0, 50),
        );
    } catch {}
    return () => ctrl.current?.abort();
  }, []);
  const save = (next: TestCase[]) => {
    setCustom(next);
    localStorage.setItem("ma.testSuite", JSON.stringify(next));
    track("test_suite_save", { cases: next.length });
  };
  const download = (format: "json" | "csv") => {
    const cell = (v: unknown) =>
      `"${String(v ?? "")
        .replace(/^[=+\-@\t\r]/, "'$&")
        .replaceAll('"', '""')}"`;
    const data =
      format === "json"
        ? JSON.stringify({ version: 1, rows }, null, 2)
        : [
            [
              "case",
              "model",
              "provider",
              "status",
              "passed",
              "firstContentMs",
              "totalMs",
              "promptTokens",
              "outputTokens",
              "prompt",
              "output",
            ],
            ...rows.map((r) => [
              r.caseId,
              r.model,
              r.provider,
              r.run.status,
              r.run.status === "done"
                ? (grade(r.prompt, r.run.text, r.task)?.pass ?? "")
                : false,
              r.run.metrics?.firstContentMs,
              r.run.metrics?.totalMs,
              r.run.metrics?.promptTokens,
              r.run.metrics?.outputTokens,
              r.prompt,
              r.run.text,
            ]),
          ]
            .map((row) => row.map(cell).join(","))
            .join("\r\n");
    const url = URL.createObjectURL(
        new Blob([data], {
          type:
            format === "json" ? "application/json" : "text/csv;charset=utf-8",
        }),
      ),
      a = document.createElement("a");
    a.href = url;
    a.download = `tokrace-batch.${format}`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    track("result_export", { format });
  };
  async function run() {
    const cases =
      which === "standard"
        ? BENCHMARK_CASES.map((c) => ({
            id: c.id,
            title: en ? c.titleEn : c.title,
            prompt: c.prompt,
            task: { caseId: c.id, version: c.version },
          }))
        : custom;
    const targets = endpoints.filter((e) => e.enabled);
    if (!targets.length || !cases.length) return;
    const p = which === "standard" ? BENCHMARK_PARAMS : params;
    ctrl.current = new AbortController();
    setBusy(true);
    onBusy(true);
    setRows([]);
    try {
      for (let i = 0; i < cases.length; i++) {
        if (ctrl.current.signal.aborted) break;
        const c = cases[i],
          runId = crypto.randomUUID();
        setProgress(`${i + 1}/${cases.length}`);
        for (const endpoint of targets) {
          if (ctrl.current.signal.aborted) break;
          let state = emptyRun();
          await runEndpoint({
            endpoint,
            prompt: c.prompt,
            params: p,
            signal: ctrl.current.signal,
            runId,
            update: (fn) => {
              state = fn(state);
            },
            onSettled: () => {},
          });
          const row = {
            caseId: c.id,
            title: c.title,
            prompt: c.prompt,
            task: c.task,
            model: endpoint.model,
            provider: endpoint.baseUrl,
            params: p,
            at: new Date().toISOString(),
            run: state,
          };
          setRows((prev) => [...prev, row]);
        }
      }
    } finally {
      setBusy(false);
      onBusy(false);
    }
  }
  return (
    <details className="my-4 rounded-lg border border-line bg-card p-4">
      <summary className="cursor-pointer font-semibold">
        {en ? "Saved test suites & batch runs" : "本地测试集与批量运行"}
      </summary>
      <p className="my-3 text-sm text-faint">
        {en
          ? "Each case runs against your selected endpoints and uses their quota or API budget. Results stay in this browser until you export them."
          : "每个案例都会调用已选模型，消耗相应额度或 API 费用。结果保留在当前页面，导出后可长期保存。"}
      </p>
      <div className="flex flex-wrap gap-3">
        <select
          aria-label={en ? "Test suite" : "选择测试集"}
          value={which}
          disabled={busy}
          onChange={(e) => setWhich(e.target.value)}
          className="border border-line p-2"
        >
          <option value="standard">
            {en ? "15 standard cases" : "15 个标准案例"}
          </option>
          <option value="custom">
            {en
              ? `My cases (${custom.length})`
              : `我的案例（${custom.length}）`}
          </option>
        </select>
        <button
          disabled={busy || !prompt.trim() || custom.length >= 50}
          onClick={() =>
            save([
              ...custom,
              { id: crypto.randomUUID(), title: prompt.slice(0, 40), prompt },
            ])
          }
        >
          {en ? "Save current prompt" : "保存当前任务"}
        </button>
        <button
          disabled={
            busy ||
            !endpoints.some((e) => e.enabled) ||
            (which === "custom" && !custom.length)
          }
          className="rounded bg-ink px-4 text-paper disabled:opacity-40"
          onClick={run}
        >
          {en ? "Run batch" : "批量运行"}
        </button>
        {busy && (
          <button onClick={() => ctrl.current?.abort()}>
            {en ? "Stop" : "停止"} · {progress}
          </button>
        )}
        {rows.length > 0 &&
          (["json", "csv"] as const).map((f) => (
            <button key={f} onClick={() => download(f)}>
              {en ? "Export" : "导出"} {f.toUpperCase()}
            </button>
          ))}
      </div>
      {which === "custom" && (
        <ul className="mt-3 space-y-2">
          {custom.map((c) => (
            <li key={c.id} className="flex gap-4 text-sm">
              <span>{c.title}</span>
              <button
                disabled={busy}
                onClick={() => save(custom.filter((x) => x.id !== c.id))}
              >
                {en ? "Remove" : "删除"}
              </button>
            </li>
          ))}
        </ul>
      )}
      {rows.length > 0 && (
        <p className="mt-3 text-sm" role="status">
          {en ? "Recorded" : "已记录"} {rows.length} ·{" "}
          {en ? "Completed" : "完整完成"}{" "}
          {rows.filter((r) => r.run.status === "done").length} ·{" "}
          {en ? "Passed checks" : "校验通过"}{" "}
          {
            rows.filter(
              (r) =>
                r.run.status === "done" &&
                grade(r.prompt, r.run.text, r.task)?.pass,
            ).length
          }
        </p>
      )}
    </details>
  );
}
