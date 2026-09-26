import {
  BENCHMARK_CASES,
  BENCHMARK_PARAMS,
  BENCHMARK_REGION,
  SUITE_VERSION,
  TASK_LABELS,
  checkCase,
  type TaskCategory,
  type BenchmarkCase,
} from "./benchmark-suite.ts";
import type { RunParams } from "./types.ts";

export interface BenchmarkModel {
  id: string;
  slug: string;
  name: string;
  model: string;
  version: string;
  providerKey?: "deepseek" | "zhipu" | "orcarouter";
  kind?: "openai" | "anthropic";
  extraBody?: string;
  provider: string;
  source: string;
  availableUntil?: string;
}
export interface BenchmarkPrice {
  input: number;
  output: number;
  currency: "CNY" | "USD";
  source: string;
  verifiedAt: string;
  cnyPerUsd: number;
  basis?: "listed-rate" | "upper-bound";
}
export interface BenchmarkAttempt {
  id: string;
  campaign: string;
  model: BenchmarkModel;
  window: number;
  caseId: string;
  suiteVersion: string;
  region: string;
  params: RunParams;
  startedAt: string;
  finishedAt: string;
  status: "done" | "truncated" | "provider_error" | "infrastructure_error";
  text: string;
  error?: string;
  pass: boolean;
  firstContentMs?: number;
  totalMs: number;
  charactersPerSecond?: number;
  promptTokens?: number;
  outputTokens?: number;
  costCny?: number;
  reservedCny: number;
  price: BenchmarkPrice;
}
export interface BenchmarkReport {
  cases: BenchmarkCase[];
  id: string;
  campaign: string;
  version: string;
  publishedAt: string;
  testedAt: string;
  suiteVersion: string;
  region: string;
  models: BenchmarkModel[];
  attempts: BenchmarkAttempt[];
}
export type BenchmarkReportSummary = Omit<BenchmarkReport, "attempts"> & {
  attemptCount: number;
  params: RunParams;
  summaries: Record<string, ReturnType<typeof summarizeAttempts>>;
  outputPrices: Record<string, number>;
};
export function reportSummary(report: BenchmarkReport): BenchmarkReportSummary {
  const { attempts, ...header } = report;
  return {
    ...header,
    attemptCount: attempts.length,
    params: attempts[0].params,
    summaries: Object.fromEntries(
      report.models.map((m) => [
        m.id,
        summarizeAttempts(
          attempts.filter((a) => a.model.id === m.id),
          report.cases,
        ),
      ]),
    ),
    outputPrices: Object.fromEntries(
      report.models.map((m) => {
        const p = attempts.find((a) => a.model.id === m.id)!.price;
        return [m.id, p.output * (p.currency === "USD" ? p.cnyPerUsd : 1)];
      }),
    ),
  };
}
export function median(values: number[]): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b),
    middle = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
}
export function summarizeAttempts(
  attempts: BenchmarkAttempt[],
  suite = BENCHMARK_CASES,
) {
  return Object.keys(TASK_LABELS).map((category) => {
    const cases = new Set(
      suite.filter((c) => c.category === category).map((c) => c.id),
    );
    const rows = attempts.filter((a) => cases.has(a.caseId));
    const completed = rows.filter((a) => a.status === "done");
    const speeds = completed.flatMap((a) =>
      a.charactersPerSecond == null ? [] : [a.charactersPerSecond],
    );
    const durations = completed.map((a) => a.totalMs).sort((a, b) => a - b);
    return {
      category: category as TaskCategory,
      attempts: rows.length,
      completed: completed.length,
      passed: completed.filter((a) => a.pass).length,
      successRate: rows.length ? completed.length / rows.length : null,
      passRate: rows.length
        ? completed.filter((a) => a.pass).length / rows.length
        : null,
      firstContentMs: median(
        completed.flatMap((a) =>
          a.firstContentMs == null ? [] : [a.firstContentMs],
        ),
      ),
      totalMs: median(durations),
      charactersPerSecond: median(speeds),
      speedRange: speeds.length
        ? [Math.min(...speeds), Math.max(...speeds)]
        : null,
      speedComparable: speeds.length >= 10,
      p95Ms:
        durations.length >= 100
          ? durations[Math.ceil(durations.length * 0.95) - 1]
          : null,
      costCny: rows.every((a) => a.costCny != null)
        ? rows.reduce((sum, a) => sum + a.costCny!, 0)
        : null,
    };
  });
}
export function validPrice(
  price: BenchmarkPrice | undefined,
  now = Date.now(),
): price is BenchmarkPrice {
  return (
    !!price &&
    [price.input, price.output, price.cnyPerUsd].every(
      (n) => Number.isFinite(n) && n >= 0,
    ) &&
    price.cnyPerUsd > 0 &&
    ["CNY", "USD"].includes(price.currency) &&
    /^https:\/\//.test(price.source) &&
    Number.isFinite(Date.parse(price.verifiedAt)) &&
    Date.parse(price.verifiedAt) <= now &&
    now - Date.parse(price.verifiedAt) <= 30 * 86400000
  );
}
export function costCny(
  price: BenchmarkPrice,
  input: number,
  output: number,
): number {
  if (![input, output].every((n) => Number.isFinite(n) && n >= 0))
    throw new Error("Invalid token count");
  return (
    ((input * price.input + output * price.output) / 1e6) *
    (price.currency === "USD" ? price.cnyPerUsd : 1)
  );
}
export function reserveCny(
  price: BenchmarkPrice,
  prompt: string,
  params: RunParams,
): number {
  // UTF-8 bytes bound byte-based tokenizers; add protocol overhead. Reject unknown output caps.
  const output = Number(params.maxTokens);
  if (!Number.isInteger(output) || output < 1 || output > 8192)
    throw new Error("Invalid output limit");
  return costCny(
    price,
    new TextEncoder().encode(prompt + params.systemPrompt).length + 1024,
    output,
  );
}
export function reportProblems(
  attempts: BenchmarkAttempt[],
  models: BenchmarkModel[],
  now = Date.now(),
): string[] {
  const issues: string[] = [];
  if (!models.length || models.length > 6)
    issues.push("Expected 1–6 configured models");
  if (new Set(attempts.map((a) => a.id)).size !== attempts.length)
    issues.push("Duplicate evidence");
  for (const model of models) {
    const rows = attempts.filter((a) => a.model.id === model.id);
    if (model.availableUntil && Date.parse(model.availableUntil) <= now)
      issues.push(`${model.id}: expired`);
    for (const c of BENCHMARK_CASES)
      for (const window of [0, 1]) {
        const hits = rows.filter(
          (a) => a.caseId === c.id && a.window === window,
        );
        if (hits.length !== 1)
          issues.push(
            `${model.id}/${c.id}/${window}: missing or duplicate evidence`,
          );
      }
    const times = [0, 1].map((w) =>
      Math.min(
        ...rows
          .filter((a) => a.window === w)
          .map((a) => Date.parse(a.startedAt)),
      ),
    );
    if (!times.every(Number.isFinite) || times[1] - times[0] < 6 * 3600000)
      issues.push(`${model.id}: two time windows required`);
    for (const a of rows) {
      const c = BENCHMARK_CASES.find((c) => c.id === a.caseId);
      if (
        !c ||
        a.suiteVersion !== SUITE_VERSION ||
        a.region !== BENCHMARK_REGION ||
        JSON.stringify(a.params) !== JSON.stringify(BENCHMARK_PARAMS)
      )
        issues.push(`${a.id}: incompatible conditions`);
      if (
        a.model.version !== model.version ||
        a.model.provider !== model.provider
      )
        issues.push(`${a.id}: endpoint changed`);
      if (a.status === "infrastructure_error")
        issues.push(`${a.id}: measurement unavailable`);
      if (a.pass !== (a.status === "done" && !!c && checkCase(c, a.text)))
        issues.push(`${a.id}: grade mismatch`);
      if (!validPrice(a.price, Date.parse(a.startedAt)))
        issues.push(`${a.id}: missing verified price`);
      if (
        a.costCny != null &&
        (a.promptTokens == null ||
          a.outputTokens == null ||
          Math.abs(
            a.costCny - costCny(a.price, a.promptTokens, a.outputTokens),
          ) > 1e-9)
      )
        issues.push(`${a.id}: cost mismatch`);
      if (
        !Number.isFinite(a.totalMs) ||
        a.totalMs < 0 ||
        !Number.isFinite(Date.parse(a.finishedAt))
      )
        issues.push(`${a.id}: invalid timing`);
      if (
        /\bsk-[A-Za-z0-9_-]{16,}|Bearer\s+[A-Za-z0-9._-]{16,}|-----BEGIN .*PRIVATE KEY-----/.test(
          a.text,
        )
      )
        issues.push(`${a.id}: sensitive output`);
    }
  }
  if (attempts.some((a) => !models.some((m) => m.id === a.model.id)))
    issues.push("Unexpected endpoint");
  return [...new Set(issues)];
}
export function isStale(testedAt: string, now = Date.now()) {
  return now - Date.parse(testedAt) > 7 * 86400000;
}

/** Compare the candidate with a predecessor and one peer, with prices normalized to CNY. */
export function reportPairs(
  report: Pick<BenchmarkReport, "models"> & {
    attempts?: BenchmarkAttempt[];
    outputPrices?: Record<string, number>;
  },
): [string, string][] {
  const candidate = report.models.at(-1);
  if (!candidate) return [];
  const others = report.models.slice(0, -1);
  const family = (m: BenchmarkModel) =>
    m.model
      .split("/")
      .at(-1)!
      .toLowerCase()
      .replace(/[0-9].*$/, "");
  const predecessor =
    others.find((m) => family(m) === family(candidate)) ?? others[0];
  const unit = (m: BenchmarkModel) => {
    const p = report.attempts?.find((a) => a.model.id === m.id)?.price;
    return (
      report.outputPrices?.[m.id] ??
      (p ? p.output * (p.currency === "USD" ? p.cnyPerUsd : 1) : undefined)
    );
  };
  const target = unit(candidate);
  const peers = others
    .filter((m) => m.id !== predecessor?.id)
    .sort(
      (a, b) =>
        Math.abs((unit(a) ?? Infinity) - (target ?? 0)) -
        Math.abs((unit(b) ?? Infinity) - (target ?? 0)),
    );
  return [predecessor, peers[0]]
    .filter((m): m is BenchmarkModel => !!m)
    .map((m) => [candidate.slug, m.slug].sort() as [string, string]);
}
