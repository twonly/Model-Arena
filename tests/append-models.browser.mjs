// node tests/append-models.browser.mjs http://localhost:3118
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { gunzipSync } from 'node:zlib';

const base = process.argv[2] || 'http://localhost:3118';
const original = { id: 'original', at: 1700000000000, title: 'Append check', notes: 'Keep me',
  prompt: 'EXACT original prompt', params: { systemPrompt: 'Original system', temperature: '0.2', maxTokens: '99' },
  results: ['A', 'B'].map(name => ({ name, model: name, provider: 'https://example.test/v1', status: 'done',
    text: `Original ${name}`, reasoning: `Reason ${name}`, rank: name === 'A' ? 1 : 2,
    metrics: { official: true, promptTokens: 12, outputTokens: 20, contentTps: 10 }, samples: [{ t: 100, tps: 10 }] })) };
const fixture = new URL('../app/[lang]/append-check-fixture/', import.meta.url);
await mkdir(fixture);
await writeFile(new URL('page.tsx', fixture), `import { ShareView } from '@/components/ShareView';\nexport default function Page() { return <ShareView shareId="appendcheck" snapshot={${JSON.stringify({ ...original, v: 1, watermark: '', thinkingStats: true })}} />; }`);
const browser = await chromium.launch();
await mkdir('output/playwright', { recursive: true });
try {
  for (const fromShare of [false, true]) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const calls = [];
    let shared;
    await page.addInitScript(original => {
      if (!localStorage.getItem('append-test-initialized')) {
        localStorage.setItem('append-test-initialized', '1');
        localStorage.setItem('ma.history', JSON.stringify([original]));
        localStorage.setItem('ma.endpoints', JSON.stringify(['A', 'B', 'C', 'D'].map(model => ({ id: model, name: model, model, kind: 'openai', baseUrl: 'https://example.test/v1', apiKey: 'test-key', enabled: true }))));
        localStorage.setItem('ma.graduatedShared', '1');
        localStorage.setItem('ma.params', JSON.stringify({ systemPrompt: 'WRONG', temperature: '1', maxTokens: '1' }));
      }
    }, original);
    await page.route('**/api/chat/session', route => route.fulfill({ json: { default: 'vercel', match: [] } }));
    await page.route('**/api/chat', async route => {
      const body = route.request().postDataJSON(); calls.push(body);
      const events = body.model === 'D' && calls.filter(c => c.model === 'D').length === 1
        ? [{ type: 'error', message: 'Test failure', error: 'Test failure' }]
        : [{ type: 'delta', text: `New ${body.model}`, ts: 100 }, { type: 'usage', promptTokens: 14, outputTokens: 22 }, { type: 'done' }];
      await route.fulfill({ contentType: 'text/event-stream', body: events.map(e => `data: ${JSON.stringify(e)}\n\n`).join('') });
    });
    await page.route('**/api/share', async route => {
      const body = route.request().postDataJSON();
      shared = body.snapshot ?? JSON.parse(gunzipSync(Buffer.from(body.gz, 'base64')).toString());
      await route.fulfill({ json: { ok: true, id: 'newshare01' } });
    });
    await page.goto(`${base}/zh-CN/${fromShare ? 'append-check-fixture' : 'arena'}`);
    if (!fromShare) {
      await page.getByRole('button', { name: /🕘 历史/ }).click();
      await page.getByRole('button', { name: '恢复查看' }).click();
    }
    await page.getByRole('button', { name: /追加模型对比/ }).click();
    const dialog = page.getByRole('dialog', { name: '追加模型对比' });
    await dialog.waitFor();
    assert.equal(calls.length, 0);
    assert.equal(await dialog.getByRole('checkbox', { checked: true }).count(), 0);
    await dialog.getByRole('checkbox', { name: 'C', exact: true }).check();
    await dialog.getByRole('checkbox', { name: 'D', exact: true }).check();
    for (const width of [390, 320]) {
      await page.setViewportSize({ width, height: 850 });
      assert.ok(await dialog.evaluate(el => el.scrollWidth <= el.clientWidth), 'dialog has no horizontal overflow');
    }
    await page.screenshot({ path: `output/playwright/append-${fromShare ? 'share' : 'history'}-mobile.png` });
    await dialog.getByRole('button', { name: '运行所选 2 个模型' }).click();
    await page.waitForFunction(() => JSON.parse(localStorage.getItem('ma.history'))[0].results.length === 4);
    assert.deepEqual(calls.map(c => c.model).sort(), ['C', 'D']);
    for (const body of calls) {
      assert.equal(body.prompt, original.prompt);
      assert.equal(body.systemPrompt, original.params.systemPrompt);
      assert.equal(body.temperature, original.params.temperature);
      assert.equal(body.maxTokens, original.params.maxTokens);
    }
    let history = await page.evaluate(() => JSON.parse(localStorage.getItem('ma.history')));
    assert.deepEqual(history.at(-1), original, 'original archive unchanged');
    for (let i = 0; i < 2; i++) {
      const { origin, ...old } = history[0].results[i];
      assert.deepEqual(old, original.results[i], 'old result preserved exactly');
      assert.equal(origin.kind, fromShare ? 'share' : 'history');
    }
    await page.setViewportSize({ width: 1280, height: 900 });
    const cards = page.locator('#model-outputs > *');
    assert.equal(await cards.count(), 4);
    assert.equal(await cards.nth(0).getByRole('button', { name: /重跑/ }).count(), 1);
    await cards.nth(3).getByRole('button', { name: /重跑/ }).click();
    await page.waitForFunction(() => JSON.parse(localStorage.getItem('ma.history'))[0].results[3].status === 'done');
    assert.deepEqual(calls.map(c => c.model).sort(), ['C', 'D', 'D']);
    await page.reload();
    await page.locator('#model-outputs').getByText('Original A', { exact: true }).waitFor();
    assert.equal(calls.length, 3, 'refresh does not POST completed models');
    await page.getByRole('button', { name: /分享链接/ }).first().click();
    await page.getByRole('button', { name: /生成链接/ }).click();
    await page.locator('input[value*="newshare01"]').waitFor();
    assert.equal(shared.results.length, 4);
    assert.equal(shared.prompt, original.prompt);
    assert.deepEqual(shared.params, original.params);
    assert.equal(shared.results[0].origin.kind, fromShare ? 'share' : 'history');
    assert.ok(!JSON.stringify(shared).includes('test-key'));
    await page.getByRole('button', { name: /追加模型对比/ }).click();
    await dialog.getByRole('checkbox', { name: /A · 新增一次测试/ }).check();
    await dialog.getByRole('button', { name: '运行所选 1 个模型' }).click();
    await page.waitForFunction(() => JSON.parse(localStorage.getItem('ma.history'))[0].results.length === 5);
    assert.deepEqual(calls.map(c => c.model).sort(), ['A', 'C', 'D', 'D']);
    await page.screenshot({ path: `output/playwright/append-${fromShare ? 'share' : 'history'}-results.png`, fullPage: true });
    console.log(`PASS ${fromShare ? 'share' : 'history'}: only selected requests, preserved results/parameters, failure retry, refresh, sharing, repeat sample, mobile`);
    await page.close();
  }
  const edge = await browser.newPage();
  const edgeCalls = [];
  await edge.addInitScript(original => {
    localStorage.setItem('ma.endpoints', JSON.stringify([{ id: 'C', name: 'C', model: 'C', kind: 'openai', baseUrl: 'https://example.test/v1', apiKey: 'test', enabled: true }]));
    localStorage.setItem('ma.graduatedShared', '1');
    if (!sessionStorage.getItem('edge-seeded')) {
      sessionStorage.setItem('edge-seeded', '1');
      sessionStorage.setItem('ma.arena.seed', JSON.stringify({ mode: 'share-append', prompt: original.prompt, retained: { ...original, params: undefined, hasImage: true } }));
    }
  }, original);
  await edge.route('**/api/chat/session', route => route.fulfill({ json: { default: 'vercel', match: [] } }));
  await edge.route('**/api/chat', route => {
    edgeCalls.push(route.request().postDataJSON());
    return route.fulfill({ contentType: 'text/event-stream', body: 'data: {"type":"delta","text":"Image result","ts":100}\n\ndata: {"type":"done"}\n\n' });
  });
  await edge.goto(`${base}/zh-CN/arena`);
  const edgeDialog = edge.getByRole('dialog', { name: '追加模型对比' });
  await edgeDialog.getByRole('checkbox', { name: 'C', exact: true }).check();
  const runButton = edgeDialog.getByRole('button', { name: '运行所选 1 个模型' });
  assert.equal(await runButton.isEnabled(), false, 'missing params and original image block running');
  await edgeDialog.getByRole('checkbox', { name: /原公共参数缺失/ }).check();
  assert.equal(await runButton.isEnabled(), false, 'original image still required');
  await edgeDialog.locator('input[type=file]').setInputFiles({ name: 'original.png', mimeType: 'image/png', buffer: Buffer.from(await edge.evaluate(() => document.createElement('canvas').toDataURL().split(',')[1]), 'base64') });
  await edgeDialog.getByText('图片已就绪').waitFor();
  await runButton.click();
  await edge.waitForFunction(() => JSON.parse(localStorage.getItem('ma.history') || '[]')[0]?.results.length === 3);
  assert.equal(edgeCalls.length, 1);
  assert.ok(edgeCalls[0].imageDataUrl.startsWith('data:image/'));
  assert.equal(edgeCalls[0].prompt, original.prompt);
  console.log('PASS missing-parameter confirmation and required original image');
  await edge.close();
} finally { await browser.close(); await rm(fixture, { recursive: true }); }
