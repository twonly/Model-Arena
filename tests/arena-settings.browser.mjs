// Start the app, then run: node tests/arena-settings.browser.mjs [base URL]
import assert from "node:assert/strict";
import { chromium } from "playwright";

const base = process.argv[2] || "http://localhost:3100";
const browser = await chromium.launch();
try {
  for (const mode of [null, "sample", "share-full", "share-prompt", "report"]) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    await context.addInitScript(({ mode }) => {
      if (localStorage.getItem("settings-test-seeded")) return;
      localStorage.setItem("settings-test-seeded", "1");
      localStorage.setItem("ma.endpoints", JSON.stringify([{
        id: "own", name: "Saved model", kind: "openai",
        model: "saved-model", baseUrl: "https://example.test/v1",
        apiKey: "test-only", enabled: false,
      }]));
      localStorage.setItem("ma.graduatedShared", "1");
      if (mode && mode !== "sample") {
        sessionStorage.setItem("ma.arena.seed", JSON.stringify({
          mode, prompt: "Keep this task", params: { temperature: "0.3" },
          endpointRefs: [{ model: "missing-model", provider: "https://missing.test/v1" }],
        }));
      }
    }, { mode });
    const page = await context.newPage();
    await page.goto(`${base}/zh-CN/arena${mode === "sample" ? "?sample=1" : ""}`);
    await page.waitForFunction(() => localStorage.getItem("ma.sharedPoolVersion"));
    const prompt = page.getByRole("textbox", { name: "你的任务", exact: true });
    await prompt.fill("Keep this task");
    await page.getByRole("button", { name: "接入与配置", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "模型接入管理" });
    await dialog.getByRole("checkbox", { name: "Saved model", exact: true }).check();
    // Closing without the Done button must also apply the saved selection.
    await dialog.getByTitle("关闭（Esc）").click();
    const selected = page.getByLabel("已选模型", { exact: true });
    await selected.getByRole("checkbox", { name: /Saved model/ }).waitFor();
    assert.equal(await prompt.inputValue(), "Keep this task");
    assert.equal(await page.getByText(/复测前请接入这些原始模型/).count(), 0);
    await page.getByRole("button", { name: "接入与配置", exact: true }).click();
    await dialog.getByRole("checkbox", { name: "Saved model", exact: true }).uncheck();
    await dialog.getByRole("button", { name: "完成，返回对比", exact: true }).click();
    assert.equal(await selected.getByRole("checkbox", { name: /Saved model/ }).count(), 0);

    await page.getByRole("button", { name: "接入与配置", exact: true }).click();
    await dialog.getByRole("button", { name: /^DeepSeek/ }).click();
    await dialog.getByRole("textbox", { name: "显示名称", exact: true }).fill("New model");
    const save = dialog.getByRole("button", { name: "保存并返回", exact: true });
    const box = await save.boundingBox();
    assert.ok(box && box.x >= 0 && box.x + box.width <= 390 && box.y + box.height <= 844);
    await save.click();
    await selected.getByRole("checkbox", { name: /New model/ }).waitFor();
    assert.equal(await prompt.inputValue(), "Keep this task");
    await page.waitForFunction(() => JSON.parse(localStorage.getItem("ma.endpoints"))
      .some((ep) => ep.name === "New model" && ep.enabled));
    await page.reload();
    await selected.getByRole("checkbox", { name: /New model/ }).waitFor();
    assert.equal(await selected.getByRole("checkbox", { name: /Saved model/ }).count(), 0);
    console.log(`PASS: ${mode || "normal"} — selection, save, prompt retention, mobile button, reload`);
    await context.close();
  }
} finally {
  await browser.close();
}
