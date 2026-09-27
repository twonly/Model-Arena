// Start the app, then run: node tests/race-track.browser.mjs [base URL] [share ID]
import assert from "node:assert/strict";
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const base = process.argv[2] || "http://localhost:3100";
const shareId = process.argv[3] || "2npoQ0zdTo";
const browser = await chromium.launch();
await mkdir("output/playwright", { recursive: true });
async function assertAligned(page) {
  const metrics = await page.locator("[data-runner-id]").evaluateAll((rows) => rows.flatMap((row) =>
    ["speed", "tokens", "ttft"].map((axis) => {
      const bar = row.querySelector(`[data-race-axis="${axis}"] > div`).getBoundingClientRect();
      const value = row.querySelector(`[data-race-value="${axis}"]`).getBoundingClientRect();
      const guide = row.querySelector(`[data-race-value="${axis}"] > [aria-hidden]`).getBoundingClientRect();
      return { axis, delta: Math.abs(bar.y + bar.height / 2 - value.y - value.height / 2),
        guideDelta: Math.abs(bar.y + bar.height / 2 - guide.y - guide.height / 2), guideWidth: guide.width };
    })));
  for (const metric of metrics) {
    assert.ok(metric.delta <= 1, `${metric.axis} value must align with its bar: ${metric.delta}px`);
    assert.ok(metric.guideDelta <= 1 && metric.guideWidth >= 8, `${metric.axis} guide must connect on the same centerline`);
  }
}

try {
  const page = await browser.newPage();
  for (const [locale, width] of (process.argv.includes("--skip-share") ? [] : [["zh-CN", 1280], ["en", 390], ["zh-CN", 320]])) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`${base}/${locale}/r/${shareId}`);
    await page.locator("[data-runner-id]").first().waitFor();
    const cardSpeeds = await page.getByText(locale === "en" ? "Output TPS" : "输出TPS", { exact: true })
      .evaluateAll((els) => els.map((el) => el.parentElement.firstElementChild.textContent));
    const rows = await page.locator("[data-runner-id]").evaluateAll((els) => els.map((el) => ({
      index: Number(el.dataset.runnerId.slice(2)),
      speed: el.lastElementChild.firstElementChild.textContent.replace("⚡", "").replace("token/s", "").trim(),
      bar: parseFloat(el.querySelector('[data-race-axis="speed"] > div > div').style.width),
    })));
    assert.ok(rows.length >= 2);
    rows.forEach((row, i) => {
      assert.equal(row.speed, cardSpeeds[row.index], "race and model card must show the same Output TPS");
      if (i) assert.ok(rows[i - 1].bar >= row.bar, "faster models must rank first with longer bars");
    });
    await assertAligned(page);
    for (const axis of ["speed", "tokens", "ttft"]) {
      const bar = page.locator(`[data-race-axis="${axis}"]`).first();
      await bar.hover();
      const tip = bar.getByRole("tooltip");
      assert.ok(await tip.isVisible(), `${axis} tooltip must appear on hover`);
      assert.match(await tip.innerText(), axis === "speed" ? /\d+ token\/s/ : axis === "tokens" ? /\d+ token/ : /\d+(\.\d+)?s/);
      await page.mouse.move(0, 0);
      await bar.focus();
      assert.ok(await tip.isVisible(), `${axis} tooltip must also work with keyboard focus`);
      await bar.evaluate((el) => el.blur());
    }
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "no horizontal overflow");
    await page.locator('[data-race-axis="speed"]').first().hover();
    await page.locator("[data-runner-id]").first().locator("../..").screenshot({ path: `output/playwright/race-${locale}.png` });
    console.log(`PASS: ${locale}, ${width}px — share/card consistency, speed ranking, all tooltips, keyboard focus, layout`);
  }

  // High speed, low fractional speed, and missing final speed in restored history.
  await page.addInitScript(() => {
    localStorage.setItem("ma.history", JSON.stringify([{
      id: "race-regression", at: Date.now(), title: "Race regression", prompt: "Test", notes: "",
      results: [
        { name: "Verbose slow", model: "slow", status: "done", text: "ok", reasoning: "", metrics: { official: true, outputTokens: 9000, contentTps: 4.6, ttftMs: 800 } },
        { name: "Brief fast", model: "fast", status: "done", text: "ok", reasoning: "", metrics: { official: true, outputTokens: 600, contentTps: 800, ttftMs: 400 } },
        { name: "No output speed", model: "missing", status: "stopped", text: "", reasoning: "thinking", elapsedMs: 6000, metrics: { official: false, outputTokens: 100, reasoningTokens: 100 } },
      ],
    }]));
  });
  await page.goto(`${base}/zh-CN/arena`);
  await page.getByRole("button", { name: /历史/ }).click();
  await page.getByRole("button", { name: "恢复查看", exact: true }).click();
  const restored = page.locator("[data-runner-id]");
  await restored.first().waitFor();
  assert.match(await restored.nth(0).innerText(), /Brief fast/);
  assert.match(await restored.nth(1).innerText(), /4\.6 token\/s/);
  assert.match(await restored.nth(2).locator('[data-race-axis="speed"]').getAttribute("aria-label"), /— token\/s/);
  assert.match(await restored.nth(2).locator('[data-race-axis="ttft"]').getAttribute("aria-label"), /6\.00s/);
  assert.equal(await restored.nth(0).locator('[data-race-axis="speed"] > div > div').first().evaluate((el) => el.style.width), "100%");
  assert.equal(await restored.nth(1).locator('[data-race-axis="speed"] > div > div').first().evaluate((el) => parseFloat(el.style.width)), 4.6 / 800 * 100);
  for (const width of [1280, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await assertAligned(page);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "restored layout fits viewport");
    await restored.first().locator("../..").screenshot({ path: `output/playwright/race-alignment-${width}.png` });
  }
  console.log("PASS: restored history — speed beats token volume, expanded scale, fractional/missing speed, stopped wait");

  const live = await browser.newPage();
  await live.addInitScript(() => {
    localStorage.setItem("ma.endpoints", JSON.stringify(["a", "b"].map((id) => ({
      id, name: `Test ${id}`, model: `test-${id}`, kind: "openai", baseUrl: "https://example.test/v1", apiKey: "test-only", enabled: true,
    }))));
    localStorage.setItem("ma.graduatedShared", "1");
    const originalFetch = window.fetch;
    const streams = [];
    window.emitRaceEvent = (event) => streams.forEach((stream) => stream.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(event)}\n\n`)));
    window.fetch = async (input, init) => {
      if (input === "/api/chat/session") return Response.json({ default: "vercel", match: [] });
      if (input === "/api/chat") return new Response(new ReadableStream({ start(controller) { streams.push(controller); } }), { headers: { "Content-Type": "text/event-stream" } });
      if (typeof input === "string" && input.startsWith("/api/") && init?.method === "POST") return new Response(null, { status: 204 });
      return originalFetch(input, init);
    };
    window.raceStreamsReady = () => streams.length === 2;
  });
  await live.goto(`${base}/zh-CN/arena`);
  await live.waitForFunction(() => document.querySelector('[aria-label="已选模型"]')?.textContent?.includes("Test a"));
  await live.getByRole("textbox", { name: "你的任务", exact: true }).fill("Test race speed");
  await live.getByRole("button", { name: /开始对比/ }).first().click();
  await live.waitForFunction(() => window.raceStreamsReady());
  await live.evaluate(() => window.emitRaceEvent({ type: "delta", reasoning: "Thinking ".repeat(50), ts: 100 }));
  await live.locator('[data-runner-id="a"]').waitFor();
  await live.evaluate(() => new Promise((resolve) => setTimeout(resolve, 150)));
  await live.evaluate(() => window.emitRaceEvent({ type: "delta", reasoning: "Still thinking ".repeat(50), ts: 300 }));
  await live.waitForFunction(() => /^实时思考速度（估算）: [\d,.]+ token\/s/.test(document.querySelector('[data-runner-id="a"] [data-race-axis="speed"]').getAttribute("aria-label")));
  assert.ok(await live.locator('[data-runner-id="a"] [data-race-axis="speed"] > div > div').first().evaluate((el) => parseFloat(el.style.width) > 0));
  assert.match(await live.locator('[data-runner-id="a"] [data-race-axis="tokens"]').getAttribute("aria-label"), /正文: 0 token/);
  assert.equal(await live.locator('[data-runner-id="a"] [data-race-axis="speed"] > div > div').first().evaluate((el) => el.style.background), "var(--think)");
  await assertAligned(live);
  await live.locator('[data-runner-id="a"]').locator("../..").screenshot({ path: "output/playwright/race-thinking.png" });
  await live.setViewportSize({ width: 390, height: 900 });
  assert.ok(await live.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "thinking phase fits mobile viewport");
  await assertAligned(live);
  await live.locator('[data-runner-id="a"]').locator("../..").screenshot({ path: "output/playwright/race-thinking-mobile.png" });
  await live.evaluate(() => new Promise((resolve) => setTimeout(resolve, 150)));
  await live.evaluate(() => window.emitRaceEvent({ type: "delta", text: "Output ".repeat(50), ts: 500 }));
  await live.evaluate(() => new Promise((resolve) => setTimeout(resolve, 150)));
  await live.evaluate(() => window.emitRaceEvent({ type: "delta", text: "Output ".repeat(50), ts: 700 }));
  await live.waitForFunction(() => !document.querySelector('[data-runner-id="a"] [data-race-axis="speed"]').getAttribute("aria-label").includes("—"));
  await live.waitForFunction(() => document.querySelector('[data-runner-id="a"] [data-race-axis="speed"]').getAttribute("aria-label").startsWith("实时输出速度"));
  assert.equal(await live.locator('[data-runner-id="a"] [data-race-axis="speed"] > div > div').first().evaluate((el) => el.style.background), "var(--go)");
  await live.evaluate(() => {
    window.emitRaceEvent({ type: "delta", text: "more output", ts: 1500 });
    window.emitRaceEvent({ type: "usage", outputTokens: 110, reasoningTokens: 100 });
    window.emitRaceEvent({ type: "done" });
  });
  await live.waitForFunction(() => document.querySelector('[data-runner-id="a"] [data-race-axis="speed"]').getAttribute("aria-label").includes("输出速度（正文阶段）: 10 token/s"));
  console.log("PASS: mocked live stream — thinking speed shown, no phantom content tokens, output phase switches, final usage calibration");

} finally {
  await browser.close();
}
