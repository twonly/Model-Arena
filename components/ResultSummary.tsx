"use client";
import { ProviderIcon } from "./ProviderIcon";
import { grade } from "@/lib/grade";
import { findEndpointPrice, estimateRunCost, USD_PER_CNY } from "@/lib/pricing";
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
  const mixed = rows.some(({ run }) => run.origin?.kind === "history" || run.origin?.kind === "share");
  const title = mixed ? (en ? "Comparison · historical and new results" : "对比结果 · 历史与新增") : en
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
      {mixed && <p className="px-4 pb-3 text-xs text-faint">{en ? "Different test batches: compare timings with caution. Historical costs are not new charges; finish order is not ranked across batches." : "结果来自不同测试批次，速度仅供对照；历史费用不计入本次新增消耗，不跨批次比较完成名次。"}</p>}
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
              p = findEndpointPrice(e.model, e.baseUrl, e.customPricing),
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
                  {mixed && <div className="text-xs text-faint">{r.origin?.kind === "run" ? (en ? "New cost" : "本次新增费用") : (en ? "Historical cost" : "历史费用")}</div>}
                  {cost == null
                    ? en
                      ? "Unknown"
                      : "未知"
                    : `${p?.rateType === "upper-bound" ? "≤" : "≈"}$${cost.toFixed(6)}`}
                  <div className="mt-1 text-[10px] text-faint">
                    {!p ? (en ? "No price · set in model settings" : "缺少单价 · 可在模型配置中填写")
                      : cost == null ? (en ? "Missing token usage" : "缺少 Token 用量")
                      : e.customPricing ? (en ? "Custom price" : "自定义单价") : (en ? "Built-in price" : "内置单价")}
                  </div>
                  {cost != null && p && m && (
                    <details className="mt-1 text-[10px] text-faint">
                      <summary className="cursor-pointer">{en ? "Calculation" : "计算明细"}</summary>
                      <p>({m.promptTokens} × {p.inputMiss} + {m.outputTokens} × {p.output}) ÷ 1,000,000 {p.currency}</p>
                      {p.currency === "CNY" && <p>{en ? "Fixed estimate FX" : "估算固定汇率"}: 1 USD = {(1 / USD_PER_CNY).toFixed(1)} CNY</p>}
                      <p>{m.official ? (en ? "Provider-reported output tokens" : "输出 Token 来自厂商用量") : (en ? "Output tokens estimated" : "输出 Token 为估算值")}</p>
                    </details>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="px-4 py-2 text-xs text-faint">
        {en
          ? "Browser completion time includes transport. Tokenizers differ; task quality requires a versioned check. Cost = (input tokens × input rate + total output tokens × output rate) / 1M. Custom USD rates take priority; reasoning is not added twice. Input is uncached; missing usage stays unknown. This is an estimate, not an invoice."
          : "完整耗时包含浏览器网络开销。不同 tokenizer 的 tok/s 不完全可比；任务评分需要版本化校验。成本 =（输入 Token × 输入单价 + 总输出 Token × 输出单价）÷ 百万，自定义美元价优先，思考 Token 不重复相加。输入按未命中缓存计算；缺少用量仍显示未知。仅为估算，以账单为准。"}
      </p>
    </section>
  );
}
