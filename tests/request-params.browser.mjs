// npm run dev -- --port 3117; node tests/request-params.browser.mjs
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const browser = await chromium.launch();
try {
 const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
 await page.addInitScript(() => {
  if (localStorage.getItem('params-test')) return;
  localStorage.setItem('params-test', '1');
  localStorage.setItem('ma.params', JSON.stringify({maxTokens:'524288', temperature:'0.5', systemPrompt:''}));
 });
 await page.goto(`${process.argv[2] || 'http://localhost:3117'}/zh-CN/arena`);
 await page.getByText('Max Tokens = 524288', {exact:true}).waitFor();
 await page.getByRole('button', {name:'清除全局 Token / 温度覆盖', exact:true}).click();
 await page.waitForFunction(() => JSON.parse(localStorage.getItem('ma.params')).maxTokens === '');
 await page.getByRole('button', {name:'接入与配置', exact:true}).click();
 await page.getByRole('button', {name:/OpenRouter logo OpenRouter/}).click();
 const input = page.getByRole('textbox', {name:'额外请求参数 JSON', exact:true});
 assert.equal(await input.inputValue(), '');
 await input.fill('{"max_tokens":8192,"reasoning":{"exclude":true}}');
 await page.getByText('可选 thinking effort（推理强度）', {exact:true}).click();
 await page.getByRole('button', {name:'OpenRouter effort low', exact:true}).click();
 assert.deepEqual(JSON.parse(await input.inputValue()), {max_tokens:8192,reasoning:{exclude:true,effort:'low'}});
 await page.getByRole('button', {name:'恢复模型默认强度（仅移除 effort）', exact:true}).click();
 assert.deepEqual(JSON.parse(await input.inputValue()), {max_tokens:8192,reasoning:{exclude:true}});
 await page.getByRole('button', {name:'OpenAI effort high', exact:true}).click();
 assert.deepEqual(JSON.parse(await input.inputValue()), {max_tokens:8192,reasoning:{exclude:true},reasoning_effort:'high'});
 assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
 console.log('PASS: mobile global override visibility/reset, default omission, effort merge/reset');
} finally { await browser.close(); }
