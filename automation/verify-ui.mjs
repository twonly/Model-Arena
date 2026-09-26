// Requires a local Next server. Model requests are intercepted; this test never calls a paid API.
import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdir, readFile } from "node:fs/promises";
import { BENCHMARK_CASES, BENCHMARK_PARAMS } from "../lib/benchmark-suite.ts";
const base = process.env.TEST_BASE_URL || "http://127.0.0.1:3100";
if (!["127.0.0.1", "localhost"].includes(new URL(base).hostname))
  throw new Error("Use a local test server");
await mkdir(new URL("../output/playwright/", import.meta.url), {
  recursive: true,
});
const browser = await chromium.launch({ headless: true });
const errors = [],
  requests = [];
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
});
await context.route("**/api/chat/session", (r) =>
  r.fulfill({
    json: {
      ok: true,
      defaultTransport: "vercel",
      cloudflareRules: [],
      transport: "vercel",
    },
  }),
);
await context.route("**/api/shared/quota?*", (r) =>
  r.fulfill({
    json: {
      ok: true,
      available: true,
      remaining: 100,
      limit: 100,
      loggedIn: false,
      bonusRemaining: 0,
    },
  }),
);
await context.route("**/api/telemetry", (r) =>
  r.fulfill({ json: { ok: true } }),
);
await context.route("**/api/share", (r) =>
  r.fulfill({ json: { ok: true, id: "local-ui-check" } }),
);
let retry = false;
await context.route("**/api/chat", async (route) => {
  const body = route.request().postDataJSON();
  requests.push(body);
  const partial = body.sharedId === "glm-5-3-flash" && !retry;
  const failed = body.sharedId === "orcarouter-hy3-free" && !retry;
  const c = BENCHMARK_CASES.find((c) => c.prompt === body.prompt),
    answer = c
      ? typeof c.expected === "string"
        ? c.expected
        : JSON.stringify(c.expected)
      : "Completed answer";
  const events = failed
    ? [{ type: "error", message: "HTTP 429：请求过于频繁，请稍后重试" }]
    : [
        { type: "delta", text: answer.slice(0, 5), ts: 50 },
        { type: "delta", text: answer.slice(5), ts: 500 },
        { type: "usage", promptTokens: 100, outputTokens: 100 },
        { type: "done", finishReason: partial ? "length" : "stop" },
      ];
  await route.fulfill({
    contentType: "text/event-stream",
    body: events.map((e) => `data: ${JSON.stringify(e)}\n\n`).join(""),
  });
});
const page = await context.newPage();
page.on("pageerror", (e) => errors.push(e.message));
try {
  let response = await page.goto(`${base}/zh-CN/arena?sample=1`);
  assert.equal(response.status(), 200);
  await page.waitForFunction(
    () =>
      document.querySelectorAll('[aria-label="已选模型"] input:checked')
        .length === 3,
  );
  assert.equal(
    await page.locator('[aria-label="已选模型"] input:checked').count(),
    3,
  );
  await page.getByLabel("标准测试案例").selectOption("extract-1");
  assert.equal(
    await page.getByLabel("你的任务").inputValue(),
    BENCHMARK_CASES[0].prompt,
  );
  assert.equal(
    await page.locator('[aria-label="报告标题"]').isVisible(),
    false,
  );
  await page.screenshot({ path: "output/playwright/arena-mobile.png" });
  await page
    .getByRole("button", { name: "开始对比 ▶", exact: true })
    .first()
    .click();
  await page.getByRole("region", { name: "结果摘要" }).waitFor();
  await page.waitForFunction(
    () => JSON.parse(localStorage.getItem("ma.history") || "[]").length === 1,
  );
  const summary = await page
    .getByRole("region", { name: "结果摘要" })
    .innerText();
  assert.match(summary, /通过/);
  assert.match(summary, /已截断/);
  assert.match(summary, /请求失败/);
  assert.doesNotMatch(summary, /综合最优/);
  assert.equal(requests.length, 3);
  assert.equal(requests[0].maxTokens, "2048");
  assert.equal(requests[0].temperature, "0");
  // Result tools stay visible without opening display settings or a second menu.
  const tools = page.getByRole("group", { name: "结果工具" });
  for (const name of [
    "截图模式",
    "导出长图",
    "复制指标表",
    "分享链接",
    "生成评测稿",
  ])
    assert.equal(
      await tools.getByRole("button", { name: new RegExp(name) }).isVisible(),
      true,
    );
  assert.equal(
    await page
      .getByRole("button", { name: "🕘 历史", exact: true })
      .isVisible(),
    true,
  );
  const waitForOpenOutputs = (count) =>
    page.waitForFunction(
      (count) =>
        document.querySelectorAll("#model-outputs > details[open]").length ===
        count,
      count,
    );
  await tools
    .getByRole("button", { name: "展开全部输出", exact: true })
    .click();
  await waitForOpenOutputs(3);
  // Native keyboard toggling still works after a global action.
  const firstOutput = page
    .locator("#model-outputs > details > summary")
    .first();
  await firstOutput.focus();
  await firstOutput.press("Space");
  await waitForOpenOutputs(2);
  await tools
    .getByRole("button", { name: "折叠全部输出", exact: true })
    .click();
  await waitForOpenOutputs(0);
  await tools
    .getByRole("button", { name: "标题 / 水印 / 显示设置", exact: true })
    .click();
  await page.getByLabel("报告标题").fill("截图回归验证");
  await page.getByLabel("报告备注").fill("三个模型、完整输出与失败记录");
  await page.getByRole("button", { name: /紧凑：关/ }).click();
  await tools
    .getByRole("button", { name: "展开全部输出", exact: true })
    .click();
  await waitForOpenOutputs(3);
  assert.equal(
    await page.getByRole("button", { name: /紧凑：关/ }).isVisible(),
    true,
  );
  await page.locator("#display-settings > summary").click();
  await tools
    .getByRole("button", { name: "折叠全部输出", exact: true })
    .click();
  await firstOutput.click();
  await waitForOpenOutputs(1);
  await tools.getByRole("button", { name: /截图模式/ }).click();
  await waitForOpenOutputs(3);
  assert.equal(await tools.isVisible(), false);
  assert.equal(await page.getByLabel("报告标题").inputValue(), "截图回归验证");
  assert.ok(
    await page.evaluate(
      () =>
        document
          .querySelector('[aria-label="报告标题"]')
          .getBoundingClientRect().top <
        document.querySelector("#model-outputs").getBoundingClientRect().top,
    ),
  );
  await page.screenshot({
    path: "output/playwright/screenshot-mode-mobile.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "退出截图模式", exact: true }).click();
  await waitForOpenOutputs(1);
  const imageDownload = page.waitForEvent("download", { timeout: 60000 });
  await tools.getByRole("button", { name: /导出长图/ }).click();
  const png = await imageDownload;
  await png.saveAs("output/playwright/exported-comparison.png");
  const pngBytes = await readFile(await png.path());
  assert.equal(pngBytes.subarray(1, 4).toString(), "PNG");
  assert.ok(
    pngBytes.readUInt32BE(16) >= 1920,
    "mobile export preserves all summary columns",
  );
  assert.ok(
    pngBytes.readUInt32BE(20) > 1000,
    "export includes expanded outputs",
  );
  await waitForOpenOutputs(1);
  assert.equal(
    requests.length,
    3,
    "display and export actions never rerun models",
  );
  await tools.getByRole("button", { name: /分享链接/ }).click();
  await page.getByRole("button", { name: "生成链接", exact: true }).click();
  await page.getByText("只读链接已生成", { exact: false }).waitFor();
  assert.equal(
    await page
      .getByRole("button", { name: "复制 Badge", exact: true })
      .isVisible(),
    true,
  );
  assert.equal(
    await page.getByLabel("报告标题").isVisible(),
    false,
    "share feedback does not require opening settings",
  );
  await tools
    .getByRole("button", { name: "折叠全部输出", exact: true })
    .click();
  await waitForOpenOutputs(0);
  await tools.scrollIntoViewIfNeeded();
  await page.screenshot({ path: "output/playwright/result-tools-mobile.png" });
  await page
    .locator("summary")
    .filter({ hasText: "Tencent HY3 Free · 查看输出" })
    .click();
  retry = true;
  await page.getByRole("button", { name: /重跑/ }).last().click();
  await page.waitForFunction(() => {
    const h = JSON.parse(localStorage.getItem("ma.history") || "[]");
    return h.length >= 2;
  });
  await page
    .getByRole("region", { name: "结果摘要" })
    .getByText("通过", { exact: true })
    .nth(1)
    .waitFor();
  assert.equal(requests.length, 4, "single retry must preserve other results");
  assert.match(
    await page.getByRole("region", { name: "结果摘要" }).innerText(),
    /已截断/,
  );
  await page.screenshot({
    path: "output/playwright/results-mobile.png",
    fullPage: true,
  });
  // A modified prompt has no inherited quality claim.
  await page.getByLabel("你的任务").fill("changed prompt");
  assert.match(
    await page.locator("main").innerText(),
    /下方结果属于上一次任务/,
  );
  await page
    .getByRole("button", { name: "开始对比 ▶", exact: true })
    .first()
    .click();
  await page
    .getByRole("region", { name: "结果摘要" })
    .getByText("尚未评估", { exact: true })
    .first()
    .waitFor();
  // Custom batch output exports the exact recorded prompts and safely escapes CSV formulas.
  await page.getByLabel("你的任务").fill("=1+1");
  await page
    .locator("summary")
    .filter({ hasText: "本地测试集与批量运行" })
    .click();
  await page.getByRole("button", { name: "保存当前任务", exact: true }).click();
  await page.getByLabel("选择测试集").selectOption("custom");
  await page.getByRole("button", { name: "批量运行", exact: true }).click();
  await page.getByRole("status").filter({ hasText: "已记录 3" }).waitFor();
  const downloaded = page.waitForEvent("download");
  await page.getByRole("button", { name: "导出 CSV", exact: true }).click();
  const csv = await readFile(await (await downloaded).path(), "utf8");
  assert.match(csv, /'=1\+1/);
  assert.equal(csv.split("\r\n").length, 4);
  assert.equal(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("ma.testSuite")).length,
    ),
    1,
  );
  await page.getByRole("button", { name: "🕘 历史", exact: true }).click();
  await page
    .getByRole("button", { name: "恢复查看", exact: true })
    .first()
    .click();
  await tools
    .getByRole("button", { name: "展开全部输出", exact: true })
    .click();
  await waitForOpenOutputs(3);
  await tools
    .getByRole("button", { name: "折叠全部输出", exact: true })
    .click();
  await waitForOpenOutputs(0);
  await tools.getByRole("button", { name: /退出历史快照/ }).click();
  // Exact report seed carries parameters and preserves the local model configuration.
  const saved = await page.evaluate(() => localStorage.getItem("ma.endpoints"));
  await page.evaluate(
    ({ c, params }) =>
      sessionStorage.setItem(
        "ma.arena.seed",
        JSON.stringify({
          mode: "report",
          prompt: c.prompt,
          task: { caseId: c.id, version: c.version },
          params,
          reportId: "test-report",
          reportVersion: "v1",
          endpointRefs: [
            {
              model: "not-connected-model",
              provider: "https://missing.example/v1",
              name: "Missing model",
            },
          ],
        }),
      ),
    { c: BENCHMARK_CASES[0], params: BENCHMARK_PARAMS },
  );
  await page.reload();
  await page.getByRole("alert").filter({ hasText: "未自动替换" }).waitFor();
  assert.equal(
    await page
      .getByRole("button", { name: "开始对比 ▶", exact: true })
      .first()
      .isDisabled(),
    true,
  );
  assert.equal(
    await page.evaluate(() => localStorage.getItem("ma.endpoints")),
    saved,
  );
  // Direct reload with the browser clock on a different day must not mismatch static HTML.
  await page.addInitScript(() => {
    const ActualDate = Date;
    class NextDay extends ActualDate {
      constructor(...args) {
        super(...(args.length ? args : [ActualDate.now() + 86400000]));
      }
      static now() {
        return ActualDate.now() + 86400000;
      }
    }
    globalThis.Date = NextDay;
  });
  await page.goto(`${base}/zh-CN/arena?sample=1`);
  await page.getByLabel("你的任务").waitFor();
  response = await page.goto(`${base}/zh-CN`);
  assert.equal(response.status(), 200);
  await page
    .getByRole("heading", { name: "用你的任务，选出更合适的大模型" })
    .waitFor();
  const moreTools = page.getByRole("navigation", { name: "更多工具" });
  for (const path of [
    "templates",
    "stats",
    "best/cheapest",
    "board",
    "gallery",
    "providers/orcarouter",
    "invite",
  ])
    assert.equal(
      await moreTools.locator(`a[href="/zh-CN/${path}"]`).count(),
      1,
    );
  await page.screenshot({ path: "output/playwright/home-mobile.png" });
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    "no horizontal page overflow",
  );
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({
    path: "output/playwright/home-desktop.png",
    fullPage: true,
  });
  response = await page.goto(`${base}/zh-CN/model/deepseek-v4-1-flash`);
  assert.equal(response.status(), 200);
  assert.match(await page.locator("main").innerText(), /超过本站有效期/);
  response = await page.goto(`${base}/zh-CN/best/cheapest`);
  assert.equal(response.status(), 200);
  const links = await page
    .locator('main a[href*="/model/"]')
    .evaluateAll((a) => a.map((x) => x.href));
  assert.equal(links.length, 0, "pricing rows use valid price destinations");
  assert.equal(
    (
      await page.request.post(`${base}/api/benchmarks`, {
        data: { action: "run" },
      })
    ).status(),
    401,
  );
  assert.deepEqual(errors, []);
  console.log(
    "PASS: mobile comparison, output toggles, screenshot restoration, PNG export, history, truncation, one-model retry, exact rerun, unchanged saved settings, cross-day hydration, homepage, expiry, links and protected API; no paid requests",
  );
} finally {
  await browser.close();
}
