import test from "node:test";
import assert from "node:assert/strict";

test("scheduler catches up after Monday, waits for the second window and indexes only new reports", async () => {
  const oldFetch = global.fetch,
    OriginalDate = Date,
    env = { ...process.env },
    log = console.log;
  let phase = 0,
    indexCalls = 0,
    publicationCalls = 0;
  const completed = new Set(),
    runs = [],
    plans = [];
  Object.assign(process.env, {
    TOKRACE_URL: "https://scheduler.test",
    BENCHMARK_SECRET: "test-secret-32-characters-long-enough",
    BENCHMARK_MODE: "",
    INDEXNOW_KEY: "public-test-key",
  });
  global.Date = class extends OriginalDate {
    constructor(...args) {
      super(...(args.length ? args : ["2026-09-26T00:17:00Z"]));
    }
  }; // Saturday
  console.log = () => {};
  global.fetch = async (url, options) => {
    const body = JSON.parse(options.body);
    if (String(url) === "https://api.indexnow.org/indexnow") {
      indexCalls++;
      assert.equal(body.urlList.length, 2);
      return new Response(null, { status: 202 });
    }
    assert.equal(String(url), "https://scheduler.test/api/benchmarks");
    assert.equal(
      options.headers.Authorization,
      `Bearer ${process.env.BENCHMARK_SECRET}`,
    );
    if (body.action === "discover") return Response.json([{ state: "ok" }]);
    if (body.action === "plan") {
      plans.push(body);
      const id = `${body.campaign}:${body.window}`;
      return Response.json({
        jobs: [
          {
            id,
            campaign: body.campaign,
            window: body.window,
            state: completed.has(id) ? "complete" : "pending",
          },
        ],
      });
    }
    if (body.action === "run") {
      if (body.window === 1 && phase === 0)
        return Response.json({ state: "paused_time_window" });
      assert.ok(!completed.has(body.id));
      completed.add(body.id);
      runs.push(body.id);
      return Response.json({ state: "complete", status: "done" });
    }
    if (body.action === "publish") {
      publicationCalls++;
      return Response.json({
        state: "published",
        ...(phase === 1
          ? { urls: ["/zh-CN/reports/test", "/en/reports/test"] }
          : { unchanged: true }),
      });
    }
    throw new Error("Unexpected action");
  };
  try {
    for (phase = 0; phase < 3; phase++)
      await import(`../automation/benchmarks.mjs?verify=${phase}`);
    assert.ok(
      plans.some((p) => p.campaign === "weekly-2026-09-21" && p.window === 0),
    );
    assert.ok(plans.some((p) => p.campaign === "health-2026-09-26"));
    assert.equal(runs.length, 3);
    assert.equal(publicationCalls, 2);
    assert.equal(indexCalls, 1);
  } finally {
    global.fetch = oldFetch;
    global.Date = OriginalDate;
    console.log = log;
    for (const k of Object.keys(process.env))
      if (!(k in env)) delete process.env[k];
    Object.assign(process.env, env);
  }
});
