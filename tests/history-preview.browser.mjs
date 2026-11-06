// node tests/history-preview.browser.mjs http://localhost:3118
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { encryptJson, decryptJson } from '../lib/crypto.ts';

const base = process.argv[2] || 'http://localhost:3118';
const html = '<!doctype html><html><body><div id="result"></div><script>/*' + 'x'.repeat(100000) + '*/document.getElementById("result").textContent="History preview works";</script></body></html>';
const browser = await chromium.launch();
try {
  for (const reasoningOnly of [false, true]) {
    const page = await browser.newPage();
    await page.addInitScript(({ html, reasoningOnly }) => {
      localStorage.setItem('ma.endpoints', JSON.stringify([{ id: 'history-test', name: 'History test', model: 'test', kind: 'openai', baseUrl: 'https://example.test/v1', apiKey: 'test', enabled: true }]));
      localStorage.setItem('ma.graduatedShared', '1');
      const original = window.fetch.bind(window);
      window.fetch = (input, init) => {
        if (input === '/api/chat/session') return Promise.resolve(Response.json({ default: 'vercel', match: [] }));
        if (input === '/api/chat') return Promise.resolve(new Response([
          { type: 'delta', [reasoningOnly ? 'reasoning' : 'text']: html, ts: 100 },
          { type: 'usage', outputTokens: 25000 }, { type: 'done' },
        ].map(e => `data: ${JSON.stringify(e)}\n\n`).join(''), { headers: { 'Content-Type': 'text/event-stream' } }));
        return original(input, init);
      };
    }, { html, reasoningOnly });
    await page.goto(`${base}/zh-CN/arena`);
    await page.getByRole('textbox', { name: '你的任务', exact: true }).fill('Generate a long HTML page');
    await page.waitForFunction(() => document.querySelector('[aria-label="已选模型"]')?.textContent?.includes('History test'));
    await page.getByRole('button', { name: /开始对比/ }).first().click();
    await page.waitForFunction(() => JSON.parse(localStorage.getItem('ma.history') || '[]').length > 0);
    const history = await page.evaluate(() => JSON.parse(localStorage.getItem('ma.history')));
    assert.equal(history[0].results[0][reasoningOnly ? 'reasoning' : 'text'], html);
    // Same encryption round trip as cloud sync, restored into a fresh device context.
    const restored = await decryptJson(await encryptJson({ 'ma.history': history }, 'test-password'), 'test-password');
    const device = await browser.newPage();
    await device.goto(`${base}/zh-CN/arena`);
    await device.waitForFunction(() => localStorage.getItem("ma.sharedPoolVersion"));
    await device.addInitScript(data => { for (const [key, value] of Object.entries(data)) localStorage.setItem(key, JSON.stringify(value)); }, restored);
    await device.reload();
    await device.getByRole('button', { name: /🕘 历史/ }).click();
    await device.getByRole('button', { name: '恢复查看' }).first().click();
    await device.frameLocator('iframe').first().getByText('History preview works', { exact: true }).waitFor();
    if (!reasoningOnly) {
      await page.evaluate(() => {
        const original = Storage.prototype.setItem;
        Storage.prototype.setItem = function(key, value) {
          if (key === 'ma.history') throw new DOMException('Full', 'QuotaExceededError');
          return original.call(this, key, value);
        };
      });
      await page.getByRole('button', { name: /开始对比/ }).first().click();
      await page.getByRole('alert').filter({ hasText: '历史记录保存失败' }).waitFor();
      assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem('ma.history'))), history);
      console.log('PASS storage failure is visible and previous history remains intact');
    }
    await device.close();
    await page.close();
    console.log(`PASS full history → encrypted backup → fresh browser → working HTML (${reasoningOnly ? 'reasoning' : 'text'})`);
  }
} finally { await browser.close(); }
