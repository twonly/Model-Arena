// node tests/custom-pricing.browser.mjs http://localhost:3118
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const browser = await chromium.launch();
try {
 const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
 await page.addInitScript(() => {
  if (!localStorage.getItem('custom-price-seeded')) {
   localStorage.setItem('custom-price-seeded', '1');
   localStorage.setItem('ma.endpoints', JSON.stringify([{id:'price-test',name:'Price test',model:'unknown',kind:'openai',baseUrl:'https://example.test/v1',apiKey:'test',enabled:true}]));
   localStorage.setItem('ma.graduatedShared','1');
  }
  const original = window.fetch.bind(window);
  window.fetch = (url, init) => {
   if (url === '/api/chat/session') return Promise.resolve(Response.json({default:'vercel',match:[]}));
   if (url === '/api/chat') {
    window.lastPriceRequest = JSON.parse(init.body);
    return Promise.resolve(new Response([
     {type:'delta',text:'done',ts:100},
     {type:'usage',promptTokens:1000,outputTokens:500,reasoningTokens:100},
     {type:'done'},
    ].map(e => `data: ${JSON.stringify(e)}\n\n`).join(''), {headers:{'Content-Type':'text/event-stream'}}));
   }
   return original(url,init);
  };
 });
 await page.goto(`${process.argv[2] || 'http://localhost:3118'}/zh-CN/arena`);
 await page.getByRole('button',{name:'接入与配置',exact:true}).click();
 await page.getByRole('button',{name:'编辑',exact:true}).first().click();
 await page.getByRole('checkbox',{name:'自定义单价（美元 / 百万 Token）',exact:true}).check();
 const save = page.getByRole('button',{name:'保存并返回',exact:true});
 assert.equal(await save.isDisabled(),true);
 await page.getByRole('spinbutton',{name:'输入单价',exact:true}).fill('2');
 await page.getByRole('spinbutton',{name:'输出单价',exact:true}).fill('6');
 await save.click();
 await page.reload();
 await page.getByRole('textbox',{name:'你的任务',exact:true}).fill('Price test');
 await page.getByRole('button',{name:/开始对比/}).first().click();
 await page.getByRole('cell').filter({hasText:'≈$0.005000'}).waitFor();
 assert.equal(await page.evaluate(() => 'customPricing' in window.lastPriceRequest),false);
 await page.waitForFunction(() => JSON.parse(localStorage.getItem('ma.history') || '[]').length > 0);
 assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem('ma.history'))[0].results[0].customPricing),{input:2,output:6});
 await page.reload();
 await page.getByRole('button',{name:/🕘 历史/}).click();
 await page.getByRole('button',{name:'恢复查看',exact:true}).first().click();
 await page.getByRole('cell').filter({hasText:'≈$0.005000'}).waitFor();
 console.log('PASS: validate/save/reload custom prices, calculate from usage, preserve history, never send prices upstream');
} finally { await browser.close(); }
