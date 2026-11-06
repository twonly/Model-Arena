// node tests/preview-only.browser.mjs [base URL]
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdir, writeFile, rm } from 'node:fs/promises';

const base = process.argv[2] || 'http://localhost:3124';
const results = [
  { name: 'Web model', text: 'WEB_SOURCE\n<!doctype html><html><body><button onclick="this.textContent=\'Clicked\'">Interactive page</button><svg width="20" height="20"><circle cx="10" cy="10" r="8"/></svg></body></html>' },
  { name: 'SVG model', text: 'SVG_SOURCE\n<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100"><rect width="200" height="100" fill="teal"/></svg>' },
  { name: 'Text model', text: 'PLAIN_OUTPUT' },
  { name: 'Error model', text: '', error: 'Provider failed' },
].map((r, i) => ({ ...r, model: `preview-${i}`, status: r.error ? 'error' : 'done', reasoning: 'PRIVATE_THINKING', metrics: { outputTokens: 100, contentTps: 20, ttftMs: 100 } }));
const fixtureDir = new URL('../app/[lang]/preview-only-fixture/', import.meta.url);
await mkdir(fixtureDir);
await writeFile(new URL('page.tsx', fixtureDir), `import { ShareView } from '@/components/ShareView';
export default function Page() { return <ShareView shareId="preview-test" snapshot={${JSON.stringify({v:1,title:'Preview test',notes:'',prompt:'Test',watermark:'',thinkingStats:true,voting:{enabled:true},results})}} />; }`);
const browser = await chromium.launch();
try {
  for (const route of ['arena', 'preview-only-fixture']) {
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
    await page.addInitScript(results => localStorage.setItem('ma.history', JSON.stringify([{ id: 'preview-check', at: Date.now(), title: 'Preview check', prompt: 'Test', notes: '', results }])), results);
    await page.goto(`${base}/zh-CN/${route}`);
    if (route === 'arena') {
      await page.getByRole('button', { name: /历史/ }).click();
      await page.getByRole('button', { name: '恢复查看', exact: true }).click();
    }
    const grid = page.locator('#model-outputs');
    if (route === 'preview-only-fixture') {
      const toolbar = page.getByRole('group', { name: '结果展示选项', exact: true });
      assert.equal(await page.locator('nav').getByRole('combobox', { name: '每行模型数' }).count(), 0);
      await toolbar.getByRole('combobox', { name: '每行模型数' }).waitFor();
      assert.ok(await toolbar.evaluate(el => el.nextElementSibling?.id === 'model-outputs'));
      const before = (await grid.boundingBox()).width;
      await toolbar.getByRole('button', { name: '隐藏实时榜单' }).click();
      assert.equal(await page.locator('#share-leaderboard').isVisible(), false);
      assert.ok((await grid.boundingBox()).width > before + 200, 'hidden sidebar frees space');
      await toolbar.getByRole('button', { name: '显示实时榜单' }).click();
      assert.equal(await page.locator('#share-leaderboard').isVisible(), true);
      assert.equal(Math.round((await grid.boundingBox()).width), Math.round(before));
    }
    await page.getByRole('button', { name: '仅指标', exact: true }).click();
    await page.getByRole('button', { name: '仅看效果', exact: true }).click();
    await grid.scrollIntoViewIfNeeded();
    const frame = grid.frameLocator('iframe');
    await frame.getByRole('button', { name: 'Interactive page' }).click();
    await frame.getByRole('button', { name: 'Clicked' }).waitFor();
    assert.equal(await grid.locator('iframe').getAttribute('sandbox'), 'allow-scripts');
    assert.equal(await grid.locator('img[src^="data:image/svg"]').count(), 1, 'HTML embedded SVG is not duplicated');
    assert.ok(await grid.locator('img[src^="data:image/svg"]').evaluate(img => img.complete && img.naturalWidth > 0));
    assert.doesNotMatch(await grid.innerText(), /PRIVATE_THINKING|WEB_SOURCE|SVG_SOURCE|PLAIN_OUTPUT|思考过程|输出TPS/);
    await grid.getByText('未找到可预览的网页或 SVG，可切回「答案与指标」查看原始输出。').waitFor();
    await grid.getByText('Provider failed', { exact: true }).waitFor();
    await page.getByRole('combobox', { name: '每行模型数' }).selectOption('4');
    await mkdir('output/playwright', { recursive: true });
    await grid.screenshot({ path: `output/playwright/preview-only-${route}.png` });
    for (const width of [390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${route} overflow at ${width}`);
      if (route === 'preview-only-fixture') {
        await page.getByRole('button', { name: '隐藏实时榜单' }).click();
        assert.equal(await page.locator('#share-leaderboard').isVisible(), false);
        await page.getByRole('button', { name: '显示实时榜单' }).click();
      }
    }
    await page.getByRole('button', { name: '答案与指标', exact: true }).click();
    await grid.getByText('PLAIN_OUTPUT', { exact: true }).waitFor();
    assert.ok(await grid.getByRole('button', { name: /思考过程/ }).count() > 0);
    console.log(`PASS ${route}: interactive HTML, safe SVG, hidden source/reasoning/metrics, fallback/errors, restore, mobile`);
    await page.close();
  }
} finally { await browser.close(); await rm(fixtureDir, { recursive: true }); }
