"use client";
import { ProviderIcon } from "./ProviderIcon";
import { grade } from "@/lib/grade";
import { findEndpointPrice, estimateRunCost } from "@/lib/pricing";
import type { TaskIdentity } from "@/lib/benchmark-suite";
import type { ModelEndpoint, RunState } from "@/lib/types";
export function ResultSummary({
  rows,
  prompt,
  task,
  en,
}: {
  rows: { endpoint: ModelEndpoint; run: RunState }[];
  prompt: string;
  task?: TaskIdentity;
  en: boolean;
}) {
  const title = en
    ? "This run · quality, latency and cost"
    : "本轮结果 · 效果、等待与成本";
  const seconds = (n?: number) =>
    n == null ? "—" : `${(n / 1000).toFixed(2)}s`;
  return (
    <section
      className="my-4 overflow-x-auto rounded-lg border border-line bg-card"
      aria-label={en ? "Result summary" : "结果摘要"}
    >
      <h2 className="px-4 py-3 text-left text-sm font-bold">{title}</h2>
      <table
        aria-label={title}
        className="w-full min-w-[620px] text-left text-sm"
      >
        <thead className="border-y border-line text-faint">
          <tr>
            {(en
              ? [
                  "Model",
                  "Task",
                  "First content",
                  "Complete",
                  "Output speed",
                  "Cost (USD)",
                ]
              : [
                  "模型",
                  "任务效果",
                  "首个正文",
                  "完整耗时",
                  "输出速度",
                  "成本（美元）",
                ]
            ).map((h) => (
              <th key={h} className="p-3 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(({ endpoint: e, run: r }) => {
            const g = r.status === "done" ? grade(prompt, r.text, task) : null,
              p = findEndpointPrice(e.model, e.baseUrl),
              m = r.metrics;
            const cost =
              p && m?.promptTokens != null && m.outputTokens != null
                ? estimateRunCost(p, m.promptTokens, m.outputTokens).totalUsd
                : null;
            return (
              <tr key={e.id} className="border-b border-line last:border-0">
                <th className="p-3 font-medium">
                  <span className="flex items-center gap-2">
                    <ProviderIcon model={e.model} name={e.name} baseUrl={e.baseUrl} size="sm" />
                    {e.name}
                  </span>
                </th>
                <td className="p-3">
                  {r.status === "done"
                    ? g
                      ? g.pass
                        ? en
                          ? "Passed"
                          : "通过"
                        : en
                          ? "Failed check"
                          : "未通过"
                      : en
                        ? "Not evaluated"
                        : "尚未评估"
                    : r.status === "truncated"
                      ? en
                        ? "Truncated"
                        : "已截断"
                      : r.status === "stopped"
                        ? en
                          ? "Stopped"
                          : "已停止"
                        : r.status === "error"
                          ? en
                            ? "Failed"
                            : "请求失败"
                          : en
                            ? "Running"
                            : "运行中"}
                </td>
                <td className="p-3 num">{seconds(m?.firstContentMs)}</td>
                <td className="p-3 num">{seconds(m?.totalMs)}</td>
                <td className="p-3 num">
                  {m?.contentTps == null
                    ? "—"
                    : `${m.contentTps.toFixed(1)} tok/s`}
                </td>
                <td className="p-3 num">
                  {cost == null
                    ? en
                      ? "Unknown"
                      : "未知"
                    : `${p?.rateType === "upper-bound" ? "≤" : "≈"}$${cost.toFixed(6)}`}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="px-4 py-2 text-xs text-faint">
        {en
          ? "Browser completion time includes transport. Tokenizers differ; task quality requires a versioned check. Estimated costs use the listed endpoint price and uncached input."
          : "完整耗时包含浏览器网络开销。不同 tokenizer 的 tok/s 不完全可比；任务评分需要版本化校验。成本按对应接入点的已记录价格及未命中缓存的输入估算。"}
      </p>
    </section>
  );
}
