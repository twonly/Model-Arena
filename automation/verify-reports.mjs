// Production Next build + a local read-only PostgREST fixture. No model API calls or database writes.
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import {
  BENCHMARK_CASES,
  BENCHMARK_PARAMS,
  SUITE_VERSION,
} from "../lib/benchmark-suite.ts";
import { BRAND } from "../lib/brand.ts";
import { reportSummary } from "../lib/benchmark-report.ts";
const models = [
  {
    id: "deepseek-flash",
    slug: "deepseek-flash",
    model: "deepseek-flash",
    name: "Local fixture A",
    version: "fixture-v1",
    provider: "https://api.deepseek.com/v1",
  },
  {
    id: "orcarouter-hy3-free",
    slug: "orcarouter-hy3-free",
    model: "tencent/hy3-free",
    name: "Local fixture B",
    version: "fixture-v2",
    provider: "https://api.orcarouter.ai/v1",
  },
];
const day = new Date().toISOString().slice(0, 10);
const report = {
  id: "weekly-2026-09-21-local-fixture",
  campaign: "weekly-2026-09-21",
  version: "local-fixture",
  publishedAt: `${day}T13:00:00Z`,
  testedAt: `${day}T12:00:01Z`,
  suiteVersion: SUITE_VERSION,
  region: "hkg1",
  models,
  cases: BENCHMARK_CASES,
  attempts: models.flatMap((model) =>
    [0, 1].flatMap((window) =>
      BENCHMARK_CASES.map((c) => ({
        id: `${model.id}-${window}-${c.id}`,
        campaign: "weekly-2026-09-21",
        model,
        window,
        caseId: c.id,
        suiteVersion: SUITE_VERSION,
        region: "hkg1",
        params: BENCHMARK_PARAMS,
        startedAt: `${day}T${window ? "12" : "00"}:00:00Z`,
        finishedAt: `${day}T${window ? "12" : "00"}:00:01Z`,
        status: "done",
        text:
          typeof c.expected === "string"
            ? c.expected
            : JSON.stringify(c.expected),
        pass: true,
        firstContentMs: 300,
        totalMs: 1000,
        charactersPerSecond: 40,
        promptTokens: 100,
        outputTokens: 100,
        costCny: 0,
        reservedCny: 0,
        price: {
          input: 0,
          output: 0,
          currency: "CNY",
          source: "https://example.test/local-fixture",
          verifiedAt: day,
          cnyPerUsd: 7.2,
        },
      })),
    ),
  ),
};
const storage = createServer((req, res) => {
  assert.equal(req.method, "GET", "production pages must remain read only");
  const url = new URL(req.url, "http://127.0.0.1");
  res.setHeader("Content-Type", "application/json");
  if (url.pathname === "/rest/v1/benchmark_reports") {
    const match = url.searchParams.get("id");
    res.end(
      JSON.stringify(
        match && match !== `eq.${report.id}`
          ? []
          : [
              {
                id: report.id,
                index_data: reportSummary(report),
                snapshot: report,
              },
            ],
      ),
    );
  } else res.end("[]");
});
await new Promise((resolve) => storage.listen(0, "127.0.0.1", resolve));
const port = Number(process.env.REPORT_TEST_PORT || 3102),
  base = `http://127.0.0.1:${port}`;
const next = spawn(
  process.execPath,
  [
    "node_modules/next/dist/bin/next",
    "start",
    "--hostname",
    "127.0.0.1",
    "--port",
    String(port),
  ],
  {
    env: {
      ...process.env,
      SUPABASE_URL: `http://127.0.0.1:${storage.address().port}`,
      SUPABASE_SERVICE_ROLE_KEY: "local-fixture-service",
      BENCHMARK_ENABLED: "false",
    },
    stdio: ["ignore", "pipe", "pipe"],
  },
);
let logs = "";
next.stdout.on("data", (d) => (logs += d));
next.stderr.on("data", (d) => (logs += d));
let browser;
try {
  for (let i = 0; i < 80; i++) {
    if (next.exitCode !== null) throw new Error(logs);
    try {
      if ((await fetch(`${base}/api/reports/${report.id}`)).ok) break;
    } catch {}
    await new Promise((r) => setTimeout(r, 250));
  }
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } }),
    errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.route("**/api/chat", (r) => r.abort()); // a report visit/rerun setup must never make model calls
  await page.route("**/api/chat/session", (r) =>
    r.fulfill({
      json: {
        ok: true,
        defaultTransport: "vercel",
        transport: "vercel",
        cloudflareRules: [],
      },
    }),
  );
  await page.route("**/api/shared/quota?*", (r) =>
    r.fulfill({
      json: { ok: true, remaining: 100, limit: 100, available: true },
    }),
  );
  await mkdir(new URL("../output/playwright/", import.meta.url), {
    recursive: true,
  });
  for (const locale of ["zh-CN", "en"]) {
    const response = await page.goto(`${base}/${locale}/reports/${report.id}`);
    assert.equal(response.status(), 200);
    assert.match(await page.locator("main").innerText(), /60/);
    assert.equal(
      await page.locator('link[rel="canonical"]').getAttribute("href"),
      `${BRAND.url}/${locale}/reports/${report.id}`,
    );
    assert.equal(await page.locator('link[hreflang="en"]').count(), 1);
    const datasets = await page
      .locator('script[type="application/ld+json"]')
      .evaluateAll((nodes) => nodes.map((n) => JSON.parse(n.textContent)));
    assert.ok(
      datasets.some(
        (d) =>
          d["@type"] === "Dataset" &&
          d.distribution.contentUrl.endsWith(report.id),
      ),
    );
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    await page.screenshot({
      path: `output/playwright/report-${locale}.png`,
      fullPage: true,
    });
  }
  const og = await page
    .locator('meta[property="og:image"]')
    .getAttribute("content");
  assert.ok(og.includes("/reports/"), "each report must use its own OG image");
  const ogResponse = await page.request.get(
    `${base}${new URL(og, base).pathname}`,
  );
  assert.equal(ogResponse.status(), 200);
  assert.match(ogResponse.headers()["content-type"], /image\/png/);
  const evidence = await page.request.get(`${base}/api/reports/${report.id}`);
  assert.equal((await evidence.json()).attempts.length, 60);
  assert.match(evidence.headers()["cache-control"], /immutable/);
  assert.equal(
    (await page.request.get(`${base}/api/badge/report/${report.id}`)).status(),
    200,
  );
  assert.equal(
    (await page.request.get(`${base}/api/reports/missing`)).status(),
    404,
  );
  for (const path of [
    "/zh-CN/reports",
    "/zh-CN/models",
    "/zh-CN/model/deepseek-flash",
    "/zh-CN/compare/deepseek-flash-vs-orcarouter-hy3-free",
  ])
    assert.equal((await page.goto(base + path)).status(), 200, path);
  const sitemap = await (await page.request.get(`${base}/sitemap.xml`)).text();
  assert.ok(sitemap.includes(`/reports/${report.id}`));
  assert.ok(sitemap.includes("/compare/deepseek-flash-vs-orcarouter-hy3-free"));
  await page.goto(`${base}/zh-CN/model/glm-5-3`);
  assert.match(
    await page.locator('meta[name="robots"]').getAttribute("content"),
    /noindex/,
  );
  await page.goto(`${base}/zh-CN/reports/${report.id}`);
  await page
    .locator("summary")
    .filter({ hasText: "联系信息抽取 1 · extract-1" })
    .click();
  await page
    .getByRole("button", { name: "复测这个任务 →", exact: true })
    .first()
    .click();
  await page.waitForURL("**/zh-CN/arena");
  await page.waitForFunction(
    () =>
      document.querySelectorAll('[aria-label="已选模型"] input:checked')
        .length === 2,
  );
  assert.equal(
    await page.getByLabel("你的任务").inputValue(),
    BENCHMARK_CASES[0].prompt,
  );
  assert.equal(
    await page.getByRole("alert").filter({ hasText: "未自动替换" }).count(),
    0,
  );
  assert.deepEqual(errors, []);
  console.log(
    "PASS: production bilingual reports, mobile layout, original evidence API, report badge, OG image, model/compare pages and exact two-model rerun; local fixtures only",
  );
} finally {
  if (browser) await browser.close();
  next.kill("SIGTERM");
  await new Promise((resolve) => storage.close(resolve));
}
