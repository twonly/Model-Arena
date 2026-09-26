import assert from "node:assert/strict";
import test from "node:test";
import {
  discoverModels,
  benchmarkPlan,
  executeBenchmark,
  prepareReport,
  editorialDraft,
  saveEditorial,
  publishDraft,
  launchCampaigns,
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
      "benchmark_drafts",
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
          result: {
            ...body.p_result,
            params: Object.fromEntries(
              Object.entries(body.p_result.params).reverse(),
            ),
          }, // PostgreSQL JSONB reorders object keys.
          spent_cny: body.p_spent,
          finished_at: new Date().toISOString(),
        });
      return Response.json(!!r);
    }
    if (table === "rpc/publish_benchmark_draft") {
      const d = tables.benchmark_drafts.find((d) => d.id === body.p_id);
      assert.equal(d.revision, body.p_revision);
      const id = `${d.id}-r${d.revision}`,
        stamp = new Date().toISOString();
      const snapshot = {
        ...d.snapshot,
        id,
        editorial: d.editorial,
        reviewedAt: stamp,
        publishedAt: stamp,
      };
      tables.benchmark_reports.push({
        id,
        snapshot,
        index_data: { ...d.summary, id, editorial: d.editorial },
        is_current: true,
      });
      d.published_revision = d.revision;
      d.published_report_id = id;
      return Response.json({ state: "published", id });
    }
    assert.ok(tables[table], table);
    if (init.method === "PATCH") {
      const matched = tables[table].filter((r) =>
        [...url.searchParams].every(([k, v]) =>
          v.startsWith("eq.")
            ? String(r[k]) === v.slice(3)
            : v === "is.null"
              ? r[k] == null
              : true,
        ),
      );
      for (const r of matched) Object.assign(r, body);
      return init.headers?.Prefer === "return=representation"
        ? Response.json(matched)
        : new Response(null, { status: 204 });
    }
    if (init.method === "POST") {
      for (const row of Array.isArray(body) ? body : [body]) {
        const key = table === "benchmark_catalog" ? "provider" : "id";
        const old = row[key] && tables[table].find((r) => r[key] === row[key]);
        if (!old)
          tables[table].push({
            created_at: new Date().toISOString(),
            revision: 1,
            editorial: null,
            published_revision: 0,
            ...row,
          });
        else if (!String(init.headers.Prefer).includes("ignore-duplicates"))
          Object.assign(old, row);
      }
      return new Response(null, { status: 201 }); // PostgREST return=minimal has no JSON body.
    }
    let result = [...tables[table]];
    for (const [key, value] of url.searchParams)
      if (value.startsWith("eq."))
        result = result.filter((r) => String(r[key]) === value.slice(3));
      else if (value === "is.null")
        result = result.filter((r) => r[key] == null);
      else if (value.startsWith("like."))
        result = result.filter((r) =>
          String(r[key]).startsWith(value.slice(5, -1)),
        );
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
    assert.equal((await prepareReport(campaign)).state, "paused");
    assert.equal(
      (await executeBenchmark({ ...plan.jobs[0], window: 1 })).state,
      "paused_time_window",
    );
    for (const job of plan.jobs)
      assert.equal((await executeBenchmark(job)).state, "complete");
    assert.equal(calls, 15);
    await executeBenchmark(plan.jobs[0]);
    assert.equal(calls, 15);
    assert.equal((await prepareReport(campaign)).state, "paused");
    clock += 12 * 3600000;
    plan = await benchmarkPlan(campaign, 1);
    for (const job of plan.jobs) await executeBenchmark(job);
    const prepared = await prepareReport(campaign);
    assert.equal(prepared.state, "draft");
    assert.equal(
      await publishedReport(prepared.id),
      null,
      "draft evidence is never public",
    );
    assert.equal(tables.benchmark_reports.length, 0);
    const draft = await editorialDraft(prepared.id);
    const content = {
      "zh-CN": {
        title: "首测",
        summary: "实测摘要",
        body: "基于原始记录的分析。",
      },
      en: {
        title: "Review",
        summary: "Measured outcomes",
        body: "Analysis of the original evidence.",
      },
    };
    const edited = await saveEditorial(draft.id, 1, content, "codex");
    await assert.rejects(
      saveEditorial(draft.id, 1, content, "operator"),
      /draft_conflict/,
    );
    await assert.rejects(
      saveEditorial(draft.id, 2, content, "codex"),
      /draft_conflict/,
      "automation cannot overwrite editorial work",
    );
    await assert.rejects(
      publishDraft(draft.id, 1, "00000000-0000-0000-0000-000000000001"),
      /draft_conflict/,
    );
    const savedCatalog = tables.benchmark_catalog[0].models;
    tables.benchmark_catalog[0].models = [];
    assert.equal(
      (
        await publishDraft(
          draft.id,
          edited.revision,
          "00000000-0000-0000-0000-000000000001",
        )
      ).state,
      "paused",
    );
    tables.benchmark_catalog[0].models = savedCatalog;
    const published = await publishDraft(
      draft.id,
      edited.revision,
      "00000000-0000-0000-0000-000000000001",
    );
    assert.equal(published.state, "published");
    assert.ok(published.urls.includes(`/en/reports/${published.id}`));
    const report = await publishedReport(published.id);
    assert.equal(report.attempts.length, 30);
    assert.equal(report.editorial.en.title, "Review");
    assert.equal(
      report.attempts.every((a) => a.pass),
      true,
    );
    assert.ok(
      !JSON.stringify(report).includes(process.env.SHARED_KEY_ORCAROUTER),
    );
    assert.equal((await prepareReport(campaign)).unchanged, true);
    assert.equal(
      (
        await publishDraft(
          draft.id,
          edited.revision,
          "00000000-0000-0000-0000-000000000001",
        )
      ).unchanged,
      true,
    );
    assert.equal(calls, 30);
    assert.equal(tables.benchmark_reports.length, 1);
    catalog.push({ id: "tencent/hy4-free", pricing: { request: "0" } });
    await discoverModels();
    assert.equal(
      (await benchmarkPlan(campaign, 0)).models.length,
      1,
      "a discovery must not alter the frozen report campaign",
    );
    const launches = await launchCampaigns();
    assert.equal(launches.length, 1);
    const launch = await benchmarkPlan(launches[0], 0);
    assert.equal(launch.models.at(-1).model, "tencent/hy4-free");
    for (const job of launch.jobs) await executeBenchmark(job);
    const firstLook = await prepareReport(launches[0], true);
    assert.equal(firstLook.state, "draft");
    assert.equal(
      (await editorialDraft(firstLook.id)).snapshot.stage,
      "first-look",
    );
    assert.equal((await prepareReport(launches[0])).state, "paused");
    assert.equal(await publishedReport(firstLook.id), null);
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
    assert.equal(calls, 60);
  } finally {
    global.fetch = oldFetch;
    global.Date = OriginalDate;
    for (const k of Object.keys(process.env))
      if (!(k in priorEnv)) delete process.env[k];
    Object.assign(process.env, priorEnv);
  }
});
