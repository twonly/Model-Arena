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
  en,
  disabled,
  onBusy,
  onConfigure,
}: {
  endpoints: ModelEndpoint[];
  en: boolean;
  disabled: boolean;
  onBusy: (busy: boolean) => void;
  onConfigure: () => void;
}) {
  const [prompt, setPrompt] = useState("");
  const [params, setParams] = useState<RunParams>(BENCHMARK_PARAMS);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [custom, setCustom] = useState<TestCase[]>([]),
    [rows, setRows] = useState<BatchRow[]>([]),
    [busy, setBusy] = useState(false),
    [progress, setProgress] = useState(""),
    [which, setWhich] = useState("standard");
  const targets = endpoints.filter((e) => selected[e.id]);
  useEffect(() => {
    if (!Object.keys(selected).length && endpoints.length)
      setSelected(Object.fromEntries(endpoints.map((e) => [e.id, e.enabled])));
  }, [endpoints, selected]);
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
    if (busy || disabled) return;
    const cases =
      which === "standard"
        ? BENCHMARK_CASES.map((c) => ({
            id: c.id,
            title: en ? c.titleEn : c.title,
            prompt: c.prompt,
            task: { caseId: c.id, version: c.version },
          }))
        : custom;
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
    <section
      aria-label={en ? "Batch workspace" : "批量测试工作区"}
      className="rounded-lg border border-line bg-card p-4 sm:p-6"
    >
      <h1 className="text-xl font-bold">
        {en ? "Saved test suites & batch runs" : "本地测试集与批量运行"}
      </h1>
      <p className="my-3 text-sm text-faint">
        {en
          ? "Each case runs against your selected endpoints and uses their quota or API budget. Results stay in this browser until you export them."
          : "每个案例都会调用已选模型，消耗相应额度或 API 费用。结果保留在当前页面，导出后可长期保存。"}
      </p>
      <fieldset disabled={busy} className="mb-5">
        <legend className="mb-2 font-semibold">
          {en ? "1. Choose models" : "1. 选择模型"}
        </legend>
        <p className="mb-3 text-sm text-faint">
          {en
            ? "Connections are shared with single comparisons. Model selections and parameters here apply only to batch runs."
            : "接入配置与单次对比共用；这里的模型勾选和运行参数仅用于批量测试。"}
        </p>
        <div
          className="flex flex-wrap gap-2"
          aria-label={en ? "Batch models" : "批量测试模型"}
        >
          {endpoints.map((endpoint) => (
            <label
              key={endpoint.id}
              className="flex cursor-pointer items-center gap-2 rounded border border-line px-3 py-2 text-sm"
            >
              <input
                type="checkbox"
                checked={!!selected[endpoint.id]}
                onChange={(e) =>
                  setSelected({ ...selected, [endpoint.id]: e.target.checked })
                }
              />
              {endpoint.name}
            </label>
          ))}
          <button
            className="rounded border border-line px-3 py-2 text-sm"
            onClick={onConfigure}
            disabled={disabled}
          >
            {en ? "Configure connections" : "配置模型接入"}
          </button>
        </div>
      </fieldset>
      <fieldset disabled={busy} className="mb-5">
        <legend className="mb-2 font-semibold">
          {en ? "2. Prepare test cases" : "2. 准备测试案例"}
        </legend>
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
        {which === "standard" ? (
          <p className="mt-3 text-sm text-faint">
            {en
              ? "JSON extraction, instruction following and grounded Q&A: 5 cases each. Fixed settings: temperature 0, max output 2048 tokens, no system prompt."
              : "JSON 抽取、指令遵循、给定材料问答，各 5 个案例。固定参数：Temperature 0、最大输出 2048 tokens、无 System Prompt。"}
          </p>
        ) : (
          <div className="mt-3 space-y-3">
            <label
              htmlFor="batch-case-prompt"
              className="block text-sm font-semibold"
            >
              {en ? "New test case" : "新测试案例"}
            </label>
            <textarea
              id="batch-case-prompt"
              className="mt-2 block w-full rounded border border-line p-3 font-normal"
              rows={4}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={
                en
                  ? "Enter a task to add to this local suite"
                  : "输入任务，添加到本地测试集"
              }
            />
            <button
              className="rounded border border-line px-3 py-2 text-sm disabled:opacity-40"
              disabled={!prompt.trim() || custom.length >= 50}
              onClick={() => {
                save([
                  ...custom,
                  {
                    id: crypto.randomUUID(),
                    title: prompt.trim().slice(0, 40),
                    prompt,
                  },
                ]);
                setPrompt("");
              }}
            >
              {en ? "Add case" : "添加案例"} ({custom.length}/50)
            </button>
            <ul className="space-y-2">
              {custom.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between gap-4 text-sm"
                >
                  <span className="min-w-0 break-words">{c.title}</span>
                  <button
                    className="shrink-0 px-3 py-2"
                    onClick={() => save(custom.filter((x) => x.id !== c.id))}
                  >
                    {en ? "Remove" : "删除"}
                  </button>
                </li>
              ))}
            </ul>
            <details>
              <summary className="cursor-pointer py-2 text-sm font-semibold">
                {en ? "Batch parameters" : "批量运行参数"}
              </summary>
              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                <div className="text-sm sm:col-span-2">
                  <label htmlFor="batch-system-prompt">System Prompt</label>
                  <textarea
                    id="batch-system-prompt"
                    className="mt-1 block w-full rounded border border-line p-2"
                    rows={2}
                    value={params.systemPrompt}
                    onChange={(e) =>
                      setParams({ ...params, systemPrompt: e.target.value })
                    }
                  />
                </div>
                <label className="text-sm">
                  Temperature
                  <input
                    className="mt-1 block w-full rounded border border-line p-2"
                    value={params.temperature}
                    onChange={(e) =>
                      setParams({ ...params, temperature: e.target.value })
                    }
                  />
                </label>
                <label className="text-sm">
                  Max Tokens
                  <input
                    className="mt-1 block w-full rounded border border-line p-2"
                    value={params.maxTokens}
                    onChange={(e) =>
                      setParams({ ...params, maxTokens: e.target.value })
                    }
                  />
                </label>
              </div>
            </details>
          </div>
        )}
      </fieldset>
      <h2 className="mb-2 font-semibold">
        {en ? "3. Run & export" : "3. 运行与导出"}
      </h2>
      <p className="mb-3 text-sm text-faint">
        {which === "standard" ? BENCHMARK_CASES.length : custom.length}{" "}
        {en ? "cases" : "个案例"} × {targets.length} {en ? "models" : "个模型"}{" "}
        ·{" "}
        {en
          ? "Runs sequentially; stopping keeps recorded results."
          : "依次执行；停止后保留已记录结果。"}
      </p>
      {disabled && (
        <p className="mb-3 text-sm text-accent" role="status">
          {en
            ? "A single comparison is running. Finish or stop it before starting a batch."
            : "单次对比正在运行，请完成或停止后再启动批量测试。"}
        </p>
      )}
      <div className="flex flex-wrap gap-3 [&>button]:min-h-11 [&>button]:px-3">
        <button
          disabled={
            busy ||
            disabled ||
            !targets.length ||
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
    </section>
  );
}
