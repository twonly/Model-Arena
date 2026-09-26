import assert from "node:assert/strict";
import test from "node:test";
import {
  discoverModels,
  benchmarkPlan,
  executeBenchmark,
  publishReport,
  publishedReport,
  benchmarkStatus,
} from "../lib/benchmark-server.ts";
import { BENCHMARK_CASES } from "../lib/benchmark-suite.ts";

test("discovery → versioned attempts → gated bilingual report is resumable and never repeats paid work", async () => {
  const oldFetch = global.fetch,
    OriginalDate = Date,
    priorEnv = { ...process.env };
  let clock = OriginalDate.now(),
    calls = 0;
  global.Date = class extends OriginalDate {
    constructor(...args) {
      super(...(args.length ? args : [clock]));
    }
    static now() {
      return clock;
    }
  };
  const tables = Object.fromEntries(
    [
      "benchmark_attempts",
      "benchmark_catalog",
      "benchmark_registry",
      "benchmark_campaigns",
      "benchmark_reports",
      "benchmark_events",
    ].map((t) => [t, []]),
  );
  let catalog = [{ id: "tencent/hy3-free", pricing: { request: "0" } }];
  Object.assign(process.env, {
    SUPABASE_URL: "https://database.test",
    SUPABASE_SERVICE_ROLE_KEY: "database-test-key",
    SHARED_KEY_ORCAROUTER: "a-private-test-key-123456",
    BENCHMARK_MODEL_IDS: "orcarouter-hy3-free",
    BENCHMARK_ENABLED: "true",
    VERCEL_REGION: "hkg1",
  });
  delete process.env.VERCEL;
  delete process.env.SHARED_KEY_DEEPSEEK;
  delete process.env.SHARED_KEY_ZHIPU;
  delete process.env.BENCHMARK_PRICES_JSON;
  global.fetch = async (input, init = {}) => {
    const url = new URL(input),
      body = init.body ? JSON.parse(init.body) : null;
    if (url.host === "api.orcarouter.ai" && url.pathname.endsWith("/models"))
      return Response.json({ data: catalog });
    if (
      url.host === "api.orcarouter.ai" &&
      url.pathname.endsWith("/chat/completions")
    ) {
      calls++;
      const c = BENCHMARK_CASES.find(
        (c) => c.prompt === body.messages.at(-1).content,
      );
      assert.ok(c);
      const answer =
        typeof c.expected === "string"
          ? c.expected
          : JSON.stringify(c.expected);
      return new Response(
        "data: " +
          JSON.stringify({
            choices: [{ delta: { content: answer }, finish_reason: "stop" }],
            usage: { prompt_tokens: 100, completion_tokens: 100 },
          }) +
          "\n\ndata: [DONE]\n",
      );
    }
    assert.equal(
      url.host,
      "database.test",
      "all model network traffic is intercepted",
    );
    const table = url.pathname.replace("/rest/v1/", "");
    if (table === "rpc/reserve_benchmark") {
      const existing = tables.benchmark_attempts.find(
        (r) => r.id === body.p_id,
      );
      if (existing)
        return Response.json({
          state: existing.state,
          existing: true,
          result: existing.result,
        });
      const row = {
        id: body.p_id,
        campaign: body.p_campaign,
        model_id: body.p_model,
        window_index: body.p_window,
        case_id: body.p_case,
        state: "running",
        created_at: new Date().toISOString(),
        lease: crypto.randomUUID(),
      };
      tables.benchmark_attempts.push(row);
      return Response.json({
        state: "running",
        existing: false,
        lease: row.lease,
      });
    }
    if (table === "rpc/finish_benchmark") {
      const r = tables.benchmark_attempts.find(
        (r) =>
          r.id === body.p_id &&
          r.lease === body.p_lease &&
          r.state === "running",
      );
      if (r)
        Object.assign(r, {
          state: "complete",
          result: body.p_result,
          spent_cny: body.p_spent,
          finished_at: new Date().toISOString(),
        });
      return Response.json(!!r);
    }
    assert.ok(tables[table], table);
    if (init.method === "PATCH") {
      for (const r of tables[table])
        if (r.id === url.searchParams.get("id").slice(3))
          Object.assign(r, body);
      return new Response(null, { status: 204 });
    }
    if (init.method === "POST") {
      for (const row of Array.isArray(body) ? body : [body]) {
        const key = table === "benchmark_catalog" ? "provider" : "id";
        const old = row[key] && tables[table].find((r) => r[key] === row[key]);
        if (!old)
          tables[table].push({ created_at: new Date().toISOString(), ...row });
        else if (!String(init.headers.Prefer).includes("ignore-duplicates"))
          Object.assign(old, row);
      }
      return new Response(null, { status: 201 }); // PostgREST return=minimal has no JSON body.
    }
    let result = [...tables[table]];
    for (const [key, value] of url.searchParams)
      if (value.startsWith("eq."))
        result = result.filter((r) => String(r[key]) === value.slice(3));
    if (url.searchParams.has("order")) {
      const [key, direction] = url.searchParams.get("order").split(".");
      result.sort(
        (a, b) =>
          String(a[key]).localeCompare(String(b[key])) *
          (direction === "desc" ? -1 : 1),
      );
    }
    if (url.searchParams.has("limit"))
      result = result.slice(0, Number(url.searchParams.get("limit")));
    return Response.json(result);
  };
  try {
    await discoverModels();
    assert.equal((await benchmarkStatus()).schedulerStale, false);
    clock += 9 * 3600000;
    assert.equal((await benchmarkStatus()).schedulerStale, true);
    clock -= 9 * 3600000;
    const campaign = "weekly-2026-09-21";
    let plan = await benchmarkPlan(campaign, 0);
    assert.equal(plan.models.length, 1);
    assert.equal(plan.jobs.length, 15);
    assert.equal((await publishReport(campaign)).state, "paused");
    assert.equal(
      (await executeBenchmark({ ...plan.jobs[0], window: 1 })).state,
      "paused_time_window",
    );
    for (const job of plan.jobs)
      assert.equal((await executeBenchmark(job)).state, "complete");
    assert.equal(calls, 15);
    await executeBenchmark(plan.jobs[0]);
    assert.equal(calls, 15);
    assert.equal((await publishReport(campaign)).state, "paused");
    clock += 12 * 3600000;
    plan = await benchmarkPlan(campaign, 1);
    for (const job of plan.jobs) await executeBenchmark(job);
    const savedCatalog = tables.benchmark_catalog[0].models;
    tables.benchmark_catalog[0].models = [];
    assert.equal(
      (await publishReport(campaign)).state,
      "paused",
      "delisted models cannot become newly published recommendations",
    );
    tables.benchmark_catalog[0].models = savedCatalog;
    const published = await publishReport(campaign);
    assert.equal(published.state, "published");
    assert.ok(published.urls.includes(`/en/reports/${published.id}`));
    const report = await publishedReport(published.id);
    assert.equal(report.attempts.length, 30);
    assert.equal(report.cases[0].prompt, BENCHMARK_CASES[0].prompt);
    assert.equal(
      report.attempts.every((a) => a.pass),
      true,
    );
    assert.ok(
      !JSON.stringify(report).includes(process.env.SHARED_KEY_ORCAROUTER),
    );
    assert.equal((await publishReport(campaign)).unchanged, true);
    assert.equal(calls, 30);
    assert.equal(tables.benchmark_reports.length, 1);
    catalog.push({ id: "tencent/hy4-free", pricing: { request: "0" } });
    await discoverModels();
    assert.equal(
      (await benchmarkPlan(campaign, 0)).models.length,
      1,
      "a discovery must not alter the frozen report campaign",
    );
    const next = await benchmarkPlan("weekly-2026-09-28", 0);
    assert.equal(
      next.models.length,
      2,
      "eligible new models join a bounded next campaign",
    );
    catalog = catalog.filter((m) => m.id !== "tencent/hy4-free");
    await discoverModels();
    assert.equal(
      tables.benchmark_registry.find(
        (r) => r.definition.model === "tencent/hy4-free",
      ).status,
      "retired",
    );
    catalog[0].pricing = { request: "0", prompt: "0.001", completion: "0.002" };
    await discoverModels();
    assert.equal(
      tables.benchmark_registry.find(
        (r) => r.definition.model === "tencent/hy3-free",
      ).price.input,
      1000,
      "zero request fee does not erase explicit token prices",
    );
    delete process.env.SHARED_KEY_ORCAROUTER;
    assert.equal(
      (await executeBenchmark(next.jobs[0])).state,
      "paused_credentials",
    );
    assert.equal(calls, 30);
  } finally {
    global.fetch = oldFetch;
    global.Date = OriginalDate;
    for (const k of Object.keys(process.env))
      if (!(k in priorEnv)) delete process.env[k];
    Object.assign(process.env, priorEnv);
  }
});
