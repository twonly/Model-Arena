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
const draftId = "weekly-2026-09-21-aaaaaaaaaaaaaaaa";
const snapshot = {...report, id: draftId, version: "aaaaaaaaaaaaaaaa", publishedAt: "", stage: "standard"};
const draft = {id: draftId, campaign: report.campaign, revision: 1, snapshot,
  summary: reportSummary(snapshot), editorial: null, writer: null, updated_at: new Date().toISOString(), published_revision: 0, published_report_id: null};
const reports = [{id:report.id, index_data:reportSummary(report), snapshot:report, is_current:true}];
const adminId = "00000000-0000-0000-0000-000000000001";
const adminToken = [Buffer.from('{"alg":"HS256","typ":"JWT"}').toString('base64url'), Buffer.from(JSON.stringify({sub:adminId,exp:Math.floor(Date.now()/1000)+3600})).toString('base64url'), "fixture"].join('.');
const schedulerToken = "local-scheduler-token-long-enough-for-test";
const storage = createServer(async (req, res) => {
  const url = new URL(req.url, "http://127.0.0.1");
  res.setHeader("Content-Type", "application/json");
  const reply = (data) => res.end(JSON.stringify(data));
  if (url.pathname === "/auth/v1/user") return reply({id: req.headers.authorization === `Bearer ${adminToken}` ? adminId : "00000000-0000-0000-0000-000000000002"});
  if (url.pathname === "/rest/v1/benchmark_reports") {
    assert.equal(req.method,"GET");
    return reply(reports.filter(r => (!url.searchParams.has('id') || url.searchParams.get('id') === `eq.${r.id}`) && (!url.searchParams.has('is_current') || r.is_current)));
  }
  if (url.pathname === "/rest/v1/benchmark_drafts") {
    if (req.method === "PATCH") {
      let raw="";for await (const chunk of req) raw+=chunk;
      const match = url.searchParams.get('revision') === `eq.${draft.revision}` && (!url.searchParams.has('editorial') || draft.editorial == null);
      if(match) Object.assign(draft,JSON.parse(raw));
      return reply(match?[draft]:[]);
    }
    return reply(!url.searchParams.has('id') || url.searchParams.get('id') === `eq.${draftId}` ? [draft] : []);
  }
  if (url.pathname === "/rest/v1/benchmark_catalog") return reply(models.map(m=>({provider:m.provider,models:models.filter(n=>n.provider===m.provider).map(n=>n.model),checked_at:new Date().toISOString()})));
  if (url.pathname === "/rest/v1/rpc/publish_benchmark_draft") {
    let raw="";for await (const chunk of req) raw+=chunk;
    const body=JSON.parse(raw);assert.equal(body.p_reviewer,adminId);assert.equal(body.p_revision,draft.revision);
    const id=`${draft.id}-r${draft.revision}`, publishedAt=new Date().toISOString();
    reports.forEach(r=>{r.is_current=false;});
    const next={...snapshot,id,editorial:draft.editorial,publishedAt,reviewedAt:publishedAt};
    reports.push({id,snapshot:next,index_data:reportSummary(next),is_current:true});
    draft.published_report_id=id;draft.published_revision=draft.revision;
    return reply({state:"published",id});
  }
  return reply([]);
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
      ADMIN_USER_IDS: adminId,
      BENCHMARK_SECRET: schedulerToken,
      INDEXNOW_KEY: "",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "local-test-anon",
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
  // Actual Next routes + authenticated browser editing against private local storage.
  const api = (token, body) => page.request.post(`${base}/api/benchmarks`, {headers:{Authorization:`Bearer ${token}`},data:body});
  assert.equal((await page.request.get(`${base}/api/benchmarks?draft=${draftId}`)).status(),401);
  assert.equal((await page.request.get(`${base}/api/benchmarks?draft=${draftId}`,{headers:{Authorization:"Bearer ordinary-viewer"}})).status(),401);
  assert.equal((await api(schedulerToken,{action:"publish",id:draftId,revision:1})).status(),403);
  assert.equal((await page.request.get(`${base}/api/reports/${draftId}`)).status(),404);
  assert.equal((await page.request.get(`${base}/api/badge/report/${draftId}`)).status(),404);
  assert.ok(!(await (await page.request.get(`${base}/sitemap.xml`)).text()).includes(draftId));
  const editorial = {"zh-CN":{title:"私有首测评测稿",summary:"根据实测记录生成，等待确认。",body:"## 测试结论\n\n这组测试覆盖 15 道题，原始证据保留。"},en:{title:"Private review draft",summary:"Measured results awaiting confirmation.",body:"## Findings\n\nThis test covers 15 cases. Original evidence is retained."}};
  const generated=await api(schedulerToken,{action:"save_editorial",id:draftId,revision:1,editorial});
  assert.equal(generated.status(),200);
  assert.equal((await api(schedulerToken,{action:"save_editorial",id:draftId,revision:2,editorial})).status(),409);
  await page.addInitScript(({token,id})=>{
    localStorage.setItem("sb-auth-auth-token",JSON.stringify({access_token:token,refresh_token:"local-fixture",expires_at:Math.floor(Date.now()/1000)+3600,expires_in:3600,token_type:"bearer",user:{id,aud:"authenticated",email:"operator@example.test"}}));
  },{token:adminToken,id:adminId});
  await page.goto(`${base}/zh-CN/operations`);
  await page.getByRole('button',{name:/私有首测评测稿/}).click();
  await page.getByLabel('标题 / SEO 标题',{exact:true}).fill('运营者确认的实测报告');
  await page.getByRole('button',{name:'保存草稿',exact:true}).click();
  await page.getByRole('status').filter({hasText:'草稿已保存'}).waitFor();
  assert.equal((await api(adminToken,{action:"publish",id:draftId,revision:2})).status(),409);
  assert.equal((await page.request.get(`${base}/api/reports/${draftId}-r3`)).status(),404);
  await page.getByText('检查测试题与原始回答',{exact:true}).click();
  await page.getByText('联系信息抽取 1',{exact:true}).waitFor();
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.screenshot({path:'output/playwright/editorial-mobile.png',fullPage:true});
  await page.setViewportSize({width:1440,height:1050});
  await page.screenshot({path:'output/playwright/editorial-desktop.png',fullPage:true});
  await page.getByRole('button',{name:'确认并发布',exact:true}).click();
  await page.getByRole('status').filter({hasText:'已发布到线上'}).waitFor();
  assert.equal(reports.length,2);
  assert.equal((await api(adminToken,{action:"publish",id:draftId,revision:3})).status(),200);
  assert.equal(reports.length,2,'publication retry must not duplicate evidence');
  await page.goto(`${base}/zh-CN/reports/${draftId}-r3`);
  assert.equal(await page.locator('h1').innerText(),'运营者确认的实测报告');
  assert.ok((await page.title()).includes('运营者确认的实测报告'));
  assert.equal((await (await page.request.get(`${base}/api/reports/${draftId}-r3`)).json()).attempts.length,60);
  assert.ok((await (await page.request.get(`${base}/sitemap.xml`)).text()).includes(`${draftId}-r3`));
  assert.deepEqual(errors, []);
  console.log(
    "PASS: private drafts, scheduler cannot publish, authenticated bilingual editor, conflict protection, explicit approval, public SEO/evidence, mobile layout and exact reruns; local fixtures only",
  );
} finally {
  if (browser) await browser.close();
  next.kill("SIGTERM");
  await new Promise((resolve) => storage.close(resolve));
}
