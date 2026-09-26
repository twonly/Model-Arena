import {
  draftId,
  validateEditorial,
  type BenchmarkDraft,
} from "./benchmark-editorial.ts";
import { createHash } from "node:crypto";
import { sharedAsEndpoints, SHARED_MODELS } from "./shared-models.ts";
import { sharedKeyFor } from "./shared-server.ts";
import { findEndpointPrice } from "./pricing.ts";
import { pipeChat } from "./chat-stream.ts";
import {
  BENCHMARK_CASES,
  BENCHMARK_PARAMS,
  BENCHMARK_REGION,
  SUITE_VERSION,
  checkCase,
} from "./benchmark-suite.ts";
import {
  type BenchmarkAttempt,
  type BenchmarkModel,
  type BenchmarkPrice,
  type BenchmarkReport,
  type BenchmarkReportSummary,
  reportSummary,
  reportPairs,
  validPrice,
  reserveCny,
  costCny,
  reportProblems,
} from "./benchmark-report.ts";

export async function benchmarkDb(path: string, init: RequestInit = {}) {
  const url = process.env.SUPABASE_URL,
    key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("benchmark_database_not_configured");
  const res = await fetch(`${url.replace(/\/+$/, "")}/rest/v1/${path}`, {
    ...init,
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    if (
      ["draft_conflict", "draft_not_found", "review_required"].includes(
        detail.message,
      )
    )
      throw new Error(detail.message);
    throw new Error(`benchmark_database_${res.status}`);
  }
  const raw = await res.text();
  return raw ? JSON.parse(raw) : null;
}
async function event(kind: string, details: unknown) {
  await benchmarkDb("benchmark_events", {
    method: "POST",
    body: JSON.stringify({ kind, details }),
    headers: { Prefer: "return=minimal" },
  });
}
const hash = (v: unknown) =>
  createHash("sha256").update(JSON.stringify(v)).digest("hex").slice(0, 16);
function configuredModels(): BenchmarkModel[] {
  const configured = process.env.BENCHMARK_MODEL_IDS?.split(",").map((s) =>
    s.trim(),
  );
  return sharedAsEndpoints()
    .filter(
      (m) =>
        m.model !== "orcarouter/free" &&
        !m.baseUrl.includes("/coding/") &&
        (!configured || configured.includes(m.id)),
    )
    .slice(0, 6)
    .map((m) => ({
      id: m.id,
      slug: m.id,
      name: m.name,
      model: m.model,
      version: SHARED_MODELS.find((s) => s.id === m.id)?.version ?? m.model,
      providerKey: SHARED_MODELS.find((s) => s.id === m.id)?.provider,
      kind: m.kind,
      extraBody: m.extraBody,
      provider: m.baseUrl,
      source:
        SHARED_MODELS.find((s) => s.id === m.id)?.source ??
        `${m.baseUrl}/models`,
      availableUntil: SHARED_MODELS.find((s) => s.id === m.id)?.availableUntil,
    }));
}
function prices(): Record<string, BenchmarkPrice> {
  try {
    return JSON.parse(process.env.BENCHMARK_PRICES_JSON || "{}");
  } catch {
    return {};
  }
}
async function priceFor(
  model: BenchmarkModel,
): Promise<BenchmarkPrice | undefined> {
  const override = prices()[model.id];
  if (override) return override;
  const registry = await benchmarkDb(
    `benchmark_registry?id=eq.${model.id}&select=price`,
  );
  if (validPrice(registry[0]?.price)) return registry[0].price;
  const p = findEndpointPrice(model.model, model.provider);
  return (
    p && {
      input: p.inputMiss,
      output: p.output,
      currency: p.currency,
      source: p.sourceUrl,
      verifiedAt: p.verified,
      cnyPerUsd: 7.2,
      basis: p.rateType ?? "listed-rate",
    }
  );
}
function budget(name: string, fallback: number) {
  const n = Number(process.env[name] ?? fallback);
  if (!Number.isFinite(n) || n < 0)
    throw new Error("invalid_budget_configuration");
  return n;
}
async function campaignModels(campaign: string): Promise<BenchmarkModel[]> {
  const existing = await benchmarkDb(
    `benchmark_campaigns?id=eq.${campaign}&select=models`,
  );
  if (existing[0]) return existing[0].models;
  if (campaign.startsWith("launch-"))
    throw new Error("unknown_launch_campaign");
  const candidates = await benchmarkDb(
    "benchmark_registry?status=eq.ready&select=definition&order=last_tested_at.asc.nullsfirst,discovered_at.desc&limit=1000",
  );
  const configured = configuredModels();
  const models = [
    ...configured,
    ...candidates
      .map((r: { definition: BenchmarkModel }) => r.definition)
      .filter(
        (m: BenchmarkModel) =>
          !configured.some(
            (c) => c.model === m.model && c.provider === m.provider,
          ),
      ),
  ].slice(0, 6);
  // Campaign membership is immutable. New discoveries join the next campaign, not a half-finished report.
  await benchmarkDb("benchmark_campaigns?on_conflict=id", {
    method: "POST",
    headers: { Prefer: "resolution=ignore-duplicates,return=minimal" },
    body: JSON.stringify({ id: campaign, models }),
  });
  return (
    await benchmarkDb(`benchmark_campaigns?id=eq.${campaign}&select=models`)
  )[0].models;
}
export async function benchmarkPlan(
  campaign: string,
  window: number,
  health = false,
) {
  if (
    !/^(?:(weekly|health)-\d{4}-\d{2}-\d{2}|launch-[a-f0-9]{16})$/.test(
      campaign,
    ) ||
    ![0, 1].includes(window)
  )
    throw new Error("invalid_campaign");
  const models = await campaignModels(campaign);
  const rows = await benchmarkDb(
    `benchmark_attempts?campaign=eq.${campaign}&select=id,state,created_at,result`,
  );
  const known = new Map<
    string,
    { state: string; created_at: string; result: unknown }
  >(
    rows.map(
      (r: {
        id: string;
        state: string;
        created_at: string;
        result: unknown;
      }) => [r.id, r],
    ),
  );
  const jobs = [];
  for (const model of models) {
    const price = await priceFor(model);
    for (const c of health ? BENCHMARK_CASES.slice(0, 1) : BENCHMARK_CASES) {
      const id = `${campaign}:${model.id}:${window}:${c.id}:${hash([SUITE_VERSION, model, BENCHMARK_PARAMS])}`;
      const old = known.get(id);
      jobs.push({
        id,
        modelId: model.id,
        caseId: c.id,
        campaign,
        window,
        state: old
          ? old.state === "running" &&
            Date.now() - Date.parse(old.created_at) > 300000
            ? "interrupted"
            : old.state
          : !validPrice(price)
            ? "paused_price"
            : "pending",
      });
    }
  }
  return {
    models,
    jobs,
    budget: {
      dailyCny: budget("BENCHMARK_DAILY_CNY", 20),
      monthlyCny: budget("BENCHMARK_MONTHLY_CNY", 500),
    },
  };
}
export async function executeBenchmark(input: {
  campaign: string;
  window: number;
  modelId: string;
  caseId: string;
}) {
  const plan = await benchmarkPlan(
    input.campaign,
    input.window,
    input.campaign.startsWith("health-"),
  );
  const job = plan.jobs.find(
    (j) => j.modelId === input.modelId && j.caseId === input.caseId,
  );
  const model = plan.models.find((m) => m.id === input.modelId);
  const c = BENCHMARK_CASES.find((c) => c.id === input.caseId);
  if (!job || !model || !c) throw new Error("invalid_test");
  if (job.state !== "pending") return { state: job.state };
  const allowed = SHARED_MODELS.find(
    (e) => e.provider === model.providerKey && e.baseUrl === model.provider,
  );
  if (
    !allowed ||
    (model.availableUntil && Date.parse(model.availableUntil) <= Date.now())
  )
    return { state: "paused_identity" };
  const current = configuredModels().find((m) => m.id === model.id);
  if (
    current &&
    (current.version !== model.version || current.model !== model.model)
  )
    return { state: "paused_identity" };
  const endpoint = {
    kind: model.kind ?? ("openai" as const),
    baseUrl: model.provider,
    model: model.model,
    extraBody: model.extraBody,
  };
  const apiKey = sharedKeyFor(allowed.provider),
    price = await priceFor(model);
  if (!apiKey) return { state: "paused_credentials" };
  if (!validPrice(price)) return { state: "paused_price" };
  if (process.env.VERCEL_REGION !== BENCHMARK_REGION)
    return { state: "paused_region" };
  if (process.env.BENCHMARK_ENABLED !== "true")
    return { state: "paused_disabled" };
  // Catalog must confirm this exact endpoint/model recently; a name alone is not evidence of availability.
  const catalog = await benchmarkDb(
    `benchmark_catalog?provider=eq.${encodeURIComponent(model.provider)}&select=models,checked_at`,
  );
  if (
    !catalog[0] ||
    Date.now() - Date.parse(catalog[0].checked_at) > 86400000 ||
    !catalog[0].models.includes(model.model)
  )
    return { state: "paused_catalog" };
  if (input.window === 1) {
    const first = await benchmarkDb(
      `benchmark_attempts?campaign=eq.${input.campaign}&model_id=eq.${model.id}&window_index=eq.0&order=created_at.asc&limit=1&select=created_at`,
    );
    if (!first[0] || Date.now() - Date.parse(first[0].created_at) < 6 * 3600000)
      return { state: "paused_time_window" };
  }
  const reserved = reserveCny(price, c.prompt, BENCHMARK_PARAMS);
  const reservation = await benchmarkDb("rpc/reserve_benchmark", {
    method: "POST",
    body: JSON.stringify({
      p_id: job.id,
      p_campaign: input.campaign,
      p_model: model.id,
      p_window: input.window,
      p_case: c.id,
      p_reserved: reserved,
      p_daily: plan.budget.dailyCny,
      p_monthly: plan.budget.monthlyCny,
    }),
  });
  if (reservation.existing || reservation.state !== "running")
    return reservation;
  const startedAt = new Date().toISOString(),
    started = performance.now();
  let text = "",
    firstContentMs: number | undefined,
    lastContentMs: number | undefined,
    promptTokens: number | undefined,
    outputTokens: number | undefined;
  let status: BenchmarkAttempt["status"] = "infrastructure_error",
    error: string | undefined;
  const signal = AbortSignal.timeout(240000);
  try {
    await pipeChat(
      { ...endpoint, apiKey, prompt: c.prompt, ...BENCHMARK_PARAMS },
      (e) => {
        if (e.type === "delta" && typeof e.text === "string") {
          firstContentMs ??= Number(e.ts);
          lastContentMs = Number(e.ts);
          text += e.text;
          if (text.length > 200000) throw new Error("output_limit");
        }
        if (e.type === "usage") {
          if (
            typeof e.promptTokens === "number" &&
            Number.isFinite(e.promptTokens) &&
            e.promptTokens >= 0
          )
            promptTokens = e.promptTokens;
          if (
            typeof e.outputTokens === "number" &&
            Number.isFinite(e.outputTokens) &&
            e.outputTokens >= 0
          )
            outputTokens = e.outputTokens;
        }
        if (e.type === "done")
          status =
            e.truncated ||
            ["length", "max_tokens"].includes(String(e.finishReason))
              ? "truncated"
              : "done";
        if (e.type === "error") {
          // Do not persist upstream error bodies, which may echo credentials or request headers.
          const code = String(e.message).match(/HTTP (\d{3})/)?.[1];
          status =
            code && !["401", "403", "400", "422"].includes(code)
              ? "provider_error"
              : "infrastructure_error";
          error = code ? `upstream_http_${code}` : "upstream_stream_error";
        }
      },
      signal,
    );
    if (signal.aborted) {
      status = "infrastructure_error";
      error = "measurement_timeout";
    }
  } catch {
    status = "infrastructure_error";
    error = "measurement_interrupted";
  }
  let settledStatus = status as BenchmarkAttempt["status"];
  if (settledStatus === "done" && !text.trim()) {
    settledStatus = "provider_error";
    error = "empty_output";
  }
  const totalMs = Math.round(performance.now() - started);
  const attempt: BenchmarkAttempt = {
    id: job.id,
    campaign: input.campaign,
    model,
    window: input.window,
    caseId: c.id,
    suiteVersion: SUITE_VERSION,
    region: BENCHMARK_REGION,
    params: BENCHMARK_PARAMS,
    startedAt,
    finishedAt: new Date().toISOString(),
    status: settledStatus,
    text: text.replaceAll(apiKey, "[REDACTED]"),
    error,
    pass: settledStatus === "done" && checkCase(c, text),
    firstContentMs,
    totalMs,
    charactersPerSecond:
      firstContentMs != null &&
      lastContentMs != null &&
      lastContentMs > firstContentMs
        ? Array.from(text).length / ((lastContentMs - firstContentMs) / 1000)
        : undefined,
    promptTokens,
    outputTokens,
    reservedCny: reserved,
    price,
    costCny:
      promptTokens != null && outputTokens != null
        ? costCny(price, promptTokens, outputTokens)
        : undefined,
  };
  // Missing usage keeps its full reservation. Retriggers never issue the same paid attempt twice.
  const saved = await benchmarkDb("rpc/finish_benchmark", {
    method: "POST",
    body: JSON.stringify({
      p_id: job.id,
      p_lease: reservation.lease,
      p_result: attempt,
      p_spent: attempt.costCny ?? null,
    }),
  });
  if (!saved) throw new Error("evidence_not_saved");
  if (attempt.costCny != null && attempt.costCny > reserved)
    await event("budget_estimate_exceeded", {
      id: job.id,
      reserved,
      actual: attempt.costCny,
    });
  return {
    state: "complete",
    id: job.id,
    status: settledStatus,
    pass: attempt.pass,
  };
}
export async function discoverModels() {
  const endpoints = [
    ...new Map(sharedAsEndpoints().map((m) => [m.baseUrl, m])).values(),
  ];
  const results = [];
  for (const ep of endpoints) {
    const shared = SHARED_MODELS.find((m) => m.id === ep.id)!;
    const key = sharedKeyFor(shared.provider);
    if (!key) {
      results.push({ provider: ep.baseUrl, state: "missing_credentials" });
      continue;
    }
    try {
      const res = await fetch(`${ep.baseUrl}/models`, {
        headers: { Authorization: `Bearer ${key}` },
        signal: AbortSignal.timeout(15000),
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`catalog_http_${res.status}`);
      const body = await res.json();
      if (!Array.isArray(body.data)) throw new Error("invalid_catalog");
      const models = body.data
        .map((v: { id: unknown }) => v.id)
        .filter((id: unknown) => typeof id === "string" && id.length <= 200)
        .sort();
      const previous = await benchmarkDb(
        `benchmark_catalog?provider=eq.${encodeURIComponent(ep.baseUrl)}&select=models`,
      );
      const added = models.filter(
        (id: string) => !previous[0]?.models.includes(id),
      );
      const prior = await benchmarkDb(
        `benchmark_registry?select=id,discovered_at,status,definition`,
      );
      const known = new Map<string, { discovered_at: string; status: string }>(
        prior.map(
          (v: { id: string; discovered_at: string; status: string }) => [
            v.id,
            v,
          ],
        ),
      );
      const records = body.data
        .filter(
          (v: { id: unknown }) =>
            typeof v.id === "string" && /^[A-Za-z0-9/._:-]{1,150}$/.test(v.id),
        )
        .map(
          (v: {
            id: string;
            name?: string;
            version?: string;
            pricing?: Record<string, string>;
          }) => {
            const configured = configuredModels().find(
              (m) => m.model === v.id && m.provider === ep.baseUrl,
            );
            const id = configured?.id ?? `catalog-${hash([ep.baseUrl, v.id])}`;
            const definition: BenchmarkModel = configured ?? {
              id,
              slug: id,
              name: v.name?.slice(0, 120) || v.id,
              model: v.id,
              version: v.version || v.id,
              provider: ep.baseUrl,
              providerKey: shared.provider,
              kind: "openai",
              source: `${ep.baseUrl}/models`,
            };
            let price: BenchmarkPrice | undefined;
            const p = v.pricing;
            // This adapter only trusts OrcaRouter's documented USD/token fields or explicit zero-priced free requests.
            if (shared.provider === "orcarouter" && p) {
              const explicitFree =
                v.id.endsWith("-free") &&
                p.request != null &&
                Number(p.request) === 0 &&
                [p.prompt, p.completion].every(
                  (value) => value == null || Number(value) === 0,
                );
              if (
                explicitFree ||
                (p.prompt != null &&
                  p.completion != null &&
                  (p.request == null || Number(p.request) === 0))
              ) {
                price = {
                  input: explicitFree ? 0 : Number(p.prompt) * 1e6,
                  output: explicitFree ? 0 : Number(p.completion) * 1e6,
                  currency: "USD",
                  cnyPerUsd: 7.2,
                  source: `${ep.baseUrl}/models`,
                  verifiedAt: new Date().toISOString(),
                  basis: "listed-rate",
                };
                if (!validPrice(price)) price = undefined;
              }
            }
            const fixed =
              /\d/.test(v.id) &&
              !/(latest|auto|preview|orcarouter\/free)/i.test(v.id);
            return {
              id,
              definition,
              price: price ?? null,
              status:
                fixed &&
                price &&
                (!!configured ||
                  known.get(id)?.status === "ready" ||
                  (previous.length > 0 && !known.has(id)))
                  ? "ready"
                  : "needs_review",
              discovered_at:
                known.get(id)?.discovered_at ?? new Date().toISOString(),
              checked_at: new Date().toISOString(),
            };
          },
        );
      if (records.length)
        await benchmarkDb("benchmark_registry?on_conflict=id", {
          method: "POST",
          headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
          body: JSON.stringify(records),
        });
      for (const old of prior) {
        if (
          old.definition?.provider === ep.baseUrl &&
          !models.includes(old.definition.model)
        ) {
          await benchmarkDb(`benchmark_registry?id=eq.${old.id}`, {
            method: "PATCH",
            body: JSON.stringify({
              status: "retired",
              checked_at: new Date().toISOString(),
            }),
          });
        }
      }

      await benchmarkDb("benchmark_catalog?on_conflict=provider", {
        method: "POST",
        headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify({
          provider: ep.baseUrl,
          models,
          checked_at: new Date().toISOString(),
        }),
      });
      results.push({ provider: ep.baseUrl, state: "ok", added });
    } catch (e) {
      results.push({
        provider: ep.baseUrl,
        state: e instanceof Error ? e.message : "catalog_failed",
      });
    }
  }
  await event("discovery", results);
  return results;
}
export async function launchCampaigns() {
  const rows = await benchmarkDb(
    "benchmark_registry?status=eq.ready&last_tested_at=is.null&select=definition&order=discovered_at.desc&limit=100",
  );
  const configured = configuredModels();
  // ponytail: at most three new candidates per discovery pass; a queue worker if launch volume grows.
  const candidates = rows
    .map((r: { definition: BenchmarkModel }) => r.definition)
    .filter(
      (m: BenchmarkModel) =>
        !configured.some(
          (c) => c.model === m.model && c.provider === m.provider,
        ),
    )
    .slice(0, 3);
  for (const model of candidates) {
    if (!validPrice(await priceFor(model))) continue;
    const models = [
      ...configured.filter((m) => m.model !== model.model).slice(0, 2),
      model,
    ];
    const id = `launch-${hash([model.id, model.version, SUITE_VERSION])}`;
    await benchmarkDb("benchmark_campaigns?on_conflict=id", {
      method: "POST",
      headers: { Prefer: "resolution=ignore-duplicates,return=minimal" },
      body: JSON.stringify({ id, models }),
    });
  }
  const pending = await benchmarkDb(
    "benchmark_campaigns?id=like.launch-*&drafted_at=is.null&select=id&order=created_at.asc&limit=3",
  );
  return pending.map((row: { id: string }) => row.id) as string[];
}

export async function prepareReport(campaign: string, firstLook = false) {
  if (!/^(weekly-\d{4}-\d{2}-\d{2}|launch-[a-f0-9]{16})$/.test(campaign))
    throw new Error("invalid_campaign");
  const models = await campaignModels(campaign);
  const rows = await benchmarkDb(
    `benchmark_attempts?campaign=eq.${campaign}&state=eq.complete${firstLook ? "&window_index=eq.0" : ""}&select=result&order=id.asc`,
  );
  const attempts: BenchmarkAttempt[] = rows.map(
    (r: { result: BenchmarkAttempt }) => r.result,
  );
  const problems = reportProblems(
    attempts,
    models,
    Date.now(),
    firstLook ? [0] : [0, 1],
  );
  if (problems.length) return { state: "paused", problems };
  const version = hash(attempts),
    id = `${campaign}-${version}`;
  const old = await benchmarkDb(`benchmark_drafts?id=eq.${id}&select=id`);
  const report: BenchmarkReport = {
    cases: BENCHMARK_CASES,
    id,
    campaign,
    version,
    stage: firstLook ? "first-look" : "standard",
    publishedAt: "",
    testedAt: attempts
      .map((a) => a.finishedAt)
      .sort()
      .at(-1)!,
    suiteVersion: SUITE_VERSION,
    region: BENCHMARK_REGION,
    models,
    attempts,
  };
  if (!old.length) {
    await benchmarkDb("benchmark_drafts?on_conflict=id", {
      method: "POST",
      headers: { Prefer: "resolution=ignore-duplicates,return=minimal" },
      body: JSON.stringify({
        id,
        campaign,
        snapshot: report,
        summary: reportSummary(report),
      }),
    });
    await event("draft_prepared", { id, stage: report.stage });
  }
  if (!firstLook) {
    await benchmarkDb(`benchmark_campaigns?id=eq.${campaign}`, {
      method: "PATCH",
      body: JSON.stringify({ drafted_at: new Date().toISOString() }),
    });
    for (const model of models)
      await benchmarkDb(`benchmark_registry?id=eq.${model.id}`, {
        method: "PATCH",
        body: JSON.stringify({ last_tested_at: report.testedAt }),
      });
  }
  return { state: "draft", id, unchanged: !!old.length };
}

export async function editorialDraft(
  id: string,
): Promise<BenchmarkDraft | null> {
  return (
    (await benchmarkDb(`benchmark_drafts?id=eq.${draftId(id)}&select=*`))[0] ??
    null
  );
}
export async function editorialQueue(): Promise<BenchmarkDraft[]> {
  return benchmarkDb(
    "benchmark_drafts?select=id,campaign,summary,editorial,writer,revision,updated_at,published_revision,published_report_id&order=updated_at.desc&limit=50",
  );
}
export async function saveEditorial(
  id: string,
  revision: number,
  content: unknown,
  writer: "codex" | "operator",
) {
  if (!Number.isSafeInteger(revision) || revision < 1)
    throw new Error("invalid_revision");
  const editorial = validateEditorial(content);
  const rows = await benchmarkDb(
    `benchmark_drafts?id=eq.${draftId(id)}&revision=eq.${revision}${writer === "codex" ? "&editorial=is.null" : ""}`,
    {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        editorial,
        writer,
        revision: revision + 1,
        updated_at: new Date().toISOString(),
      }),
    },
  );
  if (!rows.length) throw new Error("draft_conflict");
  return rows[0] as BenchmarkDraft;
}
export async function publishDraft(
  id: string,
  revision: number,
  reviewer: string,
) {
  const draft = await editorialDraft(id);
  if (!draft?.snapshot) throw new Error("draft_not_found");
  if (!Number.isSafeInteger(revision) || draft.revision !== revision)
    throw new Error("draft_conflict");
  validateEditorial(draft.editorial);
  const report = draft.snapshot;
  const problems = reportProblems(
    report.attempts,
    report.models,
    Date.now(),
    report.stage === "first-look" ? [0] : [0, 1],
  );
  if (Date.now() - Date.parse(report.testedAt) > 7 * 86400000)
    problems.push("evidence_stale");
  if (problems.length) return { state: "paused", problems };
  if (draft.published_revision === revision)
    return {
      state: "published",
      id: draft.published_report_id!,
      unchanged: true,
      urls: [] as string[],
    };
  const catalogs = await benchmarkDb(
    "benchmark_catalog?select=provider,models,checked_at",
  );
  if (
    report.models.some(
      (m) =>
        !catalogs.some(
          (c: { provider: string; models: string[]; checked_at: string }) =>
            c.provider === m.provider &&
            c.models.includes(m.model) &&
            Date.now() - Date.parse(c.checked_at) <= 86400000,
        ),
    )
  )
    return { state: "paused", problems: ["current_availability_unverified"] };
  const result = await benchmarkDb("rpc/publish_benchmark_draft", {
    method: "POST",
    body: JSON.stringify({
      p_id: id,
      p_revision: revision,
      p_reviewer: reviewer,
    }),
  });
  return {
    ...result,
    urls: ["zh-CN", "en"].flatMap((locale) => [
      `/${locale}/reports`,
      `/${locale}/models`,
      `/${locale}/reports/${result.id}`,
      ...report.models.map((m) => `/${locale}/model/${m.slug}`),
      ...reportPairs(report).map(
        (pair) => `/${locale}/compare/${pair.join("-vs-")}`,
      ),
    ]),
  };
}

export async function publishedReports(
  limit = 30,
  modelSlugs: string[] = [],
): Promise<BenchmarkReportSummary[]> {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY)
    return [];
  const rows = await benchmarkDb(
    `benchmark_reports?is_current=eq.true&select=index_data&order=published_at.desc&limit=${Math.max(1, Math.min(1000, limit))}${modelSlugs.length ? `&index_data->models=cs.${encodeURIComponent(JSON.stringify(modelSlugs.map((slug) => ({ slug }))))}` : ""}`,
  );
  return rows.map((r: { index_data: BenchmarkReportSummary }) => r.index_data);
}
export async function publishedReport(
  id: string,
): Promise<BenchmarkReport | null> {
  if (!/^[a-z0-9-]{1,100}$/.test(id)) return null;
  const rows = await benchmarkDb(
    `benchmark_reports?id=eq.${id}&select=snapshot`,
  );
  return rows[0]?.snapshot ?? null;
}
export async function benchmarkStatus() {
  const [attempts, events, heartbeat] = await Promise.all([
    benchmarkDb(
      "benchmark_attempts?select=id,campaign,state,reserved_cny,spent_cny,created_at,finished_at,status:result->>status,error:result->>error&order=created_at.desc&limit=1000",
    ),
    benchmarkDb(
      "benchmark_events?select=kind,details,created_at&order=created_at.desc&limit=30",
    ),
    benchmarkDb(
      "benchmark_events?kind=eq.discovery&select=created_at&order=created_at.desc&limit=1",
    ),
  ]);
  return {
    enabled: process.env.BENCHMARK_ENABLED === "true",
    models: configuredModels(),
    budget: {
      daily: budget("BENCHMARK_DAILY_CNY", 20),
      monthly: budget("BENCHMARK_MONTHLY_CNY", 500),
    },
    attempts,
    events,
    schedulerStale:
      !heartbeat[0] ||
      Date.now() - Date.parse(heartbeat[0].created_at) > 8 * 3600000,
    lastSuccessfulAt:
      attempts.find(
        (a: { status: string; finished_at: string | null }) =>
          a.status === "done",
      )?.finished_at ?? null,
    lastCompletedAt:
      attempts.find((a: { finished_at: string | null }) => a.finished_at)
        ?.finished_at ?? null,
  };
}
