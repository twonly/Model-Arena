// node tests/result-layout.browser.mjs [base URL] [existing share ID]
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdir, writeFile, rm } from 'node:fs/promises';

const base = process.argv[2] || 'http://localhost:3124';
const fixtureDir = new URL('../app/[lang]/result-layout-check-fixture/', import.meta.url);
await mkdir(fixtureDir);
await writeFile(new URL('page.tsx', fixtureDir), `
import { ShareView } from '@/components/ShareView';
export default function Page() {
  return <ShareView shareId="layout-check" snapshot={{
    v: 1, title: 'Layout check', prompt: 'Test', notes: '', watermark: '', thinkingStats: true,
    results: Array.from({ length: 6 }, (_, i) => ({ name: 'Model ' + (i + 1), model: 'test-' + i,
      status: 'done' as const, text: 'Result for screenshot', reasoning: '', metrics: null, samples: [],
    })),
  }} />;
}
`);
const browser = await chromium.launch();
await mkdir('output/playwright', { recursive: true });
try {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.addInitScript(() => {
    localStorage.setItem('ma.history', JSON.stringify([{
      id: 'layout-check', at: Date.now(), title: 'Layout check', prompt: 'Test', notes: '',
      results: Array.from({ length: 6 }, (_, i) => ({
        name: `Model ${i + 1}`, model: `test-${i}`, status: 'done', text: 'Result for screenshot', reasoning: '',
        metrics: { official: true, outputTokens: 100, contentTps: 20, ttftMs: 100, totalMs: 5000 },
      })),
    }]));
  });
  for (const path of ['/zh-CN/arena', process.argv[3] ? `/zh-CN/r/${process.argv[3]}` : '/zh-CN/result-layout-check-fixture']) {
    await page.goto(base + path);
    if (path.endsWith('arena')) {
      await page.getByRole('button', { name: /历史/ }).click();
      await page.getByRole('button', { name: '恢复查看', exact: true }).click();
      const answers = page.locator('#model-outputs').getByText('Result for screenshot', { exact: true });
      await answers.first().waitFor();
      assert.equal(await answers.count(), 6, 'history answers are visible without expanding');
      assert.equal(await page.locator('#model-outputs > details').count(), 0);
      assert.equal(await page.locator('#model-outputs').getByText('Model 1', { exact: true }).count(), 1);
      await page.getByRole('button', { name: '仅指标', exact: true }).click();
      assert.equal(await answers.count(), 0, 'metrics mode hides answers');
      assert.equal(await page.getByRole('button', { name: '仅指标', exact: true }).getAttribute('aria-pressed'), 'true');
      await page.getByRole('button', { name: '答案与指标', exact: true }).click();
      await answers.first().waitFor();
    }
    const select = page.getByRole('combobox', { name: '每行模型数' });
    await select.waitFor();
    const count = await page.locator('#model-outputs > *').count();
    const columns = () => page.locator('#model-outputs').evaluate(el => getComputedStyle(el).gridTemplateColumns.split(' ').length);
    for (const value of ['2', '3', '4', '5', '6']) {
      await select.selectOption(value);
      assert.equal(await columns(), Math.min(Number(value), count));
    }
    await select.selectOption('4');
    await page.locator('#model-outputs').screenshot({ path: `output/playwright/layout-${path.endsWith('arena') ? 'arena' : 'share'}-wide.png` });
    if (path.endsWith('arena')) {
      await page.getByRole('button', { name: '📷 截图模式', exact: true }).click();
      assert.equal(await columns(), 4, 'screenshot preserves columns');
      await page.getByRole('button', { name: '退出截图模式', exact: true }).click();
    }
    for (const width of [390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      assert.equal(await columns(), 1);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `overflow at ${width}`);
    }
    await page.setViewportSize({ width: 2560, height: 1080 });
    await select.selectOption('auto');
    assert.equal(await columns(), Math.min(6, count));
    console.log(`PASS ${path}: selected columns, wide auto layout, mobile overflow`);
    await page.setViewportSize({ width: 1920, height: 1080 });
  }
  const live = await browser.newPage();
  await live.addInitScript(() => {
    localStorage.setItem('ma.endpoints', JSON.stringify([{ id: 'output-check', name: 'Output check', model: 'test', kind: 'openai', baseUrl: 'https://example.test/v1', apiKey: 'test', enabled: true }]));
    localStorage.setItem('ma.graduatedShared', '1');
    const original = window.fetch.bind(window);
    window.fetch = (input, init) => {
      if (input === '/api/chat/session') return Promise.resolve(Response.json({ default: 'vercel', match: [] }));
      if (input === '/api/chat') return Promise.resolve(new Response(new ReadableStream({ start(controller) {
        window.emitOutput = event => controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(event)}\n\n`));
      } }), { headers: { 'Content-Type': 'text/event-stream' } }));
      return original(input, init);
    };
  });
  await live.goto(base + '/zh-CN/arena');
  await live.waitForFunction(() => document.querySelector('[aria-label="已选模型"]')?.textContent?.includes('Output check'));
  await live.getByRole('textbox', { name: '你的任务', exact: true }).fill('Output visibility check');
  await live.getByRole('button', { name: /开始对比/ }).first().click();
  await live.waitForFunction(() => window.emitOutput);
  await live.evaluate(() => window.emitOutput({ type: 'delta', text: 'Visible while streaming', ts: 100 }));
  await live.locator('#model-outputs').getByText('Visible while streaming', { exact: true }).waitFor();
  assert.equal(await live.locator('#model-outputs').getByText('Output check', { exact: true }).count(), 1);
  await live.evaluate(() => { window.emitOutput({ type: 'usage', outputTokens: 4 }); window.emitOutput({ type: 'done' }); });
  await live.waitForFunction(() => JSON.parse(localStorage.getItem('ma.history') || '[]').length > 0);
  await live.reload();
  await live.locator('#model-outputs').getByText('Visible while streaming', { exact: true }).waitFor();
  await live.getByRole('button', { name: '仅指标', exact: true }).click();
  await live.waitForFunction(() => localStorage.getItem('ma.compact') === 'true');
  await live.reload();
  await live.waitForFunction(() => document.querySelector('button[aria-controls="model-outputs"][aria-pressed="true"]')?.textContent === '仅指标');
  assert.equal(await live.locator('#model-outputs').getByText('Visible while streaming', { exact: true }).count(), 0);
  console.log('PASS streaming answer visible, single title, completed reload, metrics preference persisted');
} finally { await browser.close(); await rm(fixtureDir, { recursive: true }); }
